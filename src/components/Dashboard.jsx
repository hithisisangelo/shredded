import React, { useState, useEffect } from 'react';
import { C, fonts, card, flex, flexBetween } from '../styles.js';
import { workouts, nutrition } from '../api.js';
import StatCard from './shared/StatCard.jsx';

function CalorieRing({ consumed, goal }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((consumed / Math.max(goal, 1)), 1);
  const dash = pct * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke={C.border} strokeWidth="10" />
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke={pct >= 1 ? C.danger : C.accent}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: '700', color: C.text }}>{Math.round(consumed)}</span>
          <span style={{ fontSize: '11px', color: C.muted }}>/ {Math.round(goal)}</span>
          <span style={{ fontSize: '10px', color: C.muted }}>kcal</span>
        </div>
      </div>
      <div style={{ fontSize: '12px', color: C.muted }}>
        {Math.round(goal - consumed) > 0 ? `${Math.round(goal - consumed)} kcal remaining` : 'Goal reached! 🎉'}
      </div>
    </div>
  );
}

function MacroBar({ label, value, goal, color }) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ ...flexBetween, marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: C.muted }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{Math.round(value)}g <span style={{ color: C.muted, fontWeight: '400' }}>/ {goal}g</span></span>
      </div>
      <div style={{ height: '6px', backgroundColor: C.border, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function WeekRow({ logs }) {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  const logMap = {};
  if (logs) logs.forEach(l => { logMap[l.date] = l; });

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {days.map((d, idx) => {
        const dateStr = d.toISOString().split('T')[0];
        const log = logMap[dateStr];
        const isToday = idx === 6;
        const label = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
        let bg = C.border;
        if (log?.completed) bg = C.accent;
        else if (log) bg = C.info;
        if (isToday && !log) bg = `${C.accent}40`;

        return (
          <div key={dateStr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: isToday ? C.accent : C.muted }}>{label}</span>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px', backgroundColor: bg,
              border: isToday ? `2px solid ${C.accent}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
            }}>
              {log?.completed ? '✓' : ''}
            </div>
            <span style={{ fontSize: '10px', color: C.muted }}>{d.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ userSettings, todayData, nutritionSummary, setActiveView }) {
  const [weekLogs, setWeekLogs] = useState([]);
  const [streak, setStreak] = useState(0);

  const calorieGoal = parseInt(userSettings?.calorie_goal) || 2000;
  const proteinGoal = parseInt(userSettings?.protein_goal) || 150;
  const carbsGoal = parseInt(userSettings?.carbs_goal) || 200;
  const fatGoal = parseInt(userSettings?.fat_goal) || 65;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  useEffect(() => {
    const start = weekStart.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];
    workouts.getLogs({ start, end }).then(setWeekLogs).catch(() => {});

    // Calculate streak
    workouts.getLogs({ start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], end: today.toISOString().split('T')[0] })
      .then(logs => {
        const completed = logs.filter(l => l.completed).map(l => l.date).sort().reverse();
        let s = 0;
        let check = new Date(today);
        check.setDate(check.getDate() - 1);
        for (const d of completed) {
          const checkStr = check.toISOString().split('T')[0];
          if (d === checkStr) { s++; check.setDate(check.getDate() - 1); }
          else break;
        }
        if (completed[0] === today.toISOString().split('T')[0]) s++;
        setStreak(s);
      }).catch(() => {});
  }, []);

  const plannedDay = todayData?.plannedDay;
  const todayLog = todayData?.log;
  const plan = todayData?.plan;
  const summary = nutritionSummary || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const weekCompleted = weekLogs.filter(l => l.completed).length;

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: C.muted, fontSize: '14px' }}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Workout Streak" value={`${streak} days`} icon="🔥" color={C.warning} />
        <StatCard label="This Week" value={`${weekCompleted} workouts`} icon="💪" color={C.accent} />
        <StatCard label="Calories Today" value={`${Math.round(summary.calories)}`} icon="🔥" color={C.accent2} sub={`/ ${calorieGoal} goal`} />
        <StatCard label="Protein Today" value={`${Math.round(summary.protein)}g`} icon="🥩" color={C.info} sub={`/ ${proteinGoal}g goal`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Today's Workout */}
        <div style={{ ...card }}>
          <div style={{ ...flexBetween, marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: C.text }}>Today's Workout</h2>
            {todayLog?.completed && (
              <span style={{ fontSize: '11px', backgroundColor: `${C.accent}20`, color: C.accent, padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>
                ✓ Completed
              </span>
            )}
          </div>

          {plannedDay ? (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>{plannedDay.name}</div>
                <div style={{ fontSize: '12px', color: C.muted }}>{plan?.name}</div>
              </div>
              {plannedDay.exercises && plannedDay.exercises.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {plannedDay.exercises.slice(0, 5).map((ex, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: i < Math.min(4, plannedDay.exercises.length - 1) ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: `${C.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: C.accent, flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontSize: '13px', color: C.text, flex: 1 }}>{ex.name}</span>
                      <span style={{ fontSize: '11px', color: C.muted, fontFamily: fonts.mono }}>{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                  {plannedDay.exercises.length > 5 && (
                    <div style={{ fontSize: '12px', color: C.muted, paddingTop: '4px' }}>+{plannedDay.exercises.length - 5} more exercises</div>
                  )}
                </div>
              ) : (
                <p style={{ color: C.muted, fontSize: '13px' }}>Rest day — recovery is part of the plan 💤</p>
              )}
              <button
                onClick={() => setActiveView('log')}
                style={{ marginTop: '14px', width: '100%', padding: '10px', backgroundColor: todayLog?.completed ? `${C.accent}20` : C.accent, color: todayLog?.completed ? C.accent : '#000', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: fonts.body }}
              >
                {todayLog?.completed ? '✓ View Workout' : '→ Log Workout'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏋️</div>
              <p style={{ color: C.muted, fontSize: '13px', marginBottom: '12px' }}>No active program. Let the AI generate one for you!</p>
              <button
                onClick={() => setActiveView('ai')}
                style={{ padding: '8px 20px', backgroundColor: C.accent2, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: fonts.body }}
              >
                Generate Program
              </button>
            </div>
          )}
        </div>

        {/* Nutrition */}
        <div style={{ ...card }}>
          <div style={{ ...flexBetween, marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: C.text }}>Nutrition Today</h2>
            <button onClick={() => setActiveView('nutrition')} style={{ background: 'none', border: 'none', color: C.accent, fontSize: '12px', cursor: 'pointer', fontFamily: fonts.body }}>Add Food →</button>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <CalorieRing consumed={summary.calories} goal={calorieGoal} />
            <div style={{ flex: 1 }}>
              <MacroBar label="Protein" value={summary.protein} goal={proteinGoal} color={C.accent} />
              <MacroBar label="Carbs" value={summary.carbs} goal={carbsGoal} color={C.info} />
              <MacroBar label="Fat" value={summary.fat} goal={fatGoal} color={C.accent2} />
            </div>
          </div>
        </div>
      </div>

      {/* This Week */}
      <div style={{ ...card, marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: C.text, marginBottom: '16px' }}>This Week</h2>
        <WeekRow logs={weekLogs} />
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
          {[{ color: C.accent, label: 'Completed' }, { color: C.info, label: 'Logged' }, { color: `${C.accent}40`, label: 'Today' }, { color: C.border, label: 'Rest' }].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color }} />
              <span style={{ fontSize: '11px', color: C.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
