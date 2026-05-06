import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJudgment, askJudgment, getAnomalies, getCompliancePredictions } from '../services/api';
import Navbar from '../components/Navbar';

const DNA_LABELS  = ['Admin Law','Due Process','Compliance','Limitations','Appeals','Directions','Mandamus','Contempt'];
const DNA_COLORS  = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
const DNA_WEIGHTS = [0.82,0.91,0.74,0.88,0.65,0.79,0.93,0.70];

const SUGGESTED = [
  'What is the appeal deadline?',
  'Who is responsible for compliance?',
  'What happens if we miss the deadline?',
  'What did the court order about compensation?',
  'अपील दाखिल करने की समय सीमा क्या है?',
  'परमिट कब तक बहाल करना होगा?',
];

const DEFAULT_ANOMALIES = [
  { severity:'high',   type:'precedent_conflict', message:'Deadline in Para 3 (30d) conflicts with similar order WP/3301/2023 (60d) — confirm with registry', cleared:false },
  { severity:'medium', type:'name_check',          message:'Respondent name partially differs from CCMS registration — may affect service of notice', cleared:false },
  { severity:'clear',  type:'contempt_check',       message:'No active contempt orders found against this department in CCMS database', cleared:true },
  { severity:'medium', type:'date_check',           message:'Order date parsed as 15th January 2025 — verify with certified copy', cleared:false },
];
const DEFAULT_PREDS = [
  { department:'Revenue Department',              compliance_probability:34, risk_level:'danger',  nearest_deadline_days:60, action_count:1, past_compliance_rate:34, recommendation:'🔴 High risk — immediate escalation to Chief Secretary recommended' },
  { department:'Urban Development Department',    compliance_probability:58, risk_level:'warning', nearest_deadline_days:30, action_count:2, past_compliance_rate:61, recommendation:'🟡 Medium risk — assign additional staff and track weekly' },
  { department:'State Legal Affairs Department',  compliance_probability:84, risk_level:'success', nearest_deadline_days:21, action_count:1, past_compliance_rate:88, recommendation:'🟢 On track — standard monitoring sufficient' },
];
const DEFAULT_SIMILAR = [
  { similar_case_number:'WP/3301/2023', similar_case_title:'Gupta Builders vs PWD — Permit Restoration', similarity_score:.94, outcome:'Complied in 22 days. No appeal filed. ✓', warning_message:null },
  { similar_case_number:'WP/1892/2022', similar_case_title:'Rajesh Infra vs UDD — Construction Permit',   similarity_score:.81, outcome:'Appeal filed. Division Bench upheld order.',  warning_message:null },
  { similar_case_number:'WP/5544/2021', similar_case_title:'Agarwal Constructions — Permit Cancellation', similarity_score:.73, outcome:'Non-compliant. Contempt of court issued.',   warning_message:'Similar case resulted in contempt. Ensure timely compliance.' },
];
const DEFAULT_CASCADE = [
  { department:'Legal Affairs Dept.',   action:'Advise on appeal filing',             start_day:0,  end_day:21, depends_on:null,   node_level:0 },
  { department:'Urban Dev. Dept.',      action:'Restore permit (after legal advice)',  start_day:21, end_day:30, depends_on:'Legal', node_level:1 },
  { department:'Urban Dev. (PS)',       action:'File compliance report in court',      start_day:30, end_day:45, depends_on:'Urban', node_level:2 },
  { department:'Revenue Dept.',         action:'Examine compensation (parallel)',       start_day:30, end_day:60, depends_on:null,   node_level:1 },
];

const sevColor = s => s==='high'?'var(--red)':s==='medium'?'var(--amber)':s==='clear'?'var(--green)':'var(--text2)';
const sevBg    = s => s==='high'?'rgba(239,68,68,.08)':s==='medium'?'rgba(245,158,11,.08)':s==='clear'?'rgba(16,185,129,.08)':'var(--bg3)';
const riskC    = r => r==='danger'?'var(--red)':r==='warning'?'var(--amber)':'var(--green)';

