import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, ForgotPasswordResponse, UserProfile } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, RouterLink],
  template: `
    @if (loading()) {
      <div class="container loading-wrap">
        <div class="spinner"></div>
        <p>{{ 'profile.loading' | t }}</p>
      </div>
    } @else if (profile()) {
      <div class="profile-page">
        <header class="profile-hero" aria-labelledby="customer-profile-heading">
          <div class="hero-backdrop" aria-hidden="true"></div>
          <div class="container profile-hero-inner">
            <a routerLink="/" class="back-link">← {{ 'detail.back' | t }}</a>
            <div class="hero-shell">
              <div class="hero-head">
                <p class="hero-kicker">Memora</p>
                <h1 id="customer-profile-heading">{{ 'profile.title' | t }}</h1>
                <p class="hero-sub">{{ 'profile.subtitle' | t }}</p>
              </div>

              <div class="hero-identity-card">
                <div class="avatar-wrap">
                  <div class="avatar" [class.has-photo]="!!avatarImageUrl()">
                    @if (avatarImageUrl()) {
                      <img [src]="avatarImageUrl()" alt="" />
                    } @else {
                      <span class="avatar-initials">{{ initials() }}</span>
                    }
                  </div>
                </div>

                <div class="identity-main">
                  <span class="identity-name">{{ profile()!.displayName }}</span>
                  <span class="identity-email">{{ profile()!.email }}</span>
                </div>

                <div class="identity-meta">
                  <div class="meta-block">
                    <span class="meta-label">{{ 'profile.role' | t }}</span>
                    <span class="meta-value">{{ profile()!.role || 'Customer' }}</span>
                  </div>
                  <div class="meta-block">
                    <span class="meta-label">{{ 'profile.joined' | t }}</span>
                    <span class="meta-value">{{ profile()!.createdAt | date: 'MMM d, yyyy' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div class="container profile-body">
          <div class="profile-columns">
            <div class="profile-col-main">
              <section class="profile-card">
                <p class="card-kicker">{{ 'profile.details' | t }}</p>
                <h2 class="visually-hidden">{{ 'profile.details' | t }}</h2>
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
                  <input
                    id="cust-photo"
                    type="file"
                    class="photo-input"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    (change)="onPhotoSelected($event)"
                  />
                  <div class="form-group">
                    <label for="cust-name">{{ 'profile.displayName' | t }}</label>
                    <input id="cust-name" [(ngModel)]="displayName" name="displayName" required />
                  </div>
                  <div class="form-group">
                    <label for="cust-bio">{{ 'profile.bio' | t }}</label>
                    <textarea id="cust-bio" [(ngModel)]="bio" name="bio" rows="3"></textarea>
                  </div>
                  <div class="form-group">
                    <label for="cust-photo">{{ 'profile.photo' | t }}</label>
                    <div class="photo-field">
                      <label class="btn btn-outline photo-choose" for="cust-photo">{{ 'profile.choosePhoto' | t }}</label>
                      @if (pendingPhotoName()) {
                        <span class="file-hint">{{ pendingPhotoName() }} — {{ 'profile.saveToUpload' | t }}</span>
                      } @else if (profile()!.profileImageUrl) {
                        <span class="file-hint">{{ 'profile.photoSaved' | t }}</span>
                      } @else {
                        <span class="file-hint">{{ 'profile.photoHint' | t }}</span>
                      }
                    </div>
                  </div>
                  @if (profileError()) {
                    <div class="error-msg">{{ profileError() }}</div>
                  }
                  @if (profileOk()) {
                    <div class="success-msg">{{ 'profile.saved' | t }}</div>
                  }
                  <button type="submit" class="btn btn-primary btn-block" [disabled]="savingProfile()">
                    {{ savingProfile() ? ('profile.saving' | t) : ('profile.saveProfile' | t) }}
                  </button>
                </form>
              </section>
            </div>

            <div class="profile-col-side">
              <section class="profile-card profile-card--compact">
                <p class="card-kicker">{{ 'profile.password' | t }}</p>
                <h2 class="visually-hidden">{{ 'profile.password' | t }}</h2>
                <form (ngSubmit)="changePasswordSubmit()" class="form-block form-block--flush">
                  <div class="form-group">
                    <label for="cust-cur">{{ 'profile.currentPassword' | t }}</label>
                    <input id="cust-cur" type="password" [(ngModel)]="currentPassword" name="currentPassword" required />
                  </div>
                  <div class="form-group">
                    <label for="cust-new">{{ 'profile.newPassword' | t }}</label>
                    <input id="cust-new" type="password" [(ngModel)]="newPassword" name="newPassword" required />
                  </div>
                  @if (passwordError()) {
                    <div class="error-msg">{{ passwordError() }}</div>
                  }
                  @if (passwordSuccess()) {
                    <div class="success-msg">{{ 'profile.passwordUpdated' | t }}</div>
                  }
                  <button type="submit" class="btn btn-primary btn-block" [disabled]="savingPassword()">
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
                      <a class="dev-reset-link" [href]="forgotDevResetUrl()!">{{
                        forgotDevResetUrl()
                      }}</a>
                    </div>
                  }
                  <button type="button" class="btn btn-outline btn-block" [disabled]="sendingForgot()" (click)="sendResetEmail()">
                    {{ sendingForgot() ? ('profile.sendingReset' | t) : ('profile.sendReset' | t) }}
                  </button>
                </div>
              </section>

              <section class="profile-card profile-card--compact">
                <p class="card-kicker">{{ 'profile.privacy' | t }}</p>
                <h2 class="visually-hidden">{{ 'profile.privacy' | t }}</h2>
                <form (ngSubmit)="savePrivacy()" class="form-block form-block--flush">
                  <div class="form-group">
                    <label for="cust-vis">{{ 'profile.visibility' | t }}</label>
                    <select id="cust-vis" [(ngModel)]="profileVisibility" name="profileVisibility">
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
                  <button type="submit" class="btn btn-primary btn-block" [disabled]="savingPrivacy()">
                    {{ savingPrivacy() ? ('profile.saving' | t) : ('profile.savePrivacy' | t) }}
                  </button>
                </form>
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
      background: linear-gradient(135deg, #0d3d32 0%, #1b5f4b 55%, #2a7a62 100%);
      color: #fff;
      padding: 1.75rem 0 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .hero-backdrop {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 120% at 0% 0%, rgba(212, 165, 116, 0.22) 0%, transparent 52%),
        radial-gradient(ellipse 55% 90% at 100% 100%, rgba(255, 255, 255, 0.08) 0%, transparent 48%);
      pointer-events: none;
    }
    .profile-hero-inner {
      position: relative;
      z-index: 1;
    }
    .profile-hero-inner > .back-link {
      display: inline-block;
      margin-bottom: 0.85rem;
      color: rgba(255, 255, 255, 0.88);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
    }
    .profile-hero-inner > .back-link:hover {
      color: #fff;
      text-decoration: underline;
    }
    .hero-shell {
      max-width: 1040px;
      margin: 0 auto;
    }
    .hero-head {
      margin-bottom: 1.25rem;
    }
    .hero-kicker {
      margin: 0 0 0.35rem;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.72);
    }
    .hero-head h1 {
      margin: 0 0 0.35rem;
      font-family: var(--font-display);
      font-size: clamp(1.45rem, 3vw, 1.85rem);
      font-weight: 600;
      line-height: 1.15;
      color: #fff;
    }
    .hero-sub {
      margin: 0;
      max-width: 28rem;
      font-size: 0.9rem;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.82);
    }
    .hero-identity-card {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto;
      gap: 1rem 1.25rem;
      align-items: center;
      padding: 1.15rem 1.35rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.12) inset,
        0 16px 40px rgba(0, 0, 0, 0.14);
      backdrop-filter: blur(12px);
    }
    .avatar-wrap {
      grid-row: 1 / span 2;
      width: fit-content;
    }
    .avatar {
      width: 6.75rem;
      height: 6.75rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.06) 100%);
      border: 2px solid rgba(255, 255, 255, 0.35);
      box-shadow:
        0 0 0 3px rgba(212, 165, 116, 0.35),
        0 10px 24px rgba(0, 0, 0, 0.2);
    }
    .avatar.has-photo {
      padding: 0;
      overflow: hidden;
      background: #fff;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-initials {
      font-family: var(--font-display);
      font-size: 1.65rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: #fff;
    }
    .photo-input {
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
    .photo-field {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem 0.85rem;
    }
    .photo-choose {
      margin: 0;
      cursor: pointer;
      font-size: 0.88rem;
      padding: 0.55rem 1rem;
    }
    .file-hint {
      margin: 0;
      font-size: 0.82rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .identity-main {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }
    .identity-name {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 600;
      line-height: 1.25;
      color: #fff;
    }
    .identity-email {
      font-size: 0.88rem;
      color: rgba(255, 255, 255, 0.78);
      word-break: break-word;
    }
    .identity-meta {
      grid-column: 2;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.5rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
    }
    .meta-block {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 6.5rem;
    }
    .meta-label {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.58);
    }
    .meta-value {
      font-size: 0.92rem;
      font-weight: 600;
      color: #fff;
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
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.72rem 1.25rem;
      border-radius: 10px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .btn-block {
      width: 100%;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 55%, var(--primary-light) 100%);
      color: #fff;
    }
    .btn-primary:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 22px rgba(26, 95, 74, 0.28);
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
      to { transform: rotate(360deg); }
    }
    @media (max-width: 600px) {
      .details-grid { grid-template-columns: 1fr; }
      .hero-identity-card {
        grid-template-columns: auto 1fr;
        padding: 1rem 1.1rem;
      }
      .avatar-wrap { grid-row: 1; }
      .avatar {
        width: 5.25rem;
        height: 5.25rem;
      }
      .avatar-initials { font-size: 1.35rem; }
      .identity-main { grid-column: 2; }
      .identity-meta {
        grid-column: 1 / -1;
        gap: 1rem;
      }
      .meta-block {
        flex: 1;
        min-width: 0;
      }
    }
    @media (min-width: 768px) {
      .hero-identity-card {
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto;
        gap: 1.25rem 1.5rem;
        padding: 1.25rem 1.5rem;
      }
      .avatar-wrap { grid-row: auto; }
      .identity-meta {
        grid-column: auto;
        flex-direction: column;
        gap: 1rem;
        padding-top: 0;
        padding-left: 1.5rem;
        border-top: none;
        border-left: 1px solid rgba(255, 255, 255, 0.14);
      }
    }
  `]
})
export class CustomerProfileComponent implements OnInit, OnDestroy {
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  displayName = '';
  bio = '';
  profileVisibility: 'Public' | 'Private' | 'FriendsOnly' = 'Public';
  showEmail = false;
  currentPassword = '';
  newPassword = '';
  photoFile: File | null = null;
  photoPreviewUrl: string | null = null;
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

