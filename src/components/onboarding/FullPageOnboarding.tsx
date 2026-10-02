import React, { useState } from 'react';
import {
  UtensilsCrossed,
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  Sparkles,
  Plus,
  X,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Wallet,
  Scale,
  DollarSign,
  ChefHat,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface FullPageOnboardingProps {
  onComplete: () => void;
}

export const FullPageOnboarding: React.FC<FullPageOnboardingProps> = ({ onComplete }) => {
  const {
    settings,
    updateSettings,
    createMonth,
    addMember,
    loadDemoData,
    months,
    members,
  } = useApp();
  const { success } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  // Form State
  const [messName, setMessName] = useState(settings.messName || 'Bachelor Point');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '৳');
  const [monthName, setMonthName] = useState(() => {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  // Default borders for mess
  const [borderList, setBorderList] = useState<Array<{ name: string; phone?: string }>>([
    { name: 'Ismail' },
    { name: 'Rahim' },
    { name: 'Karim' },
    { name: 'Hasan' },
  ]);
  const [newBorderName, setNewBorderName] = useState('');
  const [newBorderPhone, setNewBorderPhone] = useState('');

  const currencies = [
    { symbol: '৳', label: 'BDT (৳)', region: 'Bangladesh' },
    { symbol: '$', label: 'USD ($)', region: 'United States' },
    { symbol: '₹', label: 'INR (₹)', region: 'India' },
    { symbol: '€', label: 'EUR (€)', region: 'Europe' },
    { symbol: '£', label: 'GBP (£)', region: 'United Kingdom' },
    { symbol: '﷼', label: 'SAR (﷼)', region: 'Saudi Arabia' },
  ];

  const handleAddBorder = () => {
    const trimmed = newBorderName.trim();
    if (!trimmed) return;
    if (borderList.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())) return;
    setBorderList([...borderList, { name: trimmed, phone: newBorderPhone.trim() || undefined }]);
    setNewBorderName('');
    setNewBorderPhone('');
  };

  const handleRemoveBorder = (index: number) => {
    setBorderList(borderList.filter((_, i) => i !== index));
  };

  const handleFinishCustom = async () => {
    // 1. Update settings
    await updateSettings({
      messName: messName.trim() || 'MessMate',
      currencySymbol: currencySymbol.trim() || '৳',
    });

    // 2. Add members if none exist
    if (members.length === 0 && borderList.length > 0) {
      for (const border of borderList) {
        if (border.name.trim()) {
          await addMember({
            name: border.name.trim(),
            phone: border.phone,
            joinDate: startDate,
            status: 'active',
          });
        }
      }
    }

    // 3. Create initial month if none exist
    if (months.length === 0) {
      await createMonth(monthName.trim() || 'Current Month', startDate, true);
    }

    localStorage.setItem('messmate_onboarded', 'true');
    success('Welcome to MessMate! Your mess is now ready.');
    onComplete();
  };

  const handleFinishDemo = async () => {
    await loadDemoData();
    localStorage.setItem('messmate_onboarded', 'true');
    success('Demo mess initialized with 160 meals and ৳8,000 verified expenses.');
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Top Navigation / Brand Bar */}
      <header className="px-6 py-5 border-b border-slate-800/80 bg-[#0B111D]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/20">
              <ChefHat className="w-5 h-5 text-emerald-50" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  MessMate
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                  Offline-First
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Bachelor Mess Meal &amp; Expense Manager
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              Step {currentStep} of {totalSteps}
            </span>
            <div className="flex gap-1.5 items-center">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === currentStep
                      ? 'w-7 bg-emerald-500 shadow-xs shadow-emerald-500/50'
                      : s < currentStep
                      ? 'w-2 bg-emerald-700/60'
                      : 'w-2 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-2xl w-full mx-auto">
          {/* STEP 1: Welcome & Mission */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center sm:text-left space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Welcome to modern mess management</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Transparent meals &amp; fair expenses for bachelor living.
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                  Replace crumpled ledger sheets and calculator arguments. MessMate tracks daily meals, splits bazaar market costs, computes live dynamic meal rates, and provides crystal-clear monthly settlements.
                </p>
              </div>

              {/* 4 Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <UtensilsCrossed className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">1-Tap Daily Meals</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Quickly tap Breakfast, Lunch, or Dinner for every roommate with daily and monthly totals.
                    </p>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Live Meal Rate</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Instantly updates as bazaar expenses and meals are logged in real time.
                    </p>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/20">
                    <Scale className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Separate Utilities</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Keep market grocery food expenses separate from shared WiFi, gas, and electricity bills.
                    </p>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">100% Offline &amp; Private</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Works without internet, saved right in your browser via IndexedDB. Installable as PWA.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition active:scale-[0.99] border border-emerald-400/20 cursor-pointer"
                >
                  <span>Set Up My Mess</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleFinishDemo}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs sm:text-sm border border-slate-800 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Explore Demo Mess (1-Click)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Mess Identity & Currency */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <span>Step 2 of 4 • Mess Details</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Name your mess &amp; choose currency
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Every mess or bachelor flat has its own name and accounting currency.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Mess / Residence Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={messName}
                      onChange={(e) => setMessName(e.target.value)}
                      placeholder="e.g. Bachelor Point, Green View Flat 4B"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Currency Symbol
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {currencies.map((curr) => {
                      const isSelected = currencySymbol === curr.symbol;
                      return (
                        <button
                          key={curr.symbol}
                          type="button"
                          onClick={() => setCurrencySymbol(curr.symbol)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/70 border-emerald-500 text-white ring-1 ring-emerald-500/30'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-sm block">
                              {curr.label}
                            </span>
                            <span className="text-[10px] text-slate-400">{curr.region}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Next: Add Roommates</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Roommates & Borders */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <span>Step 3 of 4 • Roommates</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Who lives in this mess?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Add the roommates (borders) who eat meals and share expenses.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newBorderName}
                    onChange={(e) => setNewBorderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBorder();
                      }
                    }}
                    placeholder="Roommate name (e.g. Tanvir, Shakib)..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="tel"
                    value={newBorderPhone}
                    onChange={(e) => setNewBorderPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="w-full sm:w-36 px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBorder}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Roommate Cards */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {borderList.map((border, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm font-medium text-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/90 text-emerald-400 border border-emerald-800/40 flex items-center justify-center font-bold text-xs">
                          {border.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">{border.name}</span>
                          {border.phone && (
                            <span className="text-[11px] text-slate-400">{border.phone}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBorder(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title="Remove roommate"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>{borderList.length} members configured</span>
                  <span className="text-slate-500">You can edit or add more anytime</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={borderList.length === 0}
                  onClick={() => setCurrentStep(4)}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Next: First Period</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: First Month & Launch */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <span>Step 4 of 4 • Monthly Cycle</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Configure your first month
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  MessMate keeps records organized by monthly cycles so settlements remain isolated.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Month Name / Label
                  </label>
                  <div className="relative">
                    <Calendar className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={monthName}
                      onChange={(e) => setMonthName(e.target.value)}
                      placeholder="e.g. October 2026"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Cycle Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Ready Summary Card */}
              <div className="p-4.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-400">Mess Residence:</span>
                  <strong className="text-white">{messName}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-400">Roommates ({borderList.length}):</span>
                  <strong className="text-emerald-400">{borderList.map((b) => b.name).join(', ')}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold text-slate-400">Accounting Currency:</span>
                  <strong className="text-white">{currencySymbol}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishCustom}
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-[0.99] border border-emerald-400/20 cursor-pointer"
                >
                  <span>Launch MessMate Dashboard</span>
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/60 bg-[#0B111D]/60 text-center text-xs text-slate-500">
        <span>MessMate • Professional Bachelor Mess &amp; Shared Living Management</span>
      </footer>
    </div>
  );
};
