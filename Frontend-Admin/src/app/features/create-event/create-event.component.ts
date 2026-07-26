

import { Component, signal, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { MEMORA_DISPLAY_PLANS } from '../../constants/display-plans';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

@Component({
  selector: 'app-create-event',
  standalone: true,
  // OnPush improves performance by skipping change detection when inputs don't change
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,           // For pipe-like operations and ngClass/ngStyle
    RouterLink,             // For navigation links
    FormsModule,            // For ngModel two-way binding
    ReactiveFormsModule,    // For reactive form validation patterns
    DatePickerComponent
  ],
  template: `

    <div class="create-page">
      <header class="create-hero">
        <div class="container create-hero-inner">
          <a routerLink="/events" class="back-link">← Back to event management</a>
          <div class="create-hero-copy">
            <p class="create-kicker">Compose</p>
            <h1>Create an event</h1>
            <p class="create-sub">
              A calm, guided flow to publish birthdays, anniversaries, and memorials—aligned with how guests discover them.
            </p>
          </div>
        </div>
      </header>

      <div class="container form-shell">
        <form (ngSubmit)="submit()" #createForm="ngForm" class="create-form">

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
              <div class="validation-error">
                @if (eventTypeInput.errors?.['required']) { <small>Event type is required.</small> }
              </div>
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
              <div class="validation-error">
                @if (eventDateInput.errors?.['required']) { <small>Event date is required.</small> }
              </div>
            }
          </div>
        </div>

        <!-- Birth and passing dates (obituary & remembrance) -->
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
                #birthDateInput="ngModel"
              ></app-date-picker>
              @if (birthDateInput.invalid && (birthDateInput.dirty || birthDateInput.touched)) {
                <div class="validation-error">
                  @if (birthDateInput.errors?.['required']) { <small>Birth date is required.</small> }
                </div>
              }
            </div>
            <div class="form-group">
              <label>Date of Passing *</label>
              <app-date-picker
                [(ngModel)]="deathDate"
                name="deathDate"
                required
                placeholder="Choose date of passing"
                ariaLabel="Date of passing"
                #deathDateInput="ngModel"
              ></app-date-picker>
              @if (deathDateInput.invalid && (deathDateInput.dirty || deathDateInput.touched)) {
                <div class="validation-error">
                  @if (deathDateInput.errors?.['required']) { <small>Date of passing is required.</small> }
                </div>
              }
            </div>
          </div>
        }

        <!-- Wedding / anniversary ceremony date -->
        @if (eventType === 'Anniversary' || eventType === 'Wedding') {
          <div class="form-group">
            <label>{{ eventType === 'Wedding' ? 'Wedding date' : 'Anniversary (wedding) date' }} *</label>
            <app-date-picker
              [(ngModel)]="weddingDate"
              name="weddingDate"
              required
              placeholder="Choose ceremony date"
              ariaLabel="Ceremony date"
              #weddingDateInput="ngModel"
            ></app-date-picker>
            @if (weddingDateInput.invalid && (weddingDateInput.dirty || weddingDateInput.touched)) {
              <div class="validation-error">
                @if (weddingDateInput.errors?.['required']) { <small>Wedding date is required.</small> }
              </div>
            }
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
            required #titleInput="ngModel" minlength="3" maxlength="100" />
          @if (titleInput.invalid && (titleInput.dirty || titleInput.touched)) {
            <div class="validation-error">
              @if (titleInput.errors?.['required'])  { <small>Title is required.</small> }
              @if (titleInput.errors?.['minlength']) { <small>Title must be at least 3 characters.</small> }
              @if (titleInput.errors?.['maxlength']) { <small>Title cannot exceed 100 characters.</small> }
            </div>
          }
          <div class="character-count" [class.exceed-limit]="title.length > 100">{{ title.length }}/100</div>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label>Description *</label>
          <textarea [(ngModel)]="description" name="description"
            placeholder="Share the story, details, and meaning of this event..."
            required #descriptionInput="ngModel" minlength="10" maxlength="2000" rows="5"></textarea>
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
            <h2 id="sec-place" class="form-section-title">Place &amp; currency</h2>
            <p class="form-section-hint">Country for locale preferences, then location for the listing.</p>
          </div>
        <div class="form-group">
          <label>Country * <span class="label-note">Sets regional preferences</span></label>
          <select [(ngModel)]="country" name="country" required #countryInput="ngModel"
            (ngModelChange)="onCountryChange($event)">
            <option value="">Select country</option>
            <option value="Afghanistan">Afghanistan</option>
            <option value="Albania">Albania</option>
            <option value="Algeria">Algeria</option>
            <option value="Andorra">Andorra</option>
            <option value="Angola">Angola</option>
            <option value="Argentina">Argentina</option>
            <option value="Armenia">Armenia</option>
            <option value="Australia">Australia</option>
            <option value="Austria">Austria</option>
            <option value="Azerbaijan">Azerbaijan</option>
            <option value="Bahamas">Bahamas</option>
            <option value="Bahrain">Bahrain</option>
            <option value="Bangladesh">Bangladesh</option>
            <option value="Belarus">Belarus</option>
            <option value="Belgium">Belgium</option>
            <option value="Belize">Belize</option>
            <option value="Benin">Benin</option>
            <option value="Bhutan">Bhutan</option>
            <option value="Bolivia">Bolivia</option>
            <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
            <option value="Botswana">Botswana</option>
            <option value="Brazil">Brazil</option>
            <option value="Brunei">Brunei</option>
            <option value="Bulgaria">Bulgaria</option>
            <option value="Burkina Faso">Burkina Faso</option>
            <option value="Burundi">Burundi</option>
            <option value="Cambodia">Cambodia</option>
            <option value="Cameroon">Cameroon</option>
            <option value="Canada">Canada</option>
            <option value="Chad">Chad</option>
            <option value="Chile">Chile</option>
            <option value="China">China</option>
            <option value="Colombia">Colombia</option>
            <option value="Congo">Congo</option>
            <option value="Costa Rica">Costa Rica</option>
            <option value="Croatia">Croatia</option>
            <option value="Cuba">Cuba</option>
            <option value="Cyprus">Cyprus</option>
            <option value="Czech Republic">Czech Republic</option>
            <option value="Denmark">Denmark</option>
            <option value="Djibouti">Djibouti</option>
            <option value="Dominican Republic">Dominican Republic</option>
            <option value="Ecuador">Ecuador</option>
            <option value="Egypt">Egypt</option>
            <option value="El Salvador">El Salvador</option>
            <option value="Estonia">Estonia</option>
            <option value="Ethiopia">Ethiopia</option>
            <option value="Finland">Finland</option>
            <option value="France">France</option>
            <option value="Gabon">Gabon</option>
            <option value="Georgia">Georgia</option>
            <option value="Germany">Germany</option>
            <option value="Ghana">Ghana</option>
            <option value="Greece">Greece</option>
            <option value="Guatemala">Guatemala</option>
            <option value="Guinea">Guinea</option>
            <option value="Haiti">Haiti</option>
            <option value="Honduras">Honduras</option>
            <option value="Hungary">Hungary</option>
            <option value="Iceland">Iceland</option>
            <option value="India">India</option>
            <option value="Indonesia">Indonesia</option>
            <option value="Iran">Iran</option>
            <option value="Iraq">Iraq</option>
            <option value="Ireland">Ireland</option>
            <option value="Israel">Israel</option>
            <option value="Italy">Italy</option>
            <option value="Jamaica">Jamaica</option>
            <option value="Japan">Japan</option>
            <option value="Jordan">Jordan</option>
            <option value="Kazakhstan">Kazakhstan</option>
            <option value="Kenya">Kenya</option>
            <option value="Kuwait">Kuwait</option>
            <option value="Kyrgyzstan">Kyrgyzstan</option>
            <option value="Laos">Laos</option>
            <option value="Latvia">Latvia</option>
            <option value="Lebanon">Lebanon</option>
            <option value="Libya">Libya</option>
            <option value="Lithuania">Lithuania</option>
            <option value="Luxembourg">Luxembourg</option>
            <option value="Madagascar">Madagascar</option>
            <option value="Malaysia">Malaysia</option>
            <option value="Maldives">Maldives</option>
            <option value="Mali">Mali</option>
            <option value="Malta">Malta</option>
            <option value="Mexico">Mexico</option>
            <option value="Moldova">Moldova</option>
            <option value="Monaco">Monaco</option>
            <option value="Mongolia">Mongolia</option>
            <option value="Montenegro">Montenegro</option>
            <option value="Morocco">Morocco</option>
            <option value="Mozambique">Mozambique</option>
            <option value="Myanmar">Myanmar</option>
            <option value="Namibia">Namibia</option>
            <option value="Nepal">Nepal</option>
            <option value="Netherlands">Netherlands</option>
            <option value="New Zealand">New Zealand</option>
            <option value="Nicaragua">Nicaragua</option>
            <option value="Niger">Niger</option>
            <option value="Nigeria">Nigeria</option>
            <option value="North Korea">North Korea</option>
            <option value="Norway">Norway</option>
            <option value="Oman">Oman</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Panama">Panama</option>
            <option value="Paraguay">Paraguay</option>
            <option value="Peru">Peru</option>
            <option value="Philippines">Philippines</option>
            <option value="Poland">Poland</option>
            <option value="Portugal">Portugal</option>
            <option value="Qatar">Qatar</option>
            <option value="Romania">Romania</option>
            <option value="Russia">Russia</option>
            <option value="Rwanda">Rwanda</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="Senegal">Senegal</option>
            <option value="Serbia">Serbia</option>
            <option value="Singapore">Singapore</option>
            <option value="Slovakia">Slovakia</option>
            <option value="Slovenia">Slovenia</option>
            <option value="Somalia">Somalia</option>
            <option value="South Africa">South Africa</option>
            <option value="South Korea">South Korea</option>
            <option value="Spain">Spain</option>
            <option value="Sri Lanka">Sri Lanka</option>
            <option value="Sudan">Sudan</option>
            <option value="Sweden">Sweden</option>
            <option value="Switzerland">Switzerland</option>
            <option value="Syria">Syria</option>
            <option value="Taiwan">Taiwan</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Thailand">Thailand</option>
            <option value="Tunisia">Tunisia</option>
            <option value="Turkey">Turkey</option>
            <option value="Uganda">Uganda</option>
            <option value="Ukraine">Ukraine</option>
            <option value="United Arab Emirates">United Arab Emirates</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="USA">USA</option>
            <option value="Uruguay">Uruguay</option>
            <option value="Uzbekistan">Uzbekistan</option>
            <option value="Venezuela">Venezuela</option>
            <option value="Vietnam">Vietnam</option>
            <option value="Yemen">Yemen</option>
            <option value="Zambia">Zambia</option>
            <option value="Zimbabwe">Zimbabwe</option>
            <option value="Other">Other</option>
          </select>

          @if (countryInput.invalid && (countryInput.dirty || countryInput.touched)) {
            <div class="validation-error">
              @if (countryInput.errors?.['required']) { <small>Country is required.</small> }
            </div>
          }
        </div>

        <div class="form-group">
          <label>Location *</label>
          <input [(ngModel)]="location" name="location" placeholder="e.g. Central Park, New York"
            #locationInput="ngModel" required maxlength="200" />
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
                <label class="display-option-card" [class.selected]="displayDays === opt.days">
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
            <option value="Private">Private — only you</option>
            <option value="InviteOnly">Invite Only — you and invited emails</option>
          </select>
          @if (visibilityInput.invalid && (visibilityInput.dirty || visibilityInput.touched)) {
            <div class="validation-error">
              @if (visibilityInput.errors?.['required']) { <small>Visibility is required.</small> }
            </div>
          }
        </div>

        <!-- INVITE EMAILS -->
        @if (visibility === 'InviteOnly') {
          <div class="form-group invite-section">
            <label>Invite people by email *</label>
            <p class="form-hint">Comma-separated emails. Invited users must log in with that email to view.</p>
            <textarea [(ngModel)]="invitedEmails" name="invitedEmails" rows="3"
              placeholder="sister@example.com, brother@example.com"
              required #emailInput="ngModel" minlength="5" maxlength="500"
              pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}(\s*,\s*[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})*$">
            </textarea>
            @if (emailInput.invalid && (emailInput.dirty || emailInput.touched)) {
              <div class="validation-error">
                @if (emailInput.errors?.['required'])  { <small>At least one email is required.</small> }
                @if (emailInput.errors?.['minlength']) { <small>Please enter valid email addresses.</small> }
                @if (emailInput.errors?.['maxlength']) { <small>Email list cannot exceed 500 characters.</small> }
                @if (emailInput.errors?.['pattern'])   { <small>Please enter valid comma-separated email addresses.</small> }
              </div>
            }
            @if (invitedEmails) {
              <div class="character-count" [class.exceed-limit]="invitedEmails.length > 500">
                {{ invitedEmails.length }}/500
              </div>
            }
          </div>
        }

        @if (!auth.isLoggedIn()) {
          <div class="form-group">
            <label>Your Name</label>
            <input [(ngModel)]="createdBy" name="createdBy" placeholder="Anonymous"
              #nameInput="ngModel" maxlength="100" />
            @if (nameInput.invalid && nameInput.errors?.['maxlength']) {
              <div class="validation-error"><small>Name cannot exceed 100 characters.</small></div>
            }
            @if (createdBy) {
              <div class="character-count" [class.exceed-limit]="createdBy.length > 100">{{ createdBy.length }}/100</div>
            }
          </div>
        }

        </section>

        <section class="form-section form-section-media" aria-labelledby="sec-media">
          <div class="form-section-head">
            <h2 id="sec-media" class="form-section-title">Media</h2>
            <p class="form-section-hint">A strong cover image helps the card stand out in the feed. Videos are shown only on the event detail page.</p>
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
                  <p class="media-sub">Feed hero · JPG, PNG, GIF or WEBP · max 5MB</p>
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
                <div class="validation-error"><small>Main image is required.</small></div>
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
                  <p class="media-sub">Up to 8 photos · max 5MB each</p>
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
                  <div class="media-title">Videos</div>
                  <p class="media-sub">Up to 3 files · MP4 / WEBM / MOV · max 100MB each</p>
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
        </section>

        @if (error()) {
          <div class="error-msg" role="alert">{{ error() }}</div>
        }

        <div class="submit-bar">
          <div class="submit-actions">
            <button type="submit" class="btn btn-primary btn-submit"
              [disabled]="saving() || !isFormValid()">
              @if (saving()) {
                <span class="btn-spinner" aria-hidden="true"></span>
                Saving…
              } @else {
                Save event
              }
            </button>
            <a routerLink="/events" class="btn btn-outline btn-cancel">Cancel</a>
          </div>
          <p class="submit-hint">Publishes directly from the admin console.</p>
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

    .create-page {
      min-height: 100%;
      background: var(--bg);
    }

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
      display: inline-flex;
      align-items: center;
      font-size: 0.8125rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.82);
      text-decoration: none;
      padding: 0.2rem 0;
      transition: color 0.15s ease;
    }
    .back-link:hover {
      color: #fff;
    }
    .back-link:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
      border-radius: 4px;
    }
    .create-hero-copy {
      max-width: 40rem;
    }
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
      line-height: 1.24;
      font-weight: 700;
      font-family: var(--font-display);
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
      position: relative;
      z-index: 2;
    }

    .create-form {
      background: #fff;
      padding: 1.5rem;
      border-radius: var(--create-radius);
      border: 1px solid var(--create-edge);
      box-shadow: 0 1px 2px rgba(13, 61, 50, 0.04), 0 8px 24px rgba(13, 61, 50, 0.06);
    }
    @media (min-width: 768px) {
      .create-form {
        padding: 1.75rem 2rem 2rem;
      }
    }

    .form-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(13, 61, 50, 0.08);
    }
    .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .form-section-media {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .form-section-head {
      margin-bottom: 1rem;
    }
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

    .label-note {
      font-weight: 500;
      font-size: 0.75rem;
      color: var(--create-muted);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.25rem;
    }
    @media (max-width: 767px) {
      .form-row { grid-template-columns: 1fr; }
    }

    .create-form .form-group {
      margin-bottom: 1rem;
    }
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
      background: #fff;
      padding: 0.65rem 0.85rem;
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
      padding: 1rem 1.25rem;
      border: 1.5px dashed #d0ddd8;
      border-radius: var(--create-radius-sm);
      background: #fafcfb;
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        background-color 0.15s ease;
    }
    .file-drop:hover {
      border-color: rgba(26, 95, 74, 0.35);
      background: #f4f8f6;
    }
    .file-drop input[type="file"] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      z-index: 2;
    }
    .file-drop-text {
      position: relative;
      z-index: 1;
      pointer-events: none;
      font-size: 0.875rem;
      color: var(--create-muted);
      text-align: center;
      line-height: 1.45;
    }
    .file-drop-secondary {
      min-height: 4rem;
    }

    .preview-img {
      max-width: min(100%, 280px);
      max-height: 180px;
      width: 100%;
      border-radius: var(--create-radius-sm);
      margin-top: 0.75rem;
      object-fit: cover;
      box-shadow: 0 8px 24px rgba(15, 31, 26, 0.12);
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

    /* Professional media upload cards */
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
    .media-card-ready {
      border-color: rgba(26, 95, 74, 0.28);
    }
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
      letter-spacing: 0.02em;
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
      backdrop-filter: blur(4px);
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
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      border: 0;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.12s ease, background 0.15s ease;
    }
    .media-btn:hover { transform: translateY(-1px); }
    .media-btn-secondary {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
    }
    .media-btn-secondary:hover { background: rgba(255, 255, 255, 0.22); }
    .media-btn-danger {
      background: #fee2e2;
      color: #b91c1c;
    }
    .media-btn-danger:hover { background: #fecaca; }
    .media-thumb-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
      gap: 0.65rem;
      margin-top: 0.85rem;
    }
    .media-thumb-wrap {
      position: relative;
    }
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
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
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
    .video-preview-frame {
      position: relative;
    }
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

    .error-msg {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      background: #fef2f2;
      color: #b91c1c;
      padding: 0.85rem 1rem;
      border-radius: var(--create-radius-sm);
      margin-bottom: 1rem;
      border: 1px solid #fecaca;
      font-size: 0.875rem;
      line-height: 1.45;
    }
    .validation-error { color: #c53030; font-size: 0.8125rem; margin-top: 0.35rem; }
    .validation-error small { display: block; }
    .character-count { font-size: 0.72rem; color: var(--create-muted); text-align: right; margin-top: 0.3rem; }
    .character-count.exceed-limit { color: #c53030; font-weight: 600; }
    .form-hint { font-size: 0.8125rem; color: var(--create-muted); margin: -0.15rem 0 0.5rem; line-height: 1.45; }
    .form-hint-loading {
      padding: 1rem;
      text-align: center;
      border-radius: var(--create-radius-sm);
      background: rgba(45, 143, 115, 0.06);
      animation: pulseHint 1.4s ease-in-out infinite;
    }
    @keyframes pulseHint {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.65; }
    }

    .create-form input.ng-invalid.ng-touched,
    .create-form textarea.ng-invalid.ng-touched,
    .create-form select.ng-invalid.ng-touched {
      border-color: #f87171;
    }

    .invite-section textarea { min-height: 96px; }

    .display-duration-section { margin-top: 0; }
    .duration-header { margin-bottom: 1rem; }
    .duration-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--create-ink);
      display: block;
      margin-bottom: 0.35rem;
    }
    .duration-subtitle { font-size: 0.875rem; color: var(--create-muted); margin: 0; line-height: 1.55; }

    .display-options {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
      gap: 0.85rem;
      margin-top: 0.5rem;
    }
    .display-option-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 1rem;
      border: 1px solid var(--create-edge);
      border-radius: var(--create-radius-sm);
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
      position: relative;
      background: #fff;
    }
    .checkbox-row {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--create-ink);
    }
    .checkbox-row input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
    }
    .display-option-card input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .display-option-card:hover {
      border-color: rgba(26, 95, 74, 0.28);
      box-shadow: 0 4px 14px rgba(13, 61, 50, 0.08);
    }
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
      letter-spacing: 0.01em;
    }
    .option-price {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      margin-bottom: 0.4rem;
    }
    .option-amount {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--create-ink);
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .option-currency {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--create-muted);
      letter-spacing: 0.02em;
    }
    .option-feed {
      display: block;
      font-size: 0.75rem;
      color: var(--create-muted);
      line-height: 1.4;
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
      min-height: 2.65rem;
      padding: 0.65rem 1.2rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: var(--create-radius-sm);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-width: 10rem;
      padding: 0.7rem 1.35rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: var(--create-radius-sm);
      background: var(--primary);
      border: 1px solid transparent;
      box-shadow: 0 1px 2px rgba(13, 61, 50, 0.12), 0 4px 12px rgba(26, 95, 74, 0.18);
      transition:
        background-color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .btn-submit:hover:not(:disabled) {
      background: var(--primary-dark);
      box-shadow: 0 2px 6px rgba(13, 61, 50, 0.14), 0 8px 20px rgba(26, 95, 74, 0.22);
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
    }
    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spinBtn 0.7s linear infinite;
    }
    @keyframes spinBtn {
      to {
        transform: rotate(360deg);
      }
    }
    .submit-hint {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--create-muted);
    }

    /* Tablet Portrait and below */
    @media (max-width: 991px) {
      .create-hero-inner {
        padding-left: var(--container-pad, 1rem);
        padding-right: var(--container-pad, 1rem);
      }
      .display-options {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr));
      }
    }

    /* Mobile Large and below */
    @media (max-width: 767px) {
      .create-form {
        padding: 1.15rem;
      }
      .submit-bar {
        align-items: stretch;
      }
      .submit-actions {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
      }
      .btn-submit,
      .btn-cancel {
        width: 100%;
        min-width: 0;
      }
      .display-options {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* Mobile Small */
    @media (max-width: 480px) {
      .display-options {
        grid-template-columns: 1fr;
      }
      .create-hero h1 {
        font-size: 1.35rem;
      }
    }
  `]
})
export class CreateEventComponent implements OnInit, OnDestroy {

