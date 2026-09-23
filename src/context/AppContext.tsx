import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Theme, UserSession } from '../types';
import { storageService } from '../services/storage';
import { soundService } from '../services/sound';

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
  receiptType: 'pos' | 'invoice' | 'order' | null;
  openReceipt: (data: any, type: 'pos' | 'invoice' | 'order') => void;
  closeReceipt: () => void;
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
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Orders, 1: Returns, 2: Invoices, 3: Credit Notes, 4: POS
  const [isOnline, setIsOnlineState] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<UserSession>(DEFAULT_USER);
  const [handheldMode, setHandheldMode] = useState<boolean>(true); // EDA50 frame enabled by default
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanCallback, setActiveScanCallback] = useState<((code: string) => void) | null>(null);
  const registeredScannerHandlerRef = React.useRef<((code: string) => void) | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [receiptType, setReceiptType] = useState<'pos' | 'invoice' | 'order' | null>(null);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);

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

  const openReceipt = (data: any, type: 'pos' | 'invoice' | 'order') => {
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
        isOutboxOpen,
        setIsOutboxOpen,
        isPinOpen,
        setIsPinOpen,
        triggerSync,
        toasts,
        toast: toasts[0] || null,
        showToast,
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
