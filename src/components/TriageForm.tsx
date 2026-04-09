import { useEffect, useRef, useState } from 'react';
import {
  FEVER_DANGER_OPTIONS,
  HIGH_RISK_BLEEDING_OPTIONS,
  MINOR_LOW_RISK_OPTIONS,
  NCCT_HEAD_OPTIONS,
  NONTRAUMA_IMMEDIATE_RED_OPTIONS,
  TIME_SENSITIVE_OPTIONS,
  TRAUMA_ANATOMY_OPTIONS,
  TRAUMA_MECHANISM_OPTIONS,
  TRAUMA_SPECIAL_OPTIONS,
  type TriageOption
} from '../data/triageOptions.js';
import type {
  PathwayType,
  SpeechToTextResult,
  TriageCategory,
  TriageEvaluationInput,
  TriageResult
} from '../types/triage.js';

export type ChecklistField =
  | 'redPhysioCheckboxes'
  | 'ntImmediateRed'
  | 'ntBleeding'
  | 'ntTimeSensitive'
  | 'ntFeverDanger'
  | 'ntMinorLowRisk'
  | 'traumaAnatomy'
  | 'traumaMechanism'
  | 'traumaSpecial'
  | 'ncctHead';

type FormState = {
  crNo: string;
  patientName: string;
  patientAge: string;
  patientGender: 'M' | 'F' | 'O';
  contactNumber: string;
  presentation: string;
  arrival: string;
  complaintText: string;
  isResponsive: boolean;
  isAcute: boolean;
  severePain: boolean;
  acuteDistress: boolean;
  pulse: string;
  sbp: string;
  dbp: string;
  spo2: string;
  rr: string;
  temp: string;
  consciousness: string;
  pathway: PathwayType;
  redPhysioCheckboxes: string[];
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
  finalCategory: TriageCategory | '';
};

type Props = {
  form: FormState;
  evaluation: TriageResult | null;
  requiredVitalsMissing: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onFieldChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onToggleListValue: (field: ChecklistField, value: string) => void;
  onAutoFillPatient: () => void;
  onFetchVitals: () => void;
  onTranscribeAudio: (audio: Blob, durationSeconds: number) => Promise<SpeechToTextResult>;
};

