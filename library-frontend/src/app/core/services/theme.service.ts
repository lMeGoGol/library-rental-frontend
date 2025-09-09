import { Injectable, effect, signal } from '@angular/core';


export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSig = signal<AppTheme>('light');
  theme$ = {
    subscribe: (fn: (v: AppTheme) => void) => {
      const stop = effect(() => fn(this.themeSig()));
      return { unsubscribe: () => (stop as any).destroy?.() } as any;
    }
  } as any;

  get theme(): AppTheme { return this.themeSig(); }

  toggle() {
    const next: AppTheme = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  setTheme(t: AppTheme) {
    if (t === this.theme) return;
    this.themeSig.set(t);
    document.documentElement.setAttribute('data-theme', t);
    document.body.setAttribute('data-theme', t);
    try { localStorage.setItem('app-theme', t); } catch {}
  }

  initFromPreference() {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let initial: AppTheme = 'light';
    try {
      const stored = localStorage.getItem('app-theme') as AppTheme | null;
      initial = stored || (prefersDark ? 'dark' : 'light');
    } catch {
      initial = prefersDark ? 'dark' : 'light';
    }
    this.themeSig.set(initial);
    document.documentElement.setAttribute('data-theme', initial);
    document.body.setAttribute('data-theme', initial);
  }

  persistCurrent() { try { localStorage.setItem('app-theme', this.theme); } catch {} }
}