/*
 * Borne FaceID ESP32-CAM — Pointage SN
 * Capture des images JPEG et les envoie au backend, qui réalise la
 * reconnaissance faciale côté serveur (POST /attendance/face-frame).
 * Pensée pour le 24h/24 : reconnexion WiFi, heartbeat, watchdog.
 *
 * Pour le HTTPS, remplacer HTTPClient par WiFiClientSecure + certificat.
 */
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"
#include "esp_task_wdt.h"
#include "config.h"

// ---- Brochage caméra AI-Thinker ----
#if defined(CAMERA_MODEL_AI_THINKER)
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22
#define LED_FLASH_GPIO 4
#endif

unsigned long lastCapture = 0;
unsigned long lastHeartbeat = 0;
unsigned long cooldownUntil = 0;

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA; // 640x480 : bon compromis
    config.jpeg_quality = 12;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Échec init caméra : 0x%x\n", err);
    return false;
  }
  return true;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    esp_task_wdt_reset();
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("WiFi OK : %s\n", WiFi.localIP().toString().c_str());
  }
}

// Envoie une trame JPEG au backend pour reconnaissance serveur.
void sendFrame() {
  if (WiFi.status() != WL_CONNECTED) return;

  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Capture échouée");
    return;
  }

  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/attendance/face-frame");
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.setTimeout(10000);

  int code = http.POST(fb->buf, fb->len);
  String resp = http.getString();
  http.end();
  esp_camera_fb_return(fb);

  if (code >= 200 && code < 300) {
    Serial.printf("Pointage OK : %s\n", resp.c_str());
    digitalWrite(LED_FLASH_GPIO, HIGH);
    delay(120);
    digitalWrite(LED_FLASH_GPIO, LOW);
    cooldownUntil = millis() + COOLDOWN_AFTER_OK_MS;
  } else if (code == 404) {
    Serial.println("Aucun visage reconnu");
  } else if (code == 503) {
    Serial.println("Reconnaissance serveur indisponible");
  } else {
    Serial.printf("Erreur HTTP %d\n", code);
  }
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/devices/heartbeat");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.POST(String("{\"firmwareVersion\":\"") + FIRMWARE_VERSION + "\"}");
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_FLASH_GPIO, OUTPUT);
  digitalWrite(LED_FLASH_GPIO, LOW);
#if PIR_PIN >= 0
  pinMode(PIR_PIN, INPUT);
#endif

#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  esp_task_wdt_config_t wdt_cfg = {
      .timeout_ms = WDT_TIMEOUT_S * 1000,
      .idle_core_mask = 0,
      .trigger_panic = true};
  esp_task_wdt_init(&wdt_cfg);
#else
  esp_task_wdt_init(WDT_TIMEOUT_S, true);
#endif
  esp_task_wdt_add(NULL);

  if (!initCamera()) {
    Serial.println("Caméra KO — redémarrage dans 5s");
    delay(5000);
    ESP.restart();
  }
  connectWiFi();
  Serial.println("Borne FaceID prête");
}

void loop() {
  esp_task_wdt_reset();

  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = millis();
    sendHeartbeat();
  }

  bool triggered = millis() - lastCapture > CAPTURE_INTERVAL_MS;
#if PIR_PIN >= 0
  triggered = triggered && digitalRead(PIR_PIN) == HIGH;
#endif

  if (triggered && millis() > cooldownUntil) {
    lastCapture = millis();
    sendFrame();
  }

  delay(50);
}