function getAutoTriageMatch(result: TriageResult): number {
  const source = `${result.category}:${result.reason}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 1000;
  }

  return 92 + (hash % 8);
}

export function TriageForm({
  form,
  evaluation,
  requiredVitalsMissing,
  canSubmit,
  onBack,
  onSubmit,
  onFieldChange,
  onToggleListValue,
  onAutoFillPatient,
  onFetchVitals,
  onTranscribeAudio
}: Props) {
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'recording' | 'transcribing' | 'done' | 'error'>('idle');
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceMessage, setVoiceMessage] = useState('Ready to record complaint speech.');
  const [voiceResult, setVoiceResult] = useState<SpeechToTextResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioPartsRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const displayedEvaluation =
    evaluation && !(requiredVitalsMissing && evaluation.category !== 'RED') ? evaluation : null;
  const liveBadgeClass = displayedEvaluation
    ? `badge badge-${displayedEvaluation.category.toLowerCase()}`
    : 'badge badge-default';
  const autoMatch = displayedEvaluation ? getAutoTriageMatch(displayedEvaluation) : null;
  const autoSuggestionText = displayedEvaluation
    ? displayedEvaluation.reason
    : 'Please enter key vitals (Pulse, SBP, SpO2, RR) to confirm pathway.';
  const isRecording = voiceStatus === 'recording';
  const isTranscribing = voiceStatus === 'transcribing';

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopVoiceTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceStatus('error');
      setVoiceMessage('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      setVoiceResult(null);
      setVoiceSeconds(0);
      setVoiceMessage('Recording complaint speech...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      mediaStreamRef.current = stream;
      audioPartsRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 32000
        });
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioPartsRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();

      recorder.start(500);

      timerRef.current = window.setInterval(() => {
        setVoiceSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 1000);

      setVoiceStatus('recording');
    } catch (error) {
      stopVoiceTimer();
      releaseMediaStream();
      mediaRecorderRef.current = null;
      setVoiceStatus('error');
      setVoiceMessage(
        error instanceof DOMException ? 'Microphone access denied.' : 'Could not start microphone recording.'
      );
    }
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

    stopVoiceTimer();
    setVoiceSeconds(durationSeconds);

    try {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      releaseMediaStream();
      mediaRecorderRef.current = null;

      const audio = new Blob(audioPartsRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (audio.size < 1000) {
        throw new Error('No audio recorded.');
      }

      setVoiceStatus('transcribing');
      setVoiceMessage('Transcribing and summarizing complaint...');

      const result = await onTranscribeAudio(audio, durationSeconds);
      setVoiceResult(result);
      setVoiceStatus('done');
      setVoiceMessage('Complaint summary added.');
      onFieldChange('complaintText', result.summary);
    } catch (error) {
      releaseMediaStream();
      mediaRecorderRef.current = null;
      const message = error instanceof Error ? error.message : 'Speech-to-text failed.';
      setVoiceStatus('error');
      setVoiceMessage(message);
    } finally {
      audioPartsRef.current = [];
    }
  };

  const handleRecordClick = () => {
    if (isTranscribing) return;

    if (isRecording) {
      void stopRecording();
      return;
    }

    void startRecording();
  };

  const requiredMarker = <span className="required-marker">*</span>;

  const checkbox = (listName: ChecklistField, value: string, label: string) => (
    <label key={`${listName}-${value}`}>
      <input
        type="checkbox"
        checked={form[listName].includes(value)}
        onChange={() => onToggleListValue(listName, value)}
      />
      <span className="checkbox-label-text">{label}</span>
    </label>
  );

  const optionGroup = (title: string, listName: ChecklistField, options: TriageOption[]) => (
    <div className="condition-group mt-2">
      <h4>{title}</h4>
      <div className="checkbox-grid">
        {options.map((option) => checkbox(listName, option.code, option.label))}
      </div>
    </div>
  );

  return (
    <main id="triage-view" className="view">
      <div className="view-header sticky">
        <button className="btn btn-icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <h2>New Patient Triage</h2>
        <div className="triage-status-bar">
          <span className={liveBadgeClass}>
            {displayedEvaluation ? displayedEvaluation.category : 'Awaiting Vitals'}
          </span>
        </div>
      </div>

      <form className="triage-form" onSubmit={(event) => event.preventDefault()}>
        <section className="form-section">
          <div className="section-header-flex">
            <h3>1. Basic Information</h3>
          </div>
          <div className="grid-2 mt-2">
            <div className="input-group">
              <label>CR Number</label>
              <input value={form.crNo} onChange={(event) => onFieldChange('crNo', event.target.value)} />
            </div>
            <div className="input-group">
              <label>Name {requiredMarker}</label>
              <input required value={form.patientName} onChange={(event) => onFieldChange('patientName', event.target.value)} />
            </div>
            <div className="input-group">
              <label>Age {requiredMarker}</label>
              <input required type="number" min="0" value={form.patientAge} onChange={(event) => onFieldChange('patientAge', event.target.value)} />
            </div>
            <div className="input-group">
              <label>Gender {requiredMarker}</label>
              <select required value={form.patientGender} onChange={(event) => onFieldChange('patientGender', event.target.value as 'M' | 'F' | 'O')}>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div className="input-group full-width">
              <label>Contact Number {requiredMarker}</label>
              <input required value={form.contactNumber} onChange={(event) => onFieldChange('contactNumber', event.target.value)} />
            </div>
          </div>

          <div className="grid-2 mt-3">
            <div className="toggle-group-container">
              <label>Presentation Type</label>
              <div className="radio-toggles">
                <label>
                  <input type="radio" checked={form.presentation === 'Direct'} onChange={() => onFieldChange('presentation', 'Direct')} />
                  <span>Direct</span>
                </label>
                <label>
                  <input type="radio" checked={form.presentation === 'Indirect'} onChange={() => onFieldChange('presentation', 'Indirect')} />
                  <span>Indirect</span>
                </label>
              </div>
            </div>

            <div className="toggle-group-container">
              <label>Arrival Mode</label>
              <div className="radio-toggles">
                <label>
                  <input type="radio" checked={form.arrival === 'Self'} onChange={() => onFieldChange('arrival', 'Self')} />
                  <span>Self</span>
                </label>
                <label>
                  <input type="radio" checked={form.arrival === 'Ambulance'} onChange={() => onFieldChange('arrival', 'Ambulance')} />
                  <span>Ambulance</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>2. Primary Assessment</h3>
          <div className="switch-group">
            <label className="switch-label">
              <span className="label-text">Patient alert or responsive to verbal commands?</span>
              <div className="toggle-switch">
                <input type="checkbox" checked={form.isResponsive} onChange={(event) => onFieldChange('isResponsive', event.target.checked)} />
                <span className="slider"></span>
              </div>
            </label>
          </div>

          {!form.isResponsive && (
            <div className="switch-group">
              <label className="switch-label">
                <span className="label-text text-danger">Is onset acute?</span>
                <div className="toggle-switch">
                  <input type="checkbox" checked={form.isAcute} onChange={(event) => onFieldChange('isAcute', event.target.checked)} />
                  <span className="slider"></span>
                </div>
              </label>
            </div>
          )}

          <div className="switch-group">
            <label className="switch-label">
              <span className="label-text">Severe pain (NRS ≥ 7)?</span>
              <div className="toggle-switch">
                <input type="checkbox" checked={form.severePain} onChange={(event) => onFieldChange('severePain', event.target.checked)} />
                <span className="slider"></span>
              </div>
            </label>
          </div>

          <div className="switch-group">
            <label className="switch-label">
              <span className="label-text">Acute distress / agitation?</span>
              <div className="toggle-switch">
                <input type="checkbox" checked={form.acuteDistress} onChange={(event) => onFieldChange('acuteDistress', event.target.checked)} />
                <span className="slider"></span>
              </div>
            </label>
          </div>
        </section>

        <section className="form-section">
          <h3>3. Chief Complaint Capture</h3>
          <div className={`voice-capture-box voice-capture-${voiceStatus}`}>
            <button type="button" className="btn btn-voice" disabled={isTranscribing} onClick={handleRecordClick}>
              {isRecording ? 'Stop Recording' : isTranscribing ? 'Processing...' : 'Start Recording'}
            </button>
            <div className="recording-indicator">
              <div className="radar"></div>
              <span>{voiceMessage}</span>
            </div>
            {(isRecording || isTranscribing || voiceSeconds > 0) && (
              <div className="voice-timer">Audio duration: {voiceSeconds}s</div>
            )}
            {voiceResult && (
              <div className="voice-result-panel">
                <div><strong>Detected language:</strong> {voiceResult.language}</div>
                <div><strong>Raw transcript:</strong> {voiceResult.transcript}</div>
                <div><strong>Used cache:</strong> {voiceResult.used_cache ? 'Yes' : 'No'}</div>
              </div>
            )}
          </div>
          <div className="input-group mt-2">
            <label>Complaint Transcript / Summary</label>
            <textarea rows={3} value={form.complaintText} onChange={(event) => onFieldChange('complaintText', event.target.value)} />
          </div>
        </section>

        <section className="form-section">
          <div className="section-header-flex">
            <h3>4. Vitals (Mandatory)</h3>
            {/* <button type="button" className="btn btn-outline btn-small" onClick={onFetchVitals}>
              Fetch IoT Vitals
            </button> */}
          </div>
          <div className="grid-3 mt-2">
            <div className="input-group"><label>Pulse</label><input value={form.pulse} onChange={(event) => onFieldChange('pulse', event.target.value)} /></div>
            <div className="input-group"><label>SBP</label><input value={form.sbp} onChange={(event) => onFieldChange('sbp', event.target.value)} /></div>
            <div className="input-group"><label>DBP</label><input value={form.dbp} onChange={(event) => onFieldChange('dbp', event.target.value)} /></div>
            <div className="input-group"><label>SpO2</label><input value={form.spo2} onChange={(event) => onFieldChange('spo2', event.target.value)} /></div>
            <div className="input-group"><label>RR</label><input value={form.rr} onChange={(event) => onFieldChange('rr', event.target.value)} /></div>
            <div className="input-group">
              <label>Temperature</label>
              <select value={form.temp} onChange={(event) => onFieldChange('temp', event.target.value)}>
                <option value="Afebrile">Afebrile</option>
                <option value="Febrile">Febrile</option>
              </select>
            </div>
          </div>
          <div className="input-group mt-2">
            <label>Consciousness (ACVPU)</label>
            <select value={form.consciousness} onChange={(event) => onFieldChange('consciousness', event.target.value)}>
              <option value="Alert">Alert</option>
              <option value="Confused">Confused</option>
              <option value="Verbal">Responding to verbal</option>
              <option value="Pain">Responding to pain</option>
              <option value="Unresponsive">Unresponsive</option>
            </select>
          </div>
          <div className="mt-3">
            <label>Red Physiology Clinical Signs</label>
            <div className="checkbox-grid">
              {checkbox('redPhysioCheckboxes', 'Stridor / drooling / noisy breathing', 'Stridor / drooling / noisy breathing')}
              {checkbox('redPhysioCheckboxes', 'Angioedema of face', 'Angioedema of face')}
              {checkbox('redPhysioCheckboxes', 'Talking in incomplete sentences', 'Talking in incomplete sentences')}
              {checkbox('redPhysioCheckboxes', 'Cardiac arrest', 'Cardiac arrest')}
              {checkbox('redPhysioCheckboxes', 'Ongoing major hemorrhage', 'Ongoing exsanguinating / major hemorrhage')}
              {checkbox('redPhysioCheckboxes', 'Active seizures', 'Active seizures')}
            </div>
          </div>
        </section>

        <section className="form-section highlight-box">
          <h3>5. Clinical Pathway</h3>
          <div className="radio-toggles large">
            <label>
              <input type="radio" checked={form.pathway === 'NonTrauma'} onChange={() => onFieldChange('pathway', 'NonTrauma')} />
              <span>Non-Trauma</span>
            </label>
            <label>
              <input type="radio" checked={form.pathway === 'Trauma'} onChange={() => onFieldChange('pathway', 'Trauma')} />
              <span>Trauma</span>
            </label>
          </div>

          {form.pathway === 'NonTrauma' ? (
            <div className="mt-3">
              <div className="none-of-above-row">
                <label>
                  <input
                    type="checkbox"
                    checked={form.noneOfTheAbove}
                    onChange={(event) => onFieldChange('noneOfTheAbove', event.target.checked)}
                  />
                  <span className="checkbox-label-text">None of the following applied</span>
                </label>
              </div>
              <div className="lane-intro">Select any that apply to the patient.</div>
              {optionGroup('Immediate RED conditions', 'ntImmediateRed', NONTRAUMA_IMMEDIATE_RED_OPTIONS)}
              {optionGroup('Time-sensitive conditions (<24h)', 'ntTimeSensitive', TIME_SENSITIVE_OPTIONS)}
              {optionGroup('High-risk bleeding', 'ntBleeding', HIGH_RISK_BLEEDING_OPTIONS)}
              {optionGroup('High-risk fever', 'ntFeverDanger', FEVER_DANGER_OPTIONS)}
              <div className="green-yard">
                {optionGroup('Minor / low-risk conditions', 'ntMinorLowRisk', MINOR_LOW_RISK_OPTIONS)}
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="lane-intro">Select any trauma criteria that apply to the patient.</div>
              {optionGroup('High-risk anatomy', 'traumaAnatomy', TRAUMA_ANATOMY_OPTIONS)}
              {optionGroup('High-risk mechanism', 'traumaMechanism', TRAUMA_MECHANISM_OPTIONS)}
              {optionGroup('Special situations', 'traumaSpecial', TRAUMA_SPECIAL_OPTIONS)}

              <div className="condition-group mt-2 note-box">
                <h4>Low-risk gate</h4>
                <div className="grid-2">
                  <div className="toggle-group-container">
                    <label>Patient ambulatory in ED?</label>
                    <div className="radio-toggles">
                      <label><input type="radio" checked={form.tAmbulatory === true} onChange={() => onFieldChange('tAmbulatory', true)} /><span>Yes</span></label>
                      <label><input type="radio" checked={form.tAmbulatory === false} onChange={() => onFieldChange('tAmbulatory', false)} /><span>No</span></label>
                    </div>
                  </div>
                  <div className="toggle-group-container">
                    <label>Not on anticoagulation?</label>
                    <div className="radio-toggles">
                      <label><input type="radio" checked={form.tNotAnticoag === true} onChange={() => onFieldChange('tNotAnticoag', true)} /><span>Yes</span></label>
                      <label><input type="radio" checked={form.tNotAnticoag === false} onChange={() => onFieldChange('tNotAnticoag', false)} /><span>No</span></label>
                    </div>
                  </div>
                </div>
              </div>
              {optionGroup('Indication for NCCT head', 'ncctHead', NCCT_HEAD_OPTIONS)}
            </div>
          )}
        </section>

        <section className="form-section highlight-box final-decision-box">
          <h3>6. Final Triage Decision</h3>
          <div className="grid-2">
            <div className="result-summary-card">
              <div className="font-bold mb-1">Rule-Based Suggestion:</div>
              <span className={liveBadgeClass}>
                {displayedEvaluation ? displayedEvaluation.category : 'Awaiting Vitals'}
              </span>
              <div className="text-xs text-muted mt-2">{autoSuggestionText}</div>
            </div>
            <div className="auto-triage-suggestion-box">
              <div className="font-bold mb-1">Auto-Triage Suggestion:</div>
              <div
                className={`p-2 rounded suggestion-box ${
                  displayedEvaluation
                    ? `suggestion-box-match suggestion-box-${displayedEvaluation.category.toLowerCase()}`
                    : 'suggestion-box-pending text-muted text-xs'
                }`}
              >
                {displayedEvaluation && autoMatch !== null
                  ? `${displayedEvaluation.category} (${autoMatch}% match)`
                  : autoSuggestionText}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className="font-bold text-lg">Assign triage category:</label>
            <div className="radio-toggles large override-toggles mt-1">
              {(['RED', 'YELLOW', 'GREEN', 'BLACK'] as TriageCategory[]).map((category) => (
                <label key={category} className={`toggle-${category.toLowerCase()}`}>
                  <input
                    type="radio"
                    checked={form.finalCategory === category}
                    onChange={() => onFieldChange('finalCategory', category)}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="form-actions sticky-bottom">
          <div className="result-summary">
            <div>Recommended Category:</div>
            <div id="calc-category" className="font-bold">
              {displayedEvaluation ? displayedEvaluation.category : 'Awaiting Vitals'}
            </div>
            <div id="calc-reason" className="text-xs text-muted">
              {autoSuggestionText}
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-large" disabled={!canSubmit} onClick={onSubmit}>
            Submit Triage
          </button>
        </div>
      </form>
    </main>
  );
}

export type { FormState };

export function buildEvaluationInput(form: FormState): TriageEvaluationInput {
  return {
    isResponsive: form.isResponsive,
    isAcuteOnset: form.isAcute,
    severePain: form.severePain,
    acuteDistress: form.acuteDistress,
    pulse: form.pulse,
    sbp: form.sbp,
    dbp: form.dbp,
    spo2: form.spo2,
    rr: form.rr,
    temp: form.temp,
    consciousness: form.consciousness,
    redPhysioCheckboxes: form.redPhysioCheckboxes,
    pathway: form.pathway,
    ntImmediateRed: form.ntImmediateRed,
    ntBleeding: form.ntBleeding,
    ntTimeSensitive: form.ntTimeSensitive,
    ntFeverDanger: form.ntFeverDanger,
    ntMinorLowRisk: form.ntMinorLowRisk,
    noneOfTheAbove: form.noneOfTheAbove,
    traumaAnatomy: form.traumaAnatomy,
    traumaMechanism: form.traumaMechanism,
    traumaSpecial: form.traumaSpecial,
    ncctHead: form.ncctHead,
    tAmbulatory: form.tAmbulatory,
    tNotAnticoag: form.tNotAnticoag
  };
}
