/*
 * Borne de pointage ESP32 — Pointage SN
 * Méthodes : badge RFID (RC522), empreinte (AS608), code PIN (clavier 4x4).
 * Conçue pour un fonctionnement 24h/24 : reconnexion WiFi, resynchro NTP,
 * file d'attente hors-ligne persistante (LittleFS), heartbeat et watchdog.
 */
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <Wire.h>
#include <LittleFS.h>
#include <time.h>
#include "esp_task_wdt.h"

#include <MFRC522.h>
#include <Adafruit_Fingerprint.h>
#include <Keypad.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

#include "config.h"

// ---------------- Périphériques ----------------
MFRC522 rfid(RC522_SS_PIN, RC522_RST_PIN);
HardwareSerial fpSerial(2);
Adafruit_Fingerprint finger(&fpSerial);
Adafruit_SSD1306 oled(128, 64, &Wire, -1);

const byte ROWS = 4, COLS = 4;
char keys[ROWS][COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}};
byte rowPins[ROWS] = KP_ROW_PINS;
byte colPins[COLS] = KP_COL_PINS;
Keypad keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// ---------------- État ----------------
const char *QUEUE_FILE = "/queue.jsonl";
unsigned long lastHeartbeat = 0;
String pinBuffer = "";
bool fingerPresent = false;

// ---------------- Affichage / retour ----------------
void showMessage(const String &line1, const String &line2 = "",
                 const String &line3 = "") {
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.println(line1);
  oled.setCursor(0, 24);
  oled.println(line2);
  oled.setCursor(0, 44);
  oled.println(line3);
  oled.display();
}

void beep(int times = 1, int ms = 80) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(ms);
    digitalWrite(BUZZER_PIN, LOW);
    delay(ms);
  }
}

void feedback(bool ok, const String &name = "") {
  if (ok) {
    showMessage("Pointage OK", name);
    beep(1, 120);
  } else {
    showMessage("Non reconnu", name);
    beep(3, 60);
  }
}

// ---------------- Réseau ----------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  showMessage("Connexion WiFi...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    esp_task_wdt_reset();
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("WiFi OK : %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("WiFi indisponible (mode hors-ligne)");
  }
}

void syncTime() {
  configTime(GMT_OFFSET_SEC, DST_OFFSET_SEC, NTP_SERVER);
}

// HTTP POST authentifié. Renvoie le code HTTP (<=0 si échec réseau).
int httpPost(const String &path, const String &body, String &response) {
  if (WiFi.status() != WL_CONNECTED) return -1;
  HTTPClient http;
  http.begin(String(API_BASE_URL) + path);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.setTimeout(8000);
  int code = http.POST(body);
  response = http.getString();
  http.end();
  return code;
}

// ---------------- File d'attente hors-ligne ----------------
void queueAppend(const String &body) {
  File f = LittleFS.open(QUEUE_FILE, FILE_APPEND);
  if (f) {
    f.println(body);
    f.close();
    Serial.println("Pointage mis en file (hors-ligne)");
  }
}

// Tente de renvoyer les pointages en attente ; conserve ceux qui échouent.
void flushQueue() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!LittleFS.exists(QUEUE_FILE)) return;

  File f = LittleFS.open(QUEUE_FILE, FILE_READ);
  if (!f) return;
  String remaining = "";
  bool anyFailure = false;
  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.isEmpty()) continue;
    if (anyFailure) {
      remaining += line + "\n";
      continue;
    }
    String resp;
    int code = httpPost("/attendance/device", line, resp);
    // 2xx = accepté, 404 = personne inconnue (inutile de réessayer).
    if (code >= 200 && code < 300) {
      // ok, on jette
    } else if (code == 404) {
      // pointage non résolu : on l'abandonne aussi
    } else {
      anyFailure = true;
      remaining += line + "\n";
    }
    esp_task_wdt_reset();
  }
  f.close();

  if (remaining.isEmpty()) {
    LittleFS.remove(QUEUE_FILE);
  } else {
    File w = LittleFS.open(QUEUE_FILE, FILE_WRITE);
    if (w) {
      w.print(remaining);
      w.close();
    }
  }
}

// Construit le corps JSON puis envoie (ou met en file si hors-ligne / erreur).
void sendAttendance(const String &method, const String &identifier,
                    int fingerprintId) {
  JsonDocument doc;
  doc["method"] = method;
  if (identifier.length()) doc["identifier"] = identifier;
  if (fingerprintId >= 0) doc["fingerprintId"] = fingerprintId;
  if (String(DEFAULT_DIRECTION).length()) doc["direction"] = DEFAULT_DIRECTION;
  String body;
  serializeJson(doc, body);

  showMessage("Traitement...", method);
  String resp;
  int code = httpPost("/attendance/device", body, resp);

  if (code >= 200 && code < 300) {
    JsonDocument r;
    deserializeJson(r, resp);
    const char *name = r["attendance"]["personName"] | "";
    feedback(true, name);
  } else if (code == 404) {
    feedback(false);
  } else {
    // Hors-ligne ou erreur serveur : on conserve pour renvoi ultérieur.
    queueAppend(body);
    showMessage("Hors-ligne", "Pointage en file");
    beep(2, 80);
  }
  delay(1200);
}

