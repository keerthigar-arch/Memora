import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthUiService } from '../../services/auth-ui.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslatePipe],
  template: `
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <a routerLink="/" class="footer-logo">
            <span class="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 11.2c-2-4.5-5.9-6.1-9.2-5 0 3.8 2.5 7.3 6.8 7.8 1 .1 1.8-.1 2.4-.5Z"/>
                <path d="M12 11.2c2-4.5 5.9-6.1 9.2-5 0 3.8-2.5 7.3-6.8 7.8-1 .1-1.8-.1-2.4-.5Z"/>
                <path d="M12 11.9c-1.8 3.7-4.9 5-7.4 4.3 0 2.9 2 5.5 5.2 5.8 1 .1 1.8-.2 2.2-.7Z"/>
                <path d="M12 11.9c1.8 3.7 4.9 5 7.4 4.3 0 2.9-2 5.5-5.2 5.8-1 .1-1.8-.2-2.2-.7Z"/>
              </svg>
            </span>
            <span class="footer-wordmark">Memora</span>
          </a>
          <p class="footer-tagline">{{ 'footer.tagline' | t }}</p>
          <div class="social-links">
            <a href="https://facebook.com" target="_blank" aria-label="Facebook" class="social-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" aria-label="Twitter" class="social-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" aria-label="Instagram" class="social-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" aria-label="YouTube" class="social-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" aria-label="LinkedIn" class="social-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="footer-section">
          <h4 class="footer-heading">{{ 'footer.memora' | t }}</h4>
          <ul class="footer-links">
            <li><a routerLink="/" class="footer-link">{{ 'nav.feed' | t }}</a></li>
            <li><a routerLink="/pricing/obituary/srilanka" class="footer-link">{{ 'nav.pricing' | t }}</a></li>
            <li><a routerLink="/contact" class="footer-link">{{ 'nav.contact' | t }}</a></li>
            <li>
              <button type="button" class="footer-link footer-link-btn" (click)="authUi.openLogin()">{{ 'nav.login' | t }}</button>
            </li>
            <li>
              <button type="button" class="footer-link footer-link-btn" (click)="authUi.openRegister()">{{ 'nav.register' | t }}</button>
            </li>
          </ul>
        </div>

        <div class="footer-section">
          <h4 class="footer-heading">{{ 'footer.contactHeading' | t }}</h4>
          <ul class="footer-links contact-list">
            <li class="contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <a href="mailto:support@lifeeventshub.com" class="footer-link">support&#64;lifeeventshub.com</a>
            </li>
            <li class="contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <a href="tel:+441234567890" class="footer-link">+44 1234 567 890</a>
            </li>
            <li class="contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <a href="tel:+441234567891" class="footer-link">+44 1234 567 891</a>
            </li>
            <li class="contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span class="footer-link">London, United Kingdom</span>
            </li>
          </ul>
        </div>

      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p>© {{ year }} Memora. All rights reserved.</p>
          <div class="footer-bottom-links">
            <a href="#" class="footer-link">Privacy</a>
            <span class="divider">|</span>
            <a href="#" class="footer-link">Terms</a>
            <span class="divider">|</span>
            <a href="#" class="footer-link">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #1a4a3a;
      color: #cde8dc;
      padding: 1.75rem 0 0;
      margin-top: auto;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.25rem;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1.4fr 0.9fr 1.2fr;
      gap: 1.5rem 2rem;
      padding-bottom: 1.25rem;
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: #ffffff;
      font-size: 1.15rem;
      font-weight: 700;
      font-family: var(--font-display);
    }

    .footer-wordmark {
      letter-spacing: 0.02em;
    }
    .brand-icon {
      width: 1.15rem;
      height: 1.15rem;
      display: inline-flex;
      color: #bde9d7;
      margin-right: 0.25rem;
    }
    .brand-icon svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .footer-tagline {
      font-size: 0.8rem;
      color: #9ecfb8;
      margin: 0;
      line-height: 1.35;
    }

    .social-links {
      display: flex;
      gap: 0.35rem;
      margin-top: 0.35rem;
      flex-wrap: wrap;
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      text-decoration: none;
      transition: background-color 0.15s ease;
    }

    .social-btn:hover {
      background-color: rgba(255, 255, 255, 0.22);
    }

    .footer-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .footer-heading {
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .footer-link {
      color: #9ecfb8;
      text-decoration: none;
      font-size: 0.82rem;
      transition: color 0.15s ease;
    }

    .footer-link:hover {
      color: #ffffff;
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

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
    }

    .contact-item svg {
      margin-top: 1px;
      flex-shrink: 0;
      color: #5cbf94;
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.65rem 0;
    }

    .footer-bottom-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
    }

    .footer-bottom-inner p {
      margin: 0;
      font-size: 0.75rem;
      color: #9ecfb8;
    }

    .footer-bottom-links {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.75rem;
    }

    .divider {
      color: rgba(255, 255, 255, 0.3);
    }

    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem 1.5rem;
      }
      .footer-brand {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 550px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 1.1rem;
      }

      .footer-bottom-inner {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {
  readonly year = new Date().getFullYear();

  constructor(public authUi: AuthUiService) {}
}
