import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-first-login-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login-page">
      <div class="admin-login-bg" aria-hidden="true"></div>
      <div class="admin-login-overlay"></div>

      <div class="admin-login-content">
        <header class="brand-block">
          <p class="brand-kicker">Admin</p>
          <h1 class="brand-title">Memora</h1>
          <p class="brand-sub">Set your new password</p>
        </header>

        <p class="intro">
          Choose a new password. You will be signed out and sent to the login page to sign in with your email or username and this new password.
        </p>

        <form (ngSubmit)="submit()" class="auth-form" autocomplete="off">
          <div class="form-group">
            <label for="new-pw">New password</label>
            <input
              id="new-pw"
              type="password"
              [(ngModel)]="newPassword"
              name="new"
              autocomplete="new-password"
              required
            />
          </div>
          <div class="form-group">
            <label for="confirm-pw">Confirm new password</label>
            <input
              id="confirm-pw"
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirm"
              autocomplete="new-password"
              required
            />
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
            {{ loading() ? 'Saving...' : 'Save password and go to login' }}
          </button>
          <p class="hint">On the next screen, sign in with the same email or username you used before and the password you just set.</p>
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
    .brand-sub {
      margin: 0 0 1rem;
      font-size: 1rem;
      opacity: 0.92;
    }
    .intro {
      color: rgba(255, 255, 255, 0.95);
      text-align: center;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0 0 1.25rem;
      text-shadow: 0 1px 12px rgba(0, 0, 0, 0.35);
    }
    .auth-form {
      background: rgba(255, 255, 255, 0.97);
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.5);
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
    .hint {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
      line-height: 1.45;
    }
    .btn-lg {
      width: 100%;
      padding: 1rem;
      margin-top: 0.25rem;
    }
  `]
})
export class FirstLoginPasswordComponent {
  newPassword = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService) {}

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
      this.error.set('New password and confirmation do not match.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.firstLoginResetPassword(this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.auth.logout({ passwordUpdated: '1' });
      },
      error: (err) => {
        const msg =
          typeof err.error === 'string'
            ? err.error
            : (err.error?.message || 'Could not update password.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
