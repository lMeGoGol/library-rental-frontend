import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { catchError, throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';


const CODE_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: 'Невірний логін або пароль',
    USERNAME_TAKEN: 'Логін зайнятий',
    USER_NOT_FOUND: 'Користувача не знайдено',
    BOOK_NOT_FOUND: 'Книгу не знайдено',
    BOOK_UNAVAILABLE: 'Книга недоступна',
    LOAN_NOT_FOUND: 'Позику не знайдено',
    ALREADY_RETURNED: 'Вже повернуто',
    FORBIDDEN: 'Немає доступу',
    NO_TOKEN: 'Потрібно увійти',
    INVALID_TOKEN: 'Сесія недійсна, увійдіть знову',
    TOKEN_EXPIRED: 'Сесія закінчилася, будь ласка, увійдіть знову',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const auth = inject(AuthService);
    const notify = inject(NotificationService);
    const logger = inject(LoggerService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const backend = (error.error && error.error.error) ? error.error.error : error.error;
            const code: string | undefined = backend?.code;
            const baseMessage = backend?.message || error.message || 'Помилка';
            const EN_UA_MAP: Record<string,string> = {
                'forbidden': 'Немає доступу',
                'access denied': 'Немає доступу',
                'unauthorized': 'Потрібно увійти',
                'invalid credentials': 'Невірний логін або пароль',
                'user not found': 'Користувача не знайдено',
                'book not found': 'Книгу не знайдено',
                'not found': 'Не знайдено',
            };
            let friendly = (code && CODE_MESSAGES[code]) ? CODE_MESSAGES[code] : baseMessage;
            const lower = friendly.toLowerCase();
            Object.entries(EN_UA_MAP).forEach(([en, ua]) => {
                if (lower.includes(en)) friendly = ua;
            });

            const currentUrl = router.url || '';
            const isGuestPage = currentUrl.startsWith('/login') || currentUrl.startsWith('/register');
            const hasStoredToken = !!auth.token();
            const isUsernameCheck = req.url.includes('/check-username');

            // Dev log for diagnostics (no user-facing change)
            logger.warn('errorInterceptor', `${req.method} ${req.url}`, 'status', error.status, 'code', code ?? backend?.name ?? '-', 'msg', friendly);

            if (error.status === 401) {
                const isExpired = code === 'TOKEN_EXPIRED' || ((backend && (backend.name === 'TokenExpiredError')) || (String(friendly).toLowerCase().includes('expired')));
                if (hasStoredToken) {
                    if (isExpired) {
                        auth.logout();
                        notify.error(friendly || 'Потрібно увійти');
                        if (!currentUrl.startsWith('/login')) router.navigate(['/login']);
                    } else {
                        if (!isGuestPage && !isUsernameCheck) notify.error(friendly || 'Потрібно увійти');
                    }
                } else {
                    if (!isGuestPage && !isUsernameCheck) {
                        notify.error(friendly || 'Потрібно увійти');
                        router.navigate(['/login']);
                    }
                }
            } else if (error.status === 403) {
                notify.error(friendly || 'Немає доступу');
            } else if (error.status >= 500) {
                notify.error('Серверна помилка');
            } else if (error.status >= 400) {
                notify.error(friendly);
            }

            return throwError(() => error);
        })
    );
};