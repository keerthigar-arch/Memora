import { Component, ElementRef, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminNotificationDto, NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-wrap">
      <button
        type="button"
        class="notif-trigger"
        (click)="togglePanel($event)"
        [attr.aria-expanded]="open()"
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <svg class="notif-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
          />
        </svg>
        @if (notifications.unreadCount() > 0) {
          <span class="notif-badge">{{ badgeLabel() }}</span>
        }
      </button>

      @if (open()) {
        <div class="notif-panel" role="dialog" aria-label="Notifications">
          <div class="notif-panel-head">
            <h2>Notifications</h2>
            @if (notifications.unreadCount() > 0) {
              <span class="notif-unread-pill">{{ notifications.unreadCount() }} new</span>
            }
          </div>

          @if (loading()) {
            <p class="notif-empty">Loading…</p>
          } @else if (items().length === 0) {
            <p class="notif-empty">No customer event notifications yet.</p>
          } @else {
            <ul class="notif-list">
              @for (n of items(); track n.id) {
                <li>
                  <button
                    type="button"
                    class="notif-item"
                    [class.unread]="!n.isRead"
                    (click)="openNotification(n)"
                  >
                    <span class="notif-item-icon" [class.offline]="n.kind === 'CustomerEventOffline'" aria-hidden="true"></span>
                    <span class="notif-item-body">
                      <span class="notif-item-title">{{ n.title }}</span>
                      <span class="notif-item-meta">
                        {{ n.customerDisplayName }} · {{ n.eventType }}
                        · {{ n.createdAt | date: 'medium' }}
                      </span>
                      <span class="notif-item-kind">Offline payment awaiting approval</span>
                    </span>
                    @if (!n.isRead) {
                      <span class="notif-dot" aria-hidden="true"></span>
                    }
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .notif-wrap {
        position: relative;
      }
      .notif-trigger {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.35rem;
        height: 2.35rem;
        border: 1px solid #d6e4de;
        border-radius: 999px;
        background: #fff;
        color: #35584f;
        cursor: pointer;
        transition: all 160ms ease;
      }
      .notif-trigger:hover,
      .notif-trigger[aria-expanded='true'] {
        color: var(--primary);
        border-color: #c5d8d0;
        background: #f8fcfa;
        box-shadow: 0 4px 12px rgba(13, 61, 50, 0.12);
      }
      .notif-icon {
        width: 1.15rem;
        height: 1.15rem;
        fill: currentColor;
      }
      .notif-badge {
        position: absolute;
        top: -0.2rem;
        right: -0.15rem;
        min-width: 1.1rem;
        height: 1.1rem;
        padding: 0 0.25rem;
        border-radius: 999px;
        background: #dc2626;
        color: #fff;
        font-size: 0.62rem;
        font-weight: 700;
        line-height: 1.1rem;
        text-align: center;
        box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35);
      }
      .notif-panel {
        position: absolute;
        top: calc(100% + 0.55rem);
        right: 0;
        width: min(22rem, calc(100vw - 2rem));
        max-height: 24rem;
        overflow: auto;
        border-radius: 14px;
        border: 1px solid #e3ece8;
        background: #fff;
        box-shadow: 0 16px 40px rgba(8, 38, 30, 0.16);
        z-index: 200;
      }
      .notif-panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #eef3f0;
        position: sticky;
        top: 0;
        background: #fff;
      }
      .notif-panel-head h2 {
        margin: 0;
        font-size: 0.95rem;
        color: #0f2922;
      }
      .notif-unread-pill {
        font-size: 0.72rem;
        font-weight: 700;
        color: #1d4ed8;
        background: rgba(37, 99, 235, 0.1);
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
      }
      .notif-empty {
        margin: 0;
        padding: 1.25rem 1rem;
        color: #6f8079;
        font-size: 0.86rem;
        text-align: center;
      }
      .notif-list {
        list-style: none;
        margin: 0;
        padding: 0.35rem 0;
      }
      .notif-item {
        width: 100%;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.65rem;
        align-items: start;
        padding: 0.75rem 1rem;
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        font: inherit;
        transition: background 140ms ease;
      }
      .notif-item:hover {
        background: #f7faf8;
      }
      .notif-item.unread {
        background: #f3f8ff;
      }
      .notif-item.unread:hover {
        background: #eaf2ff;
      }
      .notif-item-icon {
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 50%;
        margin-top: 0.35rem;
        background: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      }
      .notif-item-icon.offline {
        background: #b45309;
        box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.15);
      }
      .notif-item-body {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .notif-item-title {
        font-weight: 600;
        color: #0f2922;
        font-size: 0.88rem;
        line-height: 1.3;
      }
      .notif-item-meta,
      .notif-item-kind {
        font-size: 0.75rem;
        color: #6f8079;
        line-height: 1.35;
      }
      .notif-item-kind {
        color: #2563eb;
        font-weight: 600;
      }
      .notif-dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: #2563eb;
        margin-top: 0.35rem;
      }
    `
  ]
})
export class AdminNotificationsComponent implements OnInit, OnDestroy {
  open = signal(false);
  loading = signal(false);
  items = signal<AdminNotificationDto[]>([]);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    public notifications: NotificationService,
    private router: Router,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit() {
    this.notifications.loadUnreadCount().subscribe({ error: () => {} });
    this.pollTimer = setInterval(() => {
      this.notifications.loadUnreadCount().subscribe({ error: () => {} });
    }, 60000);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  badgeLabel(): string {
    const n = this.notifications.unreadCount();
    return n > 99 ? '99+' : String(n);
  }

  togglePanel(event: MouseEvent) {
    event.stopPropagation();
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.notifications.loadUnreadCount().subscribe({ error: () => {} });
      this.loadList();
    }
  }

  loadList() {
    this.loading.set(true);
    this.notifications.getNotifications().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      }
    });
  }

  openNotification(n: AdminNotificationDto) {
    const markAndGo = () => {
      this.open.set(false);
      if (n.pendingEventId) {
        this.router.navigate(['/pending-event', n.pendingEventId]);
        return;
      }
      if (n.eventId) {
        this.router.navigate(['/event', n.eventId, 'edit']);
      }
    };

    if (n.isRead) {
      markAndGo();
      return;
    }

    this.notifications.markAsRead(n.id).subscribe({
      next: () => {
        this.items.update((list) =>
          list.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
        markAndGo();
      },
      error: () => markAndGo()
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
