/**
 * Browser Polyfills & Compatibility Layer for Chrome 101.0.4951.61
 * (including Android System WebView / Honeywell ScanPal EDA50 handheld browser)
 *
 * Ensures all Web APIs and ECMAScript features introduced after Chrome 101
 * or restricted on plain HTTP / enterprise handheld networks function properly.
 */

// 1. URL.canParse (Chrome 120+)
if (typeof URL !== 'undefined' && typeof (URL as any).canParse !== 'function') {
  (URL as any).canParse = function (url: string | URL, base?: string | URL): boolean {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

// 2. AbortSignal.timeout (Chrome 103+)
if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout !== 'function') {
  (AbortSignal as any).timeout = function (ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => {
      try {
        controller.abort(new DOMException('The operation timed out.', 'TimeoutError'));
      } catch {
        controller.abort();
      }
    }, ms);
    return controller.signal;
  };
}

// 3. Array.prototype.toSorted (Chrome 110+)
if (!(Array.prototype as any).toSorted) {
  (Array.prototype as any).toSorted = function <T>(this: T[], compareFn?: (a: T, b: T) => number): T[] {
    return [...this].sort(compareFn);
  };
}

// 4. Array.prototype.toReversed (Chrome 110+)
if (!(Array.prototype as any).toReversed) {
  (Array.prototype as any).toReversed = function <T>(this: T[]): T[] {
    return [...this].reverse();
  };
}

// 5. Array.prototype.toSpliced (Chrome 110+)
if (!(Array.prototype as any).toSpliced) {
  (Array.prototype as any).toSpliced = function <T>(
    this: T[],
    start: number,
    deleteCount?: number,
    ...items: T[]
  ): T[] {
    const copy = [...this];
    if (typeof deleteCount === 'undefined') {
      copy.splice(start);
    } else {
      copy.splice(start, deleteCount, ...items);
    }
    return copy;
  };
}

// 6. Array.prototype.with (Chrome 110+)
if (!(Array.prototype as any).with) {
  (Array.prototype as any).with = function <T>(this: T[], index: number, value: T): T[] {
    const copy = [...this];
    const n = copy.length;
    const actualIndex = index < 0 ? n + index : index;
    if (actualIndex < 0 || actualIndex >= n) {
      throw new RangeError(`Invalid index: ${index}`);
    }
    copy[actualIndex] = value;
    return copy;
  };
}

// 7. Array.prototype.findLast & findLastIndex (Safeguard)
if (!(Array.prototype as any).findLast) {
  (Array.prototype as any).findLast = function <T>(
    this: T[],
    predicate: (value: T, index: number, obj: T[]) => boolean,
    thisArg?: any
  ): T | undefined {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) {
        return this[i];
      }
    }
    return undefined;
  };
}

if (!(Array.prototype as any).findLastIndex) {
  (Array.prototype as any).findLastIndex = function <T>(
    this: T[],
    predicate: (value: T, index: number, obj: T[]) => boolean,
    thisArg?: any
  ): number {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) {
        return i;
      }
    }
    return -1;
  };
}

// 8. Object.groupBy & Map.groupBy (Chrome 117+)
if (!(Object as any).groupBy) {
  (Object as any).groupBy = function <T, K extends PropertyKey>(
    items: Iterable<T>,
    callbackFn: (item: T, index: number) => K
  ): Partial<Record<K, T[]>> {
    const result: any = Object.create(null);
    let i = 0;
    for (const item of items) {
      const key = callbackFn(item, i++);
      if (key in result) {
        result[key].push(item);
      } else {
        result[key] = [item];
      }
    }
    return result;
  };
}

if (typeof Map !== 'undefined' && !(Map as any).groupBy) {
  (Map as any).groupBy = function <T, K>(
    items: Iterable<T>,
    callbackFn: (item: T, index: number) => K
  ): Map<K, T[]> {
    const map = new Map<K, T[]>();
    let i = 0;
    for (const item of items) {
      const key = callbackFn(item, i++);
      const group = map.get(key);
      if (group) {
        group.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    return map;
  };
}

// 9. Promise.withResolvers (Chrome 119+)
if (!(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// 10. Document.prototype.startViewTransition (Chrome 111+)
if (typeof document !== 'undefined' && !(document as any).startViewTransition) {
  (document as any).startViewTransition = function (callback?: () => void | Promise<void>) {
    const updateCallbackDone = Promise.resolve().then(() => {
      if (callback) return callback();
    });
    return {
      finished: updateCallbackDone,
      ready: Promise.resolve(),
      updateCallbackDone,
      skipTransition: () => {},
    };
  };
}

// 11. crypto.randomUUID (Chrome 92, fallback for insecure contexts / older WebViews on LAN IP)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    ) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

export {};
