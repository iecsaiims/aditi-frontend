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
        <h1 className="auth-main-title">Project ADiTI</h1>
        <div className="auth-sub-title">
          Automated Digital Interface for Triage in Indian Emergency Departments
        </div>
      </div>

      <div className="auth-card">
        <div className="form-group">
          <label>Email</label>
          <div className="input-wrapper">
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="staff@hospital.org"
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
              placeholder="Enter password"
            />
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
        <div className="copyright">Copyright 2026 PROJECT ADiTI. All rights reserved.</div>
      </div>
    </div>
  );
}
