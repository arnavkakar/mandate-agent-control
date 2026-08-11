"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { FormEvent, useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Bot, Check, CheckCircle2,
  ChevronRight, CircleDollarSign, Clock3, FileText, Gauge, LayoutDashboard,
  LockKeyhole, Menu, MoreHorizontal, Pause, Play, Plus, Search, Send,
  Settings2, Shield, ShieldAlert, SlidersHorizontal, Sparkles, UserCheck,
  WalletCards, X, XCircle, Zap, Plug, KeyRound, Webhook, Copy, TerminalSquare, Database,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ApiAgent, ApiTransaction, DashboardSummary, loadSession, mandateApi, MandateApiError, saveSession, Session } from "./lib/mandate-api";
import { AgentsLivePage, MandateLivePage } from "./live-pages";

type Decision = "APPROVED" | "APPROVAL_REQUIRED" | "DECLINED";
type View = "Overview" | "Agents" | "Transactions" | "Approvals" | "Risk Activity" | "Audit Trail" | "Simulator" | "Connections" | "Create Mandate";

type Tx = {
  id: string; merchant: string; category: string; amount: number; agent: string;
  time: string; decision: Decision; risk: number; country: string; isNew: boolean;
  reason: string; factors: string[]; approvalRequestId?: string|null;
  policyRules?: {rule:string;outcome:"PASS"|"REVIEW"|"FAIL";reason:string}[];
};

const seedTransactions: Tx[] = [
  { id:"TX-8F21", merchant:"Notion", category:"Software", amount:96, agent:"Procurement Agent", time:"Today, 10:42 AM", decision:"APPROVED", risk:12, country:"US", isNew:false, reason:"Within autonomous limit and matches all mandate rules.", factors:[] },
  { id:"TX-8F20", merchant:"AWS", category:"Cloud services", amount:212, agent:"Engineering Ops", time:"Today, 9:18 AM", decision:"APPROVED", risk:18, country:"US", isNew:false, reason:"Known merchant, allowed category, and within budget.", factors:[] },
  { id:"TX-8F19", merchant:"Apple", category:"Office equipment", amount:899, agent:"Procurement Agent", time:"Yesterday, 4:33 PM", decision:"APPROVAL_REQUIRED", risk:46, country:"US", isNew:true, reason:"Amount exceeds autonomous limit and merchant is new.", factors:["New merchant", "Amount anomaly"] },
  { id:"TX-8F18", merchant:"Binance", category:"Crypto", amount:600, agent:"Growth Agent", time:"Yesterday, 2:05 PM", decision:"DECLINED", risk:92, country:"KY", isNew:true, reason:"Merchant category and international geography are blocked.", factors:["Blocked category", "Geography mismatch", "New merchant"] },
  { id:"TX-8F17", merchant:"Delta", category:"Travel", amount:389, agent:"Travel Coordinator", time:"Aug 8, 11:21 AM", decision:"APPROVAL_REQUIRED", risk:38, country:"US", isNew:false, reason:"Amount exceeds the $300 travel approval threshold.", factors:["Approval threshold"] },
  { id:"TX-8F16", merchant:"Meta Ads", category:"Advertising", amount:340, agent:"Growth Agent", time:"Aug 8, 8:54 AM", decision:"APPROVED", risk:22, country:"US", isNew:false, reason:"Known merchant and allowed advertising spend.", factors:["Elevated velocity"] },
];

const agents = [
  { name:"Procurement Agent", purpose:"Software & office purchasing", spent:1211, budget:2000, status:"Active", color:"#6C5CE7", initials:"PA", limit:250 },
  { name:"Growth Agent", purpose:"Paid acquisition & experiments", spent:2184, budget:5000, status:"Active", color:"#087F6B", initials:"GA", limit:500 },
  { name:"Travel Coordinator", purpose:"Team travel & accommodation", spent:1238, budget:3000, status:"Active", color:"#B86B08", initials:"TC", limit:300 },
  { name:"Engineering Ops", purpose:"Cloud & developer tooling", spent:1182, budget:4000, status:"Paused", color:"#5846D6", initials:"EO", limit:350 },
];

const spend = [
  {d:"Jul 14", v:430},{d:"Jul 18",v:620},{d:"Jul 22",v:540},{d:"Jul 26",v:910},{d:"Jul 30",v:760},{d:"Aug 3",v:1220},{d:"Aug 7",v:1030},{d:"Aug 10",v:1390}
];

const nav: {label:View; icon:any; count?:number}[] = [
  {label:"Overview",icon:LayoutDashboard},{label:"Agents",icon:Bot},{label:"Transactions",icon:WalletCards},
  {label:"Approvals",icon:UserCheck,count:2},{label:"Risk Activity",icon:ShieldAlert},{label:"Audit Trail",icon:FileText},
  {label:"Simulator",icon:Zap},{label:"Connections",icon:Plug},
];

