import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { formatUsd, MEMORA_DISPLAY_PLANS } from '../../constants/display-plans';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-create-my-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="create-page container">
      <a routerLink="/my-events" class="back">← {{ 'myEvents.back' | t }}</a>
      <h1>{{ 'myEvents.createTitle' | t }}</h1>
      <p class="lede">{{ 'myEvents.createLede' | t }}</p>

      @if (error()) {
        <p class="err" role="alert">{{ error() }}</p>
      }

      <form (ngSubmit)="submit()" class="form-card">
        <div class="row">
          <label>{{ 'myEvents.eventType' | t }} *</label>
          <select [(ngModel)]="eventType" name="eventType" required>
            <option value="">Select</option>
            <option value="Birthday">Birthday</option>
            <option value="Puberty Ceremony">Puberty Ceremony</option>
            <option value="Wedding">Wedding</option>
            <option value="Anniversary">Anniversary</option>
            <option value="Obituary">Obituary</option>
            <option value="Remembrance">Remembrance</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="row">
          <label>{{ 'myEvents.eventDate' | t }} *</label>
          <input type="date" [(ngModel)]="eventDate" name="eventDate" required />
        </div>
        @if (eventType === 'Obituary' || eventType === 'Remembrance') {
          <div class="row two">
            <div>
              <label>Birth date *</label>
              <input type="date" [(ngModel)]="birthDate" name="birthDate" required />
            </div>
            <div>
              <label>Date of passing *</label>
              <input type="date" [(ngModel)]="deathDate" name="deathDate" required />
            </div>
          </div>
        }
        @if (eventType === 'Wedding' || eventType === 'Anniversary') {
          <div class="row">
            <label>Wedding date *</label>
            <input type="date" [(ngModel)]="weddingDate" name="weddingDate" required />
          </div>
        }
        <div class="row">
          <label>{{ 'myEvents.fieldTitle' | t }} *</label>
          <input type="text" [(ngModel)]="title" name="title" required maxlength="200" />
        </div>
        <div class="row">
          <label>{{ 'myEvents.description' | t }} *</label>
          <textarea [(ngModel)]="description" name="description" rows="5" required></textarea>
        </div>
        <div class="row two">
          <div>
            <label>{{ 'myEvents.location' | t }}</label>
            <input type="text" [(ngModel)]="location" name="location" />
          </div>
          <div>
            <label>{{ 'myEvents.country' | t }}</label>
            <input type="text" [(ngModel)]="country" name="country" />
          </div>
        </div>
        <div class="row">
          <label>{{ 'myEvents.displayDays' | t }} *</label>
          <select [(ngModel)]="displayDays" name="displayDays" required>
            @for (opt of displayPlans; track opt.days) {
              <option [ngValue]="opt.days">{{ opt.label }} — {{ formatUsd(opt.price) }} USD</option>
            }
          </select>
        </div>
        <div class="row">
          <label>{{ 'myEvents.visibility' | t }}</label>
          <select [(ngModel)]="visibility" name="visibility">
            <option value="Public">Public</option>
            <option value="Private">Private</option>
            <option value="InviteOnly">Invite only</option>
          </select>
        </div>
        @if (visibility === 'InviteOnly') {
          <div class="row">
            <label>Invite emails (comma-separated)</label>
            <input type="text" [(ngModel)]="invitedEmails" name="invitedEmails" />
          </div>
        }
        <div class="row">
          <label>{{ 'myEvents.mainImage' | t }}</label>
          <input type="file" accept="image/*" (change)="onMainImage($event)" />
        </div>
        <div class="row">
          <label>{{ 'myEvents.gallery' | t }}</label>
          <input type="file" accept="image/*" multiple (change)="onGallery($event)" />
        </div>
        <button type="submit" class="btn-primary" [disabled]="saving()">
          {{ saving() ? ('myEvents.saving' | t) : ('myEvents.proceedPayment' | t) }}
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .create-page { padding: 1.25rem 1rem 2.5rem; max-width: 640px; }
      .back { font-size: 0.88rem; color: #1a5f4a; text-decoration: none; }
      h1 { margin: 0.75rem 0 0.35rem; font-family: var(--font-display); color: #0f2922; }
      .lede { margin: 0 0 1.25rem; color: #5a6f68; font-size: 0.9rem; }
      .form-card {
        background: #fff;
        border: 1px solid rgba(26, 95, 74, 0.12);
        border-radius: 16px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .row label { display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #46675f; margin-bottom: 0.35rem; }
      .row input, .row select, .row textarea {
        width: 100%;
        padding: 0.65rem 0.75rem;
        border: 1px solid #d0e0d8;
        border-radius: 10px;
        font: inherit;
      }
      .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .btn-primary {
        margin-top: 0.5rem;
        padding: 0.75rem 1.25rem;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, #0d3d32, #2f7e66);
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .err { color: #b91c1c; font-size: 0.88rem; }
      @media (max-width: 560px) { .two { grid-template-columns: 1fr; } }
    `
  ]
})
export class CreateMyEventComponent {
  eventType = '';
  eventDate = '';
  birthDate = '';
  deathDate = '';
  weddingDate = '';
  title = '';
  description = '';
  location = '';
  country = '';
  displayDays = 90;
  visibility = 'Public';
  invitedEmails = '';
  mainImage: File | null = null;
  galleryImages: File[] = [];

  readonly displayPlans = MEMORA_DISPLAY_PLANS;
  readonly formatUsd = formatUsd;
  saving = signal(false);
  error = signal('');

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  onMainImage(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.mainImage = input.files?.[0] ?? null;
  }

  onGallery(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.galleryImages = input.files ? Array.from(input.files) : [];
  }

  submit(): void {
    if (!this.eventType || !this.eventDate || !this.title.trim() || !this.description.trim()) {
      this.error.set('Please fill all required fields.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const fd = new FormData();
    fd.append('title', this.title.trim());
    fd.append('description', this.description.trim());
    fd.append('eventType', this.eventType);
    fd.append('eventDate', this.eventDate);
    fd.append('visibility', this.visibility);
    fd.append('displayDays', String(this.displayDays));
    fd.append('paymentReceived', 'false');
    if (this.location) fd.append('location', this.location);
    if (this.country) fd.append('country', this.country);
    if (this.eventType === 'Obituary' || this.eventType === 'Remembrance') {
      if (this.birthDate) fd.append('birthDate', this.birthDate);
      if (this.deathDate) fd.append('deathDate', this.deathDate);
    }
    if ((this.eventType === 'Wedding' || this.eventType === 'Anniversary') && this.weddingDate) {
      fd.append('weddingDate', this.weddingDate);
    }
    if (this.visibility === 'InviteOnly' && this.invitedEmails.trim()) {
      fd.append('invitedEmails', this.invitedEmails.trim());
    }
    const user = this.auth.currentUser();
    if (user) fd.append('createdBy', user.displayName);
    if (this.mainImage) fd.append('mainImage', this.mainImage);
    this.galleryImages.forEach((f) => fd.append('galleryImages', f));

    const plan = this.displayPlans.find((p) => p.days === this.displayDays) ?? this.displayPlans[1];

    this.api.saveEventDraft(fd).subscribe({
      next: (res) => {
        this.saving.set(false);
        void this.router.navigate(['/my-events/payment', res.draftId], {
          queryParams: { days: plan.days, price: plan.price, label: plan.label }
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Could not save event. Try again.');
      }
    });
  }
}
