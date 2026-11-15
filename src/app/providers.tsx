"use client";

import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Intercept and cleanly handle browser media play() abort and camera onabort/onerror errors
if (typeof window !== 'undefined') {
  if (window.HTMLMediaElement && window.HTMLMediaElement.prototype) {
    const originalPlay = window.HTMLMediaElement.prototype.play;
    window.HTMLMediaElement.prototype.play = function (...args) {
      const promise = originalPlay.apply(this, args);
      if (promise && typeof promise.catch === 'function') {
        return promise.catch((err: any) => {
          const msg = err?.message || String(err);
          if (
            err?.name === 'AbortError' ||
            msg.includes('play()') ||
            msg.includes('interrupted') ||
            msg.includes('media was removed')
          ) {
            // Silently resolve benign media play interruption when elements unmount
            return;
          }
          return Promise.reject(err);
        });
      }
      return promise;
    };

    // Prevent html5-qrcode's explicit "throw RenderedCameraImpl video surface onabort() called"
    Object.defineProperty(window.HTMLMediaElement.prototype, 'onabort', {
      get() {
        return (this as any)._safeMediaOnAbort || null;
      },
      set(fn: any) {
        if (typeof fn === 'function') {
          (this as any)._safeMediaOnAbort = function (this: any, ...args: any[]) {
            try {
              return fn.apply(this, args);
            } catch (err: any) {
              const msg = typeof err === 'string' ? err : err?.message || '';
              if (msg.includes('RenderedCameraImpl') || msg.includes('onabort')) {
                // Benign camera abort when stopping or switching camera
                return;
              }
              throw err;
            }
          };
        } else {
          (this as any)._safeMediaOnAbort = fn;
        }
      },
      configurable: true,
      enumerable: true,
    });

    // Also guard onerror against explicit library throws
    Object.defineProperty(window.HTMLMediaElement.prototype, 'onerror', {
      get() {
        return (this as any)._safeMediaOnError || null;
      },
      set(fn: any) {
        if (typeof fn === 'function') {
          (this as any)._safeMediaOnError = function (this: any, ...args: any[]) {
            try {
              return fn.apply(this, args);
            } catch (err: any) {
              const msg = typeof err === 'string' ? err : err?.message || '';
              if (msg.includes('RenderedCameraImpl') || msg.includes('onerror')) {
                return;
              }
              throw err;
            }
          };
        } else {
          (this as any)._safeMediaOnError = fn;
        }
      },
      configurable: true,
      enumerable: true,
    });
  }

  const handleMediaAbort = (msg: string, name?: string) => {
    return (
      name === 'AbortError' ||
      msg.includes('play()') ||
      msg.includes('interrupted') ||
      msg.includes('media was removed') ||
      msg.includes('AbortError') ||
      msg.includes('RenderedCameraImpl') ||
      msg.includes('video surface onabort()') ||
      msg.includes('video surface onerror()') ||
      msg.includes('onabort() called') ||
      msg.includes('onerror() called')
    );
  };

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : (reason?.message || reason?.name || '');
    if (handleMediaAbort(msg, reason?.name)) {
      event.preventDefault();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
    }
  }, true);

  window.addEventListener('error', (event: ErrorEvent) => {
    const error = event.error;
    const msg = event.message || (typeof error === 'string' ? error : error?.message || '');
    if (handleMediaAbort(msg, error?.name)) {
      event.preventDefault();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      return true;
    }
  }, true);
}

// Silence next-themes script tag warning in React 19 / Next.js 15+
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return;
    orig.apply(console, args);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider forcedTheme="light" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
