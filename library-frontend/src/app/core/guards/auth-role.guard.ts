import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

// Combined guard: checks login + optional roles array in route data
export const authRoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  const need: string[] = route.data?.['roles'] || [];
  if (need.length === 0) return true;
  const u = auth.user();
  if (u && need.includes(u.role)) return true;
  logger.debug('authRoleGuard', 'denied', { need, has: u?.role });
  router.navigate(['/forbidden']);
  return false;
};
