import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const FLOW_STEPS = [
  { n:1, actor:'Court Officer',   icon:'👨‍⚖️', action:'Uploads judgment PDF to CCMS portal', sub:'Existing workflow — zero change for officers', color:'#8b1a1a' },
  { n:2, actor:'CCMS',            icon:'🏛️', action:'Fires webhook → POST /api/ccms/webhook', sub:'Sends case metadata + secure NIC PDF link', color:'#1a2a4a' },
  { n:3, actor:'JAIS AI',         icon:'🧠', action:'Downloads PDF, runs OCR if scanned', sub:'PyMuPDF + Tesseract OCR for scanned docs', color:'#5b21b6' },
  { n:4, actor:'JAIS AI',         icon:'⚡', action:'Extracts directives, generates action plans', sub:'<8 seconds average processing time', color:'#0f766e' },
  { n:5, actor:'Senior Reviewer', icon:'📋', action:'Reviews & approves actions in JAIS', sub:'Human-in-the-loop — no auto-publish', color:'#92400e' },
  { n:6, actor:'Dashboard',       icon:'📊', action:'Approved actions visible to Secretary', sub:'Role-based views · Export CSV · Audit trail', color:'#166534' },
  { n:7, actor:'CCMS Callback',   icon:'🔄', action:'JAIS posts compliance status back to CCMS', sub:'Closes the loop — CCMS stays source of truth', color:'#1a2a4a' },
];

const STATES = [
  { code:'BR', name:'Bihar',       status:'Integrated',  judgments:10, color:'#166534' },
  { code:'UP', name:'Uttar Pradesh', status:'Pilot',     judgments:6,  color:'#92400e' },
  { code:'MH', name:'Maharashtra', status:'Planned',     judgments:0,    color:'#6b6b8a' },
  { code:'RJ', name:'Rajasthan',   status:'Planned',     judgments:0,    color:'#6b6b8a' },
  { code:'MP', name:'Madhya Pradesh', status:'Planned',  judgments:0,    color:'#6b6b8a' },
  { code:'GJ', name:'Gujarat',     status:'Planned',     judgments:0,    color:'#6b6b8a' },
];

