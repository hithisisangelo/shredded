import React from 'react';
import { C, fonts } from '../../styles.js';

export default function StatCard({ label, value, icon, color, sub, trend }) {
  const trendColor = trend > 0 ? C.accent : trend < 0 ? C.danger : C.muted;
  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '';

  return (
    <div style={{
      backgroundColor: '#1a1a24',
      border: `1px solid #2a2a3a`,
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color || C.border}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a3a'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {icon && (
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            backgroundColor: color ? `${color}20` : `${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '15px',
          }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '22px', fontWeight: '800', color: C.text, fontFamily: fonts.mono }}>
          {value}
        </span>
        {trend !== undefined && trend !== null && (
          <span style={{ fontSize: '12px', color: trendColor, fontWeight: '600' }}>
            {trendArrow} {Math.abs(trend)}
          </span>
        )}
      </div>
      {sub && (
        <span style={{ fontSize: '11px', color: C.muted }}>{sub}</span>
      )}
    </div>
  );
}
