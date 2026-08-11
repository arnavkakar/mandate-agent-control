"use client";
import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Pause,
  Play,
  Plus,
  RotateCw,
  Settings2,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  ApiAgent,
  ApiKeyRecord,
  AuditEvent,
  MandateApiError,
  MandateInterpretation,
  MandatePolicy,
  MandateRecord,
  mandateApi,
  Session,
} from "./lib/mandate-api";
const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function AgentsLivePage({
  setView,
  agents,
  session,
  refresh,
}: {
  setView: (view: "Create Mandate") => void;
  approvalAll: boolean;
  setApprovalAll: (value: boolean) => void;
  agents: ApiAgent[];
  session: Session;
  refresh: () => Promise<void>;
}) {
  const [creating, setCreating] = useState(false),
    [selectedId, setSelectedId] = useState(agents[0]?.id ?? ""),
    [error, setError] = useState("");
  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]),
    [history, setHistory] = useState<MandateRecord[]>([]),
    [secret, setSecret] = useState(""),
    [acting, setActing] = useState(false),
    [confirmation, setConfirmation] = useState<{
      title: string;
      body: string;
      destructive?: boolean;
      action: () => Promise<void>;
    } | null>(null);
  useEffect(() => {
    if (!selected) return;
    Promise.all([
      mandateApi.keys(session.token, selected.id),
      mandateApi.mandates(session.token, selected.id),
    ])
      .then(([k, h]) => {
        setKeys(k);
        setHistory(h);
      })
      .catch(() => setError("Agent controls could not be loaded."));
  }, [selected, session.token]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      const agent = await mandateApi.createAgent(session.token, {
        name: String(f.get("name")),
        purpose: String(f.get("purpose")),
      });
      setCreating(false);
      await refresh();
      setSelectedId(agent.id);
    } catch {
      setError("Agent could not be created.");
    }
  }
  async function status(value: "ACTIVE" | "PAUSED" | "REVOKED") {
    if (!selected) return;
    setConfirmation({
      title: `${value === "REVOKED" ? "Revoke" : value === "PAUSED" ? "Pause" : "Resume"} ${selected.name}?`,
      body:
        value === "REVOKED"
          ? "This permanently blocks future authorization requests. Existing decisions and audit evidence remain available."
          : "The status change affects future authorization requests immediately.",
      destructive: value === "REVOKED",
      action: async () => {
        await mandateApi.updateAgent(session.token, selected.id, {
          status: value,
        });
        await refresh();
      },
    });
  }
  async function saveControls(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected?.mandate) return;
    const f = new FormData(event.currentTarget),
      policy = {
        ...selected.mandate,
        monthlyBudgetCents: Math.round(Number(f.get("budget")) * 100),
        maxTransactionCents: Math.round(Number(f.get("limit")) * 100),
        approvalThresholdCents: Math.round(Number(f.get("threshold")) * 100),
        requireApprovalForAll: f.get("approvalAll") === "on",
      };
    if (policy.maxTransactionCents > policy.approvalThresholdCents) {
      setError("Autonomous limit must not exceed the approval threshold.");
      return;
    }
    setConfirmation({
      title: "Activate a new mandate version?",
      body: `${money(policy.monthlyBudgetCents)} monthly authority · ${money(policy.maxTransactionCents)} autonomous limit · ${money(policy.approvalThresholdCents)} approval threshold. Existing decisions remain unchanged.`,
      action: async () => {
        await mandateApi.createMandate(session.token, selected.id, {
          userIntent: "Operator updated financial controls from Agent Detail.",
          policy,
        });
        await refresh();
        setHistory(await mandateApi.mandates(session.token, selected.id));
      },
    });
  }
  async function createKey() {
    if (!selected) return;
    const issued = await mandateApi.createKey(session.token, selected.id, {
      name: `${selected.name} key`,
      scopes: ["authorizations:write"],
    });
    setSecret(issued.apiKey);
    setKeys(await mandateApi.keys(session.token, selected.id));
  }
  async function revoke(key: ApiKeyRecord) {
    if (!selected) return;
    setConfirmation({
      title: `Revoke ${key.name}?`,
      body: "Agents using this credential will immediately lose access. The revocation is recorded in the audit trail.",
      destructive: true,
      action: async () => {
        await mandateApi.revokeKey(session.token, selected.id, key.id);
        setKeys(await mandateApi.keys(session.token, selected.id));
      },
    });
  }
  async function rotate(key: ApiKeyRecord) {
    if (!selected) return;
    setConfirmation({
      title: `Rotate ${key.name}?`,
      body: "A replacement will be created and shown once. The current credential will be revoked immediately.",
      action: async () => {
        const issued = await mandateApi.createKey(session.token, selected.id, {
          name: `${key.name} replacement`,
          scopes: key.scopes,
        });
        await mandateApi.revokeKey(session.token, selected.id, key.id);
        setSecret(issued.apiKey);
        setKeys(await mandateApi.keys(session.token, selected.id));
      },
    });
  }
  async function runConfirmedAction() {
    if (!confirmation) return;
    setActing(true);
    try {
      await confirmation.action();
      setConfirmation(null);
    } catch {
      setError("The requested control change could not be completed.");
    } finally {
      setActing(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <p>{agents.length} agents in this workspace.</p>
          <span>
            Select an agent to manage authority, mandate versions, and
            credentials.
          </span>
        </div>
        <button className="primary" onClick={() => setCreating(true)}>
          <Plus /> Create agent
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {creating && (
        <form className="card inline-create" onSubmit={create}>
          <div>
            <b>Create agent</b>
            <span>
              Give it a narrow operational purpose. A mandate is added
              separately.
            </span>
          </div>
          <label>
            Name
            <input required name="name" minLength={2} />
          </label>
          <label>
            Purpose
            <input required name="purpose" minLength={3} />
          </label>
          <button
            className="secondary"
            type="button"
            onClick={() => setCreating(false)}
          >
            Cancel
          </button>
          <button className="primary">Create</button>
        </form>
      )}
      {!selected ? (
        <div className="empty card">
          <Bot />
          <h2>Create your first agent</h2>
          <p>
            Start with one narrow purpose, such as software purchasing or team
            travel. You will define its financial authority next.
          </p>
          <button className="primary" onClick={() => setCreating(true)}>
            <Plus /> Create an agent
          </button>
        </div>
      ) : (
        <div className="agent-master-detail">
          <aside className="card agent-list">
            {agents.map((a) => (
              <button
                className={a.id === selected.id ? "active" : ""}
                onClick={() => setSelectedId(a.id)}
                key={a.id}
              >
                <span className={`status-dot ${a.status.toLowerCase()}`} />
                <span>
                  <b>{a.name}</b>
                  <small>
                    {a.status} ·{" "}
                    {a.mandate
                      ? money(a.mandate.monthlyBudgetCents)
                      : "No mandate"}
                  </small>
                </span>
              </button>
            ))}
          </aside>
          <section className="card agent-detail">
            <div className="agent-detail-head">
              <div>
                <span className="kicker">AGENT DETAIL</span>
                <h2>{selected.name}</h2>
                <p>{selected.purpose}</p>
              </div>
              <div className="agent-actions">
                <button
                  className="secondary"
                  disabled={selected.status === "REVOKED"}
                  onClick={() =>
                    void status(
                      selected.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                    )
                  }
                >
                  {selected.status === "ACTIVE" ? <Pause /> : <Play />}
                  {selected.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
                <button
                  className="decline"
                  disabled={selected.status === "REVOKED"}
                  onClick={() => void status("REVOKED")}
                >
                  <Trash2 /> Revoke
                </button>
              </div>
            </div>
            {selected.mandate ? (
              <form className="control-form" onSubmit={saveControls}>
                <h3>Financial controls</h3>
                <label>
                  Monthly budget (USD)
                  <input
                    name="budget"
                    type="number"
                    min="0"
                    defaultValue={selected.mandate.monthlyBudgetCents / 100}
                  />
                </label>
                <label>
                  Autonomous limit
                  <input
                    name="limit"
                    type="number"
                    min="0"
                    defaultValue={selected.mandate.maxTransactionCents / 100}
                  />
                </label>
                <label>
                  Approval threshold
                  <input
                    name="threshold"
                    type="number"
                    min="0"
                    defaultValue={selected.mandate.approvalThresholdCents / 100}
                  />
                </label>
                <label className="check-control">
                  <input
                    name="approvalAll"
                    type="checkbox"
                    defaultChecked={selected.mandate.requireApprovalForAll}
                  />{" "}
                  Require approval for every future request
                </label>
                <button className="primary">
                  <Settings2 /> Activate new version
                </button>
              </form>
            ) : (
              <div className="empty compact">
                <ShieldAlert />
                <p>
                  No active mandate. Create one before issuing a credential.
                </p>
                <button
                  className="primary"
                  onClick={() => setView("Create Mandate")}
                >
                  Create mandate
                </button>
              </div>
            )}
            <div className="credentials">
              <div className="section-head">
                <div>
                  <h3>API credentials</h3>
                  <p>
                    Secrets are shown once; only their SHA-256 hashes are
                    stored.
                  </p>
                </div>
                <button
                  className="secondary"
                  disabled={!selected.mandate || selected.status === "REVOKED"}
                  onClick={() => void createKey()}
                >
                  <KeyRound /> Create scoped key
                </button>
              </div>
              {secret && (
                <div className="secret-reveal" role="status">
                  <div>
                    <b>Copy this key now</b>
                    <code>{secret}</code>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => navigator.clipboard.writeText(secret)}
                  >
                    <Copy /> Copy
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Dismiss secret"
                    onClick={() => setSecret("")}
                  >
                    <X />
                  </button>
                </div>
              )}
              <div className="key-list">
                {keys.length ? (
                  keys.map((key) => (
                    <div key={key.id}>
                      <span>
                        <b>{key.name}</b>
                        <small>
                          {key.prefix}… · {key.scopes.join(", ")} ·{" "}
                          {key.revokedAt ? "Revoked" : "Active"}
                        </small>
                      </span>
                      <button
                        className="secondary"
                        disabled={!!key.revokedAt}
                        onClick={() => void rotate(key)}
                      >
                        <RotateCw /> Rotate
                      </button>
                      <button
                        className="decline"
                        disabled={!!key.revokedAt}
                        onClick={() => void revoke(key)}
                      >
                        Revoke
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted">No API credentials issued.</p>
                )}
              </div>
            </div>
            <div className="mandate-history">
              <h3>Mandate history</h3>
              {history.map((m) => (
                <div key={m.id}>
                  <b>
                    Version {m.version}
                    {m.active ? " · Active" : ""}
                  </b>
                  <span>
                    {new Date(m.createdAt).toLocaleString()} ·{" "}
                    {money(m.policy.monthlyBudgetCents)} monthly
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      {confirmation && (
        <div className="decision-modal-backdrop">
          <section
            className="decision-modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-confirm-title"
          >
            <h2 id="agent-confirm-title">{confirmation.title}</h2>
            <p>{confirmation.body}</p>
            <div className="modal-actions">
              <button
                className="secondary"
                disabled={acting}
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className={confirmation.destructive ? "decline" : "primary"}
                disabled={acting}
                onClick={() => void runConfirmedAction()}
              >
                {acting ? "Applying change…" : "Confirm change"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function MandateLivePage({
  agents,
  session,
  refresh,
  text,
  setText,
  setView,
}: {
  agents: ApiAgent[];
  session: Session;
  refresh: () => Promise<void>;
  text: string;
  setText: (value: string) => void;
  parsed: boolean;
  setParsed: (value: boolean) => void;
  setView: (view: "Agents") => void;
}) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? ""),
    [result, setResult] = useState<MandateInterpretation | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reviewingActivation, setReviewingActivation] = useState(false);
  async function interpret() {
    setBusy(true);
    setError("");
    try {
      setResult(await mandateApi.interpretMandate(session.token, text));
    } catch (e) {
      setError(
        e instanceof MandateApiError &&
          e.code === "MANDATE_INTERPRETER_NOT_CONFIGURED"
          ? "OpenAI interpretation is not configured on the API service. Add OPENAI_API_KEY in Railway."
          : "Mandate interpretation failed. Your instructions were preserved; try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function edit<K extends keyof MandatePolicy>(
    key: K,
    value: MandatePolicy[K],
  ) {
    setResult((r) => (r ? { ...r, policy: { ...r.policy, [key]: value } } : r));
  }
  async function activate() {
    if (!result || !agentId) return;
    setBusy(true);
    try {
      await mandateApi.createMandate(session.token, agentId, {
        userIntent: text,
        policy: result.policy,
      });
      await refresh();
      setView("Agents");
    } finally {
      setBusy(false);
      setReviewingActivation(false);
    }
  }
  const list = (value: string) =>
    value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  if (!agents.length)
    return (
      <section className="empty card mandate-prerequisite">
        <Bot />
        <h2>Create an agent before defining authority</h2>
        <p>
          A mandate belongs to one agent. Create the agent first, then return
          here to structure and review its rules.
        </p>
        <button className="primary" onClick={() => setView("Agents")}>
          <Plus /> Create an agent
        </button>
      </section>
    );
  const invalidLimits =
    result &&
    result.policy.maxTransactionCents > result.policy.approvalThresholdCents;
  return (
    <>
      <div className="mandate-flow" aria-label="Mandate creation stages">
        <span className="active">User intent</span>
        <span>Proposed rules</span>
        <span>Human review</span>
        <span>Active version</span>
      </div>
      <div className="mandate-grid">
        <section className="card mandate-compose">
          <h2>Describe financial authority</h2>
          <p>
            AI proposes structure. It cannot approve, decline, or authorize a
            transaction.
          </p>
          <label>
            Agent
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Instructions
            <textarea
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={5000}
            />
            <small>{text.length}/5000 characters</small>
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button
            className="primary full"
            disabled={busy || !agentId || text.trim().length < 10}
            onClick={() => void interpret()}
          >
            <SlidersHorizontal />{" "}
            {busy ? "Structuring policy…" : "Structure policy"}
          </button>
          <div className="ai-boundary-note">
            <Sparkles /> OpenAI interprets these instructions; deterministic
            code remains authoritative.
          </div>
        </section>
        <section className="card policy-preview">
          <h2>Review deterministic rules</h2>
          {!result ? (
            <div className="empty">
              <SlidersHorizontal />
              <p>
                The proposed policy appears here. Nothing activates
                automatically.
              </p>
            </div>
          ) : (
            <>
              <div className="llm-boundary">
                <SlidersHorizontal />
                <div>
                  <b>{result.summary}</b>
                  <span>
                    Schema-validated proposal. Review every field before
                    activation.
                  </span>
                </div>
              </div>
              {(result.ambiguities.length > 0 ||
                result.assumptions.length > 0) && (
                <div className="interpretation-notes">
                  {result.ambiguities.map((x) => (
                    <p key={x}>
                      <strong>Ambiguity:</strong> {x}
                    </p>
                  ))}
                  {result.assumptions.map((x) => (
                    <p key={x}>
                      <strong>Assumption:</strong> {x}
                    </p>
                  ))}
                </div>
              )}
              <div className="policy-fields">
                <label>
                  Monthly budget (USD)
                  <input
                    type="number"
                    min="0"
                    value={result.policy.monthlyBudgetCents / 100}
                    onChange={(e) =>
                      edit(
                        "monthlyBudgetCents",
                        Math.round(Number(e.target.value) * 100),
                      )
                    }
                  />
                </label>
                <label>
                  Autonomous limit
                  <input
                    type="number"
                    min="0"
                    value={result.policy.maxTransactionCents / 100}
                    onChange={(e) =>
                      edit(
                        "maxTransactionCents",
                        Math.round(Number(e.target.value) * 100),
                      )
                    }
                  />
                </label>
                <label>
                  Approval threshold
                  <input
                    type="number"
                    min="0"
                    value={result.policy.approvalThresholdCents / 100}
                    onChange={(e) =>
                      edit(
                        "approvalThresholdCents",
                        Math.round(Number(e.target.value) * 100),
                      )
                    }
                  />
                </label>
                <label>
                  Allowed categories
                  <input
                    value={result.policy.allowedCategories.join(", ")}
                    onChange={(e) =>
                      edit("allowedCategories", list(e.target.value))
                    }
                  />
                </label>
                <label>
                  Blocked categories
                  <input
                    value={result.policy.blockedCategories.join(", ")}
                    onChange={(e) =>
                      edit("blockedCategories", list(e.target.value))
                    }
                  />
                </label>
                <label>
                  Allowed countries
                  <input
                    value={result.policy.allowedCountries.join(", ")}
                    onChange={(e) =>
                      edit(
                        "allowedCountries",
                        list(e.target.value.toUpperCase()),
                      )
                    }
                  />
                </label>
                <label className="check-control">
                  <input
                    type="checkbox"
                    checked={result.policy.requireApprovalForNewMerchant}
                    onChange={(e) =>
                      edit("requireApprovalForNewMerchant", e.target.checked)
                    }
                  />{" "}
                  Review every new merchant
                </label>
                <label className="check-control">
                  <input
                    type="checkbox"
                    checked={result.policy.requireApprovalForAll}
                    onChange={(e) =>
                      edit("requireApprovalForAll", e.target.checked)
                    }
                  />{" "}
                  Review every transaction
                </label>
              </div>
              {invalidLimits && (
                <div className="auth-error" role="alert">
                  Autonomous limit must not exceed the approval threshold.
                </div>
              )}
              <div className="policy-check">
                <CheckCircle2 />
                <span>
                  Human-reviewed proposal · deterministic authority only
                </span>
              </div>
              <button
                className="primary full"
                disabled={busy || Boolean(invalidLimits)}
                onClick={() => setReviewingActivation(true)}
              >
                <Shield /> Review activation
              </button>
            </>
          )}
        </section>
      </div>
      {reviewingActivation && result && (
        <div className="decision-modal-backdrop">
          <section
            className="decision-modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activate-title"
          >
            <h2 id="activate-title">Activate this mandate version?</h2>
            <p>
              This creates a new immutable version for future requests. Prior
              decisions remain unchanged.
            </p>
            <dl className="decision-context">
              <div>
                <dt>Monthly authority</dt>
                <dd>{money(result.policy.monthlyBudgetCents)}</dd>
              </div>
              <div>
                <dt>Autonomous limit</dt>
                <dd>{money(result.policy.maxTransactionCents)}</dd>
              </div>
              <div>
                <dt>Approval threshold</dt>
                <dd>{money(result.policy.approvalThresholdCents)}</dd>
              </div>
              <div>
                <dt>Agent</dt>
                <dd>{agents.find((a) => a.id === agentId)?.name}</dd>
              </div>
            </dl>
            <div className="modal-actions">
              <button
                className="secondary"
                onClick={() => setReviewingActivation(false)}
              >
                Continue editing
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => void activate()}
              >
                {busy ? "Activating…" : "Activate version"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function AuditLivePage({ session }: { session: Session }) {
  const [events, setEvents] = useState<AuditEvent[]>([]),
    [verification, setVerification] = useState<string>(""),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    mandateApi
      .auditEvents(session.token)
      .then(setEvents)
      .finally(() => setBusy(false));
  }, [session.token]);
  async function verify() {
    const v = await mandateApi.verifyAudit(session.token);
    const time = new Date().toLocaleString();
    setVerification(
      v.valid
        ? `Verified ${v.checked} linked events at ${time}. Head ${v.headHash?.slice(0, 12) ?? "genesis"}…`
        : `Integrity break detected at event ${v.brokenAtSequence}. Stop relying on this chain and investigate the database record.`,
    );
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <p>Tamper-evident authorization evidence.</p>
          <span>
            Every actor, subject, payload, and SHA-256 link comes from the live
            audit chain.
          </span>
        </div>
        <button className="secondary" onClick={() => void verify()}>
          <Shield /> Verify integrity
        </button>
      </div>
      {verification && (
        <div
          className={`integrity-result ${verification.startsWith("Verified") ? "valid" : "invalid"}`}
          role="status"
        >
          {verification.startsWith("Verified") ? <Check /> : <X />}
          {verification}
        </div>
      )}
      <section className="card audit-ledger">
        {busy ? (
          <div className="empty">Loading audit evidence…</div>
        ) : events.length === 0 ? (
          <div className="empty">No audit events yet.</div>
        ) : (
          events.map((event) => (
            <article key={event.id}>
              <div className="audit-sequence">#{event.sequence}</div>
              <div>
                <time>{new Date(event.createdAt).toLocaleString()}</time>
                <h3>{event.eventType.replaceAll("_", " ").toLowerCase()}</h3>
                <p>
                  {event.actorType} {event.actorId.slice(0, 8)}… acted on{" "}
                  {event.subjectType} {event.subjectId.slice(0, 8)}…
                </p>
                <details>
                  <summary>Inspect evidence payload and hashes</summary>
                  <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                  <small>
                    SHA-256 <code>{event.eventHash}</code>
                    <br />
                    Previous <code>{event.previousHash ?? "GENESIS"}</code>
                  </small>
                </details>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
