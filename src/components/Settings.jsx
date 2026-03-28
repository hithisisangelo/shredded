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
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { username: user?.username, email: user?.email },
        settings: form,
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
            <input type="number" step="0.5" value={form.height_inches} onChange={setF('height_inches')} placeholder='e.g. 71 (= 5\'11")' style={{ ...input }} />
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
        <SectionHeader title="Daily Nutrition Targets" subtitle="Set your calorie and macro goals" />
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
