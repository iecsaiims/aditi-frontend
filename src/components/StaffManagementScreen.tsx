import type { StaffCreatePayload } from '../types/triage';

type Props = {
  form: StaffCreatePayload;
  loading: boolean;
  error: string;
  success: string;
  onChange: <K extends keyof StaffCreatePayload>(field: K, value: StaffCreatePayload[K]) => void;
  onSubmit: () => void;
};

export function StaffManagementScreen({ form, loading, error, success, onChange, onSubmit }: Props) {
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
    </main>
  );
}
