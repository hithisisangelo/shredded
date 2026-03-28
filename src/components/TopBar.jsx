import React, { useState } from 'react';
import { C, fonts } from '../styles.js';

export default function TopBar({ user, onLogout, sidebarOpen, setSidebarOpen }) {
  const [showMenu, setShowMenu] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const getGreeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: C.surface,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '6px', borderRadius: '6px', fontSize: '18px', display: 'flex', alignItems: 'center' }}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>
            {getGreeting()}, {user?.username}!
          </div>
          <div style={{ fontSize: '11px', color: C.muted }}>{dateStr}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        <button
          onClick={() => setShowMenu(m => !m)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
            color: C.text, fontSize: '13px', fontFamily: fonts.body,
          }}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: '#000',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{ fontWeight: '500' }}>{user?.username}</span>
          <span style={{ color: C.muted, fontSize: '10px' }}>▼</span>
        </button>

        {showMenu && (
          <>
            <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              borderRadius: '10px', padding: '6px', minWidth: '160px',
              zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{user?.username}</div>
                <div style={{ fontSize: '11px', color: C.muted }}>{user?.email}</div>
              </div>
              <button
                onClick={() => { setShowMenu(false); onLogout(); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.danger, fontSize: '13px', borderRadius: '6px',
                  fontFamily: fonts.body,
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = `${C.danger}15`}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
