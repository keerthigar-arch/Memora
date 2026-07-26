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
  country: string;
};

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePickerComponent],
  template: `
    <section class="create-hero">
      <div class="container">
        <a
          [routerLink]="isDraft() ? '/payments' : '/events'"
          class="back-link"
          (click)="onLeaveClick($event)"
        >← {{ isDraft() ? 'Back to payments' : 'Back to events' }}</a>
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

          @if (eventType === 'Anniversary' || eventType === 'Wedding') {
            <div class="form-group">
              <label>{{ eventType === 'Wedding' ? 'Wedding date' : 'Anniversary (wedding) date' }} *</label>
              <app-date-picker
                [(ngModel)]="weddingDate"
                name="weddingDate"
                required
                placeholder="Choose ceremony date"
                ariaLabel="Ceremony date"
              ></app-date-picker>
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
            <label>Privacy / Visibility</label>
            <select [(ngModel)]="visibility" name="visibility" (ngModelChange)="onVisibilityChange($event)">
              <option value="Public">Public — Anyone can view</option>
              <option value="Private">Private — Only you</option>
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
                  <p class="media-sub">Leave empty to keep current · JPG, PNG, GIF or WEBP · max 5MB</p>
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

            <div class="media-card" [class.media-card-ready]="galleryPreviews().length > 0">
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
                  <p class="media-sub">Replaces current gallery · up to 8 photos · max 5MB each</p>
                </div>
                @if (galleryPreviews().length > 0) {
                  <span class="media-chip">{{ galleryPreviews().length }} / 8</span>
                }
              </div>
              <label class="media-drop media-drop-compact">
                <input type="file" accept="image/*" multiple (change)="onGalleryChange($event)" />
                <div class="media-drop-empty media-drop-empty-sm">
                  <span class="media-drop-lead">Add gallery photos</span>
                  <span class="media-drop-meta">Click or drop multiple images</span>
                </div>
              </label>
              @if (galleryPreviews().length > 0) {
                <div class="media-thumb-grid">
                  @for (preview of galleryPreviews(); track preview.url; let i = $index) {
                    <div class="media-thumb-wrap">
                      <div class="media-thumb" [style.background-image]="'url(' + preview.url + ')'" [title]="preview.name"></div>
                      <button type="button" class="media-remove" (click)="removeGalleryImage(i)" [attr.aria-label]="'Remove ' + preview.name">×</button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="media-card" [class.media-card-ready]="videoPreviews().length > 0">
              <div class="media-card-head">
                <span class="media-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="6" width="13" height="12" rx="2"/>
                    <path d="M16 10.5l5-3v9l-5-3v-3z"/>
                  </svg>
                </span>
                <div class="media-copy">
                  <div class="media-title">Videos</div>
                  <p class="media-sub">Replaces current videos · up to 3 files · MP4 / WEBM / MOV · max 100MB each</p>
                </div>
                @if (videoPreviews().length > 0) {
                  <span class="media-chip">{{ videoPreviews().length }} / 3</span>
                }
              </div>
              <label class="media-drop media-drop-compact">
                <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" multiple (change)="onVideosChange($event)" />
                <div class="media-drop-empty media-drop-empty-sm">
                  <span class="media-drop-lead">Add event videos</span>
                  <span class="media-drop-meta">Shown on the event detail page</span>
                </div>
              </label>
              @if (videoPreviews().length > 0) {
                <div class="video-preview-grid">
                  @for (preview of videoPreviews(); track preview.url; let i = $index) {
                    <div class="video-preview-card">
                      <div class="video-preview-frame">
                        <video class="video-preview" [src]="preview.url" controls playsinline preload="metadata"></video>
                        <button type="button" class="media-remove media-remove-on-video" (click)="removeVideo(i)" [attr.aria-label]="'Remove ' + preview.name">×</button>
                      </div>
                      <p class="video-preview-name">{{ preview.name }}</p>
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
            <button type="submit" class="btn btn-primary btn-lg" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Save Changes' }}
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
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .preview-img { max-width: 200px; max-height: 150px; border-radius: var(--radius); margin-top: 0.5rem; object-fit: cover; }
    .error-msg { background: #fef2f2; color: #c53030; padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
    .btn-lg { padding: 1rem 2rem; font-size: 1.05rem; }
    .invite-section textarea { min-height: 80px; }
    .form-hint { font-size: 0.875rem; color: var(--text-muted); margin: -0.25rem 0 0.5rem; }

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
      padding: 0.35rem 0.85rem; border-radius: 999px; border: 0; font-size: 0.78rem; font-weight: 700; cursor: pointer;
    }
    .media-btn-secondary { background: rgba(255,255,255,0.14); color: #fff; }
    .media-btn-danger { background: #fee2e2; color: #b91c1c; }
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
  country = '';
  mainImage: File | null = null;
  galleryImages: File[] = [];
  videos: File[] = [];
  mainImagePreview = signal<string | null>(null);
  galleryPreviews = signal<{ url: string; name: string }[]>([]);
  videoPreviews = signal<{ url: string; name: string }[]>([]);
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
      country: this.country
    };
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialSnapshot || this.allowLeave) return false;
    if (this.mainImage || this.galleryImages.length > 0 || this.videos.length > 0) return true;
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
        this.weddingDate = ev.weddingDate?.split('T')[0] ?? '';
        this.visibility = ev.visibility ?? 'Public';
        this.invitedEmails = (ev.invitedEmails ?? []).join(', ');
        this.location = ev.location ?? '';
        this.country = ev.country ?? '';
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
        this.weddingDate = d.weddingDate?.split('T')[0] ?? '';
        this.visibility = d.visibility ?? 'Public';
        this.invitedEmails = d.invitedEmails ?? '';
        this.location = d.location ?? '';
        this.country = d.country ?? '';
        if (d.mainImageUrl) this.mainImagePreview.set(d.mainImageUrl);
        this.initialSnapshot = this.captureSnapshot();
        this.loading.set(false);
      },
      error: () => {
        this.event.set(null);
        this.loading.set(false);
      }
    });
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
    const reader = new FileReader();
    reader.onload = () => this.mainImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeMainImage(): void {
    this.mainImage = null;
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

    const room = Math.max(0, 8 - this.galleryImages.length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 8 gallery images allowed. Extra files were skipped.');
    } else if (hasInvalid) {
      this.error.set('Some files were skipped (invalid type or size > 5MB).');
    } else {
      this.error.set('');
    }

    this.galleryImages = [...this.galleryImages, ...accepted];
    this.setGalleryPreviews(this.galleryImages);
    input.value = '';
  }

  removeGalleryImage(index: number): void {
    const next = [...this.galleryImages];
    next.splice(index, 1);
    this.galleryImages = next;
    this.setGalleryPreviews(next);
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

    const room = Math.max(0, 3 - this.videos.length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 3 videos allowed. Extra files were skipped.');
    } else if (hasInvalid) {
      this.error.set('Some videos were skipped (only MP4/WEBM/MOV up to 100MB).');
    } else {
      this.error.set('');
    }

    this.videos = [...this.videos, ...accepted];
    this.setVideoPreviews(this.videos);
    input.value = '';
  }

  removeVideo(index: number): void {
    const next = [...this.videos];
    next.splice(index, 1);
    this.videos = next;
    this.setVideoPreviews(next);
  }

  private setGalleryPreviews(files: File[]): void {
    for (const preview of this.galleryPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
    this.galleryPreviews.set(files.map((file) => ({ url: URL.createObjectURL(file), name: file.name })));
  }

  private setVideoPreviews(files: File[]): void {
    for (const preview of this.videoPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
    this.videoPreviews.set(files.map((file) => ({ url: URL.createObjectURL(file), name: file.name })));
  }

  ngOnDestroy(): void {
    for (const preview of this.galleryPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
    for (const preview of this.videoPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
  }

  onVisibilityChange(v: string) {
    if (v !== 'InviteOnly') this.invitedEmails = '';
  }

  onEventTypeChange(type: string) {
    if (type !== 'Obituary' && type !== 'Remembrance') { this.birthDate = ''; this.deathDate = ''; }
    if (type !== 'Anniversary' && type !== 'Wedding') { this.weddingDate = ''; }
  }

  submit() {
    if (!this.title.trim() || !this.description.trim() || !this.eventType || !this.eventDate || !this.country) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    if (
      (this.eventType === 'Obituary' || this.eventType === 'Remembrance') &&
      (!this.birthDate || !this.deathDate)
    ) {
      this.error.set('Birth date and Date of Passing are required for this event type.');
      return;
    }
    if ((this.eventType === 'Anniversary' || this.eventType === 'Wedding') && !this.weddingDate) {
      this.error.set('Wedding date is required for this event type.');
      return;
    }
    if (this.visibility === 'InviteOnly' && !this.invitedEmails.trim()) {
      this.error.set('Please add at least one email to invite.');
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
    if ((this.eventType === 'Anniversary' || this.eventType === 'Wedding') && this.weddingDate)
      formData.append('weddingDate', this.weddingDate);
    formData.append('visibility', this.visibility);
    if (this.visibility === 'InviteOnly' && this.invitedEmails.trim()) {
      formData.append('invitedEmails', this.invitedEmails.trim());
    }
    formData.append('location', this.location);
    formData.append('country', this.country);
    if (this.mainImage) formData.append('mainImage', this.mainImage);
    this.galleryImages.forEach(f => formData.append('galleryImages', f));
    this.videos.forEach(f => formData.append('videos', f));

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
