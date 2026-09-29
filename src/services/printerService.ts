import { PrinterSettings } from '../types';

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  paperWidth: '80mm',
  printerType: 'system',
  autoPrintOnCheckout: false,
  storeName: 'شركة دار السلام للتجارة',
  storeNameEn: 'Dar Al-Salam Trading & Distribution Co.',
  taxNumber: '300124567800003',
  crNumber: '1010892341',
  phone: '0114567890',
  address: 'الرياض - المنطقة الصناعية الثانية',
  footerNote: 'شكراً لتعاملكم معنا • البضاعة المباعة ترد وتستبدل خلال 14 يوماً حسب الشروط'
};

const PRINTER_STORAGE_KEY = 'eda50_printer_settings';

// Standard Bluetooth GATT Service UUIDs for Mobile Thermal ESC/POS Printers
const BLUETOOTH_PRINT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common HM-10 / CC2540 POS Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  '0000ff00-0000-1000-8000-00805f9b34fb'  // Generic Vendor Serial
];

class PrinterService {
  private bluetoothDevice: any = null;
  private writeCharacteristic: any = null;
  private settings: PrinterSettings = DEFAULT_PRINTER_SETTINGS;
  private onConnectionChangeListeners: Array<(connected: boolean, deviceName: string) => void> = [];

  constructor() {
    this.loadSettings();
  }

