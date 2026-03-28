import React, { useState, useEffect } from 'react';
import { C, fonts, card, input, btn, btnPrimary, btnSecondary, btnDanger, flexBetween, label } from '../styles.js';
import { workouts } from '../api.js';

const COMMON_EXERCISES = [
  'Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Flyes', 'Dips',
  'Pull-Ups', 'Barbell Row', 'Seated Cable Row', 'Lat Pulldown',
  'Overhead Press', 'Lateral Raises', 'Face Pulls', 'Rear Delt Flyes',
  'Squat', 'Romanian Deadlift', 'Leg Press', 'Lunges', 'Leg Curls', 'Leg Extensions', 'Calf Raises',
  'Deadlift', 'Barbell Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crushers',
  'Plank', 'Russian Twist', 'Cable Crunch', 'Hanging Leg Raise',
  'Treadmill', 'Bike', 'Row Machine', 'Stairmaster',
];

function SetRow({ set, index, onChange, onRemove }) {
  const update = (k) => (e) => onChange({ ...set, [k]: e.target.value });
  return (
    <tr>
      <td style={{ padding: '6px 4px', textAlign: 'center', color: C.muted, fontSize: '12px', width: '30px' }}>{index + 1}</td>
      <td style={{ padding: '6px 4px' }}>
        <input type="number" min="0" value={set.weight} onChange={update('weight')} placeholder="0" style={{ ...input, width: '80px', textAlign: 'center', padding: '6px', fontFamily: fonts.mono }} />
      </td>
      <td style={{ padding: '6px 4px' }}>
        <input type="number" min="0" value={set.reps} onChange={update('reps')} placeholder="0" style={{ ...input, width: '70px', textAlign: 'center', padding: '6px', fontFamily: fonts.mono }} />
      </td>
      <td style={{ padding: '6px 4px', textAlign: 'center' }}>
        <input type="checkbox" checked={!!set.completed} onChange={e => onChange({ ...set, completed: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: C.accent, cursor: 'pointer' }} />
      </td>
      <td style={{ padding: '6px 4px', textAlign: 'center' }}>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}>✕</button>
      </td>
    </tr>
  );
}

function ExerciseBlock({ exercise, index, onChange, onRemove }) {
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1] || {};
    onChange({ ...exercise, sets: [...exercise.sets, { weight: lastSet.weight || '', reps: lastSet.reps || '', completed: false }] });
  };

  const updateSet = (i, newSet) => {
    const sets = [...exercise.sets];
    sets[i] = newSet;
    onChange({ ...exercise, sets });
  };

  const removeSet = (i) => {
    onChange({ ...exercise, sets: exercise.sets.filter((_, idx) => idx !== i) });
  };

  const filteredExercises = search.length > 0
    ? COMMON_EXERCISES.filter(e => e.toLowerCase().includes(search.toLowerCase()))
    : COMMON_EXERCISES.slice(0, 10);

  const completedSets = exercise.sets.filter(s => s.completed).length;
  const totalVolume = exercise.sets.filter(s => s.completed).reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0);

  return (
    <div style={{ ...card, backgroundColor: C.surface, marginBottom: '12px' }}>
      <div style={{ ...flexBetween, marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          {showSearch ? (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search exercise..."
                style={{ ...input, marginBottom: '4px' }}
                autoFocus
              />
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', zIndex: 10, maxHeight: '180px', overflowY: 'auto' }}>
                {filteredExercises.map(ex => (
                  <button key={ex} onClick={() => { onChange({ ...exercise, name: ex }); setShowSearch(false); setSearch(''); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: C.text, cursor: 'pointer', fontSize: '13px', fontFamily: fonts.body }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.surface}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: C.text }}>{exercise.name || 'Unnamed Exercise'}</span>
              <button onClick={() => setShowSearch(true)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '12px', padding: '2px 6px' }}>✏️</button>
              {completedSets > 0 && (
                <span style={{ fontSize: '11px', color: C.muted, fontFamily: fonts.mono }}>
                  {completedSets} sets · {Math.round(totalVolume).toLocaleString()} lbs vol
                </span>
              )}
            </div>
          )}
        </div>
        <button onClick={onRemove} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.danger, cursor: 'pointer', fontSize: '12px', padding: '4px 10px', fontFamily: fonts.body }}>Remove</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            <th style={{ textAlign: 'center', padding: '4px', color: C.muted, fontSize: '11px', width: '30px' }}>#</th>
            <th style={{ textAlign: 'center', padding: '4px', color: C.muted, fontSize: '11px' }}>Weight (lbs)</th>
            <th style={{ textAlign: 'center', padding: '4px', color: C.muted, fontSize: '11px' }}>Reps</th>
            <th style={{ textAlign: 'center', padding: '4px', color: C.muted, fontSize: '11px' }}>Done</th>
            <th style={{ width: '40px' }} />
          </tr>
        </thead>
        <tbody>
          {exercise.sets.map((set, i) => (
            <SetRow key={i} set={set} index={i} onChange={(s) => updateSet(i, s)} onRemove={() => removeSet(i)} />
          ))}
        </tbody>
      </table>

      <button onClick={addSet} style={{ ...btn, marginTop: '8px', fontSize: '12px', color: C.accent, backgroundColor: `${C.accent}10`, border: `1px dashed ${C.accent}40` }}>
        + Add Set
      </button>
    </div>
  );
}

