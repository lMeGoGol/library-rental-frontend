import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot  } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';


export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const logger = inject(LoggerService);

    const roles: string[] = route.data?.['roles'] || [];

    if (!auth.isLoggedIn()) {
        logger.debug('roleGuard', 'not logged in, redirecting to /login');
        router.navigate(['/login']);
        return false;
    }

    if (roles.length === 0) return true;

    const user = auth.user();
    logger.debug('roleGuard', 'required roles', roles, 'current user', user);
    if (user && roles.includes(user.role)) return true;

    logger.debug('roleGuard', 'access denied, redirect /forbidden');
    router.navigate(['/forbidden']);
    return false;
};