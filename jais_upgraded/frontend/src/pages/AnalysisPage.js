import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJudgment, getActions, verifyAction, getAuditTrail } from '../services/api';
import Navbar from '../components/Navbar';

/* ── colour helpers ─────────────────────────────────────── */
const PRI = {
  critical:{bg:'rgba(239,68,68,.15)',color:'var(--red)',   border:'rgba(239,68,68,.3)',  lbl:'P1'},
  high:    {bg:'rgba(245,158,11,.15)',color:'var(--amber)',border:'rgba(245,158,11,.3)', lbl:'P2'},
  medium:  {bg:'rgba(59,130,246,.15)',color:'var(--acc2)', border:'rgba(59,130,246,.3)', lbl:'P3'},
  low:     {bg:'rgba(16,185,129,.15)',color:'var(--green)',border:'rgba(16,185,129,.2)', lbl:'P4'},
};
const DT_COLOR = {
  'Compliance':     'var(--acc2)',
  'Appeal Advisory':'var(--purple)',
  'Reporting':      'var(--amber)',
  'Assessment':     'var(--green)',
};
const ACT_ICON = { legal:'⚖️', administrative:'🏛️', financial:'💰' };

/* ── Pipeline badge row ─────────────────────────────────── */
const Pipeline = ({ stages }) => (
  <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:14}}>
    {(stages||[]).map((s,i)=>(
      <React.Fragment key={i}>
        <span style={{fontSize:10,padding:'3px 9px',borderRadius:99,
          background:'rgba(59,130,246,.1)',color:'var(--acc2)',
          border:'1px solid rgba(59,130,246,.2)',fontWeight:500}}>{s}</span>
        {i<stages.length-1 && <span style={{color:'var(--text3)',fontSize:11,alignSelf:'center'}}>›</span>}
      </React.Fragment>
    ))}
  </div>
);

/* ── Confidence pill row ───────────────────────────────── */
const ConfRow = ({scores}) => {
  if (!scores || !Object.keys(scores).length) return null;
  return (
    <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
      {Object.entries(scores).map(([k,v])=>(
        <span key={k} style={{fontSize:10,padding:'2px 7px',borderRadius:99,
          background: v>=85?'rgba(16,185,129,.1)':v>=70?'rgba(245,158,11,.1)':'rgba(239,68,68,.1)',
          color: v>=85?'var(--green)':v>=70?'var(--amber)':'var(--red)',
          border:`1px solid ${v>=85?'rgba(16,185,129,.2)':v>=70?'rgba(245,158,11,.2)':'rgba(239,68,68,.2)'}`,
          fontFamily:'var(--mono)'}}>
          {k}: {v}%
        </span>
      ))}
    </div>
  );
};

