import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../components/footer/footer.component';
import { EventStatsService } from '../../services/event-stats.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FooterComponent
  ],
  template: `
    <div class="top-bar">
      <div class="container">
        <span class="top-bar-24">24/7</span>
        <a href="tel:+18001234567" class="top-bar-phone">+1 800-123-4567</a>
      </div>
    </div>

    <header class="header">
      <div class="container header-inner">
        <a routerLink="/" class="logo">
          <img src="assets/logo.png" alt="Life Events Logo" class="logo-img"/>
          Life Events Memory Keeper
        </a>

        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Feed</a>
          <a routerLink="/contact" routerLinkActive="active">Contact Us</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Admin portal</a>
          }
          @if (auth.isLoggedIn()) {
            <button type="button" class="nav-btn" (click)="auth.logout()">Logout</button>
          } @else {
            <a routerLink="/login" routerLinkActive="active">Login</a>
            <a routerLink="/register" routerLinkActive="active">Register</a>
          }
        </nav>
      </div>
    </header>

    <section class="country-summary-bar">
      <div class="container">
        @if (!stats.countryStatsLoaded()) {
          <span class="summary-placeholder">Loading...</span>
        } @else if (stats.countrySummary().length > 0) {
          <div class="summary-chips">
            @for (item of stats.countrySummary(); track item.country) {
              <span class="summary-chip">
                <strong>{{ item.country }}</strong>
                <span>{{ item.count }} events</span>
              </span>
            }
          </div>
        }
      </div>
    </section>

    <main class="main">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    .top-bar {
      background: var(--primary-dark);
      color: rgba(255,255,255,0.9);
      padding: 0.4rem 1.5rem;
      font-size: 0.875rem;
    }
    .logo-img {
      width: 120px;
      height: 50px;
      object-fit: contain;
      vertical-align: middle;
      margin-right: 8px;
    }
    .top-bar .container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }
    .top-bar-24 {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
    }
    .top-bar-24::before { content: "🕐 "; }
    .top-bar-phone {
      color: white;
      text-decoration: none;
      font-weight: 500;
    }
    .top-bar-phone:hover { text-decoration: underline; }
    .header {
      background: white;
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
    }
    .logo {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      a {
        font-weight: 500;
        padding: 0.5rem 0;
        color: var(--text-muted);
        text-decoration: none;
        &:hover, &.active { color: var(--primary); }
        &.active { font-weight: 600; border-bottom: 2px solid var(--primary); }
      }
      .nav-btn {
        background: none;
        border: none;
        font: inherit;
        font-weight: 500;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.5rem 0;
        &:hover { color: var(--primary); }
      }
    }
    .country-summary-bar {
      background: var(--primary);
      color: white;
      padding: 0.75rem 1.5rem;
      box-shadow: var(--shadow);
    }
    .country-summary-bar .container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .summary-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .summary-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      background: rgba(255,255,255,0.2);
      border-radius: 999px;
      font-size: 0.9rem;
    }
    .summary-chip strong { color: white; }
    .main { min-height: calc(100vh - 160px); padding: 2rem 0; }
  `]
})
export class CustomerLayoutComponent {
  constructor(public stats: EventStatsService, public auth: AuthService) {}
}
