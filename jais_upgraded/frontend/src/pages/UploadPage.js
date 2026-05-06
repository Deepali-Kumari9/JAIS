import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { uploadJudgment, loadDemo } from '../services/api';
import Navbar from '../components/Navbar';

const FEATURES = [
  { icon:'🎙️', label:'Voice Q&A',            desc:'Ask questions in Hindi or English — spoken or typed' },
  { icon:'⚠️', label:'Anomaly Detection',     desc:'Auto-flags contradictions, impossible dates, data conflicts' },
  { icon:'📊', label:'Compliance Prediction', desc:'Predicts on-time compliance % by dept before failure' },
  { icon:'📅', label:'Gantt Timeline',         desc:'Visual roadmap with dependencies and critical path' },
  { icon:'🔥', label:'Dept. Heat Map',         desc:'Cross-dept compliance health — Chief Secretary view' },
  { icon:'🧬', label:'DNA Fingerprint',        desc:'Semantic precedent matching across CCMS database' },
  { icon:'💡', label:'Explainability',         desc:'Every action links back to its source paragraph' },
  { icon:'🔒', label:'Audit Trail',            desc:'Cryptographic tamper-proof record of every decision' },
];

const SAMPLES = [
  { icon:'📋', badge:'WP/4821/2024', name:'M/s Sharma Construction Ltd. vs State of Bihar', sub:'High Court Patna · Building Permit Restoration · Digital PDF' },
  { icon:'🏛️', badge:'RC/112/2024',  name:'Revenue Dept. Land Acquisition Compliance Order', sub:'District Court · 18 pages · Scanned PDF (OCR applied)' },
  { icon:'⚖️', badge:'NGT/203/2024', name:'Environmental Clearance Violation — Contempt', sub:'National Green Tribunal · 52 pages · Digital PDF' },
];

const PIPELINE = ['PDF / OCR', 'Text Extraction', 'Directive ID', 'Action Plan Gen.', 'Risk Scoring', 'Anomaly Scan', 'Compliance Forecast'];

