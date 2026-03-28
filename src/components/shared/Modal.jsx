import React, { useEffect } from 'react';
import { C, fonts } from '../../styles.js';

export default function Modal({ children, onClose, title, width = '520px' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: '#1a1a24',
          border: `1px solid #2a2a3a`,
          borderRadius: '16px',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          animation: 'modalIn 0.15s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.96) translateY(-8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid #2a2a3a`, flexShrink: 0,
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text, fontFamily: fonts.body }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: C.muted,
              fontSize: '20px', lineHeight: 1, padding: '4px 8px', borderRadius: '6px',
              fontFamily: fonts.body, display: 'flex', alignItems: 'center',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2a2a3a'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.muted; }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          scrollbarWidth: 'thin',
          scrollbarColor: `#2a2a3a transparent`,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
