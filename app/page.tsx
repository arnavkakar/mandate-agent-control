"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Settings2,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  WalletCards,
  X,
  XCircle,
  Zap,
  Plug,
  KeyRound,
  Webhook,
  Copy,
  TerminalSquare,
  Database,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ApiAgent,
  ApiTransaction,
  DashboardSummary,
  loadSession,
  mandateApi,
  MandateApiError,
  MANDATE_API_URL,
  saveSession,
  Session,
} from "./lib/mandate-api";
import { AgentsLivePage, AuditLivePage, MandateLivePage } from "./live-pages";

type Decision = "APPROVED" | "APPROVAL_REQUIRED" | "DECLINED";
type View =
  | "Overview"
  | "Agents"
  | "Transactions"
  | "Approvals"
  | "Risk Activity"
  | "Audit Trail"
  | "Simulator"
  | "Connections"
  | "Create Mandate";

type Tx = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  agent: string;
  time: string;
  decision: Decision;
  policyDecision?: Decision;
  approvalStatus?: ApiTransaction["approvalStatus"];
  risk: number;
  country: string;
  isNew: boolean;
  reason: string;
  factors: string[];
  approvalRequestId?: string | null;
  policyRules?: {
    rule: string;
    outcome: "PASS" | "REVIEW" | "FAIL";
    reason: string;
  }[];
};

const seedTransactions: Tx[] = [
  {
    id: "TX-8F21",
    merchant: "Notion",
    category: "Software",
    amount: 96,
    agent: "Procurement Agent",
    time: "Today, 10:42 AM",
    decision: "APPROVED",
    risk: 12,
    country: "US",
    isNew: false,
    reason: "Within autonomous limit and matches all mandate rules.",
    factors: [],
  },
  {
    id: "TX-8F20",
    merchant: "AWS",
    category: "Cloud services",
    amount: 212,
    agent: "Engineering Ops",
    time: "Today, 9:18 AM",
    decision: "APPROVED",
    risk: 18,
    country: "US",
    isNew: false,
    reason: "Known merchant, allowed category, and within budget.",
    factors: [],
  },
  {
    id: "TX-8F19",
    merchant: "Apple",
    category: "Office equipment",
    amount: 899,
    agent: "Procurement Agent",
    time: "Yesterday, 4:33 PM",
    decision: "APPROVAL_REQUIRED",
    risk: 46,
    country: "US",
    isNew: true,
    reason: "Amount exceeds autonomous limit and merchant is new.",
    factors: ["New merchant", "Amount anomaly"],
  },
  {
    id: "TX-8F18",
    merchant: "Binance",
    category: "Crypto",
    amount: 600,
    agent: "Growth Agent",
    time: "Yesterday, 2:05 PM",
    decision: "DECLINED",
    risk: 92,
    country: "KY",
    isNew: true,
    reason: "Merchant category and international geography are blocked.",
    factors: ["Blocked category", "Geography mismatch", "New merchant"],
  },
  {
    id: "TX-8F17",
    merchant: "Delta",
    category: "Travel",
    amount: 389,
    agent: "Travel Coordinator",
    time: "Aug 8, 11:21 AM",
    decision: "APPROVAL_REQUIRED",
    risk: 38,
    country: "US",
    isNew: false,
    reason: "Amount exceeds the $300 travel approval threshold.",
    factors: ["Approval threshold"],
  },
  {
    id: "TX-8F16",
    merchant: "Meta Ads",
    category: "Advertising",
    amount: 340,
    agent: "Growth Agent",
    time: "Aug 8, 8:54 AM",
    decision: "APPROVED",
    risk: 22,
    country: "US",
    isNew: false,
    reason: "Known merchant and allowed advertising spend.",
    factors: ["Elevated velocity"],
  },
];

const agents = [
  {
    name: "Procurement Agent",
    purpose: "Software & office purchasing",
    spent: 1211,
    budget: 2000,
    status: "Active",
    color: "#6C5CE7",
    initials: "PA",
    limit: 250,
  },
  {
    name: "Growth Agent",
    purpose: "Paid acquisition & experiments",
    spent: 2184,
    budget: 5000,
    status: "Active",
    color: "#087F6B",
    initials: "GA",
    limit: 500,
  },
  {
    name: "Travel Coordinator",
    purpose: "Team travel & accommodation",
    spent: 1238,
    budget: 3000,
    status: "Active",
    color: "#95651B",
    initials: "TC",
    limit: 300,
  },
  {
    name: "Engineering Ops",
    purpose: "Cloud & developer tooling",
    spent: 1182,
    budget: 4000,
    status: "Paused",
    color: "#626C67",
    initials: "EO",
    limit: 350,
  },
];

const nav: { label: View; icon: any; count?: number }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Agents", icon: Bot },
  { label: "Transactions", icon: WalletCards },
  { label: "Approvals", icon: UserCheck, count: 2 },
  { label: "Risk Activity", icon: ShieldAlert },
  { label: "Audit Trail", icon: FileText },
  { label: "Simulator", icon: Zap },
  { label: "Connections", icon: Plug },
];

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function StatusPill({ value }: { value: Decision }) {
  const label =
    value === "APPROVAL_REQUIRED"
      ? "Needs approval"
      : value === "APPROVED"
        ? "Approved"
        : "Declined";
  return (
    <span className={`pill ${value.toLowerCase()}`}>
      <span className="pill-dot" />
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  delta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  icon: any;
  tone: string;
}) {
  return (
    <div className="metric card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-delta ${delta.startsWith("+") ? "up" : ""}`}>
        {delta}
      </div>
    </div>
  );
}

function AppLogo() {
  return (
    <div className="logo">
      <div className="logo-mark">
        <LockKeyhole size={17} />
      </div>
      <span>mandate</span>
    </div>
  );
}

type GoogleCredentialResponse = { credential?: string };