const money = (n:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

function StatusPill({value}:{value:Decision}) {
  const label = value === "APPROVAL_REQUIRED" ? "Needs approval" : value === "APPROVED" ? "Approved" : "Declined";
  return <span className={`pill ${value.toLowerCase()}`}><span className="pill-dot" />{label}</span>;
}

function Metric({label,value,delta,icon:Icon,tone}:{label:string;value:string;delta:string;icon:any;tone:string}){
  return <div className="metric card"><div className={`metric-icon ${tone}`}><Icon size={18}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className={`metric-delta ${delta.startsWith("+")?"up":""}`}>{delta}</div></div>
}

function AppLogo(){return <div className="logo"><div className="logo-mark"><LockKeyhole size={17}/></div><span>mandate</span></div>}

export default function Home(){
  const [session,setSession]=useState<Session|null>(null);
  const [sessionReady,setSessionReady]=useState(false);
  useEffect(()=>{setSession(loadSession());setSessionReady(true)},[]);
  if(!sessionReady) return <div className="auth-loading">Loading Mandate…</div>;
  if(!session) return <AuthPage onAuthenticated={next=>{saveSession(next);setSession(next)}}/>;
  return <Workspace session={session} onLogout={()=>{saveSession(null);setSession(null)}}/>;
}

function AuthPage({onAuthenticated}:{onAuthenticated:(session:Session)=>void}){
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const form=new FormData(event.currentTarget);try{const next=mode==="login"?await mandateApi.login({email:String(form.get("email")),password:String(form.get("password"))}):await mandateApi.signup({name:String(form.get("name")),organizationName:String(form.get("organizationName")),email:String(form.get("email")),password:String(form.get("password"))});onAuthenticated(next)}catch(cause){setError(cause instanceof MandateApiError?(cause.code==="INVALID_CREDENTIALS"?"Email or password is incorrect.":cause.code):"Could not reach the Mandate API.")}finally{setBusy(false)}}
  return <main className="auth-shell"><section className="auth-card card"><AppLogo/><span className="kicker">PRODUCTION CONTROL CENTER</span><h1>{mode==="login"?"Sign in to Mandate":"Create your workspace"}</h1><p>Manage deterministic authorization for every agent purchase request.</p><form onSubmit={submit}>{mode==="signup"&&<><label>Your name<input required name="name" minLength={2} autoComplete="name"/></label><label>Organization<input required name="organizationName" minLength={2}/></label></>}<label>Email<input required name="email" type="email" autoComplete="email"/></label><label>Password<input required name="password" type="password" minLength={mode==="signup"?12:1} autoComplete={mode==="login"?"current-password":"new-password"}/></label>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="primary full" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":"Create workspace"}</button></form><button className="text-button auth-switch" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}}>{mode==="login"?"New to Mandate? Create a workspace":"Already have an account? Sign in"}</button><small>No real payments are processed. Mandate stores authorization intent and decisions only.</small></section></main>;
}

