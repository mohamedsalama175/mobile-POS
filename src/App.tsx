import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DeviceFrame } from './components/layout/DeviceFrame';
import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { OrdersScreen } from './components/screens/OrdersScreen';
import { ReturnsScreen } from './components/screens/ReturnsScreen';
import { InvoicesScreen } from './components/screens/InvoicesScreen';
import { CreditNotesScreen } from './components/screens/CreditNotesScreen';
import { PosScreen } from './components/screens/PosScreen';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { OutboxModal } from './components/common/OutboxModal';
import { PinLockModal } from './components/common/PinLockModal';

const AppContent: React.FC = () => {
  const { activeTab, toast } = useApp();

  return (
    <DeviceFrame>
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top App Bar with Connectivity, Search, & Settings (§3.2) */}
        <TopAppBar />

        {/* Active Screen Module Container */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {activeTab === 0 && <OrdersScreen />}
          {activeTab === 1 && <ReturnsScreen />}
          {activeTab === 2 && <InvoicesScreen />}
          {activeTab === 3 && <CreditNotesScreen />}
          {activeTab === 4 && <PosScreen />}
        </main>

        {/* 5-Tab Persistent Bottom Navigation Bar (§1 & §3.3) */}
        <BottomNavBar />

        {/* Global Toast Notification */}
        {toast && (
          <div className="absolute top-16 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
            <div
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 border pointer-events-auto ${
                toast.type === 'error'
                  ? 'bg-red-950/95 border-red-500 text-red-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/95 border-amber-500 text-amber-200'
                  : toast.type === 'info'
                  ? 'bg-blue-950/95 border-blue-500 text-blue-200'
                  : 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
              }`}
            >
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Modals & Overlays */}
        <BarcodeScannerModal />
        <ReceiptModal />
        <OutboxModal />
        <PinLockModal />
      </div>
    </DeviceFrame>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
