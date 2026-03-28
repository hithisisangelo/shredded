import React, { useState, useEffect } from 'react';
import { C, fonts, card, flexBetween, btn } from '../styles.js';
import { workouts } from '../api.js';
import Modal from './shared/Modal.jsx';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDayStatus(dateStr, logs, activePlan) {
  const log = logs.find(l => l.date === dateStr);
  const today = new Date().toISOString().split('T')[0];

  if (log?.completed) return 'completed';
  if (log) return 'logged';

  if (activePlan) {
    const d = new Date(dateStr + 'T12:00:00');
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    const week1 = activePlan.program_data?.weeks?.[0];
    if (week1?.days) {
      const planned = week1.days.find(dd => dd.day === dayName);
      if (planned) {
        if (planned.type === 'rest') return 'rest';
        if (dateStr < today) return 'missed';
        return 'planned';
      }
    }
  }

  return 'empty';
}

const STATUS_COLORS = {
  completed: C.accent,
  logged: C.info,
  planned: '#3b82f6',
  rest: C.warning,
  missed: C.danger,
  empty: C.border,
};

const STATUS_LABELS = {
  completed: '✓ Completed',
  logged: 'In Progress',
  planned: 'Planned',
  rest: 'Rest Day',
  missed: 'Missed',
  empty: 'No Plan',
};

export default function WorkoutCalendar({ activePlan, setActiveView }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [logs, setLogs] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = now.toISOString().split('T')[0];

  useEffect(() => {
    setLoading(true);
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0);
    const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    workouts.getLogs({ start: firstDay, end: lastDayStr })
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedLog = selectedDay ? logs.find(l => l.date === getDateStr(selectedDay)) : null;
  const selectedDateStr = selectedDay ? getDateStr(selectedDay) : null;
  const selectedPlannedDay = selectedDateStr && activePlan ? (() => {
    const d = new Date(selectedDateStr + 'T12:00:00');
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    return activePlan.program_data?.weeks?.[0]?.days?.find(dd => dd.day === dayName) || null;
  })() : null;

  const statusCounts = { completed: 0, missed: 0, planned: 0, rest: 0 };
  for (let d = 1; d <= daysInMonth; d++) {
    const s = getDayStatus(getDateStr(d), logs, activePlan);
    if (statusCounts[s] !== undefined) statusCounts[s]++;
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>Workout Calendar</h1>
        <p style={{ color: C.muted, fontSize: '14px' }}>Track your training schedule and progress</p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} style={{ ...card, padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: STATUS_COLORS[status], flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: C.text }}>{count}</div>
              <div style={{ fontSize: '11px', color: C.muted }}>{STATUS_LABELS[status]}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card }}>
        {/* Calendar header */}
        <div style={{ ...flexBetween, marginBottom: '20px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text, cursor: 'pointer', padding: '6px 12px', fontSize: '16px' }}>←</button>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: C.text }}>{MONTH_NAMES[month]} {year}</h2>
          <button onClick={nextMonth} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text, cursor: 'pointer', padding: '6px 12px', fontSize: '16px' }}>→</button>
        </div>

        {/* Day names header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: C.muted, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dateStr = getDateStr(day);
              const status = getDayStatus(dateStr, logs, activePlan);
              const isToday = dateStr === today;
              const statusColor = STATUS_COLORS[status];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    aspectRatio: '1', borderRadius: '8px', border: isToday ? `2px solid ${C.accent}` : '1px solid transparent',
                    backgroundColor: status === 'empty' ? C.surface : `${statusColor}20`,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                    transition: 'all 0.15s', padding: '4px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = statusColor}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isToday ? C.accent : 'transparent'}
                >
                  <span style={{ fontSize: '13px', fontWeight: isToday ? '700' : '400', color: isToday ? C.accent : C.text }}>{day}</span>
                  {status !== 'empty' && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
          {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'empty').map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color }} />
              <span style={{ fontSize: '11px', color: C.muted }}>{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <Modal onClose={() => setSelectedDay(null)} title={selectedDateStr ? new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}>
          {selectedLog ? (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: `${STATUS_COLORS[selectedLog.completed ? 'completed' : 'logged']}20`, color: STATUS_COLORS[selectedLog.completed ? 'completed' : 'logged'] }}>
                  {selectedLog.completed ? '✓ Completed' : 'In Progress'}
                </span>
                {selectedLog.duration_minutes > 0 && (
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', backgroundColor: `${C.border}`, color: C.muted }}>{selectedLog.duration_minutes} min</span>
                )}
              </div>
              {selectedLog.day_name && <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, marginBottom: '12px' }}>{selectedLog.day_name}</p>}
              {selectedLog.exercises && selectedLog.exercises.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedLog.exercises.map((ex, i) => (
                    <div key={i} style={{ padding: '10px 12px', backgroundColor: C.surface, borderRadius: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: C.text, marginBottom: '4px' }}>{ex.name}</div>
                      {ex.sets && ex.sets.filter(s => s.completed).length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {ex.sets.filter(s => s.completed).map((s, j) => (
                            <span key={j} style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: `${C.accent}20`, color: C.accent, borderRadius: '4px' }}>
                              {s.reps} × {s.weight}lbs
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: C.muted, fontSize: '13px' }}>No exercises logged</p>}
            </div>
          ) : selectedPlannedDay ? (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: `${STATUS_COLORS.planned}20`, color: STATUS_COLORS.planned }}>Planned</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, marginBottom: '12px' }}>{selectedPlannedDay.name}</p>
              {selectedPlannedDay.exercises && selectedPlannedDay.exercises.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedPlannedDay.exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: C.surface, borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: C.text }}>{ex.name}</span>
                      <span style={{ fontSize: '12px', color: C.muted, fontFamily: fonts.mono }}>{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: C.muted, fontSize: '13px' }}>Rest day</p>}
            </div>
          ) : (
            <p style={{ color: C.muted, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No workout planned or logged for this day.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
