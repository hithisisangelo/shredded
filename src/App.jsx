import React, { useState, useEffect, useCallback } from 'react';
import { C, fonts } from './styles.js';
import { auth, workouts, nutrition, settings } from './api.js';
import './mobile.css';

import AuthScreen from './components/AuthScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import Dashboard from './components/Dashboard.jsx';
import WorkoutCalendar from './components/WorkoutCalendar.jsx';
import AiTrainer from './components/AiTrainer.jsx';
import WorkoutLogger from './components/WorkoutLogger.jsx';
import Nutrition from './components/Nutrition.jsx';
import Progress from './components/Progress.jsx';
import Settings from './components/Settings.jsx';

const VIEWS = ['dashboard', 'calendar', 'ai', 'log', 'nutrition', 'progress', 'settings'];

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('shredded_token'));
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Global state
  const [activePlan, setActivePlan] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [userSettings, setUserSettings] = useState({});
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const loadInitialData = useCallback(async () => {
    try {
      const [todayRes, settingsRes] = await Promise.all([
        workouts.getToday().catch(() => null),
        settings.get().catch(() => ({})),
      ]);
      if (todayRes) {
        setTodayData(todayRes);
        if (todayRes.plan) setActivePlan(todayRes.plan);
      }
      if (settingsRes) setUserSettings(settingsRes);

      const summaryRes = await nutrition.getSummary(today).catch(() => null);
      if (summaryRes) setNutritionSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [today]);

  useEffect(() => {
    if (token) {
      auth.me()
        .then(({ user }) => {
          setUser(user);
          setLoading(false);
          loadInitialData();
        })
        .catch(() => {
          localStorage.removeItem('shredded_token');
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, loadInitialData]);

  const handleLogin = ({ token: t, user: u }) => {
    localStorage.setItem('shredded_token', t);
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('shredded_token');
    setToken(null);
    setUser(null);
    setActivePlan(null);
    setTodayData(null);
    setNutritionSummary(null);
    setUserSettings({});
    setActiveView('dashboard');
  };

  const refreshTodayData = useCallback(async () => {
    try {
      const [todayRes, summaryRes] = await Promise.all([
        workouts.getToday().catch(() => null),
        nutrition.getSummary(today).catch(() => null),
      ]);
      if (todayRes) {
        setTodayData(todayRes);
        if (todayRes.plan) setActivePlan(todayRes.plan);
      }
      if (summaryRes) setNutritionSummary(summaryRes);
    } catch (err) {
      console.error(err);
    }
  }, [today]);

  const updateSettings = useCallback((newSettings) => {
    setUserSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: C.bg, flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: C.muted, fontSize: '14px', fontFamily: fonts.body }}>Loading SHREDDED...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const viewProps = {
    user,
    userSettings,
    activePlan,
    setActivePlan,
    todayData,
    nutritionSummary,
    refreshTodayData,
    updateSettings,
    setActiveView,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: C.bg, fontFamily: fonts.body, overflow: 'hidden' }}>
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => { setActiveView(view); if (isMobile) setSidebarOpen(false); }}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar
          user={user}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="main-content" style={{ flex: 1, overflow: 'auto', padding: '24px', scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>
          {activeView === 'dashboard' && <Dashboard {...viewProps} />}
          {activeView === 'calendar' && <WorkoutCalendar {...viewProps} />}
          {activeView === 'ai' && <AiTrainer {...viewProps} />}
          {activeView === 'log' && <WorkoutLogger {...viewProps} />}
          {activeView === 'nutrition' && <Nutrition {...viewProps} />}
          {activeView === 'progress' && <Progress {...viewProps} />}
          {activeView === 'settings' && <Settings {...viewProps} />}
        </main>
      </div>
    </div>
  );
}