function Workspace({session,onLogout}:{session:Session;onLogout:()=>void}){
  const [view,setView]=useState<View>("Overview");
  const [transactions,setTransactions]=useState<Tx[]>([]);
  const [workspaceAgents,setWorkspaceAgents]=useState<ApiAgent[]>([]);
  const [summary,setSummary]=useState<DashboardSummary|null>(null);
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState("");
  const [selected,setSelected]=useState<Tx|null>(null);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [approvalAll,setApprovalAll]=useState(false);
  const [simAgent,setSimAgent]=useState("Procurement Agent");
  const [simMerchant,setSimMerchant]=useState("Apple");
  const [simAmount,setSimAmount]=useState("899");
  const [simCategory,setSimCategory]=useState("Office equipment");
  const [simCountry,setSimCountry]=useState("US");
  const [simResult,setSimResult]=useState<Tx|null>(null);
  const [mandateText,setMandateText]=useState("Give my procurement agent $2,000 per month. It can purchase software and office equipment. Maximum autonomous transaction is $250. Require approval for any new merchant. Block crypto, gambling, and international transactions.");
  const [parsed,setParsed]=useState(false);

  async function refresh(){try{setLoadError("");const [agentRows,transactionRows,dashboard]=await Promise.all([mandateApi.agents(session.token),mandateApi.transactions(session.token),mandateApi.dashboard(session.token)]);setWorkspaceAgents(agentRows);setTransactions(transactionRows.map(mapApiTransaction));setSummary(dashboard);if(agentRows[0]&&!agentRows.some(agent=>agent.name===simAgent))setSimAgent(agentRows[0].name)}catch(cause){if(cause instanceof MandateApiError&&cause.status===401){onLogout();return}setLoadError("Live workspace data could not be loaded. Try again.")}finally{setLoading(false)}}
  useEffect(()=>{void refresh()},[session.token]);

  const pending=transactions.filter(t=>t.decision==="APPROVAL_REQUIRED");
  const title = view === "Approvals" ? "Approval Queue" : view;

  function simulate(){
    const amount=Number(simAmount)||0;
    const blocked=["Crypto","Gambling"].includes(simCategory) || simCountry!=="US";
    const isNew=!seedTransactions.some(t=>t.merchant.toLowerCase()===simMerchant.toLowerCase()&&t.decision==="APPROVED");
    const decision:Decision=blocked?"DECLINED":(approvalAll||amount>250||isNew)?"APPROVAL_REQUIRED":"APPROVED";
    const factors:string[]=[];
    if(isNew) factors.push("New merchant"); if(amount>500) factors.push("Amount anomaly"); if(blocked) factors.push(simCountry!=="US"?"Geography mismatch":"Blocked category");
    const risk=Math.min(100,12+(isNew?24:0)+(amount>500?22:0)+(blocked?42:0));
    const tx:Tx={id:`TX-${Math.random().toString(16).slice(2,6).toUpperCase()}`,merchant:simMerchant,category:simCategory,amount,agent:simAgent,time:"Just now · Simulation",decision,risk,country:simCountry,isNew,reason:blocked?"A deterministic mandate rule blocked this request.":decision==="APPROVED"?"All mandate rules passed; autonomous authorization is permitted.":"Human review is required before this simulated purchase can proceed.",factors};
    setSimResult(tx); setTransactions([tx,...transactions]);
  }

  async function resolve(tx:Tx,approved:boolean,note?:string){
    if(!tx.approvalRequestId)return;
    try{await mandateApi.resolveApproval(session.token,tx.approvalRequestId,approved?"APPROVED":"DECLINED",note);await refresh()}catch{setLoadError("The approval could not be resolved. It may no longer be pending.")}
  }

  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a>
    <aside className={`sidebar ${mobileOpen?"open":""}`}>
      <div className="sidebar-top"><AppLogo/><button className="close-mobile" onClick={()=>setMobileOpen(false)} aria-label="Close menu"><X/></button></div>
      <nav><div className="nav-section">Workspace</div>{nav.slice(0,4).map(n=><button key={n.label} className={view===n.label?"active":""} onClick={()=>{setView(n.label);setMobileOpen(false)}}><n.icon size={18}/><span>{n.label}</span>{n.count?<em>{pending.length}</em>:null}</button>)}<div className="nav-section second">Intelligence</div>{nav.slice(4).map(n=><button key={n.label} className={view===n.label?"active":""} onClick={()=>{setView(n.label);setMobileOpen(false)}}><n.icon size={18}/><span>{n.label}</span></button>)}</nav>
      <div className="sidebar-bottom"><button className="help-card"><div className="help-icon"><Shield size={16}/></div><div><b>Policy engine</b><small>All systems operational</small></div><span className="live-dot"/></button><button className="profile" onClick={onLogout}><div className="avatar">{session.user?.name?.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()||"ME"}</div><div><b>{session.user?.name||"Workspace owner"}</b><small>Sign out</small></div><MoreHorizontal size={18}/></button></div>
    </aside>
    <main id="main-content">
      <header><button className="menu-btn" aria-label="Open navigation" onClick={()=>setMobileOpen(true)}><Menu/></button><div><div className="eyebrow">Control center</div><h1>{title}</h1></div><div className="header-actions"><div className="system-status"><span/>Simulation mode</div><button className="icon-button" disabled title="Global search is planned" aria-label="Global search (planned)"><Search size={18}/></button><button className="primary" onClick={()=>setView("Create Mandate")}><Plus size={17}/> New mandate</button></div></header>
      <div className="content">
        {loadError&&<div className="auth-error" role="alert">{loadError} <button className="text-button" onClick={()=>void refresh()}>Retry</button></div>}
        {loading?<div className="empty card"><Shield/><h2>Loading workspace</h2><p>Reading your authorization ledger from Railway.</p></div>:<>
          {view==="Overview"&&<Overview setView={setView} transactions={transactions} setSelected={setSelected} summary={summary} agentCount={workspaceAgents.length}/>}
          {view==="Agents"&&<AgentsLivePage setView={setView} approvalAll={approvalAll} setApprovalAll={setApprovalAll} agents={workspaceAgents} session={session} refresh={refresh}/>}
          {view==="Transactions"&&<TransactionsPage transactions={transactions} setSelected={setSelected}/>}
          {view==="Approvals"&&<ApprovalsPage pending={pending} resolve={resolve} setSelected={setSelected}/>}
          {view==="Risk Activity"&&<RiskPage transactions={transactions} setSelected={setSelected}/>}
          {view==="Audit Trail"&&<AuditPage transactions={transactions}/>}
          {view==="Simulator"&&<Simulator agents={workspaceAgents} agent={simAgent} setAgent={setSimAgent} merchant={simMerchant} setMerchant={setSimMerchant} amount={simAmount} setAmount={setSimAmount} category={simCategory} setCategory={setSimCategory} country={simCountry} setCountry={setSimCountry} result={simResult} simulate={simulate} setSelected={setSelected}/>}
          {view==="Connections"&&<ConnectionsPage/>}
          {view==="Create Mandate"&&<MandateLivePage agents={workspaceAgents} session={session} refresh={refresh} text={mandateText} setText={setMandateText} parsed={parsed} setParsed={setParsed} setView={setView}/>}
        </>}
      </div>
    </main>
    {selected&&<DecisionDrawer tx={selected} close={()=>setSelected(null)}/>} 
  </div>
}

