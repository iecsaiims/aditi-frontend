import type {
  EncRecord,
  LoginPayload,
  LoginResponse,
  Patient,
  SpeechToTextResult
} from '../types/triage.js';

const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '');

const REQUEST_TIMEOUT_MS = 10000;
const STT_REQUEST_TIMEOUT_MS = 60000;

async function request<T>(path: string, options?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not configured for this deployment.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
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
    throw new Error(text || 'Request failed');
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

  getPatients: () => request<Patient[]>('/patients'),

  createPatient: (payload: Omit<Patient, 'id'>) =>
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
        time?: string;
        completed: boolean;
      }>;
      disposition?: {
        department: string;
        status: string;
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
        time: call.time ?? '',
        completed: call.completed
      })),
      disposition: response.disposition
        ? {
            department: response.disposition.department,
            status: response.disposition.status,
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
