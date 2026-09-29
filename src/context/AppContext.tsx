import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, Theme, UserSession, PrinterSettings } from '../types';
import { storageService } from '../services/storage';
import { soundService } from '../services/sound';
import { printerService } from '../services/printerService';


interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeTab: number;
  setActiveTab: (tab: number) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  pendingSyncCount: number;
  refreshPendingCount: () => void;
  currentUser: UserSession;
  setCurrentUser: (user: UserSession) => void;
  handheldMode: boolean;
  setHandheldMode: (val: boolean) => void;
  // Scanner modal state
  isScannerOpen: boolean;
  openScanner: (callback: (code: string) => void) => void;
  closeScanner: () => void;
  activeScanCallback: ((code: string) => void) | null;
  // Receipt modal state
  isReceiptOpen: boolean;
  receiptData: any | null;
  receiptType: 'pos' | 'invoice' | 'order' | 'return' | 'credit_note' | null;
  openReceipt: (data: any, type: 'pos' | 'invoice' | 'order' | 'return' | 'credit_note') => void;
  closeReceipt: () => void;
  // Printer settings
  printerSettings: PrinterSettings;
  updatePrinterSettings: (settings: Partial<PrinterSettings>) => void;

  // Outbox modal state
  isOutboxOpen: boolean;
  setIsOutboxOpen: (open: boolean) => void;
  // Pin modal state
  isPinOpen: boolean;
  setIsPinOpen: (open: boolean) => void;
  // Sync trigger
  triggerSync: () => void;
  // Toasts
  toasts: ToastMessage[];
  toast: ToastMessage | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  // Hide bottom nav for wizards/full-screen flows
  hideBottomNav: boolean;
  setHideBottomNav: (hide: boolean) => void;
  // Physical trigger simulation & active handler
  fireHardwareTrigger: () => void;
  registerScannerHandler: (handler: (code: string) => void) => () => void;
}

