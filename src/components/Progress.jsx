import React, { useState, useEffect, useCallback } from 'react';
import { C, fonts, card, input, btn, btnPrimary, btnSecondary, flexBetween, label } from '../styles.js';
import { progress } from '../api.js';

function LineChart({ data, xKey, yKey, color, label: chartLabel, unit, height = 160 }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: '8px', color: C.muted, fontSize: '13px' }}>
        No data yet
      </div>
    );
  }

  const values = data.map(d => d[yKey]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const w = 600;
  const h = height;
  const pad = { top: 16, right: 16, bottom: 24, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const toX = (i) => pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v) => pad.top + chartH - ((v - minVal) / range) * chartH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d[yKey])}`).join(' ');
  const areaD = `${pathD} L ${toX(data.length - 1)} ${h - pad.bottom} L ${pad.left} ${h - pad.bottom} Z`;

  const showLabels = Math.min(data.length, 6);
  const labelIndices = data.length <= showLabels
    ? data.map((_, i) => i)
    : Array.from({ length: showLabels }, (_, i) => Math.round(i * (data.length - 1) / (showLabels - 1)));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px` }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = pad.top + chartH * (1 - t);
          const val = minVal + range * t;
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke={C.border} strokeWidth="1" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill={C.muted}>{Math.round(val)}</text>
            </g>
          );
        })}
        {/* Area */}
        <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Points */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d[yKey])} r="3.5" fill={color} stroke={C.card} strokeWidth="2" />
        ))}
        {/* X labels */}
        {labelIndices.map(i => {
          const d = data[i];
          const dateStr = d[xKey];
          const dateObj = new Date(dateStr + 'T12:00:00');
          const lbl = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text key={i} x={toX(i)} y={h - 4} textAnchor="middle" fontSize="9" fill={C.muted}>{lbl}</text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({ data, xKey, yKey, color, height = 160 }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: '8px', color: C.muted, fontSize: '13px' }}>
        No data yet
      </div>
    );
  }
  const maxVal = Math.max(...data.map(d => d[yKey]), 1);
  const w = 600;
  const h = height;
  const pad = { top: 16, right: 16, bottom: 28, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const barW = Math.max(chartW / data.length - 4, 4);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px` }}>
        {[0, 0.5, 1].map((t, i) => {
          const y = pad.top + chartH * (1 - t);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke={C.border} strokeWidth="1" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill={C.muted}>{Math.round(maxVal * t).toLocaleString()}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = pad.left + (i / data.length) * chartW + 2;
          const barH = (d[yKey] / maxVal) * chartH;
          const y = pad.top + chartH - barH;
          const lbl = d[xKey] ? new Date(d[xKey] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `W${i+1}`;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={`${color}90`} />
              <text x={x + barW / 2} y={h - 6} textAnchor="middle" fontSize="9" fill={C.muted}>{lbl}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Progress() {
  const today = new Date().toISOString().split('T')[0];
  const [bodyweightData, setBodyweightData] = useState([]);
  const [strengthData, setStrengthData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [measurements, setMeasurements] = useState(null);

  const [weightInput, setWeightInput] = useState('');
  const [loggingWeight, setLoggingWeight] = useState(false);

  const [measureForm, setMeasureForm] = useState({ chest: '', waist: '', hips: '', arms: '', legs: '', notes: '' });
  const [savingMeasure, setSavingMeasure] = useState(false);

  const [activeTab, setActiveTab] = useState('bodyweight');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [bw, ex, vol] = await Promise.all([
        progress.getBodyweight(90),
        progress.getExercises(),
        progress.getVolume(8),
      ]);
      setBodyweightData(bw);
      setExercises(ex);
      setVolumeData(vol);
      if (ex.length > 0 && !selectedExercise) setSelectedExercise(ex[0]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selectedExercise) {
      progress.getStrength(selectedExercise, 90).then(setStrengthData).catch(() => {});
    }
  }, [selectedExercise]);

  useEffect(() => {
    progress.getMeasurements().then(m => {
      if (m.length > 0) {
        const latest = m[0];
        setMeasureForm({
          chest: latest.chest || '', waist: latest.waist || '', hips: latest.hips || '',
          arms: latest.arms || '', legs: latest.legs || '', notes: latest.notes || '',
        });
        setMeasurements(m);
      }
    }).catch(() => {});
  }, []);

  const handleLogWeight = async () => {
    if (!weightInput) return;
    setLoggingWeight(true);
    try {
      await progress.logBodyweight({ weight_lbs: parseFloat(weightInput), date: today });
      const bw = await progress.getBodyweight(90);
      setBodyweightData(bw);
      setWeightInput('');
      setMsg('✓ Weight logged!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally {
      setLoggingWeight(false);
    }
  };

  const handleSaveMeasurements = async () => {
    setSavingMeasure(true);
    try {
      await progress.logMeasurements({ ...measureForm, date: today });
      setMsg('✓ Measurements saved!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally {
      setSavingMeasure(false);
    }
  };

  const latestWeight = bodyweightData.length > 0 ? bodyweightData[bodyweightData.length - 1]?.weight_lbs : null;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>Progress</h1>
        <p style={{ color: C.muted, fontSize: '14px' }}>Track your body composition and strength gains</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: C.surface, padding: '4px', borderRadius: '10px', marginBottom: '24px', border: `1px solid ${C.border}` }}>
        {[
          { id: 'bodyweight', label: '⚖️ Bodyweight' },
          { id: 'strength', label: '💪 Strength' },
          { id: 'volume', label: '📊 Volume' },
          { id: 'measurements', label: '📏 Measurements' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: '12px', fontWeight: '600', transition: 'all 0.15s', backgroundColor: activeTab === t.id ? C.accent : 'transparent', color: activeTab === t.id ? '#000' : C.muted }}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: msg.startsWith('Error') ? `${C.danger}15` : `${C.accent}15`, border: `1px solid ${msg.startsWith('Error') ? C.danger : C.accent}40`, borderRadius: '8px', fontSize: '13px', color: msg.startsWith('Error') ? C.danger : C.accent }}>
          {msg}
        </div>
      )}

      {activeTab === 'bodyweight' && (
        <div>
          <div style={{ ...card, marginBottom: '16px' }}>
            <div style={{ ...flexBetween, marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>Bodyweight Trend</h2>
                {latestWeight && <p style={{ fontSize: '13px', color: C.muted }}>Latest: <span style={{ color: C.accent, fontWeight: '700' }}>{latestWeight} lbs</span></p>}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="e.g. 185.5" style={{ ...input, width: '130px' }} />
                <button onClick={handleLogWeight} disabled={loggingWeight || !weightInput} style={{ ...btnPrimary, padding: '10px 16px', opacity: (!weightInput || loggingWeight) ? 0.7 : 1, whiteSpace: 'nowrap' }}>Log Weight</button>
              </div>
            </div>
            <LineChart data={bodyweightData} xKey="date" yKey="weight_lbs" color={C.accent} unit="lbs" height={180} />
          </div>
        </div>
      )}

      {activeTab === 'strength' && (
        <div style={{ ...card }}>
          <div style={{ ...flexBetween, marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>Strength Progress</h2>
            {exercises.length > 0 && (
              <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={{ ...input, maxWidth: '280px' }}>
                {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            )}
          </div>
          {exercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: C.muted, fontSize: '13px' }}>
              Complete some workouts first to see strength progress
            </div>
          ) : (
            <>
              <LineChart data={strengthData} xKey="date" yKey="maxWeight" color={C.accent2} unit="lbs" height={200} />
              {strengthData.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                  <div style={{ padding: '10px 16px', backgroundColor: `${C.accent2}15`, borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: C.muted }}>Best</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: C.accent2 }}>{Math.max(...strengthData.map(d => d.maxWeight))} lbs</div>
                  </div>
                  <div style={{ padding: '10px 16px', backgroundColor: `${C.accent}15`, borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: C.muted }}>Latest</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: C.accent }}>{strengthData[strengthData.length - 1]?.maxWeight} lbs</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'volume' && (
        <div style={{ ...card }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text, marginBottom: '8px' }}>Weekly Training Volume</h2>
          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '16px' }}>Total volume = sets × reps × weight (lbs)</p>
          <BarChart data={volumeData} xKey="week" yKey="volume" color={C.info} height={200} />
          {volumeData.length > 1 && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: C.muted }}>
              {volumeData[volumeData.length - 1]?.volume > volumeData[volumeData.length - 2]?.volume
                ? <span style={{ color: C.accent }}>↑ Volume increased vs last week</span>
                : <span style={{ color: C.danger }}>↓ Volume decreased vs last week</span>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'measurements' && (
        <div style={{ ...card }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>Body Measurements</h2>
          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '20px' }}>Log today's measurements (in inches)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { key: 'chest', label: 'Chest', icon: '👕' },
              { key: 'waist', label: 'Waist', icon: '📐' },
              { key: 'hips', label: 'Hips', icon: '🦵' },
              { key: 'arms', label: 'Arms (flexed)', icon: '💪' },
              { key: 'legs', label: 'Legs (thigh)', icon: '🦵' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ ...label }}>{f.icon} {f.label}</label>
                <input
                  type="number" step="0.25" min="0"
                  value={measureForm[f.key]}
                  onChange={e => setMeasureForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder='inches'
                  style={{ ...input }}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ ...label }}>Notes</label>
              <input type="text" value={measureForm.notes} onChange={e => setMeasureForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Any notes..." style={{ ...input }} />
            </div>
          </div>
          <button onClick={handleSaveMeasurements} disabled={savingMeasure} style={{ ...btnPrimary, marginTop: '16px', padding: '10px 28px', opacity: savingMeasure ? 0.7 : 1 }}>
            {savingMeasure ? 'Saving...' : '💾 Save Measurements'}
          </button>

          {measurements && measurements.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: C.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {measurements.slice(0, 10).map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: '12px', padding: '10px 12px', backgroundColor: C.surface, borderRadius: '8px', fontSize: '12px', color: C.text, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', color: C.muted, minWidth: '80px' }}>{new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {m.chest && <span>Chest: <b>{m.chest}"</b></span>}
                    {m.waist && <span>Waist: <b>{m.waist}"</b></span>}
                    {m.hips && <span>Hips: <b>{m.hips}"</b></span>}
                    {m.arms && <span>Arms: <b>{m.arms}"</b></span>}
                    {m.legs && <span>Legs: <b>{m.legs}"</b></span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
