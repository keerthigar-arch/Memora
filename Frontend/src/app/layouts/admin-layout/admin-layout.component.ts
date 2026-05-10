import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="top-bar">
      <div class="container">
        <span class="top-bar-24">24/7</span>
        <a href="tel:+18001234567" class="top-bar-phone">+1 800-123-4567</a>
      </div>
    </div>

    <header class="header admin-header">
      <div class="container header-inner">
        <a routerLink="/admin" class="logo">
          <img src="assets/logo.png" alt="Life Events Logo" class="logo-img"/>
          <span class="brand-text">Life Events <span class="badge">Admin</span></span>
        </a>

        <nav class="nav">
          <a routerLink="/" class="nav-link-external">View public site</a>
          <a routerLink="/admin/create-event" routerLinkActive="active">Create Event</a>
          <a routerLink="/admin/profile" routerLinkActive="active">Profile</a>
          <button type="button" class="nav-btn" (click)="auth.logout()">Logout</button>
        </nav>
      </div>
    </header>

    <main class="main">
      <router-outlet></router-outlet>
    </main>
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
    .admin-header {
      background: #1a3d32;
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .admin-header .logo {
      color: white;
    }
    .admin-header .nav a:not(.nav-link-external) {
      color: rgba(255,255,255,0.85);
    }
    .admin-header .nav a:not(.nav-link-external):hover,
    .admin-header .nav a:not(.nav-link-external).active {
      color: white;
      border-bottom-color: rgba(255,255,255,0.9);
    }
    .nav-link-external {
      font-size: 0.9rem;
      opacity: 0.9;
    }
    .badge {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: rgba(255,255,255,0.2);
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      vertical-align: middle;
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
    }
    .logo {
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      a {
        font-weight: 500;
        padding: 0.5rem 0;
        color: var(--text-muted);
        text-decoration: none;
        &:hover, &.active { color: var(--primary); }
        &.active { font-weight: 600; border-bottom: 2px solid var(--primary); }
      }
      .nav-btn {
        background: rgba(255,255,255,0.15);
        border: 1px solid rgba(255,255,255,0.35);
        border-radius: var(--radius);
        font: inherit;
        font-weight: 500;
        color: white;
        cursor: pointer;
        padding: 0.45rem 0.85rem;
        &:hover { background: rgba(255,255,255,0.25); }
      }
    }
    .main { min-height: calc(100vh - 120px); padding: 2rem 0; }
  `]
})
export class AdminLayoutComponent {
  constructor(public auth: AuthService) {}
}
