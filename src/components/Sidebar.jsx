import React from 'react';
import { C, fonts } from '../styles.js';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'calendar', icon: '📅', label: 'Calendar' },
  { id: 'ai', icon: '🤖', label: 'AI Trainer' },
  { id: 'log', icon: '🏋️', label: 'Log Workout' },
  { id: 'nutrition', icon: '🥗', label: 'Nutrition' },
  { id: 'progress', icon: '📈', label: 'Progress' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ activeView, setActiveView, open, setOpen, isMobile }) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && isMobile && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99 }}
          className="mobile-overlay"
        />
      )}

      {/* Hide sidebar entirely on mobile when closed */}
      {(!isMobile || open) && (
      <aside className={isMobile ? 'sidebar-mobile' : ''} style={{
        width: open ? '220px' : '64px',
        minWidth: open ? '220px' : '64px',
        backgroundColor: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        zIndex: 100,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: open ? '16px' : '16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          gap: '10px',
          borderBottom: `1px solid ${C.border}`,
          minHeight: '64px',
        }}>
          <img
            src="/prezkim.jpg"
            alt="The Leader"
            style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              objectFit: 'cover', border: `2px solid ${C.accent}`,
            }}
          />
          {open && (
            <span style={{
              fontSize: '13px', fontWeight: '800', letterSpacing: '-0.01em',
              background: `linear-gradient(135deg, ${C.accent}, #ffffff, ${C.accent2})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}>
              BABY DON'T<br />GET FAT
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={!open ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: open ? '10px 12px' : '10px 0',
                  justifyContent: open ? 'flex-start' : 'center',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: fonts.body,
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? C.accent : C.muted,
                  backgroundColor: isActive ? `${C.accent}15` : 'transparent',
                  transition: 'all 0.15s',
                  width: '100%',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = `${C.border}60`; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? `${C.accent}15` : 'transparent'; e.currentTarget.style.color = isActive ? C.accent : C.muted; }}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                {open && <span>{item.label}</span>}
                {open && isActive && <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: C.accent }} />}
              </button>
            );
          })}
        </nav>

        {/* Version */}
        {open && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: '11px', color: C.muted }}>
            BDGF v1.0 🇺🇸
          </div>
        )}
      </aside>
      )}
    </>
  );
}
