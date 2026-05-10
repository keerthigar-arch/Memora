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
        <h1>Edit Event</h1>
        <p>Update your memory record.</p>
      </div>
    </section>

    @if (loading()) {
      <div class="container" style="text-align:center;padding:4rem;"><div class="spinner"></div><p>Loading...</p></div>
    } @else if (!event()) {
      <div class="container" style="text-align:center;padding:4rem;">
        <p>Event not found.</p>
        <a routerLink="/" class="btn btn-primary">Back to Feed</a>
      </div>
    } @else {
      <div class="container form-container">
        <form (ngSubmit)="submit()" class="create-form">
          <div class="form-row">
            <div class="form-group">
              <label>Event Type *</label>
              <select [(ngModel)]="eventType" name="eventType" required (ngModelChange)="onEventTypeChange($event)">
                <option value="Birthday">Birthday Wishes</option>
                <option value="Anniversary">Wedding Anniversary</option>
                <option value="Obituary">Obituary & Memorial</option>
              </select>
            </div>
            <div class="form-group">
              <label>Event Date *</label>
              <input type="date" [(ngModel)]="eventDate" name="eventDate" required />
            </div>
          </div>

          @if (eventType === 'Obituary') {
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

          @if (eventType === 'Anniversary') {
            <div class="form-group">
              <label>Wedding Date *</label>
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
            <label>Main Image (leave empty to keep current)</label>
            <input type="file" accept="image/*" (change)="onMainImageChange($event)" />
            @if (mainImagePreview()) {
              <img [src]="mainImagePreview()" alt="Preview" class="preview-img" />
            }
          </div>

          <div class="form-group">
            <label>Gallery Images (optional, replaces current)</label>
            <input type="file" accept="image/*" multiple (change)="onGalleryChange($event)" />
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-lg" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Save Changes' }}
            </button>
            <a [routerLink]="['/event', id]" class="btn btn-outline">Cancel</a>
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

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getEvent(this.id).subscribe({
      next: (ev) => {
        this.event.set(ev);
        this.title = ev.title;
        this.description = ev.description;
        this.eventType = ev.eventType === 'Wedding' ? 'Anniversary' : ev.eventType === 'Funeral' ? 'Obituary' : ev.eventType;
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

  onMainImageChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.mainImage = file;
      const reader = new FileReader();
      reader.onload = () => this.mainImagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onGalleryChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.galleryImages = Array.from(input.files || []);
  }

  onVisibilityChange(v: string) {
    if (v !== 'InviteOnly') this.invitedEmails = '';
  }

  onEventTypeChange(type: string) {
    if (type !== 'Obituary') { this.birthDate = ''; this.deathDate = ''; }
    if (type !== 'Anniversary') { this.weddingDate = ''; }
  }

  submit() {
    if (!this.title.trim() || !this.description.trim() || !this.eventType || !this.eventDate || !this.country) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    if (this.eventType === 'Obituary' && (!this.birthDate || !this.deathDate)) {
      this.error.set('Birth date and Date of Passing are required for obituaries.');
      return;
    }
    if (this.eventType === 'Anniversary' && !this.weddingDate) {
      this.error.set('Wedding date is required for anniversaries.');
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
    if (this.eventType === 'Obituary') {
      if (this.birthDate) formData.append('birthDate', this.birthDate);
      if (this.deathDate) formData.append('deathDate', this.deathDate);
    }
    if (this.eventType === 'Anniversary' && this.weddingDate) formData.append('weddingDate', this.weddingDate);
    formData.append('visibility', this.visibility);
    if (this.visibility === 'InviteOnly' && this.invitedEmails.trim()) {
      formData.append('invitedEmails', this.invitedEmails.trim());
    }
    formData.append('location', this.location);
    formData.append('country', this.country);
    if (this.mainImage) formData.append('mainImage', this.mainImage);
    this.galleryImages.forEach(f => formData.append('galleryImages', f));

    this.api.updateEvent(this.id, formData).subscribe({
      next: () => {
        this.stats.loadFromApi();
        this.saving.set(false);
        this.router.navigate(['/event', this.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update event.');
        this.saving.set(false);
      }
    });
  }
}
