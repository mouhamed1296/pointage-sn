#pragma once

// ===================== Configuration de la borne =====================
// À adapter à votre installation. Pour la production, préférez stocker les
// secrets dans la NVS / un fichier de provisioning plutôt qu'en dur.

// --- Réseau WiFi ---
#define WIFI_SSID       "VOTRE_WIFI"
#define WIFI_PASSWORD   "VOTRE_MOT_DE_PASSE"

// --- API backend ---
// Ex: "http://192.168.1.10:3001/api" (ou https://… en production)
#define API_BASE_URL    "http://192.168.1.10:3001/api"

// Identifiants de la borne (créés dans l'interface web > Bornes).
#define DEVICE_ID       "REMPLACER_PAR_UUID_DE_LA_BORNE"
#define DEVICE_KEY      "REMPLACER_PAR_LA_CLE_API"
#define FIRMWARE_VERSION "1.0.0"

// Sens du pointage : "" = automatique (entrée/sortie déduite côté serveur),
// "IN" pour une borne d'entrée, "OUT" pour une borne de sortie.
#define DEFAULT_DIRECTION ""

// --- Temps (NTP) ---
#define NTP_SERVER      "pool.ntp.org"
#define GMT_OFFSET_SEC  0       // Sénégal = GMT+0
#define DST_OFFSET_SEC  0

// --- Intervalles ---
#define HEARTBEAT_INTERVAL_MS 30000UL   // signal de vie
#define WDT_TIMEOUT_S         30        // watchdog matériel

// ===================== Brochage (GPIO ESP32) =====================
// ⚠️ Certains GPIO (0, 2, 12, 15) sont des "strapping pins" : respectez les
// niveaux au démarrage. Le brochage ci-dessous est un exemple fonctionnel.

// Lecteur RFID RC522 (bus SPI matériel : SCK=18, MISO=19, MOSI=23)
#define RC522_SS_PIN    5
#define RC522_RST_PIN   4

// Capteur d'empreinte AS608 / R307 (UART2)
#define FP_RX_PIN       16   // RX de l'ESP32  <- TX du capteur
#define FP_TX_PIN       17   // TX de l'ESP32  -> RX du capteur

// Écran OLED SSD1306 (I2C)
#define OLED_SDA_PIN    21
#define OLED_SCL_PIN    22
#define OLED_ADDR       0x3C

// Clavier matriciel 4x4
#define KP_ROW_PINS     {13, 14, 27, 26}
#define KP_COL_PINS     {25, 33, 32, 2}

// Retour utilisateur
#define BUZZER_PIN      15
#define LED_STATUS_PIN  12   // allumée = prêt, clignote = traitement