function mapApiTransaction(row:ApiTransaction):Tx{return {id:row.id,merchant:row.merchant,category:row.category,amount:row.amountCents/100,agent:row.agentName,time:new Date(row.createdAt).toLocaleString(),decision:row.decision,risk:row.riskScore,country:row.country,isNew:row.riskFactors.some(f=>f.code==="NEW_MERCHANT"),reason:row.reasons[0]??"Deterministic policy evaluation completed.",factors:row.riskFactors.map(f=>f.detail),approvalRequestId:row.approvalRequestId,policyRules:row.policyRules}}

function Overview({setView,transactions,setSelected,summary,agentCount}:{setView:(v:View)=>void;transactions:Tx[];setSelected:(t:Tx)=>void;summary:DashboardSummary|null;agentCount:number}){
 return <><div className="page-intro"><div><p>Your agents spent <strong>{money((summary?.authorizedSpendCents??0)/100)}</strong> across {agentCount} agents this month.</p><span>{summary?.review??0} requests need human attention.</span></div><button className="secondary" onClick={()=>setView("Simulator")}><Zap size={16}/> Test a transaction</button></div>
 <div className="metrics-grid"><Metric label="Agent spend" value={money((summary?.authorizedSpendCents??0)/100)} delta="Authorized this month" icon={CircleDollarSign} tone="violet"/><Metric label="Budget remaining" value={money((summary?.remainingBudgetCents??0)/100)} delta={`${summary?.authorizedBudgetCents?Math.round((summary.remainingBudgetCents/summary.authorizedBudgetCents)*100):0}% available`} icon={Gauge} tone="blue"/><Metric label="Auto-approved" value={String(summary?.approved??0)} delta="Deterministic decisions" icon={CheckCircle2} tone="green"/><Metric label="Needs review" value={String(summary?.review??0)} delta="Human decision required" icon={Clock3} tone="amber"/><Metric label="Blocked" value={String(summary?.declined??0)} delta={`${summary?.highRisk??0} high-risk attempts`} icon={ShieldAlert} tone="red"/></div>
 <div className="dashboard-grid"><section className="card chart-card"><div className="card-header"><div><span className="kicker">SPEND CONTROL</span><h2>Authorized spend</h2></div><select aria-label="Chart range"><option>Last 30 days</option></select></div><div className="chart-summary"><b>$5,815</b><span><ArrowRight size={13}/> $8,185 remaining</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={spend} margin={{left:-20,right:8,top:12,bottom:0}}><defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6C5CE7" stopOpacity={.25}/><stop offset="1" stopColor="#6C5CE7" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e7ef"/><XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#8a8795"}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#8a8795"}} tickFormatter={v=>`$${v}`}/><Tooltip contentStyle={{borderRadius:10,border:"1px solid #e6e2ee",fontSize:12}} formatter={(v)=>[`$${v}`,"Spend"]}/><Area type="monotone" dataKey="v" stroke="#6C5CE7" strokeWidth={2.5} fill="url(#spendFill)"/></AreaChart></ResponsiveContainer></div></section>
 <section className="card attention"><div className="card-header"><div><span className="kicker">ACTION CENTER</span><h2>Needs your attention</h2></div><button className="text-button" onClick={()=>setView("Approvals")}>View all <ArrowRight size={14}/></button></div>{transactions.filter(tx=>tx.decision==="APPROVAL_REQUIRED"&&tx.approvalRequestId).slice(0,2).map(tx=><button className="attention-item" key={tx.id} onClick={()=>setSelected(tx)}><div className="brand-icon apple">{tx.merchant[0]}</div><div className="attention-info"><b>{tx.merchant} <span>{money(tx.amount)}</span></b><small>{tx.agent} · {tx.reason}</small></div><span className={`risk ${tx.risk>=45?"medium":"low"}`}>{tx.risk} risk</span><ChevronRight size={18}/></button>)}<div className="attention-footer"><Shield size={15}/><span>Mandate blocked {summary?.declined??0} attempts</span></div></section></div>
 <section className="card table-card"><div className="card-header"><div><span className="kicker">LIVE LEDGER</span><h2>Recent decisions</h2></div><button className="text-button" onClick={()=>setView("Transactions")}>All transactions <ArrowRight size={14}/></button></div><TransactionTable rows={transactions.slice(0,5)} onOpen={setSelected}/></section></>
}

function TransactionTable({rows,onOpen}:{rows:Tx[];onOpen:(t:Tx)=>void}){if(!rows.length)return <div className="compact-empty"><Search size={20}/><div><b>No decisions match this view</b><span>Change the filter or submit a simulated request.</span></div></div>;return <div className="table-wrap"><table><thead><tr><th>Merchant</th><th>Agent</th><th>Amount</th><th>Decision</th><th>Risk</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{rows.map(t=><tr key={t.id} tabIndex={0} aria-label={`Open ${t.merchant} authorization decision`} onClick={()=>onOpen(t)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onOpen(t)}}}><td><b>{t.merchant}</b><small>{t.category} · {t.time}</small></td><td>{t.agent}</td><td className="amount">{money(t.amount)}</td><td><StatusPill value={t.decision}/></td><td><span className={`score ${t.risk>=70?"high":t.risk>=35?"med":""}`}>{t.risk}<span className="sr-only"> out of 100</span></span></td><td><ChevronRight size={17}/></td></tr>)}</tbody></table></div>}

