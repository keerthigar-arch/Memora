import { Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

type EditSnapshot = {
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  birthDate: string;
  deathDate: string;
  weddingDate: string;
  visibility: string;
  invitedEmails: string;
  location: string;
  mobileNumber: string;
  country: string;
};

type EditMediaItem = {
  key: string;
  source: 'existing' | 'new';
  url: string;
  name: string;
  file?: File;
};

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePickerComponent],
  template: `
    <section class="create-hero">
      <div class="container">
        <div class="page-back-bar page-back-bar--flush">
          <a
            [routerLink]="isDraft() ? '/payments' : '/events'"
            class="page-back page-back--on-dark"
            (click)="onLeaveClick($event)"
          >← Back</a>
        </div>
        <h1>{{ isDraft() ? 'Edit pending event' : 'Edit Event' }}</h1>
        <p>{{ isDraft() ? 'Update this customer event before publishing.' : 'Update your memory record.' }}</p>
      </div>
    </section>

    @if (loading()) {
      <div class="container" style="text-align:center;padding:4rem;"><div class="spinner"></div><p>Loading...</p></div>
    } @else if (!event()) {
      <div class="container" style="text-align:center;padding:4rem;">
        <p>{{ isDraft() ? 'Draft not found. It may already be published.' : 'Event not found.' }}</p>
        <a [routerLink]="isDraft() ? '/payments' : '/events'" class="btn btn-primary" (click)="onLeaveClick($event)">Back</a>
      </div>
    } @else {
      <div class="container form-container">
        <form (ngSubmit)="submit()" class="create-form">
          <div class="form-row">
            <div class="form-group">
              <label>Event Type *</label>
              <select [(ngModel)]="eventType" name="eventType" required (ngModelChange)="onEventTypeChange($event)">
                <option value="Birthday">Birthdays</option>
                <option value="Puberty Ceremony">Puberty Ceremonies</option>
                <option value="Wedding">Weddings</option>
                <option value="Anniversary">Anniversaries</option>
                <option value="Obituary">Obituaries</option>
                <option value="Remembrance">Remembrance</option>
                <option value="Other">Others</option>
              </select>
            </div>
            <div class="form-group">
              <label>Event Date *</label>
              <app-date-picker
                [(ngModel)]="eventDate"
                name="eventDate"
                required
                placeholder="Choose event date"
                ariaLabel="Event date"
              ></app-date-picker>
            </div>
          </div>

          @if (eventType === 'Obituary' || eventType === 'Remembrance') {
            <div class="form-row">
              <div class="form-group">
                <label>Birth Date *</label>
                <app-date-picker
                  [(ngModel)]="birthDate"
                  name="birthDate"
                  required
                  placeholder="Choose birth date"
                  ariaLabel="Birth date"
                ></app-date-picker>
              </div>
              <div class="form-group">
                <label>Date of Passing *</label>
                <app-date-picker
                  [(ngModel)]="deathDate"
                  name="deathDate"
                  required
                  placeholder="Choose date of passing"
                  ariaLabel="Date of passing"
                ></app-date-picker>
              </div>
            </div>
          }

          <div class="form-group">
            <label>Title *</label>
            <input [(ngModel)]="title" name="title" required />
          </div>

          <div class="form-group">
            <label>Description *</label>
            <textarea [(ngModel)]="description" name="description" required></textarea>
          </div>

          <div class="form-group">
            <label>Country *</label>
            <select [(ngModel)]="country" name="country" required>
              <option value="">Select country</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="India">India</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Japan">Japan</option>
              <option value="Brazil">Brazil</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label>Location</label>
            <input [(ngModel)]="location" name="location" />
          </div>

          <div class="form-group">
            <label>Mobile number *</label>
            <input
              type="tel"
              [(ngModel)]="mobileNumber"
              name="mobileNumber"
              placeholder="e.g. +94771234567"
              required
              maxlength="32"
            />
          </div>

          <div class="form-group">
            <label>Privacy / Visibility</label>
            <select [(ngModel)]="visibility" name="visibility" (ngModelChange)="onVisibilityChange($event)">
              <option value="Public">Public — Anyone can view</option>
              <option value="InviteOnly">Invite Only — Only you and invited people</option>
            </select>
          </div>

          @if (visibility === 'InviteOnly') {
            <div class="form-group invite-section">
              <label>Invite people by email *</label>
              <p class="form-hint">Comma-separated emails. Invited users must log in with that email to view.</p>
              <textarea [(ngModel)]="invitedEmails" name="invitedEmails" rows="3" placeholder="sister@example.com, brother@example.com"></textarea>
            </div>
          }

          <div class="media-stack">
            <div class="media-card" [class.media-card-ready]="!!mainImagePreview()">
              <div class="media-card-head">
                <span class="media-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2.5"/>
                    <circle cx="9" cy="10" r="1.75"/>
                    <path d="M3 16.5l5.2-4.2a1.2 1.2 0 0 1 1.5 0L21 19"/>
                  </svg>
                </span>
                <div class="media-copy">
                  <div class="media-title">Cover image</div>
                  <p class="media-sub">Keep current, replace, or remove · JPG, PNG, GIF or WEBP · max 5MB</p>
                </div>
                @if (mainImagePreview()) {
                  <span class="media-chip">Ready</span>
                }
              </div>
              @if (mainImagePreview()) {
                <div class="media-cover-frame">
                  <img [src]="mainImagePreview()" alt="Cover preview" class="media-cover-img" />
                  <div class="media-cover-actions">
                    <label class="media-btn media-btn-secondary">
                      Change
                      <input type="file" accept="image/*" (change)="onMainImageChange($event)" hidden />
                    </label>
                    <button type="button" class="media-btn media-btn-danger" (click)="removeMainImage()">Remove</button>
                  </div>
                </div>
              } @else {
                <label class="media-drop media-drop-cover">
                  <input type="file" accept="image/*" (change)="onMainImageChange($event)" />
                  <div class="media-drop-empty">
                    <span class="media-drop-plus" aria-hidden="true">+</span>
                    <span class="media-drop-lead">Drop an image or click to upload</span>
                    <span class="media-drop-meta">Recommended landscape photo</span>
                  </div>
                </label>
              }
            </div>

            <div class="media-card" [class.media-card-ready]="galleryItems().length > 0">
              <div class="media-card-head">
                <span class="media-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                  </svg>
                </span>
                <div class="media-copy">
                  <div class="media-title">Gallery</div>
                  <p class="media-sub">Keep, remove, or add · up to 4 photos · max 5MB each</p>
                </div>
                @if (galleryItems().length > 0) {
                  <span class="media-chip">{{ galleryItems().length }} / 4</span>
                }
              </div>
              <label class="media-drop media-drop-compact">
                <input type="file" accept="image/*" multiple (change)="onGalleryChange($event)" />
                <div class="media-drop-empty media-drop-empty-sm">
                  <span class="media-drop-lead">Add gallery photos</span>
                  <span class="media-drop-meta">Click or drop multiple images</span>
                </div>
              </label>
              @if (galleryItems().length > 0) {
                <div class="media-thumb-grid">
                  @for (item of galleryItems(); track item.key; let i = $index) {
                    <div class="media-thumb-wrap">
                      <div class="media-thumb" [style.background-image]="'url(' + item.url + ')'" [title]="item.name"></div>
                      <button type="button" class="media-remove" (click)="removeGalleryImage(i)" [attr.aria-label]="'Remove ' + item.name">×</button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="media-card" [class.media-card-ready]="videoItems().length > 0">
              <div class="media-card-head">
                <span class="media-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="6" width="13" height="12" rx="2"/>
                    <path d="M16 10.5l5-3v9l-5-3v-3z"/>
                  </svg>
                </span>
                <div class="media-copy">
                  <div class="media-title">Videos</div>
                  <p class="media-sub">Keep, remove, or add · up to 1 file · MP4 / WEBM / MOV · max 100MB</p>
                </div>
                @if (videoItems().length > 0) {
                  <span class="media-chip">{{ videoItems().length }} / 1</span>
                }
              </div>
              <label class="media-drop media-drop-compact">
                <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" (change)="onVideosChange($event)" />
                <div class="media-drop-empty media-drop-empty-sm">
                  <span class="media-drop-lead">Add event videos</span>
                  <span class="media-drop-meta">Shown on the event detail page</span>
                </div>
              </label>
              @if (videoItems().length > 0) {
                <div class="video-preview-grid">
                  @for (item of videoItems(); track item.key; let i = $index) {
                    <div class="video-preview-card">
                      <div class="video-preview-frame">
                        <video class="video-preview" [src]="item.url" controls playsinline preload="metadata"></video>
                        <button type="button" class="media-remove media-remove-on-video" (click)="removeVideo(i)" [attr.aria-label]="'Remove ' + item.name">×</button>
                      </div>
                      <p class="video-preview-name">{{ item.name }}</p>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              @if (saving()) {
                <span class="btn-spinner" aria-hidden="true"></span>
                Saving…
              } @else {
                Save Changes
              }
            </button>
            <button type="button" class="btn btn-outline" (click)="onCancel()" [disabled]="saving()">Cancel</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .create-hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .create-hero .back-link {
      display: inline-block;
      margin-bottom: 0.75rem;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
    }
    .create-hero .back-link:hover { color: #fff; text-decoration: underline; }
    .create-hero h1 { color: white; margin-bottom: 0.5rem; }
    .create-hero p { opacity: 0.9; margin: 0; }
    .form-container { max-width: 700px; margin: 0 auto; padding: 2rem var(--container-pad, 1.5rem); }
    .create-form {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.25rem; }
    .create-form .form-group { margin-bottom: 1.15rem; }
    .create-form .form-group > label:not(.media-drop):not(.media-btn) {
      display: block;
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary-dark);
      line-height: 1.25;
      margin-bottom: 0.45rem;
    }
    .create-form input:not([type="file"]),
    .create-form textarea,
    .create-form select {
      width: 100%;
      box-sizing: border-box;
      border-radius: 10px;
      border: 1px solid #dce8e3;
      background: #fff;
      padding: 0.7rem 0.9rem;
      font-family: var(--font-body);
      font-size: 0.9375rem;
      color: var(--text);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .create-form input:not([type="file"]):hover,
    .create-form textarea:hover,
    .create-form select:hover { border-color: #c5d8d0; }
    .create-form input:not([type="file"]):focus,
    .create-form textarea:focus,
    .create-form select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
    }
    .preview-img { max-width: 200px; max-height: 150px; border-radius: var(--radius); margin-top: 0.5rem; object-fit: cover; }
    .error-msg { background: #fef2f2; color: #c53030; padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; }
    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.35rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(13, 61, 50, 0.08);
      flex-wrap: wrap;
    }
    .form-actions .btn {
      min-height: 2.5rem;
      padding: 0.55rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      border-radius: 8px;
    }
    .invite-section textarea { min-height: 80px; }
    .form-hint { font-size: 0.8125rem; color: var(--text-muted); margin: -0.15rem 0 0.5rem; line-height: 1.45; }

    .media-stack { display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem; }
    .media-card {
      padding: 1rem;
      border-radius: 16px;
      border: 1px solid rgba(26, 95, 74, 0.12);
      background:
        radial-gradient(ellipse at top left, rgba(45, 143, 115, 0.08), transparent 55%),
        linear-gradient(180deg, #ffffff 0%, #fbfaf8 100%);
      box-shadow: 0 8px 24px rgba(15, 31, 26, 0.05);
    }
    .media-card-ready { border-color: rgba(26, 95, 74, 0.28); }
    .media-card-head { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.85rem; }
    .media-icon {
      width: 2.35rem; height: 2.35rem; border-radius: 12px;
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
      color: var(--primary); background: rgba(26, 95, 74, 0.1); border: 1px solid rgba(26, 95, 74, 0.12);
    }
    .media-icon svg { width: 1.15rem; height: 1.15rem; display: block; }
    .media-copy { flex: 1; min-width: 0; }
    .media-title { font-family: var(--font-display); font-size: 1.05rem; font-weight: 600; color: var(--primary-dark); }
    .media-sub { margin: 0.2rem 0 0; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.4; }
    .media-chip {
      padding: 0.28rem 0.65rem; border-radius: 999px; background: rgba(26, 95, 74, 0.12);
      color: var(--primary-dark); font-size: 0.72rem; font-weight: 700;
    }
    .media-drop {
      position: relative; display: block; border-radius: 14px;
      border: 1.5px dashed rgba(26, 95, 74, 0.22); background: rgba(255,255,255,0.72);
      cursor: pointer; overflow: hidden;
    }
    .media-drop:hover { border-color: rgba(26, 95, 74, 0.45); box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.1); }
    .media-drop input[type="file"] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3; }
    .media-drop-cover { min-height: 11rem; }
    .media-drop-compact { min-height: 4.75rem; }
    .media-drop-empty { pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; padding: 1.5rem 1rem; text-align: center; }
    .media-drop-empty-sm { padding: 1rem; }
    .media-drop-plus {
      width: 2.25rem; height: 2.25rem; margin-bottom: 0.35rem; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      background: linear-gradient(145deg, #2d8f73 0%, #1a5f4a 100%); color: #fff; font-size: 1.25rem; font-weight: 600;
    }
    .media-drop-lead { font-size: 0.92rem; font-weight: 600; color: var(--text); }
    .media-drop-meta { font-size: 0.78rem; color: var(--text-muted); }
    .media-cover-frame { border-radius: 14px; overflow: hidden; border: 1px solid rgba(26, 95, 74, 0.16); background: #0f2922; }
    .media-cover-img { display: block; width: 100%; height: 12rem; object-fit: cover; }
    .media-cover-actions {
      display: flex; gap: 0.5rem; justify-content: flex-end; padding: 0.65rem 0.75rem;
      background: linear-gradient(180deg, #16362d 0%, #0f2922 100%);
    }
    .media-btn {
      display: inline-flex; align-items: center; justify-content: center; min-height: 2rem;
      padding: 0.4rem 0.85rem; border-radius: 7px; border: 1px solid transparent;
      font-family: var(--font-body); font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.01em; cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .media-btn-secondary { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.18); color: #fff; }
    .media-btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .media-btn-danger { background: rgba(254, 226, 226, 0.95); color: #991b1b; }
    .media-btn-danger:hover { background: #fecaca; }
    .media-thumb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 0.65rem; margin-top: 0.85rem; }
    .media-thumb-wrap { position: relative; }
    .media-thumb {
      aspect-ratio: 1; border-radius: 12px; background-size: cover; background-position: center; background-color: #e8eeeb;
      border: 1px solid rgba(26, 95, 74, 0.1);
    }
    .media-remove {
      position: absolute; top: 0.35rem; right: 0.35rem; width: 1.55rem; height: 1.55rem; border: 0; border-radius: 999px;
      background: rgba(15, 41, 34, 0.88); color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; z-index: 2;
    }
    .media-remove:hover { background: #b91c1c; }
    .media-remove-on-video { top: 0.55rem; right: 0.55rem; }
    .video-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 0.85rem; }
    .video-preview-card { border-radius: 14px; overflow: hidden; background: #0f2922; border: 1px solid rgba(26, 95, 74, 0.16); }
    .video-preview-frame { position: relative; }
    .video-preview { display: block; width: 100%; aspect-ratio: 16/10; object-fit: cover; background: #000; }
    .video-preview-name {
      margin: 0; padding: 0.55rem 0.7rem; font-size: 0.75rem; font-weight: 600; color: #d7e3de;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      background: linear-gradient(180deg, #16362d 0%, #0f2922 100%);
    }

    .spinner {
      width: 48px; height: 48px;
      border: 4px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 767px) {
      .form-row { grid-template-columns: 1fr; }
      .create-form { padding: 1.25rem; }
      .form-container { padding: 1.25rem var(--container-pad, 1rem); }
      .create-hero { padding: 2rem var(--container-pad, 1rem); }
      .form-actions { flex-direction: column; }
      .form-actions .btn { width: 100%; }
    }

    @media (max-width: 480px) {
      .create-form { padding: 1rem; }
      .preview-img { max-width: 100%; }
    }
  `]
})
export class EditEventComponent implements OnInit, OnDestroy {
  id = 0;
  draftId = 0;
  isDraft = signal(false);
  title = '';
  description = '';
  eventType = '';
  eventDate = '';
  birthDate = '';
  deathDate = '';
  weddingDate = '';
  visibility = 'Public';
  invitedEmails = '';
  location = '';
  mobileNumber = '';
  country = '';
  mainImage: File | null = null;
  /** Cover URL currently kept from the server (null when removed or replaced by a new file). */
  existingMainUrl: string | null = null;
  mainImagePreview = signal<string | null>(null);
  galleryItems = signal<EditMediaItem[]>([]);
  videoItems = signal<EditMediaItem[]>([]);
  private initialExistingMainUrl: string | null = null;
  private initialGalleryUrls: string[] = [];
  private initialVideoUrls: string[] = [];
  event = signal<{ id: number; eventType: string; birthDate?: string; deathDate?: string; weddingDate?: string; visibility?: string; invitedEmails?: string[] } | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  private initialSnapshot: EditSnapshot | null = null;
  private allowLeave = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private stats: EventStatsService
  ) {}

  cancelLink(): string {
    return this.isDraft() ? `/pending-event/${this.draftId}` : '/events';
  }

  private captureSnapshot(): EditSnapshot {
    return {
      title: this.title,
      description: this.description,
      eventType: this.eventType,
      eventDate: this.eventDate,
      birthDate: this.birthDate,
      deathDate: this.deathDate,
      weddingDate: this.weddingDate,
      visibility: this.visibility,
      invitedEmails: this.invitedEmails,
      location: this.location,
      mobileNumber: this.mobileNumber,
      country: this.country
    };
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialSnapshot || this.allowLeave) return false;
    if (this.mainImage || this.existingMainUrl !== this.initialExistingMainUrl) return true;
    if (this.galleryItems().some((i) => i.source === 'new')) return true;
    if (this.videoItems().some((i) => i.source === 'new')) return true;
    const keptGallery = this.galleryItems().filter((i) => i.source === 'existing').map((i) => i.url);
    const keptVideos = this.videoItems().filter((i) => i.source === 'existing').map((i) => i.url);
    if (
      keptGallery.length !== this.initialGalleryUrls.length ||
      keptGallery.some((url, i) => url !== this.initialGalleryUrls[i])
    ) {
      return true;
    }
    if (
      keptVideos.length !== this.initialVideoUrls.length ||
      keptVideos.some((url, i) => url !== this.initialVideoUrls[i])
    ) {
      return true;
    }
    const current = this.captureSnapshot();
    return (Object.keys(current) as (keyof EditSnapshot)[]).some(
      (key) => (current[key] ?? '') !== (this.initialSnapshot![key] ?? '')
    );
  }

  private confirmDiscard(): boolean {
    if (!this.hasUnsavedChanges()) return true;
    return window.confirm('You have unsaved changes. Discard them and leave this page?');
  }

  onLeaveClick(event: Event): void {
    if (!this.confirmDiscard()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.allowLeave = true;
  }

  onCancel(): void {
    if (!this.confirmDiscard()) return;
    this.allowLeave = true;
    void this.router.navigateByUrl(this.cancelLink());
  }

  /** Used by the route canDeactivate guard after the user confirms. */
  markLeaveAllowed(): void {
    this.allowLeave = true;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
  }

  ngOnInit() {
    const draftParam = this.route.snapshot.paramMap.get('draftId');
    if (draftParam) {
      this.draftId = Number(draftParam);
      this.isDraft.set(true);
      this.loadDraft();
      return;
    }

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.isDraft.set(false);
    this.api.getEventForAdmin(this.id).subscribe({
      next: (ev) => {
        this.event.set(ev);
        this.title = ev.title;
        this.description = ev.description;
        this.eventType = ev.eventType === 'Funeral' ? 'Obituary' : ev.eventType;
        this.eventDate = ev.eventDate?.split('T')[0] ?? '';
        this.birthDate = ev.birthDate?.split('T')[0] ?? '';
        this.deathDate = ev.deathDate?.split('T')[0] ?? '';
        this.weddingDate = '';
        this.visibility = ev.visibility === 'Private' ? 'Public' : (ev.visibility ?? 'Public');
        this.invitedEmails = (ev.invitedEmails ?? []).join(', ');
        this.location = ev.location ?? '';
        this.mobileNumber = ev.mobileNumber ?? '';
        this.country = ev.country ?? '';
        this.applyExistingMedia(ev.mainImageUrl, ev.galleryUrls, ev.videoUrls);
        this.initialSnapshot = this.captureSnapshot();
        this.loading.set(false);
      },
      error: () => {
        this.event.set(null);
        this.loading.set(false);
      }
    });
  }

  private loadDraft() {
    this.api.getOfflineDraftDetail(this.draftId).subscribe({
      next: (d) => {
        this.event.set({
          id: d.id,
          eventType: d.eventType,
          birthDate: d.birthDate ?? undefined,
          deathDate: d.deathDate ?? undefined,
          weddingDate: d.weddingDate ?? undefined,
          visibility: d.visibility,
          invitedEmails: d.invitedEmails
            ? d.invitedEmails.split(',').map((x) => x.trim()).filter(Boolean)
            : undefined
        });
        this.title = d.title;
        this.description = d.description;
        this.eventType = d.eventType === 'Funeral' ? 'Obituary' : d.eventType;
        this.eventDate = d.eventDate?.split('T')[0] ?? '';
        this.birthDate = d.birthDate?.split('T')[0] ?? '';
        this.deathDate = d.deathDate?.split('T')[0] ?? '';
        this.weddingDate = '';
        this.visibility = d.visibility === 'Private' ? 'Public' : (d.visibility ?? 'Public');
        this.invitedEmails = d.invitedEmails ?? '';
        this.location = d.location ?? '';
        this.mobileNumber = d.mobileNumber ?? '';
        this.country = d.country ?? '';
        this.applyExistingMedia(d.mainImageUrl, d.galleryUrlsJson, d.videoUrlsJson);
        this.initialSnapshot = this.captureSnapshot();
        this.loading.set(false);
      },
      error: () => {
        this.event.set(null);
        this.loading.set(false);
      }
    });
  }

  private parseMediaUrls(raw?: string | null): string[] {
    if (!raw?.trim()) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x): x is string => typeof x === 'string' && !!x.trim());
    } catch {
      return [];
    }
  }

  private mediaFileName(url: string, fallback: string): string {
    try {
      const path = url.includes('://') ? new URL(url).pathname : url;
      const name = path.split('/').pop();
      return name && name.trim() ? decodeURIComponent(name) : fallback;
    } catch {
      return fallback;
    }
  }

  private applyExistingMedia(
    mainImageUrl?: string | null,
    galleryJson?: string | null,
    videoJson?: string | null
  ): void {
    this.revokeNewObjectUrls(this.galleryItems());
    this.revokeNewObjectUrls(this.videoItems());

    const cover = mainImageUrl?.trim() || null;
    this.existingMainUrl = cover;
    this.initialExistingMainUrl = cover;
    this.mainImage = null;
    this.mainImagePreview.set(cover);

    const galleryUrls = this.parseMediaUrls(galleryJson);
    const videoUrls = this.parseMediaUrls(videoJson);
    this.initialGalleryUrls = [...galleryUrls];
    this.initialVideoUrls = [...videoUrls];

    this.galleryItems.set(
      galleryUrls.map((url, index) => ({
        key: `g-existing-${index}-${url}`,
        source: 'existing' as const,
        url,
        name: this.mediaFileName(url, `Photo ${index + 1}`)
      }))
    );
    this.videoItems.set(
      videoUrls.map((url, index) => ({
        key: `v-existing-${index}-${url}`,
        source: 'existing' as const,
        url,
        name: this.mediaFileName(url, `Video ${index + 1}`)
      }))
    );
  }

  private revokeNewObjectUrls(items: EditMediaItem[]): void {
    for (const item of items) {
      if (item.source === 'new') URL.revokeObjectURL(item.url);
    }
  }

  onMainImageChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      input.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.error.set('Main image must be an image file.');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('Main image must be 5 MB or smaller.');
      input.value = '';
      return;
    }
    this.error.set('');
    this.mainImage = file;
    this.existingMainUrl = null;
    const reader = new FileReader();
    reader.onload = () => this.mainImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeMainImage(): void {
    this.mainImage = null;
    this.existingMainUrl = null;
    this.mainImagePreview.set(null);
  }

  onGalleryChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    const validFiles: File[] = [];
    let hasInvalid = false;

    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        hasInvalid = true;
        continue;
      }
      validFiles.push(file);
    }

    const room = Math.max(0, 4 - this.galleryItems().length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 4 gallery images allowed. Extra files were skipped.');
    } else if (hasInvalid) {
      this.error.set('Some files were skipped (invalid type or size > 5MB).');
    } else {
      this.error.set('');
    }

    const stamp = Date.now();
    const added: EditMediaItem[] = accepted.map((file, index) => ({
      key: `g-new-${stamp}-${index}-${file.name}`,
      source: 'new',
      url: URL.createObjectURL(file),
      name: file.name,
      file
    }));
    this.galleryItems.update((items) => [...items, ...added]);
    input.value = '';
  }

  removeGalleryImage(index: number): void {
    const current = this.galleryItems();
    const target = current[index];
    if (!target) return;
    if (target.source === 'new') URL.revokeObjectURL(target.url);
    this.galleryItems.set(current.filter((_, i) => i !== index));
  }

  onVideosChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    const allowed = ['.mp4', '.webm', '.mov'];
    const validFiles: File[] = [];
    let hasInvalid = false;

    for (const file of files) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext) || file.size > 100 * 1024 * 1024) {
        hasInvalid = true;
        continue;
      }
      validFiles.push(file);
    }

    const room = Math.max(0, 1 - this.videoItems().length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 1 video allowed. Extra files were skipped.');
    } else if (hasInvalid) {
      this.error.set('Some videos were skipped (only MP4/WEBM/MOV up to 100MB).');
    } else {
      this.error.set('');
    }

    const stamp = Date.now();
    const added: EditMediaItem[] = accepted.map((file, index) => ({
      key: `v-new-${stamp}-${index}-${file.name}`,
      source: 'new',
      url: URL.createObjectURL(file),
      name: file.name,
      file
    }));
    this.videoItems.update((items) => [...items, ...added]);
    input.value = '';
  }

  removeVideo(index: number): void {
    const current = this.videoItems();
    const target = current[index];
    if (!target) return;
    if (target.source === 'new') URL.revokeObjectURL(target.url);
    this.videoItems.set(current.filter((_, i) => i !== index));
  }

  ngOnDestroy(): void {
    this.revokeNewObjectUrls(this.galleryItems());
    this.revokeNewObjectUrls(this.videoItems());
  }

  onVisibilityChange(v: string) {
    if (v !== 'InviteOnly') this.invitedEmails = '';
  }

  onEventTypeChange(type: string) {
    if (type !== 'Obituary' && type !== 'Remembrance') { this.birthDate = ''; this.deathDate = ''; }
    this.weddingDate = '';
  }

  submit() {
    if (!this.title.trim() || !this.description.trim() || !this.eventType || !this.eventDate || !this.country) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    if (!this.mobileNumber.trim()) {
      this.error.set('Mobile number is required.');
      return;
    }
    if (
      (this.eventType === 'Obituary' || this.eventType === 'Remembrance') &&
      (!this.birthDate || !this.deathDate)
    ) {
      this.error.set('Birth date and Date of Passing are required for this event type.');
      return;
    }
    if (this.visibility === 'InviteOnly' && !this.invitedEmails.trim()) {
      this.error.set('Please add at least one email to invite.');
      return;
    }
    if (!this.mainImage && !this.existingMainUrl) {
      this.error.set('Cover image is required. Keep the current one or upload a new photo.');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('description', this.description);
    formData.append('eventType', this.eventType);
    formData.append('eventDate', this.eventDate);
    if (this.eventType === 'Obituary' || this.eventType === 'Remembrance') {
      if (this.birthDate) formData.append('birthDate', this.birthDate);
      if (this.deathDate) formData.append('deathDate', this.deathDate);
    }
    formData.append('visibility', this.visibility === 'Private' ? 'Public' : this.visibility);
    if (this.visibility === 'InviteOnly' && this.invitedEmails.trim()) {
      formData.append('invitedEmails', this.invitedEmails.trim());
    }
    formData.append('location', this.location);
    formData.append('mobileNumber', this.mobileNumber.trim());
    formData.append('country', this.country);

    if (this.mainImage) {
      formData.append('mainImage', this.mainImage);
    } else if (!this.existingMainUrl && this.initialExistingMainUrl) {
      formData.append('clearMainImage', 'true');
    }

    const keepGallery = this.galleryItems()
      .filter((i) => i.source === 'existing')
      .map((i) => i.url);
    const newGallery = this.galleryItems()
      .filter((i) => i.source === 'new' && i.file)
      .map((i) => i.file!);
    formData.append('keepGalleryUrls', JSON.stringify(keepGallery));
    newGallery.forEach((f) => formData.append('galleryImages', f));

    const keepVideos = this.videoItems()
      .filter((i) => i.source === 'existing')
      .map((i) => i.url);
    const newVideos = this.videoItems()
      .filter((i) => i.source === 'new' && i.file)
      .map((i) => i.file!);
    formData.append('keepVideoUrls', JSON.stringify(keepVideos));
    newVideos.forEach((f) => formData.append('videos', f));

    const save$: Observable<unknown> = this.isDraft()
      ? this.api.updateDraft(this.draftId, formData)
      : this.api.updateEvent(this.id, formData);

    save$.subscribe({
      next: () => {
        this.allowLeave = true;
        this.stats.loadFromApi();
        this.saving.set(false);
        this.router.navigate(this.isDraft() ? ['/pending-event', this.draftId] : ['/events']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err.error?.message || 'Failed to update event.');
        this.saving.set(false);
      }
    });
  }

}
