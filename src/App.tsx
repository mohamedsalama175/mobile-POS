import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DeviceFrame } from './components/layout/DeviceFrame';
import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { OrdersScreen } from './components/screens/OrdersScreen';
import { ReturnsScreen } from './components/screens/ReturnsScreen';
import { InvoicesScreen } from './components/screens/InvoicesScreen';
import { PosScreen } from './components/screens/PosScreen';
import { RepresentativeScreen } from './components/screens/RepresentativeScreen';
import { ProductCatalogScreen } from './modules/products/ProductCatalogScreen';
import { CustomerDirectoryScreen } from './modules/customers/CustomerDirectoryScreen';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { OutboxModal } from './components/common/OutboxModal';
import { PinLockModal } from './components/common/PinLockModal';

const AppContent: React.FC = () => {
  const { activeTab, toast } = useApp();

  return (
    <DeviceFrame>
      {/* 
        Layout: full height flex column.
        TopAppBar = shrink-0 (fixed height)
        main = flex-1 min-h-0 (scrollable screen area)
        BottomNavBar = shrink-0 (fixed height, always visible)
        
        CRITICAL: do NOT wrap this div in overflow-hidden — the bar must not be clipped.
        Each screen's inner content handles its own overflow-y-auto.
      */}
      <div className="flex-1 flex flex-col min-h-0 w-full relative">
        {/* Top App Bar */}
        <TopAppBar />

        {/* Active Screen - flex-1 so it takes remaining space; each screen scrolls internally */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {activeTab === 0 && <OrdersScreen />}
          {activeTab === 1 && <InvoicesScreen />}
          {activeTab === 2 && <PosScreen />}
          {activeTab === 3 && <ReturnsScreen />}
          {activeTab === 4 && <RepresentativeScreen />}
          {activeTab === 5 && <ProductCatalogScreen />}
          {activeTab === 6 && <CustomerDirectoryScreen />}
        </main>

        {/* 5-Tab Persistent Bottom Navigation Bar — shrink-0 so it's always visible */}
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
