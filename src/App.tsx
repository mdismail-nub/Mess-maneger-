import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout, NavTab } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { MealsPage } from './pages/MealsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { MembersPage } from './pages/MembersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { MonthEndPage } from './pages/MonthEndPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { FullPageOnboarding } from './components/onboarding/FullPageOnboarding';
import { UtensilsCrossed } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { loading, months } = useApp();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [forceOnboarding, setForceOnboarding] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs mb-3">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          MessMate
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Loading offline data...
        </p>
      </div>
    );
  }

  // Full-page onboarding when user has not yet set up a mess or explicitly launches it
  const isFirstTime = !localStorage.getItem('messmate_onboarded') && months.length === 0;
  if (isFirstTime || forceOnboarding) {
    return (
      <FullPageOnboarding
        onComplete={() => {
          setForceOnboarding(false);
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  return (
    <AppLayout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
      {currentTab === 'meals' && <MealsPage onNavigate={setCurrentTab} />}
      {currentTab === 'expenses' && <ExpensesPage onNavigate={setCurrentTab} />}
      {currentTab === 'members' && <MembersPage onNavigate={setCurrentTab} />}
      {currentTab === 'payments' && <PaymentsPage onNavigate={setCurrentTab} />}
      {currentTab === 'reports' && <ReportsPage onNavigate={setCurrentTab} />}
      {currentTab === 'monthend' && <MonthEndPage onNavigate={setCurrentTab} />}
      {currentTab === 'settings' && (
        <SettingsPage onLaunchOnboarding={() => setForceOnboarding(true)} />
      )}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ToastProvider>
  );
}
