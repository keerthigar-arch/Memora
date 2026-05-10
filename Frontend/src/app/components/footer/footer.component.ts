import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <footer class="footer">
      <div class="container footer-grid">

        <!-- Brand Section -->
        <div class="footer-brand">
          <a routerLink="/" class="footer-logo">
            <img src="assets/logo.png" alt="Life Events Hub Logo" class="footer-logo-img" />
            Life Events Hub
          </a>
          <p class="footer-tagline">Share moments that matter.</p>

          <!-- Social Media Links -->
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

        <!-- Navigation Links -->
        <div class="footer-section">
          <h4 class="footer-heading">Navigation</h4>
          <ul class="footer-links">
            <li><a routerLink="/" class="footer-link">Home</a></li>
            <li><a routerLink="/feed" class="footer-link">Feed</a></li>
            <li><a routerLink="/create-event" class="footer-link">Create Event</a></li>
            <li><a routerLink="/profile" class="footer-link">Profile</a></li>
            <li><a routerLink="/login" class="footer-link">Login</a></li>
            <li><a routerLink="/register" class="footer-link">Register</a></li>
          </ul>
        </div>

        <!-- Quick Links -->
        <div class="footer-section">
          <h4 class="footer-heading">Quick Links</h4>
          <ul class="footer-links">
            <li><a routerLink="/contact" class="footer-link">Contact Us</a></li>
            <li><a routerLink="/payment" class="footer-link">Payment</a></li>
            <li><a href="#" class="footer-link">Privacy Policy</a></li>
            <li><a href="#" class="footer-link">Terms of Service</a></li>
            <li><a href="#" class="footer-link">Help & Support</a></li>
            <li><a href="#" class="footer-link">About Us</a></li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div class="footer-section">
          <h4 class="footer-heading">Contact Us</h4>
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

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p>© {{ year }} Life Events Hub. All rights reserved.</p>
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
      padding-top: 50px;
      margin-top: auto;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr;
      gap: 40px;
      padding-bottom: 40px;
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 700;
    }

    .footer-logo-img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }

    .footer-tagline {
      font-size: 0.9rem;
      color: #9ecfb8;
      margin: 0;
    }

    .social-links {
      display: flex;
      gap: 10px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      text-decoration: none;
      transition: background-color 0.2s ease, transform 0.2s ease;
    }

    .social-btn:hover {
      background-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }

    .footer-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-heading {
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 4px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-link {
      color: #9ecfb8;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: #ffffff;
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .contact-item svg {
      margin-top: 2px;
      flex-shrink: 0;
      color: #5cbf94;
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding: 16px 0;
      margin-top: 10px;
    }

    .footer-bottom-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .footer-bottom-inner p {
      margin: 0;
      font-size: 0.85rem;
      color: #9ecfb8;
    }

    .footer-bottom-links {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
    }

    .divider {
      color: rgba(255, 255, 255, 0.3);
    }

    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 30px;
      }
    }

    @media (max-width: 550px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .footer-bottom-inner {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent implements OnInit {
  year: number = new Date().getFullYear();

  ngOnInit(): void {
    this.year = new Date().getFullYear();
  }
}