import React, { useState, useEffect } from 'react';
import { C, fonts, card, input, btn, btnPrimary, flexBetween, label } from '../styles.js';
import { settings, workouts, nutrition, progress } from '../api.js';

const GOAL_TYPES = [
  { value: 'muscle', label: 'Build Muscle' },
  { value: 'fat_loss', label: 'Lose Fat' },
  { value: 'strength', label: 'Gain Strength' },
  { value: 'endurance', label: 'Improve Endurance' },
  { value: 'general', label: 'General Fitness' },
];

const ACTIVITY_LEVELS = [
  { value: 1.2,   label: 'Sedentary (desk job, no exercise)' },
  { value: 1.375, label: 'Lightly Active (1-3 days/week)' },
  { value: 1.55,  label: 'Moderately Active (3-5 days/week)' },
  { value: 1.725, label: 'Very Active (6-7 days/week)' },
  { value: 1.9,   label: 'Extremely Active (2x/day training)' },
];

const CUT_PRESETS = [
  { label: 'Cut 2 lbs/week',   deficit: -1000, emoji: '🔥🔥' },
  { label: 'Cut 1 lb/week',    deficit: -500,  emoji: '🔥' },
  { label: 'Cut 0.5 lb/week',  deficit: -250,  emoji: '✂️' },
  { label: 'Maintain',         deficit: 0,     emoji: '⚖️' },
  { label: 'Lean Bulk +0.5lb', deficit: 250,   emoji: '💪' },
  { label: 'Bulk +1 lb/week',  deficit: 500,   emoji: '🏋️' },
];

function calcTDEE(weightLbs, heightInches, age, sex, activityMultiplier) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightInches * 2.54;
  const bmr = sex === 'female'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr * activityMultiplier);
}

function calcMacros(calories, weightLbs) {
  const protein = Math.round(weightLbs);           // 1g per lb
  const fat     = Math.round((calories * 0.27) / 9); // 27% from fat
  const carbs   = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { protein, fat, carbs: Math.max(carbs, 50) };
}

