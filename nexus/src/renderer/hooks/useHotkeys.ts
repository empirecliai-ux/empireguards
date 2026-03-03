import { useEffect } from 'react';

export const useHotkeys = () => {
  useEffect(() => {
    const handlePasswordVault = () => {
      const description = prompt('Enter password description (max 60 chars):');
      if (description) {
         const password = prompt('Enter password:');
         if (password) {
            (window as any).electron.savePassword({ description, password });
            alert('Password secured in Empire Vault.');
         }
      }
    };

    const cleanupVault = window.electron.onOpenPasswordVault(handlePasswordVault);

    return () => {
      cleanupVault();
    };
  }, []);
};
