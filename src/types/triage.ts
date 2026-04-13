export type TriageCategory = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';
export type PathwayType = 'NonTrauma' | 'Trauma';

export interface TriageEvaluationInput {
  isResponsive: boolean;
  isAcuteOnset: boolean;
  severePain: boolean;
  acuteDistress: boolean;
  pulse: string;
  sbp: string;
  dbp: string;
  spo2: string;
  rr: string;
  respiratorySupport: string;
  temp: string;
  consciousness: string;
  redPhysioCheckboxes: string[];
  pathway: PathwayType;
  ntImmediateRed: string[];
  ntBleeding: string[];
  ntTimeSensitive: string[];
  ntFeverDanger: string[];
  ntMinorLowRisk: string[];
  noneOfTheAbove: boolean;
  traumaAnatomy: string[];
  traumaMechanism: string[];
  traumaSpecial: string[];
  ncctHead: string[];
  tAmbulatory: boolean | null;
  tNotAnticoag: boolean | null;
}

export interface TriageResult {
  category: TriageCategory;
  reason: string;
}

export interface Patient {
  id: string;
  crNo: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  category: TriageCategory;
  area: string;
  time: string;
  timestamp: string;
  complaint?: string;
  pathway: PathwayType;
  respiratorySupport?: string;
  triageData?: unknown;
  consultationStatus?: 'Pending' | 'Completed';
  dispositionStatus?: 'Pending' | 'Completed';
  submittedBy?: string | null;
  designation?: string | null;
}

export interface EncRecord {
  patientId: string;
  calls: Array<{
    department: string;
    doctorName: string;
    callGivenBy: string;
    date?: string;
    time: string;
    completed: boolean;
  }>;
  disposition?: {
    department: string;
    status: string;
    date?: string;
    time: string;
    notes: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
    designation: string;
  };
}

export interface StaffCreatePayload {
  name: string;
  email: string;
  password: string;
  designation: string;
  role: string;
}

export interface StaffBatchPayload {
  users: StaffCreatePayload[];
}

export interface StaffBatchResult {
  createdUsers: Array<LoginResponse['user']>;
  errors: Array<{
    row: number;
    email: string;
    message: string;
  }>;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface StoredSession {
  token: string;
  user: LoginResponse['user'];
}

export interface SpeechToTextResult {
  transcript: string;
  language: string;
  summary: string;
  audio_seconds: number;
  used_cache: boolean;
  key_index: {
    whisper: number;
  };
  timestamp: string;
}