function GoogleAuthButton({
  mode,
  onAuthenticated,
  onError,
}: {
  mode: "login" | "signup";
  onAuthenticated: (session: Session) => void;
  onError: (message: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function mount() {
      try {
        const config = await mandateApi.googleConfig();
        if (cancelled || !config.enabled || !config.clientId) return;
        if (!document.querySelector("script[data-mandate-google]")) {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.dataset.mandateGoogle = "true";
          document.head.appendChild(script);
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Google Identity Services failed to load"));
          });
        } else if (!window.google) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (cancelled || !window.google || !host.current) return;
        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: async (response: GoogleCredentialResponse) => {
            if (!response.credential) {
              onError("Google did not return a sign-in credential.");
              return;
            }
            try {
              onAuthenticated(await mandateApi.googleAuth(response.credential));
            } catch (cause) {
              onError(
                cause instanceof MandateApiError &&
                  cause.code === "ACCOUNT_LINKING_REQUIRED"
                  ? "This email already has a password account. Sign in with your password before linking Google."
                  : "Google sign-in could not be completed.",
              );
            }
          },
        });
        host.current.replaceChildren();
        window.google.accounts.id.renderButton(host.current, {
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "signin_with",
          width: 366,
        });
        setAvailable(true);
      } catch {
        // Environments without Google OAuth should fall back cleanly to email.
        // Credential and account-linking failures are still announced above.
        if (!cancelled) setAvailable(false);
      }
    }
    void mount();
    return () => {
      cancelled = true;
    };
  }, [mode, onAuthenticated, onError]);
  return (
    <div
      className={available ? "google-auth ready" : "google-auth"}
      aria-live="polite"
    >
      <div ref={host} />
      {available && (
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  useEffect(() => {
    setSession(loadSession());
    setSessionReady(true);
  }, []);
  useEffect(() => {
    const expire = () => {
      saveSession(null);
      setSession(null);
      setAuthNotice("Your session expired. Sign in again to continue.");
    };
    window.addEventListener("mandate:session-expired", expire);
    return () => window.removeEventListener("mandate:session-expired", expire);
  }, []);
  if (!sessionReady)
    return <div className="auth-loading">Loading Mandate…</div>;
  if (!session)
    return (
      <AuthPage
        notice={authNotice}
        onAuthenticated={(next) => {
          saveSession(next);
          setSession(next);
          setAuthNotice("");
        }}
      />
    );
  return (
    <Workspace
      session={session}
      onLogout={() => {
        saveSession(null);
        setSession(null);
        setAuthNotice("");
      }}
    />
  );
}

function AuthPage({
  onAuthenticated,
  notice,
}: {
  onAuthenticated: (session: Session) => void;
  notice?: string;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const rules = [
    { label: "12 or more characters", ok: password.length >= 12 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
    { label: "One number", ok: /\d/.test(password) },
  ];
  const signupValid =
    rules.every((rule) => rule.ok) && password === confirmation;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "signup" && !signupValid) {
      setError(
        "Complete every password requirement before creating your workspace.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const next =
        mode === "login"
          ? await mandateApi.login({
              email: String(form.get("email")),
              password,
            })
          : await mandateApi.signup({
              name: String(form.get("name")),
              organizationName: String(form.get("organizationName")),
              email: String(form.get("email")),
              password,
            });
      onAuthenticated(next);
    } catch (cause) {
      setError(
        cause instanceof MandateApiError
          ? cause.code === "INVALID_CREDENTIALS"
            ? "Email or password is incorrect."
            : cause.code === "EMAIL_ALREADY_EXISTS"
              ? "An account already uses this email."
              : "Could not complete this request."
          : "Could not reach the Mandate API.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-shell">
      <section className="auth-card card">
        <AppLogo />
        <span className="kicker">PRODUCTION CONTROL CENTER</span>
        <h1>
          {mode === "login" ? "Sign in to Mandate" : "Create your workspace"}
        </h1>
        <p>
          Manage deterministic authorization for every agent purchase request.
        </p>
        {notice && (
          <div className="auth-notice" role="status">
            {notice}
          </div>
        )}
        <GoogleAuthButton
          mode={mode}
          onAuthenticated={onAuthenticated}
          onError={setError}
        />
        <form onSubmit={submit}>
          {mode === "signup" && (
            <>
              <label>
                Your name
                <input required name="name" minLength={2} autoComplete="name" />
              </label>
              <label>
                Organization
                <input required name="organizationName" minLength={2} />
              </label>
            </>
          )}
          <label>
            Email
            <input required name="email" type="email" autoComplete="email" />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                required
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={passwordVisible ? "text" : "password"}
                minLength={mode === "signup" ? 12 : 1}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                aria-describedby={
                  mode === "signup" ? "password-rules" : undefined
                }
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((value) => !value)}
              >
                {passwordVisible ? (
                  <EyeOff aria-hidden="true" size={18} />
                ) : (
                  <Eye aria-hidden="true" size={18} />
                )}
              </button>
            </span>
          </label>
          {mode === "signup" && (
            <>
              <ul
                className="password-rules"
                id="password-rules"
                aria-live="polite"
              >
                {rules.map((rule) => (
                  <li
                    className={rule.ok ? "valid" : "invalid"}
                    key={rule.label}
                  >
                    {rule.ok ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <X aria-hidden="true" />
                    )}
                    {rule.label}
                  </li>
                ))}
              </ul>
              <label>
                Confirm password
                <span className="password-field">
                  <input
                    required
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    aria-invalid={
                      Boolean(confirmation) && password !== confirmation
                    }
                  />
                </span>
                {confirmation && (
                  <span
                    className={`field-feedback ${password === confirmation ? "valid" : "invalid"}`}
                  >
                    {password === confirmation ? <Check /> : <X />}
                    {password === confirmation
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </span>
                )}
              </label>
            </>
          )}
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          <button
            className="primary full"
            disabled={busy || (mode === "signup" && !signupValid)}
          >
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create workspace"}
          </button>
        </form>
        <button
          className="text-button auth-switch"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setPasswordVisible(false);
            setPassword("");
            setConfirmation("");
            setError("");
          }}
        >
          {mode === "login"
            ? "New to Mandate? Create a workspace"
            : "Already have an account? Sign in"}
        </button>
        <small>
          No real payments are processed. Mandate stores authorization intent
          and decisions only.
        </small>
      </section>
    </main>
  );
}

function Workspace({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const [view, setView] = useState<View>("Overview");
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [workspaceAgents, setWorkspaceAgents] = useState<ApiAgent[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Tx | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(false);
  const [approvalAll, setApprovalAll] = useState(false);
  const [simAgent, setSimAgent] = useState("Procurement Agent");
  const [simMerchant, setSimMerchant] = useState("Apple");
  const [simAmount, setSimAmount] = useState("899");
  const [simCategory, setSimCategory] = useState("Office equipment");
  const [simCountry, setSimCountry] = useState("US");
  const [simResult, setSimResult] = useState<Tx | null>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 800px)");
    const sync = () => setMobileLayout(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [mobileOpen]);
  useEffect(() => {
    setLoadError("");
  }, [view]);
  const [mandateText, setMandateText] = useState(
    "Give my procurement agent $2,000 per month. It can purchase software and office equipment. Maximum autonomous transaction is $250. Require approval for any new merchant. Block crypto, gambling, and international transactions.",
  );
  const [parsed, setParsed] = useState(false);

  async function refresh() {
    try {
      setLoadError("");
      const [agentRows, transactionRows, dashboard] = await Promise.all([
        mandateApi.agents(session.token),
        mandateApi.transactions(session.token),
        mandateApi.dashboard(session.token),
      ]);
      setWorkspaceAgents(agentRows);
      setTransactions(transactionRows.map(mapApiTransaction));
      setSummary(dashboard);
      if (agentRows[0] && !agentRows.some((agent) => agent.name === simAgent))
        setSimAgent(agentRows[0].name);
    } catch (cause) {
      if (cause instanceof MandateApiError && cause.status === 401) {
        onLogout();
        return;
      }
      setLoadError("Live workspace data could not be loaded. Try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, [session.token]);

  const pending = transactions.filter(
    (t) =>
      t.policyDecision === "APPROVAL_REQUIRED" &&
      t.approvalStatus === "PENDING",
  );
  const title = view === "Approvals" ? "Approval Queue" : view;

  async function simulate() {
    const agent = workspaceAgents.find((item) => item.name === simAgent);
    if (!agent) {
      setLoadError(
        "Create an agent and activate its mandate before simulating.",
      );
      return;
    }
    try {
      const output = await mandateApi.simulate(session.token, agent.id, {
        amount: Number(simAmount) || 0,
        merchant: simMerchant,
        category: simCategory,
        country: simCountry,
      });
      const tx: Tx = {
        id: output.transaction.id,
        merchant: output.transaction.merchant,
        category: output.transaction.category,
        amount: output.transaction.amountCents / 100,
        agent: agent.name,
        time: "Just now · Railway",
        decision: output.decision.decision,
        risk: output.decision.riskScore,
        country: output.transaction.country,
        isNew: output.decision.riskFactors.some(
          (f) => f.code === "NEW_MERCHANT",
        ),
        reason:
          output.decision.reasons[0] ?? "Deterministic evaluation completed.",
        factors: output.decision.riskFactors.map((f) => f.detail),
        policyRules: output.decision.policyRules,
      };
      setSimResult(tx);
      await refresh();
    } catch (cause) {
      setLoadError(
        cause instanceof MandateApiError && cause.code === "NO_ACTIVE_MANDATE"
          ? "This agent needs an active mandate before it can submit requests."
          : "The Railway policy engine could not evaluate this request.",
      );
    }
  }

  async function resolve(tx: Tx, approved: boolean, note?: string) {
    if (!tx.approvalRequestId) return;
    try {
      await mandateApi.resolveApproval(
        session.token,
        tx.approvalRequestId,
        approved ? "APPROVED" : "DECLINED",
        note,
      );
      await refresh();
    } catch (cause) {
      if (
        cause instanceof MandateApiError &&
        cause.code === "APPROVAL_NOT_PENDING"
      ) {
        await refresh();
        return;
      }
      setLoadError("The approval service did not respond. Try again.");
      throw cause;
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileLayout && mobileOpen && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${mobileOpen ? "open" : ""}`}
        aria-hidden={mobileLayout && !mobileOpen}
        {...(mobileLayout && !mobileOpen ? { inert: "" as any } : {})}
      >
        <div className="sidebar-top">
          <AppLogo />
          <button
            className="close-mobile"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>
        <nav>
          <div className="nav-section">Workspace</div>
          {nav.slice(0, 4).map((n) => (
            <button
              key={n.label}
              aria-current={view === n.label ? "page" : undefined}
              className={view === n.label ? "active" : ""}
              onClick={() => {
                setView(n.label);
                setMobileOpen(false);
              }}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.count ? <em>{pending.length}</em> : null}
            </button>
          ))}
          <div className="nav-section second">Intelligence</div>
          {nav.slice(4).map((n) => (
            <button
              key={n.label}
              aria-current={view === n.label ? "page" : undefined}
              className={view === n.label ? "active" : ""}
              onClick={() => {
                setView(n.label);
                setMobileOpen(false);
              }}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card" role="status">
            <div className="help-icon">
              <Shield size={16} />
            </div>
            <div>
              <b>Policy engine</b>
              <small>All systems operational</small>
            </div>
            <span className="live-dot" />
          </div>
          <button
            className="profile"
            aria-label={`Sign out ${session.user?.name || "workspace owner"}`}
            onClick={onLogout}
          >
            <div className="avatar">
              {session.user?.name
                ?.split(" ")
                .map((x) => x[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "ME"}
            </div>
            <div>
              <b>{session.user?.name || "Workspace owner"}</b>
              <small>Sign out</small>
            </div>
          </button>
        </div>
      </aside>
      <main id="main-content">
        <header>
          <button
            className="menu-btn"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <div className="eyebrow">Control center</div>
            <h1>{title}</h1>
          </div>
          <div className="header-actions">
            <div className="system-status">
              <span />
              Simulation mode
            </div>
            {view !== "Create Mandate" && (
              <button
                className="primary"
                onClick={() => setView("Create Mandate")}
              >
                <Plus size={17} /> New mandate
              </button>
            )}
          </div>
        </header>
        <div className="content">
          {loadError && (
            <div className="auth-error" role="alert">
              {loadError}{" "}
              <button className="text-button" onClick={() => void refresh()}>
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="empty card">
              <Shield />
              <h2>Loading workspace</h2>
              <p>Reading your authorization ledger from Railway.</p>
            </div>
          ) : (
            <>
              {view === "Overview" && (
                <Overview
                  setView={setView}
                  transactions={transactions}
                  setSelected={setSelected}
                  summary={summary}
                  agentCount={workspaceAgents.length}
                  session={session}
                  refresh={refresh}
                />
              )}
              {view === "Agents" && (
                <AgentsLivePage
                  setView={setView}
                  approvalAll={approvalAll}
                  setApprovalAll={setApprovalAll}
                  agents={workspaceAgents}
                  session={session}
                  refresh={refresh}
                />
              )}
              {view === "Transactions" && (
                <TransactionsPage
                  transactions={transactions}
                  setSelected={setSelected}
                />
              )}
              {view === "Approvals" && (
                <ApprovalsPage
                  pending={pending}
                  resolve={resolve}
                  setSelected={setSelected}
                />
              )}
              {view === "Risk Activity" && (
                <RiskPage
                  transactions={transactions}
                  setSelected={setSelected}
                />
              )}
              {view === "Audit Trail" && <AuditLivePage session={session} />}
              {view === "Simulator" && (
                <Simulator
                  agents={workspaceAgents}
                  agent={simAgent}
                  setAgent={setSimAgent}
                  merchant={simMerchant}
                  setMerchant={setSimMerchant}
                  amount={simAmount}
                  setAmount={setSimAmount}
                  category={simCategory}
                  setCategory={setSimCategory}
                  country={simCountry}
                  setCountry={setSimCountry}
                  result={simResult}
                  simulate={simulate}
                  setSelected={setSelected}
                  setView={setView}
                />
              )}
              {view === "Connections" && <ConnectionsPage />}
              {view === "Create Mandate" && (
                <MandateLivePage
                  agents={workspaceAgents}
                  session={session}
                  refresh={refresh}
                  text={mandateText}
                  setText={setMandateText}
                  parsed={parsed}
                  setParsed={setParsed}
                  setView={setView}
                />
              )}
            </>
          )}
        </div>
      </main>
      {selected && (
        <DecisionDrawer tx={selected} close={() => setSelected(null)} />
      )}
    </div>
  );
}

function mapApiTransaction(row: ApiTransaction): Tx {
  const resolvedDecision =
    row.approvalStatus === "APPROVED"
      ? "APPROVED"
      : row.approvalStatus === "DECLINED"
        ? "DECLINED"
        : row.decision;
  return {
    id: row.id,
    merchant: row.merchant,
    category: row.category,
    amount: row.amountCents / 100,
    agent: row.agentName,
    time: new Date(row.createdAt).toLocaleString(),
    decision: resolvedDecision,
    policyDecision: row.decision,
    approvalStatus: row.approvalStatus,
    risk: row.riskScore,
    country: row.country,
    isNew: row.riskFactors.some((f) => f.code === "NEW_MERCHANT"),
    reason: row.reasons[0] ?? "Deterministic policy evaluation completed.",
    factors: row.riskFactors.map((f) => f.detail),
    approvalRequestId: row.approvalRequestId,
    policyRules: row.policyRules,
  };
}

function Overview({
  setView,
  transactions,
  setSelected,
  summary,
  agentCount,
  session,
  refresh,
}: {
  setView: (v: View) => void;
  transactions: Tx[];
  setSelected: (t: Tx) => void;
  summary: DashboardSummary | null;
  agentCount: number;
  session: Session;
  refresh: () => Promise<void>;
}) {
  const [seeding, setSeeding] = useState(false);
  async function seedDemo() {
    if (
      !confirm(
        "Create a clearly labeled synthetic demo workspace with two agents and four simulated requests?",
      )
    )
      return;
    setSeeding(true);
    try {
      await mandateApi.seedDemo(session.token);
      await refresh();
    } finally {
      setSeeding(false);
    }
  }
  const chartData = transactions
    .filter((tx) => tx.decision === "APPROVED")
    .slice(0, 8)
    .reverse()
    .map((tx, index) => ({
      d: new Date(tx.time).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      v: transactions
        .filter((item) => item.decision === "APPROVED")
        .slice(0, 8)
        .reverse()
        .slice(0, index + 1)
        .reduce((total, item) => total + item.amount, 0),
    }));
  return (
    <>
      {agentCount === 0 && (
        <section className="onboarding card">
          <div>
            <span className="kicker">Pilot setup</span>
            <h2>Establish your first authorization boundary</h2>
            <p>
              Create the workspace yourself, or load clearly labeled synthetic
              data to explore the complete workflow.
            </p>
          </div>
          <ol>
            <li>
              <b>1</b>
              <span>
                Create an agent
                <small>Define a narrow purchasing purpose.</small>
              </span>
            </li>
            <li>
              <b>2</b>
              <span>
                Activate a mandate
                <small>Review deterministic financial rules.</small>
              </span>
            </li>
            <li>
              <b>3</b>
              <span>
                Submit a request
                <small>See policy, risk, and audit evidence.</small>
              </span>
            </li>
          </ol>
          <div className="onboarding-actions">
            <button className="primary" onClick={() => setView("Agents")}>
              <Plus /> Start from scratch
            </button>
            <button
              className="secondary"
              disabled={seeding}
              onClick={() => void seedDemo()}
            >
              {seeding ? "Loading demo…" : "Load synthetic demo"}
            </button>
          </div>
        </section>
      )}
      <div className="page-intro">
        <div>
          <p>
            Your agents spent{" "}
            <strong>{money((summary?.authorizedSpendCents ?? 0) / 100)}</strong>{" "}
            across {agentCount} agents this month.
          </p>
          <span>{summary?.review ?? 0} requests need human attention.</span>
        </div>
        <button className="secondary" onClick={() => setView("Simulator")}>
          <Zap size={16} /> Test a transaction
        </button>
      </div>
      <section className="authority-position card">
        <div className="authority-summary">
          <span>Authority position · current month</span>
          <b>{money((summary?.remainingBudgetCents ?? 0) / 100)}</b>
          <p>
            remaining of {money((summary?.authorizedBudgetCents ?? 0) / 100)}{" "}
            governed authority
          </p>
          <div
            className="authority-meter"
            role="progressbar"
            aria-label="Remaining authorized budget"
            aria-valuemin={0}
            aria-valuemax={summary?.authorizedBudgetCents ?? 0}
            aria-valuenow={summary?.remainingBudgetCents ?? 0}
          >
            <i
              style={{
                width: `${summary?.authorizedBudgetCents ? Math.max(0, Math.min(100, (summary.remainingBudgetCents / summary.authorizedBudgetCents) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
        <button
          className="authority-review"
          onClick={() => setView("Approvals")}
        >
          <span>Human action</span>
          <b>{summary?.review ?? 0}</b>
          <p>
            {summary?.review === 1 ? "request is" : "requests are"} waiting for
            review
          </p>
          <ArrowRight />
        </button>
        <dl className="decision-breakdown">
          <div>
            <dt>Authorized spend</dt>
            <dd>{money((summary?.authorizedSpendCents ?? 0) / 100)}</dd>
          </div>
          <div>
            <dt>Approved</dt>
            <dd>{summary?.approved ?? 0}</dd>
          </div>
          <div>
            <dt>Declined</dt>
            <dd>{summary?.declined ?? 0}</dd>
          </div>
          <div>
            <dt>High risk</dt>
            <dd>{summary?.highRisk ?? 0}</dd>
          </div>
        </dl>
      </section>
      <div className="dashboard-grid">
        <section className="card chart-card">
          <div className="card-header">
            <div>
              <span className="kicker">Spend control</span>
              <h2>Authorized spend</h2>
            </div>
            <span className="range-label">Current ledger</span>
          </div>
          <div className="chart-summary">
            <b>{money((summary?.authorizedSpendCents ?? 0) / 100)}</b>
            <span>
              <ArrowRight size={13} />{" "}
              {money((summary?.remainingBudgetCents ?? 0) / 100)} remaining
            </span>
          </div>
          <div
            className="chart"
            role="img"
            aria-label={`Authorized spend trend from ${chartData.length} recent approved decisions. Total authorized this month is ${money((summary?.authorizedSpendCents ?? 0) / 100)}.`}
          >
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ left: -20, right: 8, top: 12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--line)"
                  />
                  <XAxis
                    dataKey="d"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                      fontSize: 12,
                    }}
                    formatter={(v) => [`$${v}`, "Authorized"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="var(--purple)"
                    strokeWidth={2.5}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="compact-empty">
                <CircleDollarSign />
                <span>
                  No authorized spend yet. Approved requests will appear here.
                </span>
              </div>
            )}
          </div>
        </section>
        <section className="card attention">
          <div className="card-header">
            <div>
              <span className="kicker">Action center</span>
              <h2>Needs your attention</h2>
            </div>
            <button
              className="text-button"
              onClick={() => setView("Approvals")}
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          {transactions.some(
            (tx) =>
              tx.policyDecision === "APPROVAL_REQUIRED" &&
              tx.approvalStatus === "PENDING",
          ) ? (
            transactions
              .filter(
                (tx) =>
                  tx.policyDecision === "APPROVAL_REQUIRED" &&
                  tx.approvalStatus === "PENDING",
              )
              .slice(0, 2)
              .map((tx) => (
                <button
                  className="attention-item"
                  key={tx.id}
                  onClick={() => setSelected(tx)}
                >
                  <div className="brand-icon apple">{tx.merchant[0]}</div>
                  <div className="attention-info">
                    <b>
                      {tx.merchant} <span>{money(tx.amount)}</span>
                    </b>
                    <small>
                      {tx.agent} · {tx.reason}
                    </small>
                  </div>
                  <span className={`risk ${tx.risk >= 45 ? "medium" : "low"}`}>
                    {tx.risk} risk
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))
          ) : (
            <div className="compact-empty">
              <CheckCircle2 />
              <span>Queue clear. No requests need human review.</span>
            </div>
          )}
          <div className="attention-footer">
            <Shield size={15} />
            <span>Mandate blocked {summary?.declined ?? 0} attempts</span>
          </div>
        </section>
      </div>
      <section className="card table-card">
        <div className="card-header">
          <div>
            <span className="kicker">Live ledger</span>
            <h2>Recent decisions</h2>
          </div>
          <button
            className="text-button"
            onClick={() => setView("Transactions")}
          >
            All transactions <ArrowRight size={14} />
          </button>
        </div>
        <TransactionTable
          rows={transactions.slice(0, 5)}
          onOpen={setSelected}
        />
      </section>
    </>
  );
}

function TransactionTable({
  rows,
  onOpen,
  emptyMessage = "Submit a simulated request to create the first decision.",
}: {
  rows: Tx[];
  onOpen: (t: Tx) => void;
  emptyMessage?: string;
}) {
  if (!rows.length)
    return (
      <div className="compact-empty">
        <Search size={20} />
        <div>
          <b>No decisions match this view</b>
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Merchant</th>
            <th>Agent</th>
            <th>Amount</th>
            <th>Decision</th>
            <th>Risk</th>
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <button className="row-link" onClick={() => onOpen(t)}>
                  <b>{t.merchant}</b>
                  <small>
                    {t.category} · {t.time}
                  </small>
                </button>
              </td>
              <td>{t.agent}</td>
              <td className="amount">{money(t.amount)}</td>
              <td>
                <StatusPill value={t.decision} />
              </td>
              <td>
                <span
                  className={`score ${t.risk >= 70 ? "high" : t.risk >= 35 ? "med" : ""}`}
                >
                  {t.risk}
                  <span className="sr-only"> out of 100</span>
                </span>
              </td>
              <td>
                <button
                  className="row-open"
                  aria-label={`Open ${t.merchant} authorization decision`}
                  onClick={() => onOpen(t)}
                >
                  <ChevronRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgentsPage({
  setView,
  approvalAll,
  setApprovalAll,
}: {
  setView: (v: View) => void;
  approvalAll: boolean;
  setApprovalAll: (v: boolean) => void;
}) {
  const [paused, setPaused] = useState<string[]>(["Engineering Ops"]);
  return (
    <>
      <div className="page-intro">
        <div>
          <p>Four agents operate under active financial mandates.</p>
          <span>
            Change controls take effect immediately on future requests.
          </span>
        </div>
        <button className="primary">
          <Plus size={17} /> Create agent
        </button>
      </div>
      <div className="control-banner card">
        <div>
          <Shield size={20} />
          <div>
            <b>Emergency control</b>
            <span>
              Require human approval for every future agent transaction.
            </span>
          </div>
        </div>
        <label className="switch">
          <input
            aria-label="Require approval for all future transactions"
            type="checkbox"
            checked={approvalAll}
            onChange={(e) => setApprovalAll(e.target.checked)}
          />
          <span />
        </label>
      </div>
      <div className="agent-grid">
        {agents.map((a) => {
          const isPaused = paused.includes(a.name);
          return (
            <div className="agent-card card" key={a.name}>
              <div className="agent-head">
                <div className="agent-avatar" style={{ background: a.color }}>
                  {a.initials}
                </div>
                <button className="icon-button">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <h3>{a.name}</h3>
              <p>{a.purpose}</p>
              <div className="agent-status">
                <span className={isPaused ? "paused" : ""} />
                {isPaused ? "Paused" : "Active"}
              </div>
              <div className="budget-row">
                <span>Monthly budget</span>
                <b>
                  {money(a.spent)} <em>/ {money(a.budget)}</em>
                </b>
              </div>
              <div className="progress">
                <i
                  style={{
                    width: `${(a.spent / a.budget) * 100}%`,
                    background: a.color,
                  }}
                />
              </div>
              <div className="agent-rule">
                <span>Autonomous limit</span>
                <b>{money(a.limit)}</b>
              </div>
              <div className="agent-actions">
                <button
                  className="secondary"
                  onClick={() =>
                    setPaused((p) =>
                      isPaused ? p.filter((x) => x !== a.name) : [...p, a.name],
                    )
                  }
                >
                  {isPaused ? <Play size={15} /> : <Pause size={15} />}{" "}
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  className="secondary"
                  onClick={() => setView("Create Mandate")}
                >
                  <Settings2 size={15} /> Edit rules
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function TransactionsPage({
  transactions,
  setSelected,
}: {
  transactions: Tx[];
  setSelected: (t: Tx) => void;
}) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const rows = (
    filter === "All"
      ? transactions
      : transactions.filter((t) => t.decision === filter)
  ).filter((t) =>
    `${t.merchant} ${t.agent}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="toolbar card">
        <label className="search">
          <Search size={16} />
          <span className="sr-only">Search transactions</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transactions or agents…"
          />
        </label>
        <div className="tabs">
          {["All", "APPROVED", "APPROVAL_REQUIRED", "DECLINED"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f === "APPROVAL_REQUIRED"
                ? "Needs review"
                : f[0] + f.slice(1).toLowerCase()}{" "}
              {f === "All"
                ? transactions.length
                : transactions.filter(
                    (transaction) => transaction.decision === f,
                  ).length}
            </button>
          ))}
        </div>
      </div>
      <section className="card table-card standalone">
        <div className="card-header">
          <div>
            <span className="kicker">Authorization ledger</span>
            <h2>{rows.length} authorization decisions</h2>
          </div>
        </div>
        <TransactionTable
          rows={rows}
          onOpen={setSelected}
          emptyMessage={
            transactions.length
              ? "No decisions match this search and status filter."
              : undefined
          }
        />
      </section>
    </>
  );
}

function ApprovalsPage({
  pending,
  resolve,
  setSelected,
}: {
  pending: Tx[];
  resolve: (t: Tx, a: boolean, note?: string) => void | Promise<void>;
  setSelected: (t: Tx) => void;
}) {
  const [review, setReview] = useState<{ tx: Tx; approved: boolean } | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!review) return;
    cancelButton.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !resolving) setReview(null);
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [review, resolving]);
  async function confirm() {
    if (!review) return;
    setResolving(true);
    try {
      await resolve(review.tx, review.approved, note.trim() || undefined);
      setReview(null);
      setNote("");
    } finally {
      setResolving(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <p>Review ambiguous or high-risk agent requests.</p>
          <span>
            Each resolution is appended to the audit trail and applies to this
            request only.
          </span>
        </div>
      </div>
      {pending.length === 0 ? (
        <div className="empty card">
          <CheckCircle2 />
          <h2>Queue clear</h2>
          <p>There are no requests waiting for your approval.</p>
        </div>
      ) : (
        <div className="approval-list">
          {pending.map((t) => (
            <article className="approval-card card" key={t.id}>
              <div className="approval-main">
                <div className="brand-icon apple">{t.merchant[0]}</div>
                <div>
                  <span className="kicker">{t.agent}</span>
                  <h2>
                    {t.merchant} <b>{money(t.amount)}</b>
                  </h2>
                  <p>
                    {t.category} · {t.country} · requested{" "}
                    {t.time.toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="approval-reason">
                <div>
                  <AlertTriangle size={17} />
                  <span>{t.reason}</span>
                </div>
                <button className="text-button" onClick={() => setSelected(t)}>
                  View policy evaluation <ChevronRight size={15} />
                </button>
              </div>
              <div className="approval-impact">
                <span>Decision context</span>
                <b>
                  {t.risk}/100 risk · {money(t.amount)} requested
                </b>
                <small>
                  The original policy and risk evaluation remain immutable.
                </small>
              </div>
              {t.policyRules?.some((rule) => rule.outcome !== "PASS") && (
                <div
                  className="approval-rules"
                  aria-label="Rules requiring attention"
                >
                  {t.policyRules
                    .filter((rule) => rule.outcome !== "PASS")
                    .map((rule) => (
                      <div key={`${rule.rule}-${rule.reason}`}>
                        <b>{rule.outcome}</b>
                        <span>{rule.reason}</span>
                      </div>
                    ))}
                </div>
              )}
              <div className="approval-actions">
                <span className={`risk ${t.risk >= 45 ? "medium" : "low"}`}>
                  {t.risk} risk score
                </span>
                <button
                  className="decline"
                  onClick={() => setReview({ tx: t, approved: false })}
                >
                  <X size={16} /> Decline
                </button>
                <button
                  className="approve"
                  onClick={() => setReview({ tx: t, approved: true })}
                >
                  <Check size={16} /> Approve once
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {review && (
        <div className="decision-modal-backdrop">
          <section
            className="decision-modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolution-title"
          >
            <div className="drawer-head">
              <div>
                <span className="kicker">Human resolution</span>
                <h2 id="resolution-title">
                  {review.approved ? "Approve" : "Decline"} {review.tx.merchant}{" "}
                  for {money(review.tx.amount)}?
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Cancel resolution"
                disabled={resolving}
                onClick={() => setReview(null)}
              >
                <X />
              </button>
            </div>
            <dl className="decision-context">
              <div>
                <dt>Agent</dt>
                <dd>{review.tx.agent}</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd>{review.tx.risk}/100</dd>
              </div>
              <div>
                <dt>Policy result</dt>
                <dd>Human review required</dd>
              </div>
              <div>
                <dt>Scope</dt>
                <dd>This request only</dd>
              </div>
            </dl>
            <p>{review.tx.reason}</p>
            <label className="review-note">
              Reviewer note <span>Optional</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Add context for the audit trail"
              />
            </label>
            <div className="modal-actions">
              <button
                ref={cancelButton}
                className="secondary"
                disabled={resolving}
                onClick={() => setReview(null)}
              >
                Cancel
              </button>
              <button
                className={review.approved ? "approve" : "decline"}
                disabled={resolving}
                onClick={() => void confirm()}
              >
                {review.approved ? <Check size={16} /> : <X size={16} />}{" "}
                {resolving
                  ? "Recording decision…"
                  : `Confirm ${review.approved ? "approval" : "decline"}`}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function RiskPage({
  transactions,
  setSelected,
}: {
  transactions: Tx[];
  setSelected: (t: Tx) => void;
}) {
  const risky = transactions.filter((t) => t.risk >= 35);
  const average = transactions.length
    ? Math.round(
        transactions.reduce((sum, t) => sum + t.risk, 0) / transactions.length,
      )
    : null;
  const factors = Array.from(
    transactions
      .flatMap((t) => t.factors)
      .reduce(
        (counts, factor) => counts.set(factor, (counts.get(factor) ?? 0) + 1),
        new Map<string, number>(),
      ),
  ).sort((a, b) => b[1] - a[1]);
  if (!transactions.length)
    return (
      <section className="empty card risk-empty">
        <ShieldAlert />
        <h2>Not enough activity to assess risk</h2>
        <p>
          Risk posture appears after simulated authorization requests have been
          evaluated. No historical claims are shown without source data.
        </p>
      </section>
    );
  return (
    <>
      <section className="risk-hero card">
        <div>
          <h2>Observed risk posture</h2>
          <p>
            Based on {transactions.length} simulated request
            {transactions.length === 1 ? "" : "s"} in the current ledger. Scores
            are deterministic and shown with their triggering factors.
          </p>
        </div>
        <div className="risk-reading">
          <b>{average}</b>
          <span>Average risk / 100</span>
        </div>
      </section>
      <section className="risk-register card">
        <div className="card-header">
          <div>
            <h2>Triggered factors</h2>
            <p>Ranked by occurrences in the current ledger</p>
          </div>
        </div>
        {factors.length ? (
          <ol>
            {factors.map(([factor, count]) => (
              <li key={factor}>
                <span>{factor}</span>
                <b>{count}</b>
              </li>
            ))}
          </ol>
        ) : (
          <div className="compact-empty">
            <CheckCircle2 />
            <span>No material risk factors were triggered.</span>
          </div>
        )}
      </section>
      <section className="card table-card standalone">
        <div className="card-header">
          <div>
            <h2>Elevated-risk attempts</h2>
            <p>
              {risky.length} request{risky.length === 1 ? "" : "s"} scored 35 or
              higher
            </p>
          </div>
        </div>
        <TransactionTable rows={risky} onOpen={setSelected} />
      </section>
    </>
  );
}

function AuditPage({ transactions }: { transactions: Tx[] }) {
  return (
    <>
      <div className="page-intro">
        <div>
          <p>An append-only record of every financial decision.</p>
          <span>
            Each event links intent, policy, risk, authorization, and human
            action.
          </span>
        </div>
        <button className="secondary">Verify integrity</button>
      </div>
      <div className="audit card">
        {transactions.slice(0, 5).map((t, i) => (
          <div className="audit-row" key={t.id}>
            <div className="audit-line">
              <span className={t.decision.toLowerCase()}>
                {i === 0 ? <Sparkles size={14} /> : <Activity size={14} />}
              </span>
            </div>
            <div className="audit-content">
              <div>
                <span className="kicker">{t.time.toUpperCase()}</span>
                <h3>
                  {t.merchant} · {money(t.amount)}
                </h3>
                <p>{t.agent} submitted a simulated purchase request.</p>
              </div>
              <StatusPill value={t.decision} />
              <div className="audit-flow">
                <span>User intent</span>
                <ChevronRight />
                <span>{t.agent}</span>
                <ChevronRight />
                <span>Policy evaluated</span>
                <ChevronRight />
                <span>Risk {t.risk}/100</span>
                <ChevronRight />
                <b>{t.decision.replace("_", " ")}</b>
              </div>
              <small>
                Event {t.id} · SHA-256 integrity reference{" "}
                <code>f2a9…{t.id.slice(-4).toLowerCase()}</code>
              </small>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ConnectionsPage() {
  const [copied, setCopied] = useState<"key" | "snippet" | null>(null);
  const [copyError, setCopyError] = useState(false);
  const endpoint = `${MANDATE_API_URL}/v1/authorization-requests`;
  const snippet = [
    `curl ${endpoint} \\`,
    `  -H "X-Mandate-Key: mnd_test_••••••••" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"idempotencyKey":"order_01J8","amount":96,"currency":"USD","merchant":"Notion","category":"Software","country":"US"}'`,
  ].join("\n");
  async function copy(value: string, target: "key" | "snippet") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <p>Connect agents to Mandate&apos;s authorization boundary.</p>
          <span>
            Your agent submits requests; deterministic policy—not the agent or
            an LLM—returns the decision.
          </span>
        </div>
        <span className="environment-label">Simulation API</span>
      </div>
      <div className="connection-callout card">
        <div className="connection-icon">
          <Plug size={20} />
        </div>
        <div>
          <span className="kicker">QUICK START</span>
          <h2>One endpoint between intent and spend</h2>
          <p>
            No transaction feed is required. Agents, MCP servers, or your
            backend call the authorization API before any simulated or future
            provider-side payment action.
          </p>
        </div>
        <span className="demo-tag">Simulation only</span>
      </div>
      <div className="connection-grid">
        <section className="card connection-card">
          <KeyRound />
          <span className="kicker">01 · IDENTITY</span>
          <h3>Create a scoped agent key</h3>
          <p>
            Keys are bound to one agent and only receive the minimum scopes
            required.
          </p>
          <div className="secret-row">
            <code>mnd_test_••••••••••••2F8A</code>
            <button
              aria-label="Copy example key"
              onClick={() =>
                void copy("mnd_test_example_not_a_real_secret", "key")
              }
            >
              <Copy size={15} />
            </button>
          </div>
          <small>
            {copied === "key"
              ? "Example copied"
              : "Real secrets are shown once and stored only as SHA-256 hashes."}
          </small>
        </section>
        <section className="card connection-card">
          <TerminalSquare />
          <span className="kicker">02 · AUTHORIZE</span>
          <h3>Request a decision</h3>
          <p>
            Use an idempotency key for safe retries. Amounts are converted to
            integer cents at the boundary.
          </p>
          <div className="endpoint">
            <b>POST</b>
            <code>/v1/authorization-requests</code>
          </div>
          <span className="scope">authorizations:write</span>
        </section>
        <section className="card connection-card">
          <Webhook />
          <span className="kicker">03 · RESPOND</span>
          <h3>Handle the outcome</h3>
          <p>
            Proceed only for <b>APPROVED</b>. Hold for <b>APPROVAL_REQUIRED</b>.
            Stop for <b>DECLINED</b>.
          </p>
          <div className="decision-list">
            <span className="approved">APPROVED</span>
            <span className="approval_required">APPROVAL_REQUIRED</span>
            <span className="declined">DECLINED</span>
          </div>
        </section>
      </div>
      <div className="integration-grid">
        <section className="card code-panel">
          <div className="card-header">
            <div>
              <span className="kicker">REST API</span>
              <h2>Authorization request</h2>
            </div>
            <button
              className="secondary"
              onClick={() => void copy(snippet, "snippet")}
            >
              <Copy size={14} /> {copied === "snippet" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre>{snippet}</pre>
        </section>
        <section className="card architecture-panel">
          <span className="kicker">DATA OWNERSHIP</span>
          <h2>What Mandate stores</h2>
          {[
            [
              Database,
              "PostgreSQL",
              "Organizations, agents, mandates, decisions and budget ledger",
            ],
            [
              Shield,
              "Policy engine",
              "Versioned rules and explainable pass/review/fail results",
            ],
            [
              FileText,
              "Audit chain",
              "Tamper-evident event hashes and human resolutions",
            ],
          ].map(([Icon, title, body]: any) => (
            <div className="architecture-row" key={title}>
              <Icon size={17} />
              <div>
                <b>{title}</b>
                <small>{body}</small>
              </div>
              <CheckCircle2 size={16} />
            </div>
          ))}
          <div className="boundary-note">
            <LockKeyhole size={15} /> No cards, bank credentials, or real
            payment instructions are stored.
          </div>
        </section>
      </div>
      {copyError && (
        <div className="auth-error" role="alert">
          Clipboard access was blocked. Select and copy the example manually.
        </div>
      )}
      <aside className="extension-note">
        <b>Optional adapters are not installed.</b>
        <span>
          The authorization API works independently today. Agent SDK, MCP,
          webhook, and expense-system adapters remain roadmap items.
        </span>
      </aside>
    </>
  );
}

function Simulator(p: any) {
  if (!p.agents.length)
    return (
      <section className="empty card simulator-prerequisite">
        <Bot />
        <h2>Create an agent and mandate first</h2>
        <p>
          The simulator submits a real request to the deterministic Railway
          engine, so it needs an agent with active authority.
        </p>
        <button className="primary" onClick={() => p.setView("Agents")}>
          <Plus /> Create an agent
        </button>
      </section>
    );
  return (
    <div className="sim-grid">
      <section className="card sim-form">
        <div className="card-header">
          <div>
            <span className="kicker">Railway sandbox</span>
            <h2>Submit a purchase request</h2>
          </div>
          <span className="demo-tag">No money moves</span>
        </div>
        <p className="section-copy">
          This request is persisted and evaluated by the live deterministic
          policy and risk engines.
        </p>
        <div className="form-grid">
          <label>
            Agent
            <select
              value={p.agent}
              onChange={(e) => p.setAgent(e.target.value)}
            >
              {p.agents.map((a: ApiAgent) => (
                <option key={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label>
            Merchant
            <input
              value={p.merchant}
              onChange={(e) => p.setMerchant(e.target.value)}
            />
          </label>
          <label>
            Amount (USD)
            <div className="money-input">
              <span>$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={p.amount}
                onChange={(e) => p.setAmount(e.target.value)}
              />
            </div>
          </label>
          <label>
            Category
            <select
              value={p.category}
              onChange={(e) => p.setCategory(e.target.value)}
            >
              {[
                "Software",
                "Office equipment",
                "Cloud services",
                "Travel",
                "Advertising",
                "Crypto",
                "Gambling",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Country
            <select
              value={p.country}
              onChange={(e) => p.setCountry(e.target.value)}
            >
              <option>US</option>
              <option>GB</option>
              <option>KY</option>
              <option>DE</option>
            </select>
          </label>
          <div className="read-only-field">
            <span>Currency</span>
            <b>USD</b>
          </div>
        </div>
        <button
          className="primary full"
          disabled={!p.agents.length}
          onClick={p.simulate}
        >
          <Send size={17} /> Evaluate on Railway
        </button>
        <div className="sim-note">
          <LockKeyhole size={15} /> Deterministic engine v1.0 · persisted
          simulation only
        </div>
      </section>
      <section className={`card sim-result ${p.result ? "has-result" : ""}`}>
        {!p.result ? (
          <div className="empty">
            <Shield size={34} />
            <h2>Awaiting transaction</h2>
            <p>
              {p.agents.length
                ? "Submit a request to see the live policy and risk evaluation."
                : "Create an agent and active mandate first."}
            </p>
          </div>
        ) : (
          <>
            <span className="kicker">Authorization decision</span>
            <div className={`decision-hero ${p.result.decision.toLowerCase()}`}>
              {p.result.decision === "APPROVED" ? (
                <CheckCircle2 />
              ) : p.result.decision === "DECLINED" ? (
                <XCircle />
              ) : (
                <Clock3 />
              )}
              <div>
                <b>{p.result.decision.replace("_", " ")}</b>
                <span>{p.result.id}</span>
              </div>
            </div>
            <div className="result-amount">
              <span>{p.result.merchant}</span>
              <b>{money(p.result.amount)}</b>
            </div>
            <p>{p.result.reason}</p>
            <div className="score-row">
              <div className="score-big">
                {p.result.risk}
                <small>/100 risk</small>
              </div>
              <div>
                {p.result.factors.length ? (
                  p.result.factors.map((f: string) => (
                    <span className="factor" key={f}>
                      {f}
                    </span>
                  ))
                ) : (
                  <span className="factor pass">No risk factors</span>
                )}
              </div>
            </div>
            <button
              className="secondary full"
              onClick={() => p.setSelected(p.result)}
            >
              Why this decision?
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function MandatePage({
  text,
  setText,
  parsed,
  setParsed,
  setView,
}: {
  text: string;
  setText: (s: string) => void;
  parsed: boolean;
  setParsed: (b: boolean) => void;
  setView: (v: View) => void;
}) {
  return (
    <div className="mandate-grid">
      <section className="card mandate-compose">
        <div className="step-badge">01</div>
        <span className="kicker">DESCRIBE INTENT</span>
        <h2>Write the spending mandate</h2>
        <p>
          Use plain language. AI translates your intent into policy; it never
          authorizes transactions.
        </p>
        <label>
          Agent
          <select>
            <option>Procurement Agent</option>
          </select>
        </label>
        <label>
          Mandate instructions
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
          />
        </label>
        <div className="prompt-hints">
          <button
            onClick={() =>
              setText(
                "Allow up to $3,000 per month for US travel. Require approval above $300 and for all new airlines or hotels.",
              )
            }
          >
            Travel policy
          </button>
          <button
            onClick={() =>
              setText(
                "Allow software subscriptions up to $250 from US merchants. Block crypto, gambling, and international transactions.",
              )
            }
          >
            Software policy
          </button>
        </div>
        <button className="primary full" onClick={() => setParsed(true)}>
          <Sparkles size={17} /> Interpret mandate
        </button>
      </section>
      <section className={`card policy-preview ${parsed ? "ready" : ""}`}>
        <div className="step-badge">02</div>
        <span className="kicker">STRUCTURED POLICY</span>
        <h2>Review deterministic rules</h2>
        {!parsed ? (
          <div className="empty">
            <SlidersHorizontal size={32} />
            <p>Your structured policy will appear here for review.</p>
          </div>
        ) : (
          <>
            <div className="llm-boundary">
              <Sparkles size={17} />
              <div>
                <b>AI interpretation complete</b>
                <span>
                  Review before activation. The policy engine remains
                  authoritative.
                </span>
              </div>
            </div>
            <pre>{`{
  "monthly_budget": 2000,
  "currency": "USD",
  "max_autonomous_amount": 250,
  "approval_threshold": 250,
  "allowed_categories": [
    "software", "office_equipment"
  ],
  "blocked_categories": [
    "crypto", "gambling"
  ],
  "allowed_countries": ["US"],
  "new_merchant_requires_approval": true,
  "expires_at": "2027-08-10"
}`}</pre>
            <div className="policy-check">
              <CheckCircle2 size={17} />
              <span>Schema valid · 9 enforceable rules</span>
            </div>
            <button className="primary full" onClick={() => setView("Agents")}>
              <Shield size={17} /> Activate mandate
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function DecisionDrawer({ tx, close }: { tx: Tx; close: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab" && drawer.current) {
        const controls = Array.from(
          drawer.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [close]);
  const rules = tx.policyRules ?? [];
  const humanResolved =
    tx.policyDecision === "APPROVAL_REQUIRED" &&
    (tx.approvalStatus === "APPROVED" || tx.approvalStatus === "DECLINED");
  return (
    <>
      <div className="drawer-backdrop" aria-hidden="true" onClick={close} />
      <aside
        ref={drawer}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
      >
        <div className="drawer-head">
          <div>
            <h2 id="decision-title">
              Why was this request {tx.decision.replace("_", " ").toLowerCase()}
              ?
            </h2>
            <p>
              {humanResolved
                ? `Policy required review; a human resolved it as ${tx.approvalStatus}.`
                : "Original evaluation evidence for this simulated request"}
            </p>
          </div>
          <button
            ref={closeButton}
            className="icon-button"
            aria-label="Close decision explanation"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <div className={`drawer-decision ${tx.decision.toLowerCase()}`}>
          <div>
            {tx.decision === "APPROVED" ? (
              <CheckCircle2 />
            ) : tx.decision === "DECLINED" ? (
              <XCircle />
            ) : (
              <Clock3 />
            )}
          </div>
          <span>{tx.decision.replace("_", " ")}</span>
          <b>{money(tx.amount)}</b>
          <small>
            {tx.merchant} · {tx.id}
          </small>
        </div>
        <div className="drawer-section">
          <h3>Policy evaluation</h3>
          {rules.length ? (
            rules.map((rule) => (
              <div className="rule-row" key={`${rule.rule}-${rule.reason}`}>
                <span className={rule.outcome.toLowerCase()}>
                  {rule.outcome === "PASS" ? (
                    <Check />
                  ) : rule.outcome === "REVIEW" ? (
                    <Clock3 />
                  ) : (
                    <X />
                  )}
                </span>
                <div>
                  <b>{rule.rule.replaceAll("_", " ")}</b>
                  <small>{rule.reason}</small>
                </div>
                <em>{rule.outcome}</em>
              </div>
            ))
          ) : (
            <div className="evidence-unavailable">
              No policy-rule evidence was returned for this historical record.
            </div>
          )}
        </div>
        <div className="drawer-section">
          <h3>
            Risk evaluation <span>{tx.risk}/100</span>
          </h3>
          <div
            className="risk-scale"
            aria-label={`Risk score ${tx.risk} out of 100`}
          >
            <i style={{ width: `${tx.risk}%` }} />
          </div>
          <div className="factors">
            {tx.factors.length ? (
              tx.factors.map((f) => (
                <span className="factor" key={f}>
                  {f}
                </span>
              ))
            ) : (
              <span className="factor pass">No material factors</span>
            )}
          </div>
        </div>
        <div className="drawer-footer">
          <Shield size={15} />
          <span>Rendered from the stored policy and risk evaluation</span>
          <small>AI was not used to authorize this request.</small>
        </div>
      </aside>
    </>
  );
}
