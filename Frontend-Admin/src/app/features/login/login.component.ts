import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
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

        <form (ngSubmit)="submit()" class="auth-form" autocomplete="on">
          <div class="form-group">
            <label for="admin-username">Email or username</label>
            <input
              id="admin-username"
              type="text"
              [(ngModel)]="username"
              name="username"
              autocomplete="username"
              placeholder="Admin email or username from your invite"
              required
            />
          </div>

          <div class="form-group">
            <label for="admin-password">Password</label>
            <div class="password-field">
              <input
                id="admin-password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
                placeholder="Password"
                required
              />
              <button
                type="button"
                class="password-toggle"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg class="eye-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  @if (showPassword) {
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  } @else {
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  }
                </svg>
              </button>
            </div>
            <div class="form-meta">
              <a routerLink="/forgot-password" class="link-forgot">Forgot password?</a>
            </div>
          </div>

          @if (successMessage()) {
            <div class="success-msg" role="status">{{ successMessage() }}</div>
          }
          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
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
      margin: 0 0 0.25rem;
      color: #fff;
    }
    .brand-block .brand-title {
      margin-bottom: 1.75rem;
    }
    .auth-form {
      background: rgba(255, 255, 255, 0.97);
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text);
    }
    .form-group input:not(.password-field input) {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: var(--font-body);
      font-size: 1rem;
    }
    .form-group input:not(.password-field input):focus {
      outline: 2px solid var(--primary-light);
      border-color: transparent;
    }
    .password-field {
      position: relative;
      display: flex;
      align-items: stretch;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: #fff;
      overflow: hidden;
    }
    .password-field:focus-within {
      outline: 2px solid var(--primary-light);
      border-color: transparent;
    }
    .password-field input {
      flex: 1;
      width: 100%;
      min-width: 0;
      padding: 0.75rem 1rem;
      padding-right: 2.75rem;
      border: none;
      border-radius: 0;
      font-family: var(--font-body);
      font-size: 1rem;
      background: transparent;
    }
    .password-field input:focus {
      outline: none;
    }
    .password-toggle {
      position: absolute;
      right: 0.25rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      color: var(--text-muted);
    }
    .password-toggle:hover {
      color: var(--text);
    }
    .form-meta {
      text-align: right;
      margin-top: -0.35rem;
      margin-bottom: 0.25rem;
    }
    .link-forgot {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary, #0d3d32);
      text-decoration: none;
    }
    .link-forgot:hover {
      text-decoration: underline;
    }
    .eye-svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    .success-msg {
      background: #ecfdf5;
      color: #047857;
      padding: 0.85rem 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: 0.9rem;
      border: 1px solid #a7f3d0;
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
      width: 100%;
      padding: 1rem;
      margin-top: 0.25rem;
    }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showPassword = false;
  loading = signal(false);
  error = signal('');
  successMessage = signal('');
  returnUrl = '/';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const q = this.route.snapshot.queryParams;
    this.returnUrl = (q['returnUrl'] as string) || '';
    if (q['passwordUpdated'] === '1') {
      this.successMessage.set('Password updated. Sign in with your email or username and new password.');
    }
    if (q['passwordReset'] === '1') {
      this.successMessage.set('Your password was reset. Sign in with your email or username and new password.');
    }
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) return;
    if (!this.auth.isAdmin()) return;
    const u = this.auth.currentUser();
    if (!u) return;
    const { mustReset } = this.auth.parseLoginResponse({ token: this.auth.getToken() ?? '', user: u });
    if (mustReset || this.auth.hasPendingFirstLogin()) {
      void this.router.navigateByUrl('/first-login-password');
      return;
    }
    const dest =
      this.returnUrl && this.returnUrl !== '/login' && !this.returnUrl.startsWith('/login?')
        ? this.returnUrl
        : '/events';
    void this.router.navigateByUrl(dest);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  submit() {
    const id = this.username.trim().toLowerCase();
    if (!id || !this.password) {
      this.error.set('Email or username and password are required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');
    this.auth.login(id, this.password).subscribe({
      next: (res) => {
        const { isAdmin, mustReset } = this.auth.parseLoginResponse(res);
        if (!isAdmin) {
          this.error.set('This account is not authorized for admin access.');
          this.loading.set(false);
          this.auth.logout();
          return;
        }
        if (mustReset) {
          this.loading.set(false);
          this.router.navigateByUrl('/first-login-password');
          return;
        }
        this.loading.set(false);
        if (this.returnUrl && this.returnUrl !== '/login') {
          this.router.navigateByUrl(this.returnUrl);
          return;
        }
        this.router.navigateByUrl('/events');
      },
      error: (err) => {
        const msg =
          err.status === 0 || err.status === 404
            ? 'Cannot reach server. Is the API running at http://localhost:5000?'
            : typeof err.error === 'string'
              ? err.error
              : (err.error?.message || 'Invalid username or password.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