export default function WorkoutLogger({ activePlan, todayData }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [logId, setLogId] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const plannedDay = selectedDate === today ? todayData?.plannedDay : null;

  useEffect(() => {
    loadDateLog(selectedDate);
    loadHistory();
  }, [selectedDate]);

  const loadDateLog = async (date) => {
    try {
      const logs = await workouts.getLogs({ date });
      if (logs.length > 0) {
        const log = logs[0];
        setExercises(log.exercises || []);
        setNotes(log.notes || '');
        setDuration(log.duration_minutes ? String(log.duration_minutes) : '');
        setLogId(log.id);
        setCompleted(log.completed);
      } else {
        // Pre-fill from plan if today
        if (date === today && plannedDay?.exercises?.length > 0) {
          setExercises(plannedDay.exercises.map(ex => ({
            name: ex.name,
            sets: Array.from({ length: ex.sets }, () => ({ weight: '', reps: ex.reps || '', completed: false })),
          })));
        } else {
          setExercises([]);
        }
        setNotes('');
        setDuration('');
        setLogId(null);
        setCompleted(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const end = today;
      const logs = await workouts.getLogs({ start, end });
      setHistory(logs.filter(l => l.date !== selectedDate).slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const addExercise = (name = '') => {
    setExercises(prev => [...prev, { name, sets: [{ weight: '', reps: '', completed: false }] }]);
    setShowExerciseSearch(false);
    setExerciseSearch('');
  };

  const updateExercise = (i, ex) => {
    setExercises(prev => { const a = [...prev]; a[i] = ex; return a; });
  };

  const removeExercise = (i) => {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async (markComplete = false) => {
    setSaving(true);
    setSaveMsg('');
    try {
      const body = {
        date: selectedDate,
        plan_id: activePlan?.id || null,
        day_name: plannedDay?.name || exercises.length > 0 ? (plannedDay?.name || 'Custom Workout') : '',
        exercises,
        notes,
        duration_minutes: duration ? parseInt(duration) : 0,
        completed: markComplete || completed,
      };
      let result;
      if (logId) {
        result = await workouts.updateLog(logId, body);
      } else {
        result = await workouts.createLog(body);
        setLogId(result.id);
      }
      setCompleted(result.completed);
      setSaveMsg(markComplete ? '✓ Workout marked as complete!' : '✓ Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = exerciseSearch
    ? COMMON_EXERCISES.filter(e => e.toLowerCase().includes(exerciseSearch.toLowerCase()))
    : COMMON_EXERCISES;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ ...flexBetween, marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>Log Workout</h1>
          <p style={{ color: C.muted, fontSize: '14px' }}>Track your sets, reps, and weights</p>
        </div>
        {completed && (
          <div style={{ padding: '8px 16px', backgroundColor: `${C.accent}20`, border: `1px solid ${C.accent}40`, borderRadius: '8px', color: C.accent, fontSize: '13px', fontWeight: '600' }}>
            ✓ Completed
          </div>
        )}
      </div>

      <div className="logger-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Main logger */}
        <div>
          {/* Date + meta */}
          <div style={{ ...card, marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ ...label }}>Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ ...input }} />
              </div>
              <div>
                <label style={{ ...label }}>Duration (minutes)</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 60" style={{ ...input }} />
              </div>
            </div>
            {plannedDay && (
              <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: `${C.accent2}15`, border: `1px solid ${C.accent2}40`, borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: C.accent2, fontWeight: '600' }}>Planned: {plannedDay.name}</span>
              </div>
            )}
          </div>

          {/* Exercises */}
          {exercises.map((ex, i) => (
            <ExerciseBlock key={i} exercise={ex} index={i} onChange={(e) => updateExercise(i, e)} onRemove={() => removeExercise(i)} />
          ))}

          {/* Add exercise */}
          <div style={{ ...card, backgroundColor: C.surface, marginBottom: '16px' }}>
            {showExerciseSearch ? (
              <div>
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={e => setExerciseSearch(e.target.value)}
                  placeholder="Search or type exercise name..."
                  style={{ ...input, marginBottom: '8px' }}
                  autoFocus
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {filteredExercises.slice(0, 20).map(ex => (
                    <button key={ex} onClick={() => addExercise(ex)} style={{ ...btn, fontSize: '12px', backgroundColor: C.card, color: C.text, border: `1px solid ${C.border}` }}>
                      {ex}
                    </button>
                  ))}
                  {exerciseSearch && !COMMON_EXERCISES.includes(exerciseSearch) && (
                    <button onClick={() => addExercise(exerciseSearch)} style={{ ...btn, fontSize: '12px', backgroundColor: `${C.accent}20`, color: C.accent, border: `1px solid ${C.accent}40` }}>
                      + Add "{exerciseSearch}"
                    </button>
                  )}
                </div>
                <button onClick={() => { setShowExerciseSearch(false); setExerciseSearch(''); }} style={{ ...btn, marginTop: '8px', fontSize: '12px', color: C.muted }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowExerciseSearch(true)} style={{ ...btn, width: '100%', border: `2px dashed ${C.border}`, borderRadius: '8px', color: C.muted, backgroundColor: 'transparent', padding: '14px' }}>
                + Add Exercise
              </button>
            )}
          </div>

          {/* Notes */}
          <div style={{ ...card, marginBottom: '16px' }}>
            <label style={{ ...label }}>Workout Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did it go? PRs, how you felt, things to improve..."
              rows={3}
              style={{ ...input, resize: 'vertical' }}
            />
          </div>

          {/* Save buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => handleSave(false)} disabled={saving} style={{ ...btnSecondary, padding: '10px 24px', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : '💾 Save'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || completed}
              style={{ ...btnPrimary, padding: '10px 24px', opacity: (saving || completed) ? 0.7 : 1 }}
            >
              {completed ? '✓ Completed' : '✅ Complete Workout'}
            </button>
            {saveMsg && <span style={{ fontSize: '13px', color: saveMsg.startsWith('Error') ? C.danger : C.accent }}>{saveMsg}</span>}
          </div>
        </div>

        {/* History sidebar */}
        <div>
          <div style={{ ...card }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: C.text, marginBottom: '14px' }}>Recent Workouts</h2>
            {loadingHistory ? (
              <p style={{ color: C.muted, fontSize: '13px' }}>Loading...</p>
            ) : history.length === 0 ? (
              <p style={{ color: C.muted, fontSize: '13px' }}>No recent workouts</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map(log => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedDate(log.date)}
                    style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: '8px',
                      backgroundColor: selectedDate === log.date ? `${C.accent}10` : C.surface,
                      border: `1px solid ${selectedDate === log.date ? C.accent : C.border}`,
                      cursor: 'pointer', fontFamily: fonts.body,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>
                        {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {log.completed && <span style={{ fontSize: '10px', color: C.accent }}>✓</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: C.muted }}>
                      {log.day_name || `${log.exercises?.length || 0} exercises`}
                    </div>
                    {log.duration_minutes > 0 && (
                      <div style={{ fontSize: '11px', color: C.muted }}>{log.duration_minutes} min</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
