import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="auth-hero">
      <div class="container">
        <h1>Sign In</h1>
        <p>Welcome back to Life Events Memory Keeper.</p>
      </div>
    </section>

    <div class="container auth-form-container">
      <form (ngSubmit)="submit()" class="auth-form">
        <div class="form-group">
          <label>Email *</label>
          <input type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required />
        </div>



        <div class="form-group">
          <label>Password *</label>
          <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />

<button 
              type="button" 
              class="password-toggle" 
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
            >
              <span class="eye-icon">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
            </button>

        </div>
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
        <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
          {{ loading() ? 'Signing in...' : 'Sign In' }}
        </button>
        <button type="button" class="btn btn-outline btn-test" (click)="useTestAccount()">
          Use test account
        </button>
        <p class="auth-link">
          Don't have an account? <a routerLink="/register">Register</a>
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
    .error-msg { background: #fef2f2; color: #c53030; padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; }
    .btn-test { width: 100%; margin-top: 0.75rem; }
    .auth-link { text-align: center; margin-top: 1.5rem; color: var(--text-muted); }
    .auth-link a { font-weight: 600; }
    .btn-lg { width: 100%; padding: 1rem; margin-top: 0.5rem; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  showpassword = false;
  loading = signal(false);
  error = signal('');
  returnUrl = '/';
togglePasswordVisibility: any;
showPassword: any;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const q = this.route.snapshot.queryParams;
    this.returnUrl = (q['returnUrl'] as string) || '';
  }

  useTestAccount() {
    this.email = 'test@example.com';
    this.password = 'password123';
    this.error.set('');
    this.submit();
  }

  submit() {
    if (!this.email.trim() || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        if (this.returnUrl && this.returnUrl !== '/login') {
          this.router.navigateByUrl(this.returnUrl);
          return;
        }
        const dest = this.auth.isAdmin() ? '/admin' : '/';
        this.router.navigateByUrl(dest);
      },
      error: (err) => {
        const msg = err.status === 0 || err.status === 404
          ? 'Cannot reach server. Is the API running at http://localhost:5000?'
          : (err.error?.message || err.error || 'Invalid email or password.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}





