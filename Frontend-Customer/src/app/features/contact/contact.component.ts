import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

type ContactItem = {
  country: string;
  hotline: string;
  email: string;
  note: string;
};

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="contact-page">
      <header class="contact-hero">
        <div class="container hero-wrap">
          <div class="hero-band">
            <div class="hero-glow" aria-hidden="true"></div>
            <div class="hero-inner">
              <p class="hero-kicker">
                <span class="hero-kicker-rule" aria-hidden="true"></span>
                Memora
                <span class="hero-kicker-rule" aria-hidden="true"></span>
              </p>
              <h1>{{ 'contact.heroTitle' | t }}</h1>
              <p class="hero-lede">{{ 'contact.heroLede' | t }}</p>
            </div>
          </div>
        </div>
      </header>

      <div class="container contact-shell">
        <div class="contact-grid">
          <aside class="contact-aside">
            <article class="lift-card hotline-card">
              <div class="hotline-icon-wrap" aria-hidden="true">
                <svg class="hotline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <p class="hotline-label">{{ 'contact.hotlineLabel' | t }}</p>
              <a class="hotline-number" href="tel:+18001234567">+1 800-123-4567</a>
              <p class="hotline-note">{{ 'contact.hotlineNote' | t }}</p>
            </article>

            <div class="lift-card region-card">
              <label class="region-label" for="country">{{ 'contact.regionLabel' | t }}</label>
              <div class="select-wrap">
                <select id="country" [(ngModel)]="selectedCountry" name="country" class="region-select">
                  @for (item of contacts; track item.country) {
                    <option [value]="item.country">{{ item.country }}</option>
                  }
                </select>
              </div>
            </div>

            <a class="lift-card info-card" [href]="'tel:+' + telDigits(selectedContact().hotline)">
              <span class="info-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <div class="info-body">
                <span class="info-title">{{ selectedContact().country }}</span>
                <span class="info-main">+{{ selectedContact().hotline }}</span>
                <span class="info-sub">{{ selectedContact().note }}</span>
              </div>
              <span class="info-chevron" aria-hidden="true">→</span>
            </a>

            <a class="lift-card info-card" [href]="'mailto:' + selectedContact().email">
              <span class="info-icon info-icon-mail" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <div class="info-body">
                <span class="info-title">{{ 'contact.emailTitle' | t }}</span>
                <span class="info-main info-email">{{ selectedContact().email }}</span>
                <span class="info-sub">{{ 'contact.emailSub' | t }}</span>
              </div>
              <span class="info-chevron" aria-hidden="true">→</span>
            </a>
          </aside>

          <section class="form-panel lift-card">
            <div class="form-panel-head">
              <h2>{{ 'contact.formTitle' | t }}</h2>
              <p>{{ 'contact.formSub' | t }}</p>
            </div>
            <form #contactForm="ngForm" (ngSubmit)="submit(contactForm)" class="contact-form">
              <div class="form-grid">
                <div class="field">
                  <label for="name">{{ 'contact.name' | t }} <span class="req">{{ 'contact.required' | t }}</span></label>
                  <input
                    id="name"
                    type="text"
                    [(ngModel)]="name"
                    name="name"
                    required
                    minlength="2"
                    [placeholder]="'contact.placeholder.name' | t"
                    class="inp"
                  />
                </div>
                <div class="field">
                  <label for="email">{{ 'contact.email' | t }} <span class="req">{{ 'contact.required' | t }}</span></label>
                  <input
                    id="email"
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    [placeholder]="'contact.placeholder.email' | t"
                    class="inp"
                  />
                </div>
              </div>
              <div class="field">
                <label for="subject">{{ 'contact.subject' | t }}</label>
                <input
                  id="subject"
                  type="text"
                  [(ngModel)]="subject"
                  name="subject"
                  maxlength="100"
                  [placeholder]="'contact.placeholder.subject' | t"
                  class="inp"
                />
              </div>
              <div class="field">
                <label for="message">{{ 'contact.message' | t }} <span class="req">{{ 'contact.required' | t }}</span></label>
                <textarea
                  id="message"
                  [(ngModel)]="message"
                  name="message"
                  rows="5"
                  required
                  minlength="10"
                  [placeholder]="'contact.placeholder.message' | t"
                  class="inp ta"
                ></textarea>
              </div>
              @if (success()) {
                <div class="banner ok" role="status">{{ 'contact.success' | t }}</div>
              }
              @if (error()) {
                <div class="banner err" role="alert">{{ error() }}</div>
              }
              <button type="submit" class="submit-btn" [disabled]="sending()">
                <span class="submit-label">{{ sending() ? ('contact.sending' | t) : ('contact.send' | t) }}</span>
                <span class="submit-shine" aria-hidden="true"></span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-page {
      min-height: 100%;
      padding-bottom: 2.5rem;
    }

    .contact-hero {
      background: transparent;
      padding: 0.35rem 0 0;
      margin-bottom: 1.35rem;
    }
    .hero-wrap {
      display: flex;
      justify-content: center;
      padding: 0 1.25rem;
    }
    .hero-band {
      position: relative;
      overflow: hidden;
      width: 100%;
      max-width: 560px;
      padding: 0.95rem 1.35rem 1.05rem;
      border-radius: 18px;
      background: linear-gradient(152deg, #0e3a30 0%, #164d40 38%, #1f6a53 72%, #287860 100%);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow:
        0 4px 6px rgba(13, 61, 50, 0.06),
        0 18px 38px rgba(13, 61, 50, 0.14),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    .hero-glow {
      position: absolute;
      inset: -35% 10% auto -15%;
      height: 140%;
      background: radial-gradient(ellipse 55% 48% at 78% 18%, rgba(255, 255, 255, 0.14) 0%, transparent 58%);
      pointer-events: none;
      animation: heroGlowDrift 14s ease-in-out infinite;
    }
    @keyframes heroGlowDrift {
      0%, 100% { opacity: 0.75; transform: translateX(0); }
      50% { opacity: 1; transform: translateX(3%); }
    }
    .hero-inner {
      position: relative;
      z-index: 1;
      text-align: center;
    }
    .hero-kicker {
      margin: 0 0 0.35rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-size: 0.62rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.78);
    }
    .hero-kicker-rule {
      display: inline-block;
      width: 1.35rem;
      height: 2px;
      border-radius: 2px;
      background: linear-gradient(90deg, transparent, rgba(212, 165, 116, 0.85), transparent);
    }
    .contact-hero h1 {
      margin: 0 0 0.38rem;
      font-family: var(--font-display);
      font-size: clamp(1.28rem, 2.6vw, 1.58rem);
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.03em;
      line-height: 1.2;
    }
    .hero-lede {
      margin: 0 auto;
      max-width: 38ch;
      font-size: 0.82rem;
      font-weight: 400;
      line-height: 1.52;
      letter-spacing: 0.015em;
      color: rgba(255, 255, 255, 0.82);
    }

    .container {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 1.25rem;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
      gap: 1.5rem;
      align-items: start;
    }

    .lift-card {
      background: #fff;
      border: 1px solid rgba(26, 95, 74, 0.1);
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(13, 61, 50, 0.06);
      transition:
        transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 0.35s ease,
        border-color 0.25s ease;
    }
    .lift-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(13, 61, 50, 0.12);
      border-color: rgba(26, 95, 74, 0.18);
    }

    .contact-aside {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .hotline-card {
      text-align: center;
      padding: 1.5rem 1.25rem;
      position: relative;
      overflow: hidden;
    }
    .hotline-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(236, 246, 241, 0.9) 0%, rgba(255, 255, 255, 0.5) 100%);
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
    }
    .hotline-card:hover::before {
      opacity: 1;
    }
    .hotline-card > * {
      position: relative;
      z-index: 1;
    }
    .hotline-icon-wrap {
      width: 52px;
      height: 52px;
      margin: 0 auto 0.85rem;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: linear-gradient(145deg, #1a5f4a 0%, #2f7e66 100%);
      color: #fff;
      box-shadow: 0 8px 22px rgba(26, 95, 74, 0.35);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease;
    }
    .hotline-card:hover .hotline-icon-wrap {
      transform: scale(1.06) rotate(-3deg);
      box-shadow: 0 12px 28px rgba(26, 95, 74, 0.4);
    }
    .hotline-svg {
      width: 26px;
      height: 26px;
    }
    .hotline-label {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: #46675f;
    }
    .hotline-number {
      display: inline-block;
      margin: 0.55rem 0 0.35rem;
      font-size: clamp(1.35rem, 3vw, 1.75rem);
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #0d3d32;
      text-decoration: none;
      background: linear-gradient(120deg, #0d3d32 0%, #1f6a53 50%, #2d8f73 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      transition: background-position 0.5s ease;
    }
    .hotline-card:hover .hotline-number {
      background-position: 100% center;
    }
    .hotline-note {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.45;
      color: #5a6f68;
    }

    .region-card {
      padding: 1.1rem 1.15rem;
    }
    .region-label {
      display: block;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #46675f;
      margin-bottom: 0.5rem;
    }
    .select-wrap {
      position: relative;
    }
    .select-wrap::after {
      content: '▾';
      position: absolute;
      right: 0.9rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.65rem;
      color: #1a5f4a;
      pointer-events: none;
    }
    .region-select {
      width: 100%;
      appearance: none;
      padding: 0.72rem 2.25rem 0.72rem 0.85rem;
      border: 1px solid #d0e0d8;
      border-radius: 12px;
      font: inherit;
      font-size: 0.92rem;
      font-weight: 600;
      color: #0f2922;
      background: #f8fcfa;
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .region-select:hover {
      border-color: #9fc9b8;
      background: #fff;
    }
    .region-select:focus {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.15);
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.05rem 1.15rem;
      text-decoration: none;
      color: inherit;
    }
    .info-card:hover .info-chevron {
      transform: translateX(5px);
      color: #1a5f4a;
    }
    .info-icon {
      flex-shrink: 0;
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, #f0f7f4 0%, #e8f2ec 100%);
      border: 1px solid rgba(26, 95, 74, 0.12);
      color: #1a5f4a;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s ease, border-color 0.25s ease;
    }
    .info-card:hover .info-icon {
      transform: scale(1.08);
      background: linear-gradient(145deg, #ecf6f1 0%, #dff0e8 100%);
      border-color: rgba(26, 95, 74, 0.22);
    }
    .info-icon svg {
      width: 22px;
      height: 22px;
    }
    .info-icon-mail {
      color: #155e48;
    }
    .info-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .info-title {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #6b7f77;
    }
    .info-main {
      font-size: 1rem;
      font-weight: 700;
      color: #0f2922;
      word-break: break-word;
    }
    .info-email {
      font-size: 0.92rem;
      font-weight: 600;
      color: #1a5f4a;
    }
    .info-sub {
      font-size: 0.78rem;
      line-height: 1.4;
      color: #6f8079;
    }
    .info-chevron {
      flex-shrink: 0;
      font-size: 1.1rem;
      color: #b8cec4;
      transition: transform 0.3s ease, color 0.25s ease;
    }

    .form-panel {
      padding: clamp(1.35rem, 3vw, 1.75rem);
    }
    .form-panel-head {
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(26, 95, 74, 0.1);
    }
    .form-panel-head h2 {
      margin: 0 0 0.35rem;
      font-family: var(--font-display);
      font-size: 1.45rem;
      font-weight: 700;
      color: #0f2922;
    }
    .form-panel-head p {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.5;
      color: #5a6f68;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .field {
      margin-bottom: 1rem;
    }
    .field label {
      display: block;
      margin-bottom: 0.35rem;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #46675f;
    }
    .req {
      color: #c24141;
      font-weight: 700;
    }
    .inp {
      width: 100%;
      box-sizing: border-box;
      padding: 0.78rem 0.9rem;
      border: 1px solid #d0e0d8;
      border-radius: 12px;
      font: inherit;
      font-size: 0.94rem;
      color: #1a2e28;
      background: #fbfcfb;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .inp::placeholder {
      color: #94a8a0;
    }
    .inp:hover {
      border-color: #b8d4ca;
      background: #fff;
    }
    .inp:focus {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
      background: #fff;
    }
    .ta {
      resize: vertical;
      min-height: 120px;
      line-height: 1.5;
    }

    .banner {
      border-radius: 12px;
      padding: 0.75rem 0.9rem;
      margin-bottom: 1rem;
      font-size: 0.88rem;
      line-height: 1.45;
    }
    .banner.ok {
      background: linear-gradient(135deg, #ecfdf3 0%, #e8f7ee 100%);
      color: #166534;
      border: 1px solid rgba(22, 101, 52, 0.2);
    }
    .banner.err {
      background: linear-gradient(135deg, #fef2f2 0%, #fdecec 100%);
      color: #b91c1c;
      border: 1px solid rgba(185, 28, 28, 0.18);
    }

    .submit-btn {
      position: relative;
      margin-top: 0.25rem;
      width: 100%;
      border: none;
      border-radius: 12px;
      padding: 0.88rem 1.25rem;
      font: inherit;
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      overflow: hidden;
      background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 55%, #2d8f73 100%);
      background-size: 200% auto;
      box-shadow: 0 8px 24px rgba(13, 61, 50, 0.28);
      transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.2s ease;
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(13, 61, 50, 0.34);
      background-position: 100% center;
    }
    .submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }
    .submit-label {
      position: relative;
      z-index: 1;
    }
    .submit-shine {
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.18) 50%, transparent 60%);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }
    .submit-btn:hover:not(:disabled) .submit-shine {
      transform: translateX(100%);
    }

    @media (max-width: 900px) {
      .contact-grid {
        grid-template-columns: 1fr;
      }
      .form-panel {
        order: -1;
      }
    }

    @media (max-width: 560px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-glow {
        animation: none;
      }
      .lift-card:hover {
        transform: none;
      }
      .hotline-card:hover .hotline-icon-wrap,
      .info-card:hover .info-icon {
        transform: none;
      }
      .hotline-card:hover .hotline-number {
        background-position: 0 center;
      }
      .info-card:hover .info-chevron {
        transform: none;
      }
      .submit-btn:hover:not(:disabled) {
        transform: none;
      }
      .submit-btn:hover:not(:disabled) .submit-shine {
        transform: translateX(-100%);
      }
      .submit-btn:hover:not(:disabled) {
        background-position: 0 center;
      }
    }
  `]
})
export class ContactComponent {
  contacts: ContactItem[] = [
    {
      country: 'Sri Lanka',
      hotline: '94 11 234 5678',
      email: 'support@lifeeventshub.com',
      note: 'Local rates may apply · Mon–Sun 9:00–18:00 IST'
    },
    {
      country: 'United Kingdom',
      hotline: '44 20 3137 6284',
      email: 'support@lifeeventshub.com',
      note: 'UK office hours · Calls may be recorded for quality'
    }
  ];

  selectedCountry = 'Sri Lanka';
  name = '';
  email = '';
  subject = '';
  message = '';
  sending = signal(false);
  success = signal(false);
  error = signal('');

  constructor(
    private api: ApiService,
    private lang: LanguageService
  ) {}

  selectedContact(): ContactItem {
    return this.contacts.find((c) => c.country === this.selectedCountry) ?? this.contacts[0];
  }

  /** Strip spaces/plus for tel: href */
  telDigits(hotline: string): string {
    return hotline.replace(/\s+/g, '').replace(/^\+/, '');
  }

  submit(form: NgForm): void {
    if (form.invalid) {
      this.error.set(this.lang.t('contact.fillRequired'));
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
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(err.error?.message || this.lang.t('contact.sendFailed'));
      }
    });
  }
}