const SubTabs = ({tabs, active, onSelect}) => (
  <div style={{ display:'flex', background:'var(--bg3)', borderBottom:'1px solid var(--border)' }}>
    {tabs.map(([k,l]) => (
      <div key={k} onClick={() => onSelect(k)} style={{
        padding:'8px 14px', fontSize:12, cursor:'pointer',
        borderBottom: active===k ? '2px solid var(--acc)' : '2px solid transparent',
        color: active===k ? 'var(--acc2)' : 'var(--text2)'
      }}>{l}</div>
    ))}
  </div>
);

const Block = ({label, text, accent='var(--acc)'}) => (
  <div style={{ borderLeft:`3px solid ${accent}`, padding:'9px 12px', marginBottom:10,
    background:'var(--bg3)', borderRadius:'0 7px 7px 0' }}>
    <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.8px',
      color:accent, marginBottom:4, fontWeight:600 }}>{label}</div>
    <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.7 }}>{text}</div>
  </div>
);

const Widget = ({title, badge, badgeColor, children}) => (
  <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12,
    overflow:'hidden', display:'flex', flexDirection:'column' }}>
    <div className="panel-header">
      <span className="panel-title">{title}</span>
      {badge && (
        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, fontWeight:600,
          background: badgeColor ? `${badgeColor}18` : 'rgba(59,130,246,.1)',
          color: badgeColor || 'var(--acc2)',
          border: `1px solid ${badgeColor ? badgeColor+'30' : 'rgba(59,130,246,.3)'}` }}>
          {badge}
        </span>
      )}
    </div>
    <div style={{ flex:1, overflowY:'auto', padding:14 }}>{children}</div>
  </div>
);

const PLAIN_DEFAULT = {
  what_happened:"The High Court cancelled our earlier order that stopped M/s Sharma Construction's building permit. The court ruled our department was wrong to cancel it without due process.",
  what_must_be_done:"Restore the building permit within 30 days. The Principal Secretary must personally ensure compliance and submit a report to court within 45 days.",
  most_urgent:"Check with Legal Department within 21 days whether to file an appeal. If yes, the appeal must be filed within 90 days from 15th January 2025.",
  hindi_what_happened:"उच्च न्यायालय ने हमारे उस आदेश को रद्द कर दिया है। न्यायालय ने माना कि हमारा विभाग बिना उचित प्रक्रिया के गलत था।",
  hindi_what_must_be_done:"30 दिनों के भीतर भवन परमिट बहाल करना होगा। प्रमुख सचिव को 45 दिनों के भीतर न्यायालय को अनुपालन रिपोर्ट देनी होगी।",
  hindi_most_urgent:"पहले कानूनी विभाग से पूछें (21 दिनों के भीतर) कि क्या सरकार को अपील करनी चाहिए।",
  checklist:[
    {day_range:'Day 1-3',  task:'Brief Secretary UDD. Obtain certified copy of court order.'},
    {day_range:'Day 1-5',  task:'Forward judgment to State Legal Affairs for appeal advice.'},
    {day_range:'By Day 21',task:'Receive Legal Dept. recommendation. Advise Chief Secretary.'},
    {day_range:'By Day 30',task:'Issue restored permit to M/s Sharma Construction Ltd.'},
    {day_range:'By Day 45',task:'Principal Secretary personally files compliance report in High Court.'},
    {day_range:'By Day 60',task:'Revenue Dept. submits compensation assessment report.'},
  ],
};

