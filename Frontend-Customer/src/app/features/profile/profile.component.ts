import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, ForgotPasswordResponse, UserProfile } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    @if (loading()) {
      <div class="container loading-wrap">
        <div class="spinner"></div>
        <p>Loading your profile…</p>
      </div>
    } @else if (profile()) {
      <div class="profile-page">
        <header class="profile-hero" aria-labelledby="profile-heading">
          <div class="profile-hero-glow" aria-hidden="true"></div>
          <div class="container profile-hero-inner">
            <div class="profile-identity">
              <div class="avatar-ring" [class.has-photo]="!!profile()!.profileImageUrl">
                @if (profile()!.profileImageUrl) {
                  <img [src]="profile()!.profileImageUrl" alt="" />
                } @else {
                  <span class="avatar-initials">{{ initials() }}</span>
                }
              </div>
              <div class="profile-identity-text">
                <p class="profile-kicker">{{ 'profile.title' | t }}</p>
                <h1 id="profile-heading" class="profile-name">{{ profile()!.displayName }}</h1>
                <p class="profile-email">{{ profile()!.email }}</p>
                <div class="identity-chips">
                  <span class="chip">{{ profile()!.role || 'Customer' }}</span>
                  <span class="chip chip-outline">{{ profile()!.createdAt | date: 'mediumDate' }}</span>
                </div>
              </div>
            </div>
            <p class="hero-lede">{{ 'profile.subtitle' | t }}</p>
          </div>
        </header>

        <div class="container profile-body">
          <div class="profile-columns">
            <div class="profile-col-main">
              <section class="profile-card">
                <p class="card-kicker">{{ 'profile.details' | t }}</p>
                <h2 class="card-title visually-hidden">{{ 'profile.details' | t }}</h2>

                <div class="details-grid">
                  <div class="detail-tile">
                    <span class="detail-tile-label">{{ 'profile.email' | t }}</span>
                    <p class="detail-tile-value">{{ profile()!.email }}</p>
                  </div>
                  <div class="detail-tile">
                    <span class="detail-tile-label">{{ 'profile.role' | t }}</span>
                    <p class="detail-tile-value">{{ profile()!.role || 'Customer' }}</p>
                  </div>
                  <div class="detail-tile">
                    <span class="detail-tile-label">{{ 'profile.joined' | t }}</span>
                    <p class="detail-tile-value">{{ profile()!.createdAt | date: 'mediumDate' }}</p>
                  </div>
                  <div class="detail-tile">
                    <span class="detail-tile-label">{{ 'profile.displayName' | t }}</span>
                    <p class="detail-tile-value">{{ profile()!.displayName }}</p>
                  </div>
                </div>

                <form (ngSubmit)="saveProfile()" class="form-block">
                  <p class="form-section-label">{{ 'profile.updateProfile' | t }}</p>
            <div class="form-group">
              <label for="pf-name">{{ 'profile.displayName' | t }}</label>
              <input id="pf-name" [(ngModel)]="displayName" name="displayName" required />
            </div>
            <div class="form-group">
              <label for="pf-bio">{{ 'profile.bio' | t }}</label>
              <textarea id="pf-bio" [(ngModel)]="bio" name="bio" rows="3" placeholder=""></textarea>
            </div>
            <div class="form-group">
              <label for="pf-photo">{{ 'profile.photo' | t }}</label>
              <input
                id="pf-photo"
                type="file"
                accept="image/*"
                (change)="onPhotoSelected($event)"
              />
              @if (pendingPhotoName()) {
                <p class="file-hint">{{ pendingPhotoName() }}</p>
              }
            </div>
            @if (profileError()) {
              <div class="error-msg">{{ profileError() }}</div>
            }
            @if (profileOk()) {
              <div class="success-msg">{{ 'profile.saved' | t }}</div>
            }
            <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
              {{ savingProfile() ? ('profile.saving' | t) : ('profile.saveProfile' | t) }}
            </button>
                </form>
              </section>
            </div>

            <div class="profile-col-side">
              <section class="profile-card profile-card--compact">
                <p class="card-kicker">{{ 'profile.privacy' | t }}</p>
                <h2 class="card-title visually-hidden">{{ 'profile.privacy' | t }}</h2>
          <form (ngSubmit)="savePrivacy()" class="form-block">
            <div class="form-group">
              <label for="pf-vis">{{ 'profile.visibility' | t }}</label>
              <select id="pf-vis" [(ngModel)]="profileVisibility" name="profileVisibility">
                <option value="Public">{{ 'profile.visPublic' | t }}</option>
                <option value="Private">{{ 'profile.visPrivate' | t }}</option>
                <option value="FriendsOnly">{{ 'profile.visFriends' | t }}</option>
              </select>
            </div>
            <label class="check-row">
              <input type="checkbox" [(ngModel)]="showEmail" name="showEmail" />
              <span>{{ 'profile.showEmailLabel' | t }}</span>
            </label>
            @if (privacyError()) {
              <div class="error-msg">{{ privacyError() }}</div>
            }
            @if (privacyOk()) {
              <div class="success-msg">{{ 'profile.privacySaved' | t }}</div>
            }
            <button type="submit" class="btn btn-primary" [disabled]="savingPrivacy()">
              {{ savingPrivacy() ? ('profile.saving' | t) : ('profile.savePrivacy' | t) }}
            </button>
          </form>
              </section>

              <section class="profile-card profile-card--compact">
                <p class="card-kicker">{{ 'profile.password' | t }}</p>
                <h2 class="card-title visually-hidden">{{ 'profile.password' | t }}</h2>

          <form (ngSubmit)="changePasswordSubmit()" class="form-block">
            <div class="form-group">
              <label for="pf-cur">{{ 'profile.currentPassword' | t }}</label>
              <input id="pf-cur" type="password" [(ngModel)]="currentPassword" name="currentPassword" required />
            </div>
            <div class="form-group">
              <label for="pf-new">{{ 'profile.newPassword' | t }}</label>
              <input id="pf-new" type="password" [(ngModel)]="newPassword" name="newPassword" required />
            </div>
            @if (passwordError()) {
              <div class="error-msg">{{ passwordError() }}</div>
            }
            @if (passwordSuccess()) {
              <div class="success-msg">{{ 'profile.passwordUpdated' | t }}</div>
            }
            <button type="submit" class="btn btn-primary" [disabled]="savingPassword()">
              {{ savingPassword() ? ('profile.saving' | t) : ('profile.updatePassword' | t) }}
            </button>
          </form>

          <div class="divider"></div>
          <div class="alt-reset">
            <p>{{ 'profile.forgotIntro' | t }}</p>
            <p class="email-line">{{ profile()!.email }}</p>
            @if (forgotError()) {
              <div class="error-msg">{{ forgotError() }}</div>
            }
            @if (forgotSuccess()) {
              <div class="success-msg">{{ forgotSuccess() }}</div>
            }
            @if (forgotDevResetUrl()) {
              <div class="dev-reset-banner">
                <p class="dev-reset-title">{{ 'profile.devResetTitle' | t }}</p>
                <a class="dev-reset-link" [href]="forgotDevResetUrl()!" target="_blank" rel="noopener noreferrer">{{
                  forgotDevResetUrl()
                }}</a>
              </div>
            }
            <button type="button" class="btn btn-outline" [disabled]="sendingForgot()" (click)="sendResetEmail()">
              {{ sendingForgot() ? ('profile.sendingReset' | t) : ('profile.sendReset' | t) }}
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
    /* Light hero: avoids a second heavy green band under the global nav (showcase is hidden on /profile). */
    .profile-hero {
      position: relative;
      overflow: hidden;
      background:
        linear-gradient(180deg, #fdfcfa 0%, #f5f8f5 100%);
      color: var(--text);
      padding: 2rem 0 2.25rem;
      margin-bottom: 0;
      border-bottom: 1px solid rgba(26, 95, 74, 0.12);
      box-shadow: 0 12px 36px rgba(13, 61, 50, 0.06);
    }
    .profile-hero-glow {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 90% at 0% 0%, rgba(26, 95, 74, 0.06) 0%, transparent 55%),
        radial-gradient(ellipse 50% 70% at 100% 100%, rgba(212, 165, 116, 0.08) 0%, transparent 45%);
      pointer-events: none;
    }
    .profile-hero-inner {
      position: relative;
      z-index: 1;
    }
    .profile-identity {
      display: flex;
      align-items: center;
      gap: 1.35rem;
      flex-wrap: wrap;
    }
    .avatar-ring {
      width: 5.5rem;
      height: 5.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: linear-gradient(160deg, #ffffff 0%, #eef6f2 100%);
      border: 3px solid rgba(26, 95, 74, 0.22);
      box-shadow:
        0 8px 28px rgba(13, 61, 50, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
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
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--primary-dark);
    }
    .profile-kicker {
      margin: 0 0 0.35rem;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--primary);
      opacity: 0.9;
    }
    .profile-name {
      font-family: var(--font-display);
      font-size: clamp(1.65rem, 4vw, 2.1rem);
      font-weight: 600;
      margin: 0 0 0.25rem;
      color: var(--text);
      line-height: 1.2;
    }
    .profile-email {
      margin: 0 0 0.85rem;
      font-size: 0.95rem;
      color: var(--text-muted);
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
      background: rgba(26, 95, 74, 0.09);
      border: 1px solid rgba(26, 95, 74, 0.14);
      color: var(--primary-dark);
    }
    .chip-outline {
      background: #fff;
      border-color: rgba(26, 95, 74, 0.22);
      color: var(--text-muted);
    }
    .hero-lede {
      margin: 1.35rem 0 0;
      max-width: 36rem;
      font-size: 0.95rem;
      line-height: 1.55;
      color: var(--text-muted);
    }
    .profile-body {
      padding: 1.75rem 1.5rem 3rem;
    }
    .profile-columns {
      display: grid;
      gap: 1.25rem;
      max-width: 1080px;
      margin: 0 auto;
      align-items: start;
    }
    @media (min-width: 900px) {
      .profile-columns {
        grid-template-columns: 1.2fr 0.85fr;
        gap: 1.5rem;
      }
    }
    .profile-col-side {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
      background: linear-gradient(90deg, var(--primary-dark), var(--primary-light));
      opacity: 0.85;
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
    .form-section-label {
      margin: 0 0 1rem;
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text);
    }
    .form-group { margin-bottom: 1.05rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 600;
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .form-group input[type="text"],
    .form-group input[type="password"],
    .form-group input[type="file"],
    .form-group textarea,
    .form-group select {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.78rem 0.9rem;
      font: inherit;
      box-sizing: border-box;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
    }
    .file-hint {
      margin: 0.35rem 0 0;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .check-row {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      margin-bottom: 1rem;
      cursor: pointer;
      font-size: 0.9rem;
      line-height: 1.45;
      color: var(--text);
    }
    .check-row input {
      width: 1.1rem;
      height: 1.1rem;
      margin-top: 0.15rem;
      accent-color: var(--primary);
      flex-shrink: 0;
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
    .email-line {
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.85rem !important;
      font-size: 0.92rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.72rem 1.25rem;
      border-radius: 10px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .btn-primary:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 22px rgba(26, 95, 74, 0.28);
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 55%, var(--primary-light) 100%);
      color: #fff;
    }
    .btn-primary:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .btn-outline {
      background: #fff;
      border: 1px solid rgba(26, 95, 74, 0.35);
      color: var(--primary-dark);
      margin-top: 0.65rem;
      width: 100%;
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
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 600px) {
      .details-grid { grid-template-columns: 1fr; }
      .profile-identity { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class CustomerProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  displayName = '';
  bio = '';
  profileVisibility: 'Public' | 'Private' | 'FriendsOnly' = 'Public';
  showEmail = false;
  currentPassword = '';
  newPassword = '';
  photoFile: File | null = null;
  pendingPhotoName = signal<string | null>(null);

  savingProfile = signal(false);
  savingPrivacy = signal(false);
  savingPassword = signal(false);
  sendingForgot = signal(false);
  profileError = signal('');
  privacyError = signal('');
  passwordError = signal('');
  forgotError = signal('');
  profileOk = signal(false);
  privacyOk = signal(false);
  passwordSuccess = signal(false);
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
      this.applyUser(user);
    }
    this.auth.refreshProfile().subscribe({
      next: (u) => {
        this.applyUser(u);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private applyUser(u: UserProfile) {
    this.profile.set(u);
    this.displayName = u.displayName;
    this.bio = u.bio ?? '';
    const vis = u.profileVisibility;
    if (vis === 'Public' || vis === 'Private' || vis === 'FriendsOnly') {
      this.profileVisibility = vis;
    }
    this.showEmail = u.showEmail ?? false;
  }

  onPhotoSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.photoFile = file;
      this.pendingPhotoName.set(file.name);
    } else {
      this.photoFile = null;
      this.pendingPhotoName.set(null);
    }
  }

  saveProfile() {
    this.savingProfile.set(true);
    this.profileError.set('');
    this.profileOk.set(false);
    this.auth.updateProfile(this.displayName, this.bio, this.photoFile ?? undefined).subscribe({
      next: (u) => {
        this.profile.set(u);
        this.photoFile = null;
        this.pendingPhotoName.set(null);
        this.profileOk.set(true);
        this.savingProfile.set(false);
      },
      error: (err) => {
        this.profileError.set(err.error?.message || 'Failed to update profile.');
        this.savingProfile.set(false);
      }
    });
  }

  savePrivacy() {
    this.savingPrivacy.set(true);
    this.privacyError.set('');
    this.privacyOk.set(false);
    this.auth.updatePrivacy(this.profileVisibility, this.showEmail).subscribe({
      next: (u) => {
        this.profile.set(u);
        this.privacyOk.set(true);
        this.savingPrivacy.set(false);
      },
      error: (err) => {
        this.privacyError.set(err.error?.message || 'Failed to update privacy.');
        this.savingPrivacy.set(false);
      }
    });
  }

  changePasswordSubmit() {
    if (!this.currentPassword || !this.newPassword) {
      this.passwordError.set('Both password fields are required.');
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
      next: (res: ForgotPasswordResponse) => {
        this.forgotSuccess.set(
          res.message || 'Password reset instructions have been sent to your email address.'
        );
        this.forgotDevResetUrl.set(res.devEmailSkipped && res.resetUrl ? res.resetUrl : null);
        this.sendingForgot.set(false);
      },
      error: (err) => {
        const msg =
          typeof err.error === 'string' ? err.error : (err.error?.message || 'Unable to send reset email.');
        this.forgotError.set(msg);
        this.sendingForgot.set(false);
      }
    });
  }
}
