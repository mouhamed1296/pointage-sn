# Nomenclature (BOM) — Borne de pointage

Deux variantes de borne. Les références fournisseur sont des **exemples**
courants (adapter selon disponibilité locale au Sénégal / distributeurs).

## Borne multi-méthodes (ESP32 + capteurs)

| Désignation | Réf. | Qté | Valeur / Spécification | Boîtier / Notes |
|-------------|------|-----|------------------------|-----------------|
| Carte microcontrôleur | U1 | 1 | ESP32 DevKit v1 (WROOM-32, WiFi/BT) | 38 broches |
| Lecteur RFID/NFC | U2 | 1 | RC522 (MFRC522, 13,56 MHz) | Module SPI |
| Badges/tags RFID | — | 10 | MIFARE Classic 1K (13,56 MHz) | Carte ou porte-clé |
| Capteur d'empreinte | U3 | 1 | AS608 ou R307 (UART, optique) | 3,3 V logique |
| Écran | U4 | 1 | OLED SSD1306 0,96" 128×64 | I²C (0x3C) |
| Clavier | SW1 | 1 | Clavier membrane matriciel 4×4 | 8 fils |
| Buzzer | BZ1 | 1 | Buzzer actif 3,3–5 V | Ø12 mm |
| LED de statut | D1 | 1 | LED 5 mm (verte) | — |
| Résistance LED | R1 | 1 | 220 Ω, 1/4 W | Through-hole |
| Alimentation | PS1 | 1 | 5 V / 2 A (USB) | Micro-USB / USB-C |
| Câblage | — | 1 | Fils Dupont M-M / M-F + breadboard ou PCB | — |
| Boîtier (option) | — | 1 | Coffret ABS + façade découpée | Selon montage |

## Borne FaceID (ESP32-CAM)

| Désignation | Réf. | Qté | Valeur / Spécification | Boîtier / Notes |
|-------------|------|-----|------------------------|-----------------|
| Caméra + MCU | U10 | 1 | ESP32-CAM AI-Thinker (OV2640) | PSRAM 4 Mo |
| Programmateur | — | 1 | FTDI USB-TTL (FT232) **ou** carte ESP32-CAM-MB | Pour le flash |
| Détecteur de présence | U11 | 1 (option) | PIR HC-SR501 | Déclenche la capture |
| Alimentation | PS2 | 1 | 5 V / 2 A dédiée | **Pics de courant caméra** |
| Antenne (option) | — | 1 | Antenne externe IPEX | Si portée WiFi faible |

> 💡 Le FaceID peut aussi se faire **sans ESP32-CAM**, via une caméra IP
> (MJPEG/HLS) existante ou la webcam du poste — voir la page *Caméras* de l'app.

## Estimation indicative (HT, par borne)
- Borne capteurs : ESP32 (~3 000–5 000 FCFA) + RC522 (~1 500) + AS608
  (~12 000–20 000) + OLED (~2 000) + clavier (~1 500) + divers ≈ **25 000–35 000 FCFA**.
- Borne ESP32-CAM : ESP32-CAM (~4 000–6 000) + FTDI (~2 000) + PIR (~1 000) ≈ **8 000–12 000 FCFA**.

Voir aussi `BOM.csv` (importable dans un tableur / outil de BOM) et le schéma
électronique `schematic-esp32.svg` + le netlist `pointage-esp32.net`.
