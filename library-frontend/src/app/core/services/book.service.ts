import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Book, BookDto, mapBook, mapBooks } from '../models/book.model';
import { sanitizeParams } from '../utils/http-params';
import { Page } from '../models/page.model';


@Injectable({ providedIn: 'root' })
export class BookService {
    private base = `${environment.apiUrl}/books`;

    constructor(private http: HttpClient) {}

    page(params?: Record<string, any>): Observable<Page<Book>> {
        return this.http.get<any>(this.base, { params: sanitizeParams(params) }).pipe(
            map((res: any) => {
                if (Array.isArray(res)) return { items: mapBooks(res) } as Page<Book>;
                return {
                    items: mapBooks(res?.items ?? res ?? []),
                    total: res?.total,
                    page: res?.page,
                    limit: res?.limit,
                    pages: res?.pages,
                } as Page<Book>;
            })
        );
    }

    list(params?: Record<string, any>): Observable<Book[]> {
        return this.page(params).pipe(map(p => p.items));
    }

    uploadImage(file: File): Observable<{ url: string }> {
        const form = new FormData();
        form.append('file', file);
        return this.http.post<{ url: string }>(`${environment.apiUrl}/uploads/image`, form);
    }

    getById(id: string): Observable<Book> {
        return this.http.get<any>(`${this.base}/${id}`).pipe(
            map(mapBook)
        );
    }

    create(payload: BookDto): Observable<Book> {
        return this.http.post<any>(this.base, payload).pipe(
            map(mapBook)
        );
    }

    update(id: string, payload: Partial<BookDto>): Observable<Book> {
        return this.http.put<any>(`${this.base}/${id}`, payload).pipe(
            map(mapBook)
        );
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    releaseReservation(id: string): Observable<any> {
        return this.http.post<any>(`${this.base}/${id}/release-reservation`, {});
    }
}