export default function AnalysisPage({ user, onLogout }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [data,     setData]    = useState(null);
  const [actions,  setActions] = useState([]);
  const [audit,    setAudit]   = useState([]);
  const [tab,      setTab]     = useState('overview');
  const [hlSent,   setHlSent]  = useState('');
  const [notif,    setNotif]   = useState(null);
  const [busy,     setBusy]    = useState({});
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  const [editId,   setEditId]  = useState(null);
  const [editNote, setEditNote]= useState('');
  const [filter,   setFilter]  = useState('all'); // all | pending | approved | rejected

  // Role-based permission: only Reviewer and Admin can approve/reject
  const canVerify = !user || user.role === 'Reviewer' || user.role === 'Admin' || user.perms?.includes('all');

  const fetchAll = useCallback(async () => {
    try {
      const [j, a, au] = await Promise.all([
        getJudgment(id), getActions(id), getAuditTrail(id)
      ]);
      setData(j.data);
      setActions(a.data || []);
      setAudit(au.data || []);
    } catch (e) {
      setError('Could not load judgment data. Please check that the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const notify = (msg, color = 'var(--green)') => {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 3500);
  };

  const doVerify = async (aid, action) => {
    setBusy(b => ({ ...b, [aid]: true }));
    try {
      await verifyAction(aid, {
        action,
        user_email: 'reviewer@jais.gov.in',
        user_role: 'Senior Reviewer',
        notes: editNote || undefined,
      });
      setActions(prev => prev.map(a =>
        a.id === aid
          ? { ...a, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending' }
          : a
      ));
      const msgs = { approve:'✓ Approved — action added to dashboard', reject:'✗ Rejected and logged', reset:'↺ Reset to pending' };
      const cols  = { approve:'var(--green)', reject:'var(--red)', reset:'var(--amber)' };
      notify(msgs[action], cols[action]);
      setEditId(null); setEditNote('');
      const au = await getAuditTrail(id);
      setAudit(au.data || []);
    } catch (e) {
      notify('Error: ' + (e.response?.data?.detail || 'Verification failed. Please try again.'), 'var(--red)');
    } finally {
      setBusy(b => ({ ...b, [aid]: false }));
    }
  };

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80vh', gap:12 }}>
      <div style={{ fontSize:32, animation:'sp 1s linear infinite' }}>⚙️</div>
      <div style={{ color:'var(--text2)', fontSize:14 }}>Loading judgment data...</div>
    </div>
  );

  if (error) return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar user={user} onLogout={onLogout}/>
      <div style={{ maxWidth:540, margin:'80px auto', padding:24, background:'rgba(239,68,68,.08)',
        border:'1px solid rgba(239,68,68,.3)', borderRadius:12 }}>
        <div style={{ fontSize:24, marginBottom:10 }}>⚠️</div>
        <div style={{ color:'var(--red)', fontSize:15, fontWeight:600, marginBottom:8 }}>Failed to Load Judgment</div>
        <div style={{ color:'var(--text2)', fontSize:13, lineHeight:1.7 }}>{error}</div>
        <button className="btn btn-secondary" style={{ marginTop:16 }} onClick={() => nav('/')}>← Back to Upload</button>
      </div>
    </div>
  );

  const j    = data?.judgment || {};
  const dirs = data?.directives || [];
  const stages = ['PDF Extraction', 'Text Parsing', 'Directive ID', 'Action Plan Gen.', 'Risk Scoring', 'Confidence Calc.'];

  const filteredActions = filter === 'all' ? actions : actions.filter(a => a.status === filter);
  const approvedN  = actions.filter(a => a.status === 'approved').length;
  const pendingN   = actions.filter(a => a.status === 'pending').length;
  const rejectedN  = actions.filter(a => a.status === 'rejected').length;

  /* Highlighted PDF text */
  const pdfLines = (j.raw_text || '').split('\n').map((line, i) => {
    const isHl = hlSent && hlSent.length > 15 && line.includes(hlSent.substring(0, 30));
    return (
      <span key={i} style={isHl ? {
        background: 'rgba(245,158,11,.28)', borderBottom: '2px solid var(--amber)',
        borderRadius: 3, padding: '0 2px'
      } : {}}>
        {line}{'\n'}
      </span>
    );
  });

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout}/>

      {/* Toast notification */}
      {notif && (
        <div style={{ position:'fixed', top:68, right:20, zIndex:999, padding:'10px 18px',
          borderRadius:9, background:'var(--bg2)', border:`1px solid ${notif.color}`,
          color: notif.color, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(0,0,0,.5)',
          animation:'slideIn .25s ease' }}>
          {notif.msg}
        </div>
      )}

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <h2 style={{ fontFamily:'var(--serif)', fontSize:22, color:'#1a1a2e', marginBottom:4 }}>⚖️ Analysis & Human Verification</h2>
            <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--mono)' }}>
              {j.case_number} · {j.court}
              {j.ocr_used ? <span style={{ marginLeft:8, color:'var(--amber)', fontSize:10 }}>⚡ OCR Applied</span> : null}
              {j.pdf_method ? <span style={{ marginLeft:8, color:'var(--text3)', fontSize:10 }}>via {j.pdf_method}</span> : null}
            </div>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span className="tag tag-green">{approvedN} approved</span>
            <span className="tag tag-amber">{pendingN} pending</span>
            {rejectedN > 0 && <span className="tag tag-red">{rejectedN} rejected</span>}
            <button className="btn btn-primary btn-sm" onClick={() => nav(`/insights/${id}`)}>AI Insights →</button>
          </div>
        </div>

        {/* Pipeline strip */}
        <Pipeline stages={j.pipeline_stages || stages} />

        {/* Split panel */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, height:'calc(100vh - 230px)' }}>

          {/* ── LEFT: PDF Viewer ─────────────────────────────── */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>

            <div className="panel-header">
              <span className="panel-title">📄 Judgment Document</span>
              <div style={{ display:'flex', gap:4 }}>
                {[['overview','Overview'], ['text','Full Text'], ['directives','Directives']].map(([k,l]) => (
                  <button key={k} onClick={() => setTab(k)} style={{
                    padding:'3px 9px', borderRadius:5, border:'none', cursor:'pointer',
                    fontFamily:'var(--font)', fontSize:11,
                    background: tab===k ? 'var(--acc)' : 'var(--bg3)',
                    color: tab===k ? '#fff' : 'var(--text2)'
                  }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:14 }}>

              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <div className="fade-in">
                  {[
                    ['Case Number',  j.case_number],
                    ['Case Title',   j.case_title],
                    ['Court',        j.court],
                    ['Date of Order',j.date_of_order],
                    ['Petitioner',   j.petitioner],
                    ['Respondent',   j.respondent],
                    ['Presiding Judge', j.judge],
                  ].map(([l,v]) => v && (
                    <div key={l} style={{ marginBottom:10, padding:'10px 13px',
                      background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase',
                        letterSpacing:'.5px', marginBottom:3, fontWeight:500 }}>{l}</div>
                      <div style={{ fontSize:13, color:'#1a1a2e', fontWeight:500 }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ marginTop:12, padding:12, background:'rgba(59,130,246,.06)',
                    border:'1px solid rgba(59,130,246,.2)', borderRadius:9 }}>
                    <div style={{ fontSize:11, color:'var(--acc2)', fontWeight:600, marginBottom:6 }}>
                      ✓ AI EXTRACTION SUMMARY
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        ['Directives Found', dirs.length],
                        ['Action Plans',     actions.length],
                        ['Approved',         approvedN],
                        ['Pending Review',   pendingN],
                      ].map(([l,v]) => (
                        <div key={l} style={{ padding:'7px 10px', background:'var(--bg3)', borderRadius:6 }}>
                          <div style={{ fontSize:18, fontWeight:700, color:'var(--acc2)', fontFamily:'var(--serif)' }}>{v}</div>
                          <div style={{ fontSize:10, color:'var(--text3)' }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {j.ocr_used && (
                    <div style={{ marginTop:10, padding:10, background:'rgba(245,158,11,.07)',
                      border:'1px solid rgba(245,158,11,.2)', borderRadius:7, fontSize:12, color:'var(--amber)' }}>
                      ⚡ <strong>OCR Applied:</strong> This was a scanned PDF. Text was extracted using optical character recognition. Accuracy may vary — please verify key values manually.
                    </div>
                  )}
                </div>
              )}

              {/* FULL TEXT TAB */}
              {tab === 'text' && (
                <div className="fade-in">
                  {hlSent && (
                    <div style={{ marginBottom:10, padding:'7px 11px', background:'rgba(245,158,11,.1)',
                      border:'1px solid rgba(245,158,11,.2)', borderRadius:6, fontSize:11, color:'var(--amber)' }}>
                      🔍 Highlighting source text for selected directive
                    </div>
                  )}
                  <pre style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text)',
                    lineHeight:1.75, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                    {pdfLines}
                  </pre>
                </div>
              )}

              {/* DIRECTIVES TAB */}
              {tab === 'directives' && (
                <div className="fade-in">
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:12 }}>
                    Click any directive to highlight its source in the PDF text.
                  </div>
                  {dirs.map((d, i) => (
                    <div key={i}
                      onClick={() => { setHlSent(d.source_sentence || ''); setTab('text'); }}
                      style={{ padding:12, background:'var(--bg3)', border:'1px solid var(--border)',
                        borderRadius:9, marginBottom:9, cursor:'pointer', transition:'all .15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--acc)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--acc2)',
                            background:'rgba(59,130,246,.1)', padding:'2px 7px', borderRadius:99,
                            border:'1px solid rgba(59,130,246,.2)' }}>
                            Para {d.source_paragraph}
                          </span>
                          <span style={{ fontSize:10, color:'var(--text3)' }}>{d.directive_type}</span>
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, fontFamily:'var(--mono)',
                          color: d.confidence >= 0.9 ? 'var(--green)' : d.confidence >= 0.75 ? 'var(--amber)' : 'var(--red)' }}>
                          {Math.round((d.confidence || 0.85) * 100)}% conf.
                        </span>
                      </div>
                      <div style={{ fontSize:13, color:'#1a1a2e', fontWeight:500, marginBottom:6, lineHeight:1.5 }}>
                        {d.directive_text}
                      </div>
                      {d.source_sentence && (
                        <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic',
                          borderLeft:'2px solid var(--border2)', paddingLeft:8, lineHeight:1.6 }}>
                          "{d.source_sentence.substring(0, 120)}..."
                          <span style={{ marginLeft:8, fontSize:10, color:'var(--acc2)', fontStyle:'normal' }}>
                            ← click to highlight in text
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Action Plans Verification ─────────────── */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>

            <div className="panel-header">
              <span className="panel-title">✅ Action Plans — Human Verification</span>
              <div style={{ display:'flex', gap:4 }}>
                {[['all','All'], ['pending','Pending'], ['approved','Approved'], ['rejected','Rejected']].map(([k,l]) => (
                  <button key={k} onClick={() => setFilter(k)} style={{
                    padding:'3px 8px', borderRadius:5, border:'none', cursor:'pointer',
                    fontFamily:'var(--font)', fontSize:10,
                    background: filter===k ? 'var(--acc)' : 'var(--bg3)',
                    color: filter===k ? '#fff' : 'var(--text2)'
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {approvedN === 0 && (
              <div style={{ margin:'10px 14px 0', padding:'8px 12px', background:'rgba(245,158,11,.08)',
                border:'1px solid rgba(245,158,11,.2)', borderRadius:7, fontSize:12, color:'var(--amber)' }}>
                ⚠️ No actions approved yet. Only approved actions appear in the Dashboard.
              </div>
            )}

            <div style={{ flex:1, overflowY:'auto', padding:14 }}>
              {filteredActions.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, paddingTop:30 }}>
                  No {filter !== 'all' ? filter : ''} actions found.
                </div>
              )}
              {filteredActions.map((a, i) => {
                const pc = PRI[a.priority] || PRI.medium;
                const isApproved = a.status === 'approved';
                const isRejected = a.status === 'rejected';
                const dtColor = DT_COLOR[a.decision_type] || 'var(--acc2)';
                const scores = typeof a.confidence_scores === 'string'
                  ? JSON.parse(a.confidence_scores || '{}')
                  : (a.confidence_scores || {});

                return (
                  <div key={i} style={{
                    padding:13, background:'var(--bg3)',
                    border:`1px solid ${isApproved ? 'rgba(16,185,129,.35)' : isRejected ? 'rgba(239,68,68,.3)' : 'var(--border)'}`,
                    borderRadius:10, marginBottom:10, opacity: isRejected ? .6 : 1, transition:'all .2s'
                  }}>
                    {/* Top badges */}
                    <div style={{ display:'flex', gap:5, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99,
                        background:pc.bg, color:pc.color, border:`1px solid ${pc.border}`,
                        fontWeight:600, fontFamily:'var(--mono)' }}>{pc.lbl} {a.priority?.toUpperCase()}</span>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99,
                        background:`${dtColor}15`, color:dtColor, border:`1px solid ${dtColor}30`, fontWeight:600 }}>
                        {a.decision_type || 'Compliance'}
                      </span>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99,
                        background:'var(--bg)', color:'var(--text3)', border:'1px solid var(--border)' }}>
                        {ACT_ICON[a.action_type]} {a.action_type}
                      </span>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99,
                        background:'var(--bg)', color:'var(--text3)', border:'1px solid var(--border)',
                        fontFamily:'var(--mono)' }}>DRS {a.risk_score}</span>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99,
                        background:'var(--bg)', color:'var(--amber)', border:'1px solid rgba(245,158,11,.2)',
                        fontFamily:'var(--mono)' }}>Day {a.deadline_days}</span>
                      {isApproved && <span className="tag tag-green">✓ APPROVED</span>}
                      {isRejected && <span className="tag tag-red">✗ REJECTED</span>}
                    </div>

                    {/* Role for */}
                    {a.role_for && (
                      <div style={{ fontSize:10, color:'var(--purple)', marginBottom:5, fontWeight:600 }}>
                        👤 {a.role_for}
                      </div>
                    )}

                    {/* Title */}
                    <div style={{ fontSize:13, color:'#1a1a2e', fontWeight:600, marginBottom:6, lineHeight:1.5 }}>
                      {a.title}
                    </div>

                    {/* Confidence scores — Gap #3 */}
                    <ConfRow scores={scores} />

                    {/* Source — Gap #2 explainability */}
                    {a.source_sentence && (
                      <div style={{ marginBottom:8, padding:'6px 10px', background:'rgba(59,130,246,.06)',
                        border:'1px solid rgba(59,130,246,.15)', borderRadius:6 }}>
                        <div style={{ fontSize:9, color:'var(--acc2)', textTransform:'uppercase',
                          letterSpacing:'.5px', marginBottom:3, fontWeight:600 }}>
                          📍 Source — Para {a.source_paragraph}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text2)', fontStyle:'italic', lineHeight:1.5 }}>
                          "{a.source_sentence?.substring(0, 100)}..."
                        </div>
                      </div>
                    )}

                    {/* Reason — Gap #11 */}
                    {a.reason && (
                      <div style={{ marginBottom:9, padding:'6px 10px', background:'rgba(139,92,246,.06)',
                        border:'1px solid rgba(139,92,246,.15)', borderRadius:6 }}>
                        <div style={{ fontSize:9, color:'var(--purple)', textTransform:'uppercase',
                          letterSpacing:'.5px', marginBottom:3, fontWeight:600 }}>💡 Why This Action</div>
                        <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.6 }}>{a.reason}</div>
                      </div>
                    )}

                    {/* Details grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
                      {[
                        ['Department', a.department?.replace(' Department','')],
                        ['Officer',    a.responsible_officer],
                        ['Deadline',   a.deadline_date],
                        ['Action',     a.nature_of_action],
                      ].filter(([,v]) => v).map(([l,v]) => (
                        <div key={l}>
                          <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px' }}>{l}</div>
                          <div style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Risk bar */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase' }}>Risk Score</span>
                      <div style={{ flex:1, height:4, background:'var(--bg)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:99,
                          width:`${a.risk_score}%`,
                          background: a.risk_score>=70 ? 'var(--red)' : a.risk_score>=50 ? 'var(--amber)' : 'var(--green)' }}/>
                      </div>
                      <span style={{ fontSize:10, fontFamily:'var(--mono)', fontWeight:600,
                        color: a.risk_score>=70 ? 'var(--red)' : a.risk_score>=50 ? 'var(--amber)' : 'var(--green)' }}>
                        {a.risk_score}/100
                      </span>
                    </div>

                    {/* Reviewer note editor */}
                    {editId === a.id && (
                      <textarea value={editNote} onChange={e => setEditNote(e.target.value)}
                        placeholder="Add reviewer notes (optional)..."
                        style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border2)',
                          borderRadius:7, padding:'7px 10px', color:'var(--text)', fontSize:12,
                          resize:'vertical', minHeight:55, fontFamily:'var(--font)', marginBottom:8, outline:'none',
                          boxSizing:'border-box' }}/>
                    )}
                    {a.notes && !editId && (
                      <div style={{ marginBottom:8, fontSize:11, color:'var(--text3)', fontStyle:'italic' }}>
                        📝 Note: {a.notes}
                      </div>
                    )}

                    {/* Action buttons */}
                    {canVerify && !isApproved && !isRejected ? (
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => doVerify(a.id, 'approve')} disabled={busy[a.id]}
                          className="btn btn-sm" style={{ flex:1, background:'rgba(16,185,129,.15)',
                            color:'var(--green)', border:'1px solid rgba(16,185,129,.3)' }}>
                          {busy[a.id] ? '⟳' : '✓ Approve'}
                        </button>
                        <button onClick={() => setEditId(editId === a.id ? null : a.id)}
                          className="btn btn-secondary btn-sm">
                          {editId === a.id ? '✕' : '✎ Note'}
                        </button>
                        <button onClick={() => doVerify(a.id, 'reject')} disabled={busy[a.id]}
                          className="btn btn-sm" style={{ flex:1, background:'rgba(239,68,68,.15)',
                            color:'var(--red)', border:'1px solid rgba(239,68,68,.3)' }}>
                          {busy[a.id] ? '⟳' : '✗ Reject'}
                        </button>
                      </div>
                    ) : canVerify ? (
                      <button onClick={() => doVerify(a.id, 'reset')} className="btn btn-secondary btn-sm"
                        style={{ width:'100%' }}>↺ Reset Decision</button>
                    ) : (
                      <div style={{ fontSize:11, color:'#6b6b8a', fontStyle:'italic', textAlign:'center', padding:'6px 0' }}>View only — {user?.role} role cannot modify actions</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
