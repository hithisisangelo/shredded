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

export default function Sidebar({ activeView, setActiveView, open, setOpen }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ display: 'none', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99 }}
          className="mobile-overlay"
        />
      )}

      <aside style={{
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
          padding: open ? '20px 16px' : '20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          gap: '10px',
          borderBottom: `1px solid ${C.border}`,
          minHeight: '64px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
          }}>
            💪
          </div>
          {open && (
            <span style={{
              fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em',
              background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>
              SHREDDED
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
            SHREDDED v1.0
          </div>
        )}
      </aside>
    </>
  );
}
