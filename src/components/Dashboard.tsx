import type { Patient } from '../types/triage';

type Props = {
  patients: Patient[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onNewTriage: () => void;
};

export function Dashboard({ patients, loading, error, onRetry, onNewTriage }: Props) {
  return (
    <main id="dashboard-view" className="view active">
      <div className="view-header">
        <h2>Active Patients</h2>
        <button className="btn btn-primary" onClick={onNewTriage}>
          + New Triage
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state">Loading patients from database...</div>
        ) : error ? (
          <div className="empty-state">
            <p style={{ marginBottom: '0.75rem' }}>Could not load patients from backend.</p>
            <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
              {error}
            </p>
            <button className="btn btn-outline btn-small" onClick={onRetry}>
              Retry
            </button>
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">No patients found in database yet.</div>
        ) : (
          <table id="patients-table">
            <thead>
              <tr>
                <th>CR No.</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Category</th>
                <th>Area</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="triage-row">
                  <td>{patient.crNo}</td>
                  <td>
                    <strong>{patient.name}</strong>
                  </td>
                  <td>{patient.age}</td>
                  <td>{patient.gender}</td>
                  <td>
                    <span className={`badge badge-${patient.category.toLowerCase()}`}>
                      {patient.category}
                    </span>
                  </td>
                  <td>
                    <span className="tag">{patient.area}</span>
                  </td>
                  <td>
                    <small className="text-muted">
                      <strong>{patient.time}</strong>
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}