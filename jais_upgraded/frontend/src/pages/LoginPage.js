import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const USERS = [
  {
    id:'reviewer1', name:'Amit Kumar Sharma', role:'Reviewer', email:'amit.sharma@bihar.gov.in',
    dept:'Urban Development Department', badge:'SR-2024-047',
    desc:'Reviews AI-extracted action plans. Can Approve or Reject each action.',
    perms:['view_judgment','approve_action','reject_action','view_audit'],
    color:'#8b1a1a', icon:'📋',
    password:'reviewer123'
  },
  {
    id:'secretary1', name:'Dr. Priya Singh (IAS)', role:'Secretary', email:'priya.singh@bihar.gov.in',
    dept:'Chief Secretary Office', badge:'IAS-2009-BR',
    desc:'Views approved action plans only. Sees compliance dashboard and heat map.',
    perms:['view_judgment','view_dashboard','view_heatmap','view_audit','export_csv'],
    color:'#8b1a1a', icon:'🏛️',
    password:'secretary123'
  },
  {
    id:'admin1', name:'Rajesh Tiwari', role:'Admin', email:'rajesh.tiwari@nic.in',
    dept:'NIC — Bihar State Centre', badge:'NIC-2019-BR',
    desc:'Full access. Manages CCMS integration, user roles, and system settings.',
    perms:['all'],
    color:'#8b1a1a', icon:'⚙️',
    password:'admin123'
  },
];

export default function LoginPage({ onLogin }) {
  const [selected, setSelected] = useState(null);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const doLogin = () => {
    if (!selected) { setError('Please select a role first.'); return; }
    setLoading(true); setError('');
    setTimeout(() => {
      const user = USERS.find(u => u.id === selected);
      if (pass && pass !== user.password && pass !== '') {
        // allow any password for demo — just show a note
      }
      onLogin(user);
      setLoading(false);
      nav('/');
    }, 700);
  };

  const S = {
    page: { minHeight:'100vh', background:'#f4f1eb', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 },
    bar: { height:4, background:'linear-gradient(90deg,#8b1a1a,#b8860b,#1a2a4a,#b8860b,#8b1a1a)', position:'fixed', top:0, left:0, right:0 },
    card: { background:'#fffef9', border:'1px solid #c9c0ae', borderRadius:10, padding:'32px 36px', width:'100%', maxWidth:560, boxShadow:'0 2px 16px rgba(0,0,0,.08)' },
    logo: { textAlign:'center', marginBottom:28 },
    seal: { width:68, height:68, borderRadius:'50%', background:'linear-gradient(135deg,#8b1a1a,#6b1010)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 12px', boxShadow:'0 3px 12px rgba(139,26,26,.3)' },
    title: { fontFamily:"'Crimson Pro',serif", fontSize:26, color:'#1a1a2e', fontWeight:700, textAlign:'center', marginBottom:4 },
    sub: { fontSize:12, color:'#6b6b8a', textAlign:'center', fontFamily:"'IBM Plex Mono',monospace" },
    label: { fontSize:11, fontWeight:700, color:'#3d3d5c', textTransform:'uppercase', letterSpacing:'.7px', marginBottom:10, display:'block', fontFamily:"'IBM Plex Mono',monospace" },
    roleCard: (active, color) => ({
      border:`2px solid ${active ? color : '#c9c0ae'}`, borderRadius:8,
      padding:'12px 15px', marginBottom:9, cursor:'pointer', transition:'all .18s',
      background: active ? `${color}08` : '#fffef9',
      display:'flex', alignItems:'flex-start', gap:12,
    }),
    passInput: { width:'100%', background:'#f4f1eb', border:'1px solid #b5aa96', borderRadius:6, padding:'10px 13px', color:'#1a1a2e', fontSize:14, fontFamily:"'Nunito Sans',sans-serif", outline:'none', boxSizing:'border-box', marginTop:14 },
    btn: { width:'100%', padding:'11px', background:'#8b1a1a', color:'#fff', border:'1px solid #6b1010', borderRadius:6, cursor:'pointer', fontFamily:"'Nunito Sans',sans-serif", fontSize:14, fontWeight:700, marginTop:16, transition:'all .18s' },
    err: { marginTop:10, padding:'8px 12px', background:'rgba(153,27,27,.07)', border:'1px solid rgba(153,27,27,.2)', borderRadius:6, fontSize:12, color:'#991b1b' },
    privacy: { marginTop:20, padding:'10px 14px', background:'rgba(22,101,52,.06)', border:'1px solid rgba(22,101,52,.2)', borderRadius:7, fontSize:11, color:'#166534', lineHeight:1.6 },
  };

  return (
    <div style={S.page}>
      <div style={S.bar}/>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.seal}>⚖️</div>
          <div style={S.title}>JAIS — Government Login</div>
          <div style={S.sub}>Judgment Action Intelligence System · CCMS/CIS Integration</div>
        </div>

        <div style={{ marginBottom:18 }}>
          <span style={S.label}>Select Your Role</span>
          {USERS.map(u => (
            <div key={u.id} style={S.roleCard(selected===u.id, u.color)}
              onClick={() => { setSelected(u.id); setPass(''); setError(''); }}>
              <div style={{ fontSize:24, flexShrink:0, marginTop:2 }}>{u.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#1a1a2e', fontFamily:"'Crimson Pro',serif" }}>
                    {u.name}
                  </div>
                  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:3, fontWeight:700,
                    fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'.5px',
                    background:`${u.color}15`, color:u.color, border:`1px solid ${u.color}30` }}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'#6b6b8a', marginTop:2 }}>{u.dept}</div>
                <div style={{ fontSize:11, color:'#3d3d5c', marginTop:4, lineHeight:1.5 }}>{u.desc}</div>
                <div style={{ fontSize:10, color:'#6b6b8a', marginTop:4, fontFamily:"'IBM Plex Mono',monospace" }}>
                  Demo password: <strong style={{ color:u.color }}>{u.password}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div>
            <input style={S.passInput} type="password" placeholder={`Enter password (demo: ${USERS.find(u=>u.id===selected)?.password})`}
              value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key==='Enter' && doLogin()} />
            {error && <div style={S.err}>⚠️ {error}</div>}
            <button style={S.btn} onClick={doLogin} disabled={loading}
              onMouseEnter={e => e.currentTarget.style.background='#6b1010'}
              onMouseLeave={e => e.currentTarget.style.background='#8b1a1a'}>
              {loading ? '⟳ Logging in...' : `Login as ${USERS.find(u=>u.id===selected)?.role}`}
            </button>
          </div>
        )}

        <div style={S.privacy}>
          🔒 <strong>Data Privacy:</strong> This prototype uses external APIs for demonstration. However, the architecture is designed for deployment with self-hosted LLMs on secure government infrastructure (e.g., NIC), ensuring data sovereignty, controlled access, and audit logging.
        </div>
      </div>

      <div style={{ marginTop:16, fontSize:11, color:'#6b6b8a', textAlign:'center' }}>
        Government of India · NIC · CCMS Integration · JAIS v4.0<br/>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace" }}>For official use only</span>
      </div>
    </div>
  );
}
