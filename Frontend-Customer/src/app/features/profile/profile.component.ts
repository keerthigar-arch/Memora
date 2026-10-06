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
            <div class="hero-shell">
              <div class="hero-head">
                <p class="hero-kicker">தmileye</p>
                <h1 id="customer-profile-heading">{{ 'profile.title' | t }}</h1>
                <p class="hero-sub">{{ 'profile.subtitle' | t }}</p>
              </div>

              <div class="hero-identity-card">
                <div class="avatar-wrap">
                  <label class="avatar-hit">
                    <span class="avatar" [class.has-photo]="!!avatarImageUrl()">
                      @if (avatarImageUrl()) {
                        <img [src]="avatarImageUrl()" alt="" />
                      } @else {
                        <span class="avatar-initials">{{ initials() }}</span>
                      }
                    </span>
                    <span class="avatar-cam" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13" r="3.2" />
                      </svg>
                    </span>
                    <input
                      type="file"
                      class="photo-input"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      [disabled]="photoBusy()"
                      [attr.aria-label]="'profile.uploadPhoto' | t"
                      (change)="onPhotoSelected($event)"
                    />
                  </label>
                  @if (avatarImageUrl()) {
                    <button
                      type="button"
                      class="avatar-remove"
                      [disabled]="photoBusy()"
                      (click)="askRemovePhoto($event)"
                      [attr.aria-label]="'profile.deletePhoto' | t"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                  }
                  @if (photoError()) {
                    <p class="avatar-error">{{ photoError() }}</p>
                  }
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
                  <div class="form-group">
                    <label for="cust-name">{{ 'profile.displayName' | t }}</label>
                    <input id="cust-name" [(ngModel)]="displayName" name="displayName" required />
                  </div>
                  <div class="form-group">
                    <label for="cust-bio">{{ 'profile.bio' | t }}</label>
                    <textarea id="cust-bio" [(ngModel)]="bio" name="bio" rows="3"></textarea>
                  </div>
                  @if (profileError()) {
                    <div class="error-msg">{{ profileError() }}</div>
                  }
                  @if (profileOk()) {
                    <div class="success-msg">{{ 'profile.saved' | t }}</div>
                  }
                  <button type="submit" class="btn btn-primary btn-block" [disabled]="savingProfile()">
                    @if (savingProfile()) {
                      <span class="btn-spinner" aria-hidden="true"></span>
                      {{ 'profile.saving' | t }}
                    } @else {
                      {{ 'profile.saveProfile' | t }}
                    }
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
                    @if (savingPassword()) {
                      <span class="btn-spinner" aria-hidden="true"></span>
                      {{ 'profile.saving' | t }}
                    } @else {
                      {{ 'profile.updatePassword' | t }}
                    }
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
                    @if (sendingForgot()) {
                      <span class="btn-spinner" aria-hidden="true"></span>
                      {{ 'profile.sendingReset' | t }}
                    } @else {
                      {{ 'profile.sendReset' | t }}
                    }
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
                    @if (savingPrivacy()) {
                      <span class="btn-spinner" aria-hidden="true"></span>
                      {{ 'profile.saving' | t }}
                    } @else {
                      {{ 'profile.savePrivacy' | t }}
                    }
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
      @if (removePrompt()) {
        <div class="photo-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-photo-title">
          <button type="button" class="photo-dialog-backdrop" (click)="cancelRemovePhoto()" [attr.aria-label]="'profile.removeCancel' | t"></button>
          <div class="photo-dialog-panel">
            <h2 id="remove-photo-title">{{ 'profile.removeTitle' | t }}</h2>
            <p>{{ 'profile.removeMessage' | t }}</p>
            <div class="photo-dialog-actions">
              <button type="button" class="btn btn-outline" (click)="cancelRemovePhoto()">{{ 'profile.removeCancel' | t }}</button>
              <button type="button" class="btn btn-danger" [disabled]="photoBusy()" (click)="confirmRemovePhoto()">{{ 'profile.removeConfirm' | t }}</button>
            </div>
          </div>
        </div>
      }
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
      position: relative;
      grid-row: 1 / span 2;
      width: fit-content;
    }
    .avatar-hit {
      position: relative;
      display: block;
      width: 6.75rem;
      height: 6.75rem;
      cursor: pointer;
    }
    .avatar-hit:has(input:disabled) { cursor: wait; }
    .avatar {
      width: 100%;
      height: 100%;
      padding: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      cursor: pointer;
      color: inherit;
      font: inherit;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.06) 100%);
      border: 2px solid rgba(255, 255, 255, 0.35);
      box-shadow:
        0 0 0 3px rgba(212, 165, 116, 0.35),
        0 10px 24px rgba(0, 0, 0, 0.2);
    }
    .avatar:disabled { cursor: wait; }
    .avatar-cam {
      position: absolute;
      right: 0;
      bottom: 0;
      z-index: 2;
      width: 1.75rem;
      height: 1.75rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #fff;
      color: #1a5f4a;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
    }
    .avatar-remove {
      position: absolute;
      top: 0;
      right: 0;
      z-index: 3;
      width: 1.75rem;
      height: 1.75rem;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: #9f2d2d;
      color: #fff;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
    }
    .avatar-wrap:hover .avatar-remove,
    .avatar-wrap:focus-within .avatar-remove {
      opacity: 1;
      pointer-events: auto;
    }
    @media (hover: none) {
      .avatar-remove { opacity: 1; pointer-events: auto; }
    }
    .avatar-error {
      position: absolute;
      left: 0;
      top: calc(100% + 0.35rem);
      margin: 0;
      width: 14rem;
      font-size: 0.75rem;
      line-height: 1.35;
      color: #ffe1e1;
    }
    .photo-dialog {
      position: fixed;
      inset: 0;
      z-index: 1400;
      display: grid;
      place-items: center;
      padding: 1.5rem;
    }
    .photo-dialog-backdrop {
      position: absolute;
      inset: 0;
      border: 0;
      background: rgba(12, 24, 20, 0.55);
      cursor: pointer;
    }
    .photo-dialog-panel {
      position: relative;
      width: min(26rem, 100%);
      padding: 1.35rem 1.4rem 1.2rem;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
    }
    .photo-dialog-panel h2 {
      margin: 0 0 0.4rem;
      font-size: 1.25rem;
      color: #14382c;
    }
    .photo-dialog-panel p {
      margin: 0 0 1.1rem;
      color: #3a4c45;
    }
    .photo-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
    }
    .btn-danger {
      background: #9f2d2d;
      color: #fff;
      border: 0;
    }
    .btn-danger:hover { background: #7f2222; }
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
      inset: 0;
      z-index: 2;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      opacity: 0;
      cursor: pointer;
      font-size: 0;
    }
    .photo-input:disabled { cursor: wait; }
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
    @media (max-width: 768px) {
      .profile-body {
        padding: 1rem var(--container-pad, 1rem);
      }
      .profile-card {
        padding: 1rem;
      }
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
    @media (min-width: 1024px) {
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
  private photoPreviewUrl: string | null = null;
  photoBusy = signal(false);
  photoError = signal('');
  removePrompt = signal(false);

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
    input.value = '';
    if (!file || this.photoBusy()) return;
    this.clearPhotoPreview();
    if (file.size > 5 * 1024 * 1024) {
      this.photoError.set('Image must be 5 MB or smaller.');
      return;
    }
    const allowed = /^image\/(jpeg|png|gif|webp)$/i;
    if (!allowed.test(file.type)) {
      this.photoError.set('Use PNG, JPG, GIF, or WebP.');
      return;
    }
    this.photoPreviewUrl = URL.createObjectURL(file);
    this.photoError.set('');
    this.photoBusy.set(true);
    this.auth.updateProfile(undefined, undefined, file).subscribe({
      next: (u) => {
        this.profile.set(u);
        this.clearPhotoPreview();
        this.photoBusy.set(false);
      },
      error: (err) => {
        this.clearPhotoPreview();
        this.photoError.set(this.readApiError(err, 'Could not upload the photo.'));
        this.photoBusy.set(false);
      }
    });
  }

  askRemovePhoto(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.avatarImageUrl() || this.photoBusy()) return;
    this.removePrompt.set(true);
  }

  cancelRemovePhoto(): void {
    if (this.photoBusy()) return;
    this.removePrompt.set(false);
  }

  confirmRemovePhoto(): void {
    if (this.photoBusy()) return;
    this.photoError.set('');
    this.photoBusy.set(true);
    this.auth.updateProfile(undefined, undefined, undefined, true).subscribe({
      next: (u) => {
        this.profile.set(u);
        this.clearPhotoPreview();
        this.photoBusy.set(false);
        this.removePrompt.set(false);
      },
      error: (err) => {
        this.photoError.set(this.readApiError(err, 'Could not remove the photo.'));
        this.photoBusy.set(false);
        this.removePrompt.set(false);
      }
    });
  }

  private clearPhotoPreview(): void {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
      this.photoPreviewUrl = null;
    }
  }

  saveProfile() {
    this.savingProfile.set(true);
    this.profileError.set('');
    this.profileOk.set(false);
    this.auth.updateProfile(this.displayName, this.bio).subscribe({
      next: (u) => {
        this.profile.set(u);
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
