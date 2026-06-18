import { Component, OnDestroy, OnInit, signal } from '@angular/core';
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
          <div class="hero-backdrop" aria-hidden="true"></div>
          <div class="container profile-hero-inner">
            <div class="hero-shell">
              <div class="hero-head">
                <p class="hero-kicker">Memora Admin</p>
                <h1 id="admin-profile-heading">My account</h1>
                <p class="hero-sub">Manage your profile and password in one place.</p>
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
                    <span class="meta-label">Role</span>
                    <span class="meta-value">{{ profile()!.role || 'Admin' }}</span>
                  </div>
                  <div class="meta-block">
                    <span class="meta-label">Member since</span>
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
                  <input
                    id="adm-photo"
                    type="file"
                    class="photo-input"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    (change)="onPhotoSelected($event)"
                  />
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
                  <div class="form-group">
                    <label for="adm-photo">Profile photo</label>
                    <div class="photo-field">
                      <label class="btn btn-outline photo-choose" for="adm-photo">Choose image</label>
                      @if (pendingPhotoName()) {
                        <span class="file-hint">{{ pendingPhotoName() }} — save profile to upload</span>
                      } @else if (profile()!.profileImageUrl) {
                        <span class="file-hint">Current photo is saved on the server.</span>
                      } @else {
                        <span class="file-hint">PNG, JPG, GIF, or WebP · max 5 MB</span>
                      }
                    </div>
                  </div>
                  @if (profileError()) {
                    <div class="error-msg">{{ profileError() }}</div>
                  }
                  @if (profileOk()) {
                    <div class="success-msg">Profile saved successfully.</div>
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
    .btn-block {
      width: 100%;
    }
    .btn-primary:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 22px rgba(26, 95, 74, 0.28);
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
      .hero-identity-card {
        grid-template-columns: auto 1fr;
        padding: 1rem 1.1rem;
      }
      .avatar-wrap {
        grid-row: 1;
      }
      .avatar {
        width: 5.25rem;
        height: 5.25rem;
      }
      .avatar-initials {
        font-size: 1.35rem;
      }
      .identity-main {
        grid-column: 2;
      }
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
      .avatar-wrap {
        grid-row: auto;
      }
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
export class ProfileComponent implements OnInit, OnDestroy {
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  displayName = '';
  bio = '';
  currentPassword = '';
  newPassword = '';
  photoFile: File | null = null;
  photoPreviewUrl: string | null = null;
  pendingPhotoName = signal<string | null>(null);

  savingProfile = signal(false);
  savingPassword = signal(false);
  profileError = signal('');
  profileOk = signal(false);
  passwordError = signal('');
  passwordSuccess = signal(false);

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

  ngOnDestroy() {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
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
}
