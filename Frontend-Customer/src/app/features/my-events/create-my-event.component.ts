import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MEMORA_DISPLAY_PLANS } from '../../constants/display-plans';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { COUNTRY_CURRENCY_MAP, CurrencyInfo, CurrencyService } from '../../services/currency.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-create-my-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="create-page">
      <header class="create-hero">
        <div class="container create-hero-inner">
          <a routerLink="/my-events" class="back-link">← {{ 'myEvents.back' | t }}</a>
          <div class="create-hero-copy">
            <p class="create-kicker">{{ 'myEvents.composeKicker' | t }}</p>
            <h1>{{ 'myEvents.createTitle' | t }}</h1>
            <p class="create-sub">{{ 'myEvents.createLede' | t }}</p>
          </div>
        </div>
      </header>

      <div class="container form-shell">
        <form (ngSubmit)="submit()" #createForm="ngForm" class="create-form">
          <section class="form-section" aria-labelledby="cust-sec-basics">
            <div class="form-section-head">
              <h2 id="cust-sec-basics" class="form-section-title">{{ 'myEvents.sectionBasics' | t }}</h2>
              <p class="form-section-hint">{{ 'myEvents.sectionBasicsHint' | t }}</p>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'myEvents.eventType' | t }} *</label>
                <select [(ngModel)]="eventType" name="eventType" required #eventTypeInput="ngModel"
                  (ngModelChange)="onEventTypeChange($event)">
                  <option value="">{{ 'myEvents.eventType' | t }}</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Puberty Ceremony">Puberty Ceremony</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Obituary">Obituary</option>
                  <option value="Remembrance">Remembrance</option>
                  <option value="Other">Other</option>
                </select>
                @if (eventTypeInput.invalid && (eventTypeInput.dirty || eventTypeInput.touched)) {
                  <div class="validation-error"><small>Required.</small></div>
                }
              </div>
              <div class="form-group">
                <label>{{ 'myEvents.eventDate' | t }} *</label>
                <input type="date" [(ngModel)]="eventDate" name="eventDate" required #eventDateInput="ngModel" />
                @if (eventDateInput.invalid && (eventDateInput.dirty || eventDateInput.touched)) {
                  <div class="validation-error"><small>Required.</small></div>
                }
              </div>
            </div>
            @if (eventType === 'Obituary' || eventType === 'Remembrance') {
              <div class="form-row">
                <div class="form-group">
                  <label>Birth date *</label>
                  <input type="date" [(ngModel)]="birthDate" name="birthDate" required />
                </div>
                <div class="form-group">
                  <label>Date of passing *</label>
                  <input type="date" [(ngModel)]="deathDate" name="deathDate" required />
                </div>
              </div>
            }
            @if (eventType === 'Wedding' || eventType === 'Anniversary') {
              <div class="form-group">
                <label>{{ eventType === 'Wedding' ? 'Wedding date' : 'Anniversary (wedding) date' }} *</label>
                <input type="date" [(ngModel)]="weddingDate" name="weddingDate" required />
              </div>
            }
          </section>

          <section class="form-section" aria-labelledby="cust-sec-story">
            <div class="form-section-head">
              <h2 id="cust-sec-story" class="form-section-title">{{ 'myEvents.sectionStory' | t }}</h2>
              <p class="form-section-hint">{{ 'myEvents.sectionStoryHint' | t }}</p>
            </div>
            <div class="form-group">
              <label>{{ 'myEvents.fieldTitle' | t }} *</label>
              <input [(ngModel)]="title" name="title" required maxlength="200" #titleInput="ngModel" />
              @if (titleInput.invalid && (titleInput.dirty || titleInput.touched)) {
                <div class="validation-error"><small>Required.</small></div>
              }
              <div class="character-count" [class.exceed-limit]="title.length > 200">{{ title.length }}/200</div>
            </div>
            <div class="form-group">
              <label>{{ 'myEvents.description' | t }} *</label>
              <textarea [(ngModel)]="description" name="description" rows="5" required maxlength="2000"
                #descriptionInput="ngModel"></textarea>
              @if (descriptionInput.invalid && (descriptionInput.dirty || descriptionInput.touched)) {
                <div class="validation-error"><small>Required.</small></div>
              }
              <div class="character-count" [class.exceed-limit]="description.length > 2000">{{ description.length }}/2000</div>
            </div>
          </section>

          <section class="form-section" aria-labelledby="cust-sec-place">
            <div class="form-section-head">
              <h2 id="cust-sec-place" class="form-section-title">{{ 'myEvents.sectionPlace' | t }}</h2>
              <p class="form-section-hint">{{ 'myEvents.sectionPlaceHint' | t }}</p>
            </div>
            <div class="form-group">
              <label>{{ 'myEvents.location' | t }} *</label>
              <input [(ngModel)]="location" name="location" required maxlength="200" #locationInput="ngModel" />
              @if (locationInput.invalid && (locationInput.dirty || locationInput.touched)) {
                <div class="validation-error"><small>Required.</small></div>
              }
            </div>
            <div class="form-group">
              <label>{{ 'myEvents.country' | t }} *</label>
              <select [(ngModel)]="country" name="country" required #countryInput="ngModel"
                (ngModelChange)="onCountryChange($event)">
                <option value="">{{ 'myEvents.country' | t }}</option>
                @for (c of countryOptions; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
              @if (countryInput.invalid && (countryInput.dirty || countryInput.touched)) {
                <div class="validation-error"><small>Required.</small></div>
              }
              @if (selectedCurrency) {
                <div class="currency-auto-badge">
                  <span class="badge-icon" aria-hidden="true">✓</span>
                  <span>
                    Currency: <strong>{{ selectedCurrency.name }} ({{ selectedCurrency.code }})</strong>
                  </span>
                </div>
              }
            </div>
          </section>

          <section class="form-section" aria-labelledby="cust-sec-display">
            <div class="form-section-head">
              <h2 id="cust-sec-display" class="form-section-title">{{ 'myEvents.sectionDisplay' | t }}</h2>
              <p class="form-section-hint">{{ 'myEvents.sectionDisplayHint' | t }}</p>
            </div>
            <div class="form-group display-duration-section">
              <div class="duration-header">
                <label class="duration-label">{{ 'myEvents.durationLabel' | t }} *</label>
                <p class="duration-subtitle">{{ 'myEvents.durationSubtitle' | t }}</p>
              </div>
              @if (displayOptions().length === 0) {
                <p class="form-hint form-hint-loading">{{ 'myEvents.loadingPricing' | t }}</p>
              } @else {
                <div class="display-options">
                  @for (opt of displayOptions(); track opt.days) {
                    <label class="display-option-card" [class.selected]="displayDays === opt.days">
                      <input type="radio" [(ngModel)]="displayDays" name="displayDays" [value]="opt.days" required />
                      <span class="option-duration">{{ opt.label }}</span>
                      <span class="option-price">
                        <span class="option-amount">\${{ opt.price | number:'1.0-0' }}</span>
                        <span class="option-currency">USD</span>
                      </span>
                      <span class="option-feed">{{ opt.days }} {{ 'myEvents.daysOnFeed' | t }}</span>
                    </label>
                  }
                </div>
              }
            </div>
          </section>

          <section class="form-section" aria-labelledby="cust-sec-privacy">
            <div class="form-section-head">
              <h2 id="cust-sec-privacy" class="form-section-title">{{ 'myEvents.sectionPrivacy' | t }}</h2>
              <p class="form-section-hint">{{ 'myEvents.sectionPrivacyHint' | t }}</p>
            </div>
            <div class="form-group">
              <label>{{ 'myEvents.visibility' | t }} *</label>
              <select [(ngModel)]="visibility" name="visibility" required #visibilityInput="ngModel">
                <option value="">{{ 'myEvents.visibility' | t }}</option>
                <option value="Public">Public — anyone with the link</option>
                <option value="Private">Private — only you</option>
                <option value="InviteOnly">Invite only — you and invited emails</option>
              </select>
              @if (visibilityInput.invalid && (visibilityInput.dirty || visibilityInput.touched)) {
                <div class="validation-error"><small>Required.</small></div>
              }
            </div>
            @if (visibility === 'InviteOnly') {
              <div class="form-group invite-section">
                <label>Invite people by email *</label>
                <p class="form-hint">Comma-separated emails. Invited users must log in with that email to view.</p>
                <textarea [(ngModel)]="invitedEmails" name="invitedEmails" rows="3" required
                  placeholder="friend@example.com, family@example.com"></textarea>
              </div>
            }
          </section>

          <section class="form-section form-section-media" aria-labelledby="cust-sec-media">
            <div class="form-section-head">
              <h2 id="cust-sec-media" class="form-section-title">{{ 'myEvents.sectionMedia' | t }}</h2>
              <p class="form-section-hint">{{ 'myEvents.sectionMediaHint' | t }}</p>
            </div>
            <div class="form-group">
              <label>{{ 'myEvents.mainImage' | t }}</label>
              <label class="file-drop">
                <span class="file-drop-text">{{ 'myEvents.fileDropMain' | t }}</span>
                <input type="file" accept="image/*" (change)="onMainImage($event)" />
              </label>
              @if (mainImagePreview()) {
                <img [src]="mainImagePreview()!" alt="" class="preview-img" />
              }
            </div>
            <div class="form-group">
              <label>{{ 'myEvents.gallery' | t }}</label>
              <label class="file-drop file-drop-secondary">
                <span class="file-drop-text">{{ 'myEvents.fileDropGallery' | t }}</span>
                <input type="file" accept="image/*" multiple (change)="onGallery($event)" />
              </label>
            </div>
          </section>

          @if (error()) {
            <div class="error-msg" role="alert">{{ error() }}</div>
          }

          <div class="submit-bar">
            <button type="submit" class="btn btn-primary btn-submit" [disabled]="saving() || !isFormValid()">
              @if (saving()) {
                <span class="btn-spinner" aria-hidden="true"></span>
                {{ 'myEvents.saving' | t }}
              } @else {
                {{ 'myEvents.proceedPayment' | t }}
              }
            </button>
            <p class="submit-hint">{{ 'myEvents.submitHint' | t }}</p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --create-radius: 12px;
      --create-radius-sm: 10px;
      --create-ink: #0f2922;
      --create-muted: #5c726b;
      --create-edge: rgba(13, 61, 50, 0.1);
      --create-glow: rgba(26, 95, 74, 0.12);
    }
    .create-page { min-height: 100%; background: var(--bg); }
    .create-hero {
      border-bottom: 1px solid rgba(13, 61, 50, 0.08);
      background: linear-gradient(135deg, #0d3d32 0%, #1b5f4b 60%, #2f7e66 100%);
      color: #fff;
      padding: 1rem 0 1.35rem;
    }
    .create-hero-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 1.5rem;
      gap: 0.85rem;
    }
    .back-link {
      align-self: flex-start;
      font-size: 0.8125rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.82);
      text-decoration: none;
    }
    .back-link:hover { color: #fff; }
    .create-hero-copy { max-width: 40rem; }
    .create-kicker {
      margin: 0 0 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 600;
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.82);
    }
    .create-hero h1 {
      margin: 0 0 0.4rem;
      color: #fff;
      font-size: clamp(1.12rem, 2.3vw, 1.55rem);
      font-family: var(--font-display);
      font-weight: 700;
    }
    .create-sub {
      margin: 0 auto;
      color: rgba(255, 255, 255, 0.93);
      font-size: 0.86rem;
      line-height: 1.45;
      max-width: 42ch;
    }
    .form-shell {
      max-width: 760px;
      margin: 0 auto;
      padding: 1.5rem 1.5rem 3rem;
    }
    .create-form {
      background: #fff;
      padding: 1.5rem;
      border-radius: var(--create-radius);
      border: 1px solid var(--create-edge);
      box-shadow: 0 1px 2px rgba(13, 61, 50, 0.04), 0 8px 24px rgba(13, 61, 50, 0.06);
    }
    @media (min-width: 768px) { .create-form { padding: 1.75rem 2rem 2rem; } }
    .form-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(13, 61, 50, 0.08);
    }
    .form-section-media { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .form-section-head { margin-bottom: 1rem; }
    .form-section-title {
      font-family: var(--font-display);
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--primary-dark);
      margin: 0 0 0.25rem;
    }
    .form-section-hint {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.45;
      color: var(--create-muted);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.25rem;
    }
    @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
    .create-form .form-group { margin-bottom: 1rem; }
    .create-form .form-group label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #3d524b;
      margin-bottom: 0.4rem;
    }
    .create-form input:not([type="file"]),
    .create-form textarea,
    .create-form select {
      width: 100%;
      box-sizing: border-box;
      border-radius: var(--create-radius-sm);
      border: 1px solid #dce8e3;
      padding: 0.65rem 0.85rem;
      font-size: 0.9375rem;
      color: var(--create-ink);
    }
    .create-form input:focus,
    .create-form textarea:focus,
    .create-form select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--create-glow);
    }
    .file-drop {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 5rem;
      padding: 1rem;
      border: 1.5px dashed #d0ddd8;
      border-radius: var(--create-radius-sm);
      background: #fafcfb;
      cursor: pointer;
    }
    .file-drop input[type="file"] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    .file-drop-text {
      font-size: 0.875rem;
      color: var(--create-muted);
      text-align: center;
      pointer-events: none;
    }
    .file-drop-secondary { min-height: 4rem; }
    .preview-img {
      max-width: min(100%, 280px);
      max-height: 180px;
      border-radius: var(--create-radius-sm);
      margin-top: 0.75rem;
      object-fit: cover;
    }
    .validation-error { color: #c53030; font-size: 0.8125rem; margin-top: 0.35rem; }
    .character-count { font-size: 0.72rem; color: var(--create-muted); text-align: right; margin-top: 0.3rem; }
    .character-count.exceed-limit { color: #c53030; font-weight: 600; }
    .form-hint { font-size: 0.8125rem; color: var(--create-muted); margin: 0 0 0.5rem; }
    .form-hint-loading {
      padding: 1rem;
      text-align: center;
      border-radius: var(--create-radius-sm);
      background: rgba(45, 143, 115, 0.06);
    }
    .currency-auto-badge {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      margin-top: 0.65rem;
      padding: 0.65rem 0.9rem;
      background: linear-gradient(135deg, rgba(45, 143, 115, 0.08), rgba(45, 143, 115, 0.04));
      border: 1px solid rgba(26, 95, 74, 0.15);
      border-radius: var(--create-radius-sm);
      font-size: 0.84rem;
      color: var(--primary-dark);
    }
    .badge-icon {
      width: 1.35rem;
      height: 1.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(26, 95, 74, 0.12);
      border-radius: 999px;
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--primary);
    }
    .display-options {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
      gap: 0.85rem;
    }
    .display-option-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 1rem;
      border: 1px solid var(--create-edge);
      border-radius: var(--create-radius-sm);
      cursor: pointer;
      position: relative;
      background: #fff;
    }
    .display-option-card input { position: absolute; opacity: 0; pointer-events: none; }
    .display-option-card.selected {
      border-color: var(--primary);
      background: #f4f9f7;
      box-shadow: 0 0 0 2px rgba(26, 95, 74, 0.12);
    }
    .option-duration {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    .option-price { display: flex; align-items: baseline; gap: 0.35rem; margin-bottom: 0.4rem; }
    .option-amount { font-size: 1.35rem; font-weight: 700; color: var(--create-ink); }
    .option-currency { font-size: 0.75rem; font-weight: 600; color: var(--create-muted); }
    .option-feed { display: block; font-size: 0.75rem; color: var(--create-muted); }
    .duration-label { font-size: 0.9375rem; font-weight: 600; color: var(--create-ink); display: block; margin-bottom: 0.35rem; }
    .duration-subtitle { font-size: 0.875rem; color: var(--create-muted); margin: 0; }
    .invite-section textarea { min-height: 96px; }
    .error-msg {
      background: #fef2f2;
      color: #b91c1c;
      padding: 0.85rem 1rem;
      border-radius: var(--create-radius-sm);
      margin-bottom: 1rem;
      border: 1px solid #fecaca;
      font-size: 0.875rem;
    }
    .submit-bar {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(13, 61, 50, 0.08);
    }
    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 10rem;
      padding: 0.7rem 1.35rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: var(--create-radius-sm);
      background: var(--primary);
      color: #fff;
      border: none;
      cursor: pointer;
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spinBtn 0.7s linear infinite;
    }
    @keyframes spinBtn { to { transform: rotate(360deg); } }
    .submit-hint { margin: 0; font-size: 0.8125rem; color: var(--create-muted); }
  `]
})
export class CreateMyEventComponent implements OnInit {
  readonly countryOptions = [...Object.keys(COUNTRY_CURRENCY_MAP).sort(), 'Other'];

  eventType = '';
  eventDate = '';
  birthDate = '';
  deathDate = '';
  weddingDate = '';
  title = '';
  description = '';
  location = '';
  country = '';
  displayDays = 0;
  visibility = '';
  invitedEmails = '';
  mainImage: File | null = null;
  galleryImages: File[] = [];
  selectedCurrency: CurrencyInfo | null = null;

  displayOptions = signal<{ days: number; price: number; label: string }[]>([]);
  mainImagePreview = signal<string | null>(null);
  saving = signal(false);
  error = signal('');

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.api.getDisplayOptions().subscribe({
      next: (opts) => {
        this.displayOptions.set(opts.length > 0 ? opts : MEMORA_DISPLAY_PLANS);
        if (this.displayOptions().length > 0) {
          this.displayDays = this.displayOptions()[0].days;
        }
      },
      error: () => {
        this.displayOptions.set(MEMORA_DISPLAY_PLANS);
        this.displayDays = MEMORA_DISPLAY_PLANS[0].days;
      }
    });
  }

  onEventTypeChange(type: string): void {
    if (type !== 'Obituary' && type !== 'Remembrance') {
      this.birthDate = '';
      this.deathDate = '';
    }
    if (type !== 'Wedding' && type !== 'Anniversary') {
      this.weddingDate = '';
    }
  }

  onCountryChange(countryName: string): void {
    this.selectedCurrency = this.currencyService.getCurrencyForCountry(countryName);
  }

  onMainImage(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.mainImage = null;
      this.mainImagePreview.set(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('Main image must be 5 MB or smaller.');
      input.value = '';
      return;
    }
    this.mainImage = file;
    const reader = new FileReader();
    reader.onload = () => this.mainImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onGallery(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.galleryImages = input.files ? Array.from(input.files) : [];
  }

  isFormValid(): boolean {
    if (!this.eventType || !this.eventDate || !this.title.trim() || !this.description.trim()) return false;
    if (!this.location.trim() || !this.country || !this.visibility || !this.displayDays) return false;
    if ((this.eventType === 'Obituary' || this.eventType === 'Remembrance') && (!this.birthDate || !this.deathDate)) {
      return false;
    }
    if ((this.eventType === 'Wedding' || this.eventType === 'Anniversary') && !this.weddingDate) return false;
    if (this.visibility === 'InviteOnly' && !this.invitedEmails.trim()) return false;
    return true;
  }

  submit(): void {
    if (!this.isFormValid()) {
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
    fd.append('location', this.location.trim());
    fd.append('country', this.country);
    fd.append('visibility', this.visibility);
    fd.append('displayDays', String(this.displayDays));
    fd.append('paymentReceived', 'false');
    if (this.eventType === 'Obituary' || this.eventType === 'Remembrance') {
      fd.append('birthDate', this.birthDate);
      fd.append('deathDate', this.deathDate);
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

    const plan = this.displayOptions().find((p) => p.days === this.displayDays) ?? this.displayOptions()[0];

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
