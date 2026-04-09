import type { EncRecord, Patient } from '../types/triage';

type Props = {
  patients: Patient[];
  records: Record<string, EncRecord>;
  loading: boolean;
  error: string;
  onOpenPatient: (patientId: string) => void;
  onRetry: () => void;
};

function latestStatus(record: EncRecord | undefined, kind: 'consultation' | 'disposition') {
  if (!record) return 'Pending';
  if (kind === 'consultation') {
    return record.calls.some((call) => call.completed) ? 'Completed' : 'Pending';
  }
  return record.disposition?.status ? 'Completed' : 'Pending';
}

export function EncList({ patients, records, loading, error, onOpenPatient, onRetry }: Props) {
  const triagedPatients = patients.filter((patient) =>
    ['RED', 'YELLOW', 'GREEN', 'BLACK'].includes(patient.category)
  );

  return (
    <main className="view wide-view active">
      <div className="view-header">
        <div>
          <h2>Emergency Nursing Coordinator</h2>
          <p className="text-muted text-xs">Triaged patients requiring consultation and disposition tracking.</p>
        </div>
        <button className="btn btn-outline btn-small" onClick={onRetry}>Refresh</button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state">Loading triaged patients...</div>
        ) : error ? (
          <div className="empty-state">
            <p className="mb-2">Could not load patients.</p>
            <p className="text-muted mb-2">{error}</p>
            <button className="btn btn-outline btn-small" onClick={onRetry}>Retry</button>
          </div>
        ) : triagedPatients.length === 0 ? (
          <div className="empty-state">No triaged patients available for ENC workflow.</div>
        ) : (
          <table className="patient-table enc-table">
            <thead>
              <tr>
                <th>S.no</th>
                <th>Date</th>
                <th>Time</th>
                <th>Patient Name</th>
                <th>Age / Sex</th>
                <th>CR no</th>
                <th>Trauma / Non-Trauma</th>
                <th>Triage Category</th>
                <th>Consultation</th>
                <th>Disposition</th>
              </tr>
            </thead>
            <tbody>
              {triagedPatients.map((patient, index) => {
                const record = records[patient.id];
                const consultation = latestStatus(record, 'consultation');
                const disposition = latestStatus(record, 'disposition');
                return (
                  <tr key={patient.id} className="triage-row clickable-row" onClick={() => onOpenPatient(patient.id)}>
                    <td>{index + 1}</td>
                    <td>{new Date(patient.timestamp).toLocaleDateString('en-IN')}</td>
                    <td>{patient.time}</td>
                    <td><strong>{patient.name}</strong></td>
                    <td>{patient.age} / {patient.gender}</td>
                    <td>{patient.crNo}</td>
                    <td>{patient.pathway}</td>
                    <td><span className={`badge badge-${patient.category.toLowerCase()}`}>{patient.category}</span></td>
                    <td><span className={`badge ${consultation === 'Completed' ? 'badge-green' : 'badge-default'}`}>{consultation}</span></td>
                    <td><span className={`badge ${disposition === 'Completed' ? 'badge-green' : 'badge-default'}`}>{disposition}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