const DEFAULT_USER: UserSession = {
  username: 'sa',
  displayName: 'SA (Super Admin)',
  displayNameEn: 'SA (Super Admin)',
  badgeNumber: 'SA-901',
  role: 'super_admin',
  defaultBranch: 'الفرع الرئيسي (SA)',
  defaultWarehouse: 'المستودع الرئيسي - المنطقة الصناعية'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eda50_language') as Language;
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'ar';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eda50_theme') as Theme;
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'dark';
  });
  const [activeTab, setActiveTabState] = useState<number>(0); // 0: Orders, 1: Returns, 2: Invoices, 3: Credit Notes, 4: POS
  const [isOnline, setIsOnlineState] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<UserSession>(DEFAULT_USER);
  const [handheldMode, setHandheldModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eda50_handheld_frame');
      if (saved !== null) return saved === 'true';
    }
    return false; // Default: regular full page (border removed) for real Honeywell devices
  });

  const setHandheldMode = (val: boolean) => {
    setHandheldModeState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eda50_handheld_frame', String(val));
    }
  };
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanCallback, setActiveScanCallback] = useState<((code: string) => void) | null>(null);
  const registeredScannerHandlerRef = React.useRef<((code: string) => void) | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [receiptType, setReceiptType] = useState<'pos' | 'invoice' | 'order' | 'return' | 'credit_note' | null>(null);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => printerService.loadSettings());
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [hideBottomNav, setHideBottomNavState] = useState(false);

  const updatePrinterSettings = (newSettings: Partial<PrinterSettings>) => {
    const updated = printerService.saveSettings(newSettings);
    setPrinterSettings({ ...updated });
  };

  // Stable callback so useEffect deps in screens don't fire on every render
  const setHideBottomNav = useCallback((hide: boolean) => {
    setHideBottomNavState(hide);
  }, []);

  // Whenever the active tab changes, always reset the bottom nav visibility.
  // This prevents the nav staying hidden when the user switches tabs while
  // inside a wizard / create flow.
  const setActiveTab = useCallback((tab: number) => {
    setHideBottomNavState(false);
    setActiveTabState(tab);
  }, []);

  useEffect(() => {
    // Initial sync and count
    setIsOnlineState(storageService.getNetworkStatus());
    setPendingSyncCount(storageService.getPendingCount());

    // HTML dir & lang attributes
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eda50_language', lang);
    }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eda50_theme', t);
    }
  };

  const registerScannerHandler = (handler: (code: string) => void) => {
    registeredScannerHandlerRef.current = handler;
    return () => {
      if (registeredScannerHandlerRef.current === handler) {
        registeredScannerHandlerRef.current = null;
      }
    };
  };

  const setIsOnline = (online: boolean) => {
    setIsOnlineState(online);
    storageService.setNetworkStatus(online);
    showToast(
      online
        ? (language === 'ar' ? 'تم الاتصال بالشبكة (Online)' : 'Connected to Network (Online)')
        : (language === 'ar' ? 'تم قطع الاتصال - وضع العمل غير المتصل (Offline)' : 'Disconnected - Working Offline'),
      online ? 'success' : 'warning'
    );
  };

  const refreshPendingCount = () => {
    setPendingSyncCount(storageService.getPendingCount());
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const openScanner = (callback: (code: string) => void) => {
    setActiveScanCallback(() => callback);
    setIsScannerOpen(true);
    soundService.playClick();
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
    setActiveScanCallback(null);
  };

  const openReceipt = (data: any, type: 'pos' | 'invoice' | 'order' | 'return' | 'credit_note') => {
    setReceiptData(data);
    setReceiptType(type);
    setIsReceiptOpen(true);
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    setReceiptData(null);
    setReceiptType(null);
  };

  const triggerSync = () => {
    if (!isOnline) {
      showToast(
        language === 'ar'
          ? 'الجهاز غير متصل بالإنترنت. لا يمكن المزامنة الآن.'
          : 'Device is offline. Cannot sync right now.',
        'warning'
      );
      soundService.playError();
      return;
    }

    const { success, failed } = storageService.syncAll();
    refreshPendingCount();

    if (failed > 0) {
      showToast(
        language === 'ar'
          ? `تمت مزامنة ${success} سجل، وفشل ${failed} سجل يتطلب مراجعتك في صندوق الصادر`
          : `Synced ${success} records, ${failed} failed in outbox`,
        'warning'
      );
      soundService.playError();
    } else if (success > 0) {
      showToast(
        language === 'ar'
          ? `اكتملت المزامنة بنجاح (${success} سجل)`
          : `Sync completed successfully (${success} records)`,
        'success'
      );
      soundService.playScanSuccess();
    } else {
      showToast(
        language === 'ar' ? 'جميع السجلات متزامنة بالفعل مع الخادم' : 'All records are already synced',
        'info'
      );
    }
  };

  // Physical scan trigger button (Left or Right yellow buttons on Honeywell EDA50)
  const fireHardwareTrigger = () => {
    soundService.playClick();
    // If a scanner callback is active or a screen registered its scanner handler, open with that handler
    if (!isScannerOpen) {
      if (activeScanCallback) {
        setIsScannerOpen(true);
      } else if (registeredScannerHandlerRef.current) {
        openScanner(registeredScannerHandlerRef.current);
      } else {
        setIsScannerOpen(true);
      }
    }
  };

  // Hardware wedge barcode scanner listener (for physical Honeywell EDA50/Zebra triggers)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        const scannedCode = buffer.trim();
        buffer = '';

        if (scannedCode.length >= 2) {
          // If scanner modal is open or active callback is waiting
          if (activeScanCallback) {
            e.preventDefault();
            activeScanCallback(scannedCode);
            closeScanner();
            soundService.playScanSuccess();
            return;
          }

          // If a screen registered its scanner handler
          if (registeredScannerHandlerRef.current) {
            const target = e.target as HTMLElement | null;
            const isDedicatedInput =
              target?.id === 'line-item-code-input' || target?.id === 'scanner-manual-input';

            if (!isDedicatedInput) {
              e.preventDefault();
              registeredScannerHandlerRef.current(scannedCode);
              soundService.playScanSuccess();
            }
          }
        }
        return;
      }

      // Single printable character
      if (e.key.length === 1) {
        // Hardware wedge scanners send rapid keystrokes (< 50ms)
        if (diff > 100 && buffer.length > 0) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeScanCallback]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        activeTab,
        setActiveTab,
        isOnline,
        setIsOnline,
        pendingSyncCount,
        refreshPendingCount,
        currentUser,
        setCurrentUser,
        handheldMode,
        setHandheldMode,
        isScannerOpen,
        openScanner,
        closeScanner,
        activeScanCallback,
        isReceiptOpen,
        receiptData,
        receiptType,
        openReceipt,
        closeReceipt,
        printerSettings,
        updatePrinterSettings,
        isOutboxOpen,
        setIsOutboxOpen,
        isPinOpen,
        setIsPinOpen,
        triggerSync,
        toasts,
        toast: toasts[0] || null,
        showToast,
        hideBottomNav,
        setHideBottomNav,
        fireHardwareTrigger,
        registerScannerHandler
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