export default function UploadPage({ user, onLogout }) {
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState('');
  const [step,     setStep]     = useState('');
  const nav = useNavigate();

  const go = r => nav(`/analysis/${r.data.judgment_id}`);

  const handleFile = useCallback(async file => {
    setLoading(true); setError(''); setProgress(0);
    const steps = ['Reading PDF...','Extracting text...','Running AI analysis...','Generating action plans...','Computing risk scores...'];
    let si = 0;
    const iv = setInterval(() => { setStep(steps[si % steps.length]); si++; }, 1200);
    try {
      go(await uploadJudgment(file, setProgress));
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Upload failed';
      setError(msg);
      setLoading(false);
    } finally {
      clearInterval(iv);
    }
  }, []);

  const handleDemo = async () => {
    setLoading(true); setError(''); setStep('Loading demo judgment...');
    try { go(await loadDemo()); }
    catch (e) {
      setError(e.response?.data?.detail || 'Cannot reach backend. Please run: cd backend && python main.py');
      setLoading(false); setStep('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    onDrop: f => f[0] && handleFile(f[0]),
    disabled: loading,
  });

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar user={user} onLogout={onLogout}/>
      <div style={{ maxWidth:740, margin:'0 auto', padding:'32px 20px 60px' }}>

        {/* Badges */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22 }}>
          {[
            ['🏆',' JAIS Platform v4.0','rgba(243, 104, 5, 0.1)','var(--amber)','var(--amber)','rgba(245,158,11,.25)'],
            ['🇮🇳','CCMS · CIS Integrated · Pan-India Ready','rgba(243, 104, 5, 0.1)','var(--amber)','var(--amber)','rgba(245,158,11,.25)'],
            ['🧠','Hybrid Decision Intelligence Engine','rgba(243, 104, 5, 0.1)','var(--amber)','var(--amber)','rgba(245,158,11,.25)'],
          ].map(([ic,lb,bg,col,bdr]) => (
            <div key={lb} style={{ padding:'4px 12px', background:bg, border:`1px solid ${bdr}`,
              borderRadius:99, fontSize:11, color:col, fontWeight:600 }}>{ic} {lb}</div>
          ))}
        </div>

        {/* Hero */}
        <h1 style={{ fontFamily:'var(--serif)', fontSize:40, color:'#1a1a2e', lineHeight:1.15, marginBottom:12 }}>
          Court Judgments →{' '}
          <span style={{ 
            color: 'var(--acc)',
            fontWeight: 700
             }}>
             Verified Action Plans
            </span>
        </h1>
        <p style={{ color:'var(--text2)', fontSize:14, lineHeight:1.8, marginBottom:24 }}>
          JAIS acts as an AI layer on top of CCMS platforms and is designed to scale
          across all Indian states integrated with CIS. It reads complex legal PDFs, extracts
          directives with explainability, maps them to responsible departments, predicts compliance
          probability before failure, and presents human-verified, role-based action plans to
          government decision-makers — with a full cryptographic audit trail.
        </p>

        {/* AI Pipeline strip */}
        <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap', marginBottom:24,
          padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10 }}>
          <span style={{ fontSize:10, color:'var(--text3)', marginRight:4, fontWeight:600 }}>PIPELINE:</span>
          {PIPELINE.map((s,i) => (
            <React.Fragment key={i}>
              <span style={{ fontSize:11, color:'var(--acc2)', padding:'2px 8px', borderRadius:99,
                background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)' }}>{s}</span>
              {i < PIPELINE.length-1 && <span style={{ color:'var(--text3)', fontSize:12 }}>›</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Feature grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:9, marginBottom:26 }}>
          {FEATURES.map((f,i) => (
            <div key={i} style={{ padding:'11px 12px', background:'var(--bg2)',
              border:'1px solid var(--border)', borderRadius:9 }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{f.icon}</div>
              <div style={{ fontSize:12, color:'#1a1a2e', fontWeight:600, marginBottom:2 }}>{f.label}</div>
              <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div {...getRootProps()} style={{
          border:`2px dashed ${isDragActive ? 'var(--acc)' : loading ? 'var(--border2)' : 'var(--border2)'}`,
          borderRadius:14, padding:'40px 28px', textAlign:'center', cursor: loading ? 'default' : 'pointer',
          background: isDragActive ? 'rgba(59,130,246,.05)' : 'var(--bg2)', transition:'all .2s', marginBottom:16,
        }}>
          <input {...getInputProps()} />
          <div style={{ fontSize:40, marginBottom:12 }}>{loading ? '⚙️' : '📄'}</div>
          <h3 style={{ color:'#1a1a2e', fontSize:17, fontWeight:500, marginBottom:7 }}>
            {loading ? step || 'Processing...' : isDragActive ? 'Drop the PDF here' : 'Drop court judgment PDF here'}
          </h3>
          <p style={{ color:'var(--text2)', fontSize:13, marginBottom: loading ? 12 : 0 }}>
            {loading ? 'AI extraction in progress, please wait...' : 'Supports scanned (OCR) & digital PDFs · Max 50 MB'}
          </p>
          {loading && (
            <div style={{ height:4, background:'var(--bg3)', borderRadius:99, overflow:'hidden', maxWidth:300, margin:'0 auto' }}>
              <div style={{ height:'100%', width:`${progress || 40}%`,
                background:'linear-gradient(90deg,var(--acc),var(--purple))',
                borderRadius:99, transition:'width .4s', animation: progress ? 'none' : 'progAnim 1.5s ease-in-out infinite' }}/>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom:16, padding:'12px 16px', background:'rgba(239,68,68,.08)',
            border:'1px solid rgba(239,68,68,.25)', borderRadius:9, color:'var(--red)', fontSize:13 }}>
            <strong>⚠️ Error:</strong> {error}
            <div style={{ marginTop:6, fontSize:11, color:'var(--text3)' }}>
              Tip: Make sure the backend is running → <code style={{ color:'var(--acc2)' }}>cd backend && python main.py</code>
            </div>
          </div>
        )}

        {/* Sample judgments */}
        <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase',
          letterSpacing:1, marginBottom:10, fontWeight:600 }}>Or load a sample judgment — no PDF needed</div>
        {SAMPLES.map((s,i) => (
          <div key={i} onClick={!loading ? handleDemo : undefined}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px',
              background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10,
              cursor: loading ? 'default' : 'pointer', transition:'all .2s', marginBottom:8,
              opacity: loading ? .6 : 1 }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor='var(--acc)'; e.currentTarget.style.background='var(--bg3)'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg2)'; }}>
            <div style={{ width:38, height:38, background:'rgba(59,130,246,.1)', borderRadius:9,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
              {s.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#1a1a2e', fontSize:13, fontWeight:500 }}>{s.name}</div>
              <div style={{ color:'var(--text2)', fontSize:11, marginTop:2 }}>{s.sub}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99,
                background:'rgba(59,130,246,.1)', color:'var(--acc2)',
                border:'1px solid rgba(59,130,246,.2)', fontFamily:'var(--mono)' }}>{s.badge}</span>
              <span className="tag tag-green">DEMO</span>
            </div>
          </div>
        ))}

        {/* Scalability note — Gap #10 */}
        <div style={{ marginTop:20, padding:'12px 16px', background:'var(--bg2)',
          border:'1px solid var(--border)', borderRadius:10,
          borderLeft:'3px solid var(--acc)' }}>
          <div style={{ fontSize:11, color:'var(--acc2)', fontWeight:600, marginBottom:4 }}>🌐 Designed to Scale Nationally</div>
          <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.7 }}>
            This system acts as an <strong style={{ color:'var(--text)' }}>AI layer on top of CCMS platforms </strong> 
            and is designed to scale across <strong style={{ color:'var(--text)' }}>all Indian states integrated with CIS</strong> (Court Information System).
            Any state can plug in their CCMS data and get the same AI-powered compliance intelligence.
          </div>
        </div>

      </div>

        {/* Data Privacy — Fix 3 */}
        <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(22,101,52,.06)',
          border:'1px solid rgba(22,101,52,.2)', borderRadius:10,
          borderLeft:'3px solid #166534' }}>
          <div style={{ fontSize:11, color:'#166534', fontWeight:700, marginBottom:4 }}>🔒 Data Privacy & Sovereignty</div>
          <div style={{ fontSize:12, color:'#3d3d5c', lineHeight:1.7 }}>
            This prototype uses external APIs for demonstration. However, the architecture is designed for deployment with self-hosted LLMs on secure government infrastructure (e.g., NIC), ensuring data sovereignty, controlled access, and audit logging.
          </div>
        </div>

      <style>{`@keyframes progAnim{0%,100%{transform:translateX(-60%)}50%{transform:translateX(200%)}}`}</style>
    </div>
  );
}
