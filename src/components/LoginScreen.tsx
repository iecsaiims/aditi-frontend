import type { LoginPayload } from '../types/triage.js';

type Props = {
  form: LoginPayload;
  onChange: (field: keyof LoginPayload, value: string | boolean) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
};

export function LoginScreen({ form, onChange, onSubmit, loading, error }: Props) {
  return (
    <div id="auth-screen" className="screen active auth-redesign">
      <div className="auth-header-wrapper">
        <img src="/assets/aiims-raipur-logo.png" alt="AIIMS Raipur logo" className="auth-logo-img" />
        <h1 className="auth-main-title">project aditi</h1>
        <div className="auth-sub-title">
          Automated Digital Interface for Triage in Indian Emergency Departments
        </div>
      </div>

      <div className="auth-card">
        <div className="form-group">
          <label>Username / Triage ID</label>
          <div className="input-wrapper">
            <input
              type="text"
              value={form.username}
              onChange={(e) => onChange('username', e.target.value)}
              placeholder="Username"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="label-flex">
            <label>Access Password</label>
            <a href="#" className="forgot-link">
              Forgot Password?
            </a>
          </div>
          <div className="input-wrapper">
            <input
              type="password"
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
              placeholder="Enter PIN"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Select Role</label>
          <div className="input-wrapper">
            <select value={form.role} onChange={(e) => onChange('role', e.target.value)}>
              <option value="">Choose your role...</option>
              <option value="triage_officer">Triage Officer</option>
              <option value="emergency_nurse">Emergency Nursing Coordinator</option>
            </select>
          </div>
        </div>

        <div className="remember-group">
          <label className="custom-checkbox">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(e) => onChange('rememberMe', e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="cb-label">Keep me logged in</span>
          </label>
        </div>

        <button id="login-btn" className="btn btn-auth-submit" onClick={onSubmit} disabled={loading}>
          {loading ? 'Logging in...' : 'Verify and Login'}
        </button>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-info-box">
          <span className="info-icon">!</span>
          <p>Protected emergency workflow system. Access is role-based and operational events are recorded.</p>
        </div>
      </div>

      <div className="auth-footer">
        <div className="footer-links">
          <a href="#">Privacy Policy</a> <span className="sep">|</span>
          <a href="#">Terms of Service</a> <span className="sep">|</span>
          <a href="#">Tech Support</a>
        </div>
        <div className="copyright">© 2026 PROJECT ADiTI. ALL RIGHTS RESERVED.</div>
      </div>
    </div>
  );
}
