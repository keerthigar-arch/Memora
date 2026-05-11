import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

const REMEMBER_EMAIL_KEY = 'memora_customer_login_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="auth-hero">
      <div class="container">
        <h1>Login</h1>
        <p>Welcome back to Memora.</p>
      </div>
    </section>

    <div class="container auth-form-container">
      <form (ngSubmit)="submit()" class="auth-form">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            [(ngModel)]="email"
            name="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="login-password">Password</label>
          <div class="password-wrap">
            <input
              id="login-password"
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="password-eye"
              (click)="showPassword = !showPassword"
              [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
            >
              @if (showPassword) {
                <svg class="eye-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              } @else {
                <svg class="eye-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              }
            </button>
          </div>
        </div>

        <div class="login-options">
          <label class="remember-wrap">
            <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
            <span>Remember me</span>
          </label>
          <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
        </div>

        @if (passwordResetOk()) {
          <div class="success-msg" role="status">Password updated. You can sign in with your new password.</div>
        }
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
        <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
          {{ loading() ? 'Logging in…' : 'Login' }}
        </button>
        <button type="button" class="btn btn-outline btn-test" (click)="useTestAccount()">
          Use test account
        </button>
        <p class="auth-link">
          Don't have an account?
          <a routerLink="/register" [queryParams]="returnUrl ? { returnUrl: returnUrl } : {}">Register</a>
        </p>
      </form>
    </div>
  `,
  styles: [`
    .auth-hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .auth-hero h1 { color: white; margin-bottom: 0.5rem; }
    .auth-form-container { max-width: 400px; margin: 0 auto; padding: 2rem 1.5rem; }
    .auth-form {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .form-group input[type="email"],
    .password-wrap input {
      width: 100%;
      padding: 0.72rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font: inherit;
      font-size: 0.95rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .form-group input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
    }
    .password-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .password-wrap input {
      padding-right: 3rem;
    }
    .password-eye {
      position: absolute;
      right: 0.35rem;
      top: 50%;
      transform: translateY(-50%);
      width: 2.5rem;
      height: 2.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--primary);
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .password-eye:hover {
      background: rgba(26, 95, 74, 0.08);
      color: var(--primary-dark);
    }
    .eye-svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    .login-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .remember-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      cursor: pointer;
      font-size: 0.88rem;
      color: var(--text);
      margin: 0;
      font-weight: 500;
    }
    .remember-wrap input {
      width: 1rem;
      height: 1rem;
      accent-color: var(--primary);
      cursor: pointer;
    }
    .forgot-link {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--primary);
      text-decoration: none;
    }
    .forgot-link:hover {
      text-decoration: underline;
      color: var(--primary-dark);
    }
    .success-msg {
      background: #ecfdf5;
      color: #047857;
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: 0.92rem;
      border: 1px solid #a7f3d0;
    }
    .error-msg { background: #fef2f2; color: #c53030; padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; }
    .btn-test { width: 100%; margin-top: 0.75rem; }
    .auth-link { text-align: center; margin-top: 1.5rem; color: var(--text-muted); }
    .auth-link a { font-weight: 600; }
    .btn-lg { width: 100%; padding: 1rem; margin-top: 0.5rem; }
  `]
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  loading = signal(false);
  error = signal('');
  passwordResetOk = signal(false);
  returnUrl = '/';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const q = this.route.snapshot.queryParams;
    this.returnUrl = (q['returnUrl'] as string) || '';
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParams;
    if (q['passwordReset'] === '1') {
      this.passwordResetOk.set(true);
    }
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) {
      this.email = saved;
      this.rememberMe = true;
    }
  }

  useTestAccount(): void {
    this.email = 'test@example.com';
    this.password = 'password123';
    this.error.set('');
    this.submit();
  }

  submit(): void {
    if (!this.email.trim() || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        if (this.rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, this.email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
        if (this.returnUrl && this.returnUrl !== '/login') {
          this.router.navigateByUrl(this.returnUrl);
          return;
        }
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        const msg =
          err.status === 0 || err.status === 404
            ? 'Cannot reach server. Is the API running at http://localhost:5000?'
            : (err.error?.message || err.error || 'Invalid email or password.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
