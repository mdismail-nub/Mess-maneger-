import React, { useState } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  X,
  ExternalLink,
  Smartphone,
  Laptop,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({ isOpen, onClose }) => {
  const {
    canPromptDirectly,
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    isInIframe,
    install,
    openInNewTab,
  } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  });

  const [promptMessage, setPromptMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerInstall = async () => {
    if (canPromptDirectly) {
      const res = await install();
      if (res === 'accepted') {
        onClose();
        return;
      }
    } else {
      setPromptMessage('Please follow the manual steps below for your browser or open in a direct tab.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Install MessMate App
            </h2>
            <p className="text-xs text-slate-500">
              Offline progressive web application
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {isInstalled ? (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>MessMate is already installed in Standalone Mode on this device!</span>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Install MessMate as a standalone app. It gives you a clean full-screen experience and fast offline launches. All data remains stored safely in your device's local database.
          </p>
        )}

        {/* Notice for Iframes (e.g. AI Studio preview environment) */}
        {isInIframe && (
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2 mb-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Running Inside Embedded Preview</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Browser security policies disable direct installation inside embedded iframes. Open the app in its own browser tab to trigger your device's install prompt.
            </p>
            <button
              type="button"
              onClick={openInNewTab}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer shadow-xs"
            >
              <span>Open in Full Browser Tab to Install</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Primary Action Button (If direct prompt is available) */}
        {canPromptDirectly && !isInstalled && (
          <button
            type="button"
            onClick={handleTriggerInstall}
            className="w-full mb-4 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Install Now</span>
          </button>
        )}

        {promptMessage && (
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 mb-3">
            {promptMessage}
          </div>
        )}

        {/* Platform Selection Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android / Chrome</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Tab Guides */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-medium">
                    Tap the 3 dots menu (⋮)
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    Located in Google Chrome at the top right corner.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-medium">
                    Tap "Install app" or "Add to Home screen"
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    Chrome will prompt you to confirm the installation.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-medium">
                    Open from Home Screen
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    MessMate will now appear with your other apps and works completely offline.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center shrink-0 text-xs">
                  <Share className="w-3 h-3" />
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-medium">
                    1. Tap Share
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    In Safari, tap the Share icon at the bottom toolbar.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center shrink-0 text-xs">
                  <PlusSquare className="w-3 h-3" />
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-medium">
                    2. Select "Add to Home Screen"
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    Scroll down through the share options and tap "Add to Home Screen".
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center shrink-0 text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-medium">
                    3. Tap "Add"
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    Confirm in the top right. MessMate will launch like a native app.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-medium">
                    Address Bar Install Icon
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    In Chrome or Edge, click the app install icon (⊕) on the right side of the address bar.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-medium">
                    Or Browser Menu (⋮)
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    Click the 3 dots menu → "Install MessMate".
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Offline Guarantee */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Stored 100% offline</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
