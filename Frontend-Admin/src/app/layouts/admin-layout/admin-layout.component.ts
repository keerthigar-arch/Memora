import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FooterComponent } from '../../components/footer/footer.component';
import { AdminNotificationsComponent } from '../../components/admin-notifications/admin-notifications.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FooterComponent, AdminNotificationsComponent],
  template: `
    <div class="admin-app-shell">
      <div class="top-bar">
        <div class="container top-bar-inner">
          <span class="top-bar-24">24/7 Support</span>
          <a href="tel:+18001234567" class="top-bar-phone">+1 800-123-4567</a>
        </div>
      </div>

      <header class="header">
        <div class="container header-inner">
          <a routerLink="/events" class="logo" aria-label="Memora Admin home">
            <span class="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 11.2c-2-4.5-5.9-6.1-9.2-5 0 3.8 2.5 7.3 6.8 7.8 1 .1 1.8-.1 2.4-.5Z" />
                <path d="M12 11.2c2-4.5 5.9-6.1 9.2-5 0 3.8-2.5 7.3-6.8 7.8-1 .1-1.8-.1-2.4-.5Z" />
                <path d="M12 11.9c-1.8 3.7-4.9 5-7.4 4.3 0 2.9 2 5.5 5.2 5.8 1 .1 1.8-.2 2.2-.7Z" />
                <path d="M12 11.9c1.8 3.7 4.9 5 7.4 4.3 0 2.9-2 5.5-5.2 5.8-1 .1-1.8-.2-2.2-.7Z" />
              </svg>
            </span>
            <span class="wordmark">Memora</span>
            <span class="admin-pill">Admin</span>
          </a>

          <nav class="header-nav" aria-label="Admin primary navigation">
            <a
              class="header-nav-link"
              routerLink="/events"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="closeMobileNav()"
            >
              Event Management
            </a>
            <a
              class="header-nav-link"
              routerLink="/users"
              routerLinkActive="is-active"
              (click)="closeMobileNav()"
            >
              User Management
            </a>
            <a
              class="header-nav-link"
              routerLink="/payments"
              routerLinkActive="is-active"
              (click)="closeMobileNav()"
            >
              Payments
            </a>
          </nav>

          <div class="header-actions">
            <a
              class="btn-create"
              routerLink="/create-event"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="closeMobileNav()"
            >
              <svg class="btn-create-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              Create Event
            </a>

            <div class="header-user-actions">
              <app-admin-notifications />

              <div class="profile-menu" #profileMenuRoot>
                <button
                  type="button"
                  class="profile-trigger"
                  (click)="toggleProfileMenu($event)"
                  [attr.aria-expanded]="profileMenuOpen()"
                  aria-haspopup="menu"
                  [attr.aria-label]="'Account menu for ' + (userDisplayName() || 'admin')"
                >
                  <span class="profile-avatar" [class.has-photo]="!!profileImageUrl()">
                    @if (profileImageUrl()) {
                      <img [src]="profileImageUrl()!" alt="" />
                    } @else {
                      <span class="profile-initials">{{ userInitials() }}</span>
                    }
                  </span>
                  <svg class="profile-chevron" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>

                @if (profileMenuOpen()) {
                  <div class="profile-dropdown" role="menu" aria-label="Account menu">
                    <div class="profile-dropdown-header">
                      <span class="profile-dropdown-name">{{ userDisplayName() }}</span>
                      <span class="profile-dropdown-email">{{ userEmail() }}</span>
                    </div>
                    <ul class="profile-dropdown-list">
                      <li>
                        <a
                          class="profile-dropdown-item"
                          role="menuitem"
                          routerLink="/profile"
                          (click)="closeProfileMenu()"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="1.75"
                            />
                          </svg>
                          My Account
                        </a>
                      </li>
                      <li class="profile-dropdown-divider" role="separator"></li>
                      <li>
                        <button
                          type="button"
                          class="profile-dropdown-item profile-dropdown-item--danger"
                          role="menuitem"
                          (click)="logout()"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="1.75"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                }
              </div>
            </div>

            <button
              type="button"
              class="mobile-menu-btn"
              (click)="toggleMobileNav($event)"
              [attr.aria-expanded]="mobileNavOpen()"
              aria-controls="admin-mobile-nav"
              aria-label="Toggle navigation menu"
            >
              @if (mobileNavOpen()) {
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              }
            </button>
          </div>
        </div>

        @if (mobileNavOpen()) {
          <div class="mobile-nav-backdrop" (click)="closeMobileNav()" aria-hidden="true"></div>
          <nav id="admin-mobile-nav" class="mobile-nav-panel" aria-label="Mobile navigation">
            <a
              class="mobile-nav-link"
              routerLink="/events"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="closeMobileNav()"
            >
              Event Management
            </a>
            <a
              class="mobile-nav-link"
              routerLink="/users"
              routerLinkActive="is-active"
              (click)="closeMobileNav()"
            >
              User Management
            </a>
            <a
              class="mobile-nav-link"
              routerLink="/payments"
              routerLinkActive="is-active"
              (click)="closeMobileNav()"
            >
              Payments
            </a>
            <a
              class="mobile-nav-link mobile-nav-link--cta"
              routerLink="/create-event"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="closeMobileNav()"
            >
              Create Event
            </a>
          </nav>
        }
      </header>

      <main class="main">
        <router-outlet></router-outlet>
      </main>

      <app-footer />
    </div>
  `,
  styles: [
    `
      :host {
        --space-1: 8px;
        --space-2: 16px;
        --space-3: 24px;
        --header-h: 64px;
        --radius-sm: 8px;
        --radius-md: 10px;
        --radius-lg: 12px;
        --header-border: rgba(13, 61, 50, 0.08);
        --header-shadow: 0 1px 2px rgba(13, 61, 50, 0.04), 0 8px 24px rgba(13, 61, 50, 0.06);
        --nav-text: #4a635c;
        --nav-text-hover: #0d3d32;
        --surface-muted: #f4f8f6;
      }

      .admin-app-shell {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .top-bar {
        background: #f7faf8;
        color: #456b61;
        border-bottom: 1px solid #e8efeb;
        font-size: 0.8125rem;
      }
      .top-bar-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: 6px var(--space-2);
      }
      .top-bar-24 {
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .top-bar-phone {
        color: #2f5d51;
        text-decoration: none;
        font-weight: 600;
        transition: color 0.15s ease;
      }
      .top-bar-phone:hover {
        color: var(--primary);
      }
      .top-bar-phone:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }

      .header {
        position: sticky;
        top: 0;
        z-index: 200;
        background: #ffffff;
        border-bottom: 1px solid var(--header-border);
        box-shadow: var(--header-shadow);
      }

      .header-inner {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--space-2);
        min-height: var(--header-h);
        padding: var(--space-1) var(--space-2);
      }

      .logo {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: var(--primary-dark);
        border-radius: var(--radius-lg);
        padding: 6px 8px;
        margin-left: -8px;
        transition: background-color 0.15s ease;
      }
      .logo:hover {
        background: var(--surface-muted);
      }
      .logo:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      .brand-icon {
        width: 28px;
        height: 28px;
        display: inline-flex;
        color: #1f6a53;
        flex-shrink: 0;
      }
      .brand-icon svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
      }
      .wordmark {
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        line-height: 1;
        color: var(--primary-dark);
      }
      .admin-pill {
        font-family: var(--font-body);
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        padding: 4px 8px;
        border-radius: 999px;
        background: var(--surface-muted);
        color: #2f5d51;
        border: 1px solid #dce8e3;
      }

      .header-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
      .header-nav-link {
        position: relative;
        display: inline-flex;
        align-items: center;
        height: 40px;
        padding: 0 12px;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nav-text);
        text-decoration: none;
        white-space: nowrap;
        transition:
          color 0.15s ease,
          background-color 0.15s ease;
      }
      .header-nav-link:hover {
        color: var(--nav-text-hover);
        background: var(--surface-muted);
      }
      .header-nav-link:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      .header-nav-link.is-active {
        color: var(--primary-dark);
        font-weight: 600;
        background: rgba(26, 95, 74, 0.08);
      }
      .header-nav-link.is-active::after {
        content: '';
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 6px;
        height: 2px;
        border-radius: 2px;
        background: var(--primary);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        justify-content: flex-end;
      }

      .btn-create {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 40px;
        padding: 0 16px;
        border-radius: var(--radius-md);
        background: var(--primary);
        color: #fff;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
        border: 1px solid transparent;
        box-shadow: 0 1px 2px rgba(13, 61, 50, 0.12), 0 4px 12px rgba(26, 95, 74, 0.2);
        transition:
          background-color 0.15s ease,
          box-shadow 0.15s ease,
          transform 0.15s ease;
      }
      .btn-create:hover {
        background: var(--primary-dark);
        box-shadow: 0 2px 6px rgba(13, 61, 50, 0.16), 0 8px 20px rgba(26, 95, 74, 0.24);
      }
      .btn-create:active {
        transform: translateY(1px);
      }
      .btn-create:focus-visible {
        outline: 2px solid var(--primary-dark);
        outline-offset: 2px;
      }
      .btn-create.is-active {
        background: var(--primary-dark);
      }
      .btn-create-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .header-user-actions {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 4px;
        padding-left: 8px;
        border-left: 1px solid var(--header-border);
      }

      .profile-menu {
        position: relative;
      }
      .profile-trigger {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 40px;
        padding: 4px 8px 4px 4px;
        border: 1px solid transparent;
        border-radius: var(--radius-lg);
        background: transparent;
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          border-color 0.15s ease;
      }
      .profile-trigger:hover,
      .profile-trigger[aria-expanded='true'] {
        background: var(--surface-muted);
        border-color: #dce8e3;
      }
      .profile-trigger:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      .profile-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: linear-gradient(145deg, #e8f3ee 0%, #d4e8df 100%);
        border: 1.5px solid rgba(26, 95, 74, 0.18);
        overflow: hidden;
      }
      .profile-avatar.has-photo {
        background: #fff;
      }
      .profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .profile-initials {
        font-family: var(--font-body);
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: var(--primary);
        line-height: 1;
      }
      .profile-chevron {
        width: 16px;
        height: 16px;
        color: #6b857c;
        flex-shrink: 0;
        transition: transform 0.15s ease;
      }
      .profile-trigger[aria-expanded='true'] .profile-chevron {
        transform: rotate(180deg);
      }

      .profile-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 240px;
        border-radius: var(--radius-lg);
        border: 1px solid var(--header-border);
        background: #fff;
        box-shadow: 0 4px 6px rgba(13, 61, 50, 0.04), 0 16px 40px rgba(13, 61, 50, 0.12);
        z-index: 300;
        overflow: hidden;
        animation: dropdownIn 0.15s ease;
      }
      @keyframes dropdownIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .profile-dropdown-header {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 12px 16px;
        border-bottom: 1px solid #eef3f0;
        background: #fafcfb;
      }
      .profile-dropdown-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--primary-dark);
        line-height: 1.3;
      }
      .profile-dropdown-email {
        font-size: 0.75rem;
        color: #6b857c;
        word-break: break-word;
      }
      .profile-dropdown-list {
        list-style: none;
        margin: 0;
        padding: 8px;
      }
      .profile-dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        border-radius: var(--radius-md);
        background: transparent;
        color: #2f4a42;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        text-align: left;
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          color 0.15s ease;
      }
      .profile-dropdown-item svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        color: #6b857c;
      }
      .profile-dropdown-item:hover,
      .profile-dropdown-item:focus-visible {
        background: var(--surface-muted);
        color: var(--primary-dark);
        outline: none;
      }
      .profile-dropdown-item:hover svg,
      .profile-dropdown-item:focus-visible svg {
        color: var(--primary);
      }
      .profile-dropdown-item--danger {
        color: #b42318;
      }
      .profile-dropdown-item--danger svg {
        color: #d92d20;
      }
      .profile-dropdown-item--danger:hover,
      .profile-dropdown-item--danger:focus-visible {
        background: #fef3f2;
        color: #912018;
      }
      .profile-dropdown-divider {
        height: 1px;
        margin: 4px 8px;
        background: #eef3f0;
      }

      .mobile-menu-btn {
        display: none;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        padding: 0;
        border: 1px solid var(--header-border);
        border-radius: var(--radius-md);
        background: #fff;
        color: var(--primary-dark);
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          border-color 0.15s ease;
      }
      .mobile-menu-btn:hover {
        background: var(--surface-muted);
        border-color: #dce8e3;
      }
      .mobile-menu-btn:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      .mobile-menu-btn svg {
        width: 20px;
        height: 20px;
      }

      .mobile-nav-backdrop {
        position: fixed;
        inset: 0;
        top: calc(var(--header-h) + 33px);
        background: rgba(13, 61, 50, 0.24);
        z-index: 150;
      }
      .mobile-nav-panel {
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        z-index: 160;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 16px 16px;
        background: #fff;
        border-bottom: 1px solid var(--header-border);
        box-shadow: 0 16px 32px rgba(13, 61, 50, 0.1);
      }
      .mobile-nav-link {
        display: flex;
        align-items: center;
        min-height: 44px;
        padding: 0 12px;
        border-radius: var(--radius-md);
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--nav-text);
        text-decoration: none;
        transition:
          background-color 0.15s ease,
          color 0.15s ease;
      }
      .mobile-nav-link:hover {
        background: var(--surface-muted);
        color: var(--nav-text-hover);
      }
      .mobile-nav-link.is-active {
        color: var(--primary-dark);
        font-weight: 600;
        background: rgba(26, 95, 74, 0.08);
        box-shadow: inset 3px 0 0 var(--primary);
      }
      .mobile-nav-link--cta {
        margin-top: 8px;
        justify-content: center;
        background: var(--primary);
        color: #fff;
        font-weight: 600;
      }
      .mobile-nav-link--cta:hover {
        background: var(--primary-dark);
        color: #fff;
      }
      .mobile-nav-link--cta.is-active {
        background: var(--primary-dark);
        box-shadow: none;
      }

      .main {
        flex: 1;
        min-height: calc(100vh - 200px);
        padding: 8px 0 24px;
      }

      @media (max-width: 1080px) {
        .header-inner {
          grid-template-columns: auto 1fr auto;
        }
        .header-nav {
          display: none;
        }
        .btn-create {
          display: none;
        }
        .mobile-menu-btn {
          display: inline-flex;
        }
      }

      @media (max-width: 640px) {
        .header-inner {
          padding: 8px 12px;
        }
        .wordmark {
          font-size: 1.3125rem;
        }
        .brand-icon {
          width: 24px;
          height: 24px;
        }
        .admin-pill {
          display: none;
        }
        .profile-chevron {
          display: none;
        }
        .profile-trigger {
          padding: 4px;
        }
        .header-user-actions {
          margin-left: 0;
          padding-left: 0;
          border-left: none;
        }
        .top-bar-inner {
          flex-direction: column;
          gap: 2px;
          padding: 6px 12px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .profile-dropdown {
          animation: none;
        }
        .btn-create:active {
          transform: none;
        }
      }
    `
  ]
})
export class AdminLayoutComponent implements OnInit {
  profileMenuOpen = signal(false);
  mobileNavOpen = signal(false);

