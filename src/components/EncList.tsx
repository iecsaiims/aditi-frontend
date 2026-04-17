import { useMemo, useState } from 'react';
import type { EncRecord, Patient, TriageCategory } from '../types/triage';
import { formatIstDate, formatIstDateFilterValue, formatIstTime, istTimeToMinutes } from '../utils/dateTime';

type Props = {
  patients: Patient[];
  records: Record<string, EncRecord>;
  loading: boolean;
  error: string;
  onOpenPatient: (patientId: string) => void;
  onRetry: () => void;
};

const PAGE_SIZE = 50;
const TRIAGE_ORDER: Record<TriageCategory, number> = {
  RED: 0,
  YELLOW: 1,
  GREEN: 2,
  BLACK: 3,
};

type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'time-desc'
  | 'time-asc'
  | 'triage-asc'
  | 'triage-desc'
  | 'consultation-asc'
  | 'consultation-desc'
  | 'disposition-asc'
  | 'disposition-desc';

function latestStatus(record: EncRecord | undefined, kind: 'consultation' | 'disposition') {
  if (!record) return 'Pending';
  if (kind === 'consultation') {
    return record.calls.some((call) => call.completed) ? 'Completed' : 'Pending';
  }
  return record.disposition?.status || 'Pending';
}

function dispositionBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case 'discharge':
      return 'badge-discharge';
    case 'admit':
      return 'badge-admit';
    case 'refer':
      return 'badge-refer';
    case 'abscond':
      return 'badge-abscond';
    case 'lama':
      return 'badge-lama';
    case 'death':
      return 'badge-death';
    case 'completed':
      return 'badge-green';
    default:
      return 'badge-default';
  }
}

