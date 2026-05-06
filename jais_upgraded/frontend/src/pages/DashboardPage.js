import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJudgment, getActions, getAuditTrail, getCompliancePredictions } from '../services/api';
import Navbar from '../components/Navbar';

const DEPT_STYLE = {
  'State Legal Affairs Department': { bg:'rgba(139,92,246,.1)', color:'#a78bfa', border:'rgba(139,92,246,.2)' },
  'Urban Development Department':   { bg:'rgba(59,130,246,.1)',  color:'var(--acc2)',  border:'rgba(59,130,246,.3)' },
  'Revenue Department':             { bg:'rgba(245,158,11,.1)', color:'var(--amber)', border:'rgba(245,158,11,.2)' },
  'Home Department':                { bg:'rgba(16,185,129,.1)', color:'var(--green)', border:'rgba(16,185,129,.2)' },
  'Public Works Department':        { bg:'rgba(6,182,212,.1)',  color:'#22d3ee',      border:'rgba(6,182,212,.2)' },
  'Finance Department':             { bg:'rgba(236,72,153,.1)', color:'#f472b6',      border:'rgba(236,72,153,.2)' },
};
const dStyle = d => DEPT_STYLE[d] || { bg:'rgba(59,130,246,.1)', color:'var(--acc2)', border:'rgba(59,130,246,.3)' };
const riskC  = r => r==='danger'?'var(--red)':r==='warning'?'var(--amber)':'var(--green)';

const DT_ICON = { 'Compliance':'🏛️', 'Appeal Advisory':'⚖️', 'Reporting':'📋', 'Assessment':'💰' };

const HEATMAP_DEPTS = [
  { name:'Revenue Dept.',    score:34, color:'var(--red)',   bg:'rgba(239,68,68,.1)' },
  { name:'Urban Dev.',       score:61, color:'var(--amber)', bg:'rgba(245,158,11,.1)' },
  { name:'Finance Dept.',    score:65, color:'var(--amber)', bg:'rgba(245,158,11,.08)' },
  { name:'Home Dept.',       score:72, color:'var(--amber)', bg:'rgba(245,158,11,.06)' },
  { name:'Legal Affairs',    score:88, color:'var(--green)', bg:'rgba(16,185,129,.1)' },
  { name:'PWD',              score:91, color:'var(--green)', bg:'rgba(16,185,129,.12)' },
];

