import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (loading()) {
      <div class="container loading-wrap"><div class="spinner"></div><p>Loading your account...</p></div>
    } @else if (profile()) {
      <div class="container account-page">
        <h1>My Account</h1>
        <p class="subtitle">View your admin account details and reset your password.</p>

        <section class="card">
          <h2>Account Details</h2>

          <div class="details-grid">
            <div class="detail-item">
              <label>Email</label>
              <p>{{ profile()!.email }}</p>
            </div>
            <div class="detail-item">
              <label>Role</label>
              <p>{{ profile()!.role || 'Admin' }}</p>
            </div>
            <div class="detail-item">
              <label>Joined</label>
              <p>{{ profile()!.createdAt | date: 'mediumDate' }}</p>
            </div>
            <div class="detail-item">
              <label>Display Name</label>
              <p>{{ profile()!.displayName }}</p>
            </div>
          </div>

          <form (ngSubmit)="saveProfile()" class="form-block">
            <h3>Update Profile</h3>
            <div class="form-group">
              <label>Display Name</label>
              <input [(ngModel)]="displayName" name="displayName" required />
            </div>
            <div class="form-group">
              <label>Bio</label>
              <textarea [(ngModel)]="bio" name="bio" rows="3" placeholder="Tell others about yourself"></textarea>
            </div>
            @if (profileError()) {
              <div class="error-msg">{{ profileError() }}</div>
            }
            <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">Save Profile</button>
          </form>
        </section>

        <section class="card">
          <h2>Reset Password</h2>

          <form (ngSubmit)="changePasswordSubmit()" class="form-block">
            <div class="form-group">
              <label>Current Password</label>
              <input type="password" [(ngModel)]="currentPassword" name="currentPassword" required />
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input type="password" [(ngModel)]="newPassword" name="newPassword" required />
            </div>
            @if (passwordError()) {
              <div class="error-msg">{{ passwordError() }}</div>
            }
            @if (passwordSuccess()) {
              <div class="success-msg">Password updated successfully.</div>
            }
            <button type="submit" class="btn btn-primary" [disabled]="savingPassword()">Update Password</button>
          </form>

          <div class="divider"></div>
          <div class="alt-reset">
            <p>If you forgot your current password, send a reset link to:</p>
            <p class="email-line">{{ profile()!.email }}</p>
            @if (forgotError()) {
              <div class="error-msg">{{ forgotError() }}</div>
            }
            @if (forgotSuccess()) {
              <div class="success-msg">{{ forgotSuccess() }}</div>
            }
            <button type="button" class="btn btn-outline" [disabled]="sendingForgot()" (click)="sendResetEmail()">
              {{ sendingForgot() ? 'Sending...' : 'Send Reset Email' }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    .loading-wrap { text-align: center; padding: 4rem; }
    .account-page {
      max-width: 760px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    h1 { margin: 0 0 0.25rem; }
    .subtitle {
      margin: 0 0 1.5rem;
      color: var(--text-muted);
    }
    .card {
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 2rem;
      margin-bottom: 1.25rem;
    }
    .card h2 {
      margin: 0 0 1rem;
      font-size: 1.2rem;
    }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem 1rem;
      margin-bottom: 1.5rem;
    }
    .detail-item label {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.2rem;
    }
    .detail-item p {
      margin: 0;
      font-weight: 500;
    }
    .form-block {
      margin-top: 1rem;
    }
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 600;
    }
    .form-group input, .form-group textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.75rem;
      font: inherit;
      box-sizing: border-box;
    }
    .divider {
      border-top: 1px solid var(--border);
      margin: 1.25rem 0;
    }
    .alt-reset p {
      margin: 0 0 0.4rem;
      color: var(--text-muted);
    }
    .email-line {
      font-weight: 600;
      color: var(--text);
    }
    .error-msg { background: #fef2f2; color: #c53030; padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; }
    .success-msg { background: #f0fdf4; color: #166534; padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  displayName = '';
  bio = '';
  currentPassword = '';
  newPassword = '';

  savingProfile = signal(false);
  savingPassword = signal(false);
  sendingForgot = signal(false);
  profileError = signal('');
  passwordError = signal('');
  passwordSuccess = signal(false);
  forgotError = signal('');
  forgotSuccess = signal('');

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.profile.set(user);
      this.displayName = user.displayName;
      this.bio = user.bio ?? '';
    }
    this.auth.refreshProfile().subscribe({
      next: (u) => {
        this.profile.set(u);
        this.displayName = u.displayName;
        this.bio = u.bio ?? '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveProfile() {
    this.savingProfile.set(true);
    this.profileError.set('');
    this.auth.updateProfile(this.displayName, this.bio).subscribe({
      next: (u) => {
        this.profile.set(u);
        this.savingProfile.set(false);
      },
      error: (err) => {
        this.profileError.set(err.error?.message || 'Failed to update profile.');
        this.savingProfile.set(false);
      }
    });
  }

  changePasswordSubmit() {
    if (!this.currentPassword || !this.newPassword) {
      this.passwordError.set('Both fields are required.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError.set('New password must be at least 6 characters.');
      return;
    }
    if (this.newPassword === this.currentPassword) {
      this.passwordError.set('New password must be different from your current password.');
      return;
    }
    this.savingPassword.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set(false);
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.currentPassword = '';
        this.newPassword = '';
        this.passwordSuccess.set(true);
        this.savingPassword.set(false);
      },
      error: (err) => {
        const msg =
          typeof err.error === 'string'
            ? err.error
            : (err.error?.message || 'Failed to change password.');
        this.passwordError.set(msg);
        this.savingPassword.set(false);
      }
    });
  }

  sendResetEmail() {
    const account = this.profile();
    if (!account?.email) {
      this.forgotError.set('No email found for this account.');
      return;
    }

    this.sendingForgot.set(true);
    this.forgotError.set('');
    this.forgotSuccess.set('');

    this.auth.forgotPassword(account.email).subscribe({
      next: (res) => {
        this.forgotSuccess.set(res.message || 'Password reset instructions have been sent to your email address.');
        this.sendingForgot.set(false);
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error : (err.error?.message || 'Unable to send reset email.');
        this.forgotError.set(msg);
        this.sendingForgot.set(false);
      }
    });
  }
}
