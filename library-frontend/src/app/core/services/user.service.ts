import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { Observable, catchError, map, of } from 'rxjs';
import { User, mapUser } from '../models/user.model';
import { sanitizeParams } from '../utils/http-params';
import { Page } from '../models/page.model';


@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);
    private api = `${environment.apiUrl}/users`;

    page(params?: Record<string, any>): Observable<Page<User>> {
        return this.http.get<any>(this.api, { params: sanitizeParams(params) }).pipe(
            map((res: any) => {
                if (Array.isArray(res)) return { items: (res || []).map(mapUser) } as Page<User>;
                return {
                    items: (res?.items ?? res ?? []).map(mapUser),
                    total: res?.total,
                    page: res?.page,
                    limit: res?.limit,
                    pages: res?.pages,
                } as Page<User>;
            })
        );
    }

    getAll(params?: Record<string, any>): Observable<User[]> {
        return this.page(params).pipe(map(p => p.items));
    }

    getById(id: string): Observable<User> {
        return this.http.get<any>(`${this.api}/${id}`).pipe(
            map(mapUser)
        );
    }

    update(id: string, data: Partial<User>): Observable<User> {
        return this.http.put<any>(`${this.api}/${id}`, data).pipe(
            map(mapUser)
        );
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }

    setRole(id: string, role: string): Observable<User> {
        return this.http.post<any>(`${this.api}/${id}/role`, { role }).pipe(
            map(r => mapUser(r.user ?? r))
        );
    }

    setDiscount(id: string, discountCategory: string): Observable<User> {
        return this.http.post<any>(`${this.api}/${id}/discount`, { discountCategory }).pipe(
            map(r => mapUser(r.user ?? r))
        );
    }

    getProfile(id: string): Observable<User> {
        if (id === 'me') {
            return this.http.get<any>(`${this.api}/me`).pipe(map(mapUser));
        }
        return this.getById(id);
    }

    changeMyPassword(currentPassword: string, newPassword: string) {
        return this.http.post<{ message: string }>(`${this.api}/me/change-password`, { currentPassword, newPassword });
    }

    adminChangePassword(id: string, newPassword: string) {
        return this.http.post<{ message: string }>(`${this.api}/${id}/change-password`, { newPassword });
    }

    checkUsername(username: string) {
        return this.http.get<{ taken: boolean }>(`${this.api}/check-username`, { params: { username } }).pipe(
            map(r => r.taken),
            catchError(() => of(false))
        );
    }
}