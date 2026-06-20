#pragma once

// ============ Configuration borne FaceID ESP32-CAM ============

// --- Réseau WiFi ---
#define WIFI_SSID       "VOTRE_WIFI"
#define WIFI_PASSWORD   "VOTRE_MOT_DE_PASSE"

// --- API backend ---
#define API_BASE_URL    "http://192.168.1.10:3001/api"
#define DEVICE_ID       "REMPLACER_PAR_UUID_DE_LA_BORNE"
#define DEVICE_KEY      "REMPLACER_PAR_LA_CLE_API"
#define FIRMWARE_VERSION "cam-1.0.0"

// --- Captures ---
#define CAPTURE_INTERVAL_MS 2500UL   // période d'analyse
#define COOLDOWN_AFTER_OK_MS 5000UL  // pause après un pointage réussi
#define HEARTBEAT_INTERVAL_MS 30000UL
#define WDT_TIMEOUT_S 30

// Détecteur de présence optionnel (PIR) : -1 pour désactiver (mode périodique).
#define PIR_PIN -1

// Carte AI-Thinker (la plus répandue). Brochage caméra ci-dessous.
#define CAMERA_MODEL_AI_THINKER
