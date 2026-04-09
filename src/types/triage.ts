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
  triageData?: unknown;
  consultationStatus?: 'Pending' | 'Completed';
  dispositionStatus?: 'Pending' | 'Completed';
}

export interface EncRecord {
  patientId: string;
  calls: Array<{
    department: string;
    doctorName: string;
    callGivenBy: string;
    time: string;
    completed: boolean;
  }>;
  disposition?: {
    status: string;
    time: string;
    notes: string;
  };
}

export interface LoginPayload {
  username: string;
  password: string;
  role: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    displayName: string;
  };
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
