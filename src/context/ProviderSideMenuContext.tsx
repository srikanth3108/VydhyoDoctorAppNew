import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';

type ProviderSideMenuContextValue = {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const ProviderSideMenuContext = createContext<ProviderSideMenuContextValue | null>(null);

export function ProviderSideMenuProvider({children}: {children: React.ReactNode}) {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      openMenu,
      closeMenu,
    }),
    [isOpen, openMenu, closeMenu]
  );

  return (
    <ProviderSideMenuContext.Provider value={value}>
      {children}
    </ProviderSideMenuContext.Provider>
  );
}

export function useSideMenu() {
  const ctx = useContext(ProviderSideMenuContext);
  if (!ctx) {
    throw new Error('useSideMenu must be used within ProviderSideMenuProvider');
  }
  return ctx;
}
