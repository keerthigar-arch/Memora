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
      <div class="container loading-wrap">
        <div class="spinner"></div>
        <p>Loading your account…</p>
      </div>
    } @else if (profile()) {
      <div class="profile-page">
        <header class="profile-hero" aria-labelledby="admin-profile-heading">
          <div class="profile-hero-glow" aria-hidden="true"></div>
          <div class="container profile-hero-inner">
            <p class="hero-eyebrow">Admin</p>
            <div class="profile-identity">
              <div class="avatar-ring" [class.has-photo]="!!profile()!.profileImageUrl">
                @if (profile()!.profileImageUrl) {
                  <img [src]="profile()!.profileImageUrl" alt="" />
                } @else {
                  <span class="avatar-initials">{{ initials() }}</span>
                }
              </div>
              <div class="profile-identity-text">
                <h1 id="admin-profile-heading" class="profile-name">{{ profile()!.displayName }}</h1>
                <p class="profile-email">{{ profile()!.email }}</p>
                <div class="identity-chips">
                  <span class="chip">{{ profile()!.role || 'Admin' }}</span>
                  <span class="chip chip-outline">{{ profile()!.createdAt | date: 'mediumDate' }}</span>
                </div>
              </div>
            </div>
            <p class="hero-lede">View your account details, update your profile, and manage your password.</p>
          </div>
        </header>

        <div class="container profile-body">
          <div class="profile-columns">
            <div class="profile-col-main">
              <section class="profile-card">
                <p class="card-kicker">Account</p>
                <h2 class="visually-hidden">Account details</h2>
                <div class="details-grid">
                  <div class="detail-tile">
                    <span class="detail-tile-label">Email</span>
                    <p class="detail-tile-value">{{ profile()!.email }}</p>
                  </div>
                  <div class="detail-tile">
                    <span class="detail-tile-label">Role</span>
                    <p class="detail-tile-value">{{ profile()!.role || 'Admin' }}</p>
                  </div>
                  <div class="detail-tile">
                    <span class="detail-tile-label">Joined</span>
                    <p class="detail-tile-value">{{ profile()!.createdAt | date: 'mediumDate' }}</p>
                  </div>
                  <div class="detail-tile">
                    <span class="detail-tile-label">Display name</span>
                    <p class="detail-tile-value">{{ profile()!.displayName }}</p>
                  </div>
                </div>
                <form (ngSubmit)="saveProfile()" class="form-block">
                  <p class="form-section-label">Update profile</p>
                  <div class="form-group">
                    <label for="adm-name">Display name</label>
                    <input id="adm-name" [(ngModel)]="displayName" name="displayName" required />
                  </div>
                  <div class="form-group">
                    <label for="adm-bio">Bio</label>
                    <textarea
                      id="adm-bio"
                      [(ngModel)]="bio"
                      name="bio"
                      rows="3"
                      placeholder="Tell others about yourself"
                    ></textarea>
                  </div>
                  @if (profileError()) {
                    <div class="error-msg">{{ profileError() }}</div>
                  }
                  <button type="submit" class="btn btn-primary btn-block" [disabled]="savingProfile()">
                    {{ savingProfile() ? 'Saving…' : 'Save profile' }}
                  </button>
                </form>
              </section>
            </div>

            <div class="profile-col-side">
              <section class="profile-card profile-card--compact">
                <p class="card-kicker">Security</p>
                <h2 class="visually-hidden">Reset password</h2>
                <form (ngSubmit)="changePasswordSubmit()" class="form-block form-block--flush">
                  <div class="form-group">
                    <label for="adm-cur">Current password</label>
                    <input id="adm-cur" type="password" [(ngModel)]="currentPassword" name="currentPassword" required />
                  </div>
                  <div class="form-group">
                    <label for="adm-new">New password</label>
                    <input id="adm-new" type="password" [(ngModel)]="newPassword" name="newPassword" required />
                  </div>
                  @if (passwordError()) {
                    <div class="error-msg">{{ passwordError() }}</div>
                  }
                  @if (passwordSuccess()) {
                    <div class="success-msg">Password updated successfully.</div>
                  }
                  <button type="submit" class="btn btn-primary btn-block" [disabled]="savingPassword()">
                    {{ savingPassword() ? 'Saving…' : 'Update password' }}
                  </button>
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
                  @if (forgotDevResetUrl()) {
                    <div class="dev-reset-banner">
                      <p class="dev-reset-title">Development: no real email sent. Open this link to reset:</p>
                      <a
                        class="dev-reset-link"
                        [href]="forgotDevResetUrl()!"
                        target="_blank"
                        rel="noopener noreferrer"
                        >{{ forgotDevResetUrl() }}</a
                      >
                    </div>
                  }
                  <button type="button" class="btn btn-outline btn-block" [disabled]="sendingForgot()" (click)="sendResetEmail()">
                    {{ sendingForgot() ? 'Sending…' : 'Send reset email' }}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .loading-wrap {
      text-align: center;
      padding: 5rem 1.5rem;
      color: var(--text-muted);
    }
    .profile-page {
      margin: 0;
    }
    .profile-hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #0a2a22 0%, var(--primary-dark) 35%, var(--primary) 70%, #1f6a53 100%);
      color: #fff;
      padding: 2.25rem 0 2.5rem;
    }
    .profile-hero-glow {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 50% 90% at 0% 50%, rgba(212, 165, 116, 0.2) 0%, transparent 55%),
        radial-gradient(ellipse 45% 80% at 100% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }
    .profile-hero-inner {
      position: relative;
      z-index: 1;
    }
    .hero-eyebrow {
      margin: 0 0 1rem;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .profile-identity {
      display: flex;
      align-items: center;
      gap: 1.35rem;
      flex-wrap: wrap;
    }
    .avatar-ring {
      width: 5.25rem;
      height: 5.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.06) 100%);
      border: 3px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
    }
    .avatar-ring.has-photo {
      padding: 0;
      overflow: hidden;
      background: #fff;
    }
    .avatar-ring img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-initials {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #fff;
    }
    .profile-name {
      font-family: var(--font-display);
      font-size: clamp(1.55rem, 3.5vw, 2rem);
      font-weight: 600;
      margin: 0 0 0.25rem;
      color: #fff;
      line-height: 1.2;
    }
    .profile-email {
      margin: 0 0 0.85rem;
      font-size: 0.95rem;
      opacity: 0.92;
    }
    .identity-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 0.28rem 0.75rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.28);
    }
    .chip-outline {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.45);
    }
    .hero-lede {
      margin: 1.35rem 0 0;
      max-width: 32rem;
      font-size: 0.94rem;
      line-height: 1.55;
      opacity: 0.88;
    }
    .profile-body {
      padding: 1.75rem 1.5rem 3rem;
    }
    .profile-columns {
      display: grid;
      gap: 1.25rem;
      max-width: 1040px;
      margin: 0 auto;
      align-items: start;
    }
    @media (min-width: 900px) {
      .profile-columns {
        grid-template-columns: 1.15fr 0.85fr;
        gap: 1.5rem;
      }
    }
    .profile-card {
      position: relative;
      background: var(--bg-card);
      border-radius: 16px;
      padding: 1.65rem 1.75rem 1.75rem;
      border: 1px solid rgba(13, 61, 50, 0.08);
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.9) inset,
        0 14px 40px rgba(13, 61, 50, 0.07);
    }
    .profile-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 1.75rem;
      right: 1.75rem;
      height: 3px;
      border-radius: 0 0 4px 4px;
      background: linear-gradient(90deg, var(--primary-dark), var(--accent));
      opacity: 0.9;
    }
    .profile-card--compact {
      padding: 1.35rem 1.5rem 1.5rem;
    }
    .profile-card--compact::before {
      left: 1.5rem;
      right: 1.5rem;
    }
    .card-kicker {
      margin: 0.35rem 0 1.1rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--primary);
    }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .detail-tile {
      padding: 0.85rem 1rem;
      border-radius: 12px;
      background: linear-gradient(180deg, #fafcf9 0%, #f4f7f4 100%);
      border: 1px solid rgba(26, 95, 74, 0.1);
    }
    .detail-tile-label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .detail-tile-value {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.35;
      word-break: break-word;
    }
    .form-block {
      margin-top: 0.25rem;
      padding-top: 1.35rem;
      border-top: 1px solid rgba(13, 61, 50, 0.08);
    }
    .form-block--flush {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
    .form-section-label {
      margin: 0 0 1rem;
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text);
    }
    .form-group {
      margin-bottom: 1.05rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 600;
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.78rem 0.9rem;
      font: inherit;
      box-sizing: border-box;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
    }
    .divider {
      height: 1px;
      margin: 1.35rem 0;
      background: linear-gradient(90deg, transparent, var(--border), transparent);
    }
    .alt-reset {
      padding: 1rem;
      border-radius: 12px;
      background: rgba(26, 95, 74, 0.04);
      border: 1px dashed rgba(26, 95, 74, 0.2);
    }
    .alt-reset > p:first-child {
      margin: 0 0 0.5rem;
      font-size: 0.88rem;
      color: var(--text-muted);
    }
    .email-line {
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.85rem !important;
      font-size: 0.92rem;
    }
    .dev-reset-banner {
      margin-top: 0.85rem;
      padding: 0.9rem 1rem;
      background: #eff6ff;
      border: 1px solid #93c5fd;
      border-radius: 10px;
      font-size: 0.85rem;
      line-break: anywhere;
    }
    .dev-reset-title {
      margin: 0 0 0.5rem;
      font-weight: 600;
      color: #1e3a5f;
    }
    .dev-reset-link {
      word-break: break-all;
      color: #1d4ed8;
      font-weight: 600;
    }
    .btn-block {
      width: 100%;
    }
    .btn-primary:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 22px rgba(26, 95, 74, 0.28);
    }
    .btn-outline:hover:not(:disabled) {
      background: rgba(26, 95, 74, 0.06);
    }
    .error-msg {
      background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%);
      color: #b91c1c;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
      font-size: 0.88rem;
      border: 1px solid #fecaca;
    }
    .success-msg {
      background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
      color: #047857;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
      font-size: 0.88rem;
      border: 1px solid #a7f3d0;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(26, 95, 74, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (max-width: 600px) {
      .details-grid {
        grid-template-columns: 1fr;
      }
      .profile-identity {
        flex-direction: column;
        align-items: flex-start;
      }
    }
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
  forgotDevResetUrl = signal<string | null>(null);

  constructor(private auth: AuthService) {}

  initials(): string {
    const u = this.profile();
    if (!u?.displayName?.trim()) return '?';
    const parts = u.displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0] ?? '';
      const b = parts[parts.length - 1][0] ?? '';
      return (a + b).toUpperCase();
    }
    return u.displayName.trim().slice(0, 2).toUpperCase();
  }

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
    this.forgotDevResetUrl.set(null);

    this.auth.forgotPassword(account.email).subscribe({
      next: (res) => {
        this.forgotSuccess.set(res.message || 'Password reset instructions have been sent to your email address.');
        this.forgotDevResetUrl.set(res.devEmailSkipped && res.resetUrl ? res.resetUrl : null);
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