function AgentsPage({setView,approvalAll,setApprovalAll}:{setView:(v:View)=>void;approvalAll:boolean;setApprovalAll:(v:boolean)=>void}){const [paused,setPaused]=useState<string[]>(["Engineering Ops"]);return <><div className="page-intro"><div><p>Four agents operate under active financial mandates.</p><span>Change controls take effect immediately on future requests.</span></div><button className="primary"><Plus size={17}/> Create agent</button></div><div className="control-banner card"><div><Shield size={20}/><div><b>Emergency control</b><span>Require human approval for every future agent transaction.</span></div></div><label className="switch"><input aria-label="Require approval for all future transactions" type="checkbox" checked={approvalAll} onChange={e=>setApprovalAll(e.target.checked)}/><span/></label></div><div className="agent-grid">{agents.map(a=>{const isPaused=paused.includes(a.name);return <div className="agent-card card" key={a.name}><div className="agent-head"><div className="agent-avatar" style={{background:a.color}}>{a.initials}</div><button className="icon-button"><MoreHorizontal size={18}/></button></div><h3>{a.name}</h3><p>{a.purpose}</p><div className="agent-status"><span className={isPaused?"paused":""}/>{isPaused?"Paused":"Active"}</div><div className="budget-row"><span>Monthly budget</span><b>{money(a.spent)} <em>/ {money(a.budget)}</em></b></div><div className="progress"><i style={{width:`${a.spent/a.budget*100}%`,background:a.color}}/></div><div className="agent-rule"><span>Autonomous limit</span><b>{money(a.limit)}</b></div><div className="agent-actions"><button className="secondary" onClick={()=>setPaused(p=>isPaused?p.filter(x=>x!==a.name):[...p,a.name])}>{isPaused?<Play size={15}/>:<Pause size={15}/>} {isPaused?"Resume":"Pause"}</button><button className="secondary" onClick={()=>setView("Create Mandate")}><Settings2 size={15}/> Edit rules</button></div></div>})}</div></>}

