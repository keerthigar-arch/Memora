import { Injectable, signal } from '@angular/core';

/** Opens login/register overlays from the customer shell (header, footer, pricing order flow). */
@Injectable({ providedIn: 'root' })
export class AuthUiService {
  readonly panel = signal<'login' | 'register' | null>(null);

  /** After modal login/register on the pricing page: open payment-method choice for this column index. */
  readonly pendingPricingPackageIndex = signal<number | null>(null);

  /** After modal login/register: navigate here instead of the home feed (e.g. `/pricing/order?…`). */
  readonly postAuthRedirectUrl = signal<string | null>(null);

  openLogin(): void {
    this.panel.set('login');
  }

  openRegister(): void {
    this.panel.set('register');
  }

  queuePricingOrderAfterAuth(packageColumnIndex: number): void {
    this.pendingPricingPackageIndex.set(packageColumnIndex);
  }

  clearPendingPricingPackage(): void {
    this.pendingPricingPackageIndex.set(null);
  }

  setPostAuthRedirect(url: string | null): void {
    this.postAuthRedirectUrl.set(url?.trim() || null);
  }

  /** Hide only the overlay (after successful auth — resume state read first). */
  hidePanel(): void {
    this.panel.set(null);
  }

  /** User dismissed auth — cancel queued order / redirect. */
  close(): void {
    this.panel.set(null);
    this.pendingPricingPackageIndex.set(null);
    this.postAuthRedirectUrl.set(null);
  }
}
