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
    <section class="auth-hero">
      <div class="container">
        <h1>Reset password</h1>
        <p>Set a new password for your Memora account.</p>
      </div>
    </section>

    <div class="container auth-form-container">
      <div class="auth-form">
        @if (state() === 'loading') {
          <p class="status-text">Verifying your reset link…</p>
        }

        @if (state() === 'invalid') {
          <h2 class="form-title">Link not valid</h2>
          <p class="status-text">
            This reset link is missing, invalid, or has already been used. Request a new reset email.
          </p>
          <a routerLink="/forgot-password" class="btn btn-primary btn-lg">Request new link</a>
          <p class="back-wrap">
            <a routerLink="/login" class="link-back">← Back to sign in</a>
          </p>
        }

        @if (state() === 'form' || state() === 'submitting') {
          <h2 class="form-title">Choose a new password</h2>
          <p class="hint">Use at least 6 characters.</p>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <form (ngSubmit)="submit()" autocomplete="off">
            <div class="form-group">
              <label for="rp-new">New password</label>
              <input id="rp-new" type="password" [(ngModel)]="newPassword" name="n" autocomplete="new-password" required />
            </div>
            <div class="form-group">
              <label for="rp-confirm">Confirm password</label>
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
    .form-title {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
      color: var(--text);
    }
    .hint {
      margin: 0 0 1.25rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .status-text {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
      color: var(--text);
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
    .error-msg {
      background: #fef2f2;
      color: #c53030;
      padding: 1rem;
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
      color: var(--primary);
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