function TransactionsPage({transactions,setSelected}:{transactions:Tx[];setSelected:(t:Tx)=>void}){const [filter,setFilter]=useState("All");const [query,setQuery]=useState("");const rows=(filter==="All"?transactions:transactions.filter(t=>t.decision===filter)).filter(t=>`${t.merchant} ${t.agent}`.toLowerCase().includes(query.toLowerCase()));return <><div className="toolbar card"><label className="search"><Search size={16}/><span className="sr-only">Search transactions</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search transactions or agents…"/></label><div className="tabs">{["All","APPROVED","APPROVAL_REQUIRED","DECLINED"].map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f==="APPROVAL_REQUIRED"?"Needs review":f[0]+f.slice(1).toLowerCase()}</button>)}</div><button className="secondary" disabled title="Advanced filters are planned"><SlidersHorizontal size={15}/> Filters</button></div><section className="card table-card standalone"><div className="card-header"><div><span className="kicker">Authorization ledger</span><h2>{rows.length} authorization decisions</h2></div><button className="secondary" disabled title="CSV export is planned">Export CSV</button></div><TransactionTable rows={rows} onOpen={setSelected}/></section></>}

function ApprovalsPage({pending,resolve,setSelected}:{pending:Tx[];resolve:(t:Tx,a:boolean,note?:string)=>void;setSelected:(t:Tx)=>void}){const [review,setReview]=useState<{tx:Tx;approved:boolean}|null>(null);const [note,setNote]=useState("");function confirm(){if(!review)return;resolve(review.tx,review.approved,note.trim()||undefined);setReview(null);setNote("")}return <><div className="page-intro"><div><p>Review ambiguous or high-risk agent requests.</p><span>Each resolution is appended to the audit trail and applies to this request only.</span></div></div>{pending.length===0?<div className="empty card"><CheckCircle2/><h2>Queue clear</h2><p>There are no requests waiting for your approval.</p></div>:<div className="approval-list">{pending.map(t=><article className="approval-card card" key={t.id}><div className="approval-main"><div className="brand-icon apple">{t.merchant[0]}</div><div><span className="kicker">{t.agent}</span><h2>{t.merchant} <b>{money(t.amount)}</b></h2><p>{t.category} · {t.country} · requested {t.time.toLowerCase()}</p></div></div><div className="approval-reason"><div><AlertTriangle size={17}/><span>{t.reason}</span></div><button className="text-button" onClick={()=>setSelected(t)}>View policy evaluation <ChevronRight size={15}/></button></div><div className="approval-impact"><span>Decision context</span><b>{t.risk}/100 risk · {money(t.amount)} requested</b><small>The original policy and risk evaluation remain immutable.</small></div><div className="approval-actions"><span className={`risk ${t.risk>=45?"medium":"low"}`}>{t.risk} risk score</span><button className="decline" onClick={()=>setReview({tx:t,approved:false})}><X size={16}/> Decline</button><button className="approve" onClick={()=>setReview({tx:t,approved:true})}><Check size={16}/> Approve once</button></div></article>)}</div>}{review&&<div className="decision-modal-backdrop"><section className="decision-modal card" role="dialog" aria-modal="true" aria-labelledby="resolution-title"><div className="drawer-head"><div><span className="kicker">Human resolution</span><h2 id="resolution-title">{review.approved?"Approve":"Decline"} {review.tx.merchant} for {money(review.tx.amount)}?</h2></div><button className="icon-button" aria-label="Cancel resolution" onClick={()=>setReview(null)}><X/></button></div><dl className="decision-context"><div><dt>Agent</dt><dd>{review.tx.agent}</dd></div><div><dt>Risk</dt><dd>{review.tx.risk}/100</dd></div><div><dt>Policy result</dt><dd>Human review required</dd></div><div><dt>Scope</dt><dd>This request only</dd></div></dl><p>{review.tx.reason}</p><label className="review-note">Reviewer note <span>Optional</span><textarea value={note} onChange={event=>setNote(event.target.value)} rows={3} placeholder="Add context for the audit trail"/></label><div className="modal-actions"><button className="secondary" onClick={()=>setReview(null)}>Cancel</button><button className={review.approved?"approve":"decline"} onClick={confirm}>{review.approved?<Check size={16}/>:<X size={16}/>} Confirm {review.approved?"approval":"decline"}</button></div></section></div>}</>}

function RiskPage({transactions,setSelected}:{transactions:Tx[];setSelected:(t:Tx)=>void}){const risky=transactions.filter(t=>t.risk>=35);return <><div className="risk-hero card"><div><span className="kicker">RISK POSTURE</span><h2>Low overall exposure</h2><p>Mandate blocked 92% of policy-violating spend before human review.</p></div><div className="risk-ring"><b>24</b><span>AVG RISK</span></div></div><div className="factor-grid">{[["New merchant",12,42],["Amount anomaly",7,27],["Category mismatch",3,15],["Abnormal velocity",4,18],["Geography mismatch",2,9]].map(([x,n,p])=><div className="factor-card card" key={x as string}><span>{x}</span><b>{n}</b><div className="progress"><i style={{width:`${p}%`}}/></div><small>triggered this month</small></div>)}</div><section className="card table-card standalone"><div className="card-header"><div><span className="kicker">TRIGGERED EVENTS</span><h2>Elevated-risk attempts</h2></div></div><TransactionTable rows={risky} onOpen={setSelected}/></section></>}

function AuditPage({transactions}:{transactions:Tx[]}){return <><div className="page-intro"><div><p>An append-only record of every financial decision.</p><span>Each event links intent, policy, risk, authorization, and human action.</span></div><button className="secondary">Verify integrity</button></div><div className="audit card">{transactions.slice(0,5).map((t,i)=><div className="audit-row" key={t.id}><div className="audit-line"><span className={t.decision.toLowerCase()}>{i===0?<Sparkles size={14}/>:<Activity size={14}/>}</span></div><div className="audit-content"><div><span className="kicker">{t.time.toUpperCase()}</span><h3>{t.merchant} · {money(t.amount)}</h3><p>{t.agent} submitted a simulated purchase request.</p></div><StatusPill value={t.decision}/><div className="audit-flow"><span>User intent</span><ChevronRight/><span>{t.agent}</span><ChevronRight/><span>Policy evaluated</span><ChevronRight/><span>Risk {t.risk}/100</span><ChevronRight/><b>{t.decision.replace("_"," ")}</b></div><small>Event {t.id} · SHA-256 integrity reference <code>f2a9…{t.id.slice(-4).toLowerCase()}</code></small></div></div>)}</div></>}

function ConnectionsPage(){
  const [environment,setEnvironment]=useState<"Test"|"Production">("Test");
  const [copied,setCopied]=useState(false);
  const endpoint="https://api.your-mandate.app/v1/authorization-requests";
  const snippet=`curl ${endpoint} \\\n+  -H "X-Mandate-Key: mnd_test_••••••••" \\\n+  -H "Content-Type: application/json" \\\n+  -d '{"idempotencyKey":"order_01J8","amount":96,"currency":"USD","merchant":"Notion","category":"Software","country":"US"}'`;
  return <><div className="page-intro"><div><p>Connect agents to Mandate&apos;s authorization boundary.</p><span>Your agent submits requests; deterministic policy—not the agent or an LLM—returns the decision.</span></div><div className="environment-switch" aria-label="Environment">{(["Test","Production"] as const).map(item=><button key={item} disabled={item==="Production"} title={item==="Production"?"Production keys are not available in this MVP":undefined} className={environment===item?"active":""} onClick={()=>setEnvironment(item)}>{item}{item==="Production"?" · Planned":""}</button>)}</div></div>
  <div className="connection-callout card"><div className="connection-icon"><Plug size={20}/></div><div><span className="kicker">QUICK START</span><h2>One endpoint between intent and spend</h2><p>No transaction feed is required. Agents, MCP servers, or your backend call the authorization API before any simulated or future provider-side payment action.</p></div><span className="demo-tag">{environment} environment</span></div>
  <div className="connection-grid"><section className="card connection-card"><KeyRound/><span className="kicker">01 · IDENTITY</span><h3>Create a scoped agent key</h3><p>Keys are bound to one agent and only receive the minimum scopes required.</p><div className="secret-row"><code>mnd_{environment.toLowerCase()}_••••••••••••2F8A</code><button aria-label="Copy example key" onClick={()=>setCopied(true)}><Copy size={15}/></button></div><small>{copied?"Example copied":"Real secrets are shown once and stored only as SHA-256 hashes."}</small></section>
  <section className="card connection-card"><TerminalSquare/><span className="kicker">02 · AUTHORIZE</span><h3>Request a decision</h3><p>Use an idempotency key for safe retries. Amounts are converted to integer cents at the boundary.</p><div className="endpoint"><b>POST</b><code>/v1/authorization-requests</code></div><span className="scope">authorizations:write</span></section>
  <section className="card connection-card"><Webhook/><span className="kicker">03 · RESPOND</span><h3>Handle the outcome</h3><p>Proceed only for <b>APPROVED</b>. Hold for <b>APPROVAL_REQUIRED</b>. Stop for <b>DECLINED</b>.</p><div className="decision-list"><span className="approved">APPROVED</span><span className="approval_required">APPROVAL_REQUIRED</span><span className="declined">DECLINED</span></div></section></div>
  <div className="integration-grid"><section className="card code-panel"><div className="card-header"><div><span className="kicker">REST API</span><h2>Authorization request</h2></div><button className="secondary" onClick={()=>navigator.clipboard?.writeText(snippet)}><Copy size={14}/> Copy</button></div><pre>{snippet}</pre></section><section className="card architecture-panel"><span className="kicker">DATA OWNERSHIP</span><h2>What Mandate stores</h2>{[[Database,"PostgreSQL","Organizations, agents, mandates, decisions and budget ledger"],[Shield,"Policy engine","Versioned rules and explainable pass/review/fail results"],[FileText,"Audit chain","Tamper-evident event hashes and human resolutions"]].map(([Icon,title,body]:any)=><div className="architecture-row" key={title}><Icon size={17}/><div><b>{title}</b><small>{body}</small></div><CheckCircle2 size={16}/></div>)}<div className="boundary-note"><LockKeyhole size={15}/> No cards, bank credentials, or real payment instructions are stored.</div></section></div>
  <section className="card connector-strip"><div><span className="kicker">Extension points</span><h2>Plug in when your workflow needs it</h2><p>The core API works independently. These adapters are future ingestion and notification paths.</p></div>{[[Bot,"Agent SDK"],[Plug,"Hosted MCP"],[Webhook,"Webhooks"],[Database,"Expense systems"]].map(([Icon,label]:any)=><button key={label} disabled title={`${label} is planned`}><Icon size={18}/><span>{label}</span><small>Planned</small></button>)}</section></>;
}

function Simulator(p:any){return <div className="sim-grid"><section className="card sim-form"><div className="card-header"><div><span className="kicker">SANDBOX</span><h2>Submit a purchase request</h2></div><span className="demo-tag">No money moves</span></div><p className="section-copy">Test how Mandate evaluates a transaction using live policy logic.</p><div className="form-grid"><label>Agent<select value={p.agent} onChange={(e)=>p.setAgent(e.target.value)}>{agents.map(a=><option key={a.name}>{a.name}</option>)}</select></label><label>Merchant<input value={p.merchant} onChange={(e)=>p.setMerchant(e.target.value)}/></label><label>Amount (USD)<div className="money-input"><span>$</span><input type="number" value={p.amount} onChange={(e)=>p.setAmount(e.target.value)}/></div></label><label>Category<select value={p.category} onChange={(e)=>p.setCategory(e.target.value)}>{["Software","Office equipment","Cloud services","Travel","Advertising","Crypto","Gambling"].map(x=><option key={x}>{x}</option>)}</select></label><label>Country<select value={p.country} onChange={(e)=>p.setCountry(e.target.value)}><option>US</option><option>GB</option><option>KY</option><option>DE</option></select></label><label>Currency<select><option>USD</option></select></label></div><button className="primary full" onClick={p.simulate}><Send size={17}/> Evaluate transaction</button><div className="sim-note"><LockKeyhole size={15}/> Deterministic engine v1.4 · simulation only</div></section><section className={`card sim-result ${p.result?"has-result":""}`}>{!p.result?<div className="empty"><Shield size={34}/><h2>Awaiting transaction</h2><p>Submit a simulated request to see the policy and risk evaluation.</p></div>:<><span className="kicker">AUTHORIZATION DECISION</span><div className={`decision-hero ${p.result.decision.toLowerCase()}`}>{p.result.decision==="APPROVED"?<CheckCircle2/>:p.result.decision==="DECLINED"?<XCircle/>:<Clock3/>}<div><b>{p.result.decision.replace("_"," ")}</b><span>{p.result.id}</span></div></div><div className="result-amount"><span>{p.result.merchant}</span><b>{money(p.result.amount)}</b></div><p>{p.result.reason}</p><div className="score-row"><div className="score-big">{p.result.risk}<small>/100 risk</small></div><div>{p.result.factors.length?p.result.factors.map((f:string)=><span className="factor" key={f}>{f}</span>):<span className="factor pass">No risk factors</span>}</div></div><button className="secondary full" onClick={()=>p.setSelected(p.result)}>Why this decision?</button></>}</section></div>}

function MandatePage({text,setText,parsed,setParsed,setView}:{text:string;setText:(s:string)=>void;parsed:boolean;setParsed:(b:boolean)=>void;setView:(v:View)=>void}){return <div className="mandate-grid"><section className="card mandate-compose"><div className="step-badge">01</div><span className="kicker">DESCRIBE INTENT</span><h2>Write the spending mandate</h2><p>Use plain language. AI translates your intent into policy; it never authorizes transactions.</p><label>Agent<select><option>Procurement Agent</option></select></label><label>Mandate instructions<textarea value={text} onChange={e=>setText(e.target.value)} rows={10}/></label><div className="prompt-hints"><button onClick={()=>setText("Allow up to $3,000 per month for US travel. Require approval above $300 and for all new airlines or hotels.")}>Travel policy</button><button onClick={()=>setText("Allow software subscriptions up to $250 from US merchants. Block crypto, gambling, and international transactions.")}>Software policy</button></div><button className="primary full" onClick={()=>setParsed(true)}><Sparkles size={17}/> Interpret mandate</button></section><section className={`card policy-preview ${parsed?"ready":""}`}><div className="step-badge">02</div><span className="kicker">STRUCTURED POLICY</span><h2>Review deterministic rules</h2>{!parsed?<div className="empty"><SlidersHorizontal size={32}/><p>Your structured policy will appear here for review.</p></div>:<><div className="llm-boundary"><Sparkles size={17}/><div><b>AI interpretation complete</b><span>Review before activation. The policy engine remains authoritative.</span></div></div><pre>{`{
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
}`}</pre><div className="policy-check"><CheckCircle2 size={17}/><span>Schema valid · 9 enforceable rules</span></div><button className="primary full" onClick={()=>setView("Agents")}><Shield size={17}/> Activate mandate</button></>}</section></div>}

function DecisionDrawer({tx,close}:{tx:Tx;close:()=>void}){const checks=[{name:"Agent is active",pass:true,detail:`${tx.agent} status: active`},{name:"Monthly budget available",pass:tx.amount<1000,detail:`Request ${money(tx.amount)} · budget remaining $789`},{name:"Transaction amount",pass:tx.amount<=250,review:tx.amount>250&&tx.decision!=="DECLINED",detail:`Autonomous limit: $250`},{name:"Merchant category",pass:!["Crypto","Gambling"].includes(tx.category),detail:`${tx.category} ${["Crypto","Gambling"].includes(tx.category)?"is blocked":"is permitted"}`},{name:"Merchant trust",pass:!tx.isNew,review:tx.isNew&&tx.decision!=="DECLINED",detail:tx.isNew?"First transaction with this merchant":"Previously approved merchant"},{name:"Geography",pass:tx.country==="US",detail:`Country: ${tx.country} · allowed: US`}];return <><div className="drawer-backdrop" onClick={close}/><aside className="drawer"><div className="drawer-head"><div><span className="kicker">DECISION EXPLAINER</span><h2>Why was this {tx.decision==="APPROVAL_REQUIRED"?"flagged":tx.decision.toLowerCase()}?</h2></div><button className="icon-button" onClick={close}><X/></button></div><div className={`drawer-decision ${tx.decision.toLowerCase()}`}><div>{tx.decision==="APPROVED"?<CheckCircle2/>:tx.decision==="DECLINED"?<XCircle/>:<Clock3/>}</div><span>{tx.decision.replace("_"," ")}</span><b>{money(tx.amount)}</b><small>{tx.merchant} · {tx.id}</small></div><div className="drawer-section"><h3>Policy evaluation</h3>{checks.map((c:any)=><div className="rule-row" key={c.name}><span className={c.pass?"pass":c.review?"review":"fail"}>{c.pass?<Check/>:c.review?<Clock3/>:<X/>}</span><div><b>{c.name}</b><small>{c.detail}</small></div><em>{c.pass?"PASSED":c.review?"REVIEW":"FAILED"}</em></div>)}</div><div className="drawer-section"><h3>Risk evaluation <span>{tx.risk}/100</span></h3><div className="risk-bar"><i style={{width:`${tx.risk}%`}}/></div><div className="factors">{tx.factors.length?tx.factors.map(f=><span className="factor" key={f}>{f}</span>):<span className="factor pass">No material factors</span>}</div></div><div className="drawer-footer"><Shield size={15}/><span>Evaluated by deterministic policy engine v1.4</span><small>AI was not used to authorize this request.</small></div></aside></>}