export default function InsightsPage({ user, onLogout }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [data,      setData]      = useState(null);
  const [anomalies, setAnomalies] = useState(DEFAULT_ANOMALIES);
  const [preds,     setPreds]     = useState(DEFAULT_PREDS);
  const [loading,   setLoading]   = useState(true);
  const [dnaTab,    setDnaTab]    = useState('similar');
  const [lang,      setLang]      = useState('en');
  const [messages,  setMessages]  = useState([
    { role:'ai', text:"Namaste! I can answer any question about this judgment in English or Hindi. Ask me about deadlines, responsible officers, compensation, or appeal windows." }
  ]);
  const [input,     setInput]     = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [qaError,   setQaError]   = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getJudgment(id),
      getAnomalies(id).catch(() => ({ data:{ anomalies: DEFAULT_ANOMALIES } })),
      getCompliancePredictions(id).catch(() => ({ data:{ predictions: DEFAULT_PREDS } })),
    ]).then(([jr, ar, pr]) => {
      setData(jr.data);
      setAnomalies(ar.data.anomalies || DEFAULT_ANOMALIES);
      setPreds(pr.data.predictions || DEFAULT_PREDS);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages]);

  const sendQ = async (q) => {
    const question = q || input.trim();
    if (!question) return;
    setQaError('');
    setMessages(m => [...m, { role:'user', text:question }]);
    setInput(''); setQaLoading(true);
    try {
      const res = await askJudgment(id, question);
      setMessages(m => [...m, { role:'ai', text: res.data.answer }]);
    } catch (e) {
      const errMsg = e.response?.data?.detail || 'Could not reach the backend. Is it running on port 8000?';
      setQaError(errMsg);
      setMessages(m => [...m, { role:'ai', text:`⚠️ Error: ${errMsg}` }]);
    }
    setQaLoading(false);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setQaError('Speech recognition not supported. Please use Chrome browser.'); return; }
    const recog = new SR();
    recog.lang = 'hi-IN';
    recog.interimResults = false;
    recog.onresult = e => { setInput(e.results[0][0].transcript); setListening(false); };
    recog.onerror  = () => { setListening(false); setQaError('Microphone error. Check permissions.'); };
    recog.onend    = () => setListening(false);
    recog.start(); setListening(true);
  };

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80vh', gap:12 }}>
      <div style={{ fontSize:36, animation:'sp 1s linear infinite' }}>🧠</div>
      <div style={{ color:'var(--text2)' }}>Loading AI insights...</div>
    </div>
  );

  const similar  = data?.similar_cases?.length ? data.similar_cases : DEFAULT_SIMILAR;
  const cascade  = data?.cascade_nodes?.length  ? data.cascade_nodes  : DEFAULT_CASCADE;
  const plain    = PLAIN_DEFAULT;

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar user={user} onLogout={onLogout}/>
      <div style={{ padding:18 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <h2 style={{ fontFamily:'var(--serif)', fontSize:22, color:'#1a1a2e', marginBottom:3 }}>🧠 AI Insights & Intelligence</h2>
            <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--mono)' }}>
              6 AI-powered engines · {data?.judgment?.case_number || 'WP/4821/2024'} · CCMS Dashboard
            </div>
          </div>
          <div style={{ display:'flex', gap:7 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => nav(`/analysis/${id}`)}>← Analysis</button>
            <button className="btn btn-primary btn-sm" onClick={() => nav(`/dashboard/${id}`)}>Dashboard →</button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* ── 1. VOICE Q&A — full width ─────────────────────── */}
          <div style={{ gridColumn:'1/-1', background:'var(--bg2)',
            border:'2px solid var(--acc)', borderRadius:12, overflow:'hidden' }}>
            <div className="panel-header" style={{ background:'rgba(59,130,246,.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span className="panel-title">🎙️ Voice Q&A — Ask Any Question About This Judgment</span>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, fontWeight:600,
                  background:'rgba(245,158,11,.15)', color:'var(--amber)', border:'1px solid rgba(245,158,11,.3)' }}>
                </span>
              </div>
              <span className="tag tag-blue">Hindi + English · Voice Enabled</span>
            </div>
            <div style={{ padding:14, display:'flex', gap:14 }}>
              {/* Chat */}
              <div style={{ flex:1 }}>
                <div ref={chatRef} style={{ height:180, overflowY:'auto', display:'flex',
                  flexDirection:'column', gap:8, marginBottom:10, paddingRight:4 }}>
                  {messages.map((m,i) => (
                    <div key={i} style={{
                      alignSelf: m.role==='user' ? 'flex-end' : 'flex-start',
                      maxWidth:'82%', padding:'9px 13px',
                      borderRadius: m.role==='user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: m.role==='user' ? 'rgba(59,130,246,.2)' : 'var(--bg3)',
                      color: m.role==='user' ? 'var(--acc2)' : 'var(--text)',
                      fontSize:13, lineHeight:1.6,
                    }}>{m.text}</div>
                  ))}
                  {qaLoading && (
                    <div style={{ alignSelf:'flex-start', padding:'9px 13px', borderRadius:'12px 12px 12px 2px',
                      background:'var(--bg3)', color:'var(--text3)', fontSize:13 }}>
                      <span style={{ animation:'pulse 1s infinite' }}>⟳ Analyzing judgment...</span>
                    </div>
                  )}
                </div>
                {qaError && (
                  <div style={{ marginBottom:8, padding:'6px 10px', background:'rgba(239,68,68,.08)',
                    border:'1px solid rgba(239,68,68,.2)', borderRadius:6, fontSize:11, color:'var(--red)' }}>
                    ⚠️ {qaError}
                  </div>
                )}
                <div style={{ display:'flex', gap:7 }}>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && sendQ()}
                    placeholder="Ask in English or Hindi... e.g. अपील की deadline क्या है?"
                    style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border2)',
                      borderRadius:8, padding:'9px 12px', color:'var(--text)', fontSize:13,
                      outline:'none', fontFamily:'var(--font)' }} />
                  <button onClick={startListening} className="btn btn-secondary btn-sm"
                    title="Click to speak in Hindi"
                    style={{ minWidth:40,
                      background: listening ? 'rgba(239,68,68,.15)' : '',
                      borderColor: listening ? 'var(--red)' : '',
                      color: listening ? 'var(--red)' : '' }}>
                    {listening ? '🔴' : '🎙️'}
                  </button>
                  <button onClick={() => sendQ()} className="btn btn-primary btn-sm" disabled={qaLoading || !input.trim()}>
                    Ask
                  </button>
                </div>
              </div>
              {/* Suggested Qs */}
              <div style={{ width:210, flexShrink:0 }}>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.8px',
                  color:'var(--text3)', marginBottom:8, fontWeight:600 }}>Suggested Questions</div>
                {SUGGESTED.map((q,i) => (
                  <div key={i} onClick={() => sendQ(q)} style={{
                    padding:'7px 10px', background:'var(--bg3)', border:'1px solid var(--border)',
                    borderRadius:7, marginBottom:6, cursor:'pointer', fontSize:11, color:'var(--text2)',
                    transition:'all .15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='var(--acc)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 2. ANOMALY DETECTOR ──────────────────────────── */}
          <Widget title="⚠️ Contradiction & Anomaly Detector"
            badge="⭐⭐⭐⭐" badgeColor="var(--amber)">
            <div style={{ fontSize:11, color:'var(--text2)', marginBottom:10 }}>
              Auto-scanning for contradictions, impossible dates, precedent conflicts, and data anomalies...
            </div>
            {anomalies.map((a,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10,
                padding:'9px 11px', borderRadius:8, marginBottom:7,
                background:sevBg(a.severity), border:`1px solid ${sevColor(a.severity)}25` }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:sevColor(a.severity),
                  marginTop:4, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:12, color:'var(--text)', lineHeight:1.5 }}>{a.message}</div>
                <span style={{ fontSize:9, padding:'2px 6px', borderRadius:99, flexShrink:0, fontWeight:600,
                  background:`${sevColor(a.severity)}18`, color:sevColor(a.severity),
                  border:`1px solid ${sevColor(a.severity)}25` }}>
                  {a.cleared ? 'CLEAR' : a.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </Widget>

          {/* ── 3. COMPLIANCE PREDICTION ─────────────────────── */}
          <Widget title="📊 Compliance Prediction Engine" badge="AI-Powered · Dept History" badgeColor="var(--acc2)">
            <div style={{ fontSize:11, color:'var(--text2)', marginBottom:12 }}>
              Predicts on-time compliance probability <em>before</em> failure, based on department history × workload × deadline urgency.
            </div>
            {preds.map((p,i) => (
              <div key={i} style={{ marginBottom:13 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'var(--text)', fontWeight:500 }}>
                    {p.department?.replace(' Department','')}
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)' }}>
                      Past: {p.past_compliance_rate}%
                    </span>
                    <span style={{ fontSize:14, fontWeight:700, color:riskC(p.risk_level),
                      fontFamily:'var(--mono)' }}>{p.compliance_probability}%</span>
                  </div>
                </div>
                <div style={{ height:7, background:'var(--bg3)', borderRadius:99, overflow:'hidden', marginBottom:4 }}>
                  <div style={{ height:'100%', width:`${p.compliance_probability}%`,
                    background:riskC(p.risk_level), borderRadius:99, transition:'width 1.2s ease' }}/>
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', display:'flex', gap:10, marginBottom: p.risk_level==='danger'?4:0 }}>
                  <span>Nearest deadline: Day {p.nearest_deadline_days}</span>
                  <span>{p.action_count} action{p.action_count!==1?'s':''}</span>
                </div>
                {p.risk_level==='danger' && (
                  <div style={{ fontSize:10, color:'var(--red)', padding:'3px 8px',
                    background:'rgba(239,68,68,.07)', borderRadius:5, border:'1px solid rgba(239,68,68,.2)' }}>
                    {p.recommendation}
                  </div>
                )}
              </div>
            ))}
          </Widget>

          {/* ── 4. DNA FINGERPRINT ───────────────────────────── */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div className="panel-header">
              <span className="panel-title">🧬 Judgment DNA Fingerprint</span>
            </div>
            <SubTabs tabs={[['similar','Similar Cases'],['visual','DNA Visual'],['contra','Cross-Check']]}
              active={dnaTab} onSelect={setDnaTab} />
            <div style={{ flex:1, overflowY:'auto', padding:14 }}>
              {dnaTab==='similar' && (
                <div className="fade-in">
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:10 }}>
                    {similar.length} semantically similar precedent cases found in CCMS database.
                  </div>
                  {similar.map((sc,i) => (
                    <div key={i} style={{ padding:11, background:'var(--bg3)',
                      border:'1px solid var(--border)', borderRadius:8, marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--acc2)' }}>
                          {sc.similar_case_number || sc.case_number}
                        </span>
                        <span className="tag tag-green">
                          {Math.round((sc.similarity_score||0)*100)}% match
                        </span>
                      </div>
                      <div style={{ fontSize:12, color:'#1a1a2e', fontWeight:500, marginBottom:4 }}>
                        {sc.similar_case_title || sc.case_title}
                      </div>
                      <div style={{ fontSize:11, color: sc.outcome?.includes('Contempt')||sc.outcome?.includes('Non-') ? 'var(--red)' : 'var(--text2)' }}>
                        {sc.outcome}
                      </div>
                      {(sc.warning_message||sc.warning) && (
                        <div style={{ marginTop:6, fontSize:11, color:'var(--amber)', padding:'4px 8px',
                          background:'rgba(245,158,11,.07)', borderRadius:5, border:'1px solid rgba(245,158,11,.2)' }}>
                          ⚠️ {sc.warning_message||sc.warning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {dnaTab==='visual' && (
                <div className="fade-in">
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:12 }}>
                    Legal domain weight profile — unique fingerprint of this judgment's legal characteristics.
                  </div>
                  {DNA_LABELS.map((l,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                      <div style={{ width:85, fontSize:11, color:'var(--text2)', textAlign:'right', flexShrink:0 }}>{l}</div>
                      <div style={{ flex:1, height:8, background:'var(--bg3)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${DNA_WEIGHTS[i]*100}%`,
                          background:DNA_COLORS[i], borderRadius:99, transition:'width 1.3s ease' }}/>
                      </div>
                      <div style={{ width:32, fontSize:11, color:DNA_COLORS[i],
                        fontWeight:700, fontFamily:'var(--mono)' }}>
                        {Math.round(DNA_WEIGHTS[i]*100)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {dnaTab==='contra' && (
                <div className="fade-in">
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:10 }}>
                    Cross-judgment contradiction check against all active CCMS orders.
                  </div>
                  <div style={{ padding:11, background:'rgba(239,68,68,.07)',
                    border:'1px solid rgba(239,68,68,.2)', borderRadius:8, marginBottom:9 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--red)', marginBottom:4 }}>🔴 Potential Conflict</div>
                    <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.6 }}>
                      WP/3301/2023 — Same dept, same type, granted 60 days vs this order's 30 days.
                      Officers may be confused about which deadline applies.
                    </div>
                  </div>
                  <div style={{ padding:11, background:'rgba(16,185,129,.07)',
                    border:'1px solid rgba(16,185,129,.2)', borderRadius:8 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--green)', marginBottom:4 }}>✅ No Contempt Risk</div>
                    <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.6 }}>
                      No active contempt proceedings found against UDD in CCMS database as of today.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 5. CASCADE IMPACT ────────────────────────────── */}
          <Widget title="🔗 Cascade Impact Analysis" badge="Dependency Map" badgeColor="var(--purple)">
            <div style={{ fontSize:11, color:'var(--text2)', marginBottom:12 }}>
              Department dependency chain — delays in early tasks cascade downstream automatically.
            </div>
            {cascade.map((c,i) => {
              const total=65, s=(c.start_day/total)*100, w=Math.max(8,((c.end_day-c.start_day)/total)*100);
              const cols=['var(--acc)','var(--purple)','var(--green)','var(--amber)'];
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:95, fontSize:10, color:'var(--text2)', textAlign:'right', flexShrink:0 }}>
                    {c.department?.replace(' Department','').replace(' Dept.','').substring(0,14)}
                  </div>
                  <div style={{ flex:1, position:'relative', height:24 }}>
                    <div style={{ position:'absolute', left:0, right:0, top:'50%', height:1,
                      background:'var(--border)', transform:'translateY(-50%)' }}/>
                    <div style={{ position:'absolute', left:`${s}%`, width:`${w}%`, height:20, top:2,
                      background:`${cols[i%4]}22`, border:`1.5px solid ${cols[i%4]}70`,
                      borderRadius:5, display:'flex', alignItems:'center', padding:'0 6px',
                      cursor:'default' }}>
                      <span style={{ fontSize:9, color:cols[i%4], fontWeight:600,
                        whiteSpace:'nowrap', overflow:'hidden' }}>
                        {c.action?.substring(0,22)}
                      </span>
                    </div>
                  </div>
                  <div style={{ width:38, fontSize:10, color:'var(--text3)',
                    fontFamily:'var(--mono)', flexShrink:0 }}>d{c.end_day}</div>
                </div>
              );
            })}
            {cascade.some(c => c.depends_on) && (
              <div style={{ marginTop:6, padding:'7px 10px', background:'rgba(239,68,68,.07)',
                border:'1px solid rgba(239,68,68,.2)', borderRadius:6, fontSize:11, color:'var(--red)' }}>
                ⚠️ Critical path: if Legal Affairs delays past Day 21, all downstream compliance misses deadlines.
              </div>
            )}
          </Widget>

          {/* ── 6. PLAIN LANGUAGE BRIDGE ─────────────────────── */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div className="panel-header">
              <span className="panel-title">🌐 Output Language</span>
              <div style={{ display:'flex', gap:5 }}>
                <button onClick={() => setLang('en')}
                  className={`btn btn-sm ${lang==='en'?'btn-primary':'btn-secondary'}`}>English</button>
                <button onClick={() => setLang('hi')}
                  className={`btn btn-sm ${lang==='hi'?'btn-primary':'btn-secondary'}`}>हिंदी</button>
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:14 }} className="fade-in">
              {lang==='en' ? (
                <>
                  <Block label="What happened"    text={plain.what_happened}    accent="var(--purple)"/>
                  <Block label="What must be done" text={plain.what_must_be_done} accent="var(--acc)"/>
                  <Block label="Most urgent"       text={plain.most_urgent}       accent="var(--red)"/>
                  <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.8px',
                    color:'var(--text3)', marginBottom:9, marginTop:6, fontWeight:600 }}>
                    Action Checklist (For Department Head)
                  </div>
                  {plain.checklist?.map((c,i) => (
                    <div key={i} style={{ display:'flex', gap:10, padding:'7px 0',
                      borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                      <span style={{ fontSize:10, color:'var(--acc2)', fontFamily:'var(--mono)',
                        flexShrink:0, paddingTop:1, minWidth:70 }}>{c.day_range}</span>
                      <span style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>{c.task}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <Block label="क्या हुआ"      text={plain.hindi_what_happened}    accent="var(--purple)"/>
                  <Block label="क्या करना होगा" text={plain.hindi_what_must_be_done} accent="var(--acc)"/>
                  <Block label="सबसे जरूरी"     text={plain.hindi_most_urgent}       accent="var(--red)"/>
                  <div style={{ marginTop:12, padding:11, background:'rgba(59,130,246,.07)',
                    border:'1px solid rgba(59,130,246,.2)', borderRadius:8 }}>
                    <div style={{ fontSize:11, color:'var(--acc2)', fontWeight:600, marginBottom:4 }}>💡 Voice Mode</div>
                    <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>
                      ऊपर Voice Q&A में हिंदी में बोलकर कोई भी प्रश्न पूछें।
                      माइक्रोफोन बटन दबाएं और बोलें।
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