  profileImageUrl = computed(() => this.auth.currentUser()?.profileImageUrl ?? null);
  userDisplayName = computed(() => this.auth.currentUser()?.displayName?.trim() || 'Admin');
  userEmail = computed(() => this.auth.currentUser()?.email || '');

  constructor(
    public auth: AuthService,
    private notifications: NotificationService,
    private host: ElementRef<HTMLElement>
  ) {}

  userInitials(): string {
    const name = this.auth.currentUser()?.displayName?.trim();
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0] ?? '';
      const b = parts[parts.length - 1][0] ?? '';
      return (a + b).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  ngOnInit() {
    this.auth.refreshProfile().subscribe({ error: () => {} });
    this.notifications.loadUnreadCount().subscribe({ error: () => {} });
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    const next = !this.profileMenuOpen();
    this.profileMenuOpen.set(next);
    if (next) {
      this.mobileNavOpen.set(false);
    }
  }

  closeProfileMenu() {
    this.profileMenuOpen.set(false);
  }

  toggleMobileNav(event?: MouseEvent) {
    event?.stopPropagation();
    const next = !this.mobileNavOpen();
    this.mobileNavOpen.set(next);
    if (next) {
      this.profileMenuOpen.set(false);
    }
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
  }

  logout() {
    this.closeProfileMenu();
    this.closeMobileNav();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.profileMenuOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeProfileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeProfileMenu();
    this.closeMobileNav();
  }
}
