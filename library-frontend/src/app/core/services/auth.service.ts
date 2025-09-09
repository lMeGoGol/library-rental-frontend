import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { tap, map } from "rxjs/operators";
import { environment } from "../../../environment/environment";
import { User, LoginDto, RegisterDto, AuthResponse, Role } from "../models/user.model";
import { UserService } from "./user.service";
import { LoggerService } from "./logger.service";


@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private userService = inject(UserService);
    private logger = inject(LoggerService);

    private userState = new BehaviorSubject<User | null>(this.readUserFromToken());
    user$ = this.userState.asObservable();

    register(data: RegisterDto): Observable<User | null> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
            tap(res => res?.token && this.saveToken(res.token)),
            map(() => this.readUserFromToken())
        );
    }

    login(data: LoginDto): Observable<User | null> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data).pipe(
            tap(res => res?.token && this.saveToken(res.token)),
            map(() => this.readUserFromToken())
        );
    }

    logout(): void {
        localStorage.removeItem('token');
        this.userState.next(null);
    }

    token(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.token();
    }

    private saveToken(token: string) {
        localStorage.setItem('token', token);
    this.userState.next(this.readUserFromToken());
    this.enrichUser();
    }

    private decode(): { id?: string; role?: Role; username?: string } | null {
        const token = this.token();
        if (!token) return null;

        try {
            const payload = token.split('.')[1];
            if (!payload) return null;
            // Fix padding for base64url if needed
            let b64 = payload.replace(/-/g, "+").replace(/_/g, '/');
            const pad = b64.length % 4;
            if (pad === 2) b64 += '=='; else if (pad === 3) b64 += '='; else if (pad === 1) { /* invalid length */ }
            const json = atob(b64);
            const parsed = JSON.parse(json);
            this.logger.debug('AuthService', 'decoded token payload', parsed);
            return parsed;
        } catch (e) {
            this.logger.warn('AuthService', 'Failed to decode token', e);
            return null;
        }
    }

    private readUserFromToken(): User | null {
        const payload = this.decode();
        if (!payload || !payload.id) return null;

        const rawRole = (payload.role ?? 'reader') as string;
        return {
            id: payload.id,
            username: payload.username ?? '',
            role: (rawRole.toLowerCase() as Role),
        };
    }

    private enrichUser() {
        const u = this.userState.value;
        if (!u) return;
        this.userService.getProfile('me').subscribe({
            next: profile => { this.logger.debug('AuthService', 'fetched profile', profile); this.userState.next({ ...u, ...profile }); },
            error: (err) => { this.logger.warn('AuthService', 'enrichUser failed', err); }
        });
    }

    user(): User | null {
        return this.userState.value;
    }

    hasRole(roleOrRoles: string | string[]): boolean {
        const u = this.user();
        if (!u) return false;
        if (Array.isArray(roleOrRoles)) return roleOrRoles.includes(u.role);
        return u.role === roleOrRoles;
    }
}

    