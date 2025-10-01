import { logger } from './logger';

export function asItems<T = any>(resp: any): T[] {
  if (Array.isArray(resp)) return resp as T[];
  if (Array.isArray(resp?.items)) return resp.items as T[];
  return [];
}

export function logOnce(key: string, ...args: any[]) {
  if (typeof window === 'undefined') return;
  (window as any).__once ||= new Set<string>();
  const s = (window as any).__once as Set<string>;
  if (s.has(key)) return;
  s.add(key);
  
  // Only log important warnings, not debug info
  const message = args.join(' ');
  if (message.includes('error') || message.includes('failed') || message.includes('401')) {
    logger.warn(message, { type: 'proxy_error', key });
  }
}
