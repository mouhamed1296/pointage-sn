export type ModuleType = 'EMPLOYEE' | 'STUDENT' | 'EVENT';
export type UserRole = 'ADMIN' | 'OPERATOR';
export type AttendanceDirection = 'IN' | 'OUT';
export type AttendanceStatus =
  | 'ON_TIME'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'PRESENT';
export type PointageMethod =
  | 'FACE'
  | 'BADGE'
  | 'FINGERPRINT'
  | 'CODE'
  | 'MANUAL';
export type CameraStreamType = 'MJPEG' | 'HLS' | 'WEBRTC';

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
  requireLiveness?: boolean;
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
  badgeId?: string;
  fingerprintId?: number | null;
  active: boolean;
  moduleId: string;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  location?: string;
  moduleId: string;
  methods: PointageMethod[] | null;
  lastSeenAt: string | null;
  firmwareVersion?: string;
  active: boolean;
  online: boolean;
  createdAt: string;
}

export interface DeviceStatus {
  id: string;
  name: string;
  location?: string;
  moduleId: string;
  online: boolean;
  lastSeenAt: string | null;
}

export interface DeviceAlert {
  deviceId: string;
  name: string;
  online: boolean;
  message: string;
  at: string;
}

export interface Camera {
  id: string;
  name: string;
  location?: string;
  streamUrl: string;
  streamType: CameraStreamType;
  faceRecognition: boolean;
  moduleId: string | null;
  active: boolean;
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
