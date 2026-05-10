import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FooterComponent],
  template: `
    <div class="admin-app-shell">
      <div class="top-bar">
        <div class="container">
          <span class="top-bar-24">24/7</span>
          <a href="tel:+18001234567" class="top-bar-phone">+1 800-123-4567</a>
        </div>
      </div>

      <header class="header">
        <div class="container header-inner">
          <a routerLink="/events" class="logo" aria-label="Memora Admin">
            <span class="logo-glow" aria-hidden="true"></span>
            <span class="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 11.2c-2-4.5-5.9-6.1-9.2-5 0 3.8 2.5 7.3 6.8 7.8 1 .1 1.8-.1 2.4-.5Z" />
                <path d="M12 11.2c2-4.5 5.9-6.1 9.2-5 0 3.8-2.5 7.3-6.8 7.8-1 .1-1.8-.1-2.4-.5Z" />
                <path d="M12 11.9c-1.8 3.7-4.9 5-7.4 4.3 0 2.9 2 5.5 5.2 5.8 1 .1 1.8-.2 2.2-.7Z" />
                <path d="M12 11.9c1.8 3.7 4.9 5 7.4 4.3 0 2.9-2 5.5-5.2 5.8-1 .1-1.8-.2-2.2-.7Z" />
              </svg>
            </span>
            <span class="wordmark">
              <span class="wordmark-text">Memora</span>
              <span class="wordmark-shine" aria-hidden="true"></span>
            </span>
            <span class="admin-pill">Admin</span>
          </a>

          <nav class="nav" aria-label="Admin primary">
            <a class="nav-link" routerLink="/events" routerLinkActive="active">Event management</a>
            <a class="nav-link" routerLink="/users" routerLinkActive="active">User management</a>
            <a class="nav-link" routerLink="/payments" routerLinkActive="active">Payments</a>
            <a class="nav-link" routerLink="/create-event" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }"
              >Create event</a
            >
            <a class="nav-link" routerLink="/profile" routerLinkActive="active">My account</a>
            <button type="button" class="nav-btn nav-btn-ghost" (click)="auth.logout()">Logout</button>
          </nav>
        </div>
      </header>

      <main class="main">
        <router-outlet></router-outlet>
      </main>

      <app-footer />
    </div>
  `,
  styles: [
    `
      .admin-app-shell {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .top-bar {
        background: #f7faf8;
        color: #456b61;
        padding: 0.35rem 1.5rem;
        font-size: 0.8rem;
        border-bottom: 1px solid #e3ece8;
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
      .top-bar-24::before {
        content: '🕐 ';
      }
      .top-bar-phone {
        color: #2f5d51;
        text-decoration: none;
        font-weight: 600;
      }
      .top-bar-phone:hover {
        text-decoration: underline;
      }
      .header {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid rgba(13, 61, 50, 0.08);
        box-shadow: 0 8px 26px rgba(8, 38, 30, 0.08);
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .header-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1.5rem;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .logo {
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary);
        display: flex;
        align-items: center;
        text-decoration: none;
        position: relative;
        isolation: isolate;
        padding: 0.15rem 0.35rem 0.2rem 0.2rem;
        margin: -0.15rem -0.35rem -0.2rem -0.2rem;
        border-radius: 12px;
        transition: transform 0.35s ease;
      }
      .logo:hover {
        transform: translateY(-1px);
      }
      .logo:focus-visible {
        outline: 2px solid #1a5f4a;
        outline-offset: 3px;
      }
      .logo-glow {
        position: absolute;
        inset: 0;
        border-radius: 12px;
        background:
          radial-gradient(ellipse 85% 120% at 20% 40%, rgba(63, 144, 119, 0.22) 0%, transparent 55%),
          radial-gradient(ellipse 70% 100% at 85% 60%, rgba(13, 61, 50, 0.12) 0%, transparent 50%);
        opacity: 0.85;
        z-index: -1;
        animation: logoGlowPulse 5s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes logoGlowPulse {
        0%,
        100% {
          opacity: 0.65;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.02);
        }
      }
      .wordmark {
        position: relative;
        display: inline-block;
        font-size: 1.65rem;
        letter-spacing: 0.02em;
        font-weight: 700;
        line-height: 1;
        overflow: visible;
      }
      .wordmark-text {
        display: inline-block;
        background: linear-gradient(115deg, #0d3d32 0%, #1a5f4a 22%, #4aaf8c 42%, #1a5f4a 58%, #2c8f72 72%, #0d3d32 100%);
        background-size: 240% auto;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: wordmarkShimmer 6s ease-in-out infinite;
      }
      @keyframes wordmarkShimmer {
        0%,
        100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }
      .wordmark-shine {
        position: absolute;
        left: -15%;
        top: 0;
        bottom: 0;
        width: 38%;
        background: linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.55) 45%, transparent 90%);
        transform: skewX(-18deg) translateX(-120%);
        animation: wordmarkSweep 4.5s ease-in-out infinite;
        pointer-events: none;
        mix-blend-mode: soft-light;
        border-radius: 4px;
      }
      @keyframes wordmarkSweep {
        0%,
        12% {
          transform: skewX(-18deg) translateX(-130%);
          opacity: 0;
        }
        18% {
          opacity: 0.9;
        }
        35%,
        100% {
          transform: skewX(-18deg) translateX(220%);
          opacity: 0;
        }
      }
      .brand-icon {
        width: 1.35rem;
        height: 1.35rem;
        display: inline-flex;
        color: #2e7f67;
        margin-right: 0.42rem;
        transform: translateY(-1px);
        animation: brandLeafFloat 5s ease-in-out infinite;
      }
      @keyframes brandLeafFloat {
        0%,
        100% {
          transform: translateY(-1px) rotate(0deg) scale(1);
        }
        25% {
          transform: translateY(-3px) rotate(-4deg) scale(1.04);
        }
        75% {
          transform: translateY(0) rotate(3deg) scale(1.02);
        }
      }
      .brand-icon svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
        filter: drop-shadow(0 2px 4px rgba(26, 95, 74, 0.28));
        animation: brandLeafGlow 3.5s ease-in-out infinite;
      }
      @keyframes brandLeafGlow {
        0%,
        100% {
          filter: drop-shadow(0 2px 4px rgba(26, 95, 74, 0.28));
        }
        50% {
          filter: drop-shadow(0 2px 8px rgba(63, 144, 119, 0.55)) drop-shadow(0 0 10px rgba(63, 144, 119, 0.25));
        }
      }
      .admin-pill {
        margin-left: 0.45rem;
        align-self: center;
        font-family: var(--font-body);
        font-size: 0.62rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 0.25rem 0.5rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(13, 61, 50, 0.2);
      }
      @media (prefers-reduced-motion: reduce) {
        .logo {
          transition: none;
        }
        .logo:hover {
          transform: none;
        }
        .logo-glow,
        .wordmark-text,
        .wordmark-shine,
        .brand-icon,
        .brand-icon svg {
          animation: none !important;
        }
        .logo-glow {
          opacity: 0.5;
          transform: none;
        }
        .wordmark-text {
          background: linear-gradient(120deg, #0d3d32 0%, #1a5f4a 55%, #3f9077 100%);
          background-size: 100% auto;
        }
        .wordmark-shine {
          display: none;
        }
      }
      .nav {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.35rem;
        border-radius: 999px;
        background: #f3f7f5;
        border: 1px solid #e3ece8;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .nav .nav-link {
        font-weight: 600;
        padding: 0.48rem 0.85rem;
        color: #55726a;
        text-decoration: none;
        border-radius: 999px;
        transition: all 160ms ease;
        font-size: 0.88rem;
      }
      .nav .nav-link:hover {
        color: var(--primary);
        background: #ffffff;
      }
      .nav .nav-link.active {
        color: #fff;
        background: linear-gradient(135deg, #1a5f4a 0%, #2f7e66 100%);
        box-shadow: 0 4px 12px rgba(26, 95, 74, 0.3);
      }
      .nav .nav-btn {
        border: 1px solid transparent;
        border-radius: 999px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        padding: 0.5rem 0.95rem;
        transition: all 160ms ease;
        font-size: 0.88rem;
      }
      .nav .nav-btn-ghost {
        color: #35584f;
        border-color: #d6e4de;
        background: #fff;
      }
      .nav .nav-btn-ghost:hover {
        color: var(--primary);
        border-color: #c5d8d0;
        background: #f8fcfa;
      }
      .main {
        flex: 1;
        min-height: calc(100vh - 200px);
        padding: 0.55rem 0 1.6rem;
      }
      @media (max-width: 960px) {
        .header-inner {
          flex-direction: column;
          align-items: flex-start;
        }
        .nav {
          width: 100%;
          justify-content: flex-start;
          border-radius: 16px;
        }
      }
    `
  ]
})
export class AdminLayoutComponent {
  constructor(public auth: AuthService) {}
}
