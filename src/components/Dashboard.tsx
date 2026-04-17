import { useMemo, useState } from 'react';
import type { Patient, TriageCategory } from '../types/triage';
import { formatIstDateFilterValue, formatIstTime, istTimeToMinutes } from '../utils/dateTime';

type Props = {
  patients: Patient[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onNewTriage: () => void;
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
  | 'triage-desc';

export function Dashboard({ patients, loading, error, onRetry, onNewTriage }: Props) {
  const [dateFilter, setDateFilter] = useState('');
  const [triageFilter, setTriageFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [page, setPage] = useState(1);

  const filteredPatients = useMemo(() => {
    const normalizedTimeFilter = timeFilter.trim();
    const next = patients.filter((patient) => {
      const patientDate = formatIstDateFilterValue(patient.timestamp);
      const patientTime = formatIstTime(patient.timestamp, patient.time);
      const matchesDate = !dateFilter || patientDate === dateFilter;
      const matchesTriage = !triageFilter || patient.category === triageFilter;
      const matchesTime =
        !normalizedTimeFilter ||
        patientTime.toLowerCase().includes(normalizedTimeFilter.toLowerCase());
      return matchesDate && matchesTriage && matchesTime;
    });

    return [...next].sort((left, right) => {
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
        default:
          return 0;
      }
    });
  }, [dateFilter, patients, sortBy, timeFilter, triageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => {
    setDateFilter('');
    setTriageFilter('');
    setTimeFilter('');
    setSortBy('date-desc');
    setPage(1);
  };

  return (
    <main id="dashboard-view" className="view active">
      <div className="view-header">
        <div>
          <h2>Active Patients</h2>
          <p className="text-muted text-xs">Filter, sort, and review the latest triaged patients.</p>
        </div>
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
          <>
            <section className="list-controls-panel">
              <div className="list-controls-grid">
                <div className="input-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="input-group">
                  <label>Triage</label>
                  <select
                    value={triageFilter}
                    onChange={(event) => {
                      setTriageFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All categories</option>
                    <option value="RED">RED</option>
                    <option value="YELLOW">YELLOW</option>
                    <option value="GREEN">GREEN</option>
                    <option value="BLACK">BLACK</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 15:03"
                    value={timeFilter}
                    onChange={(event) => {
                      setTimeFilter(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="input-group">
                  <label>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(event) => {
                      setSortBy(event.target.value as SortOption);
                      setPage(1);
                    }}
                  >
                    <option value="date-desc">Date: Newest first</option>
                    <option value="date-asc">Date: Oldest first</option>
                    <option value="time-desc">Time: Latest first</option>
                    <option value="time-asc">Time: Earliest first</option>
                    <option value="triage-asc">Triage: RED to BLACK</option>
                    <option value="triage-desc">Triage: BLACK to RED</option>
                  </select>
                </div>
              </div>

              <div className="list-controls-footer">
                <span className="text-muted text-xs">
                  Showing {filteredPatients.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                  {' '}to {Math.min(currentPage * PAGE_SIZE, filteredPatients.length)} of {filteredPatients.length} entries
                </span>
                <button className="btn btn-outline btn-small" type="button" onClick={resetFilters}>
                  Clear Filters
                </button>
              </div>
            </section>

            {filteredPatients.length === 0 ? (
              <div className="empty-state">No patients match the current filters.</div>
            ) : (
              <>
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
                    {paginatedPatients.map((patient) => (
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
                            <strong>{formatIstTime(patient.timestamp, patient.time)}</strong>
                          </small>
                        </td>
                      </tr>
                    ))}
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
