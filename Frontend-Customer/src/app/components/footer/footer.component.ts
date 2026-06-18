import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthUiService } from '../../services/auth-ui.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslatePipe],
  template: `
    <footer class="footer">
      <div class="footer-backdrop" aria-hidden="true">
        <span class="footer-orb footer-orb--left"></span>
        <span class="footer-orb footer-orb--right"></span>
      </div>

      <div class="container footer-main">
        <div class="footer-brand">
          <a routerLink="/" class="footer-logo" aria-label="Memora home">
            <span class="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 11.2c-2-4.5-5.9-6.1-9.2-5 0 3.8 2.5 7.3 6.8 7.8 1 .1 1.8-.1 2.4-.5Z" />
                <path d="M12 11.2c2-4.5 5.9-6.1 9.2-5 0 3.8-2.5 7.3-6.8 7.8-1 .1-1.8-.1-2.4-.5Z" />
                <path d="M12 11.9c-1.8 3.7-4.9 5-7.4 4.3 0 2.9 2 5.5 5.2 5.8 1 .1 1.8-.2 2.2-.7Z" />
                <path d="M12 11.9c1.8 3.7 4.9 5 7.4 4.3 0 2.9-2 5.5-5.2 5.8-1 .1-1.8-.2-2.2-.7Z" />
              </svg>
            </span>
            <span class="footer-wordmark">Memora</span>
          </a>
          <p class="footer-tagline">{{ 'footer.tagline' | t }}</p>
          <p class="footer-lede">{{ 'footer.lede' | t }}</p>
          <div class="social-links" aria-label="Social media">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="social-btn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="social-btn">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" class="social-btn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" /></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="social-btn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
            </a>
          </div>
        </div>

        <div class="footer-nav">
          <div class="footer-section">
            <h4 class="footer-heading">{{ 'footer.explore' | t }}</h4>
            <ul class="footer-links">
              <li><a routerLink="/" class="footer-link">{{ 'nav.feed' | t }}</a></li>
              <li><a routerLink="/pricing" class="footer-link">{{ 'nav.pricing' | t }}</a></li>
              <li><a routerLink="/contact" class="footer-link">{{ 'nav.contact' | t }}</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">{{ 'footer.account' | t }}</h4>
            <ul class="footer-links">
              @if (auth.isLoggedIn()) {
                <li><a routerLink="/my-events" class="footer-link">{{ 'nav.myEvents' | t }}</a></li>
                <li><a routerLink="/profile" class="footer-link">{{ 'nav.myAccount' | t }}</a></li>
                <li>
                  <button type="button" class="footer-link footer-link-btn" (click)="auth.logout()">{{ 'nav.logout' | t }}</button>
                </li>
              } @else {
                <li>
                  <button type="button" class="footer-link footer-link-btn" (click)="authUi.openLogin()">{{ 'nav.login' | t }}</button>
                </li>
                <li>
                  <button type="button" class="footer-link footer-link-btn" (click)="authUi.openRegister()">{{ 'nav.register' | t }}</button>
                </li>
              }
            </ul>
          </div>

          <div class="footer-section footer-section--contact">
            <h4 class="footer-heading">{{ 'footer.contactHeading' | t }}</h4>
            <ul class="contact-list">
              <li class="contact-item">
                <span class="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </span>
                <div class="contact-body">
                  <span class="contact-label">{{ 'footer.emailLabel' | t }}</span>
                  <a href="mailto:support@lifeeventshub.com" class="contact-value">support&#64;lifeeventshub.com</a>
                </div>
              </li>
              <li class="contact-item">
                <span class="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </span>
                <div class="contact-body">
                  <span class="contact-label">{{ 'footer.phoneLabel' | t }}</span>
                  <a href="tel:+441234567890" class="contact-value">+44 1234 567 890</a>
                </div>
              </li>
              <li class="contact-item">
                <span class="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                </span>
                <div class="contact-body">
                  <span class="contact-label">{{ 'footer.locationLabel' | t }}</span>
                  <span class="contact-value">{{ 'footer.location' | t }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p class="footer-copy">{{ 'footer.copyright' | t:{ year } }}</p>
          <nav class="footer-legal" [attr.aria-label]="'footer.legalAria' | t">
            <a href="#" class="footer-legal-link">{{ 'footer.privacy' | t }}</a>
            <a href="#" class="footer-legal-link">{{ 'footer.terms' | t }}</a>
            <a href="#" class="footer-legal-link">{{ 'footer.cookies' | t }}</a>
          </nav>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      position: relative;
      margin-top: auto;
      overflow: hidden;
      color: #d8ebe3;
      background: linear-gradient(168deg, #0a3329 0%, #0d3d32 38%, #145242 72%, #1a5f4a 100%);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .footer-backdrop {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .footer-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(48px);
      opacity: 0.45;
    }

    .footer-orb--left {
      width: 280px;
      height: 280px;
      top: -120px;
      left: -80px;
      background: rgba(120, 220, 180, 0.22);
    }

    .footer-orb--right {
      width: 320px;
      height: 320px;
      bottom: -140px;
      right: -100px;
      background: rgba(0, 0, 0, 0.28);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .footer-main {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1.85fr);
      gap: 2.5rem;
      padding: 2.5rem 1.5rem 2rem;
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 22rem;
    }

    .footer-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #fff;
      font-size: 1.25rem;
      font-weight: 700;
      font-family: var(--font-display);
    }

    .brand-icon {
      width: 1.25rem;
      height: 1.25rem;
      display: inline-flex;
      color: #b8e6d4;
    }

    .brand-icon svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .footer-wordmark {
      letter-spacing: 0.02em;
    }

    .footer-tagline {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      line-height: 1.35;
      font-family: var(--font-display);
    }

    .footer-lede {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
      color: rgba(216, 235, 227, 0.82);
    }

    .social-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }

    .social-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 10px;
      color: #fff;
      text-decoration: none;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    }

    .social-btn svg {
      width: 1rem;
      height: 1rem;
      fill: currentColor;
    }

    .social-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.22);
      transform: translateY(-1px);
    }

    .footer-nav {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.5rem 2rem;
    }

    .footer-section {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .footer-heading {
      margin: 0;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.92);
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }

    .footer-link {
      color: rgba(216, 235, 227, 0.82);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: color 0.15s ease;
    }

    .footer-link:hover {
      color: #fff;
    }

    .footer-link:focus-visible,
    .footer-legal-link:focus-visible,
    .social-btn:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.85);
      outline-offset: 2px;
    }

    button.footer-link-btn {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      background: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
    }

    .contact-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .contact-icon {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 9px;
      color: #b8e6d4;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .contact-icon svg {
      width: 0.95rem;
      height: 0.95rem;
    }

    .contact-body {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .contact-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(216, 235, 227, 0.58);
    }

    .contact-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: rgba(216, 235, 227, 0.9);
      text-decoration: none;
      line-height: 1.4;
      word-break: break-word;
    }

    a.contact-value:hover {
      color: #fff;
    }

    .footer-bottom {
      position: relative;
      z-index: 1;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.14);
    }

    .footer-bottom-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem 1.5rem;
      padding: 0.9rem 1.5rem 1rem;
    }

    .footer-copy {
      margin: 0;
      font-size: 0.8125rem;
      color: rgba(216, 235, 227, 0.68);
    }

    .footer-legal {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem 1rem;
    }

    .footer-legal-link {
      font-size: 0.8125rem;
      font-weight: 500;
      color: rgba(216, 235, 227, 0.72);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .footer-legal-link:hover {
      color: #fff;
    }

    @media (max-width: 960px) {
      .footer-main {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 2rem 1.25rem 1.5rem;
      }

      .footer-brand {
        max-width: none;
      }
    }

    @media (max-width: 640px) {
      .footer-nav {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .footer-bottom-inner {
        flex-direction: column;
        align-items: flex-start;
        padding: 1rem 1.25rem 1.15rem;
      }
    }
  `]
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  readonly authUi = inject(AuthUiService);
  readonly auth = inject(AuthService);
}
