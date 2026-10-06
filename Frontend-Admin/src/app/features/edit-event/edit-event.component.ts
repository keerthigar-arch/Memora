import { Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { COUNTRY_CURRENCY_MAP, CurrencyService } from '../../services/currency.service';
import { MEMORA_DISPLAY_PLANS } from '../../constants/display-plans';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { AppDialogService } from '../../services/app-dialog.service';

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
  displayDays: number;
  paymentReceived: boolean;
  existingConfirmationUrl: string | null;
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
    <div class="create-page">
      <header class="create-hero">
        <div class="container create-hero-inner">
          <div class="page-back-bar page-back-bar--flush">
            <a
              [routerLink]="isDraft() ? '/payments' : '/events'"
              class="page-back page-back--on-dark"
              (click)="onLeaveClick($event)"
            >← Back</a>
          </div>
          <div class="create-hero-copy">
            <p class="create-kicker">{{ isDraft() ? 'Review' : 'Update' }}</p>
            <h1>{{ isDraft() ? 'Edit pending event' : 'Edit event' }}</h1>
            <p class="create-sub">
              {{ isDraft()
                ? 'Update this customer event before publishing. Every field from the original submission can be changed.'
                : 'Same fields as creating an event — update the memory record, media, display window, and privacy.' }}
            </p>
          </div>
        </div>
      </header>

      @if (loading()) {
        <div class="container form-shell" style="text-align:center;padding:4rem;">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      } @else if (!event()) {
        <div class="container form-shell" style="text-align:center;padding:4rem;">
          <p>{{ isDraft() ? 'Draft not found. It may already be published.' : 'Event not found.' }}</p>
          <a [routerLink]="isDraft() ? '/payments' : '/events'" class="btn btn-primary" (click)="onLeaveClick($event)">Back</a>
        </div>
      } @else {
        <div class="container form-shell">
          <form (ngSubmit)="submit()" #editForm="ngForm" class="create-form">

            <section class="form-section" aria-labelledby="sec-basics">
              <div class="form-section-head">
                <h2 id="sec-basics" class="form-section-title">Event basics</h2>
                <p class="form-section-hint">Choose the occasion and the date guests will see first.</p>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Event Type *</label>
                  <select [(ngModel)]="eventType" name="eventType" required #eventTypeInput="ngModel"
                    (ngModelChange)="onEventTypeChange($event)">
                    <option value="">Select type</option>
                    <option value="Birthday">Birthdays</option>
                    <option value="Puberty Ceremony">Puberty Ceremonies</option>
                    <option value="Wedding">Weddings</option>
                    <option value="Anniversary">Anniversaries</option>
                    <option value="Obituary">Obituaries</option>
                    <option value="Remembrance">Remembrance</option>
                    <option value="Other">Others</option>
                  </select>
                  @if (eventTypeInput.invalid && (eventTypeInput.dirty || eventTypeInput.touched)) {
                    <div class="validation-error"><small>Event type is required.</small></div>
                  }
                </div>
                <div class="form-group">
                  <label>Event Date *</label>
                  <app-date-picker
                    [(ngModel)]="eventDate"
                    name="eventDate"
                    required
                    placeholder="Choose event date"
                    ariaLabel="Event date"
                    #eventDateInput="ngModel"
                  ></app-date-picker>
                  @if (eventDateInput.invalid && (eventDateInput.dirty || eventDateInput.touched)) {
                    <div class="validation-error"><small>Event date is required.</small></div>
                  }
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

              @if (eventType === 'Wedding') {
                <div class="form-group">
                  <label>Wedding Date</label>
                  <app-date-picker
                    [(ngModel)]="weddingDate"
                    name="weddingDate"
                    placeholder="Choose wedding date"
                    ariaLabel="Wedding date"
                  ></app-date-picker>
                </div>
              }
            </section>

            <section class="form-section" aria-labelledby="sec-story">
              <div class="form-section-head">
                <h2 id="sec-story" class="form-section-title">Title &amp; story</h2>
                <p class="form-section-hint">This headline and narrative appear on the public page.</p>
              </div>
              <div class="form-group">
                <label>Title *</label>
                <input [(ngModel)]="title" name="title" placeholder="e.g. John &amp; Jane's Wedding"
                  required minlength="3" maxlength="100" #titleInput="ngModel" />
                @if (titleInput.invalid && (titleInput.dirty || titleInput.touched)) {
                  <div class="validation-error">
                    @if (titleInput.errors?.['required'])  { <small>Title is required.</small> }
                    @if (titleInput.errors?.['minlength']) { <small>Title must be at least 3 characters.</small> }
                    @if (titleInput.errors?.['maxlength']) { <small>Title cannot exceed 100 characters.</small> }
                  </div>
                }
                <div class="character-count" [class.exceed-limit]="title.length > 100">{{ title.length }}/100</div>
              </div>
              <div class="form-group">
                <label>Description *</label>
                <textarea [(ngModel)]="description" name="description"
                  placeholder="Share the story, details, and meaning of this event..."
                  required minlength="10" maxlength="2000" rows="5" #descriptionInput="ngModel"></textarea>
                @if (descriptionInput.invalid && (descriptionInput.dirty || descriptionInput.touched)) {
                  <div class="validation-error">
                    @if (descriptionInput.errors?.['required'])  { <small>Description is required.</small> }
                    @if (descriptionInput.errors?.['minlength']) { <small>Description must be at least 10 characters.</small> }
                    @if (descriptionInput.errors?.['maxlength']) { <small>Description cannot exceed 2000 characters.</small> }
                  </div>
                }
                <div class="character-count" [class.exceed-limit]="description.length > 2000">{{ description.length }}/2000</div>
              </div>
            </section>

            <section class="form-section" aria-labelledby="sec-place">
              <div class="form-section-head">
                <h2 id="sec-place" class="form-section-title">Place &amp; country</h2>
                <p class="form-section-hint">Country for locale preferences, then location for the listing.</p>
              </div>
              <div class="form-group">
                <label>Country * <span class="label-note">Sets regional preferences</span></label>
                <select [(ngModel)]="country" name="country" required #countryInput="ngModel"
                  (ngModelChange)="onCountryChange($event)">
                  <option value="">Select country</option>
                  @for (c of countryOptions; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
                @if (countryInput.invalid && (countryInput.dirty || countryInput.touched)) {
                  <div class="validation-error"><small>Country is required.</small></div>
                }
              </div>
              <div class="form-group">
                <label>Location *</label>
                <input [(ngModel)]="location" name="location" placeholder="e.g. Central Park, New York"
                  required maxlength="200" #locationInput="ngModel" />
                @if (locationInput.invalid && (locationInput.dirty || locationInput.touched)) {
                  <div class="validation-error">
                    @if (locationInput.errors?.['required'])  { <small>Location is required.</small> }
                    @if (locationInput.errors?.['maxlength']) { <small>Location cannot exceed 200 characters.</small> }
                  </div>
                }
                @if (location) {
                  <div class="character-count" [class.exceed-limit]="location.length > 200">{{ location.length }}/200</div>
                }
              </div>
              <div class="form-group">
                <label>Mobile number *</label>
                <input
                  type="tel"
                  [(ngModel)]="mobileNumber"
                  name="mobileNumber"
                  placeholder="e.g. +44 20 7946 0123"
                  required
                  maxlength="32"
                  #mobileInput="ngModel"
                />
                @if (mobileInput.invalid && (mobileInput.dirty || mobileInput.touched)) {
                  <div class="validation-error"><small>Mobile number is required.</small></div>
                }
              </div>
            </section>

            <section class="form-section" aria-labelledby="sec-display">
              <div class="form-section-head">
                <h2 id="sec-display" class="form-section-title">Display window</h2>
                <p class="form-section-hint">Choose how long the event stays featured in admin.</p>
              </div>
              <div class="form-group display-duration-section">
                <div class="duration-header">
                  <label class="duration-label">Duration *</label>
                  <p class="duration-subtitle">Select one display duration for this event.</p>
                </div>
                @if (displayOptions().length === 0) {
                  <p class="form-hint form-hint-loading">Loading pricing…</p>
                } @else {
                  <div class="display-options">
                    @for (opt of displayOptions(); track opt.days) {
                      <label class="display-option-card" [class.selected]="displayDays == opt.days">
                        <input type="radio" [(ngModel)]="displayDays" name="displayDays" [value]="opt.days" required />
                        <span class="option-duration">{{ opt.label }}</span>
                        <span class="option-price">
                          <span class="option-amount">\${{ opt.price | number:'1.0-0' }}</span>
                          <span class="option-currency">USD</span>
                        </span>
                        <span class="option-feed">{{ opt.days }} days on the feed</span>
                      </label>
                    }
                  </div>
                }
              </div>
              <div class="form-group">
                <label class="checkbox-row">
                  <input type="checkbox" [(ngModel)]="paymentReceived" name="paymentReceived" />
                  <span>Payment received</span>
                </label>
              </div>
            </section>

            <section class="form-section" aria-labelledby="sec-privacy">
              <div class="form-section-head">
                <h2 id="sec-privacy" class="form-section-title">Privacy</h2>
                <p class="form-section-hint">Control who can open the public event link.</p>
              </div>
              <div class="form-group">
                <label>Visibility *</label>
                <select [(ngModel)]="visibility" name="visibility" required #visibilityInput="ngModel"
                  (ngModelChange)="onVisibilityChange($event)">
                  <option value="">Select visibility</option>
                  <option value="Public">Public — anyone with the link</option>
                  <option value="InviteOnly">Invite Only — you and invited emails</option>
                </select>
                @if (visibilityInput.invalid && (visibilityInput.dirty || visibilityInput.touched)) {
                  <div class="validation-error"><small>Visibility is required.</small></div>
                }
              </div>
              @if (visibility === 'InviteOnly') {
                <div class="form-group invite-section">
                  <label>Invite people by email *</label>
                  <p class="form-hint">Comma-separated emails. Invited users must log in with that email to view.</p>
                  <textarea [(ngModel)]="invitedEmails" name="invitedEmails" rows="3"
                    placeholder="sister@example.com, brother@example.com"
                    required minlength="5" maxlength="500"
                    pattern="^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}(\\s*,\\s*[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})*$"
                    #emailInput="ngModel"></textarea>
                  @if (emailInput.invalid && (emailInput.dirty || emailInput.touched)) {
                    <div class="validation-error"><small>Please enter valid comma-separated email addresses.</small></div>
                  }
                  @if (invitedEmails) {
                    <div class="character-count" [class.exceed-limit]="invitedEmails.length > 500">
                      {{ invitedEmails.length }}/500
                    </div>
                  }
                </div>
              }
            </section>

            <section class="form-section form-section-media" aria-labelledby="sec-media">
              <div class="form-section-head">
                <h2 id="sec-media" class="form-section-title">Media</h2>
                <p class="form-section-hint">Keep, replace, or remove files. A strong cover image helps the card stand out in the feed.</p>
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
                      <div class="media-title">Cover image <span class="media-req">*</span></div>
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
                      <p class="media-sub">Keep, remove, or add · up to 3 files · MP4 / WEBM / MOV · max 100MB each</p>
                    </div>
                    @if (videoItems().length > 0) {
                      <span class="media-chip">{{ videoItems().length }} / 3</span>
                    }
                  </div>
                  <label class="media-drop media-drop-compact">
                    <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" multiple (change)="onVideosChange($event)" />
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
                  <div class="stream-add">
                    <label class="stream-label" for="editStreamLink">Add YouTube or live stream link</label>
                    <p class="stream-hint">Paste a YouTube link or a live streaming link. Visitors open it from the event page.</p>
                    <div class="stream-row">
                      <input
                        id="editStreamLink"
                        type="url"
                        name="streamLinkDraft"
                        [(ngModel)]="streamLinkInput"
                        placeholder="https://www.youtube.com/watch?v=… or a live stream URL"
                        (keydown.enter)="$event.preventDefault(); addStreamLink()"
                      />
                      <button type="button" class="stream-add-btn" (click)="addStreamLink()">Add link</button>
                    </div>
                    @if (streamLinkError) {
                      <p class="stream-error">{{ streamLinkError }}</p>
                    }
                    @if (streamLinks().length) {
                      <ul class="stream-list">
                        @for (link of streamLinks(); track link; let i = $index) {
                          <li>
                            <a [href]="link" target="_blank" rel="noopener noreferrer">{{ link }}</a>
                            <button type="button" (click)="removeStreamLink(i)">Remove</button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                </div>

                @if (needsConfirmationDocument()) {
                  <div class="media-card" [class.media-card-ready]="hasConfirmationDocument()">
                    <div class="media-card-head">
                      <span class="media-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <path d="M14 2v6h6"/>
                          <path d="M8 13h8M8 17h6"/>
                        </svg>
                      </span>
                      <div class="media-copy">
                        <div class="media-title">Confirmation document <span class="media-req">*</span></div>
                        <p class="media-sub">{{ confirmationDocHint() }}</p>
                      </div>
                      @if (hasConfirmationDocument()) {
                        <span class="media-chip">Ready</span>
                      }
                    </div>
                    @if (existingConfirmationUrl && !confirmationFile) {
                      <div class="doc-existing">
                        @if (isImageDocument(existingConfirmationUrl)) {
                          <a [href]="existingConfirmationUrl" target="_blank" rel="noopener noreferrer" class="doc-preview-link">
                            <img [src]="existingConfirmationUrl" alt="Confirmation document" class="doc-preview-img" />
                          </a>
                        } @else {
                          <a [href]="existingConfirmationUrl" target="_blank" rel="noopener noreferrer" class="doc-file-link">
                            View current document
                          </a>
                        }
                        <p class="media-drop-meta">Keep this file or upload a replacement (any file type, max 10MB).</p>
                      </div>
                    }
                    <label class="media-drop media-drop-compact">
                      <input
                        type="file"
                        (change)="onConfirmationDocument($event)"
                      />
                      <div class="media-drop-empty media-drop-empty-sm">
                        <span class="media-drop-lead">{{ confirmationFile?.name || (existingConfirmationUrl ? 'Replace document' : 'Upload confirmation document') }}</span>
                        <span class="media-drop-meta">Any file type · max 10MB</span>
                      </div>
                    </label>
                    @if (confirmationFile) {
                      <div class="doc-selected">
                        <span>{{ confirmationFile.name }}</span>
                        <button type="button" class="media-remove" (click)="removeConfirmationDocument()" aria-label="Remove document">×</button>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>

            @if (error()) {
              <div class="error-msg" role="alert">{{ error() }}</div>
            }

            <div class="submit-bar">
              <div class="submit-actions">
                <button type="submit" class="btn btn-primary btn-submit" [disabled]="saving() || !isFormValid()">
                  @if (saving()) {
                    <span class="btn-spinner" aria-hidden="true"></span>
                    Saving…
                  } @else {
                    Save changes
                  }
                </button>
                <button type="button" class="btn btn-outline btn-cancel" (click)="onCancel()" [disabled]="saving()">Cancel</button>
              </div>
              <p class="submit-hint">{{ isDraft() ? 'Saves this pending event without publishing.' : 'Updates the published event record.' }}</p>
            </div>
          </form>
        </div>
      }
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
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 0 1.5rem; gap: 0.85rem;
    }
    .create-hero-inner > .page-back-bar { align-self: stretch; text-align: left; }
    .create-hero-copy { max-width: 40rem; }
    .create-kicker {
      margin: 0 0 0.4rem; text-transform: uppercase; letter-spacing: 0.12em;
      font-weight: 600; font-size: 0.72rem; color: rgba(255, 255, 255, 0.82);
    }
    .create-hero h1 {
      margin: 0 0 0.4rem; color: #fff; font-size: clamp(1.12rem, 2.3vw, 1.55rem);
      line-height: 1.24; font-weight: 700; font-family: var(--font-display);
    }
    .create-sub {
      margin: 0 auto; color: rgba(255, 255, 255, 0.93); font-size: 0.86rem;
      line-height: 1.45; max-width: 46ch;
    }
    .form-shell { max-width: 760px; margin: 0 auto; padding: 1.5rem 1.5rem 3rem; }
    .create-form {
      background: #fff; padding: 1.5rem; border-radius: var(--create-radius);
      border: 1px solid var(--create-edge);
      box-shadow: 0 1px 2px rgba(13, 61, 50, 0.04), 0 8px 24px rgba(13, 61, 50, 0.06);
    }
    @media (min-width: 768px) { .create-form { padding: 1.75rem 2rem 2rem; } }
    .form-section {
      margin-bottom: 1.5rem; padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(13, 61, 50, 0.08);
    }
    .form-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .form-section-media { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .form-section-head { margin-bottom: 1rem; }
    .form-section-title {
      font-family: var(--font-display); font-size: 1.05rem; font-weight: 600;
      color: var(--primary-dark); margin: 0 0 0.25rem; line-height: 1.25;
    }
    .form-section-hint { margin: 0; font-size: 0.8125rem; line-height: 1.4; color: var(--create-muted); }
    .label-note { font-weight: 500; font-size: 0.75rem; color: var(--create-muted); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.25rem; }
    @media (max-width: 767px) { .form-row { grid-template-columns: 1fr; } }
    .create-form .form-group { margin-bottom: 1.15rem; }
    .create-form .form-group > label:not(.checkbox-row):not(.display-option-card):not(.media-drop):not(.media-btn) {
      display: block; font-family: var(--font-display); font-size: 1.05rem; font-weight: 600;
      color: var(--primary-dark); line-height: 1.25; margin-bottom: 0.45rem;
    }
    .create-form input:not([type="file"]),
    .create-form textarea,
    .create-form select {
      width: 100%; box-sizing: border-box; border-radius: var(--create-radius-sm);
      border: 1px solid #dce8e3; background: #fff; padding: 0.7rem 0.9rem;
      font-family: var(--font-body); font-size: 0.9375rem; color: var(--create-ink);
    }
    .create-form input:not([type="file"]):focus,
    .create-form textarea:focus,
    .create-form select:focus {
      outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--create-glow);
    }
    .validation-error { color: #c53030; font-size: 0.8125rem; margin-top: 0.35rem; }
    .character-count { font-size: 0.72rem; color: var(--create-muted); text-align: right; margin-top: 0.3rem; }
    .character-count.exceed-limit { color: #c53030; font-weight: 600; }
    .form-hint { font-size: 0.8125rem; color: var(--create-muted); margin: -0.15rem 0 0.5rem; line-height: 1.45; }
    .error-msg { background: #fef2f2; color: #c53030; padding: 1rem; border-radius: var(--create-radius); margin-bottom: 1rem; }
    .invite-section textarea { min-height: 96px; }
    .duration-label {
      font-family: var(--font-display); font-size: 1.05rem; font-weight: 600;
      color: var(--primary-dark); display: block; margin-bottom: 0.35rem;
    }
    .duration-subtitle { font-size: 0.8125rem; color: var(--create-muted); margin: 0; line-height: 1.45; }
    .display-options {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
      gap: 0.85rem; margin-top: 0.5rem;
    }
    .display-option-card {
      display: flex; flex-direction: column; align-items: flex-start; padding: 1rem;
      border: 1px solid var(--create-edge); border-radius: var(--create-radius-sm);
      cursor: pointer; position: relative; background: #fff;
    }
    .display-option-card input { position: absolute; opacity: 0; pointer-events: none; }
    .display-option-card:hover { border-color: rgba(26, 95, 74, 0.28); box-shadow: 0 4px 14px rgba(13, 61, 50, 0.08); }
    .display-option-card.selected {
      border-color: var(--primary); background: #f4f9f7; box-shadow: 0 0 0 2px rgba(26, 95, 74, 0.12);
    }
    .option-duration { display: block; font-size: 0.8125rem; font-weight: 600; color: var(--primary); margin-bottom: 0.5rem; }
    .option-price { display: flex; align-items: baseline; gap: 0.35rem; margin-bottom: 0.4rem; }
    .option-amount { font-size: 1.35rem; font-weight: 700; color: var(--create-ink); }
    .option-currency { font-size: 0.75rem; font-weight: 600; color: var(--create-muted); }
    .option-feed { display: block; font-size: 0.75rem; color: var(--create-muted); }
    .checkbox-row {
      display: inline-flex; align-items: center; gap: 0.55rem;
      font-size: 0.92rem; font-weight: 600; color: var(--create-ink);
    }
    .checkbox-row input[type="checkbox"] { width: 1rem; height: 1rem; }
    .submit-bar {
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem;
      margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(13, 61, 50, 0.08);
    }
    .submit-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
    .btn-cancel, .btn-submit {
      min-height: 2.5rem; padding: 0.55rem 1.25rem; font-size: 0.875rem; font-weight: 600; border-radius: 8px;
    }
    .btn-submit { display: inline-flex; align-items: center; gap: 0.45rem; min-width: 9.5rem; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff; border-radius: 50%; animation: spinBtn 0.7s linear infinite;
    }
    @keyframes spinBtn { to { transform: rotate(360deg); } }
    .submit-hint { margin: 0; font-size: 0.8125rem; color: var(--create-muted); }
    .media-stack { display: flex; flex-direction: column; gap: 1rem; }
    .media-card {
      padding: 1rem; border-radius: 16px; border: 1px solid rgba(26, 95, 74, 0.12);
      background: radial-gradient(ellipse at top left, rgba(45, 143, 115, 0.08), transparent 55%),
        linear-gradient(180deg, #ffffff 0%, #fbfaf8 100%);
    }
    .media-card-ready { border-color: rgba(26, 95, 74, 0.28); }
    .media-card-head { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.85rem; }
    .media-icon {
      width: 2.35rem; height: 2.35rem; border-radius: 12px;
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
      color: var(--primary); background: rgba(26, 95, 74, 0.1);
    }
    .media-icon svg { width: 1.15rem; height: 1.15rem; display: block; }
    .media-copy { flex: 1; min-width: 0; }
    .media-title { font-family: var(--font-display); font-size: 1.05rem; font-weight: 600; color: var(--primary-dark); }
    .media-req { color: #c53030; }
    .media-sub { margin: 0.2rem 0 0; font-size: 0.8125rem; color: var(--create-muted); line-height: 1.4; }
    .media-chip {
      padding: 0.28rem 0.65rem; border-radius: 999px; background: rgba(26, 95, 74, 0.12);
      color: var(--primary-dark); font-size: 0.72rem; font-weight: 700;
    }
    .media-drop {
      position: relative; display: block; border-radius: 14px;
      border: 1.5px dashed rgba(26, 95, 74, 0.22); background: rgba(255,255,255,0.72); cursor: pointer;
    }
    .media-drop input[type="file"] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3; }
    .media-drop-cover { min-height: 11rem; }
    .media-drop-compact { min-height: 4.75rem; }
    .media-drop-empty { pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; padding: 1.5rem 1rem; text-align: center; }
    .media-drop-empty-sm { padding: 1rem; }
    .media-drop-plus {
      width: 2.25rem; height: 2.25rem; margin-bottom: 0.35rem; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      background: linear-gradient(145deg, #2d8f73 0%, #1a5f4a 100%); color: #fff; font-size: 1.25rem;
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
      display: inline-flex; align-items: center; min-height: 2rem; padding: 0.4rem 0.85rem;
      border-radius: 7px; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 600; cursor: pointer;
    }
    .media-btn-secondary { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.18); color: #fff; }
    .media-btn-danger { background: rgba(254, 226, 226, 0.95); color: #991b1b; }
    .media-thumb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 0.65rem; margin-top: 0.85rem; }
    .media-thumb-wrap { position: relative; }
    .media-thumb { aspect-ratio: 1; border-radius: 12px; background-size: cover; background-position: center; }
    .media-remove {
      position: absolute; top: 0.35rem; right: 0.35rem; width: 1.55rem; height: 1.55rem; border: 0; border-radius: 999px;
      background: rgba(15, 41, 34, 0.88); color: #fff; font-size: 1rem; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; z-index: 2;
    }
    .media-remove-on-video { top: 0.55rem; right: 0.55rem; }
    .video-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 0.85rem; }
    .video-preview-card { border-radius: 14px; overflow: hidden; background: #0f2922; }
    .video-preview-frame { position: relative; }
    .video-preview { display: block; width: 100%; aspect-ratio: 16/10; object-fit: cover; background: #000; }
    .stream-add { margin-top: 0.85rem; display: grid; gap: 0.4rem; }
    .stream-label { font-size: 0.82rem; font-weight: 700; color: #0f2922; }
    .stream-hint { margin: 0; font-size: 0.75rem; color: #5a6f68; line-height: 1.4; }
    .stream-row { display: flex; gap: 0.45rem; align-items: center; }
    .stream-row input {
      flex: 1; min-width: 0; min-height: 40px; border: 1px solid #d5e0db; border-radius: 10px;
      padding: 0 0.75rem; font: inherit; font-size: 0.86rem;
    }
    .stream-add-btn {
      border: 1px solid #1a5f4a; background: #fff; color: #1a5f4a; border-radius: 999px;
      padding: 0.45rem 0.8rem; font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap;
    }
    .stream-error { margin: 0; color: #b42318; font-size: 0.78rem; }
    .stream-list { list-style: none; margin: 0.2rem 0 0; padding: 0; display: grid; gap: 0.35rem; }
    .stream-list li {
      display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
      padding: 0.4rem 0.55rem; border: 1px solid #e2ebe6; border-radius: 10px; background: #f8fcfa;
    }
    .stream-list a { color: #1d4ed8; font-size: 0.8rem; word-break: break-all; }
    .stream-list button {
      border: none; background: transparent; color: #b42318; font: inherit; font-size: 0.75rem; font-weight: 700; cursor: pointer;
    }
    .video-preview-name {
      margin: 0; padding: 0.55rem 0.7rem; font-size: 0.75rem; font-weight: 600; color: #d7e3de;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .doc-existing { margin-bottom: 0.75rem; }
    .doc-preview-link { display: block; }
    .doc-preview-img { display: block; width: 100%; max-height: 12rem; object-fit: contain; border-radius: 12px; background: #f4f8f6; }
    .doc-file-link { font-weight: 600; color: var(--primary); }
    .doc-selected {
      margin-top: 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      padding: 0.65rem 0.85rem; border-radius: 10px; background: #f0f9f5;
    }
    .doc-selected .media-remove { position: static; }
    .spinner {
      width: 48px; height: 48px; border: 4px solid var(--border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 767px) {
      .create-form { padding: 1.15rem; }
      .submit-actions { flex-direction: column; align-items: stretch; width: 100%; }
      .btn-submit, .btn-cancel { width: 100%; }
      .display-options { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) { .display-options { grid-template-columns: 1fr; } }
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
  currencyCode = '';
  displayDays = 0;
  paymentReceived = false;
  mainImage: File | null = null;
  confirmationFile: File | null = null;
  existingConfirmationUrl: string | null = null;
  existingMainUrl: string | null = null;
  mainImagePreview = signal<string | null>(null);
  galleryItems = signal<EditMediaItem[]>([]);
  videoItems = signal<EditMediaItem[]>([]);
  streamLinks = signal<string[]>([]);
  streamLinkInput = '';
  streamLinkError = '';
  private initialStreamLinks: string[] = [];
  displayOptions = signal<{ days: number; price: number; label: string }[]>([]);
  private initialExistingMainUrl: string | null = null;
  private initialGalleryUrls: string[] = [];
  private initialVideoUrls: string[] = [];
  event = signal<{ id: number; eventType: string } | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  private initialSnapshot: EditSnapshot | null = null;
  private allowLeave = false;

  get countryOptions(): string[] {
    const keys = Object.keys(COUNTRY_CURRENCY_MAP);
    if (this.country && !keys.includes(this.country)) return [this.country, ...keys];
    return keys;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private stats: EventStatsService,
    private currencyService: CurrencyService,
    private dialogs: AppDialogService
  ) {}

  cancelLink(): string {
    return this.isDraft() ? `/pending-event/${this.draftId}` : '/events';
  }

  onCountryChange(countryName: string): void {
    this.currencyCode = this.currencyService.getCurrencyForCountry(countryName)?.code ?? '';
  }

  needsConfirmationDocument(): boolean {
    const t = (this.eventType || '').trim();
    return t === 'Wedding' || t === 'Obituary' || t === 'Funeral';
  }

  hasConfirmationDocument(): boolean {
    return !!this.confirmationFile || !!this.existingConfirmationUrl;
  }

  confirmationDocHint(): string {
    if (this.eventType === 'Wedding') {
      return 'Keep or replace the marriage certificate / wedding invitation (PDF or image, max 10MB).';
    }
    return 'Keep or replace the funeral notice or death certificate (PDF or image, max 10MB).';
  }

  isImageDocument(url: string): boolean {
    const path = url.split('?')[0].toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some((ext) => path.endsWith(ext));
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
      country: this.country,
      displayDays: this.displayDays,
      paymentReceived: this.paymentReceived,
      existingConfirmationUrl: this.existingConfirmationUrl
    };
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialSnapshot || this.allowLeave) return false;
    if (this.mainImage || this.existingMainUrl !== this.initialExistingMainUrl) return true;
    if (this.confirmationFile) return true;
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
    const currentStreams = this.streamLinks();
    if (
      currentStreams.length !== this.initialStreamLinks.length ||
      currentStreams.some((url, i) => url !== this.initialStreamLinks[i])
    ) {
      return true;
    }
    const current = this.captureSnapshot();
    return (Object.keys(current) as (keyof EditSnapshot)[]).some(
      (key) => String(current[key] ?? '') !== String(this.initialSnapshot![key] ?? '')
    );
  }

  private confirmDiscard(): Promise<boolean> {
    if (!this.hasUnsavedChanges()) return Promise.resolve(true);
    return this.dialogs.confirm({
      title: 'Leave without saving?',
      message: 'You have unsaved changes. If you leave this page, those changes will be lost.',
      confirmLabel: 'Discard changes',
      cancelLabel: 'Keep editing',
      tone: 'danger'
    });
  }

  onLeaveClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const anchor = event.currentTarget as HTMLAnchorElement | null;
    const url = anchor?.getAttribute('href') || (this.isDraft() ? '/payments' : '/events');
    void this.confirmDiscard().then((ok) => {
      if (!ok) return;
      this.allowLeave = true;
      void this.router.navigateByUrl(url);
    });
  }

  onCancel(): void {
    void this.confirmDiscard().then((ok) => {
      if (!ok) return;
      this.allowLeave = true;
      void this.router.navigateByUrl(this.cancelLink());
    });
  }

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
    this.api.getDisplayOptions().subscribe({
      next: (opts) => this.displayOptions.set(opts.length > 0 ? opts : MEMORA_DISPLAY_PLANS),
      error: () => this.displayOptions.set(MEMORA_DISPLAY_PLANS)
    });

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
        this.event.set({ id: ev.id, eventType: ev.eventType });
        this.title = ev.title;
        this.description = ev.description;
        this.eventType = ev.eventType === 'Funeral' ? 'Obituary' : ev.eventType;
        this.eventDate = ev.eventDate?.split('T')[0] ?? '';
        this.birthDate = ev.birthDate?.split('T')[0] ?? '';
        this.deathDate = ev.deathDate?.split('T')[0] ?? '';
        this.weddingDate = ev.weddingDate?.split('T')[0] ?? '';
        this.visibility = ev.visibility === 'Private' ? 'Public' : (ev.visibility ?? 'Public');
        this.invitedEmails = (ev.invitedEmails ?? []).join(', ');
        this.location = ev.location ?? '';
        this.mobileNumber = ev.mobileNumber ?? '';
        this.country = this.normalizeCountry(ev.country ?? '');
        this.onCountryChange(this.country);
        this.displayDays = ev.displayDays ?? MEMORA_DISPLAY_PLANS[0].days;
        this.paymentReceived = !!ev.paymentReceived;
        this.existingConfirmationUrl = ev.confirmationDocumentUrl?.trim() || null;
        this.applyExistingMedia(ev.mainImageUrl, ev.galleryUrls, ev.videoUrls);
        this.setStreamLinks(ev.streamLinks);
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
        this.event.set({ id: d.id, eventType: d.eventType });
        this.title = d.title;
        this.description = d.description;
        this.eventType = d.eventType === 'Funeral' ? 'Obituary' : d.eventType;
        this.eventDate = d.eventDate?.split('T')[0] ?? '';
        this.birthDate = d.birthDate?.split('T')[0] ?? '';
        this.deathDate = d.deathDate?.split('T')[0] ?? '';
        this.weddingDate = d.weddingDate?.split('T')[0] ?? '';
        this.visibility = d.visibility === 'Private' ? 'Public' : (d.visibility ?? 'Public');
        this.invitedEmails = d.invitedEmails ?? '';
        this.location = d.location ?? '';
        this.mobileNumber = d.mobileNumber ?? '';
        this.country = this.normalizeCountry(d.country ?? '');
        this.onCountryChange(this.country);
        this.displayDays = d.displayDays || MEMORA_DISPLAY_PLANS[0].days;
        this.paymentReceived = !!d.paymentReceived;
        this.existingConfirmationUrl = d.confirmationDocumentUrl?.trim() || null;
        this.applyExistingMedia(d.mainImageUrl, d.galleryUrlsJson, d.videoUrlsJson);
        this.setStreamLinks(d.streamLinksJson);
        this.initialSnapshot = this.captureSnapshot();
        this.loading.set(false);
      },
      error: () => {
        this.event.set(null);
        this.loading.set(false);
      }
    });
  }

  private normalizeCountry(value: string): string {
    const aliases: Record<string, string> = {
      UK: 'United Kingdom',
      'United States': 'USA',
      'United States of America': 'USA'
    };
    return aliases[value] ?? value;
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

  private setStreamLinks(raw?: string | null): void {
    const links = this.parseMediaUrls(raw).filter((url) => /^https?:\/\//i.test(url));
    this.initialStreamLinks = [...links];
    this.streamLinks.set(links);
    this.streamLinkInput = '';
    this.streamLinkError = '';
  }

  addStreamLink(): void {
    const next = normalizeStreamLink(this.streamLinkInput);
    if (!next.ok) {
      this.streamLinkError = next.message;
      return;
    }
    if (this.streamLinks().length >= 3) {
      this.streamLinkError = 'You can add up to 3 links.';
      return;
    }
    if (this.streamLinks().some((url) => url.toLowerCase() === next.url.toLowerCase())) {
      this.streamLinkError = 'That link is already added.';
      return;
    }
    this.streamLinks.update((list) => [...list, next.url]);
    this.streamLinkInput = '';
    this.streamLinkError = '';
  }

  removeStreamLink(index: number): void {
    this.streamLinks.update((list) => list.filter((_, i) => i !== index));
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

    const room = Math.max(0, 3 - this.videoItems().length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 3 videos allowed. Extra files were skipped.');
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

  onConfirmationDocument(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('Confirmation document must be 10 MB or smaller.');
      input.value = '';
      return;
    }
    this.error.set('');
    this.confirmationFile = file;
    input.value = '';
  }

  removeConfirmationDocument(): void {
    this.confirmationFile = null;
  }

  ngOnDestroy(): void {
    this.revokeNewObjectUrls(this.galleryItems());
    this.revokeNewObjectUrls(this.videoItems());
  }

  onVisibilityChange(v: string) {
    if (v !== 'InviteOnly') this.invitedEmails = '';
  }

  onEventTypeChange(type: string) {
    if (type !== 'Obituary' && type !== 'Remembrance') {
      this.birthDate = '';
      this.deathDate = '';
    }
    if (type !== 'Wedding') this.weddingDate = '';
    if (!this.needsConfirmationDocument()) {
      this.confirmationFile = null;
    }
  }

  isFormValid(): boolean {
    if (!this.title.trim() || this.title.length < 3 || this.title.length > 100) return false;
    if (!this.description.trim() || this.description.length < 10 || this.description.length > 2000) return false;
    if (!this.eventType || !this.eventDate || !this.country) return false;
    if (!this.location.trim() || this.location.length > 200) return false;
    if (!this.mobileNumber.trim()) return false;
    if (!this.visibility) return false;
    if (
      (this.eventType === 'Obituary' || this.eventType === 'Remembrance') &&
      (!this.birthDate || !this.deathDate)
    ) {
      return false;
    }
    if (this.visibility === 'InviteOnly') {
      if (!this.invitedEmails.trim() || this.invitedEmails.length > 500) return false;
      const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}(\s*,\s*[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})*$/;
      if (!emailPattern.test(this.invitedEmails.trim())) return false;
    }
    if (!this.mainImage && !this.existingMainUrl) return false;
    if (this.needsConfirmationDocument() && !this.hasConfirmationDocument()) return false;
    const validDays = this.displayOptions().map((o) => o.days);
    const days = Number(this.displayDays);
    return validDays.length > 0 && validDays.includes(days);
  }

  submit() {
    if (!this.isFormValid()) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('description', this.description);
    formData.append('eventType', this.eventType);
    formData.append('eventDate', this.eventDate);
    formData.append('visibility', this.visibility === 'Private' ? 'Public' : this.visibility);
    formData.append('displayDays', String(Number(this.displayDays)));
    formData.append('paymentReceived', String(this.paymentReceived));
    formData.append('location', this.location);
    formData.append('mobileNumber', this.mobileNumber.trim());
    formData.append('country', this.country);

    if (this.eventType === 'Obituary' || this.eventType === 'Remembrance') {
      if (this.birthDate) formData.append('birthDate', this.birthDate);
      if (this.deathDate) formData.append('deathDate', this.deathDate);
    }
    if (this.eventType === 'Wedding' && this.weddingDate) {
      formData.append('weddingDate', this.weddingDate);
    }
    if (this.visibility === 'InviteOnly' && this.invitedEmails.trim()) {
      formData.append('invitedEmails', this.invitedEmails.trim());
    }
    if (this.confirmationFile) {
      formData.append('confirmationDocument', this.confirmationFile);
    }

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
    formData.append('streamLinks', JSON.stringify(this.streamLinks()));
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

function normalizeStreamLink(raw: string): { ok: true; url: string } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, message: 'Enter a YouTube or streaming link.' };
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, message: 'Enter a valid YouTube or streaming link.' };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, message: 'Enter a valid YouTube or streaming link.' };
  }
}