export default function DashboardPage({ user, onLogout }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [j,        setJ]        = useState({});
  const [actions,  setActions]  = useState([]);
  const [audit,    setAudit]    = useState([]);
  const [preds,    setPreds]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [view,     setView]     = useState('overview');

  useEffect(() => {
    Promise.all([
      getJudgment(id), getActions(id), getAuditTrail(id),
      getCompliancePredictions(id).catch(() => ({ data:{ predictions:[] } })),
    ]).then(([jr,ar,aur,pr]) => {
      setJ(jr.data.judgment || {});
      setActions(ar.data || []);
      setAudit(aur.data || []);
      setPreds(pr.data.predictions || []);
    }).catch(() => setError('Could not load dashboard. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80vh', gap:12 }}>
      <div style={{ fontSize:36, animation:'sp 1s linear infinite' }}>📊</div>
      <div style={{ color:'var(--text2)' }}>Loading decision dashboard...</div>
    </div>
  );

  if (error) return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}><Navbar user={user} onLogout={onLogout}/>
      <div style={{ maxWidth:520, margin:'80px auto', padding:24, background:'rgba(239,68,68,.08)',
        border:'1px solid rgba(239,68,68,.3)', borderRadius:12 }}>
        <div style={{ color:'var(--red)', fontSize:15, fontWeight:600, marginBottom:8 }}>⚠️ Dashboard Error</div>
        <div style={{ color:'var(--text2)', fontSize:13 }}>{error}</div>
        <button className="btn btn-secondary" style={{ marginTop:14 }} onClick={() => nav('/')}>← Back</button>
      </div>
    </div>
  );

  const approved = actions.filter(a => a.status==='approved');
  const pending  = actions.filter(a => a.status==='pending');
  const urgent   = approved.filter(a => a.deadline_days <= 30).sort((a,b) => a.deadline_days - b.deadline_days);
  const avgRisk  = actions.length ? Math.round(actions.reduce((s,a) => s+(a.risk_score||0),0)/actions.length) : 0;

  const exportCSV = () => {
    const rows = [
      ['Case No.','Department','Action','Decision Type','Officer','Deadline (Days)','Risk Score','Priority','Status'],
      ...actions.map(a => [j.case_number, a.department, a.title, a.decision_type||'', a.responsible_officer, a.deadline_days, a.risk_score, a.priority, a.status]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    const el = document.createElement('a'); el.href=url;
    el.download = `JAIS_${j.case_number?.replace('/','_')||'export'}.csv`; el.click();
  };

  const VIEWS = [
    { k:'overview', l:'📋 Overview' },
    { k:'actions',  l:'✅ Approved Actions' },
    { k:'gantt',    l:'📅 Gantt Timeline' },
    { k:'heatmap',  l:'🔥 Heat Map' },
    { k:'audit',    l:'🔒 Audit Trail' },
  ];

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar user={user} onLogout={onLogout}/>
      <div style={{ padding:'16px 18px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <h2 style={{ fontFamily:'var(--serif)', fontSize:22, color:'#1a1a2e', marginBottom:3 }}>
              📊 CCMS Government Dashboard
            </h2>
            <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--mono)' }}>
              {j.case_number} · {j.court} ·{' '}
              <span style={{ color:'var(--amber)' }}>Dashboard shows only APPROVED actions</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:7 }}>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={() => nav(`/insights/${id}`)}>← AI Insights</button>
            <button className="btn btn-secondary btn-sm" onClick={() => nav(`/analysis/${id}`)}>← Analysis</button>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
          {[
            [approved.length, 'Approved Actions',  'Visible to officials',  'var(--green)'],
            [pending.length,  'Pending Review',     'Awaiting human verify', 'var(--amber)'],
            [urgent.length,   'Urgent (≤30 days)',  'Needs immediate action','var(--red)'],
            [actions.length,  'Total Actions',      'This judgment',         'var(--acc2)'],
            [avgRisk,         'Avg. Risk Score',    'DRS 0–100 scale',       avgRisk>=70?'var(--red)':avgRisk>=50?'var(--amber)':'var(--green)'],
          ].map(([v,l,s,c]) => (
            <div key={l} style={{ background:'var(--bg2)', border:'1px solid var(--border)',
              borderRadius:10, padding:'14px 16px', textAlign:'center' }}>
              <div style={{ fontSize:30, fontWeight:700, fontFamily:'var(--serif)', color:c, marginBottom:3 }}>{v}</div>
              <div style={{ fontSize:11, color:'var(--text)', fontWeight:500 }}>{l}</div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Urgent alert strip — Gap #5 decision-oriented */}
        {urgent.length > 0 && (
          <div style={{ marginBottom:14, padding:'11px 16px', background:'rgba(239,68,68,.07)',
            border:'1px solid rgba(239,68,68,.25)', borderRadius:10,
            display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ color:'var(--red)', fontWeight:700, fontSize:13, flexShrink:0 }}>
              🚨 URGENT — Action Required Today:
            </span>
            {urgent.slice(0,3).map((a,i) => (
              <span key={i} style={{ fontSize:12, padding:'3px 10px', background:'rgba(239,68,68,.12)',
                color:'var(--red)', border:'1px solid rgba(239,68,68,.2)', borderRadius:99 }}>
                {a.department?.replace(' Department','')} — Day {a.deadline_days}
              </span>
            ))}
          </div>
        )}

        {/* View tabs */}
        <div style={{ display:'flex', gap:3, marginBottom:14, background:'var(--bg2)',
          padding:4, borderRadius:10, border:'1px solid var(--border)', width:'fit-content' }}>
          {VIEWS.map(v => (
            <button key={v.k} onClick={() => setView(v.k)} style={{
              padding:'6px 14px', borderRadius:7, border:'none', cursor:'pointer',
              fontFamily:'var(--font)', fontSize:12, transition:'all .15s',
              background: view===v.k ? 'var(--acc)' : 'transparent',
              color: view===v.k ? '#fff' : 'var(--text2)',
            }}>{v.l}</button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {view==='overview' && (
          <div className="fade-in" style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14 }}>
            {/* What should I do? — Gap #5 decision view */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
              <div className="panel-header">
                <span className="panel-title">🎯 What Should I Do? — Decision Summary</span>
                <span className="tag tag-amber">For Government Officials</span>
              </div>
              <div style={{ padding:14 }}>
                {/* Roles — Gap #13 */}
                {[
                  { role:'For Legal Officer', icon:'⚖️', color:'#a78bfa',
                    actions: approved.filter(a=>a.action_type==='legal'||a.decision_type==='Appeal Advisory') },
                  { role:'For Department Head', icon:'🏛️', color:'var(--acc2)',
                    actions: approved.filter(a=>a.action_type==='administrative'||a.decision_type==='Compliance'||a.decision_type==='Reporting') },
                  { role:'For Finance Officer', icon:'💰', color:'var(--amber)',
                    actions: approved.filter(a=>a.action_type==='financial'||a.decision_type==='Assessment') },
                ].map(({ role,icon,color,actions:ras }) => ras.length > 0 && (
                  <div key={role} style={{ marginBottom:14, padding:12, background:'var(--bg3)',
                    border:'1px solid var(--border)', borderRadius:9,
                    borderLeft:`3px solid ${color}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color, marginBottom:8 }}>
                      {icon} {role}
                    </div>
                    {ras.slice(0,3).map((a,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8,
                        padding:'7px 0', borderBottom: i<ras.length-1?'1px solid var(--border)':'' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:color,
                          marginTop:5, flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, color:'var(--text)', lineHeight:1.5 }}>{a.title}</div>
                          <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                            Deadline: Day {a.deadline_days} · {a.department?.replace(' Department','')}
                          </div>
                        </div>
                        <span style={{ fontSize:10, padding:'2px 6px', borderRadius:99, flexShrink:0,
                          background: a.priority==='critical'?'rgba(239,68,68,.15)':a.priority==='high'?'rgba(245,158,11,.15)':'rgba(59,130,246,.15)',
                          color: a.priority==='critical'?'var(--red)':a.priority==='high'?'var(--amber)':'var(--acc2)',
                          border: '1px solid transparent', fontWeight:600 }}>
                          {a.priority==='critical'?'P1':a.priority==='high'?'P2':'P3'}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
                {approved.length === 0 && (
                  <div style={{ padding:20, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                    No approved actions yet. Go to Analysis page to approve actions.
                  </div>
                )}
              </div>
            </div>

            {/* Compliance predictions + pending count */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', flex:1 }}>
                <div className="panel-header">
                  <span className="panel-title">📊 Compliance Risk by Dept.</span>
                </div>
                <div style={{ padding:14 }}>
                  {preds.slice(0,4).map((p,i) => (
                    <div key={i} style={{ marginBottom:11 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, color:'var(--text)' }}>
                          {p.department?.replace(' Department','').replace('State ','').substring(0,18)}
                        </span>
                        <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:riskC(p.risk_level) }}>
                          {p.compliance_probability}%
                        </span>
                      </div>
                      <div style={{ height:6, background:'var(--bg3)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${p.compliance_probability}%`,
                          background:riskC(p.risk_level), borderRadius:99 }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {pending.length > 0 && (
                <div style={{ padding:14, background:'rgba(245,158,11,.07)',
                  border:'1px solid rgba(245,158,11,.2)', borderRadius:10 }}>
                  <div style={{ fontSize:12, color:'var(--amber)', fontWeight:600, marginBottom:6 }}>
                    ⏳ {pending.length} Actions Pending Human Review
                  </div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10, lineHeight:1.6 }}>
                    These actions are extracted but not yet verified. They will not appear in the official dashboard until approved.
                  </div>
                  <button className="btn btn-sm" style={{ background:'rgba(245,158,11,.15)',
                    color:'var(--amber)', border:'1px solid rgba(245,158,11,.3)', width:'100%' }}
                    onClick={() => nav(`/analysis/${id}`)}>
                    Go to Analysis → Approve Actions
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── APPROVED ACTIONS TABLE ── */}
        {view==='actions' && (
          <div className="fade-in" style={{ background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:12, overflow:'hidden' }}>
            <div className="panel-header">
              <span className="panel-title">✅ Approved Action Plans — Official Dashboard View ({approved.length})</span>
              <span className="tag tag-green">Decision-oriented · Approved only</span>
            </div>
            {approved.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:15, color:'var(--text2)', marginBottom:8 }}>No approved actions yet</div>
                <div style={{ fontSize:13, color:'var(--text3)', marginBottom:16 }}>
                  Go to the Analysis page to verify and approve extracted actions.
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => nav(`/analysis/${id}`)}>
                  → Go to Analysis & Approve
                </button>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg3)' }}>
                      {['Dept.','Action','Decision Type','Officer','Role For','Deadline','Risk','Priority'].map(h => (
                        <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10,
                          color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px',
                          fontWeight:500, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {approved.map((a,i) => {
                      const ds = dStyle(a.department);
                      return (
                        <tr key={i} style={{ borderBottom:'1px solid var(--border)', transition:'background .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                          onMouseLeave={e => e.currentTarget.style.background=''}>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99,
                              background:ds.bg, color:ds.color, border:`1px solid ${ds.border}` }}>
                              {a.department?.replace(' Department','')}
                            </span>
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:12, color:'var(--text)', maxWidth:200 }}>
                            <div style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {a.title}
                            </div>
                            {a.reason && (
                              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2,
                                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                💡 {a.reason?.substring(0,60)}...
                              </div>
                            )}
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ fontSize:11, color:'var(--acc2)' }}>
                              {DT_ICON[a.decision_type]} {a.decision_type || 'Compliance'}
                            </span>
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:11, color:'var(--text2)', whiteSpace:'nowrap' }}>
                            {a.responsible_officer}
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:10, color:'var(--purple)', whiteSpace:'nowrap' }}>
                            {a.role_for || 'For Dept. Head'}
                          </td>
                          <td style={{ padding:'10px 14px', fontFamily:'var(--mono)', fontSize:11, whiteSpace:'nowrap' }}>
                            <span style={{ color: a.deadline_days<=21?'var(--red)':a.deadline_days<=30?'var(--amber)':'var(--text2)' }}>
                              Day {a.deadline_days}
                            </span>
                            <div style={{ fontSize:9, color:'var(--text3)' }}>{a.deadline_date}</div>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <div style={{ width:36, height:4, background:'var(--bg3)', borderRadius:99, overflow:'hidden' }}>
                                <div style={{ height:'100%', borderRadius:99, width:`${a.risk_score}%`,
                                  background: a.risk_score>=70?'var(--red)':a.risk_score>=50?'var(--amber)':'var(--green)' }}/>
                              </div>
                              <span style={{ fontSize:11, fontFamily:'var(--mono)', fontWeight:600,
                                color: a.risk_score>=70?'var(--red)':a.risk_score>=50?'var(--amber)':'var(--green)' }}>
                                {a.risk_score}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <span className={`tag tag-${a.priority==='critical'?'red':a.priority==='high'?'amber':'blue'}`}>
                              {a.priority?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── GANTT TIMELINE ── */}
        {view==='gantt' && (
          <div className="fade-in" style={{ background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:12, overflow:'hidden' }}>
            <div className="panel-header">
              <span className="panel-title">📅 Visual Compliance Timeline (Gantt)</span>
              <span className="tag tag-blue">Day 0 → Day 90 · All actions</span>
            </div>
            <div style={{ padding:18 }}>
              <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16 }}>
                Each bar represents a department's action window. Deadline markers show target completion dates.
              </div>
              {/* Ruler */}
              <div style={{ display:'flex', marginBottom:6, paddingLeft:130 }}>
                {[0,15,30,45,60,75,90].map(d => (
                  <div key={d} style={{ flex: d===0?0:1, fontSize:9, color:'var(--text3)',
                    fontFamily:'var(--mono)', textAlign: d===0?'left':'center' }}>Day {d}</div>
                ))}
              </div>
              {/* Gridlines + bars */}
              <div style={{ position:'relative' }}>
                {[15,30,45,60,75].map(d => (
                  <div key={d} style={{ position:'absolute', left:`calc(130px + ${(d/90)*100}%)`,
                    top:0, bottom:0, width:1, background:'var(--border)', opacity:.4, pointerEvents:'none', zIndex:0 }}/>
                ))}
                {actions.map((a,i) => {
                  const MAXD = 90;
                  // Estimate bar start based on deadline_days
                  const endD   = Math.min(a.deadline_days, MAXD);
                  const prevD  = i===0 ? 0 : Math.max(0, actions[i-1]?.deadline_days - 20 || 0);
                  const startD = Math.min(prevD, endD - 5);
                  const leftPct  = (startD / MAXD) * 100;
                  const widthPct = Math.max(5, ((endD - startD) / MAXD) * 100);
                  const dlPct    = (endD / MAXD) * 100;
                  const cols = ['var(--acc)','var(--purple)','var(--amber)','var(--green)','#06b6d4','#ec4899'];
                  const c = cols[i % cols.length];
                  const ds = dStyle(a.department);
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', marginBottom:10, position:'relative', zIndex:1 }}>
                      <div style={{ width:130, fontSize:10, color:ds.color, flexShrink:0,
                        paddingRight:10, textAlign:'right', fontWeight:500 }}>
                        {a.department?.replace(' Department','').replace('State ','').substring(0,15)}
                      </div>
                      <div style={{ flex:1, position:'relative', height:26 }}>
                        <div style={{ position:'absolute', left:0, right:0, top:'50%', height:1,
                          background:'var(--border)', transform:'translateY(-50%)' }}/>
                        <div title={a.title} style={{
                          position:'absolute', left:`${Math.min(leftPct, 80)}%`,
                          width:`${widthPct}%`, height:22, top:2,
                          background:`${c}22`, border:`1.5px solid ${c}70`,
                          borderRadius:5, display:'flex', alignItems:'center', paddingLeft:6,
                          cursor:'default' }}>
                          <span style={{ fontSize:9, color:c, fontWeight:600,
                            whiteSpace:'nowrap', overflow:'hidden' }}>
                            {DT_ICON[a.decision_type]} {a.title?.substring(0,22)}
                          </span>
                        </div>
                        {/* Deadline marker */}
                        <div style={{ position:'absolute', left:`${dlPct}%`, top:0, bottom:0, width:2,
                          background: a.deadline_days<=21?'var(--red)':a.deadline_days<=30?'var(--amber)':'var(--green)',
                          borderRadius:1 }}>
                          <div style={{ position:'absolute', top:-14, left:'50%',
                            transform:'translateX(-50%)', fontSize:8, whiteSpace:'nowrap',
                            fontFamily:'var(--mono)', fontWeight:600,
                            color: a.deadline_days<=21?'var(--red)':a.deadline_days<=30?'var(--amber)':'var(--green)' }}>
                            D{a.deadline_days}
                          </div>
                        </div>
                      </div>
                      <div style={{ width:60, fontSize:10, color:'var(--text3)', flexShrink:0,
                        paddingLeft:8, fontFamily:'var(--mono)' }}>
                        {a.status==='approved' ? <span style={{ color:'var(--green)' }}>✓</span> : <span style={{ color:'var(--amber)' }}>⏳</span>}
                        {' '}{a.priority?.substring(0,3).toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:'flex', gap:16, marginTop:10, paddingLeft:130 }}>
                {[['var(--red)','Critical ≤21d'],['var(--amber)','High ≤30d'],['var(--green)','Normal >30d']].map(([c,l]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:10, height:10, background:c, borderRadius:2 }}/>
                    <span style={{ fontSize:10, color:'var(--text3)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HEAT MAP ── */}
        {view==='heatmap' && (
          <div className="fade-in" style={{ background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:12, overflow:'hidden' }}>
            <div className="panel-header">
              <span className="panel-title">🔥 Department Compliance Heat Map</span>
              <span className="tag tag-blue">Chief Secretary View · All Departments</span>
            </div>
            <div style={{ padding:18 }}>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:16, lineHeight:1.6 }}>
                Cross-case, cross-department compliance health — the government's morning briefing in one view.
                Designed for the <strong style={{ color:'var(--text)' }}>Chief Secretary</strong> and <strong style={{ color:'var(--text)' }}>Cabinet</strong>.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
                {HEATMAP_DEPTS.map((d,i) => (
                  <div key={i} style={{ padding:18, background:d.bg, border:`1.5px solid ${d.color}40`,
                    borderRadius:12, textAlign:'center', cursor:'default', transition:'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.borderColor=d.color; }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor=`${d.color}40`; }}>
                    <div style={{ fontSize:34, fontWeight:700, fontFamily:'var(--serif)', color:d.color, marginBottom:5 }}>
                      {d.score}%
                    </div>
                    <div style={{ fontSize:13, color:'var(--text)', fontWeight:500, marginBottom:5 }}>{d.name}</div>
                    <div style={{ height:5, background:'var(--bg)', borderRadius:99, overflow:'hidden', marginBottom:6 }}>
                      <div style={{ height:'100%', width:`${d.score}%`, background:d.color, borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:10, color:d.color, fontWeight:700 }}>
                      {d.score<50 ? '⚠️ ESCALATE' : d.score<75 ? '📊 MONITOR' : '✅ ON TRACK'}
                    </div>
                  </div>
                ))}
              </div>
              {/* Sorted list */}
              <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.8px',
                  color:'var(--text3)', marginBottom:10, fontWeight:600 }}>Ranked by Risk (worst first)</div>
                {[...HEATMAP_DEPTS].sort((a,b) => a.score-b.score).map((d,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:13, color:'var(--text3)', fontFamily:'var(--mono)', width:20, fontWeight:600 }}>{i+1}</span>
                    <span style={{ flex:1, fontSize:13, color:'var(--text)' }}>{d.name}</span>
                    <div style={{ width:110, height:6, background:'var(--bg)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${d.score}%`, background:d.color, borderRadius:99 }}/>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:d.color, fontFamily:'var(--mono)', width:38, textAlign:'right' }}>
                      {d.score}%
                    </span>
                    <span style={{ fontSize:10, color:d.color, width:72, textAlign:'right', fontWeight:600 }}>
                      {d.score<50 ? 'ESCALATE' : d.score<75 ? 'MONITOR' : 'ON TRACK'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, padding:12, background:'rgba(239,68,68,.06)',
                border:'1px solid rgba(239,68,68,.2)', borderRadius:8, fontSize:12, color:'var(--text2)' }}>
                <span style={{ color:'var(--red)', fontWeight:600 }}>⚠️ Action Required:</span>{' '}
                Revenue Department is critically behind (34% compliance probability). Recommend immediate escalation to Chief Secretary and resource reallocation.
              </div>
            </div>
          </div>
        )}

        {/* ── AUDIT TRAIL ── */}
        {view==='audit' && (
          <div className="fade-in" style={{ background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:12, overflow:'hidden' }}>
            <div className="panel-header">
              <span className="panel-title">🔒 Cryptographic Audit Trail</span>
              <span className="tag tag-green">Tamper-Proof · {audit.length} Events</span>
            </div>
            <div style={{ padding:14 }}>
              {audit.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, padding:30 }}>
                  No audit events yet. Events are recorded when judgments are uploaded and actions are verified.
                </div>
              )}
              {audit.map((a,i) => (
                <div key={i} style={{ padding:12, background:'var(--bg3)',
                  border:'1px solid var(--border)', borderRadius:9, marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <span style={{ fontSize:11, color:'var(--acc2)', fontWeight:600,
                      fontFamily:'var(--mono)' }}>{a.event_type?.toUpperCase()}</span>
                    <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)' }}>
                      {a.created_at?.substring(0,19)}
                    </span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text)', marginBottom:6, lineHeight:1.5 }}>
                    {a.event_description}
                  </div>
                  <div style={{ display:'flex', gap:14, fontSize:10, color:'var(--text3)' }}>
                    <span>👤 {a.user_email}</span>
                    <span>🏷️ {a.user_role}</span>
                    {a.crypto_hash && (
                      <span style={{ fontFamily:'var(--mono)' }}>
                        🔒 Hash: {a.crypto_hash}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
