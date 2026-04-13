import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import type { StaffBatchResult, StaffCreatePayload } from '../types/triage';

type Props = {
  form: StaffCreatePayload;
  loading: boolean;
  error: string;
  success: string;
  batchLoading: boolean;
  batchError: string;
  batchResult: StaffBatchResult | null;
  onChange: <K extends keyof StaffCreatePayload>(field: K, value: StaffCreatePayload[K]) => void;
  onSubmit: () => void;
  onBatchSubmit: (users: StaffCreatePayload[]) => void;
};

const REQUIRED_COLUMNS = ['name', 'email', 'password', 'designation', 'role'] as const;

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseStaffCsv(text: string): StaffCreatePayload[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('Add a header row and at least one staff record to import.');
  }

  const headers = parseCsvLine(lines[0]).map((value) => value.toLowerCase());
  const columnMap = new Map(headers.map((header, index) => [header, index]));

  for (const column of REQUIRED_COLUMNS) {
    if (!columnMap.has(column)) {
      throw new Error(`CSV is missing the "${column}" column.`);
    }
  }

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const entry = {
      name: values[columnMap.get('name') ?? -1]?.trim() ?? '',
      email: values[columnMap.get('email') ?? -1]?.trim() ?? '',
      password: values[columnMap.get('password') ?? -1]?.trim() ?? '',
      designation: values[columnMap.get('designation') ?? -1]?.trim() ?? '',
      role: values[columnMap.get('role') ?? -1]?.trim() ?? '',
    };

    if (!entry.name || !entry.email || !entry.password || !entry.designation || !entry.role) {
      throw new Error(`Row ${rowIndex + 2} has one or more empty required values.`);
    }

    return entry;
  });
}

export function StaffManagementScreen({
  form,
  loading,
  error,
  success,
  batchLoading,
  batchError,
  batchResult,
  onChange,
  onSubmit,
  onBatchSubmit,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvText, setCsvText] = useState('');
  const [csvPreviewCount, setCsvPreviewCount] = useState(0);
  const [csvParseError, setCsvParseError] = useState('');

  const batchSummary = useMemo(() => {
    if (!batchResult) return '';
    const createdCount = batchResult.createdUsers.length;
    const failedCount = batchResult.errors.length;
    if (!createdCount && !failedCount) return '';
    if (!failedCount) return `Imported ${createdCount} staff account${createdCount === 1 ? '' : 's'}.`;
    return `Imported ${createdCount} staff account${createdCount === 1 ? '' : 's'} with ${failedCount} row error${failedCount === 1 ? '' : 's'}.`;
  }, [batchResult]);

  const handleImport = () => {
    try {
      setCsvParseError('');
      const parsed = parseStaffCsv(csvText);
      setCsvPreviewCount(parsed.length);
      onBatchSubmit(parsed);
    } catch (parseError) {
      setCsvPreviewCount(0);
      setCsvParseError(parseError instanceof Error ? parseError.message : 'Could not parse the CSV data.');
    }
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);

    try {
      const parsed = parseStaffCsv(text);
      setCsvPreviewCount(parsed.length);
      setCsvParseError('');
    } catch (parseError) {
      setCsvPreviewCount(0);
      setCsvParseError(parseError instanceof Error ? parseError.message : 'Could not parse the CSV file.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <main className="view">
      <div className="view-header">
        <div>
          <h2>Staff Management</h2>
          <p className="text-muted text-xs">Create hospital staff accounts. Public signup is disabled.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Create Staff Account</h3>
        <div className="grid-2 mt-2">
          <div className="input-group">
            <label>Name</label>
            <input value={form.name} onChange={(event) => onChange('name', event.target.value)} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(event) => onChange('password', event.target.value)} />
          </div>
          <div className="input-group">
            <label>Role</label>
            <select value={form.role} onChange={(event) => onChange('role', event.target.value)}>
              <option value="triage_officer">Triage Officer</option>
              <option value="emergency_nurse">Emergency Nursing Coordinator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="input-group full-width">
            <label>Designation</label>
            <input value={form.designation} onChange={(event) => onChange('designation', event.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary mt-2" type="button" onClick={onSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Staff Account'}
        </button>

        {error && <div className="auth-error mt-2">{error}</div>}
        {success && <div className="note-box mt-2">{success}</div>}
      </section>

      <section className="form-section">
        <div className="section-header-flex">
          <div>
            <h3>Bulk Staff Import</h3>
            <p className="text-muted text-xs">Upload or paste CSV data and the backend will hash every password before storing staff accounts.</p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-small"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose CSV File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="visually-hidden"
            onChange={handleFileSelected}
          />
        </div>

        <div className="input-group mt-2">
          <label>CSV Content</label>
          <textarea
            className="csv-textarea"
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            placeholder={'name,email,password,designation,role\nSandeep Kumar,sandeep@hospital.org,Sandeep@123,Triage Officer,triage_officer'}
          />
          <p className="text-muted text-xs mt-1">
            Required columns: <code>name,email,password,designation,role</code>
          </p>
          {csvPreviewCount > 0 && <p className="text-muted text-xs mt-1">Ready to import {csvPreviewCount} staff account{csvPreviewCount === 1 ? '' : 's'}.</p>}
        </div>

        <button className="btn btn-primary mt-2" type="button" onClick={handleImport} disabled={batchLoading}>
          {batchLoading ? 'Importing...' : 'Import Staff from CSV'}
        </button>

        {csvParseError && <div className="auth-error mt-2">{csvParseError}</div>}
        {batchError && <div className="auth-error mt-2">{batchError}</div>}
        {batchSummary && <div className="note-box mt-2">{batchSummary}</div>}

        {batchResult && batchResult.errors.length > 0 && (
          <div className="import-results mt-2">
            <h4>Rows Needing Attention</h4>
            <div className="import-result-list">
              {batchResult.errors.map((item) => (
                <div key={`${item.row}-${item.email}`} className="import-result-item">
                  <strong>Row {item.row}</strong>
                  <span>{item.email || 'No email supplied'}</span>
                  <small>{item.message}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
