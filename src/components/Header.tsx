import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangePasswordPayload } from '../types/triage';

type Props = {
  userDisplayName: string;
  designation: string;
  role: string;
  canManageStaff?: boolean;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  onChangePassword: (payload: ChangePasswordPayload) => Promise<string>;
};

function roleLabel(role: string) {
  if (role === 'emergency_nurse') return 'Emergency Nursing Coordinator';
  if (role === 'triage_officer') return 'Triage Officer';
  if (role === 'admin') return 'Admin';
  return role.replace(/_/g, ' ');
}

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  );
}

export function Header({
  userDisplayName,
  designation,
  role,
  canManageStaff = false,
  onLogout,
  onNavigate,
  onChangePassword,
}: Props) {
  const profileRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const initials = useMemo(() => initialsFromName(userDisplayName), [userDisplayName]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  const openPasswordPanel = () => {
    setMenuOpen(false);
    setPanelOpen(true);
    setError('');
    setSuccess('');
    setForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handlePasswordSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password must match.');
      setSuccess('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const message = await onChangePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(message);
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (submitError) {
      setSuccess('');
      setError(submitError instanceof Error ? submitError.message : 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-brand">
          <img src="/assets/aiims-raipur-logo.png" alt="AIIMS Raipur logo" className="header-logo-img" />
          <div className="header-text">
            <div className="header-title" onClick={() => onNavigate('/triage-list')}>
              Project ADiTI
            </div>
            <div className="header-subtitle hidden-mobile">
              Automated Digital Interface for Triage in Indian Emergency Departments
            </div>
          </div>
        </div>

        <nav className="header-nav">
          <button className="btn btn-small btn-ghost" onClick={() => onNavigate('/triage-list')}>
            Triage
          </button>
          <button className="btn btn-small btn-ghost" onClick={() => onNavigate('/enc-list')}>
            ENC
          </button>
          {canManageStaff && (
            <button className="btn btn-small btn-ghost" onClick={() => onNavigate('/staff')}>
              Staff
            </button>
          )}
        </nav>

        <div className="header-actions">
          <div className="profile-menu" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setMenuOpen((previous) => !previous)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="profile-avatar">{initials}</span>
              <span className="header-user">
                <strong>{userDisplayName}</strong>
                <small>{designation || roleLabel(role)}</small>
              </span>
              <span className="profile-caret" aria-hidden="true">v</span>
            </button>

            {menuOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-section">
                  <span className="profile-dropdown-label">Role</span>
                  <strong>{roleLabel(role)}</strong>
                </div>
                <button type="button" className="profile-dropdown-item" onClick={openPasswordPanel}>
                  Change Password
                </button>
                <button
                  type="button"
                  className="profile-dropdown-item profile-dropdown-item-danger"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {panelOpen && (
        <div className="profile-panel-backdrop" onClick={() => setPanelOpen(false)}>
          <section className="profile-panel" onClick={(event) => event.stopPropagation()}>
            <div className="profile-panel-header">
              <div>
                <h3>Change Password</h3>
                <p className="text-muted text-xs">
                  Update your access password for the clinical workflow system.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => setPanelOpen(false)}
                aria-label="Close change password panel"
              >
                x
              </button>
            </div>

            <div className="input-group mt-2">
              <label>Current Password</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, currentPassword: event.target.value }))
                }
              />
            </div>

            <div className="input-group mt-2">
              <label>New Password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, newPassword: event.target.value }))
                }
              />
            </div>

            <div className="input-group mt-2">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
                }
              />
            </div>

            {error && <div className="auth-error mt-2">{error}</div>}
            {success && <div className="note-box mt-2">{success}</div>}

            <div className="profile-panel-actions mt-2">
              <button type="button" className="btn btn-outline" onClick={() => setPanelOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={loading} onClick={handlePasswordSubmit}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
