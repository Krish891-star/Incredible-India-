// PWA Install Prompt Handler
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): void;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e as BeforeInstallPromptEvent;
      // Show the install button
      setIsInstallable(true);
      setInstallPrompt(deferredPrompt);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      console.log('No install prompt available');
      return;
    }

    // Show the install prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    // Reset the deferred prompt
    deferredPrompt = null;
    setInstallPrompt(null);
    setIsInstallable(false);
  };

  const checkInstallStatus = () => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (navigator.standalone === true) || 
                         ('standalone' in window.navigator && window.navigator.standalone === true);
    
    return {
      isInstallable,
      isInstalled: isStandalone,
      installApp,
      deferredPrompt
    };
  };

  return {
    isInstallable,
    installApp,
    deferredPrompt,
    checkInstallStatus
  };
};

// Function to manually trigger the install prompt if needed
export const triggerPWAInstall = () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    return deferredPrompt.userChoice;
  }
  return Promise.reject(new Error('Install prompt not available'));
};

// Check if app is running in standalone mode
export const isPWAStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (navigator.standalone === true) || 
         ('standalone' in window.navigator && window.navigator.standalone === true);
};