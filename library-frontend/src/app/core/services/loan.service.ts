import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Loan, IssueLoanDto, ReturnLoanDto, mapLoan, mapLoans } from '../models/loan.model';
import { sanitizeParams } from '../utils/http-params';
import { Page } from '../models/page.model';


@Injectable({ providedIn: 'root' })
export class LoanService {
    private base = `${environment.apiUrl}/loans`;

    constructor(private http: HttpClient) {}

    issue(payload: IssueLoanDto): Observable<{ loan: Loan; payableNow: number }> {
        return this.http.post<any>(`${this.base}/issue`, payload).pipe(
            map(res => ({ loan: mapLoan(res.loan), payableNow: res.payableNow }))
        );
    }

    issuePreview(payload: Partial<IssueLoanDto> & { dueDate?: string }): Observable<{ days: number; discountPercent: number; rentPerDay: number; totalRent: number; deposit: number; payableNow: number; expectedReturnDate: string; }> {
        return this.http.post<any>(`${this.base}/issue/preview`, payload);
    }

    returnLoan(id: string, payload: ReturnLoanDto = {}): Observable<{ loan: Loan; settlement: any }> {
        return this.http.post<any>(`${this.base}/return/${id}`, payload).pipe(
            map(res => ({ loan: mapLoan(res.loan), settlement: res.settlement }))
        );
    }

    previewReturn(id: string): Observable<{ penalty: number; penaltyPerDay: number; alreadyReturned?: boolean }> {
        return this.http.get<any>(`${this.base}/preview-return/${id}`);
    }

    getDamageLevels(): Observable<Array<{ value: 'minor'|'moderate'|'severe'; label: string; fee: number }>> {
        return this.http.get<Array<{ value: any; label: string; fee: number }>>(`${this.base}/damage-levels`).pipe(
            map(levels => levels.map(l => ({ value: l.value as 'minor'|'moderate'|'severe', label: l.label, fee: l.fee })))
        );
    }

    page(params?: Record<string, any>): Observable<Page<Loan>> {
        return this.http.get<any>(this.base, { params: sanitizeParams(params) }).pipe(
            map((res: any) => {
                if (Array.isArray(res)) return { items: mapLoans(res) } as Page<Loan>;
                return {
                    items: mapLoans(res?.items ?? res ?? []),
                    total: res?.total,
                    page: res?.page,
                    limit: res?.limit,
                    pages: res?.pages,
                } as Page<Loan>;
            })
        );
    }

    list(params?: Record<string, any>): Observable<Loan[]> {
        return this.page(params).pipe(map(p => p.items));
    }

    getById(id: string): Observable<Loan> {
        return this.http.get<any>(`${this.base}/${id}`).pipe(
            map(mapLoan)
        );
    }

    renew(id: string, extraDays: number): Observable<Loan> {
        return this.http.post<any>(`${this.base}/renew/${id}`, { extraDays }).pipe(
            map(mapLoan)
        );
    }

    listOverdue(params?: Record<string, any>): Observable<Page<Loan>> {
        return this.http.get<any>(`${this.base}/overdue`, { params: sanitizeParams(params) }).pipe(
            map((res: any) => {
                if (Array.isArray(res)) return { items: mapLoans(res) } as Page<Loan>;
                return {
                    items: mapLoans(res?.items ?? res ?? []),
                    total: res?.total,
                    page: res?.page,
                    limit: res?.limit,
                    pages: res?.pages,
                } as Page<Loan>;
            })
        );
    }
}