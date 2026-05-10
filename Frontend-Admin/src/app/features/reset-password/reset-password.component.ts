import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type ViewState = 'loading' | 'invalid' | 'form' | 'submitting';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-login-page">
      <div class="admin-login-bg" aria-hidden="true"></div>
      <div class="admin-login-overlay"></div>

      <div class="admin-login-content">
        <header class="brand-block">
          <p class="brand-kicker">Admin</p>
          <h1 class="brand-title">Memora</h1>
        </header>

        <div class="auth-form">
          @if (state() === 'loading') {
            <p class="status-text">Verifying your reset link…</p>
          }

          @if (state() === 'invalid') {
            <h2 class="form-title">Link not valid</h2>
            <p class="status-text">
              This reset link is missing, invalid, or has already been used. Request a new reset email to continue.
            </p>
            <a routerLink="/forgot-password" class="btn btn-primary btn-lg">Request new link</a>
            <p class="back-wrap">
              <a routerLink="/login" class="link-back">← Back to sign in</a>
            </p>
          }

          @if (state() === 'form' || state() === 'submitting') {
            <h2 class="form-title">Set a new password</h2>
            <p class="hint">Choose a password at least 6 characters long.</p>

            @if (error()) {
              <div class="error-msg">{{ error() }}</div>
            }

            <form (ngSubmit)="submit()" autocomplete="off">
              <div class="form-group">
                <label for="rp-new">New password</label>
                <input id="rp-new" type="password" [(ngModel)]="newPassword" name="n" autocomplete="new-password" required />
              </div>
              <div class="form-group">
                <label for="rp-confirm">Confirm new password</label>
                <input
                  id="rp-confirm"
                  type="password"
                  [(ngModel)]="confirmPassword"
                  name="c"
                  autocomplete="new-password"
                  required
                />
              </div>
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="state() === 'submitting'">
                {{ state() === 'submitting' ? 'Saving…' : 'Update password' }}
              </button>
            </form>
            <p class="back-wrap">
              <a routerLink="/login" class="link-back">← Back to sign in</a>
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.25rem;
      position: relative;
      overflow: hidden;
    }
    .admin-login-bg {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(13, 61, 50, 0.88) 0%, rgba(26, 95, 74, 0.75) 45%, rgba(0, 0, 0, 0.55) 100%),
        url('/assets/images/admin-login-bg.jpg') center/cover no-repeat;
    }
    .admin-login-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, transparent 55%);
      pointer-events: none;
    }
    .admin-login-content {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
    }
    .brand-block {
      text-align: center;
      margin-bottom: 0.5rem;
      color: #fff;
      text-shadow: 0 2px 24px rgba(0, 0, 0, 0.35);
    }
    .brand-kicker {
      font-size: 0.75rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin: 0 0 0.35rem;
      opacity: 0.9;
    }
    .brand-title {
      font-family: var(--font-display);
      font-size: 2.5rem;
      font-weight: 600;
      margin: 0 0 1.25rem;
      color: #fff;
    }
    .auth-form {
      background: rgba(255, 255, 255, 0.97);
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .form-title {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
      color: var(--text);
    }
    .hint {
      margin: 0 0 1.25rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.45;
    }
    .status-text {
      margin: 0 0 1.25rem;
      font-size: 0.95rem;
      line-height: 1.5;
      color: var(--text);
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text);
    }
    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: var(--font-body);
      font-size: 1rem;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: 2px solid var(--primary-light);
      border-color: transparent;
    }
    .error-msg {
      background: #fef2f2;
      color: #c53030;
      padding: 0.85rem 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .btn-lg {
      display: inline-block;
      width: 100%;
      text-align: center;
      text-decoration: none;
      padding: 1rem;
      box-sizing: border-box;
      margin-top: 0.25rem;
    }
    .back-wrap {
      margin: 1.25rem 0 0;
      text-align: center;
    }
    .link-back {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary, #0d3d32);
      text-decoration: none;
    }
    .link-back:hover {
      text-decoration: underline;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  state = signal<ViewState>('loading');
  error = signal('');
  newPassword = '';
  confirmPassword = '';
  private tokenValue = '';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const t = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    if (!t) {
      this.state.set('invalid');
      return;
    }
    this.tokenValue = t;
    this.auth.validateResetPasswordToken(t).subscribe({
      next: (r) => {
        if (r.expired) {
          void this.router.navigate(['/forgot-password'], { queryParams: { expired: '1' }, replaceUrl: true });
          return;
        }
        if (!r.valid) {
          this.state.set('invalid');
          return;
        }
        this.state.set('form');
      },
      error: () => this.state.set('invalid')
    });
  }

  submit() {
    if (!this.newPassword || !this.confirmPassword) {
      this.error.set('Both password fields are required.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.error.set('New password must be at least 6 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.error.set('');
    this.state.set('submitting');
    this.auth.resetPasswordWithToken(this.tokenValue, this.newPassword).subscribe({
      next: () => {
        void this.router.navigate(['/login'], { queryParams: { passwordReset: '1' } });
      },
      error: (err) => {
        this.state.set('form');
        const body = err.error;
        if (body?.expired === true) {
          void this.router.navigate(['/forgot-password'], { queryParams: { expired: '1' } });
          return;
        }
        const msg =
          typeof body === 'string' ? body : (body?.message ?? 'Could not reset password. Try requesting a new link.');
        this.error.set(msg);
      }
    });
  }
}
