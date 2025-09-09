import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { Observable, map } from 'rxjs';
import { CreateReservationDto, Reservation, mapReservation, mapReservations } from '../models/reservation.model';
import { sanitizeParams } from '../utils/http-params';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  create(payload: CreateReservationDto): Observable<Reservation> {
    return this.http.post<any>(`${this.base}/loans/reserve`, payload).pipe(map(mapReservation));
  }

  getAll(params?: Record<string, any>): Observable<Page<Reservation>> {
    return this.http.get<any>(`${this.base}/reservations`, { params: sanitizeParams(params) }).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return { items: mapReservations(res) } as Page<Reservation>;
        return {
          items: mapReservations(res?.items ?? res ?? []),
          total: res?.total,
          page: res?.page,
          limit: res?.limit,
          pages: res?.pages,
        } as Page<Reservation>;
      })
    );
  }

  list(params?: Record<string, any>): Observable<Reservation[]> {
    return this.getAll(params).pipe(map(p => p.items));
  }

  getMine(params?: Record<string, any>): Observable<Page<Reservation>> {
    return this.http.get<any>(`${this.base}/reservations/mine`, { params: sanitizeParams(params) }).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return { items: mapReservations(res) } as Page<Reservation>;
        return {
          items: mapReservations(res?.items ?? res ?? []),
          total: res?.total,
          page: res?.page,
          limit: res?.limit,
          pages: res?.pages,
        } as Page<Reservation>;
      })
    );
  }

  listMine(params?: Record<string, any>): Observable<Reservation[]> {
    return this.getMine(params).pipe(map(p => p.items));
  }

  cancel(id: string, reason?: string): Observable<{ message: string; reservation: Reservation }> {
    const payload: any = reason ? { reason } : {};
    return this.http.post<any>(`${this.base}/reservations/${id}/cancel`, payload).pipe(
      map((res: any) => ({ message: res?.message ?? 'Cancelled', reservation: mapReservation(res?.reservation ?? res) }))
    );
  }

  // Helper to cancel silently when we detect inconsistency (e.g. book already issued)
  autoCancel(id: string, reason = 'Книга недоступна'): Observable<void> {
    return this.http.post<any>(`${this.base}/reservations/${id}/cancel`, { reason }).pipe(map(() => void 0));
  }
}
