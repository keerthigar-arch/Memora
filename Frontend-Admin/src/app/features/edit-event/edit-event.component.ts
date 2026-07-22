import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="create-hero">
      <div class="container">
        <h1>{{ isDraft() ? 'Edit pending event' : 'Edit Event' }}</h1>
        <p>{{ isDraft() ? 'Update this customer event before publishing.' : 'Update your memory record.' }}</p>
      </div>
    </section>

    @if (loading()) {
      <div class="container" style="text-align:center;padding:4rem;"><div class="spinner"></div><p>Loading...</p></div>
    } @else if (!event()) {
      <div class="container" style="text-align:center;padding:4rem;">
        <p>{{ isDraft() ? 'Draft not found. It may already be published.' : 'Event not found.' }}</p>
        <a [routerLink]="isDraft() ? '/payments' : '/events'" class="btn btn-primary">Back</a>
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
              <input type="date" [(ngModel)]="eventDate" name="eventDate" required />
            </div>
          </div>

          @if (eventType === 'Obituary' || eventType === 'Remembrance') {
            <div class="form-row">
              <div class="form-group">
                <label>Birth Date *</label>
                <input type="date" [(ngModel)]="birthDate" name="birthDate" required />
              </div>
              <div class="form-group">
                <label>Date of Passing *</label>
                <input type="date" [(ngModel)]="deathDate" name="deathDate" required />
              </div>
            </div>
          }

          @if (eventType === 'Anniversary' || eventType === 'Wedding') {
            <div class="form-group">
              <label>{{ eventType === 'Wedding' ? 'Wedding date' : 'Anniversary (wedding) date' }} *</label>
              <input type="date" [(ngModel)]="weddingDate" name="weddingDate" required />
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
            <label>Location (optional)</label>
            <input [(ngModel)]="location" name="location" />
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

          <div class="form-group">
            <label>Main Image (leave empty to keep current) · JPG, PNG, GIF or WEBP, max 5MB</label>
            <input type="file" accept="image/*" (change)="onMainImageChange($event)" />
            @if (mainImagePreview()) {
              <img [src]="mainImagePreview()" alt="Preview" class="preview-img" />
            }
          </div>

          <div class="form-group">
            <label>Gallery Images (optional, replaces current) · up to 8 images, max 5MB each</label>
            <input type="file" accept="image/*" multiple (change)="onGalleryChange($event)" />
            @if (galleryImages.length > 0) {
              <p class="form-hint">{{ galleryImages.length }} image(s) selected</p>
            }
          </div>

          <div class="form-group">
            <label>Videos (optional, replaces current) · up to 3 files, MP4 / WEBM / MOV, max 100MB each</label>
            <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" multiple (change)="onVideosChange($event)" />
            @if (videos.length > 0) {
              <p class="form-hint">{{ videos.length }} video(s) selected</p>
            }
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-lg" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Save Changes' }}
            </button>
            <a [routerLink]="cancelLink()" class="btn btn-outline">Cancel</a>
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
    .create-hero h1 { color: white; margin-bottom: 0.5rem; }
    .create-hero p { opacity: 0.9; margin: 0; }
    .form-container { max-width: 700px; margin: 0 auto; padding: 2rem 1.5rem; }
    .create-form {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
    .preview-img { max-width: 200px; max-height: 150px; border-radius: var(--radius); margin-top: 0.5rem; object-fit: cover; }
    .error-msg { background: #fef2f2; color: #c53030; padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-lg { padding: 1rem 2rem; font-size: 1.05rem; }
    .invite-section textarea { min-height: 80px; }
    .form-hint { font-size: 0.875rem; color: var(--text-muted); margin: -0.25rem 0 0.5rem; }
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
export class EditEventComponent implements OnInit {
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
  event = signal<{ id: number; eventType: string; birthDate?: string; deathDate?: string; weddingDate?: string; visibility?: string; invitedEmails?: string[] } | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private stats: EventStatsService
  ) {}

  cancelLink(): string {
    return this.isDraft() ? `/pending-event/${this.draftId}` : '/events';
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
    if (file) {
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
    }
  }

  onGalleryChange(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    const validFiles: File[] = [];
    let hasInvalid = false;

    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        hasInvalid = true;
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 8) {
      this.error.set('Maximum 8 gallery images allowed. Extra files were skipped.');
      validFiles.length = 8;
    } else if (hasInvalid) {
      this.error.set('Some files were skipped (invalid type or size > 5MB).');
    } else {
      this.error.set('');
    }

    this.galleryImages = validFiles;
  }

  onVideosChange(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files || []);
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

    if (validFiles.length > 3) {
      this.error.set('Maximum 3 videos allowed. Extra files were skipped.');
      validFiles.length = 3;
    } else if (hasInvalid) {
      this.error.set('Some videos were skipped (only MP4/WEBM/MOV up to 100MB).');
    } else {
      this.error.set('');
    }

    this.videos = validFiles;
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

    const save$ = this.isDraft()
      ? this.api.updateDraft(this.draftId, formData)
      : this.api.updateEvent(this.id, formData);

    save$.subscribe({
      next: () => {
        this.stats.loadFromApi();
        this.saving.set(false);
        this.router.navigate(this.isDraft() ? ['/pending-event', this.draftId] : ['/events']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update event.');
        this.saving.set(false);
      }
    });
  }

}