export default function CCMSPage({ user }) {
  const nav = useNavigate();
  const [testLoading, setTestLoading] = useState(false);
  const [testResult,  setTestResult]  = useState(null);
  const [testError,   setTestError]   = useState('');

  const testWebhook = async () => {
    setTestLoading(true); setTestResult(null); setTestError('');
    try {
      const res = await fetch('http://localhost:8000/api/ccms/webhook', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-ccms-api-key':'demo' },
        body: JSON.stringify({
          case_number: `WP/${Math.floor(Math.random()*9000+1000)}/2025`,
          court_name: 'High Court of Judicature at Patna',
          judgment_date: '2025-01-15',
          state_code: 'BR',
          judge_name: 'Justice Rajendra Prasad',
          petitioner: 'M/s Test Corp Ltd.',
          respondent: 'State of Bihar',
          source_system: 'CCMS',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data);
      } else {
        setTestError(JSON.stringify(data));
      }
    } catch(e) {
      setTestError('Backend not running. Start with: cd backend && python main.py');
    }
    setTestLoading(false);
  };

  const S = {
    page:  { background:'#f4f1eb', minHeight:'100vh' },
    wrap:  { padding:'18px 20px' },
    h2:    { fontFamily:"'Crimson Pro',serif", fontSize:24, color:'#1a1a2e', marginBottom:4 },
    sub:   { fontSize:12, color:'#6b6b8a', fontFamily:"'IBM Plex Mono',monospace", marginBottom:18 },
    card:  { background:'#fffef9', border:'1px solid #c9c0ae', borderRadius:10, overflow:'hidden', marginBottom:16, boxShadow:'0 1px 6px rgba(0,0,0,.06)' },
    head:  { padding:'11px 16px', borderBottom:'1px solid #c9c0ae', display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(to right,rgba(139,26,26,.04),transparent)' },
    htxt:  { fontSize:11, fontWeight:700, color:'#1a2a4a', textTransform:'uppercase', letterSpacing:'.8px', fontFamily:"'IBM Plex Mono',monospace" },
    body:  { padding:18 },
    tag:   (col) => ({ fontSize:10, padding:'2px 8px', borderRadius:4, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace", background:`${col}12`, color:col, border:`1px solid ${col}25` }),
    step:  { display:'flex', gap:14, marginBottom:16, alignItems:'flex-start' },
    num:   (col) => ({ width:32, height:32, borderRadius:'50%', background:col, color:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0, fontFamily:"'IBM Plex Mono',monospace" }),
    arrow: { display:'flex', justifyContent:'center', margin:'-8px 0 8px 23px', color:'#c9c0ae', fontSize:18 },
    codeBox: { background:'#1a2a4a', borderRadius:8, padding:'14px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#a8c4f0', lineHeight:1.8, marginBottom:14, overflowX:'auto' },
    privacy: { padding:'13px 16px', background:'rgba(22,101,52,.06)', border:'1px solid rgba(22,101,52,.2)', borderRadius:8, fontSize:12, color:'#166534', lineHeight:1.7 },
    statePill: (col) => ({ fontSize:10, padding:'2px 8px', borderRadius:4, background:`${col}12`, color:col, border:`1px solid ${col}25`, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace" }),
  };

  return (
    <div style={S.page}>
      <div style={{ height:4, background:'linear-gradient(90deg,#8b1a1a,#b8860b,#1a2a4a,#b8860b,#8b1a1a)' }}/>
      <Navbar user={user}/>
      <div style={S.wrap}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <h2 style={S.h2}>🏛️ CCMS Integration Hub</h2>
            <div style={S.sub}>Webhook · Auto-processing · National Scale · NIC Infrastructure</div>
          </div>
          <button onClick={() => nav('/')} style={{ padding:'6px 14px', background:'#fff', border:'1px solid #c9c0ae', borderRadius:6, cursor:'pointer', fontSize:12, color:'#3d3d5c', fontFamily:"'Nunito Sans',sans-serif" }}>← Back</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          {/* Integration Flow */}
          <div style={S.card}>
            <div style={S.head}>
              <span style={S.htxt}>📡 CCMS → JAIS Integration Flow</span>
              <span style={S.tag('#8b1a1a')}>Live Webhook</span>
            </div>
            <div style={S.body}>
              <div style={{ fontSize:12, color:'#3d3d5c', marginBottom:16, lineHeight:1.7, padding:'10px 14px', background:'rgba(139,26,26,.04)', borderLeft:'3px solid #8b1a1a', borderRadius:'0 6px 6px 0' }}>
                When a court officer uploads a judgment to <strong>CCMS</strong>, CCMS automatically fires a webhook to JAIS. <strong>Zero extra work</strong> for the officer.
              </div>
              {FLOW_STEPS.map((s,i) => (
                <div key={i}>
                  <div style={S.step}>
                    <div style={S.num(s.color)}>{s.n}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:16 }}>{s.icon}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', fontFamily:"'Crimson Pro',serif" }}>{s.actor}</span>
                        <span style={S.tag(s.color)} >{s.action.split('→')[0]}</span>
                      </div>
                      <div style={{ fontSize:11, color:'#6b6b8a', lineHeight:1.5 }}>{s.sub}</div>
                    </div>
                  </div>
                  {i < FLOW_STEPS.length-1 && <div style={S.arrow}>↓</div>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Live Webhook Test */}
            <div style={S.card}>
              <div style={S.head}>
                <span style={S.htxt}>🧪 Live Webhook Demo</span>
                <span style={S.tag('#0f766e')}>Test Now</span>
              </div>
              <div style={S.body}>
                <div style={{ fontSize:12, color:'#3d3d5c', marginBottom:12, lineHeight:1.6 }}>
                  Fire a real webhook to JAIS — simulates CCMS sending a new judgment automatically.
                </div>
                <div style={S.codeBox}>
                  <span style={{ color:'#f59e0b' }}>POST</span>{' '}
                  <span style={{ color:'#86efac' }}>/api/ccms/webhook</span>{'\n'}
                  <span style={{ color:'#94a3b8' }}>x-ccms-api-key:</span>{' '}
                  <span style={{ color:'#fbbf24' }}>ccms-nic-jais-2024{'\n'}</span>
                  {`{\n  "case_number": "WP/XXXX/2025",\n  "court_name": "High Court Patna",\n  "state_code": "BR",\n  "source_system": "CCMS"\n}`}
                </div>
                <button onClick={testWebhook} disabled={testLoading}
                  style={{ width:'100%', padding:'10px', background:'#1a2a4a', color:'#fff',
                    border:'1px solid #0f1e38', borderRadius:6, cursor:'pointer',
                    fontFamily:"'Nunito Sans',sans-serif", fontSize:13, fontWeight:700, transition:'all .18s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#0f1e38'}
                  onMouseLeave={e => e.currentTarget.style.background='#1a2a4a'}>
                  {testLoading ? '⟳ Firing webhook...' : '▶ Fire Test Webhook to JAIS'}
                </button>
                {testError && (
                  <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(153,27,27,.07)', border:'1px solid rgba(153,27,27,.2)', borderRadius:6, fontSize:11, color:'#991b1b' }}>
                    ⚠️ {testError}
                  </div>
                )}
                {testResult && (
                  <div style={{ marginTop:12, padding:12, background:'rgba(22,101,52,.06)', border:'1px solid rgba(22,101,52,.2)', borderRadius:8 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#166534', marginBottom:8 }}>✓ Webhook Received & Processed!</div>
                    {[
                      ['Case', testResult.judgment_id?.substring(0,16)+'...'],
                      ['Actions Generated', testResult.actions_count],
                      ['Processing Time', `${testResult.processing_time_ms}ms`],
                    ].map(([l,v]) => (
                      <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'4px 0', borderBottom:'1px solid rgba(22,101,52,.1)' }}>
                        <span style={{ color:'#3d3d5c' }}>{l}</span>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", color:'#166534', fontWeight:700 }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:8, fontSize:11, color:'#166534' }}>
                      📨 {testResult.message}
                    </div>
                    <button onClick={() => nav(`/analysis/${testResult.judgment_id}`)}
                      style={{ marginTop:10, width:'100%', padding:'7px', background:'#166534', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontFamily:"'Nunito Sans',sans-serif", fontWeight:600 }}>
                      → Open in JAIS Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Data Privacy — Fix 3 */}
            <div style={S.card}>
              <div style={S.head}>
                <span style={S.htxt}>🔒 Data Privacy & Sovereignty</span>
                <span style={S.tag('#166534')}>NIC Certified</span>
              </div>
              <div style={S.body}>
                <div style={S.privacy}>
                  <strong>In production deployment:</strong> The Claude API is replaced by a
                  <strong> self-hosted Llama 3 model on NIC servers</strong>. No court data
                  leaves government infrastructure. All AI inference runs on-premise within
                  NIC's secure data centre.
                </div>
                <div style={{ marginTop:10 }}>
                  {[
                    ['AI Model (Dev)',  'Claude API (Anthropic)', '#92400e'],
                    ['AI Model (Prod)', 'Llama 3 — NIC On-Premise', '#166534'],
                    ['PDF Storage',    'NIC Secure Object Store', '#166534'],
                    ['Database',       'PostgreSQL — NIC DC', '#166534'],
                    ['Auth',           'NIC PKI / SSO', '#166534'],
                    ['Data Residency', '100% within India', '#166534'],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #eee9df', fontSize:12 }}>
                      <span style={{ color:'#3d3d5c' }}>{l}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:c, fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* State Rollout */}
            <div style={S.card}>
              <div style={S.head}>
                <span style={S.htxt}>🌐 National Rollout Plan</span>
              </div>
              <div style={S.body}>
                {STATES.map((st,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #eee9df' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:'#3d3d5c', width:28 }}>{st.code}</span>
                    <span style={{ flex:1, fontSize:13, color:'#1a1a2e', fontFamily:"'Crimson Pro',serif" }}>{st.name}</span>
                    {st.judgments > 0 && <span style={{ fontSize:11, color:'#6b6b8a', fontFamily:"'IBM Plex Mono',monospace" }}>{st.judgments} cases</span>}
                    <span style={S.statePill(st.color)}>{st.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
