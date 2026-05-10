import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="profile-hero">
      <div class="container">
        <h1>My Profile</h1>
        <p>Manage your account and privacy settings.</p>
      </div>
    </section>

    @if (loading()) {
      <div class="container" style="text-align:center;padding:4rem;"><div class="spinner"></div><p>Loading...</p></div>
    } @else if (profile()) {
      <div class="container profile-container">
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar" [style.background-image]="'url(' + (profile()!.profileImageUrl || avatarPlaceholder) + ')'"></div>
            <h2>{{ profile()!.displayName }}</h2>
            <p class="email">{{ profile()!.showEmail ? profile()!.email : '•••@•••.com' }}</p>
          </div>

          <form (ngSubmit)="saveProfile()" class="profile-form">
            <h3>Profile</h3>
            <div class="form-group">
              <label>Display Name</label>
              <input [(ngModel)]="displayName" name="displayName" required />
            </div>
            <div class="form-group">
              <label>Bio</label>
              <textarea [(ngModel)]="bio" name="bio" rows="3" placeholder="Tell others about yourself"></textarea>
            </div>
            <div class="form-group">
              <label>Profile Photo</label>
              <input type="file" accept="image/*" (change)="onPhotoChange($event)" />
              @if (photoPreview()) {
                <img [src]="photoPreview()" alt="Preview" class="photo-preview" />
              }
            </div>
            @if (profileError()) {
              <div class="error-msg">{{ profileError() }}</div>
            }
            <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">Save Profile</button>
          </form>

          <form (ngSubmit)="savePrivacy()" class="privacy-form">
            <h3>Privacy Settings</h3>
            <div class="form-group">
              <label>Profile Visibility</label>
              <select [(ngModel)]="profileVisibility" name="profileVisibility">
                <option value="Public">Public — Anyone can see your profile</option>
                <option value="Private">Private — Only you</option>
                <option value="FriendsOnly">Friends Only — Restricted access</option>
              </select>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="showEmail" name="showEmail" />
                Show email on profile
              </label>
            </div>
            @if (privacyError()) {
              <div class="error-msg">{{ privacyError() }}</div>
            }
            <button type="submit" class="btn btn-primary" [disabled]="savingPrivacy()">Save Privacy Settings</button>
          </form>

          <form (ngSubmit)="changePasswordSubmit()" class="password-form">
            <h3>Change Password</h3>
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
            <button type="submit" class="btn btn-outline" [disabled]="savingPassword()">Change Password</button>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .profile-hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .profile-hero h1 { color: white; margin-bottom: 0.5rem; }
    .profile-container { max-width: 600px; margin: 0 auto; padding: 2rem 1.5rem; }
    .profile-card {
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 2rem;
    }
    .profile-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-color: var(--border);
      margin: 0 auto 1rem;
    }
    .avatar-placeholder { background: var(--primary-light); }
    .profile-header h2 { margin: 0.5rem 0 0.25rem; }
    .profile-header .email { color: var(--text-muted); font-size: 0.95rem; margin: 0; }
    .profile-form, .privacy-form, .password-form {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }
    .profile-form:last-of-type, .privacy-form:last-of-type { border-bottom: none; }
    .profile-card h3 { margin-bottom: 1rem; font-size: 1.1rem; }
    .checkbox-group { margin-top: 0.5rem; }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
      cursor: pointer;
    }
    .checkbox-label input { width: auto; }
    .photo-preview { max-width: 120px; max-height: 120px; border-radius: 50%; object-fit: cover; margin-top: 0.5rem; }
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
  profileVisibility = 'Public';
  showEmail = false;
  photoFile: File | null = null;
  photoPreview = signal<string | null>(null);
  currentPassword = '';
  newPassword = '';

  savingProfile = signal(false);
  savingPrivacy = signal(false);
  savingPassword = signal(false);
  profileError = signal('');
  privacyError = signal('');
  passwordError = signal('');
  passwordSuccess = signal(false);

  avatarPlaceholder = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.profile.set(user);
      this.displayName = user.displayName;
      this.bio = user.bio ?? '';
      this.profileVisibility = user.profileVisibility;
      this.showEmail = user.showEmail;
    }
    this.auth.refreshProfile().subscribe({
      next: (u) => {
        this.profile.set(u);
        this.displayName = u.displayName;
        this.bio = u.bio ?? '';
        this.profileVisibility = u.profileVisibility;
        this.showEmail = u.showEmail;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPhotoChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.photoFile = file;
      const reader = new FileReader();
      reader.onload = () => this.photoPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    this.savingProfile.set(true);
    this.profileError.set('');
    this.auth.updateProfile(this.displayName, this.bio, this.photoFile ?? undefined).subscribe({
      next: (u) => {
        this.profile.set(u);
        this.photoFile = null;
        this.photoPreview.set(null);
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
    this.auth.updatePrivacy(this.profileVisibility, this.showEmail).subscribe({
      next: (u) => {
        this.profile.set(u);
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
      this.passwordError.set('Both fields are required.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError.set('New password must be at least 6 characters.');
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
        this.passwordError.set(err.error?.message || 'Failed to change password.');
        this.savingPassword.set(false);
      }
    });
  }
}
