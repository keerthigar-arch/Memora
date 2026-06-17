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
    <section class="auth-hero">
      <div class="container">
        <h1>Forgot password</h1>
        <p>We will send a reset link to the email on your account.</p>
      </div>
    </section>

    <div class="container auth-form-container">
      <div class="auth-form">
        @if (!expiredFlow()) {
          <p class="intro">
            Enter the <strong>email address</strong> you use to sign in. The link is valid for <strong>30 minutes</strong>.
          </p>
        }

        @if (expiredFlow()) {
          <div class="banner-expired" role="status">
            Your reset link has expired. Enter your email below to receive a new link.
          </div>
        }

        @if (successMessage()) {
          <div class="success-msg" role="status">{{ successMessage() }}</div>
        }
        @if (devResetUrl()) {
          <div class="dev-reset-banner" role="region" aria-label="Development reset link">
            <p class="dev-reset-title">No real email in dev mode — open this link to reset:</p>
            <a class="dev-reset-link" [href]="devResetUrl()!" target="_blank" rel="noopener noreferrer">{{
              devResetUrl()
            }}</a>
            <p class="dev-reset-hint">
              Set <code>Smtp:DevLogOnly</code> to false and configure SMTP for inbox delivery.
            </p>
          </div>
        }
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <form (ngSubmit)="submit()" autocomplete="on">
          <div class="form-group">
            <label for="fp-email">Email</label>
            <input
              id="fp-email"
              type="email"
              inputmode="email"
              [(ngModel)]="email"
              name="email"
              autocomplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
            {{ loading() ? 'Sending…' : 'Send reset link' }}
          </button>
        </form>

        <p class="auth-link">
          <a routerLink="/login">← Back to sign in</a>
        </p>
      </div>
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
    .auth-form-container { max-width: 440px; margin: 0 auto; padding: 2rem 1.5rem; }
    .auth-form {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .intro {
      margin: 0 0 1.25rem;
      font-size: 0.92rem;
      line-height: 1.55;
      color: var(--text-muted);
    }
    .intro strong { color: var(--text); }
    .banner-expired {
      background: #fffbeb;
      color: #92400e;
      padding: 0.85rem 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: 0.9rem;
      border: 1px solid #fcd34d;
    }
    .form-group {
      margin-bottom: 1.25rem;
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
    .form-group input {
      width: 100%;
      padding: 0.72rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font: inherit;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
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
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: 0.9rem;
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
      background: rgba(255, 255, 255, 0.9);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .btn-lg { width: 100%; padding: 1rem; margin-top: 0.25rem; }
    .auth-link { text-align: center; margin-top: 1.5rem; }
    .auth-link a { font-weight: 600; color: var(--primary); text-decoration: none; }
    .auth-link a:hover { text-decoration: underline; }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  email = '';
  loading = signal(false);
  error = signal('');
  successMessage = signal('');
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
    const id = this.email.trim().toLowerCase();
    if (!id) {
      this.error.set('Email is required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');
    this.devResetUrl.set(null);
    this.auth.forgotPassword(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(
          res.message ?? 'Password reset instructions have been sent to your email address.'
        );
        this.devResetUrl.set(res.devEmailSkipped && res.resetUrl ? res.resetUrl : null);
        this.email = '';
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
            ? 'Forgot-password API is not available. Restart the backend and try again.'
            : typeof err.error === 'string'
              ? err.error
              : ((body as { message?: string }).message ?? err.message ?? 'Something went wrong. Try again.');
        this.error.set(msg + detail);
      }
    });
  }
}