  avatarImageUrl(): string | null {
    if (this.photoPreviewUrl) return this.photoPreviewUrl;
    return this.profile()?.profileImageUrl ?? null;
  }

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

  ngOnDestroy() {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
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
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
      this.photoPreviewUrl = null;
    }
    if (!file) {
      this.photoFile = null;
      this.pendingPhotoName.set(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.profileError.set('Image must be 5 MB or smaller.');
      input.value = '';
      this.photoFile = null;
      this.pendingPhotoName.set(null);
      return;
    }
    const allowed = /^image\/(jpeg|png|gif|webp)$/i;
    if (!allowed.test(file.type)) {
      this.profileError.set('Use PNG, JPG, GIF, or WebP.');
      input.value = '';
      this.photoFile = null;
      this.pendingPhotoName.set(null);
      return;
    }
    this.photoFile = file;
    this.photoPreviewUrl = URL.createObjectURL(file);
    this.pendingPhotoName.set(file.name);
    this.profileError.set('');
    this.profileOk.set(false);
  }

  saveProfile() {
    this.savingProfile.set(true);
    this.profileError.set('');
    this.profileOk.set(false);
    this.auth.updateProfile(this.displayName, this.bio, this.photoFile ?? undefined).subscribe({
      next: (u) => {
        this.profile.set(u);
        if (this.photoPreviewUrl) {
          URL.revokeObjectURL(this.photoPreviewUrl);
          this.photoPreviewUrl = null;
        }
        this.photoFile = null;
        this.pendingPhotoName.set(null);
        this.profileOk.set(true);
        this.savingProfile.set(false);
      },
      error: (err) => {
        this.profileError.set(this.readApiError(err, 'Failed to update profile.'));
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

  private readApiError(err: { status?: number; error?: unknown; message?: string }, fallback: string): string {
    if (err.status === 0) {
      return 'Cannot reach the API. Start the backend on port 5000 and try again.';
    }
    if (err.status === 401) {
      return 'Your session expired. Please log in again.';
    }
    if (err.status === 404) {
      return 'Your account was not found. Please log out and sign in again.';
    }
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }
    const body = err.error as { message?: string; detail?: string } | null | undefined;
    if (body?.message) {
      return body.detail ? `${body.message} (${body.detail})` : body.message;
    }
    if (err.message) {
      return err.message;
    }
    return fallback;
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
