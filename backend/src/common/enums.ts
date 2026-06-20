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

/** Méthode utilisée pour réaliser le pointage. */
export enum PointageMethod {
  FACE = 'FACE', // Reconnaissance faciale (biométrie)
  MANUAL = 'MANUAL', // Saisie / sélection manuelle
}
