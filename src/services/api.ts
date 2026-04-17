import type {
  ChangePasswordPayload,
  CreatePatientPayload,
  EncRecord,
  LoginPayload,
  LoginResponse,
  Patient,
  StaffBatchPayload,
  StaffBatchResult,
  StaffCreatePayload,
  StoredSession,
  SpeechToTextResult
} from '../types/triage.js';

const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '');
export const SESSION_STORAGE_KEY = 'project-aditi-session';

const REQUEST_TIMEOUT_MS = 30000;
const STT_REQUEST_TIMEOUT_MS = 60000;

async function request<T>(path: string, options?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not configured for this deployment.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    const rawSession =
      window.localStorage.getItem(SESSION_STORAGE_KEY) ??
      window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    let session: StoredSession | null = null;
    if (rawSession) {
      try {
        session = JSON.parse(rawSession) as StoredSession;
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(options?.headers || {})
      },
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Check that the backend is running and try again.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text || 'Request failed';

    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string };
      if (parsed.message) {
        message = parsed.message;
      } else if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      // Keep the raw text when the body is not JSON.
    }

    try {
      const parsedIssues = JSON.parse(message) as Array<{ message?: string }>;
      if (Array.isArray(parsedIssues) && parsedIssues[0]?.message) {
        message = parsedIssues[0].message;
      }
    } catch {
      // Keep the message as-is when it is not a serialized validation array.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function sendAudioRequest<T>(
  audio: Blob,
  durationSeconds: number,
  mode: 'pretranscribe' | 'final'
): Promise<T> {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not configured for this deployment.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), STT_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    const form = new FormData();
    form.append('audio', audio, 'recording.webm');

    response = await fetch(`${API_URL}/stt/transcribe`, {
      method: 'POST',
      headers: {
        'X-Audio-Duration-Seconds': String(durationSeconds),
        'X-STT-Mode': mode
      },
      body: form,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Speech-to-text request timed out. Try a shorter recording or retry.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const text = await response.text();
    let parsedMessage = '';
    try {
      const errorBody = JSON.parse(text) as { error?: string; message?: string };
      parsedMessage = errorBody.error || errorBody.message || '';
    } catch {
      parsedMessage = '';
    }
    throw new Error(parsedMessage || text || 'Speech-to-text request failed');
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createStaff: (payload: StaffCreatePayload) =>
    request('/auth/staff', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createStaffBatch: (payload: StaffBatchPayload) =>
    request<StaffBatchResult>('/auth/staff/batch', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  changePassword: (payload: ChangePasswordPayload) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getPatients: () => request<Patient[]>('/patients'),

  createPatient: (payload: CreatePatientPayload) =>
    request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getEncRecord: async (patientId: string) => {
    const response = await request<{
      patientId: string;
      consultations: Array<{
        department: string;
        doctorName?: string;
        callGivenBy?: string;
        date?: string;
        time?: string;
        completed: boolean;
      }>;
      disposition?: {
        department: string;
        status: string;
        date?: string;
        time: string;
        notes?: string;
      } | null;
    }>(`/enc/${patientId}`);

    return {
      patientId: response.patientId,
      calls: response.consultations.map((call) => ({
        department: call.department,
        doctorName: call.doctorName ?? '',
        callGivenBy: call.callGivenBy ?? '',
        date: call.date ?? '',
        time: call.time ?? '',
        completed: call.completed
      })),
      disposition: response.disposition
        ? {
            department: response.disposition.department,
            status: response.disposition.status,
            date: response.disposition.date ?? '',
            time: response.disposition.time,
            notes: response.disposition.notes ?? ''
          }
        : undefined
    } satisfies EncRecord;
  },

  saveEncConsultation: (patientId: string, payload: EncRecord['calls'][number]) =>
    request(`/enc/${patientId}/consultations`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  saveEncDisposition: (patientId: string, payload: NonNullable<EncRecord['disposition']>) =>
    request(`/enc/${patientId}/disposition`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  transcribeAudio: (audio: Blob, durationSeconds: number) =>
    sendAudioRequest<SpeechToTextResult>(audio, durationSeconds, 'final')
};
