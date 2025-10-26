// Type definitions for Wake Lock API
declare global {
  interface Navigator {
    wakeLock?: {
      request(type: 'screen'): Promise<WakeLockSentinel>;
    };
  }

  interface WakeLockSentinel {
    readonly released: boolean;
    readonly type: 'screen';
    release(): Promise<void>;
    addEventListener(type: 'release', listener: (event: Event) => void): void;
    removeEventListener(type: 'release', listener: (event: Event) => void): void;
  }
}

export {};