  // ?????? Injected services ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  auth             = inject(AuthService);
  private api      = inject(ApiService);
  private stats    = inject(EventStatsService);
  private router   = inject(Router);
  private currencyService = inject(CurrencyService);
  private cdr      = inject(ChangeDetectorRef); // For OnPush change detection

  // ?????? Signals ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  displayOptions   = signal<{ days: number; price: number; label: string }[]>([]);
  mainImagePreview = signal<string | null>(null);
  galleryPreviews  = signal<{ url: string; name: string }[]>([]);
  videoPreviews    = signal<{ url: string; name: string }[]>([]);
  saving           = signal(false);
  error            = signal('');

  // ?????? Form fields ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  displayDays    = 0;          // set after options load
  title          = '';
  description    = '';
  eventType      = '';
  eventDate      = '';
  birthDate      = '';
  deathDate      = '';
  weddingDate    = '';
  visibility     = '';         // blank so placeholder option shows as selected
  invitedEmails  = '';
  location       = '';
  country        = '';
  currencyCode   = '';
  createdBy      = '';
  paymentReceived = false;
  mainImage:     File | null = null;
  galleryImages: File[]      = [];
  videos:        File[]      = [];

  // ?????? Lifecycle ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  ngOnInit(): void {
    this.api.getDisplayOptions().subscribe({
      next: (opts) => {
        this.displayOptions.set(opts.length > 0 ? opts : MEMORA_DISPLAY_PLANS);
        // Default to first option (usually shortest / cheapest)
        if (this.displayOptions().length > 0) {
          this.displayDays = this.displayOptions()[0].days;
        }
        // Manual change detection for OnPush strategy
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.displayOptions.set(MEMORA_DISPLAY_PLANS);
        this.displayDays = MEMORA_DISPLAY_PLANS[0].days;
        this.error.set('');
        console.error('Display options error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  // ?????? Country ??? currency auto-select ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  onCountryChange(countryName: string): void {
    const currency = this.currencyService.getCurrencyForCountry(countryName);
    this.currencyCode = currency?.code ?? '';
  }

  // ?????? Image handlers ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  onMainImageChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        this.error.set('Please select an image file.');
        input.value = '';
        this.cdr.markForCheck();
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('Image size must be less than 5MB.');
        input.value = '';
        this.cdr.markForCheck();
        return;
      }
      this.error.set('');
      this.mainImage = file;
      const reader  = new FileReader();
      reader.onload = () => {
        this.mainImagePreview.set(reader.result as string);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeMainImage(): void {
    this.mainImage = null;
    this.mainImagePreview.set(null);
    this.cdr.markForCheck();
  }

  onGalleryChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    // Validate each file
    const validFiles: File[] = [];
    let hasInvalid = false;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        hasInvalid = true;
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        hasInvalid = true;
        continue;
      }
      validFiles.push(file);
    }

    const room = Math.max(0, 8 - this.galleryImages.length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 8 gallery images allowed. Extra files were skipped.');
      this.cdr.markForCheck();
    } else if (hasInvalid) {
      this.error.set('Some files were skipped (invalid type or size > 5MB).');
      this.cdr.markForCheck();
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

  onVideosChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    const allowed = ['.mp4', '.webm', '.mov'];
    const validFiles: File[] = [];
    let hasInvalid = false;

    for (const file of files) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext)) {
        hasInvalid = true;
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        hasInvalid = true;
        continue;
      }
      validFiles.push(file);
    }

    const room = Math.max(0, 3 - this.videos.length);
    const accepted = validFiles.slice(0, room);
    if (validFiles.length > room) {
      this.error.set('Maximum 3 videos allowed. Extra files were skipped.');
      this.cdr.markForCheck();
    } else if (hasInvalid) {
      this.error.set('Some videos were skipped (only MP4/WEBM/MOV up to 100MB).');
      this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  private setVideoPreviews(files: File[]): void {
    for (const preview of this.videoPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
    this.videoPreviews.set(
      files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }))
    );
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    for (const preview of this.galleryPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
    for (const preview of this.videoPreviews()) {
      URL.revokeObjectURL(preview.url);
    }
  }

  // ?????? Visibility change ??? clear emails when not InviteOnly ??????????????????????????????????????????????????????
  onVisibilityChange(v: string): void {
    if (v !== 'InviteOnly') this.invitedEmails = '';
  }

  // ?????? Event type change ??? clear irrelevant dates ????????????????????????????????????????????????????????????????????????????????????
  onEventTypeChange(type: string): void {
    if (type !== 'Obituary' && type !== 'Remembrance') { this.birthDate = ''; this.deathDate = ''; }
    if (type !== 'Anniversary' && type !== 'Wedding') { this.weddingDate = ''; }
  }

  // ?????? Duration label ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  getDurationLabel(days: number): string {
    const map: Record<number, string> = {
      30: '1 Month',
      90: '3 Months',
      180: '6 Months',
      365: '12 Months'
    };
    return map[days] ?? `${days} days`;
  }

  // ?????? Form validation ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  isFormValid(): boolean {
    // Title
    if (!this.title.trim() || this.title.length < 3 || this.title.length > 100) return false;
    // Description
    if (!this.description.trim() || this.description.length < 10 || this.description.length > 2000) return false;
    // Core required fields
    if (!this.eventType || !this.eventDate || !this.country || !this.currencyCode) return false;
    // Location is required
    if (!this.location.trim() || this.location.length > 200) return false;
    // Visibility is required
    if (!this.visibility) return false;
    // Obituary extras
    if (
      (this.eventType === 'Obituary' || this.eventType === 'Remembrance') &&
      (!this.birthDate || !this.deathDate)
    )
      return false;
    if ((this.eventType === 'Anniversary' || this.eventType === 'Wedding') && !this.weddingDate) return false;
    // InviteOnly emails
    if (this.visibility === 'InviteOnly') {
      if (!this.invitedEmails.trim() || this.invitedEmails.length > 500) return false;
      const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}(\s*,\s*[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})*$/;
      if (!emailPattern.test(this.invitedEmails.trim())) return false;
    }
    // Guest name length
    if (!this.auth.isLoggedIn() && this.createdBy && this.createdBy.length > 100) return false;
    // Main image is required by the backend
    if (!this.mainImage) return false;
    // Display days must be a valid option
    const validDays = this.displayOptions().map(o => o.days);
    return validDays.length > 0 && validDays.includes(this.displayDays);
  }

  // ?????? Submit ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  submit(): void {
    if (!this.isFormValid()) {
      this.error.set('Please fill in all required fields correctly.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const formData = new FormData();
    formData.append('title',       this.title);
    formData.append('description', this.description);
    formData.append('eventType',   this.eventType);
    formData.append('eventDate',   this.eventDate);
    formData.append('visibility',  this.visibility);
    formData.append('displayDays', String(this.displayDays));
    formData.append('paymentReceived', String(this.paymentReceived));

    if (this.location)    formData.append('location', this.location);
    if (this.country)     formData.append('country',  this.country);
    formData.append('currency', 'USD');

    if (this.eventType === 'Obituary' || this.eventType === 'Remembrance') {
      if (this.birthDate) formData.append('birthDate', this.birthDate);
      if (this.deathDate) formData.append('deathDate', this.deathDate);
    }
    if ((this.eventType === 'Anniversary' || this.eventType === 'Wedding') && this.weddingDate) {
      formData.append('weddingDate', this.weddingDate);
    }
    if (this.visibility === 'InviteOnly' && this.invitedEmails.trim()) {
      formData.append('invitedEmails', this.invitedEmails.trim());
    }

    if (this.auth.isLoggedIn() && this.auth.currentUser()) {
      formData.append('createdBy', this.auth.currentUser()!.displayName);
    } else if (this.createdBy) {
      formData.append('createdBy', this.createdBy);
    }

    if (this.mainImage) formData.append('mainImage', this.mainImage);
    this.galleryImages.forEach(f => formData.append('galleryImages', f));
    this.videos.forEach(f => formData.append('videos', f));

    this.api.createEvent(formData).subscribe({
      next: () => {
        this.saving.set(false);
        this.cdr.markForCheck();
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.saving.set(false);
        this.cdr.markForCheck();
        // Provide more specific error messages based on error type
        if (err.status === 0) {
          this.error.set('Network error. Please check your connection and try again.');
        } else if (err.status === 413) {
          this.error.set('File size too large. Please reduce image sizes and try again.');
        } else if (err.status >= 500) {
          this.error.set('Server error. Please try again later.');
        } else {
          this.error.set(err.error?.message || 'Failed to create event. Please try again.');
        }
        console.error('Event submission error:', err);
      }
    });
  }
}