  public loadSettings(): PrinterSettings {
    if (typeof window === 'undefined') return DEFAULT_PRINTER_SETTINGS;
    try {
      const saved = localStorage.getItem(PRINTER_STORAGE_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = DEFAULT_PRINTER_SETTINGS;
    }
    return this.settings;
  }

  public saveSettings(newSettings: Partial<PrinterSettings>): PrinterSettings {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(this.settings));
      } catch (err) {
        console.error('Failed to save printer settings', err);
      }
    }
    return this.settings;
  }

  public getSettings(): PrinterSettings {
    return this.settings;
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public isConnected(): boolean {
    return Boolean(this.bluetoothDevice && this.bluetoothDevice.gatt?.connected && this.writeCharacteristic);
  }

  public getConnectedDeviceName(): string {
    return this.bluetoothDevice?.name || '';
  }

  public onConnectionChange(listener: (connected: boolean, deviceName: string) => void): () => void {
    this.onConnectionChangeListeners.push(listener);
    return () => {
      this.onConnectionChangeListeners = this.onConnectionChangeListeners.filter(l => l !== listener);
    };
  }

  private notifyConnectionChange() {
    const connected = this.isConnected();
    const name = this.getConnectedDeviceName();
    this.onConnectionChangeListeners.forEach(fn => fn(connected, name));
  }

  /**
   * Request Bluetooth Pairing & Connect to ESC/POS Printer
   */
  public async connectBluetooth(): Promise<{ success: boolean; message: string; deviceName?: string }> {
    if (!this.isBluetoothSupported()) {
      return {
        success: false,
        message: 'Web Bluetooth is not supported in this browser environment. Please use Chrome on Android/Desktop or use System Print.'
      };
    }

    try {
      // Prompt user to pick a Bluetooth device
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLUETOOTH_PRINT_SERVICES
      });

      if (!device) {
        return { success: false, message: 'No Bluetooth device selected.' };
      }

      device.addEventListener('gattserverdisconnected', () => {
        this.writeCharacteristic = null;
        this.notifyConnectionChange();
      });

      const server = await device.gatt.connect();

      // Find an available printing service and write characteristic
      let foundChar: any = null;
      for (const serviceUuid of BLUETOOTH_PRINT_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              foundChar = c;
              break;
            }
          }
          if (foundChar) break;
        } catch {
          // Continue searching other services
        }
      }

      if (!foundChar) {
        // Fallback: try querying all primary services
        try {
          const services = await server.getPrimaryServices();
          for (const s of services) {
            const chars = await s.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                foundChar = c;
                break;
              }
            }
            if (foundChar) break;
          }
        } catch {
          // ignore
        }
      }

      if (!foundChar) {
        return {
          success: false,
          message: `Connected to ${device.name || 'Device'}, but could not locate an ESC/POS printer write characteristic.`
        };
      }

      this.bluetoothDevice = device;
      this.writeCharacteristic = foundChar;
      this.notifyConnectionChange();

      return {
        success: true,
        message: `Successfully connected to ${device.name || 'Bluetooth Printer'}`,
        deviceName: device.name || 'Thermal Printer'
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        return { success: false, message: 'Bluetooth pairing cancelled.' };
      }
      return {
        success: false,
        message: err.message || 'Failed to connect to Bluetooth printer.'
      };
    }
  }

  public async disconnectBluetooth(): Promise<void> {
    if (this.bluetoothDevice && this.bluetoothDevice.gatt?.connected) {
      try {
        await this.bluetoothDevice.gatt.disconnect();
      } catch {
        // ignore
      }
    }
    this.bluetoothDevice = null;
    this.writeCharacteristic = null;
    this.notifyConnectionChange();
  }

  /**
   * Send ESC/POS commands buffer over Bluetooth in safe MTU chunks
   */
  public async sendRawBytes(bytes: Uint8Array): Promise<boolean> {
    if (!this.writeCharacteristic) return false;

    const CHUNK_SIZE = 100;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      if (this.writeCharacteristic.writeValueWithoutResponse) {
        await this.writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.writeCharacteristic.writeValue(chunk);
      }
      // Small pause between Bluetooth packets
      await new Promise(res => setTimeout(res, 20));
    }
    return true;
  }

  /**
   * Build standard ESC/POS bytes for receipt
   */
  public buildEscPosData(data: any, type: string = 'pos', settings: PrinterSettings): Uint8Array {
    const encoder = new TextEncoder();
    const is58mm = settings.paperWidth === '58mm';
    const lineWidth = is58mm ? 32 : 48;
    const divider = '-'.repeat(lineWidth) + '\n';
    const doubleDivider = '='.repeat(lineWidth) + '\n';

    const commands: number[] = [
      0x1B, 0x40, // ESC @: Initialize printer
      0x1B, 0x61, 0x01, // ESC a 1: Center alignment
      0x1B, 0x45, 0x01, // ESC E 1: Bold on
    ];

    const addText = (text: string) => {
      const encoded = encoder.encode(text);
      for (const b of encoded) commands.push(b);
    };

    const addLine = (text: string) => {
      addText(text + '\n');
    };

    // Header
    addLine(settings.storeName);
    addLine(settings.storeNameEn);
    commands.push(0x1B, 0x45, 0x00); // Bold off

    if (settings.taxNumber) addLine(`VAT: ${settings.taxNumber}`);
    if (settings.crNumber) addLine(`CR: ${settings.crNumber}`);
    if (settings.phone) addLine(`Tel: ${settings.phone}`);
    addText(doubleDivider);

    // Document Meta
    commands.push(0x1B, 0x61, 0x00); // Left align
    const docNum = data.receiptNumber || data.invoiceNumber || data.orderNumber || data.returnNumber || data.creditNoteNumber || 'DOC-2026';
    const docTitle =
      type === 'pos' ? 'POS RECEIPT / إيصال مبيعات'
      : type === 'invoice' ? 'TAX INVOICE / فاتورة ضريبية'
      : type === 'order' ? 'SALES ORDER / سند طلب بيع'
      : type === 'return' ? 'SALES RETURN / سند إرجاع'
      : 'CREDIT NOTE / إشعار دائن';

    addLine(`Type: ${docTitle}`);
    addLine(`Doc #: ${docNum}`);
    addLine(`Date: ${data.date || new Date().toISOString().split('T')[0]} ${data.time || ''}`);
    addLine(`Customer: ${data.customerName || 'Cash Customer'}`);
    if (data.salesRep || data.employeeName) addLine(`Cashier: ${data.salesRep || data.employeeName}`);
    addText(divider);

    // Items table
    addLine(is58mm ? 'Item           Qty     Total' : 'Item Description          Qty   Price   Total');
    addText(divider);

    const items = data.items || [];
    for (const it of items) {
      const name = (it.nameEn || it.name || 'Item').slice(0, is58mm ? 14 : 24);
      const qty = `${it.enteredQty || 1}`;
      const total = `${(it.lineTotal || 0).toFixed(2)}`;
      
      if (is58mm) {
        const line = name.padEnd(14) + qty.padStart(5) + total.padStart(13);
        addLine(line);
      } else {
        const price = `${(it.unitPrice || 0).toFixed(2)}`;
        const line = name.padEnd(24) + qty.padStart(5) + price.padStart(8) + total.padStart(11);
        addLine(line);
      }
    }
    addText(divider);

    // Totals
    const padTotal = (lbl: string, val: string) => {
      const space = lineWidth - lbl.length - val.length;
      return lbl + ' '.repeat(Math.max(1, space)) + val;
    };

    addLine(padTotal('Subtotal:', `${(data.grossTotal || 0).toFixed(2)} EGP`));
    if ((data.totalDiscount || 0) > 0) {
      addLine(padTotal('Discount:', `-${(data.totalDiscount || 0).toFixed(2)} EGP`));
    }
    addLine(padTotal('VAT (14%):', `+${(data.totalTax || 0).toFixed(2)} EGP`));
    
    commands.push(0x1B, 0x45, 0x01); // Bold on
    addLine(padTotal('NET TOTAL:', `${(data.netDue || 0).toFixed(2)} EGP`));
    commands.push(0x1B, 0x45, 0x00); // Bold off

    if (data.amountPaid !== undefined) {
      addLine(padTotal(`Paid (${data.paymentMethod === 'card' ? 'Card' : 'Cash'}):`, `${(data.amountPaid || 0).toFixed(2)} EGP`));
      addLine(padTotal('Change Due:', `${(data.changeDue || 0).toFixed(2)} EGP`));
    }

    addText(doubleDivider);

    // Footer
    commands.push(0x1B, 0x61, 0x01); // Center align
    addLine(settings.footerNote || 'Thank you for your business!');
    addLine('Honeywell EDA50 Mobile POS');
    addLine('*** END OF RECEIPT ***');
    
    // Line feeds & paper cut (GS V 66 0)
    commands.push(0x0A, 0x0A, 0x0A, 0x0A);
    commands.push(0x1D, 0x56, 0x42, 0x00); // Partial cut

    return new Uint8Array(commands);
  }

  /**
   * Direct Bluetooth ESC/POS Print
   */
  public async printBluetooth(data: any, type: string = 'pos'): Promise<{ success: boolean; message: string }> {
    if (!this.isConnected()) {
      const conn = await this.connectBluetooth();
      if (!conn.success) return conn;
    }

    try {
      const bytes = this.buildEscPosData(data, type, this.settings);
      const sent = await this.sendRawBytes(bytes);
      if (sent) {
        return { success: true, message: 'Print job sent successfully to Bluetooth thermal printer.' };
      }
      return { success: false, message: 'Failed to write bytes to Bluetooth characteristic.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Bluetooth printing failed.' };
    }
  }

  /**
   * Browser / System Print with dynamic CSS roll width adjustment
   */
  public printSystem(settings?: PrinterSettings): void {
    const s = settings || this.settings;
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--receipt-paper-width', s.paperWidth === '58mm' ? '58mm' : '80mm');
    }
    window.print();
  }

  /**
   * Format receipt text for WhatsApp / Copying
   */
  public generateReceiptText(data: any, type: string = 'pos', settings?: PrinterSettings): string {
    const s = settings || this.settings;
    const docNum = data.receiptNumber || data.invoiceNumber || data.orderNumber || data.returnNumber || data.creditNoteNumber || 'DOC-2026';
    const date = data.date || new Date().toISOString().split('T')[0];
    const time = data.time || '';
    const customer = data.customerName || 'عميل نقدي';
    const items = data.items || [];

    const lines: string[] = [
      `🧾 *${s.storeName}*`,
      `${s.storeNameEn}`,
      `الرقم الضريبي: ${s.taxNumber}`,
      `سجل تجاري: ${s.crNumber}`,
      `--------------------------------`,
      `📄 نوع السند: ${type === 'pos' ? 'إيصال مبيعات POS' : type === 'invoice' ? 'فاتورة ضريبية مبسطة' : 'سند طلب / مرتجع'}`,
      `🔢 رقم السند: ${docNum}`,
      `📅 التاريخ: ${date} ${time}`,
      `👤 العميل: ${customer}`,
      `--------------------------------`,
      `*الأصناف:*`
    ];

    items.forEach((it: any, i: number) => {
      lines.push(`${i + 1}. ${it.name}`);
      lines.push(`   ${it.enteredQty || 1} × ${(it.unitPrice || 0).toFixed(2)} = ${(it.lineTotal || 0).toFixed(2)} ج.م`);
    });

    lines.push(`--------------------------------`);
    lines.push(`المجموع الأساسي: ${(data.grossTotal || 0).toFixed(2)} ج.م`);
    if ((data.totalDiscount || 0) > 0) {
      lines.push(`الخصم: -${(data.totalDiscount || 0).toFixed(2)} ج.م`);
    }
    lines.push(`ضريبة القيمة المضافة (14%): +${(data.totalTax || 0).toFixed(2)} ج.م`);
    lines.push(`*💰 الإجمالي المستحق: ${(data.netDue || 0).toFixed(2)} ج.م*`);

    if (data.amountPaid !== undefined) {
      lines.push(`المدفوع (${data.paymentMethod === 'card' ? 'بطاقة' : 'نقداً'}): ${(data.amountPaid || 0).toFixed(2)} ج.م`);
      lines.push(`الفكة (المتبقي): ${(data.changeDue || 0).toFixed(2)} ج.م`);
    }

    lines.push(`--------------------------------`);
    lines.push(`📱 نظام نقاط البيع المحمول Honeywell EDA50`);
    lines.push(`${s.footerNote}`);

    return lines.join('\n');
  }

  /**
   * Share receipt via WhatsApp URL
   */
  public shareWhatsApp(data: any, type: string = 'pos', phone?: string): void {
    const text = this.generateReceiptText(data, type, this.settings);
    const encoded = encodeURIComponent(text);
    const targetPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const url = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  }
}

export const printerService = new PrinterService();
