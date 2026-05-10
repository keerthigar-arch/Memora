import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
    return false;
  }
  if (auth.isAdmin()) return true;
  window.location.href = environment.customerPortalUrl;
  return false;
};