export function EncList({ patients, records, loading, error, onOpenPatient, onRetry }: Props) {
  const [dateFilter, setDateFilter] = useState('');
  const [triageFilter, setTriageFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [consultationFilter, setConsultationFilter] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [page, setPage] = useState(1);

  const eligiblePatients = useMemo(
    () => patients.filter((patient) => ['RED', 'YELLOW', 'GREEN', 'BLACK'].includes(patient.category)),
    [patients]
  );

  const triagedPatients = useMemo(() => {
    const next = eligiblePatients
      .filter((patient) => {
        const record = records[patient.id];
        const consultation = latestStatus(record, 'consultation');
        const disposition = latestStatus(record, 'disposition');
        const patientDate = formatIstDateFilterValue(patient.timestamp);
        const patientTime = formatIstTime(patient.timestamp, patient.time);

        const matchesDate = !dateFilter || patientDate === dateFilter;
        const matchesTriage = !triageFilter || patient.category === triageFilter;
        const matchesTime = !timeFilter || patientTime.toLowerCase().includes(timeFilter.toLowerCase());
        const matchesConsultation = !consultationFilter || consultation === consultationFilter;
        const matchesDisposition = !dispositionFilter || disposition === dispositionFilter;

        return matchesDate && matchesTriage && matchesTime && matchesConsultation && matchesDisposition;
      });

    return [...next].sort((left, right) => {
      const leftRecord = records[left.id];
      const rightRecord = records[right.id];
      const leftConsultation = latestStatus(leftRecord, 'consultation');
      const rightConsultation = latestStatus(rightRecord, 'consultation');
      const leftDisposition = latestStatus(leftRecord, 'disposition');
      const rightDisposition = latestStatus(rightRecord, 'disposition');

      switch (sortBy) {
        case 'date-asc':
          return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
        case 'date-desc':
          return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
        case 'time-asc':
          return istTimeToMinutes(left.timestamp) - istTimeToMinutes(right.timestamp);
        case 'time-desc':
          return istTimeToMinutes(right.timestamp) - istTimeToMinutes(left.timestamp);
        case 'triage-asc':
          return TRIAGE_ORDER[left.category] - TRIAGE_ORDER[right.category];
        case 'triage-desc':
          return TRIAGE_ORDER[right.category] - TRIAGE_ORDER[left.category];
        case 'consultation-asc':
          return leftConsultation.localeCompare(rightConsultation);
        case 'consultation-desc':
          return rightConsultation.localeCompare(leftConsultation);
        case 'disposition-asc':
          return leftDisposition.localeCompare(rightDisposition);
        case 'disposition-desc':
          return rightDisposition.localeCompare(leftDisposition);
        default:
          return 0;
      }
    });
  }, [consultationFilter, dateFilter, dispositionFilter, eligiblePatients, records, sortBy, timeFilter, triageFilter]);

  const totalPages = Math.max(1, Math.ceil(triagedPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPatients = triagedPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => {
    setDateFilter('');
    setTriageFilter('');
    setTimeFilter('');
    setConsultationFilter('');
    setDispositionFilter('');
    setSortBy('date-desc');
    setPage(1);
  };

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
        ) : eligiblePatients.length === 0 ? (
          <div className="empty-state">No triaged patients available for ENC workflow.</div>
        ) : (
          <>
            <section className="list-controls-panel">
              <div className="list-controls-grid list-controls-grid-wide">
                <div className="input-group">
                  <label>Date</label>
                  <input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} />
                </div>
                <div className="input-group">
                  <label>Triage</label>
                  <select value={triageFilter} onChange={(event) => { setTriageFilter(event.target.value); setPage(1); }}>
                    <option value="">All categories</option>
                    <option value="RED">RED</option>
                    <option value="YELLOW">YELLOW</option>
                    <option value="GREEN">GREEN</option>
                    <option value="BLACK">BLACK</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Time</label>
                  <input type="text" placeholder="e.g. 15:03" value={timeFilter} onChange={(event) => { setTimeFilter(event.target.value); setPage(1); }} />
                </div>
                <div className="input-group">
                  <label>Consultation Status</label>
                  <select value={consultationFilter} onChange={(event) => { setConsultationFilter(event.target.value); setPage(1); }}>
                    <option value="">All consultation states</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Disposition Status</label>
                  <select value={dispositionFilter} onChange={(event) => { setDispositionFilter(event.target.value); setPage(1); }}>
                    <option value="">All disposition states</option>
                    <option value="Pending">Pending</option>
                    <option value="Discharge">Discharge</option>
                    <option value="Admit">Admit</option>
                    <option value="Refer">Refer</option>
                    <option value="Abscond">Abscond</option>
                    <option value="LAMA">LAMA</option>
                    <option value="Death">Death</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Sort By</label>
                  <select value={sortBy} onChange={(event) => { setSortBy(event.target.value as SortOption); setPage(1); }}>
                    <option value="date-desc">Date: Newest first</option>
                    <option value="date-asc">Date: Oldest first</option>
                    <option value="time-desc">Time: Latest first</option>
                    <option value="time-asc">Time: Earliest first</option>
                    <option value="triage-asc">Triage: RED to BLACK</option>
                    <option value="triage-desc">Triage: BLACK to RED</option>
                    <option value="consultation-asc">Consultation: A-Z</option>
                    <option value="consultation-desc">Consultation: Z-A</option>
                    <option value="disposition-asc">Disposition: A-Z</option>
                    <option value="disposition-desc">Disposition: Z-A</option>
                  </select>
                </div>
              </div>

              <div className="list-controls-footer">
                <span className="text-muted text-xs">
                  Showing {triagedPatients.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                  {' '}to {Math.min(currentPage * PAGE_SIZE, triagedPatients.length)} of {triagedPatients.length} entries
                </span>
                <button className="btn btn-outline btn-small" type="button" onClick={resetFilters}>
                  Clear Filters
                </button>
              </div>
            </section>

            {triagedPatients.length === 0 ? (
              <div className="empty-state">No patients match the current ENC filters.</div>
            ) : (
              <>
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
                    {paginatedPatients.map((patient, index) => {
                      const record = records[patient.id];
                      const consultation = latestStatus(record, 'consultation');
                      const disposition = latestStatus(record, 'disposition');
                      const dispositionClass =
                        disposition === 'Pending' ? 'badge-default' : dispositionBadgeClass(disposition);
                      return (
                        <tr key={patient.id} className="triage-row clickable-row" onClick={() => onOpenPatient(patient.id)}>
                          <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                          <td>{formatIstDate(patient.timestamp, new Date(patient.timestamp).toLocaleDateString('en-IN'))}</td>
                          <td>{formatIstTime(patient.timestamp, patient.time)}</td>
                          <td><strong>{patient.name}</strong></td>
                          <td>{patient.age} / {patient.gender}</td>
                          <td>{patient.crNo}</td>
                          <td>{patient.pathway}</td>
                          <td><span className={`badge badge-${patient.category.toLowerCase()}`}>{patient.category}</span></td>
                          <td><span className={`badge ${consultation === 'Completed' ? 'badge-green' : 'badge-default'}`}>{consultation}</span></td>
                          <td><span className={`badge ${dispositionClass}`}>{disposition}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="pagination-bar">
                  <button
                    className="btn btn-outline btn-small"
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  >
                    Previous
                  </button>
                  <span className="pagination-status">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-small"
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
