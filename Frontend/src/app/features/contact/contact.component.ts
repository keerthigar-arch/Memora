import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment.development';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- HERO -->
    <section class="contact-hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ Get In Touch</div>
        <h1>Contact Us</h1>
        <p>Have a question or feedback? We'd love to hear from you.</p>
      </div>
    </section>

    <!-- TWO-COLUMN LAYOUT -->
    <div class="contact-wrapper">

      <!-- LEFT: Our Details -->
      <aside class="our-details">
        <div class="details-header">
          <span class="section-label">Our Information</span>
          <h2>Reach Us Directly</h2>
          <p>We're here Monday–Friday, 9am–6pm GMT. Expect a reply within 24 hours.</p>
        </div>

        <div class="info-cards">
          <div class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div class="info-text">
              <span class="info-label">Email Us</span>
              <a href="mailto:hello@lifeeventshub.com" class="info-value">hello&#64;lifeeventshub.com</a>
              <span class="info-note">General enquiries &amp; support</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div class="info-text">
              <span class="info-label">Call Us</span>
              <a href="tel:+441234567890" class="info-value">+44 (0) 1234 567 890</a>
              <span class="info-note">Mon–Fri, 9am–6pm GMT</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="info-text">
              <span class="info-label">Our Location</span>
              <span class="info-value">London, United Kingdom</span>
              <span class="info-note">123 Memory Lane, EC1A 1BB</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="info-text">
              <span class="info-label">Office Hours</span>
              <span class="info-value">Monday – Friday</span>
              <span class="info-note">9:00 AM – 6:00 PM GMT</span>
            </div>
          </div>
        </div>

        <div class="social-strip">
          <span class="social-label">Follow us</span>
          <div class="social-links">
            <a href="#" class="social-btn" aria-label="Twitter/X">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.262 5.636 5.902-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" class="social-btn" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" class="social-btn" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </aside>

      <!-- RIGHT: Contact Form -->
      <div class="form-panel">
        <div class="form-panel-header">
          <span class="section-label">Send a Message</span>
          <h2>We'd Love to Hear From You</h2>
        </div>

        <form #contactForm="ngForm" (ngSubmit)="submit(contactForm)" class="contact-form" novalidate>

          <!-- NAME + EMAIL row -->
          <div class="form-row">


            <div class="form-group">
              <label for="name">Name <span class="req">*</span></label>
              <input
                id="name"
                type="text"
                [(ngModel)]="name"
                name="name"
                #nameInput="ngModel"
                placeholder="Your full name"
                required
                minlength="2"
                maxlength="50"
                [class.invalid]="nameInput.invalid && (nameInput.dirty || nameInput.touched || formSubmitted)"
              />
              @if (nameInput.invalid && (nameInput.dirty || nameInput.touched || formSubmitted)) {
                <div class="validation-error">
                  @if (nameInput.errors?.['required']) { <small>Name is required.</small> }
                  @if (nameInput.errors?.['minlength']) {
                    <small>At least 2 characters ({{ nameInput.errors?.['minlength'].actualLength }}/2).</small>
                  }
                </div>
              }
              <span class="char-count" [class.over]="name.length > 50">{{ name.length }}/50</span>
            </div>






            <div class="form-group">
              <label for="email">Email <span class="req">*</span></label>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                #emailInput="ngModel"
                placeholder="your&#64;email.com"
                required
                minlength="5"
                maxlength="100"
                pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
                [class.invalid]="emailInput.invalid && (emailInput.dirty || emailInput.touched || formSubmitted)"
              />
              @if (emailInput.invalid && (emailInput.dirty || emailInput.touched || formSubmitted)) {
                <div class="validation-error">
                  @if (emailInput.errors?.['required']) { <small>Email is required.</small> }
                  @if (emailInput.errors?.['pattern']) { <small>Please enter a valid email.</small> }
                </div>
              }
              <span class="char-count" [class.over]="email.length > 100">{{ email.length }}/100</span>
            </div>
          </div>



          <!-- PHONE (optional) -->
          <div class="form-group">
            <label for="phone">Phone <span class="req">*</span></label>
            <input
              id="phone"
              type="tel"
              [(ngModel)]="phone"
              name="phone"
              #phoneInput="ngModel"
              placeholder="+44 7700 900000"
              minlength="9"
              maxlength="15"
              [class.invalid]="phoneInput.invalid && (phoneInput.dirty || phoneInput.touched || formSubmitted)"
            />
              @if (phoneInput.invalid && (phoneInput.dirty || phoneInput.touched || formSubmitted)) {
                <div class="validation-error">
                  @if (phoneInput.errors?.['required']) { <small>Phone is required.</small> }
                  @if (phoneInput.errors?.['minlength']) { <small>Please Enter a valid phone number.</small> }
              </div>
              }

          <span class="char-count" [class.over]="phone.length > 15">{{ phone.length }}/15</span>
                  
                </div>
              
          















          <!-- SUBJECT -->
          <div class="form-group">
            <label for="subject">Subject</label>
            <input
              id="subject"
              type="text"
              [(ngModel)]="subject"
              name="subject"
              #subjectInput="ngModel"
              placeholder="What's this about?"
              maxlength="100"
              [class.invalid]="subjectInput.invalid && (subjectInput.dirty || subjectInput.touched || formSubmitted)"
            />
            @if (subjectInput.errors?.['maxlength'] && (subjectInput.dirty || subjectInput.touched)) {
              <div class="validation-error"><small>Subject cannot exceed 100 characters.</small></div>
            }
            <span class="char-count" [class.over]="subject.length > 100">{{ subject.length }}/100</span>
          </div>

          <!-- MESSAGE -->
          <div class="form-group">
            <label for="message">Message <span class="req">*</span></label>
            <textarea
              id="message"
              [(ngModel)]="message"
              name="message"
              #messageInput="ngModel"
              placeholder="Tell us how we can help…"
              required
              minlength="10"
              maxlength="1000"
              rows="5"
              [class.invalid]="messageInput.invalid && (messageInput.dirty || messageInput.touched || formSubmitted)"
            ></textarea>
            @if (messageInput.invalid && (messageInput.dirty || messageInput.touched || formSubmitted)) {
              <div class="validation-error">
                @if (messageInput.errors?.['required']) { <small>Message is required.</small> }
                @if (messageInput.errors?.['minlength']) {
                  <small>At least 10 characters ({{ messageInput.errors?.['minlength'].actualLength }}/10).</small>
                }
              </div>
            }
            <span class="char-count" [class.over]="message.length > 1000">{{ message.length }}/1000</span>
          </div>

          @if (success()) {
            <div class="success-msg">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Thank you! Your message has been sent. We'll be in touch soon.
            </div>
          }
          @if (error()) {
            <div class="error-msg">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              {{ error() }}
            </div>
          }

          <button type="submit" class="send-btn" [disabled]="sending()">
            @if (sending()) {
              <span class="spinner"></span> Sending…
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send Message
            }
          </button>

        </form>
      </div>

    </div>
  `,
  styles: [`
    /* ── HERO ── */
    .contact-hero {
      background: linear-gradient(135deg, #1a4a35 0%, #2d7a52 100%);
      color: white;
      padding: 4rem 1.5rem 3rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .contact-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.06) 0%, transparent 60%);
      pointer-events: none;
    }
    .hero-badge {
      display: inline-block;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      color: rgba(255,255,255,0.9);
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      margin-bottom: 1rem;
    }
    .contact-hero h1 {
      color: white;
      font-size: clamp(2rem, 5vw, 3rem);
      margin: 0 0 0.5rem;
      font-weight: 700;
    }
    .contact-hero p { opacity: 0.85; margin: 0; font-size: 1.05rem; }

    /* ── LAYOUT ── */
    .contact-wrapper {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 0;
      max-width: 1100px;
      margin: 0 auto 4rem;
      padding: 2.5rem 1.5rem;
      align-items: start;
    }
    @media (max-width: 800px) {
      .contact-wrapper { grid-template-columns: 1fr; }
    }

    /* ── LEFT PANEL ── */
    .our-details {
      background: #1a4a35;
      color: white;
      border-radius: 16px 0 0 16px;
      padding: 2.5rem 2rem;
      position: relative;
      overflow: hidden;
      min-height: 580px;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .our-details::after {
      content: '';
      position: absolute;
      bottom: -60px;
      right: -60px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      pointer-events: none;
    }
    @media (max-width: 800px) {
      .our-details { border-radius: 16px 16px 0 0; min-height: auto; }
    }

    .section-label {
      display: block;
      font-size: 0.7rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }
    .our-details .section-label { color: rgba(255,255,255,0.55); }
    .form-panel .section-label { color: #2d7a52; }

    .details-header h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.6rem;
    }
    .details-header p {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.65);
      line-height: 1.6;
      margin: 0;
    }

    /* Info Cards */
    .info-cards { display: flex; flex-direction: column; gap: 1.1rem; }
    .info-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.1rem;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      transition: background 0.2s;
    }
    .info-card:hover { background: rgba(255,255,255,0.11); }

    .info-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.12);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .info-icon svg { width: 16px; height: 16px; color: rgba(255,255,255,0.85); }

    .info-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .info-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.45); font-weight: 600; }
    .info-value {
      font-size: 0.92rem;
      font-weight: 600;
      color: white;
      text-decoration: none;
      word-break: break-all;
    }
    a.info-value:hover { color: #9de4bc; }
    .info-note { font-size: 0.78rem; color: rgba(255,255,255,0.5); }

    /* Social */
    .social-strip { margin-top: auto; }
    .social-label { font-size: 0.75rem; color: rgba(255,255,255,0.5); display: block; margin-bottom: 0.6rem; }
    .social-links { display: flex; gap: 0.6rem; }
    .social-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      transition: background 0.2s, color 0.2s;
    }
    .social-btn:hover { background: rgba(255,255,255,0.18); color: white; }
    .social-btn svg { width: 15px; height: 15px; }

    /* ── RIGHT PANEL ── */
    .form-panel {
      background: white;
      border-radius: 0 16px 16px 0;
      padding: 2.5rem 2.2rem;
      box-shadow: 4px 0 40px rgba(0,0,0,0.06);
    }
    @media (max-width: 800px) {
      .form-panel { border-radius: 0 0 16px 16px; }
    }
    .form-panel-header { margin-bottom: 1.75rem; }
    .form-panel-header h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    /* Form elements */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }

    .form-group { margin-bottom: 1.1rem; position: relative; }
    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.4rem;
      letter-spacing: 0.01em;
    }
    .req { color: #c53030; }
    .optional { font-weight: 400; color: #9ca3af; font-size: 0.75rem; }

    input, textarea {
      width: 100%;
      padding: 0.65rem 0.9rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #111827;
      background: #fafafa;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      box-sizing: border-box;
      outline: none;
      font-family: inherit;
    }
    input:focus, textarea:focus {
      border-color: #2d7a52;
      background: white;
      box-shadow: 0 0 0 3px rgba(45,122,82,0.12);
    }
    input.invalid, textarea.invalid {
      border-color: #c53030 !important;
      box-shadow: 0 0 0 3px rgba(197,48,48,0.1);
    }
    input.ng-valid.ng-touched, textarea.ng-valid.ng-touched {
      border-color: #2d7a52;
    }
    input::placeholder, textarea::placeholder { color: #c4c9d1; }
    textarea { resize: vertical; min-height: 110px; }

    .char-count {
      display: block;
      text-align: right;
      font-size: 0.7rem;
      color: #c4c9d1;
      margin-top: 3px;
    }
    .char-count.over { color: #c53030; font-weight: 600; }

    .validation-error { margin-top: 3px; }
    .validation-error small { display: block; font-size: 0.75rem; color: #c53030; }

    /* Alerts */
    .success-msg, .error-msg {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    .success-msg { background: #f0fdf4; color: #166534; }
    .error-msg { background: #fef2f2; color: #c53030; }
    .success-msg svg, .error-msg svg { width: 18px; height: 18px; flex-shrink: 0; }

    /* Submit button */
    .send-btn {
      width: 100%;
      padding: 0.85rem 1.5rem;
      background: linear-gradient(135deg, #1a4a35, #2d7a52);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      margin-top: 0.5rem;
      transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
      letter-spacing: 0.01em;
    }
    .send-btn svg { width: 16px; height: 16px; }
    .send-btn:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(45,122,82,0.3);
    }
    .send-btn:active:not(:disabled) { transform: translateY(0); }
    .send-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ContactComponent {
  name = '';
  email = '';
  phone = '';
  subject = '';
  message = '';
  sending = signal(false);
  success = signal(false);
  error = signal('');
  formSubmitted = false;



  getEvents() {
    return this.api.getEvents(1, 12);
  }

  constructor(private api: ApiService) {}

  submit(form: NgForm): void {
    this.formSubmitted = true;
    form.control.markAllAsTouched();

    if (form.invalid) {
      this.error.set('Please fill in the required fields before submitting.');
      return;
    }

    this.sending.set(true);
    this.success.set(false);
    this.error.set('');

    this.api.submitContact(this.name, this.email, this.subject, this.message).subscribe({
      next: () => {
        this.sending.set(false);
        this.success.set(true);
        form.resetForm();
        this.name = '';
        this.email = '';
        this.phone = '';
        this.subject = '';
        this.message = '';
        this.formSubmitted = false;
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to send message. Please try again.');
        this.sending.set(false);
      }
    });
  }
}
