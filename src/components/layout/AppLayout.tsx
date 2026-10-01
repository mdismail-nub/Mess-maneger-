import React, { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Users,
  CreditCard,
  BarChart3,
  CalendarCheck,
  Settings as SettingsIcon,
  ChevronDown,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { MonthSwitcherModal } from './MonthSwitcherModal';

export type NavTab =
  | 'dashboard'
  | 'meals'
  | 'expenses'
  | 'members'
  | 'payments'
  | 'reports'
  | 'monthend'
  | 'settings';

interface AppLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const { activeMonth, settings } = useApp();
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mainNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meals' as NavTab, label: 'Meals', icon: UtensilsCrossed },
    { id: 'expenses' as NavTab, label: 'Expenses', icon: Receipt },
    { id: 'members' as NavTab, label: 'Members', icon: Users },
    { id: 'payments' as NavTab, label: 'Payments', icon: CreditCard },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'monthend' as NavTab, label: 'Month End', icon: CalendarCheck },
    { id: 'settings' as NavTab, label: 'Settings', icon: SettingsIcon },
  ];

  // Mobile bottom bar: 3 core sections + More
  const mobilePrimaryTabs: Array<{ id: NavTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
  ];

  const moreTabs: Array<{ id: NavTab; label: string; icon: typeof Users }> = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'monthend', label: 'Month End', icon: CalendarCheck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const isMoreActive = moreTabs.some((t) => t.id === currentTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row pb-16 md:pb-0 overflow-x-hidden">
      <OfflineIndicator />

      {/* Month Switcher Modal */}
      <MonthSwitcherModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
      />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-screen sticky top-0 z-30 select-none">
        {/* Brand */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white block leading-tight">
                {settings.messName || 'MessMate'}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Mess Manager</span>
            </div>
          </div>
        </div>

        {/* Current Month Selector */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsMonthModalOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 text-left transition cursor-pointer text-xs"
          >
            <div className="min-w-0 pr-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Period</span>
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {activeMonth?.name || 'Select Month'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-slate-400">
              {activeMonth?.isClosed && <Lock className="w-3 h-3 text-amber-500" />}
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <PWAInstallButton variant="sidebar" />
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <UtensilsCrossed className="w-3.5 h-3.5" />
          </div>
          <button
            onClick={() => setIsMonthModalOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white truncate cursor-pointer text-left"
          >
            <span className="truncate">{activeMonth?.name || 'MessMate'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <PWAInstallButton variant="compact" />
        </div>
      </header>

      {/* MOBILE "MORE" DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">More Sections</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-left transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1 flex items-center justify-around safe-area-bottom">
        {mobilePrimaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition cursor-pointer ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        {/* More tab button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition cursor-pointer ${
            isMoreActive
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Menu className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
};
