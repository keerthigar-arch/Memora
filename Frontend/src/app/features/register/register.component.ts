import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="auth-hero">
      <div class="container">
        <h1>Create Account</h1>
        <p>Join Life Events Memory Keeper to preserve and share memories.</p>
      </div>
    </section>

    <div class="container auth-form-container">
      <form (ngSubmit)="submit()" class="auth-form">
        <div class="form-group">
          <label>Email *</label>
          <input type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label>Display Name *</label>
          <input [(ngModel)]="displayName" name="displayName" placeholder="How you'll appear" required />
        </div>
        <div class="form-group">
          <label>Password *</label>
          <input type="password" [(ngModel)]="password" name="password" placeholder="At least 6 characters" required />
        </div>
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
        <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
          {{ loading() ? 'Creating account...' : 'Register' }}
        </button>
        <p class="auth-link">
          Already have an account? <a routerLink="/login">Sign In</a>
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
    .auth-link { text-align: center; margin-top: 1.5rem; color: var(--text-muted); }
    .auth-link a { font-weight: 600; }
    .btn-lg { width: 100%; padding: 1rem; margin-top: 0.5rem; }
  `]
})
export class RegisterComponent {
  email = '';
  displayName = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.email.trim() || !this.displayName.trim() || !this.password) {
      this.error.set('All fields are required.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.email.trim(), this.password, this.displayName.trim()).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
