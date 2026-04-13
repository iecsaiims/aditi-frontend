type Props = {
  userDisplayName: string;
  role: string;
  canManageStaff?: boolean;
  onLogout: () => void;
  onNavigate: (path: string) => void;
};

function roleLabel(role: string) {
  if (role === 'emergency_nurse') return 'Emergency Nursing Coordinator';
  if (role === 'triage_officer') return 'Triage Officer';
  if (role === 'admin') return 'Admin';
  return role.replace(/_/g, ' ');
}

export function Header({ userDisplayName, role, canManageStaff = false, onLogout, onNavigate }: Props) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <img src="/assets/aiims-raipur-logo.png" alt="AIIMS Raipur logo" className="header-logo-img" />
        <div className="header-text">
          <div className="header-title" onClick={() => onNavigate('/triage-list')} >Project ADiTI</div>
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
        <span className="header-user">
          <strong>{userDisplayName}</strong>
          <small>{roleLabel(role)}</small>
        </span>
        <button className="btn btn-small btn-outline" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
