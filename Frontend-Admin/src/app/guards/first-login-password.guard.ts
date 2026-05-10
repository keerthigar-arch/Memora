import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

/** Only allows access when admin must reset password; otherwise sends them to the app. */
export const firstLoginPasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (!auth.isAdmin()) {
    window.location.href = environment.customerPortalUrl;
    return false;
  }
  const needsReset = !!auth.currentUser()?.mustChangePassword || auth.hasPendingFirstLogin();
  if (!needsReset) {
    router.navigateByUrl('/events');
    return false;
  }
  return true;
};
