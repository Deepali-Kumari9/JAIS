import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ROLE_COLORS = { Reviewer:'#8b1a1a', Secretary:'#1a2a4a', Admin:'#166534' };

export default function Navbar({ user, onLogout }) {
  const nav = useNavigate();
  const loc = useLocation();
  const m   = loc.pathname.match(/\/(analysis|insights|dashboard)\/([^/]+)/);
  const id  = m ? m[2] : null;
  const cur = m ? m[1] : loc.pathname === '/ccms' ? 'ccms' : '';

  const tabs = [
    { label:'Upload',            path:'/' },
    { label:'Analysis & Verify', key:'analysis' },
    { label:'AI Insights',       key:'insights' },
    { label:'Dashboard',         key:'dashboard' },
    { label:'CCMS Integration',  path:'/ccms' },
  ];

  const go = t => {
    if (t.path) { nav(t.path); return; }
    if (id) nav(`/${t.key}/${id}`);
  };

  const isActive = t => {
    if (t.path === '/') return loc.pathname === '/';
    if (t.path === '/ccms') return loc.pathname === '/ccms';
    return cur === t.key;
  };

  const rColor = user ? (ROLE_COLORS[user.role] || '#1a2a4a') : '#1a2a4a';

  return (
    <>
      <div style={{ height:4, background:'linear-gradient(90deg,#8b1a1a,#b8860b,#1a2a4a,#b8860b,#8b1a1a)', position:'sticky', top:0, zIndex:201 }}/>
      <nav style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'9px 20px', background:'#fffef9',
        borderBottom:'1px solid #c9c0ae',
        position:'sticky', top:4, zIndex:200,
        boxShadow:'0 1px 8px rgba(0,0,0,.07)'
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => nav('/')}>
          <div style={{ width:32, height:32, background:'linear-gradient(135deg,#8b1a1a,#6b1010)',
            borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:700, fontSize:16, fontFamily:"'IBM Plex Mono',monospace",
            boxShadow:'0 2px 6px rgba(139,26,26,.3)' }}>J</div>
          <div>
            <span style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:'#1a1a2e', fontWeight:700 }}>JAIS</span>
            <span style={{ fontSize:9, background:'rgba(139,26,26,.1)', color:'#8b1a1a',
              padding:'1px 6px', borderRadius:3, marginLeft:6,
              fontFamily:"'IBM Plex Mono',monospace", border:'1px solid rgba(139,26,26,.2)', fontWeight:700 }}>v4.0</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:2 }}>
          {tabs.map(t => (
            <button key={t.label} onClick={() => go(t)} style={{
              padding:'5px 12px', borderRadius:5, border:'none', cursor:'pointer',
              fontFamily:"'Nunito Sans',sans-serif", fontSize:12, fontWeight:600,
              transition:'all .15s',
              background: isActive(t) ? '#8b1a1a' : 'transparent',
              color: isActive(t) ? '#fff' : '#3d3d5c',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Right — user + system status */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#166534', boxShadow:'0 0 6px #166534' }}/>
            <span style={{ fontSize:11, color:'#6b6b8a', fontFamily:"'IBM Plex Mono',monospace" }}>Online</span>
          </div>
          {/* CCMS badge */}
          <div style={{ padding:'3px 9px', background:'rgba(26,42,74,.08)',
            border:'1px solid rgba(26,42,74,.2)', borderRadius:4,
            fontSize:10, color:'#1a2a4a', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
            CCMS · CIS
          </div>
          {/* User badge */}
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:7,
              padding:'4px 10px', background:`${rColor}10`,
              border:`1px solid ${rColor}25`, borderRadius:5 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:rColor,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#1a1a2e', fontSize:11, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace" }}>
                {user.name[0]}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:rColor, lineHeight:1 }}>{user.name.split(' ')[0]}</div>
                <div style={{ fontSize:9, color:'#6b6b8a', fontFamily:"'IBM Plex Mono',monospace" }}>{user.role}</div>
              </div>
              {onLogout && (
                <button onClick={onLogout} style={{ marginLeft:4, padding:'2px 7px', fontSize:10,
                  background:'transparent', border:`1px solid ${rColor}30`, borderRadius:3,
                  cursor:'pointer', color:rColor, fontFamily:"'Nunito Sans',sans-serif" }}>
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
