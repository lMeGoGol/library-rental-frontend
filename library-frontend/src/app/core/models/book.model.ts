export interface Book {
  id: string;
  title: string;
  author: string;
  thumbnailUrl?: string;
  deposit: number;
  rentPrice: number;
  genre: string;
  available?: boolean;
  quantity?: number;
  availableCount?: number;
  isReserved?: boolean;
  reservedUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookDto {
  title: string;
  author: string;
  thumbnailUrl?: string;
  deposit: number;
  rentPrice: number;
  genre: string;
  available?: boolean;
  quantity?: number;
  availableCount?: number;
  isReserved?: boolean;
  reservedUntil?: string;
}

import { environment } from '../../../environment/environment';

export function mapBook(raw: any): Book {
  const toAbsolute = (u?: string) => {
    if (!u) return u as any;
    try {
      return new URL(u).toString();
    } catch {
      // If it's a relative '/uploads/..' path, prefix with API origin (without /api)
      if (typeof u === 'string' && u.startsWith('/')) {
        const apiBase = new URL(environment.apiUrl, window.location.origin);
        const origin = `${apiBase.protocol}//${apiBase.host}`;
        return `${origin}${u}`;
      }
      return u;
    }
  };
  return {
    id: raw._id ?? raw.id,
    title: raw.title,
    author: raw.author,
  thumbnailUrl: toAbsolute(raw.thumbnailUrl),
    deposit: Number(raw.deposit),
    rentPrice: Number(raw.rentPrice),
    genre: raw.genre,
    available: raw.available ?? true,
  quantity: raw.quantity,
  availableCount: raw.availableCount,
  isReserved: raw.isReserved,
  reservedUntil: raw.reservedUntil,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapBooks(rawArray: any[]): Book[] {
  return rawArray.map(mapBook);
}
