import { useState } from 'react';
import { AIIMSR_DEPARTMENTS, DEFAULT_DISPOSITION_DEPARTMENT } from '../data/departmentOptions';
import type { EncRecord, Patient } from '../types/triage';

type Props = {
  patient: Patient | undefined;
  record: EncRecord | undefined;
  onBack: () => void;
  onSaveConsultation: (patientId: string, call: EncRecord['calls'][number]) => void;
  onSaveDisposition: (patientId: string, disposition: NonNullable<EncRecord['disposition']>) => void;
};

export function EncDesk({ patient, record, onBack, onSaveConsultation, onSaveDisposition }: Props) {
  const [consultationCompleted, setConsultationCompleted] = useState('');
  const [department, setDepartment] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [callGivenBy, setCallGivenBy] = useState('');
  const [callTime, setCallTime] = useState('');

  const [dispositionDepartment, setDispositionDepartment] = useState(
    record?.disposition?.department ?? DEFAULT_DISPOSITION_DEPARTMENT
  );
  const [dispositionStatus, setDispositionStatus] = useState(record?.disposition?.status ?? '');
  const [dispositionTime, setDispositionTime] = useState(record?.disposition?.time ?? '');
  const [dispositionNotes, setDispositionNotes] = useState(record?.disposition?.notes ?? '');

  if (!patient) {
    return (
      <main className="view">
        <div className="empty-state">
          <p className="mb-2">Patient not found.</p>
          <button className="btn btn-primary" onClick={onBack}>Back to ENC List</button>
        </div>
      </main>
    );
  }

  const finalConsultationCompleted = record?.calls.some((call) => call.completed) ?? false;
  const dispositionSaved = Boolean(record?.disposition?.status);

  const saveConsultation = () => {
    if (!consultationCompleted) return;
    onSaveConsultation(patient.id, {
      department: consultationCompleted === 'Yes' ? 'Final consultation' : department,
      doctorName,
      callGivenBy,
      time: callTime,
      completed: consultationCompleted === 'Yes'
    });
    setConsultationCompleted('');
    setDepartment('');
    setDoctorName('');
    setCallGivenBy('');
    setCallTime('');
  };

  const saveDisposition = () => {
    if (!dispositionDepartment || !dispositionStatus || !dispositionTime) return;
    onSaveDisposition(patient.id, {
      department: dispositionDepartment,
      status: dispositionStatus,
      time: dispositionTime,
      notes: dispositionNotes
    });
  };

  return (
    <main className="view">
      <div className="view-header sticky">
        <button className="btn btn-icon" onClick={onBack} aria-label="Back">←</button>
        <h2>ENC Patient Desk</h2>
        <span className={`badge badge-${patient.category.toLowerCase()}`}>{patient.category}</span>
      </div>

      <section className="form-section">
        <h3>Patient Details</h3>
        <div className="info-grid enhanced-info-grid">
          <div className="info-row"><strong>Name:</strong> {patient.name}</div>
          <div className="info-row"><strong>Age / Sex:</strong> {patient.age} / {patient.gender}</div>
          <div className="info-row"><strong>CR No:</strong> {patient.crNo}</div>
          <div className="info-row"><strong>Pathway:</strong> {patient.pathway}</div>
        </div>
      </section>

      {record && record.calls.length > 0 && (
        <section className="form-section">
          <h3>Consultation Calls</h3>
          <div className="enc-call-list">
            {record.calls.map((call, index) => (
              <div className="enc-call-card" key={`${call.time}-${index}`}>
                <div className="section-header-flex">
                  <strong>Call {index + 1}</strong>
                  <span className={`badge ${call.completed ? 'badge-green' : 'badge-default'}`}>
                    {call.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
                {call.completed ? (
                  <p className="text-muted">Final consultation completed at {call.time || 'time not recorded'}.</p>
                ) : (
                  <div className="info-grid">
                    <div><strong>Department:</strong> {call.department}</div>
                    <div><strong>Doctor:</strong> {call.doctorName || '-'}</div>
                    <div><strong>Call Given By:</strong> {call.callGivenBy || '-'}</div>
                    <div><strong>Time:</strong> {call.time || '-'}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!finalConsultationCompleted && (
        <section className="form-section">
          <h3>Add Consultation Call</h3>
          <div className="grid-2">
            <div className="input-group">
              <label>Consultation Completed</label>
              <select value={consultationCompleted} onChange={(event) => setConsultationCompleted(event.target.value)}>
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="input-group">
              <label>Time</label>
              <input type="time" value={callTime} onChange={(event) => setCallTime(event.target.value)} />
            </div>
          </div>

          {consultationCompleted === 'No' && (
            <div className="grid-2 mt-2">
              <div className="input-group">
                <label>Department</label>
                <select value={department} onChange={(event) => setDepartment(event.target.value)}>
                  <option value="">Select department</option>
                  {AIIMSR_DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Doctor Name</label>
                <input value={doctorName} onChange={(event) => setDoctorName(event.target.value)} />
              </div>
              <div className="input-group full-width">
                <label>Call Given By</label>
                <input value={callGivenBy} onChange={(event) => setCallGivenBy(event.target.value)} />
              </div>
            </div>
          )}

          {consultationCompleted === 'Yes' && (
            <div className="note-box mt-2">This will be marked as the final consultation. You cannot add more calls after saving.</div>
          )}

          <button className="btn btn-primary mt-2" type="button" onClick={saveConsultation}>
            Save Consultation
          </button>
        </section>
      )}

      {finalConsultationCompleted && (
        <section className="form-section success-panel">
          <h3>Final Consultation Completed</h3>
          <p className="text-muted">Consultation workflow is locked for this patient.</p>
        </section>
      )}

      <section className="form-section">
        <h3>Disposition</h3>
        {dispositionSaved ? (
          <div className="info-grid">
            <div><strong>Department:</strong> {record?.disposition?.department || '-'}</div>
            <div><strong>Status:</strong> {record?.disposition?.status}</div>
            <div><strong>Time:</strong> {record?.disposition?.time}</div>
            <div><strong>Notes:</strong> {record?.disposition?.notes || '-'}</div>
          </div>
        ) : (
          <>
            <div className="grid-2">
              <div className="input-group">
                <label>Department</label>
                <select value={dispositionDepartment} onChange={(event) => setDispositionDepartment(event.target.value)}>
                  {AIIMSR_DEPARTMENTS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Disposition Status</label>
                <select value={dispositionStatus} onChange={(event) => setDispositionStatus(event.target.value)}>
                  <option value="">Select disposition</option>
                  {['Discharge', 'Admit', 'Refer', 'Abscond', 'LAMA', 'Death'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Time</label>
                <input type="time" value={dispositionTime} onChange={(event) => setDispositionTime(event.target.value)} />
              </div>
              <div className="input-group full-width">
                <label>Notes</label>
                <textarea rows={2} value={dispositionNotes} onChange={(event) => setDispositionNotes(event.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary mt-2" type="button" onClick={saveDisposition}>
              Save Disposition
            </button>
          </>
        )}
      </section>
    </main>
  );
}
