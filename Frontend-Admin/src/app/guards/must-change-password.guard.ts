import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

function isAdminRole(role: string | undefined): boolean {
  return (role ?? '').trim().toLowerCase() === 'admin';
}

/** Blocks admin app until the user completes a mandatory password change (first login). */
export const mustChangePasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const u = auth.currentUser();
  if (!isAdminRole(u?.role)) return true;
  const needsReset = !!u?.mustChangePassword || auth.hasPendingFirstLogin();
  if (!needsReset) return true;
  router.navigate(['/first-login-password']);
  return false;
};
