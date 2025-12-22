import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/lib/pwa';

const PWAInstallPrompt = () => {
  const { isInstallable, installApp } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show the prompt after a short delay to avoid showing immediately on page load
    const timer = setTimeout(() => {
      if (isInstallable) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstallable]);

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Install App</h3>
          <p className="text-sm text-gray-600 mt-1">
            Install Incredible India app for a better experience
          </p>
        </div>
        <button 
          onClick={() => setShowPrompt(false)}
          className="ml-2 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <Button 
        className="mt-3 w-full" 
        onClick={async () => {
          await installApp();
          setShowPrompt(false);
        }}
      >
        Install
      </Button>
    </div>
  );
};

export default PWAInstallPrompt;