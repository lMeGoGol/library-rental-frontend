import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const logger = inject(LoggerService);
    const token = auth.token();

    logger.debug('authInterceptor', 'request', req.url, 'hasToken?', !!token);

    if (!token) return next(req);

    const cloned = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        },
    });

    logger.debug('authInterceptor', 'attached Authorization header for', req.url);

    return next(cloned);
}