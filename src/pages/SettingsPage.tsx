import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Database,
  Building,
  DollarSign,
  Tag,
  Plus,
  X,
  Sparkles,
  Info,
  CheckCircle2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportAllData, importAllData } from '../db/indexedDB';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AppInstallModal } from '../components/common/AppInstallModal';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useToast } from '../context/ToastContext';

interface SettingsPageProps {
  onLaunchOnboarding?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLaunchOnboarding }) => {
  const {
    settings,
    updateSettings,
    loadDemoData,
    resetAllData,
    refreshData,
  } = useApp();
  const { success, error } = useToast();
  const {
    isInstalled,
    canPromptDirectly,
    isInIframe,
    install,
    openInNewTab,
  } = usePWAInstall();

  const [messName, setMessName] = useState(settings.messName);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [newCategory, setNewCategory] = useState('');

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importJsonPayload, setImportJsonPayload] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadAppClick = async () => {
    if (canPromptDirectly) {
      const res = await install();
      if (res !== 'accepted') {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Save General Settings
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      messName: messName.trim() || 'MessMate',
      currencySymbol: currencySymbol.trim() || '৳',
    });
  };

  // Theme Toggle
  const handleThemeChange = async (theme: 'light' | 'dark') => {
    await updateSettings({ theme });
  };

  // Add category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const cat = newCategory.trim();
    if (settings.categories.includes(cat)) {
      error('Category already exists');
      return;
    }
    const updated = [...settings.categories, cat];
    await updateSettings({ categories: updated });
    setNewCategory('');
  };

  // Remove category
  const handleRemoveCategory = async (catToRemove: string) => {
    if (settings.categories.length <= 1) {
      error('Must have at least one category');
      return;
    }
    const updated = settings.categories.filter((c) => c !== catToRemove);
    await updateSettings({ categories: updated });
  };

  // Backup Export
  const handleExportBackup = async () => {
    try {
      const json = await exportAllData();
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `messmate-backup-${dateStr}.json`;
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success(`Backup exported as ${filename}`);
    } catch (err) {
      console.error(err);
      error('Failed to export backup');
    }
  };

  // Backup Import Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonPayload(content);
        setShowImportConfirm(true);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importJsonPayload) return;
    try {
      await importAllData(importJsonPayload);
      success('Database restored successfully from backup!');
      await refreshData();
    } catch (err) {
      console.error(err);
      error('Failed to restore backup. Invalid JSON file format.');
    } finally {
      setImportJsonPayload(null);
      setShowImportConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          MessMate Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure preferences, currencies, expense categories, and backup management
        </p>
      </div>

      {/* 1. App Download & PWA Installation */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Download &amp; Install App
                </h2>
                {isInstalled ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Installed (Standalone)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-500/20">
                    Offline PWA Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Install MessMate on your mobile phone or desktop for full-screen offline access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadAppClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? 'App Options' : 'Download & Install App'}</span>
            </button>
            {isInIframe && (
              <button
                type="button"
                onClick={openInNewTab}
                title="Open in new browser tab to trigger browser install prompt"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Open in Tab</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">⚡ Instant Launches</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Opens directly from your home screen or desktop without browser bars.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">🔒 100% Offline Storage</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              All meals, bazaar expenses, and balances remain stored on your device.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">📲 All Devices</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Works on Android phones, iPhones, iPads, Windows PCs, and MacBooks.
            </p>
          </div>
        </div>
      </div>

      {/* 2. General Preferences Form */}
      <form
        onSubmit={handleSaveGeneral}
        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Building className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            General Preferences
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mess / Hostel Name
            </label>
            <input
              type="text"
              value={messName}
              onChange={(e) => setMessName(e.target.value)}
              placeholder="e.g. Bachelor Point, Padma House"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              placeholder="৳, $, €, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Default: Bangladeshi Taka (৳)</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* 2. Theme Customization */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          Appearance Theme
        </h2>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
              settings.theme === 'light'
                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
              settings.theme === 'dark'
                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Dark Mode</span>
          </button>
        </div>
      </div>

      {/* 3. Expense Categories Management */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Tag className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Market &amp; Expense Categories
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {settings.categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                title="Remove category"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-sm pt-2">
          <input
            type="text"
            placeholder="New category name..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* 4. Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Database className="w-4 h-4 text-blue-600" />
          <div>
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Data Backup &amp; Restore
            </h2>
            <p className="text-xs text-slate-500">
              Download your offline data as JSON or restore from an existing backup
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Backup (.JSON)</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer transition">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Import Backup File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 5. Developer Actions */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Developer / Test Actions
          </h2>
          <p className="text-xs text-slate-500">
            Verify calculation scenarios or reset storage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onLaunchOnboarding && (
            <button
              type="button"
              onClick={onLaunchOnboarding}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-medium transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Open Mess Setup Guide</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDemoConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <span>Load Test Data (160 Meals, ৳8,000, ৳50 Rate)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-medium transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear All Local Data</span>
          </button>
        </div>
      </div>

      {/* 6. About Box */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-600" />
          <span>About MessMate (Offline PWA)</span>
        </div>
        <p>
          MessMate is built specifically for shared bachelor mess living. All records are stored client-side in browser IndexedDB. Zero servers required. Works 100% offline once loaded.
        </p>
      </div>

      {/* Confirm Import Dialog */}
      <ConfirmDialog
        isOpen={showImportConfirm}
        onClose={() => setShowImportConfirm(false)}
        onConfirm={handleConfirmImport}
        title="Restore Data from Backup?"
        message="Importing this backup will overwrite the existing local database. Make sure you have exported your current data if you wish to keep it."
        confirmLabel="Restore Database"
        isDestructive={false}
      />

      {/* Confirm Demo Data Load */}
      <ConfirmDialog
        isOpen={showDemoConfirm}
        onClose={() => setShowDemoConfirm(false)}
        onConfirm={loadDemoData}
        title="Load Verification Dataset?"
        message="This will load the specification test dataset: 4 members (Ismail: 45, Rahim: 38, Karim: 42, Hasan: 35 = 160 meals) with ৳8,000 food expenses producing a ৳50.00 meal rate. Existing data will be replaced."
        confirmLabel="Load Test Data"
        isDestructive={false}
      />

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={resetAllData}
        title="Clear All Local Data?"
        message="Are you sure you want to permanently delete all months, members, meals, expenses, and payments from IndexedDB? This action cannot be undone."
        confirmLabel="Clear Everything"
        isDestructive={true}
      />

      {/* App Install & Download Modal */}
      <AppInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
