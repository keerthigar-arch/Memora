import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <footer class="footer">
      <div class="container footer-main">
        <div class="footer-brand">
          <a routerLink="/events" class="footer-logo" aria-label="Memora Admin home">
            <span class="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 11.2c-2-4.5-5.9-6.1-9.2-5 0 3.8 2.5 7.3 6.8 7.8 1 .1 1.8-.1 2.4-.5Z" />
                <path d="M12 11.2c2-4.5 5.9-6.1 9.2-5 0 3.8-2.5 7.3-6.8 7.8-1 .1-1.8-.1-2.4-.5Z" />
                <path d="M12 11.9c-1.8 3.7-4.9 5-7.4 4.3 0 2.9 2 5.5 5.2 5.8 1 .1 1.8-.2 2.2-.7Z" />
                <path d="M12 11.9c1.8 3.7 4.9 5 7.4 4.3 0 2.9-2 5.5-5.2 5.8-1 .1-1.8-.2-2.2-.7Z" />
              </svg>
            </span>
            <span class="footer-wordmark">Memora</span>
            <span class="footer-admin-tag">Admin</span>
          </a>
          <p class="footer-tagline">
            Secure operations console for event management, customer accounts, and payment oversight.
          </p>
        </div>

        <div class="footer-nav">
          <div class="footer-section">
            <h4 class="footer-heading">Platform</h4>
            <ul class="footer-links">
              <li><a routerLink="/events" class="footer-link">Event Management</a></li>
              <li><a routerLink="/users" class="footer-link">User Management</a></li>
              <li><a routerLink="/payments" class="footer-link">Payments</a></li>
              <li><a routerLink="/create-event" class="footer-link">Create Event</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">Account</h4>
            <ul class="footer-links">
              <li><a routerLink="/profile" class="footer-link">My Account</a></li>
              <li>
                <button type="button" class="footer-link footer-link-btn" (click)="auth.logout()">Log out</button>
              </li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">Support</h4>
            <ul class="footer-links">
              <li>
                <a href="mailto:support@memora.com" class="footer-link">support&#64;memora.com</a>
              </li>
              <li>
                <a href="tel:+18001234567" class="footer-link">+1 800-123-4567</a>
              </li>
              <li><span class="footer-meta">24/7 administrator support</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p class="footer-copy">© {{ year }} Memora. All rights reserved.</p>
          <nav class="footer-legal" aria-label="Legal">
            <a href="#" class="footer-legal-link">Privacy</a>
            <a href="#" class="footer-legal-link">Terms</a>
            <a href="#" class="footer-legal-link">Security</a>
          </nav>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        margin-top: auto;
        position: relative;
        overflow: hidden;
        background: linear-gradient(165deg, #0d3d32 0%, #145242 42%, #1a5f4a 100%);
        color: #d8ebe3;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .footer::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 80% 120% at 0% 0%, rgba(255, 255, 255, 0.08) 0%, transparent 55%),
          radial-gradient(ellipse 60% 90% at 100% 100%, rgba(0, 0, 0, 0.12) 0%, transparent 50%);
        pointer-events: none;
      }
      .footer-main,
      .footer-bottom {
        position: relative;
        z-index: 1;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
      }

      .footer-main {
        display: grid;
        grid-template-columns: 1.2fr 1.8fr;
        gap: 2rem;
        padding: 2rem 1.5rem 1.5rem;
      }

      .footer-brand {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        max-width: 22rem;
      }

      .footer-logo {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem 0.5rem;
        text-decoration: none;
        color: #ffffff;
        font-size: 1.125rem;
        font-weight: 700;
        font-family: var(--font-display);
      }

      .footer-wordmark {
        letter-spacing: 0.01em;
      }

      .footer-admin-tag {
        font-family: var(--font-body);
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 0.2rem 0.45rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
        color: #eef8f3;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .brand-icon {
        width: 1.125rem;
        height: 1.125rem;
        display: inline-flex;
        color: #b8e6d4;
      }
      .brand-icon svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
      }

      .footer-tagline {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.55;
        color: rgba(216, 235, 227, 0.88);
      }

      .footer-nav {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.5rem;
      }

      .footer-section {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }

      .footer-heading {
        margin: 0;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #ffffff;
      }

      .footer-links {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .footer-link {
        color: rgba(216, 235, 227, 0.82);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: color 0.15s ease;
      }

      .footer-link:hover {
        color: #ffffff;
      }

      .footer-link:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.85);
        outline-offset: 2px;
        border-radius: 4px;
      }

      .footer-meta {
        font-size: 0.8125rem;
        color: rgba(216, 235, 227, 0.65);
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

      .footer-bottom {
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.14);
      }

      .footer-bottom-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem 1.5rem;
        padding: 0.85rem 1.5rem;
      }

      .footer-copy {
        margin: 0;
        font-size: 0.8125rem;
        color: rgba(216, 235, 227, 0.72);
      }

      .footer-legal {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
      }

      .footer-legal-link {
        font-size: 0.8125rem;
        font-weight: 500;
        color: rgba(216, 235, 227, 0.72);
        text-decoration: none;
        transition: color 0.15s ease;
      }

      .footer-legal-link:hover {
        color: #ffffff;
      }

      .footer-legal-link:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.85);
        outline-offset: 2px;
        border-radius: 4px;
      }

      @media (max-width: 900px) {
        .footer-main {
          grid-template-columns: 1fr;
          gap: 1.5rem;
          padding: 1.5rem 1.25rem 1.25rem;
        }
        .footer-brand {
          max-width: none;
        }
      }

      @media (max-width: 640px) {
        .footer-nav {
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        .footer-bottom-inner {
          flex-direction: column;
          align-items: flex-start;
          padding: 1rem 1.25rem;
        }
      }
    `
  ]
})
export class FooterComponent {
  readonly year = new Date().getFullYear();

  constructor(public auth: AuthService) {}
}