export default function Settings({ userSettings, updateSettings, user }) {
  const [form, setForm] = useState({
    display_name: '',
    age: '',
    weight_lbs: '',
    height_inches: '',
    sex: '',
    goal_type: 'muscle',
    target_weight: '',
    calorie_goal: '2000',
    protein_goal: '150',
    carbs_goal: '200',
    fat_goal: '65',
    water_goal: '8',
    anthropic_api_key: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [activityLevel, setActivityLevel] = useState(1.55);

  const tdee = form.weight_lbs && form.height_inches && form.age && form.sex
    ? calcTDEE(parseFloat(form.weight_lbs), parseFloat(form.height_inches), parseInt(form.age), form.sex, activityLevel)
    : null;

  const applyPreset = (deficit) => {
    if (!tdee) return;
    const calories = Math.max(tdee + deficit, 1200);
    const { protein, fat, carbs } = calcMacros(calories, parseFloat(form.weight_lbs));
    setForm(f => ({ ...f, calorie_goal: String(calories), protein_goal: String(protein), carbs_goal: String(carbs), fat_goal: String(fat) }));
    setShowCalc(false);
    setMsg('✓ Targets updated — hit Save to keep them!');
    setTimeout(() => setMsg(''), 3000);
  };

  useEffect(() => {
    if (userSettings) {
      setForm(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(userSettings).filter(([_, v]) => v !== null && v !== undefined)),
      }));
    }
  }, [userSettings]);

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const saved = await settings.save(form);
      updateSettings(saved);
      setMsg('✓ Settings saved!');
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const [workoutLogs, nutritionHistory, bodyweightData] = await Promise.all([
        workouts.getLogs({ start: thirtyDaysAgo, end: today }),
        nutrition.getHistory(30),
        progress.getBodyweight(90),
      ]);
      const { anthropic_api_key, ...safeSettings } = form;
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { username: user?.username, email: user?.email },
        settings: safeSettings,
        workoutLogs,
        nutritionHistory,
        bodyweightData,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shredded-export-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMsg('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const SectionHeader = ({ title, subtitle }) => (
    <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text, marginBottom: '2px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '13px', color: C.muted }}>{subtitle}</p>}
    </div>
  );

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: C.muted, fontSize: '14px' }}>Configure your profile and fitness goals</p>
      </div>

      {msg && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: msg.startsWith('Error') ? `${C.danger}15` : `${C.accent}15`, border: `1px solid ${msg.startsWith('Error') ? C.danger : C.accent}40`, borderRadius: '8px', fontSize: '13px', color: msg.startsWith('Error') ? C.danger : C.accent }}>
          {msg}
        </div>
      )}

      {/* Personal Info */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <SectionHeader title="Personal Info" subtitle="Basic profile information" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ ...label }}>Display Name</label>
            <input type="text" value={form.display_name} onChange={setF('display_name')} placeholder={user?.username} style={{ ...input }} />
          </div>
          <div>
            <label style={{ ...label }}>Age</label>
            <input type="number" min="13" max="120" value={form.age} onChange={setF('age')} placeholder="e.g. 25" style={{ ...input }} />
          </div>
          <div>
            <label style={{ ...label }}>Sex</label>
            <select value={form.sex} onChange={setF('sex')} style={{ ...input }}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Prefer not to say</option>
            </select>
          </div>
          <div>
            <label style={{ ...label }}>Weight (lbs)</label>
            <input type="number" step="0.5" value={form.weight_lbs} onChange={setF('weight_lbs')} placeholder="e.g. 185" style={{ ...input }} />
          </div>
          <div>
            <label style={{ ...label }}>Height (inches)</label>
            <input type="number" step="0.5" value={form.height_inches} onChange={setF('height_inches')} placeholder="e.g. 71 (= 5'11&quot;)" style={{ ...input }} />
          </div>
        </div>
      </div>

      {/* Goals */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <SectionHeader title="Goals" subtitle="Set your fitness objectives" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ ...label }}>Primary Goal</label>
            <select value={form.goal_type} onChange={setF('goal_type')} style={{ ...input }}>
              {GOAL_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...label }}>Target Weight (lbs)</label>
            <input type="number" step="0.5" value={form.target_weight} onChange={setF('target_weight')} placeholder="e.g. 175" style={{ ...input }} />
          </div>
        </div>
      </div>

      {/* Nutrition targets */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ ...flexBetween, marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.text, marginBottom: '2px' }}>Daily Nutrition Targets</h2>
            <p style={{ fontSize: '13px', color: C.muted }}>Set your calorie and macro goals</p>
          </div>
          <button
            onClick={() => setShowCalc(v => !v)}
            style={{ ...btn, backgroundColor: `${C.accent2}15`, color: C.accent2, border: `1px solid ${C.accent2}40`, fontSize: '12px' }}
          >
            🧮 {showCalc ? 'Hide Calculator' : 'Auto-Calculate'}
          </button>
        </div>

        {/* TDEE Calculator */}
        {showCalc && (
          <div style={{ backgroundColor: C.surface, borderRadius: '10px', padding: '16px', marginBottom: '20px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: C.text, marginBottom: '12px' }}>
              🧮 TDEE Calculator
              {!form.weight_lbs || !form.height_inches || !form.age || !form.sex
                ? <span style={{ color: C.warning, fontWeight: '400', fontSize: '12px', marginLeft: '8px' }}>← Fill in your Personal Info above first</span>
                : null}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ ...label }}>Activity Level</label>
              <select value={activityLevel} onChange={e => setActivityLevel(parseFloat(e.target.value))} style={{ ...input }}>
                {ACTIVITY_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            {tdee && (
              <>
                <div style={{ padding: '10px 14px', backgroundColor: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: '8px', marginBottom: '14px', fontSize: '13px', color: C.text }}>
                  Your estimated TDEE (maintenance): <strong style={{ color: C.accent }}>{tdee.toLocaleString()} kcal/day</strong>
                </div>
                <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px', fontWeight: '600' }}>Pick a goal — targets will be filled automatically:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {CUT_PRESETS.map(p => {
                    const cal = Math.max(tdee + p.deficit, 1200);
                    const { protein, fat, carbs } = calcMacros(cal, parseFloat(form.weight_lbs));
                    return (
                      <button
                        key={p.label}
                        onClick={() => applyPreset(p.deficit)}
                        style={{ padding: '10px 8px', backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', fontFamily: fonts.body, textAlign: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.accent2}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                      >
                        <div style={{ fontSize: '14px', marginBottom: '2px' }}>{p.emoji}</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: C.text }}>{p.label}</div>
                        <div style={{ fontSize: '11px', color: C.accent, marginTop: '2px' }}>{cal.toLocaleString()} kcal</div>
                        <div style={{ fontSize: '10px', color: C.muted }}>{protein}p · {carbs}c · {fat}f</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ ...label }}>Daily Calorie Goal (kcal)</label>
            <input type="number" min="1000" max="10000" value={form.calorie_goal} onChange={setF('calorie_goal')} style={{ ...input }} />
          </div>
          <div>
            <label style={{ ...label }}>Protein Goal (g/day)</label>
            <input type="number" min="0" value={form.protein_goal} onChange={setF('protein_goal')} style={{ ...input }} />
          </div>
          <div>
            <label style={{ ...label }}>Carbs Goal (g/day)</label>
            <input type="number" min="0" value={form.carbs_goal} onChange={setF('carbs_goal')} style={{ ...input }} />
          </div>
          <div>
            <label style={{ ...label }}>Fat Goal (g/day)</label>
            <input type="number" min="0" value={form.fat_goal} onChange={setF('fat_goal')} style={{ ...input }} />
          </div>
          <div>
            <label style={{ ...label }}>Water Goal (glasses/day)</label>
            <input type="number" min="1" max="20" value={form.water_goal} onChange={setF('water_goal')} style={{ ...input }} />
          </div>
        </div>
        <div style={{ marginTop: '14px', padding: '12px', backgroundColor: C.surface, borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: C.muted, marginBottom: '6px' }}>Macro preview (% of calories):</div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <span style={{ color: C.accent }}>Protein: {Math.round((form.protein_goal * 4 / Math.max(form.calorie_goal, 1)) * 100)}%</span>
            <span style={{ color: C.info }}>Carbs: {Math.round((form.carbs_goal * 4 / Math.max(form.calorie_goal, 1)) * 100)}%</span>
            <span style={{ color: C.accent2 }}>Fat: {Math.round((form.fat_goal * 9 / Math.max(form.calorie_goal, 1)) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* AI Key */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <SectionHeader title="AI Settings" subtitle="Configure Anthropic Claude for AI training features" />
        <div>
          <label style={{ ...label }}>Anthropic API Key</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={form.anthropic_api_key}
              onChange={setF('anthropic_api_key')}
              placeholder="sk-ant-..."
              style={{ ...input, fontFamily: form.anthropic_api_key && !showKey ? fonts.mono : fonts.body }}
            />
            <button onClick={() => setShowKey(s => !s)} style={{ ...btn, backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted, flexShrink: 0 }}>
              {showKey ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '6px' }}>
            Get your key at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: C.accent2 }}>
              console.anthropic.com
            </a>
            . Stored securely per-user on server.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <SectionHeader title="Data" subtitle="Export your fitness data" />
        <button onClick={handleExport} disabled={exporting} style={{ ...btn, backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', opacity: exporting ? 0.7 : 1 }}>
          {exporting ? 'Exporting...' : '📥 Export Data (JSON)'}
        </button>
        <p style={{ fontSize: '11px', color: C.muted, marginTop: '8px' }}>Exports your last 30 days of workout and nutrition data.</p>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, padding: '12px 40px', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : '💾 Save Settings'}
      </button>
    </div>
  );
}
