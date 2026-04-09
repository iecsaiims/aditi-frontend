import { useEffect, useMemo, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { EncDesk } from './components/EncDesk';
import { EncList } from './components/EncList';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { TriageForm, buildEvaluationInput, type ChecklistField, type FormState } from './components/TriageForm';
import { api } from './services/api.js';
import type { EncRecord, LoginPayload, LoginResponse, Patient, TriageCategory } from './types/triage';
import { evaluateTriage, mapCategoryToArea } from './utils/triageLogic';

type AppRoute =
  | { page: 'triage-list' }
  | { page: 'triage-new' }
  | { page: 'enc-list' }
  | { page: 'enc-desk'; patientId: string };

const initialLoginForm: LoginPayload = {
  username: 'operator@aditi.org',
  password: '1234',
  role: 'triage_officer',
  rememberMe: true
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
  if (path === '/triage/new') return { page: 'triage-new' };
  return { page: 'triage-list' };
}

function landingForRole(role: string) {
  return role === 'emergency_nurse' ? '/enc-list' : '/triage-list';
}

const SESSION_STORAGE_KEY = 'project-aditi-session';

function readStoredUser(): LoginResponse['user'] | null {
  const rawSession =
    window.localStorage.getItem(SESSION_STORAGE_KEY) ??
    window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as LoginResponse['user'];
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function storeUserSession(user: LoginResponse['user'], rememberMe: boolean) {
  const targetStorage = rememberMe ? window.localStorage : window.sessionStorage;
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(SESSION_STORAGE_KEY);
  targetStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

function clearUserSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

function App() {
  const [loginForm, setLoginForm] = useState<LoginPayload>(initialLoginForm);
  const [user, setUser] = useState<LoginResponse['user'] | null>(() => readStoredUser());
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encRecords, setEncRecords] = useState<Record<string, EncRecord>>({});
  const [triageForm, setTriageForm] = useState<FormState>(initialTriageForm);
  const [categoryOverridden, setCategoryOverridden] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState('');

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
  const canSubmit = Boolean(
    triageForm.crNo &&
    triageForm.patientName.trim() &&
    triageForm.patientAge &&
    Number.isFinite(patientAgeNumber) &&
    patientAgeNumber >= 0 &&
    triageForm.patientGender &&
    triageForm.contactNumber.trim() &&
    triageForm.pulse &&
    triageForm.sbp &&
    triageForm.spo2 &&
    triageForm.rr &&
    triageForm.finalCategory
  );

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      setLoginError('');
      const response = await api.login(loginForm);
      const resolvedUser = {
        ...response.user,
        role: response.user.role || loginForm.role,
        displayName: response.user.displayName || loginForm.username
      };
      setUser(resolvedUser);
      storeUserSession(resolvedUser, loginForm.rememberMe);
      navigate(landingForRole(resolvedUser.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    setUser(null);
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
    navigate('/triage/new');
  };

  const handleSubmitTriage = async () => {
    const finalCategory = triageForm.finalCategory as TriageCategory;
    const now = new Date();
    const payload: Omit<Patient, 'id'> = {
      crNo: triageForm.crNo,
      name: triageForm.patientName,
      age: Number(triageForm.patientAge),
      gender: triageForm.patientGender,
      category: finalCategory,
      area: mapCategoryToArea(finalCategory),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.toISOString(),
      complaint: triageForm.complaintText,
      pathway: triageForm.pathway,
      triageData: buildEvaluationInput(triageForm),
      consultationStatus: 'Pending',
      dispositionStatus: 'Pending'
    };

    let created;
    try {
      created = await api.createPatient(payload);
    } catch (error) {
      console.error('POST /patients failed:', error);
      alert('Failed to save patient to backend');
      return;
    }
    setPatients((previous) => [created, ...previous]);
    setTriageForm(initialTriageForm);
    setCategoryOverridden(false);
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
        role={user.role}
        onLogout={handleLogout}
        onNavigate={navigate}
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
    </div>
  );
}

export default App;
