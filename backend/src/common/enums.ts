/**
 * Type de module de pointage — le système est polyvalent et peut être
 * configuré pour différents contextes d'usage.
 */
export enum ModuleType {
  EMPLOYEE = 'EMPLOYEE', // Présence des salariés en entreprise
  STUDENT = 'STUDENT', // Présence scolaire / universitaire
  EVENT = 'EVENT', // Enregistrement de participants à un événement
}

/** Rôle d'un utilisateur (opérateur) du back-office. */
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
}

/** Sens du pointage. */
export enum AttendanceDirection {
  IN = 'IN', // Entrée / arrivée
  OUT = 'OUT', // Sortie / départ
}

/** Statut calculé d'un pointage selon la configuration du module. */
export enum AttendanceStatus {
  ON_TIME = 'ON_TIME',
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  PRESENT = 'PRESENT', // Pour les événements (pas de notion de retard)
}

/** Protocole de diffusion d'une caméra IP, lisible dans le navigateur. */
export enum CameraStreamType {
  MJPEG = 'MJPEG', // Flux Motion-JPEG (ex. ESP32-CAM) — lu via <img>
  HLS = 'HLS', // Flux HLS (.m3u8) — lu via hls.js
  WEBRTC = 'WEBRTC', // WebRTC (nécessite une passerelle dédiée)
}

/** Méthode utilisée pour réaliser le pointage. */
export enum PointageMethod {
  FACE = 'FACE', // Reconnaissance faciale (biométrie, borne web)
  BADGE = 'BADGE', // Badge RFID / NFC (lecteur RC522 sur ESP32)
  FINGERPRINT = 'FINGERPRINT', // Empreinte digitale (capteur AS608 sur ESP32)
  CODE = 'CODE', // Code PIN (clavier 4x4 sur ESP32 ou saisie web)
  MANUAL = 'MANUAL', // Sélection manuelle par un opérateur
}
