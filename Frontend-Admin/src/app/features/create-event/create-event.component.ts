

import { Component, signal, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService, CurrencyInfo } from '../../services/currency.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  // OnPush improves performance by skipping change detection when inputs don't change
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,           // For pipe-like operations and ngClass/ngStyle
    RouterLink,             // For navigation links
    FormsModule,            // For ngModel two-way binding
    ReactiveFormsModule    // For reactive form validation patterns
  ],
  template: `

    <div class="create-page">
      <header class="create-hero">
        <div class="create-hero-inner">
          <p class="create-eyebrow">Compose</p>
          <h1>Create an event</h1>
          <p class="create-lede">A calm, guided flow to publish birthdays, anniversaries, and memorials—aligned with how guests discover them.</p>
        </div>
      </header>

      <div class="form-shell">
        <a routerLink="/events" class="back-nav">← Back to event management</a>

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
            <input type="date" [(ngModel)]="eventDate" name="eventDate" required #eventDateInput="ngModel" />
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
              <input type="date" [(ngModel)]="birthDate" name="birthDate" required #birthDateInput="ngModel" />
              @if (birthDateInput.invalid && (birthDateInput.dirty || birthDateInput.touched)) {
                <div class="validation-error">
                  @if (birthDateInput.errors?.['required']) { <small>Birth date is required.</small> }
                </div>
              }
            </div>
            <div class="form-group">
              <label>Date of Passing *</label>
              <input type="date" [(ngModel)]="deathDate" name="deathDate" required #deathDateInput="ngModel" />
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
            <input type="date" [(ngModel)]="weddingDate" name="weddingDate" required #weddingDateInput="ngModel" />
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
            <p class="form-section-hint">Location for the listing and country for locale preferences.</p>
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

          @if (selectedCurrency) {
            <div class="currency-auto-badge">
              <span class="badge-icon" aria-hidden="true">✓</span>
              <span>
                Currency: <strong>{{ selectedCurrency.name }} ({{ selectedCurrency.code }})</strong>
                — stored for this event record
              </span>
            </div>
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
                  <span class="option-duration">{{ getDurationLabel(opt.days) }}</span>
                  <span class="option-days">{{ opt.label }} on the feed</span>
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
            <label>Your Name (optional)</label>
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
            <h2 id="sec-media" class="form-section-title">Imagery</h2>
            <p class="form-section-hint">A strong cover image helps the card stand out in the feed.</p>
          </div>
        <div class="form-group">
          <label>Main image</label>
          <label class="file-drop">
            <span class="file-drop-text">Drop an image or click to upload · PNG or JPG, max 5MB</span>
            <input type="file" accept="image/*" (change)="onMainImageChange($event)" />
          </label>
          @if (mainImagePreview()) {
            <img [src]="mainImagePreview()" alt="Cover preview" class="preview-img" />
          }
        </div>

        <div class="form-group">
          <label>Gallery (optional)</label>
          <label class="file-drop file-drop-secondary">
            <span class="file-drop-text">Add more photos (multiple)</span>
            <input type="file" accept="image/*" multiple (change)="onGalleryChange($event)" />
          </label>
        </div>

        </section>

        @if (error()) {
          <div class="error-msg" role="alert">{{ error() }}</div>
        }

        <div class="submit-bar">
          <button type="submit" class="btn btn-primary btn-lg btn-submit"
            [disabled]="saving() || !isFormValid()">
            {{ saving() ? 'Saving…' : 'Save Event' }}
          </button>
          <p class="submit-hint">This saves the event directly in admin.</p>
        </div>

      </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --create-radius: 20px;
      --create-radius-sm: 14px;
      --create-ink: #0f1f1a;
      --create-muted: #5c6b66;
      --create-edge: rgba(15, 31, 26, 0.08);
      --create-glow: rgba(45, 143, 115, 0.12);
    }

    .create-page {
      min-height: 100%;
      background:
        radial-gradient(1200px 600px at 10% -10%, rgba(45, 143, 115, 0.14), transparent 55%),
        radial-gradient(900px 500px at 100% 0%, rgba(212, 165, 116, 0.12), transparent 50%),
        linear-gradient(180deg, #f3f6f4 0%, #f8f6f3 40%, #f5f3ef 100%);
    }

    .create-hero {
      position: relative;
      padding: clamp(2.5rem, 6vw, 4rem) 1.5rem 3rem;
      text-align: center;
      overflow: hidden;
    }
    .create-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(145deg, #0d3d32 0%, #1a5f4a 42%, #2d6f5c 100%);
      opacity: 1;
    }
    .create-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
      pointer-events: none;
    }
    .create-hero-inner {
      position: relative;
      z-index: 1;
      max-width: 36rem;
      margin: 0 auto;
    }
    .create-eyebrow {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.72);
      margin: 0 0 0.75rem;
    }
    .create-hero h1 {
      font-family: var(--font-display);
      font-size: clamp(1.85rem, 4vw, 2.35rem);
      font-weight: 600;
      letter-spacing: -0.02em;
      color: #fff;
      margin: 0 0 0.75rem;
      line-height: 1.15;
    }
    .create-lede {
      margin: 0;
      font-size: 1.02rem;
      line-height: 1.55;
      color: rgba(255, 255, 255, 0.88);
      font-weight: 400;
    }

    .form-shell {
      max-width: 720px;
      margin: -2.25rem auto 0;
      padding: 0 1.25rem 3.5rem;
      position: relative;
      z-index: 2;
    }

    .back-nav {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--create-muted);
      text-decoration: none;
      margin-bottom: 1rem;
      padding: 0.35rem 0;
      transition: color 0.2s ease, transform 0.2s ease;
    }
    .back-nav:hover {
      color: var(--primary);
      transform: translateX(-2px);
    }

    .create-form {
      background: rgba(255, 255, 255, 0.86);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: clamp(1.75rem, 4vw, 2.5rem);
      border-radius: var(--create-radius);
      border: 1px solid var(--create-edge);
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.7) inset,
        0 24px 48px -12px rgba(15, 31, 26, 0.12),
        0 8px 16px -8px rgba(15, 31, 26, 0.08);
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--create-edge);
    }
    .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .form-section-media {
      border-bottom: none;
      margin-bottom: 1.5rem;
      padding-bottom: 0;
    }

    .form-section-head {
      margin-bottom: 1.25rem;
    }
    .form-section-title {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--create-ink);
      margin: 0 0 0.35rem;
    }
    .form-section-hint {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
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
    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
    }

    .create-form .form-group {
      margin-bottom: 1.15rem;
    }
    .create-form .form-group label {
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--create-ink);
      margin-bottom: 0.45rem;
    }
    .create-form input:not([type="file"]),
    .create-form textarea,
    .create-form select {
      border-radius: var(--create-radius-sm);
      border: 1px solid var(--create-edge);
      background: rgba(255, 255, 255, 0.95);
      padding: 0.7rem 0.95rem;
      font-size: 0.975rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .create-form input:not([type="file"]):focus,
    .create-form textarea:focus,
    .create-form select:focus {
      outline: none;
      border-color: rgba(26, 95, 74, 0.45);
      box-shadow: 0 0 0 3px var(--create-glow);
    }

    .file-drop {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 5.5rem;
      padding: 1rem 1.25rem;
      border: 1.5px dashed rgba(15, 31, 26, 0.18);
      border-radius: var(--create-radius-sm);
      background: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .file-drop:hover {
      border-color: rgba(26, 95, 74, 0.35);
      background: rgba(45, 143, 115, 0.04);
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

    .error-msg {
      background: linear-gradient(135deg, #fef2f2, #fff5f5);
      color: #9b1c1c;
      padding: 1rem 1.1rem;
      border-radius: var(--create-radius-sm);
      margin-bottom: 1rem;
      border: 1px solid rgba(220, 38, 38, 0.15);
      font-size: 0.9rem;
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
      border-color: rgba(197, 48, 48, 0.45);
    }
    .create-form input.ng-valid.ng-touched:not(:focus),
    .create-form textarea.ng-valid.ng-touched:not(:focus),
    .create-form select.ng-valid.ng-touched:not(:focus) {
      border-color: rgba(34, 139, 87, 0.35);
    }

    .invite-section textarea { min-height: 96px; }

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
      line-height: 1.45;
      animation: fadeIn 0.35s ease;
    }
    .badge-icon {
      flex-shrink: 0;
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
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

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
      grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
      gap: 0.85rem;
      margin-top: 0.5rem;
    }
    .display-option-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 1.1rem 1.15rem;
      border: 1.5px solid var(--create-edge);
      border-radius: var(--create-radius-sm);
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      position: relative;
      background: rgba(255, 255, 255, 0.65);
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
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -8px rgba(15, 31, 26, 0.12);
    }
    .display-option-card.selected {
      border-color: var(--primary);
      background: linear-gradient(160deg, rgba(45, 143, 115, 0.1), rgba(255, 255, 255, 0.9));
      box-shadow: 0 0 0 2px rgba(26, 95, 74, 0.2);
    }
    .option-duration {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.2rem;
      letter-spacing: -0.02em;
    }
    .option-days {
      font-size: 0.75rem;
      color: var(--create-muted);
      margin-bottom: 0.65rem;
      line-height: 1.35;
    }
    .option-price {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--create-ink);
      letter-spacing: -0.03em;
    }
    .option-per-day {
      font-size: 0.72rem;
      color: var(--create-muted);
      margin-top: 0.35rem;
    }
    .option-usd-equiv {
      font-size: 0.68rem;
      color: var(--create-muted);
      margin-top: 0.25rem;
      opacity: 0.85;
    }

    .submit-bar {
      margin-top: 1.75rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--create-edge);
      text-align: center;
    }
    .btn-lg.btn-submit {
      width: 100%;
      max-width: 100%;
      padding: 1rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      box-shadow: 0 4px 20px rgba(26, 95, 74, 0.35);
    }
    .btn-lg.btn-submit:hover:not(:disabled) {
      box-shadow: 0 8px 28px rgba(26, 95, 74, 0.4);
    }
    .submit-hint {
      margin: 0.85rem 0 0;
      font-size: 0.78rem;
      color: var(--create-muted);
      letter-spacing: 0.02em;
    }
  `]
})
export class CreateEventComponent implements OnInit {

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
  selectedCurrency: CurrencyInfo | null = null;
  createdBy      = '';
  paymentReceived = false;
  mainImage:     File | null = null;
  galleryImages: File[]      = [];

