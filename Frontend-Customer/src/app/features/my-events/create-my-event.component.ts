import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MEMORA_DISPLAY_PLANS } from '../../constants/display-plans';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { COUNTRY_CURRENCY_MAP } from '../../services/currency.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

@Component({
  selector: 'app-create-my-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, DatePickerComponent],
  template: `
    <div class="create-page">
      <header class="create-hero">
        <div class="container create-hero-inner">
          <div class="page-back-bar page-back-bar--flush">
            <a routerLink="/my-events" class="page-back page-back--on-dark">← {{ 'nav.back' | t }}</a>
          </div>
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
                <app-date-picker
                  [(ngModel)]="eventDate"
                  name="eventDate"
                  required
                  placeholder="Choose event date"
                  ariaLabel="Event date"
                  #eventDateInput="ngModel"
                ></app-date-picker>
                @if (eventDateInput.invalid && (eventDateInput.dirty || eventDateInput.touched)) {
                  <div class="validation-error"><small>Required.</small></div>
                }
              </div>
            </div>
            @if (eventType === 'Obituary' || eventType === 'Remembrance') {
              <div class="form-row">
                <div class="form-group">
                  <label>Birth date *</label>
                  <app-date-picker
                    [(ngModel)]="birthDate"
                    name="birthDate"
                    required
                    placeholder="Choose birth date"
                    ariaLabel="Birth date"
                  ></app-date-picker>
                </div>
                <div class="form-group">
                  <label>Date of passing *</label>
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
              <label>{{ 'myEvents.country' | t }} *</label>
              <select [(ngModel)]="country" name="country" required #countryInput="ngModel">
                <option value="">{{ 'myEvents.country' | t }}</option>
                @for (c of countryOptions; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
              @if (countryInput.invalid && (countryInput.dirty || countryInput.touched)) {
                <div class="validation-error"><small>Required.</small></div>
              }
            </div>
            <div class="form-group">
              <label>{{ 'myEvents.location' | t }} *</label>
              <input [(ngModel)]="location" name="location" required maxlength="200" #locationInput="ngModel" />
              @if (locationInput.invalid && (locationInput.dirty || locationInput.touched)) {
                <div class="validation-error"><small>Required.</small></div>
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
                <p class="form-hint form-hint-loading">
                  <span class="spinner spinner-inline" aria-hidden="true"></span>
                  {{ 'myEvents.loadingPricing' | t }}
                </p>
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
                    <div class="media-title">{{ 'myEvents.mainImage' | t }} <span class="media-req">*</span></div>
                    <p class="media-sub">{{ 'myEvents.fileDropMain' | t }}</p>
                  </div>
                  @if (mainImagePreview()) {
                    <span class="media-chip">Ready</span>
                  }
                </div>

                @if (mainImagePreview()) {
                  <div class="media-cover-frame">
                    <img [src]="mainImagePreview()!" alt="" class="media-cover-img" />
                    <div class="media-cover-actions">
                      <label class="media-btn media-btn-secondary">
                        Change
                        <input type="file" accept="image/*" (change)="onMainImage($event)" hidden />
                      </label>
                      <button type="button" class="media-btn media-btn-danger" (click)="removeMainImage()">Remove</button>
                    </div>
                  </div>
                } @else {
                  <label class="media-drop media-drop-cover">
                    <input type="file" accept="image/*" (change)="onMainImage($event)" />
                    <div class="media-drop-empty">
                      <span class="media-drop-plus" aria-hidden="true">+</span>
                      <span class="media-drop-lead">Drop an image or click to upload</span>
                      <span class="media-drop-meta">Recommended landscape photo</span>
                    </div>
                  </label>
                  <div class="validation-error"><small>{{ 'myEvents.mainImageRequired' | t }}</small></div>
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
                    <div class="media-title">{{ 'myEvents.gallery' | t }}</div>
                    <p class="media-sub">{{ 'myEvents.fileDropGallery' | t }}</p>
                  </div>
                  @if (galleryPreviews().length > 0) {
                    <span class="media-chip">{{ galleryPreviews().length }} / 4</span>
                  }
                </div>
                <label class="media-drop media-drop-compact">
                  <input type="file" accept="image/*" multiple (change)="onGallery($event)" />
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
                        <button
                          type="button"
                          class="media-remove"
                          (click)="removeGalleryImage(i)"
                          [attr.aria-label]="'Remove ' + preview.name"
                        >×</button>
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
                    <div class="media-title">{{ 'myEvents.videos' | t }}</div>
                    <p class="media-sub">{{ 'myEvents.fileDropVideos' | t }}</p>
                  </div>
                  @if (videoPreviews().length > 0) {
                    <span class="media-chip">{{ videoPreviews().length }} / 1</span>
                  }
                </div>
                <label class="media-drop media-drop-compact">
                  <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" (change)="onVideos($event)" />
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
                          <video
                            class="video-preview"
                            [src]="preview.url"
                            controls
                            playsinline
                            preload="metadata"
                            (play)="ensureVideoAudible($event)"
                          ></video>
                          <button
                            type="button"
                            class="media-remove media-remove-on-video"
                            (click)="removeVideo(i)"
                            [attr.aria-label]="'Remove ' + preview.name"
                          >×</button>
                        </div>
                        <p class="video-preview-name">{{ preview.name }}</p>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            @if (needsConfirmationDocument()) {
              <div class="media-card" [class.media-card-ready]="!!confirmationDocument()">
                <div class="media-card-head">
                  <span class="media-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6"/>
                      <path d="M8 13h8M8 17h6"/>
                    </svg>
                  </span>
                  <div class="media-copy">
                    <div class="media-title">{{ 'myEvents.confirmationDoc' | t }} *</div>
                    <p class="media-sub">{{ confirmationDocHint() }}</p>
                  </div>
                  @if (confirmationDocument()) {
                    <span class="media-chip">Ready</span>
                  }
                </div>
                <label class="media-drop media-drop-compact">
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
                    (change)="onConfirmationDocument($event)"
                  />
                  <div class="media-drop-empty media-drop-empty-sm">
                    <span class="media-drop-lead">{{ confirmationDocument()?.name || ('myEvents.confirmationDocDrop' | t) }}</span>
                    <span class="media-drop-meta">{{ 'myEvents.confirmationDocMeta' | t }}</span>
                  </div>
                </label>
                @if (confirmationDocument()) {
                  <div class="doc-selected">
                    <span>{{ confirmationDocument()!.name }}</span>
                    <button type="button" class="media-remove" (click)="removeConfirmationDocument()" aria-label="Remove document">×</button>
                  </div>
                }
              </div>
            }
          </section>

          @if (error()) {
            <div class="error-msg" role="alert">{{ error() }}</div>
          }

          <div class="submit-bar">
            <div class="submit-actions">
              <button type="submit" class="btn btn-primary btn-submit" [disabled]="saving() || !isFormValid()">
                @if (saving()) {
                  <span class="btn-spinner" aria-hidden="true"></span>
                  {{ 'myEvents.saving' | t }}
                } @else {
                  {{ 'myEvents.proceedPayment' | t }}
                }
              </button>
              <a routerLink="/my-events" class="btn btn-outline btn-cancel">{{ 'myEvents.cancel' | t }}</a>
            </div>
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
    .create-hero-inner > .page-back-bar {
      align-self: stretch;
      text-align: left;
    }
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
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary-dark);
      margin: 0 0 0.25rem;
      line-height: 1.25;
    }
    .form-section-hint {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.4;
      color: var(--create-muted);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.25rem;
    }
    @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
    .create-form .form-group { margin-bottom: 1.15rem; }
    .create-form .form-group > label:not(.checkbox-row):not(.display-option-card):not(.media-drop):not(.media-btn) {
      display: block;
      font-family: var(--font-display, 'Playfair Display', Georgia, serif);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary-dark, #0d3d32);
      line-height: 1.25;
      margin-bottom: 0.45rem;
    }
    .create-form input:not([type="file"]),
    .create-form textarea,
    .create-form select {
      width: 100%;
      box-sizing: border-box;
      border-radius: var(--create-radius-sm);
      border: 1px solid #dce8e3;
      background: #fff;
      padding: 0.7rem 0.9rem;
      font-family: var(--font-body);
      font-size: 0.9375rem;
      color: var(--create-ink);
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .create-form input:not([type="file"]):hover,
    .create-form textarea:hover,
    .create-form select:hover {
      border-color: #c5d8d0;
    }
    .create-form input:not([type="file"]):focus,
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
    .video-preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
    .video-preview {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      border-radius: var(--create-radius-sm);
      background: #000;
    }

    .media-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .media-card {
      position: relative;
      padding: 1rem;
      border-radius: 16px;
      border: 1px solid rgba(26, 95, 74, 0.12);
      background:
        radial-gradient(ellipse at top left, rgba(45, 143, 115, 0.08), transparent 55%),
        linear-gradient(180deg, #ffffff 0%, #fbfaf8 100%);
      box-shadow: 0 8px 24px rgba(15, 31, 26, 0.05);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .media-card:hover {
      border-color: rgba(26, 95, 74, 0.22);
      box-shadow: 0 12px 28px rgba(15, 31, 26, 0.08);
    }
    .media-card-ready { border-color: rgba(26, 95, 74, 0.28); }
    .media-card-head {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }
    .media-icon {
      width: 2.35rem;
      height: 2.35rem;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--primary, #1a5f4a);
      background: rgba(26, 95, 74, 0.1);
      border: 1px solid rgba(26, 95, 74, 0.12);
    }
    .media-icon svg { width: 1.15rem; height: 1.15rem; display: block; }
    .media-copy { flex: 1; min-width: 0; }
    .media-title {
      font-family: var(--font-display, 'Playfair Display', Georgia, serif);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary-dark, #0d3d32);
      line-height: 1.25;
    }
    .media-req { color: #c53030; }
    .media-sub {
      margin: 0.2rem 0 0;
      font-size: 0.8125rem;
      color: var(--create-muted);
      line-height: 1.4;
    }
    .media-chip {
      flex-shrink: 0;
      padding: 0.28rem 0.65rem;
      border-radius: 999px;
      background: rgba(26, 95, 74, 0.12);
      color: var(--primary-dark, #0d3d32);
      font-size: 0.72rem;
      font-weight: 700;
    }
    .media-drop {
      position: relative;
      display: block;
      border-radius: 14px;
      border: 1.5px dashed rgba(26, 95, 74, 0.22);
      background: rgba(255, 255, 255, 0.72);
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }
    .media-drop:hover {
      border-color: rgba(26, 95, 74, 0.45);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.1);
    }
    .media-drop input[type="file"] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      z-index: 3;
    }
    .media-drop-cover { min-height: 11rem; }
    .media-drop-compact { min-height: 4.75rem; }
    .media-drop-empty {
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 1.5rem 1rem;
      text-align: center;
    }
    .media-drop-empty-sm { padding: 1rem; }
    .media-drop-plus {
      width: 2.25rem;
      height: 2.25rem;
      margin-bottom: 0.35rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, #2d8f73 0%, #1a5f4a 100%);
      color: #fff;
      font-size: 1.25rem;
      font-weight: 600;
      box-shadow: 0 8px 18px rgba(26, 95, 74, 0.25);
    }
    .media-drop-lead {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--create-ink);
    }
    .media-drop-meta {
      font-size: 0.78rem;
      color: var(--create-muted);
    }
    .media-cover-preview {
      position: relative;
      min-height: 11rem;
      pointer-events: none;
    }
    .media-cover-preview img {
      display: block;
      width: 100%;
      height: 11rem;
      object-fit: cover;
    }
    .media-drop-cta {
      position: absolute;
      left: 50%;
      bottom: 0.85rem;
      transform: translateX(-50%);
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      background: rgba(15, 41, 34, 0.82);
      color: #fff;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .media-cover-frame {
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(26, 95, 74, 0.16);
      box-shadow: 0 10px 24px rgba(15, 31, 26, 0.1);
      background: #0f2922;
    }
    .media-cover-img {
      display: block;
      width: 100%;
      height: 12rem;
      object-fit: cover;
    }
    .media-cover-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      padding: 0.65rem 0.75rem;
      background: linear-gradient(180deg, #16362d 0%, #0f2922 100%);
    }
    .media-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2rem;
      padding: 0.4rem 0.85rem;
      border-radius: 7px;
      border: 1px solid transparent;
      font-family: var(--font-body);
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .media-btn-secondary {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.18);
      color: #fff;
    }
    .media-btn-secondary:hover { background: rgba(255, 255, 255, 0.2); }
    .media-btn-danger {
      background: rgba(254, 226, 226, 0.95);
      color: #991b1b;
    }
    .media-btn-danger:hover { background: #fecaca; }
    .media-thumb-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
      gap: 0.65rem;
      margin-top: 0.85rem;
    }
    .media-thumb-wrap { position: relative; }
    .media-thumb {
      aspect-ratio: 1;
      border-radius: 12px;
      background-size: cover;
      background-position: center;
      background-color: #e8eeeb;
      box-shadow: 0 4px 14px rgba(15, 31, 26, 0.1);
      border: 1px solid rgba(26, 95, 74, 0.1);
    }
    .media-remove {
      position: absolute;
      top: 0.35rem;
      right: 0.35rem;
      width: 1.55rem;
      height: 1.55rem;
      border: 0;
      border-radius: 999px;
      background: rgba(15, 41, 34, 0.88);
      color: #fff;
      font-size: 1rem;
      line-height: 1;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    .media-remove:hover { background: #b91c1c; }
    .media-remove-on-video {
      top: 0.55rem;
      right: 0.55rem;
    }
    .video-preview-card {
      border-radius: 14px;
      overflow: hidden;
      background: #0f2922;
      border: 1px solid rgba(26, 95, 74, 0.16);
      box-shadow: 0 8px 20px rgba(15, 31, 26, 0.1);
    }
    .video-preview-frame { position: relative; }
    .video-preview-card .video-preview {
      border-radius: 0;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      background: #000;
    }
    .video-preview-name {
      margin: 0;
      padding: 0.55rem 0.7rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #d7e3de;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      background: linear-gradient(180deg, #16362d 0%, #0f2922 100%);
    }
    .doc-selected {
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      background: #f0f9f5;
      border: 1px solid rgba(26, 95, 74, 0.14);
      font-size: 0.85rem;
      color: #0f2922;
    }
    .doc-selected .media-remove {
      position: static;
    }

    .validation-error { color: #c53030; font-size: 0.8125rem; margin-top: 0.35rem; }
    .character-count { font-size: 0.72rem; color: var(--create-muted); text-align: right; margin-top: 0.3rem; }
    .character-count.exceed-limit { color: #c53030; font-weight: 600; }
    .form-hint { font-size: 0.8125rem; color: var(--create-muted); margin: 0 0 0.5rem; }
    .form-hint-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      padding: 1rem;
      text-align: center;
      border-radius: var(--create-radius-sm);
      background: rgba(45, 143, 115, 0.06);
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
    .duration-label {
      font-family: var(--font-display, 'Playfair Display', Georgia, serif);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary-dark, #0d3d32);
      line-height: 1.25;
      display: block;
      margin-bottom: 0.35rem;
    }
    .duration-subtitle { font-size: 0.8125rem; color: var(--create-muted); margin: 0; line-height: 1.45; }
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
    .submit-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-cancel {
      min-height: 2.5rem;
      padding: 0.55rem 1.15rem;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      border-radius: 8px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      color: var(--primary-dark);
      border: 1px solid rgba(26, 95, 74, 0.28);
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .btn-cancel:hover {
      background: rgba(26, 95, 74, 0.05);
      border-color: rgba(26, 95, 74, 0.45);
    }
    .btn-submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      min-height: 2.5rem;
      min-width: 9.5rem;
      padding: 0.55rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      border-radius: 8px;
      background: var(--primary);
      color: #fff;
      border: 1px solid transparent;
      box-shadow: 0 1px 2px rgba(13, 61, 50, 0.12);
      cursor: pointer;
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .btn-submit:hover:not(:disabled) {
      background: var(--primary-dark);
      box-shadow: 0 2px 8px rgba(26, 95, 74, 0.2);
    }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
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

    @media (max-width: 480px) {
      .create-hero {
        padding: 0.85rem 0;
      }
      .form-shell {
        padding: 1rem var(--container-pad, 0.875rem) 2rem;
      }
      .create-form {
        padding: 1rem;
      }
      .submit-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .btn-submit,
      .btn-cancel {
        width: 100%;
        min-width: 0;
        justify-content: center;
      }
    }
  `]
})
export class CreateMyEventComponent implements OnInit, OnDestroy {
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
  videos: File[] = [];
  confirmationDocFile: File | null = null;

