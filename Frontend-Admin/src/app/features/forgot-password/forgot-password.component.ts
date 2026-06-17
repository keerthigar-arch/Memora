import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
          <h2 class="form-title">Forgot password</h2>
          @if (!expiredFlow()) {
            <p class="intro">
              Enter the <strong>email address</strong> for your admin account (or the <strong>username</strong> you use to sign in if you have one).
              The reset link is always sent to the <strong>email on file</strong> for that account. Links expire after 30 minutes.
            </p>
          }

          @if (expiredFlow()) {
            <div class="banner-expired" role="status">
              Your reset link has expired (links are valid for 30 minutes). Enter your email address below to receive a new reset email.
            </div>
          }

          @if (successMessage()) {
            <div class="success-msg" role="status">{{ successMessage() }}</div>
          }
          @if (devResetUrl()) {
            <div class="dev-reset-banner" role="region" aria-label="Development reset link">
              <p class="dev-reset-title">No real email in dev mode — open this link to reset your password:</p>
              <a class="dev-reset-link" [href]="devResetUrl()!" target="_blank" rel="noopener noreferrer">{{
                devResetUrl()
              }}</a>
              <p class="dev-reset-hint">
                Turn off <code>Smtp:DevLogOnly</code> and configure Gmail when you want messages in your inbox.
              </p>
            </div>
          }
          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <form (ngSubmit)="submit()" autocomplete="on">
            <div class="form-group">
              <label for="fp-email">Email address</label>
              <input
                id="fp-email"
                type="text"
                inputmode="email"
                [(ngModel)]="userName"
                name="userName"
                autocomplete="email"
                placeholder="you@company.com"
                required
              />
              <p class="field-hint">If you only have a username from your administrator, enter it here; we will still email the address on your account.</p>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
              {{ loading() ? 'Sending…' : 'Send reset email' }}
            </button>
          </form>

          <p class="back-wrap">
            <a routerLink="/login" class="link-back">← Back to sign in</a>
          </p>
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
    .intro {
      margin: 0 0 1.25rem;
      font-size: 0.92rem;
      line-height: 1.55;
      color: var(--text-muted);
      text-align: left;
    }
    .intro strong {
      color: var(--text);
    }
    .field-hint {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      line-height: 1.45;
      color: var(--text-muted);
    }
    .banner-expired {
      background: #fffbeb;
      color: #92400e;
      padding: 0.85rem 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: 0.9rem;
      line-height: 1.5;
      border: 1px solid #fcd34d;
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
    .success-msg {
      background: #ecfdf5;
      color: #047857;
      padding: 0.85rem 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: 0.9rem;
      border: 1px solid #a7f3d0;
    }
    .dev-reset-banner {
      background: #eff6ff;
      border: 1px solid #93c5fd;
      border-radius: var(--radius);
      padding: 1rem;
      margin-bottom: 1rem;
      font-size: 0.88rem;
      line-break: anywhere;
    }
    .dev-reset-title {
      margin: 0 0 0.5rem;
      font-weight: 600;
      color: #1e3a5f;
    }
    .dev-reset-link {
      display: block;
      word-break: break-all;
      color: #1d4ed8;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    .dev-reset-hint {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .dev-reset-hint code {
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.8);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
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
export class ForgotPasswordComponent implements OnInit {
  userName = '';
  loading = signal(false);
  error = signal('');
  successMessage = signal('');
  /** Set when API runs with Smtp:DevLogOnly — reset URL shown instead of inbox delivery. */
  devResetUrl = signal<string | null>(null);
  expiredFlow = signal(false);

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((q) => {
      const e = q.get('expired');
      this.expiredFlow.set(e === '1' || e === 'true');
    });
  }

  submit() {
    const id = this.userName.trim().toLowerCase();
    if (!id) {
      this.error.set('Email address is required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');
    this.devResetUrl.set(null);
    this.auth.forgotPassword(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message ?? 'Password reset instructions have been sent to your email address.');
        this.devResetUrl.set(res.devEmailSkipped && res.resetUrl ? res.resetUrl : null);
        this.userName = '';
      },
      error: (err) => {
        this.loading.set(false);
        const body = typeof err.error === 'object' && err.error !== null ? err.error : {};
        const detail =
          typeof (body as { detail?: string }).detail === 'string'
            ? ` ${(body as { detail: string }).detail}`
            : '';
        const msg =
          err.status === 404
            ? 'Forgot-password API is not available. Restart Backend with the latest code and try again.'
            : typeof err.error === 'string'
              ? err.error
              : ((body as { message?: string }).message ?? err.message ?? 'Something went wrong. Try again.');
        this.error.set(msg + detail);
      }
    });
  }
}
