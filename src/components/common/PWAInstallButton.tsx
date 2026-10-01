import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { AppInstallModal } from './AppInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'full' }) => {
  const { isInstalled, canPromptDirectly, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running inside standalone PWA, suppress
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (canPromptDirectly) {
      const res = await install();
      if (res !== 'accepted') {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2.5 px-3 shadow-xs transition active:scale-[0.98] cursor-pointer"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Download &amp; Install App</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleClick}
          title="Download & Install App"
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium text-xs py-1 px-2.5 border border-blue-500/20 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {variant === 'full' && (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm py-2 px-3.5 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download App</span>
        </button>
      )}

      <AppInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
