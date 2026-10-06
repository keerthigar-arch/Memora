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
          <a routerLink="/events" class="footer-logo" aria-label="தmileye Admin home">
            <img class="brand-mark" src="assets/brand/smileye-logo.png" alt="" />
            <span class="footer-wordmark">தmileye</span>
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
                <a href="tel:+442079460123" class="footer-link">+44 20 7946 0123</a>
              </li>
              <li><span class="footer-meta">24/7 administrator support</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p class="footer-copy">© {{ year }} தmileye. All rights reserved.</p>
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
        max-width: var(--container-max, 1200px);
        margin: 0 auto;
        padding: 0 var(--container-pad, 1.5rem);
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

      .brand-mark {
        width: 3.15rem;
        height: 3.15rem;
        object-fit: cover;
        border-radius: 8px;
        flex-shrink: 0;
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

      /* Tablet Portrait and below */
      @media (max-width: 991px) {
        .footer-main {
          grid-template-columns: 1fr;
          gap: 1.5rem;
          padding: 1.5rem var(--container-pad, 1.25rem) 1.25rem;
        }
        .footer-brand {
          max-width: none;
        }
        .footer-nav {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      /* Mobile Large and below */
      @media (max-width: 767px) {
        .footer-nav {
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .footer-bottom-inner {
          flex-direction: column;
          align-items: flex-start;
          padding: 1rem var(--container-pad, 1.25rem);
        }
      }

      /* Mobile Small */
      @media (max-width: 480px) {
        .footer-nav {
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        .footer-main {
          padding: 1.25rem var(--container-pad, 0.75rem) 1rem;
        }
      }
    `
  ]
})
export class FooterComponent {
  readonly year = new Date().getFullYear();

  constructor(public auth: AuthService) {}
}
