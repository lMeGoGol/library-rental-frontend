import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment';


export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly order: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };
  private level: LogLevel;

  constructor() {
    const envLevel = (environment as any).logLevel as LogLevel | undefined;
    this.level = envLevel ?? (environment.production ? 'info' : 'debug');
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  isEnabled(level: LogLevel): boolean {
    return this.order[level] <= this.order[this.level];
  }

  error(scope: string, ...args: any[]) {
    console.error(`[${scope}]`, ...args);
  }

  warn(scope: string, ...args: any[]) {
    if (this.isEnabled('warn')) {
      console.warn(`[${scope}]`, ...args);
    }
  }

  info(scope: string, ...args: any[]) {
    if (!this.isEnabled('info')) return;
    if (typeof console.info === 'function') {
      console.info(`[${scope}]`, ...args);
    } else {
      console.log(`[${scope}]`, ...args);
    }
  }

  debug(scope: string, ...args: any[]) {
    if (!this.isEnabled('debug')) return;
    if (typeof console.debug === 'function') {
      console.debug(`[${scope}]`, ...args);
    } else {
      console.log(`[${scope}]`, ...args);
    }
  }
}
