export type ModuleType = 'EMPLOYEE' | 'STUDENT' | 'EVENT';
export type UserRole = 'ADMIN' | 'OPERATOR';
export type AttendanceDirection = 'IN' | 'OUT';
export type AttendanceStatus =
  | 'ON_TIME'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'PRESENT';
export type PointageMethod = 'FACE' | 'MANUAL';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ModuleConfig {
  startTime?: string;
  endTime?: string;
  lateAfterMinutes?: number;
  requireCheckout?: boolean;
  faceMatchThreshold?: number;
}

export interface TrackingModule {
  id: string;
  name: string;
  type: ModuleType;
  description: string | null;
  config: ModuleConfig | null;
  active: boolean;
  createdAt: string;
}

export interface Person {
  id: string;
  fullName: string;
  externalId?: string;
  email?: string;
  faceDescriptor: number[] | null;
  active: boolean;
  moduleId: string;
  createdAt: string;
}

export interface AttendanceEvent {
  id: string;
  personId: string;
  personName: string;
  externalId?: string;
  moduleId: string;
  moduleName: string;
  moduleType: ModuleType;
  direction: AttendanceDirection;
  status: AttendanceStatus;
  method: PointageMethod;
  confidence: number;
  timestamp: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  checkIns: number;
  checkOuts: number;
}