  displayOptions = signal<{ days: number; price: number; label: string }[]>([]);
  mainImagePreview = signal<string | null>(null);
  galleryPreviews = signal<{ url: string; name: string }[]>([]);
  videoPreviews = signal<{ url: string; name: string }[]>([]);
  confirmationDocument = signal<File | null>(null);
  saving = signal(false);
  error = signal('');

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
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
    this.weddingDate = '';
    if (!this.needsConfirmationDocument()) {
      this.removeConfirmationDocument();
    }
  }

  needsConfirmationDocument(): boolean {
    const t = (this.eventType || '').trim();
    return t === 'Wedding' || t === 'Obituary' || t === 'Funeral';
  }

  confirmationDocHint(): string {
    if (this.eventType === 'Wedding') {
      return 'Upload a marriage certificate or wedding invitation that confirms the ceremony.';
    }
    return 'Upload a funeral notice, death certificate, or other document that confirms the funeral.';
  }

  onConfirmationDocument(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      input.value = '';
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    if (!allowed.includes(ext)) {
      this.error.set('Confirmation document must be a PDF or image (pdf, jpg, png, webp).');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('Confirmation document must be 10 MB or smaller.');
      input.value = '';
      return;
    }
    this.error.set('');
    this.confirmationDocFile = file;
    this.confirmationDocument.set(file);
    input.value = '';
  }

  removeConfirmationDocument(): void {
    this.confirmationDocFile = null;
    this.confirmationDocument.set(null);
  }

  onMainImage(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      input.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.error.set('Main image must be an image file (jpg, png, gif, webp).');
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

  onGallery(ev: Event): void {
    const input = ev.target as HTMLInputElement;
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

    const room = Math.max(0, 4 - this.galleryImages.length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 4 gallery images allowed. Extra files were skipped.');
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

  onVideos(ev: Event): void {
    const input = ev.target as HTMLInputElement;
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

    const room = Math.max(0, 1 - this.videos.length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 1 video allowed. Extra files were skipped.');
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

  ensureVideoAudible(event: Event): void {
    const video = event.target as HTMLVideoElement | null;
    if (!video || video.tagName !== 'VIDEO') return;
    video.muted = false;
    video.defaultMuted = false;
    if (video.volume === 0) {
      video.volume = 1;
    }
  }

  private setGalleryPreviews(files: File[]): void {
    for (const preview of this.galleryPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
    this.galleryPreviews.set(
      files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }))
    );
  }

  private setVideoPreviews(files: File[]): void {
    for (const preview of this.videoPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
    this.videoPreviews.set(
      files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }))
    );
  }

  ngOnDestroy(): void {
    for (const preview of this.galleryPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
    for (const preview of this.videoPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
  }

  isFormValid(): boolean {
    if (!this.eventType || !this.eventDate || !this.title.trim() || !this.description.trim()) return false;
    if (!this.location.trim() || !this.country || !this.visibility || !this.displayDays) return false;
    if ((this.eventType === 'Obituary' || this.eventType === 'Remembrance') && (!this.birthDate || !this.deathDate)) {
      return false;
    }
    if (this.visibility === 'InviteOnly' && !this.invitedEmails.trim()) return false;
    if (!this.mainImage) return false;
    if (this.needsConfirmationDocument() && !this.confirmationDocFile) return false;
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
    fd.append('currency', 'USD');
    fd.append('visibility', this.visibility);
    fd.append('displayDays', String(this.displayDays));
    fd.append('paymentReceived', 'false');
    if (this.eventType === 'Obituary' || this.eventType === 'Remembrance') {
      fd.append('birthDate', this.birthDate);
      fd.append('deathDate', this.deathDate);
    }
    if (this.visibility === 'InviteOnly' && this.invitedEmails.trim()) {
      fd.append('invitedEmails', this.invitedEmails.trim());
    }
    const user = this.auth.currentUser();
    if (user) fd.append('createdBy', user.displayName);
    if (this.mainImage) fd.append('mainImage', this.mainImage);
    this.galleryImages.forEach((f) => fd.append('galleryImages', f));
    this.videos.forEach((f) => fd.append('videos', f));
    if (this.confirmationDocFile) {
      fd.append('confirmationDocument', this.confirmationDocFile);
    }

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
