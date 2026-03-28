import React, { useState, useEffect, useCallback } from 'react';
import { C, fonts, card, flexBetween, label, btn, btnPrimary } from '../styles.js';
import { nutrition } from '../api.js';
import FoodSearch from './FoodSearch.jsx';

const MEALS = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'lunch', label: 'Lunch', icon: '🥗' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️' },
  { id: 'snack', label: 'Snacks', icon: '🍎' },
];

function CalorieRing({ consumed, goal }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const dash = pct * circ;
  const remaining = Math.round(goal - consumed);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '172px', height: '172px' }}>
        <svg width="172" height="172" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="86" cy="86" r={r} fill="none" stroke={C.border} strokeWidth="14" />
          <circle cx="86" cy="86" r={r} fill="none" stroke={pct >= 1 ? C.danger : C.accent} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: C.text }}>{Math.round(consumed)}</span>
          <span style={{ fontSize: '12px', color: C.muted }}>/ {Math.round(goal)} kcal</span>
          <span style={{ fontSize: '11px', color: remaining > 0 ? C.accent : C.danger, fontWeight: '600' }}>
            {remaining > 0 ? `${remaining} left` : 'Over goal'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label: lbl, value, goal, color }) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ ...flexBetween, marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>{lbl}</span>
        <span style={{ fontSize: '12px', color: C.muted, fontFamily: fonts.mono }}>{Math.round(value)}g / {goal}g</span>
      </div>
      <div style={{ height: '8px', backgroundColor: C.border, borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function WaterTracker({ glasses, goal, onUpdate }) {
  return (
    <div>
      <div style={{ ...flexBetween, marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>Water Intake</span>
        <span style={{ fontSize: '12px', color: C.muted }}>{glasses} / {goal} glasses</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Array.from({ length: goal }).map((_, i) => (
          <button key={i} onClick={() => onUpdate(i + 1 === glasses ? i : i + 1)}
            style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '16px', backgroundColor: i < glasses ? `${C.info}30` : C.surface, transition: 'all 0.1s' }}
            title={`${i + 1} glass${i !== 0 ? 'es' : ''}`}
          >
            💧
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Nutrition({ userSettings, refreshTodayData }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [activeMeal, setActiveMeal] = useState('breakfast');
  const [deletingId, setDeletingId] = useState(null);

  const calorieGoal = parseInt(userSettings?.calorie_goal) || 2000;
  const proteinGoal = parseInt(userSettings?.protein_goal) || 150;
  const carbsGoal = parseInt(userSettings?.carbs_goal) || 200;
  const fatGoal = parseInt(userSettings?.fat_goal) || 65;
  const waterGoal = parseInt(userSettings?.water_goal) || 8;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, summaryData] = await Promise.all([
        nutrition.getLogs(selectedDate),
        nutrition.getSummary(selectedDate),
      ]);
      setLogs(logsData);
      setSummary(summaryData);
      const waterLog = logsData.find(l => l.food_name === '__water__');
      setGlasses(waterLog ? parseInt(waterLog.quantity) : 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddFood = async (food, meal, quantity, servingGrams) => {
    const factor = (servingGrams / 100) * quantity;
    await nutrition.addLog({
      date: selectedDate,
      meal,
      food_name: food.name,
      calories: Math.round(food.calories * factor * 10) / 10,
      protein: Math.round(food.protein * factor * 10) / 10,
      carbs: Math.round(food.carbs * factor * 10) / 10,
      fat: Math.round(food.fat * factor * 10) / 10,
      fiber: Math.round((food.fiber || 0) * factor * 10) / 10,
      serving_size: servingGrams,
      serving_unit: 'g',
      quantity,
      barcode: food.code || null,
    });
    await loadData();
    if (selectedDate === today) refreshTodayData();
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await nutrition.deleteLog(id);
      await loadData();
      if (selectedDate === today) refreshTodayData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleWater = async (newGlasses) => {
    setGlasses(newGlasses);
    const existing = logs.find(l => l.food_name === '__water__');
    if (existing) {
      await nutrition.updateLog(existing.id, { quantity: newGlasses });
    } else {
      await nutrition.addLog({ date: selectedDate, meal: 'snack', food_name: '__water__', calories: 0, protein: 0, carbs: 0, fat: 0, serving_size: 240, serving_unit: 'ml', quantity: newGlasses });
    }
  };

  const mealLogs = (mealId) => logs.filter(l => l.meal === mealId && l.food_name !== '__water__');

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ ...flexBetween, marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>Nutrition</h1>
          <p style={{ color: C.muted, fontSize: '14px' }}>Track your daily food intake and macros</p>
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '13px', fontFamily: fonts.body }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left: summary */}
        <div>
          <div style={{ ...card, marginBottom: '16px', textAlign: 'center' }}>
            <CalorieRing consumed={summary.calories} goal={calorieGoal} />
          </div>
          <div style={{ ...card, marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Macros</h3>
            <MacroBar label="Protein" value={summary.protein} goal={proteinGoal} color={C.accent} />
            <MacroBar label="Carbs" value={summary.carbs} goal={carbsGoal} color={C.info} />
            <MacroBar label="Fat" value={summary.fat} goal={fatGoal} color={C.accent2} />
            <MacroBar label="Fiber" value={summary.fiber || 0} goal={25} color={C.warning} />
          </div>
          <div style={{ ...card }}>
            <WaterTracker glasses={glasses} goal={waterGoal} onUpdate={handleWater} />
          </div>
        </div>

        {/* Right: meals */}
        <div>
          {MEALS.map(meal => {
            const mealItems = mealLogs(meal.id);
            const mealCals = mealItems.reduce((sum, l) => sum + l.calories * l.quantity, 0);
            return (
              <div key={meal.id} style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...flexBetween, marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{meal.icon}</span>
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>{meal.label}</span>
                      {mealCals > 0 && <span style={{ fontSize: '12px', color: C.muted, marginLeft: '8px' }}>{Math.round(mealCals)} kcal</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setActiveMeal(meal.id); setShowFoodSearch(true); }}
                    style={{ ...btn, fontSize: '12px', backgroundColor: `${C.accent}15`, color: C.accent, border: `1px solid ${C.accent}30` }}
                  >
                    + Add Food
                  </button>
                </div>

                {mealItems.length === 0 ? (
                  <p style={{ color: C.muted, fontSize: '13px', padding: '8px 0' }}>No items logged yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ textAlign: 'left', padding: '4px 8px 6px 0', color: C.muted, fontWeight: '600' }}>Food</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px 6px', color: C.muted, fontWeight: '600', width: '70px' }}>Kcal</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px 6px', color: C.muted, fontWeight: '600', width: '60px' }}>Pro</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px 6px', color: C.muted, fontWeight: '600', width: '60px' }}>Carbs</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px 6px', color: C.muted, fontWeight: '600', width: '50px' }}>Fat</th>
                        <th style={{ width: '36px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {mealItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}30` }}>
                          <td style={{ padding: '6px 8px 6px 0', color: C.text }}>
                            {item.food_name}
                            <div style={{ fontSize: '10px', color: C.muted }}>{item.quantity > 1 ? `${item.quantity} × ` : ''}{item.serving_size}{item.serving_unit}</div>
                          </td>
                          <td style={{ textAlign: 'right', padding: '6px 8px', color: C.text, fontFamily: fonts.mono }}>{Math.round(item.calories * item.quantity)}</td>
                          <td style={{ textAlign: 'right', padding: '6px 8px', color: C.accent, fontFamily: fonts.mono }}>{Math.round(item.protein * item.quantity)}g</td>
                          <td style={{ textAlign: 'right', padding: '6px 8px', color: C.info, fontFamily: fonts.mono }}>{Math.round(item.carbs * item.quantity)}g</td>
                          <td style={{ textAlign: 'right', padding: '6px 8px', color: C.accent2, fontFamily: fonts.mono }}>{Math.round(item.fat * item.quantity)}g</td>
                          <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                            <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                              style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: '13px', opacity: deletingId === item.id ? 0.5 : 1 }}>
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showFoodSearch && (
        <FoodSearch
          meal={activeMeal}
          date={selectedDate}
          onAdd={handleAddFood}
          onClose={() => setShowFoodSearch(false)}
        />
      )}
    </div>
  );
}
