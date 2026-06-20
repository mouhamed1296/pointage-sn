import type {
  AttendanceDirection,
  AttendanceStatus,
  ModuleType,
} from '../types';

export const MODULE_TYPE_LABEL: Record<ModuleType, string> = {
  EMPLOYEE: 'Employés',
  STUDENT: 'Étudiants',
  EVENT: 'Événement',
};

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  ON_TIME: "À l'heure",
  LATE: 'En retard',
  EARLY_LEAVE: 'Départ anticipé',
  PRESENT: 'Présent',
};

export const STATUS_COLOR: Record<AttendanceStatus, string> = {
  ON_TIME: '#16a34a',
  LATE: '#dc2626',
  EARLY_LEAVE: '#d97706',
  PRESENT: '#2563eb',
};

export const DIRECTION_LABEL: Record<AttendanceDirection, string> = {
  IN: 'Entrée',
  OUT: 'Sortie',
};

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