  // ?????? Lifecycle ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  ngOnInit(): void {
    this.api.getDisplayOptions().subscribe({
      next: (opts) => {
        this.displayOptions.set(opts);
        // Default to first option (usually shortest / cheapest)
        if (opts.length > 0) {
          this.displayDays = opts[0].days;
        }
        // Manual change detection for OnPush strategy
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error.set('Failed to load display options. Please refresh.');
        console.error('Display options error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  // ?????? Country ??? currency auto-select ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  onCountryChange(countryName: string): void {
    const currency = this.currencyService.getCurrencyForCountry(countryName);
    if (currency) {
      this.selectedCurrency = currency;
      this.currencyCode     = currency.code;
    } else {
      this.selectedCurrency = null;
      this.currencyCode     = '';
    }
  }

  // ?????? Image handlers ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  onMainImageChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        this.error.set('Please select an image file.');
        this.cdr.markForCheck();
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('Image size must be less than 5MB.');
        this.cdr.markForCheck();
        return;
      }
      this.mainImage = file;
      const reader  = new FileReader();
      reader.onload = () => {
        this.mainImagePreview.set(reader.result as string);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  onGalleryChange(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files || []);
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

    if (hasInvalid) {
      this.error.set('Some files were skipped (invalid type or size > 5MB).');
      this.cdr.markForCheck();
    }

    this.galleryImages = validFiles;
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
      1: '1 Day', 3: '3 Days', 7: '1 Week',
      14: '2 Weeks', 30: '1 Month', 90: '3 Months'
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
    if (this.currencyCode) formData.append('currency', this.currencyCode);

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
