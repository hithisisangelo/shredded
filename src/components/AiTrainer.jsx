import React, { useState, useRef, useEffect } from 'react';
import { C, fonts, card, input, btn, btnPrimary, btnSecondary, flexBetween, label } from '../styles.js';
import { ai, workouts } from '../api.js';

const GOAL_OPTIONS = [
  { value: 'muscle', label: 'Muscle Gain' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general', label: 'General Fitness' },
];

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner (< 1 year)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'advanced', label: 'Advanced (3+ years)' },
];

const CARDIO_OPTIONS = [
  { value: 'moderate', label: 'Moderate (Zone 2)' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'steady_state', label: 'Steady State' },
  { value: 'intervals', label: 'Intervals' },
];

function ProgramDisplay({ program, onSave, saving }) {
  const [activeWeek, setActiveWeek] = useState(0);
  if (!program?.weeks) return null;

  const week = program.weeks[activeWeek];

  return (
    <div>
      {/* Week tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {program.weeks.map((w, i) => (
          <button
            key={i}
            onClick={() => setActiveWeek(i)}
            style={{
              ...btn,
              backgroundColor: activeWeek === i ? C.accent2 : C.surface,
              color: activeWeek === i ? '#fff' : C.muted,
              border: `1px solid ${activeWeek === i ? C.accent2 : C.border}`,
            }}
          >
            Week {w.week}
            {w.theme && <span style={{ fontSize: '11px', marginLeft: '4px', opacity: 0.8 }}>· {w.theme}</span>}
          </button>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {week?.days?.map((day, i) => (
          <div key={i} style={{ ...card, padding: '16px', backgroundColor: C.surface }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: day.exercises?.length > 0 ? '12px' : '0' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: day.type === 'rest' ? `${C.warning}20` : `${C.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                {day.type === 'rest' ? '😴' : '🏋️'}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: day.type === 'rest' ? C.warning : C.text }}>{day.day}</div>
                <div style={{ fontSize: '12px', color: C.muted }}>{day.name}</div>
              </div>
            </div>
            {day.exercises && day.exercises.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px 6px 0', color: C.muted, fontWeight: '600' }}>Exercise</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px 6px', color: C.muted, fontWeight: '600', width: '50px' }}>Sets</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px 6px', color: C.muted, fontWeight: '600', width: '70px' }}>Reps</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px 6px', color: C.muted, fontWeight: '600', width: '60px' }}>Rest</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((ex, j) => (
                    <tr key={j} style={{ borderBottom: j < day.exercises.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <td style={{ padding: '6px 8px 6px 0', color: C.text }}>
                        {ex.name}
                        {ex.notes && <div style={{ fontSize: '11px', color: C.muted, marginTop: '1px' }}>{ex.notes}</div>}
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: C.accent, fontWeight: '600', fontFamily: fonts.mono }}>{ex.sets}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: C.text, fontFamily: fonts.mono }}>{ex.reps}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px', color: C.muted, fontFamily: fonts.mono }}>{ex.rest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        style={{ ...btnPrimary, marginTop: '20px', padding: '12px 28px', fontSize: '14px', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Saving...' : '💾 Save Program & Set as Active'}
      </button>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      {!isUser && (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, marginRight: '8px' }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        backgroundColor: isUser ? C.accent2 : C.surface,
        color: C.text, fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
        border: `1px solid ${isUser ? C.accent2 : C.border}`,
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function AiTrainer({ userSettings, setActivePlan }) {
  const [activeTab, setActiveTab] = useState('generate');

  // Generate form
  const [form, setForm] = useState({
    goal: 'muscle',
    days_per_week: 4,
    level: 'intermediate',
    include_cardio: false,
    cardio_type: 'moderate',
    equipment: 'Full gym (barbells, dumbbells, machines)',
  });
  const [generating, setGenerating] = useState(false);
  const [program, setProgram] = useState(null);
  const [genError, setGenError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Import
  const [importJson, setImportJson] = useState('');
  const [importProgram, setImportProgram] = useState(null);
  const [importError, setImportError] = useState('');
  const [importName, setImportName] = useState('My Custom Program');
  const [importSaving, setImportSaving] = useState(false);
  const [importSavedMsg, setImportSavedMsg] = useState('');

  // Chat
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm your AI personal trainer. Ask me about workouts, nutrition, recovery, exercise form — anything fitness related. Let's get you SHREDDED! 💪" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenError('');
    setProgram(null);
    try {
      const res = await ai.generateProgram(form);
      setProgram(res.program);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveProgram = async () => {
    if (!program) return;
    setSaving(true);
    try {
      const goalLabel = GOAL_OPTIONS.find(g => g.value === form.goal)?.label || form.goal;
      const levelLabel = LEVEL_OPTIONS.find(l => l.value === form.level)?.label || form.level;
      const result = await workouts.createPlan({
        name: `${goalLabel} — ${form.days_per_week} Days/Week`,
        goal: form.goal,
        level: form.level,
        days_per_week: form.days_per_week,
        weeks: 4,
        program_data: program,
      });
      await workouts.activatePlan(result.id);
      setActivePlan({ ...result, active: true });
      setSavedMsg('✓ Program saved and set as active!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const apiMessages = newMessages.filter(m => m.role !== 'assistant' || newMessages.indexOf(m) > 0).slice(-20);
      const res = await ai.chat({ messages: apiMessages });
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleParseImport = () => {
    setImportError('');
    setImportProgram(null);
    try {
      const parsed = JSON.parse(importJson.trim());
      if (!parsed.weeks || !Array.isArray(parsed.weeks)) throw new Error('JSON must have a "weeks" array at the top level.');
      setImportProgram(parsed);
    } catch (err) {
      setImportError('Invalid JSON: ' + err.message);
    }
  };

  const handleSaveImport = async () => {
    if (!importProgram) return;
    setImportSaving(true);
    try {
      const result = await workouts.createPlan({
        name: importName,
        goal: 'custom',
        level: 'intermediate',
        days_per_week: importProgram.weeks[0]?.days?.filter(d => d.type !== 'rest').length || 4,
        weeks: importProgram.weeks.length,
        program_data: importProgram,
      });
      await workouts.activatePlan(result.id);
      setActivePlan({ ...result, active: true });
      setImportSavedMsg('✓ Program saved and set as active!');
      setTimeout(() => setImportSavedMsg(''), 3000);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>AI Trainer</h1>
        <p style={{ color: C.muted, fontSize: '14px' }}>Generate programs and get personalized coaching</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: C.surface, padding: '4px', borderRadius: '10px', marginBottom: '24px', border: `1px solid ${C.border}` }}>
        {[{ id: 'generate', label: '📋 Generate Program' }, { id: 'import', label: '📥 Import JSON' }, { id: 'chat', label: '💬 Ask Trainer' }].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: '10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: '13px', fontWeight: '600', transition: 'all 0.15s', backgroundColor: activeTab === t.id ? C.accent2 : 'transparent', color: activeTab === t.id ? '#fff' : C.muted }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && (
        <div>
          {!program ? (
            <div style={{ ...card }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text, marginBottom: '20px' }}>Generate My 4-Week Program</h2>
              <form onSubmit={handleGenerate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ ...label }}>Primary Goal</label>
                    <select value={form.goal} onChange={setF('goal')} style={{ ...input }}>
                      {GOAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...label }}>Training Days / Week</label>
                    <select value={form.days_per_week} onChange={e => setForm(f => ({ ...f, days_per_week: parseInt(e.target.value) }))} style={{ ...input }}>
                      {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} days</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...label }}>Fitness Level</label>
                    <select value={form.level} onChange={setF('level')} style={{ ...input }}>
                      {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...label }}>Equipment Available</label>
                    <input type="text" value={form.equipment} onChange={setF('equipment')} style={{ ...input }} placeholder="e.g. Full gym, home dumbbells..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <input type="checkbox" id="cardio" checked={form.include_cardio} onChange={e => setForm(f => ({ ...f, include_cardio: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: C.accent, cursor: 'pointer' }} />
                      <label htmlFor="cardio" style={{ fontSize: '14px', color: C.text, cursor: 'pointer' }}>Include Cardio Sessions</label>
                    </div>
                    {form.include_cardio && (
                      <div>
                        <label style={{ ...label }}>Cardio Type</label>
                        <select value={form.cardio_type} onChange={setF('cardio_type')} style={{ ...input, maxWidth: '280px' }}>
                          {CARDIO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                {genError && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: `${C.danger}15`, border: `1px solid ${C.danger}40`, borderRadius: '8px', color: C.danger, fontSize: '13px' }}>
                    {genError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={generating}
                  style={{ ...btnPrimary, marginTop: '20px', padding: '12px 32px', fontSize: '14px', width: '100%', opacity: generating ? 0.7 : 1 }}
                >
                  {generating ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Generating Program...
                    </span>
                  ) : '✨ Generate My Program'}
                </button>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ ...flexBetween, marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: C.text }}>Your 4-Week Program</h2>
                  <p style={{ fontSize: '13px', color: C.muted }}>
                    {GOAL_OPTIONS.find(g => g.value === form.goal)?.label} · {form.days_per_week} days/week · {LEVEL_OPTIONS.find(l => l.value === form.level)?.label}
                  </p>
                </div>
                <button
                  onClick={() => { setProgram(null); setGenError(''); setSavedMsg(''); }}
                  style={{ ...btnSecondary, fontSize: '12px' }}
                >
                  ← Generate New
                </button>
              </div>
              {savedMsg && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: `${C.accent}15`, border: `1px solid ${C.accent}40`, borderRadius: '8px', color: C.accent, fontSize: '13px', fontWeight: '600' }}>
                  {savedMsg}
                </div>
              )}
              {genError && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: `${C.danger}15`, border: `1px solid ${C.danger}40`, borderRadius: '8px', color: C.danger, fontSize: '13px' }}>
                  {genError}
                </div>
              )}
              <ProgramDisplay program={program} onSave={handleSaveProgram} saving={saving} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'import' && (
        <div style={{ ...card }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text, marginBottom: '6px' }}>Import Program JSON</h2>
          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '20px' }}>Paste your workout JSON below, preview it, then save it as your active plan.</p>

          {!importProgram ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ ...label }}>Program Name</label>
                <input
                  type="text"
                  value={importName}
                  onChange={e => setImportName(e.target.value)}
                  style={{ ...input }}
                  placeholder="e.g. 4-Day Push Pull Legs"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ ...label }}>Paste JSON</label>
                <textarea
                  value={importJson}
                  onChange={e => setImportJson(e.target.value)}
                  placeholder={'{\n  "weeks": [...]\n}'}
                  rows={14}
                  style={{ ...input, fontFamily: fonts.mono, fontSize: '12px', resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>
              {importError && (
                <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: `${C.danger}15`, border: `1px solid ${C.danger}40`, borderRadius: '8px', color: C.danger, fontSize: '13px' }}>
                  {importError}
                </div>
              )}
              <button onClick={handleParseImport} style={{ ...btnPrimary, padding: '12px 28px', fontSize: '14px' }}>
                Preview Program →
              </button>
            </>
          ) : (
            <div>
              <div style={{ ...flexBetween, marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>{importName}</h3>
                  <p style={{ fontSize: '13px', color: C.muted }}>{importProgram.weeks.length} weeks · Preview looks good?</p>
                </div>
                <button onClick={() => { setImportProgram(null); setImportError(''); }} style={{ ...btnSecondary, fontSize: '12px' }}>
                  ← Edit JSON
                </button>
              </div>
              {importSavedMsg && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: `${C.accent}15`, border: `1px solid ${C.accent}40`, borderRadius: '8px', color: C.accent, fontSize: '13px', fontWeight: '600' }}>
                  {importSavedMsg}
                </div>
              )}
              {importError && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: `${C.danger}15`, border: `1px solid ${C.danger}40`, borderRadius: '8px', color: C.danger, fontSize: '13px' }}>
                  {importError}
                </div>
              )}
              <ProgramDisplay program={importProgram} onSave={handleSaveImport} saving={importSaving} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {chatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.muted, fontSize: '13px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🤖</div>
                <span>Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChat} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about workouts, nutrition, recovery..."
              style={{ ...input, flex: 1 }}
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()} style={{ ...btnPrimary, padding: '10px 20px', opacity: (!chatInput.trim() || chatLoading) ? 0.5 : 1 }}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
