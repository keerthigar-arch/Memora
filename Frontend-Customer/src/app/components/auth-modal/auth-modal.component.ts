import { Component, HostListener, OnDestroy, inject, afterNextRender, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthUiService } from '../../services/auth-ui.service';

const REMEMBER_EMAIL_KEY = 'memora_customer_login_email';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-backdrop" (click)="close()" aria-hidden="true"></div>
    <div
      class="auth-shell"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'auth-modal-title'"
      (click)="$event.stopPropagation()"
    >
      <button type="button" class="auth-close" (click)="close()" aria-label="Close dialog">✕</button>

      <div class="auth-accent" aria-hidden="true"></div>

      <div class="auth-head">
        <div class="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            id="auth-tab-login"
            aria-controls="auth-panel-login"
            [attr.aria-selected]="authUi.panel() === 'login'"
            class="auth-tab"
            [class.active]="authUi.panel() === 'login'"
            (click)="switchTo('login')"
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            id="auth-tab-register"
            aria-controls="auth-panel-register"
            [attr.aria-selected]="authUi.panel() === 'register'"
            class="auth-tab"
            [class.active]="authUi.panel() === 'register'"
            (click)="switchTo('register')"
          >
            Register
          </button>
        </div>
        <h2 id="auth-modal-title" class="auth-title">
          {{ authUi.panel() === 'login' ? 'Login' : 'Register' }}
        </h2>
        <p class="auth-lede">
          {{
            authUi.panel() === 'login'
              ? 'Enter your email and password to access your account.'
              : 'Create an account to leave wishes and follow stories.'
          }}
        </p>
      </div>

      @if (authUi.panel() === 'login') {
        <form
          id="auth-panel-login"
          role="tabpanel"
          aria-labelledby="auth-tab-login"
          class="auth-form"
          (ngSubmit)="submitLogin()"
        >
          <label class="auth-field">
            <span class="auth-label">Email</span>
            <input
              type="email"
              name="m-email"
              [(ngModel)]="loginEmail"
              autocomplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label class="auth-field">
            <span class="auth-label">Password</span>
            <div class="auth-password-wrap">
              <input
                [type]="loginShowPw ? 'text' : 'password'"
                name="m-password"
                [(ngModel)]="loginPassword"
                autocomplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                class="auth-eye"
                (click)="loginShowPw = !loginShowPw"
                [attr.aria-label]="loginShowPw ? 'Hide password' : 'Show password'"
              >
                @if (loginShowPw) {
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
          </label>
          <div class="auth-login-row">
            <label class="auth-check">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
              <span>Remember me</span>
            </label>
            <a routerLink="/forgot-password" class="auth-forgot" (click)="close()">Forgot password?</a>
          </div>
          @if (loginError()) {
            <div class="auth-error">{{ loginError() }}</div>
          }
          <button type="submit" class="auth-submit" [disabled]="loginLoading()">
            {{ loginLoading() ? 'Logging in…' : 'Login' }}
          </button>
        </form>
      } @else {
        <form
          id="auth-panel-register"
          role="tabpanel"
          aria-labelledby="auth-tab-register"
          class="auth-form"
          (ngSubmit)="submitRegister()"
        >
          <label class="auth-field">
            <span class="auth-label">Email</span>
            <input
              type="email"
              name="r-email"
              [(ngModel)]="regEmail"
              autocomplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label class="auth-field">
            <span class="auth-label">Display name</span>
            <input
              type="text"
              name="r-name"
              [(ngModel)]="regDisplayName"
              autocomplete="name"
              placeholder="How you’ll appear"
              required
            />
          </label>
          <label class="auth-field">
            <span class="auth-label">Password</span>
            <input
              type="password"
              name="r-password"
              [(ngModel)]="regPassword"
              autocomplete="new-password"
              placeholder="At least 6 characters"
              required
            />
          </label>
          @if (regError()) {
            <div class="auth-error">{{ regError() }}</div>
          }
          <button type="submit" class="auth-submit" [disabled]="regLoading()">
            {{ regLoading() ? 'Registering…' : 'Register' }}
          </button>
        </form>
      }
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      pointer-events: none;
    }
    .auth-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 35, 30, 0.45);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      pointer-events: auto;
    }
    .auth-shell {
      pointer-events: auto;
      position: relative;
      width: 100%;
      max-width: 420px;
      max-height: min(90vh, 640px);
      overflow-y: auto;
      background: linear-gradient(180deg, #ffffff 0%, #f9fdfb 100%);
      border-radius: 20px;
      box-shadow:
        0 4px 6px rgba(13, 61, 50, 0.04),
        0 24px 48px rgba(13, 61, 50, 0.14),
        0 0 0 1px rgba(26, 95, 74, 0.08);
      padding: 1.75rem 1.65rem 1.35rem;
    }
    .auth-accent {
      position: absolute;
      top: 0;
      left: 1.25rem;
      right: 1.25rem;
      height: 4px;
      border-radius: 0 0 6px 6px;
      background: linear-gradient(90deg, #0d3d32, #2f7e66, #c9a227);
      opacity: 0.9;
    }
    .auth-close {
      position: absolute;
      top: 0.85rem;
      right: 0.85rem;
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      border-radius: 10px;
      background: rgba(26, 95, 74, 0.08);
      color: #35584f;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .auth-close:hover {
      background: rgba(26, 95, 74, 0.15);
      color: #0d3d32;
    }
    .auth-head {
      text-align: center;
      margin-bottom: 1.35rem;
      padding-top: 0.35rem;
    }
    .auth-tabs {
      display: inline-flex;
      padding: 4px;
      border-radius: 999px;
      background: #eef5f1;
      border: 1px solid #d8e8e0;
      margin-bottom: 1.1rem;
    }
    .auth-tab {
      border: none;
      background: transparent;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #55726a;
      padding: 0.45rem 1.15rem;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    }
    .auth-tab.active {
      background: #fff;
      color: #0d3d32;
      box-shadow: 0 2px 10px rgba(26, 95, 74, 0.12);
    }
    .auth-title {
      font-family: var(--font-display);
      font-size: 1.45rem;
      font-weight: 700;
      color: #0f2922;
      margin: 0 0 0.35rem;
      line-height: 1.2;
    }
    .auth-lede {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.5;
      color: #5a6f68;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
    }
    .auth-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin: 0;
    }
    .auth-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #46675f;
    }
    .auth-field input {
      width: 100%;
      padding: 0.72rem 0.85rem;
      border: 1px solid #d0e0d8;
      border-radius: 12px;
      font: inherit;
      font-size: 0.92rem;
      background: #fff;
      color: #1a2e28;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .auth-field input::placeholder {
      color: #94a8a0;
    }
    .auth-field input:focus {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
    }
    .auth-password-wrap {
      display: flex;
      align-items: stretch;
      gap: 0;
      border: 1px solid #d0e0d8;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      transition: box-shadow 0.15s ease;
    }
    .auth-password-wrap:focus-within {
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
    }
    .auth-password-wrap input {
      border: none;
      border-radius: 0;
      box-shadow: none;
      flex: 1;
      min-width: 0;
    }
    .auth-password-wrap input:focus {
      box-shadow: none;
    }
    .auth-eye {
      flex-shrink: 0;
      width: 2.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      border-left: 1px solid #e0ebe6;
      background: #f8fbf9;
      color: #1a5f4a;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .auth-eye:hover {
      background: #eef5f1;
      color: #0d3d32;
    }
    .eye-svg {
      width: 1.2rem;
      height: 1.2rem;
    }
    .auth-login-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: -0.15rem;
    }
    .auth-check {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      margin: 0;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 500;
      color: #334942;
    }
    .auth-check input {
      width: 1rem;
      height: 1rem;
      accent-color: #1a5f4a;
      cursor: pointer;
    }
    .auth-forgot {
      font-size: 0.82rem;
      font-weight: 600;
      color: #1a5f4a;
      text-decoration: none;
    }
    .auth-forgot:hover {
      text-decoration: underline;
      color: #0d3d32;
    }
    .auth-error {
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 0.82rem;
      line-height: 1.4;
    }
    .auth-submit {
      margin-top: 0.25rem;
      width: 100%;
      padding: 0.82rem 1rem;
      border: none;
      border-radius: 12px;
      font: inherit;
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 55%, #2d8f73 100%);
      box-shadow: 0 6px 18px rgba(13, 61, 50, 0.25);
      transition: transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease;
    }
    .auth-submit:hover:not(:disabled) {
      filter: brightness(1.04);
      transform: translateY(-1px);
    }
    .auth-submit:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }
    @media (max-width: 480px) {
      .auth-shell {
        padding: 1.5rem 1.2rem 1.2rem;
        border-radius: 16px;
      }
      .auth-title {
        font-size: 1.28rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .auth-submit:hover:not(:disabled) {
        transform: none;
      }
    }
  `]
})
export class AuthModalComponent implements OnDestroy {
  readonly authUi = inject(AuthUiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loginEmail = '';
  loginPassword = '';
  loginShowPw = false;
  rememberMe = false;
  loginLoading = signal(false);
  loginError = signal('');

  regEmail = '';
  regDisplayName = '';
  regPassword = '';
  regLoading = signal(false);
  regError = signal('');

  private prevOverflow = '';

  constructor() {
    afterNextRender(() => {
      this.prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        this.loginEmail = saved;
        this.rememberMe = true;
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.prevOverflow;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    this.authUi.close();
  }

  /** After login/register: resume pricing order choice, redirect URL, or home feed. */
  private finishModalAuthSuccess(): void {
    const pendingPkg = this.authUi.pendingPricingPackageIndex();
    const redirect = this.authUi.postAuthRedirectUrl();
    this.authUi.hidePanel();
    if (pendingPkg !== null) {
      this.authUi.setPostAuthRedirect(null);
      return;
    }
    if (redirect?.trim()) {
      const url = redirect.trim();
      this.authUi.setPostAuthRedirect(null);
      void this.router.navigateByUrl(url);
      return;
    }
    void this.router.navigateByUrl('/');
  }

  switchTo(tab: 'login' | 'register'): void {
    if (tab === 'login') this.authUi.openLogin();
    else this.authUi.openRegister();
    this.loginError.set('');
    this.regError.set('');
  }

  submitLogin(): void {
    if (!this.loginEmail.trim() || !this.loginPassword) {
      this.loginError.set('Email and password are required.');
      return;
    }
    this.loginLoading.set(true);
    this.loginError.set('');
    this.auth.login(this.loginEmail.trim(), this.loginPassword).subscribe({
      next: () => {
        if (this.rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, this.loginEmail.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
        this.loginLoading.set(false);
        this.finishModalAuthSuccess();
      },
      error: (err) => {
        const msg =
          err.status === 0 || err.status === 404
            ? 'Cannot reach server. Is the API running?'
            : (err.error?.message || err.error || 'Invalid email or password.');
        this.loginError.set(typeof msg === 'string' ? msg : 'Login failed.');
        this.loginLoading.set(false);
      }
    });
  }

  submitRegister(): void {
    if (!this.regEmail.trim() || !this.regDisplayName.trim() || !this.regPassword) {
      this.regError.set('All fields are required.');
      return;
    }
    if (this.regPassword.length < 6) {
      this.regError.set('Password must be at least 6 characters.');
      return;
    }
    this.regLoading.set(true);
    this.regError.set('');
    this.auth.register(this.regEmail.trim(), this.regPassword, this.regDisplayName.trim()).subscribe({
      next: () => {
        this.regLoading.set(false);
        this.finishModalAuthSuccess();
      },
      error: (err) => {
        this.regError.set(err.error?.message || 'Registration failed. Please try again.');
        this.regLoading.set(false);
      }
    });
  }
}