void sendHeartbeat() {
  JsonDocument doc;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  String body;
  serializeJson(doc, body);
  String resp;
  httpPost("/devices/heartbeat", body, resp);
}

// ---------------- Capteurs ----------------
void handleBadge() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  Serial.printf("Badge : %s\n", uid.c_str());
  sendAttendance("BADGE", uid, -1);
}

void handleFingerprint() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return;
  if (finger.image2Tz() != FINGERPRINT_OK) return;
  if (finger.fingerSearch() != FINGERPRINT_OK) {
    feedback(false);
    delay(800);
    return;
  }
  Serial.printf("Empreinte ID : %d (confiance %d)\n", finger.fingerID,
                finger.confidence);
  sendAttendance("FINGERPRINT", "", finger.fingerID);
}

// Enrôlement d'une empreinte sur le capteur (à lier ensuite côté web).
void enrollFingerprint(int id) {
  showMessage("Enrolement", "Posez le doigt", "ID=" + String(id));
  while (finger.getImage() != FINGERPRINT_OK) {
    esp_task_wdt_reset();
    delay(50);
  }
  if (finger.image2Tz(1) != FINGERPRINT_OK) { feedback(false); return; }
  showMessage("Enrolement", "Retirez le doigt");
  delay(2000);
  while (finger.getImage() != FINGERPRINT_NOFINGER) delay(50);
  showMessage("Enrolement", "Re-posez le doigt", "ID=" + String(id));
  while (finger.getImage() != FINGERPRINT_OK) {
    esp_task_wdt_reset();
    delay(50);
  }
  if (finger.image2Tz(2) != FINGERPRINT_OK) { feedback(false); return; }
  if (finger.createModel() != FINGERPRINT_OK) { feedback(false); return; }
  if (finger.storeModel(id) == FINGERPRINT_OK) {
    showMessage("Empreinte enregistree", "ID=" + String(id),
                "A lier dans l'app");
    beep(1, 150);
  } else {
    feedback(false);
  }
  delay(1500);
}

void handleKeypad() {
  char k = keypad.getKey();
  if (!k) return;

  if (k >= '0' && k <= '9') {
    pinBuffer += k;
    String mask = "";
    for (size_t i = 0; i < pinBuffer.length(); i++) mask += "*";
    showMessage("Code PIN :", mask);
  } else if (k == '#') {           // valider
    if (pinBuffer.length() >= 4) {
      String code = pinBuffer;
      pinBuffer = "";
      sendAttendance("CODE", code, -1);
    } else {
      showMessage("Code trop court");
      beep(2, 60);
    }
  } else if (k == '*') {           // effacer
    pinBuffer = "";
    showMessage("Code efface");
  } else if (k == 'A') {           // mode enrôlement empreinte
    // Saisir l'ID (1-127) puis '#'
    showMessage("Enrolement", "Saisir ID + #");
    String idStr = "";
    unsigned long t = millis();
    while (millis() - t < 15000) {
      char c = keypad.getKey();
      if (c >= '0' && c <= '9') { idStr += c; showMessage("ID empreinte:", idStr); }
      else if (c == '#') break;
      esp_task_wdt_reset();
      delay(10);
    }
    int id = idStr.toInt();
    if (id >= 1 && id <= 127) enrollFingerprint(id);
  }
}

// ---------------- Setup / Loop ----------------
void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_STATUS_PIN, OUTPUT);
  digitalWrite(LED_STATUS_PIN, LOW);

  // Watchdog matériel (compatible cores ESP32 v2 et v3).
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

  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("OLED introuvable");
  }
  showMessage("Demarrage...");

  if (!LittleFS.begin(true)) Serial.println("LittleFS KO");

  SPI.begin();
  rfid.PCD_Init();

  fpSerial.begin(57600, SERIAL_8N1, FP_RX_PIN, FP_TX_PIN);
  finger.begin(57600);
  if (finger.verifyPassword()) {
    Serial.println("Capteur d'empreinte OK");
  } else {
    Serial.println("Capteur d'empreinte absent");
  }

  connectWiFi();
  syncTime();
  digitalWrite(LED_STATUS_PIN, HIGH);
  showMessage("Pret", "Badge / Empreinte", "ou Code PIN");
}

void loop() {
  esp_task_wdt_reset();

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = millis();
    sendHeartbeat();
    flushQueue();
  }

  handleBadge();
  handleFingerprint();
  handleKeypad();

  delay(20);
}
