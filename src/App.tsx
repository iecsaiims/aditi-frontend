import { useEffect, useMemo, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { EncDesk } from './components/EncDesk';
import { EncList } from './components/EncList';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { StaffManagementScreen } from './components/StaffManagementScreen';
import {
  TriageForm,
  buildEvaluationInput,
  getVitalValidationMessage,
  type ChecklistField,
  type FormState
} from './components/TriageForm';
import { api, SESSION_STORAGE_KEY } from './services/api';
import type {
  ChangePasswordPayload,
  CreatePatientPayload,
  EncRecord,
  LoginPayload,
  Patient,
  StaffBatchResult,
  StaffCreatePayload,
  StoredSession,
  TriageCategory
} from './types/triage';
import { evaluateTriage, mapCategoryToArea } from './utils/triageLogic';

type AppRoute =
  | { page: 'triage-list' }
  | { page: 'triage-new' }
  | { page: 'enc-list' }
  | { page: 'enc-desk'; patientId: string }
  | { page: 'staff' };

const initialLoginForm: LoginPayload = {
  email: '',
  password: '',
  rememberMe: true
};

const initialStaffForm: StaffCreatePayload = {
  name: '',
  email: '',
  password: '',
  designation: 'Triage Officer',
  role: 'triage_officer'
};

const initialTriageForm: FormState = {
  crNo: '',
  patientName: '',
  patientAge: '',
  patientGender: 'M',
  contactNumber: '',
  presentation: 'Direct',
  arrival: 'Self',
  complaintText: '',
  isResponsive: true,
  isAcute: false,
  severePain: false,
  acuteDistress: false,
  pulse: '',
  sbp: '',
  dbp: '',
  spo2: '',
  rr: '',
  respiratorySupport: '',
  temp: 'Afebrile',
  consciousness: 'Alert',
  pathway: 'NonTrauma',
  redPhysioCheckboxes: [],
  ntImmediateRed: [],
  ntBleeding: [],
  ntTimeSensitive: [],
  ntFeverDanger: [],
  ntMinorLowRisk: [],
  noneOfTheAbove: false,
  traumaAnatomy: [],
  traumaMechanism: [],
  traumaSpecial: [],
  ncctHead: [],
  tAmbulatory: null,
  tNotAnticoag: null,
  finalCategory: ''
};

function parseRoute(path = window.location.pathname): AppRoute {
  if (path.startsWith('/enc/patient/')) {
    return { page: 'enc-desk', patientId: decodeURIComponent(path.replace('/enc/patient/', '')) };
  }
  if (path === '/enc-list' || path === '/enc') return { page: 'enc-list' };
  if (path === '/staff') return { page: 'staff' };
  if (path === '/triage/new') return { page: 'triage-new' };
  return { page: 'triage-list' };
}

function landingForRole(role: string) {
  if (role === 'admin') return '/staff';
  return role === 'emergency_nurse' ? '/enc-list' : '/triage-list';
}

function readStoredSession(): StoredSession | null {
  const rawSession =
    window.localStorage.getItem(SESSION_STORAGE_KEY) ??
    window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as StoredSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function storeAuthSession(session: StoredSession, rememberMe: boolean) {
  const targetStorage = rememberMe ? window.localStorage : window.sessionStorage;
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(SESSION_STORAGE_KEY);
  targetStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearAuthSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

function App() {
  const [loginForm, setLoginForm] = useState<LoginPayload>(initialLoginForm);
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encRecords, setEncRecords] = useState<Record<string, EncRecord>>({});
  const [triageForm, setTriageForm] = useState<FormState>(initialTriageForm);
  const [staffForm, setStaffForm] = useState<StaffCreatePayload>(initialStaffForm);
  const [categoryOverridden, setCategoryOverridden] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [batchResult, setBatchResult] = useState<StaffBatchResult | null>(null);
  const [triageSubmitError, setTriageSubmitError] = useState('');
  const [triageSubmitting, setTriageSubmitting] = useState(false);

  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState('');
  const user = session?.user ?? null;

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(parseRoute(path));
  };

  useEffect(() => {
    if (!user) return;

    if (window.location.pathname === '/' || window.location.pathname === '/login') {
      navigate(landingForRole(user.role));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (route.page === 'staff' && user.role !== 'admin') {
      navigate(landingForRole(user.role));
    }
  }, [route.page, user]);

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadPatients = async () => {
    try {
      setPatientsLoading(true);
      setPatientsError('');
      const response = await api.getPatients();
      setPatients(response);
      const records = await Promise.all(
        response.map(async (patient) => {
          try {
            return await api.getEncRecord(patient.id);
          } catch {
            return { patientId: patient.id, calls: [] } satisfies EncRecord;
          }
        })
      );
      setEncRecords(Object.fromEntries(records.map((record) => [record.patientId, record])));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load patients from backend';
      setPatients([]);
      setPatientsError(message);
      console.error('GET /patients failed:', error);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    void loadPatients();
  }, [user]);

  const requiredVitalsMissing = useMemo(
    () => !triageForm.pulse || !triageForm.sbp || !triageForm.spo2 || !triageForm.rr,
    [triageForm.pulse, triageForm.sbp, triageForm.spo2, triageForm.rr]
  );

  const evaluation = useMemo(() => {
    const input = buildEvaluationInput(triageForm);
    return evaluateTriage(input);
  }, [triageForm]);

  const shouldHoldAutoCategory = requiredVitalsMissing && evaluation.category !== 'RED';

  useEffect(() => {
    if (categoryOverridden) return;

    setTriageForm((previous) => {
      const nextCategory = shouldHoldAutoCategory ? '' : evaluation.category;
      return previous.finalCategory === nextCategory
        ? previous
        : { ...previous, finalCategory: nextCategory };
    });
  }, [categoryOverridden, evaluation.category, shouldHoldAutoCategory]);

  const patientAgeNumber = Number(triageForm.patientAge);
  const hasVitalValidationErrors =
    Boolean(getVitalValidationMessage('pulse', triageForm.pulse)) ||
    Boolean(getVitalValidationMessage('sbp', triageForm.sbp)) ||
    Boolean(getVitalValidationMessage('dbp', triageForm.dbp)) ||
    Boolean(getVitalValidationMessage('spo2', triageForm.spo2)) ||
    Boolean(getVitalValidationMessage('rr', triageForm.rr));
  const canSubmit = Boolean(
    triageForm.crNo &&
    triageForm.patientName.trim() &&
    triageForm.patientAge &&
    Number.isFinite(patientAgeNumber) &&
    patientAgeNumber >= 0 &&
    triageForm.patientGender &&
    triageForm.contactNumber.trim() &&
    triageForm.complaintText.trim() &&
    triageForm.pulse &&
    triageForm.sbp &&
    triageForm.dbp &&
    triageForm.spo2 &&
    triageForm.rr &&
    triageForm.respiratorySupport &&
    triageForm.temp &&
    triageForm.consciousness &&
    !hasVitalValidationErrors &&
    triageForm.finalCategory
  );

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      setLoginError('');
      const response = await api.login(loginForm);
      const nextSession = { token: response.token, user: response.user };
      setSession(nextSession);
      storeAuthSession(nextSession, loginForm.rememberMe);
      navigate(landingForRole(response.user.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    setRoute({ page: 'triage-list' });
    window.history.pushState({}, '', '/login');
  };

  const updateTriageField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    if (field === 'finalCategory') {
      setCategoryOverridden(true);
    }

    setTriageForm((previous) => {
      if (field === 'isResponsive' && value === true) {
        return { ...previous, isResponsive: true, isAcute: false };
      }

      if (field === 'noneOfTheAbove' && value === true) {
        return {
          ...previous,
          noneOfTheAbove: true,
          ntImmediateRed: [],
          ntBleeding: [],
          ntTimeSensitive: [],
          ntFeverDanger: [],
          ntMinorLowRisk: []
        };
      }

      return { ...previous, [field]: value };
    });
  };

  const toggleListValue = (field: ChecklistField, value: string) => {
    setTriageForm((previous) => {
      const list = previous[field];
      const nextList = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];

      const next: FormState = {
        ...previous,
        [field]: nextList
      };

      if (
        ['ntImmediateRed', 'ntBleeding', 'ntTimeSensitive', 'ntFeverDanger', 'ntMinorLowRisk'].includes(field) &&
        nextList.length > 0
      ) {
        next.noneOfTheAbove = false;
      }

      return next;
    });
  };

  const handleFetchVitals = () => {
    setTriageForm((previous) => ({
      ...previous,
      pulse: '88',
      sbp: '120',
      dbp: '80',
      spo2: '98',
      rr: '16',
      temp: 'Afebrile'
    }));
  };

  const handleAutoFillPatient = () => {
    setTriageForm((previous) => ({
      ...previous,
      crNo: '10293',
      patientName: 'Ravi Kumar',
      patientAge: '45',
      patientGender: 'M',
      contactNumber: '9876543210'
    }));
  };

  const handleNewTriage = () => {
    setTriageForm(initialTriageForm);
    setCategoryOverridden(false);
    setTriageSubmitError('');
    navigate('/triage/new');
  };

  const handleSubmitTriage = async () => {
    if (triageSubmitting) return;

    const finalCategory = triageForm.finalCategory as TriageCategory;
    const payload: CreatePatientPayload = {
      crNo: triageForm.crNo,
      name: triageForm.patientName,
      age: Number(triageForm.patientAge),
      gender: triageForm.patientGender,
      category: finalCategory,
      area: mapCategoryToArea(finalCategory),
      complaint: triageForm.complaintText,
      pathway: triageForm.pathway,
      contactNumber: triageForm.contactNumber.trim(),
      respiratorySupport: triageForm.respiratorySupport,
      triageData: buildEvaluationInput(triageForm),
      consultationStatus: 'Pending',
      dispositionStatus: 'Pending'
    };

    let created;
    try {
      setTriageSubmitting(true);
      setTriageSubmitError('');
      created = await api.createPatient(payload);
    } catch (error) {
      console.error('POST /patients failed:', error);
      setTriageSubmitError(
        error instanceof Error ? error.message : 'Failed to save patient to backend.'
      );
      return;
    } finally {
      setTriageSubmitting(false);
    }
    setPatients((previous) => [created, ...previous]);
    setTriageForm(initialTriageForm);
    setCategoryOverridden(false);
    setTriageSubmitError('');
    navigate('/triage-list');
  };

  const saveConsultation = async (patientId: string, call: EncRecord['calls'][number]) => {
    try {
      await api.saveEncConsultation(patientId, call);
    } catch (error) {
      console.error('POST /enc consultation failed:', error);
      alert('Failed to save consultation to backend');
      return;
    }

    setEncRecords((previous) => {
      const current = previous[patientId] ?? { patientId, calls: [] };
      return {
        ...previous,
        [patientId]: { ...current, calls: [...current.calls, call] }
      };
    });
  };

  const saveDisposition = async (patientId: string, disposition: NonNullable<EncRecord['disposition']>) => {
    try {
      await api.saveEncDisposition(patientId, disposition);
    } catch (error) {
      console.error('POST /enc disposition failed:', error);
      alert('Failed to save disposition to backend');
      return;
    }

    setEncRecords((previous) => {
      const current = previous[patientId] ?? { patientId, calls: [] };
      return {
        ...previous,
        [patientId]: { ...current, disposition }
      };
    });
  };

  const handleCreateStaff = async () => {
    try {
      setStaffLoading(true);
      setStaffError('');
      setStaffSuccess('');
      setBatchError('');
      setBatchResult(null);
      await api.createStaff(staffForm);
      setStaffSuccess(`Created staff account for ${staffForm.email}.`);
      setStaffForm(initialStaffForm);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create staff account.';
      setStaffError(message);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCreateStaffBatch = async (users: StaffCreatePayload[]) => {
    try {
      setBatchLoading(true);
      setBatchError('');
      setBatchResult(null);
      setStaffError('');
      setStaffSuccess('');
      const result = await api.createStaffBatch({ users });
      setBatchResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not import staff accounts.';
      setBatchError(message);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleChangePassword = async (payload: ChangePasswordPayload) => {
    const response = await api.changePassword(payload);
    return response.message;
  };

  if (!user) {
    return (
      <LoginScreen
        form={loginForm}
        onChange={(field, value) => setLoginForm((previous) => ({ ...previous, [field]: value }))}
        onSubmit={handleLogin}
        loading={loginLoading}
        error={loginError}
      />
    );
  }

  const currentPatient = route.page === 'enc-desk'
    ? patients.find((patient) => patient.id === route.patientId)
    : undefined;

  return (
    <div id="app-container">
      <Header
        userDisplayName={user.displayName}
        designation={user.designation}
        role={user.role}
        canManageStaff={user.role === 'admin'}
        onLogout={handleLogout}
        onNavigate={navigate}
        onChangePassword={handleChangePassword}
      />

      {route.page === 'triage-list' && (
        <Dashboard
          patients={patients}
          loading={patientsLoading}
          error={patientsError}
          onRetry={loadPatients}
          onNewTriage={handleNewTriage}
        />
      )}

      {route.page === 'triage-new' && (
        <TriageForm
          form={triageForm}
          evaluation={evaluation}
          requiredVitalsMissing={requiredVitalsMissing}
          canSubmit={canSubmit}
          submitting={triageSubmitting}
          submitError={triageSubmitError}
          onBack={() => setRoute({ page: 'triage-list' })}
          onSubmit={handleSubmitTriage}
          onFieldChange={updateTriageField}
          onToggleListValue={toggleListValue}
          onAutoFillPatient={handleAutoFillPatient}
          onFetchVitals={handleFetchVitals}
          onTranscribeAudio={api.transcribeAudio}
        />
      )}

      {route.page === 'enc-list' && (
        <EncList
          patients={patients}
          records={encRecords}
          loading={patientsLoading}
          error={patientsError}
          onRetry={loadPatients}
          onOpenPatient={(patientId) => navigate(`/enc/patient/${encodeURIComponent(patientId)}`)}
        />
      )}

      {route.page === 'enc-desk' && (
        <EncDesk
          patient={currentPatient}
          record={encRecords[route.patientId]}
          onBack={() => navigate('/enc-list')}
          onSaveConsultation={saveConsultation}
          onSaveDisposition={saveDisposition}
        />
      )}

      {route.page === 'staff' && user.role === 'admin' && (
        <StaffManagementScreen
          form={staffForm}
          loading={staffLoading}
          error={staffError}
          success={staffSuccess}
          batchLoading={batchLoading}
          batchError={batchError}
          batchResult={batchResult}
          onChange={(field, value) => setStaffForm((previous) => ({ ...previous, [field]: value }))}
          onSubmit={handleCreateStaff}
          onBatchSubmit={handleCreateStaffBatch}
        />
      )}
    </div>
  );
}

export default App;
