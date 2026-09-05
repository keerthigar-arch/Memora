import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService, CustomerAdminListDto } from '../../services/api.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div class="container">
        <h1>User management</h1>
        <p class="page-lead">
          View and manage customer accounts registered on the public Memora site, including display name, email, and profile settings.
        </p>
      </div>
    </section>

    <section class="container panel-wrap">
      <div class="filters-card">
        <div class="filters-row">
          <label class="fld fld-grow">
            <span class="lbl">Search</span>
            <input
              type="search"
              class="inp"
              placeholder="Email or display name…"
              [(ngModel)]="filterSearch"
              name="filterSearch"
              (keydown.enter)="applySearch()"
            />
          </label>
          <div class="filters-actions-inline">
            <button type="button" class="btn btn-primary" (click)="applySearch()">Search</button>
            <button type="button" class="btn btn-ghost" (click)="resetSearch()">Reset</button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div><p>Loading…</p></div>
      } @else if (error()) {
        <div class="banner err">{{ error() }}</div>
      } @else if (rows().length === 0) {
        <div class="empty">
          <p class="empty-title">No customers found</p>
          <p class="muted empty-sub">Try another search, or no one has registered yet.</p>
        </div>
      } @else {
        <div class="table-shell">
          <table class="user-table">
            <thead>
              <tr>
                <th class="th-avatar"></th>
                <th>Display name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th scope="col" class="col-events">Events</th>
                <th class="th-date">Registered</th>
              </tr>
            </thead>
            <tbody>
              @for (u of rows(); track u.id) {
                <tr>
                  <td class="td-avatar">
                    @if (u.profileImageUrl) {
                      <span class="avatar" aria-hidden="true">
                        <img [src]="u.profileImageUrl" alt="" />
                      </span>
                    } @else {
                      <span class="avatar-ph" aria-hidden="true">{{ initials(u.displayName) }}</span>
                    }
                  </td>
                  <td class="name-cell">{{ u.displayName }}</td>
                  <td class="email-cell">{{ u.email }}</td>
                  <td class="email-cell">{{ u.mobileNumber || '—' }}</td>
                  <td class="col-events">{{ u.eventCount }}</td>
                  <td class="date-cell">{{ u.createdAt | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pager-bar">
          <span class="muted pager-summary">Showing {{ rangeLabel() }} of {{ total() }}</span>
          <div class="pager-btns">
            <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="goPage(page() - 1)">Previous</button>
            <span class="pager-page">Page {{ page() }} / {{ totalPages() }}</span>
            <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="goPage(page() + 1)">
              Next
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page-head {
        padding: 1.25rem 0 0.25rem;
      }
      .page-head h1 {
        margin: 0 0 0.35rem;
        font-size: clamp(1.35rem, 2.8vw, 1.75rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--primary-dark);
      }
      .page-lead {
        margin: 0;
        max-width: 52rem;
        font-size: 0.9rem;
        line-height: 1.5;
        color: var(--text-muted);
      }
      .panel-wrap {
        padding-bottom: 2.5rem;
      }
      .filters-card {
        margin-bottom: 1.25rem;
        padding: 1.1rem 1.25rem;
        background: linear-gradient(145deg, var(--bg-card) 0%, rgba(26, 95, 74, 0.04) 100%);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: var(--shadow);
      }
      .filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        align-items: flex-end;
      }
      .fld {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin: 0;
      }
      .fld-grow {
        flex: 1;
        min-width: 200px;
      }
      .lbl {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
      }
      .inp {
        width: 100%;
        padding: 0.5rem 0.65rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.875rem;
        background: var(--bg-card);
        color: inherit;
      }
      .inp:focus {
        outline: 2px solid rgba(26, 95, 74, 0.35);
        outline-offset: 1px;
      }
      .filters-actions-inline {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .btn {
        border-radius: 8px;
        padding: 0.45rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .btn-primary {
        background: var(--primary);
        color: #fff;
        border-color: var(--primary);
      }
      .btn-primary:hover {
        filter: brightness(1.05);
      }
      .btn-ghost {
        background: transparent;
        border-color: var(--border);
        color: var(--text-muted);
      }
      .btn-ghost:hover:not(:disabled) {
        border-color: var(--primary);
        color: var(--primary-dark);
      }
      .btn-sm {
        padding: 0.35rem 0.75rem;
        font-size: 0.8125rem;
      }
      .btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .banner.err {
        padding: 0.85rem 1rem;
        border-radius: 10px;
        background: rgba(180, 35, 24, 0.08);
        border: 1px solid rgba(180, 35, 24, 0.22);
        color: #7a2714;
      }
      .loading {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 2.5rem;
        justify-content: center;
        color: var(--text-muted);
      }
      .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty {
        padding: 2.5rem 1.5rem;
        text-align: center;
        background: var(--bg-card);
        border-radius: 12px;
        border: 1px dashed var(--border);
      }
      .empty-title {
        margin: 0;
        font-weight: 700;
        font-size: 1.05rem;
      }
      .empty-sub {
        margin: 0.35rem 0 0;
        font-size: 0.9rem;
      }
      .muted {
        color: var(--text-muted);
      }
      .table-shell {
        overflow-x: auto;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        box-shadow: 0 8px 28px rgba(15, 42, 34, 0.06);
      }
      .user-table {
        width: 100%;
        table-layout: auto;
        border-collapse: collapse;
        font-size: 0.875rem;
        min-width: 0;
      }
      .user-table thead {
        background: linear-gradient(180deg, rgba(26, 95, 74, 0.12), rgba(26, 95, 74, 0.05));
      }
      .user-table th {
        padding: 0.85rem 1rem;
        text-align: center;
        font-weight: 700;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--primary-dark);
        border-bottom: 2px solid rgba(26, 95, 74, 0.15);
      }
      .th-avatar {
        width: 3.25rem;
      }
      .user-table th.col-events,
      .user-table td.col-events {
        width: 5.5rem;
        text-align: center;
        vertical-align: middle;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        padding-left: 0.75rem;
        padding-right: 0.75rem;
        box-sizing: border-box;
      }
      .user-table thead th.col-events {
        font-weight: 700;
      }
      .th-date {
        white-space: nowrap;
      }
      .user-table td {
        padding: 0.75rem 1rem;
        vertical-align: middle;
        text-align: center;
        border-bottom: 1px solid var(--border);
      }
      .user-table tbody tr:nth-child(even) {
        background: rgba(26, 95, 74, 0.025);
      }
      .user-table tbody tr:hover {
        background: rgba(26, 95, 74, 0.07);
      }
      .td-avatar {
        width: 3.25rem;
      }
      .avatar {
        display: inline-flex;
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        overflow: hidden;
        border: 1px solid var(--border);
        background: #fff;
        flex-shrink: 0;
        vertical-align: middle;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        max-width: none;
        object-fit: cover;
        object-position: center;
        display: block;
      }
      .avatar-ph {
        display: inline-flex;
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        background: rgba(26, 95, 74, 0.15);
        color: var(--primary-dark);
        border: 1px solid var(--border);
        flex-shrink: 0;
        vertical-align: middle;
      }
      .name-cell {
        font-weight: 600;
        white-space: nowrap;
      }
      .email-cell {
        word-break: break-word;
        max-width: 200px;
        font-size: 0.8125rem;
      }
      .date-cell {
        white-space: nowrap;
        font-size: 0.8125rem;
      }
      .pager-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 10px;
      }
      .pager-summary {
        font-size: 0.875rem;
      }
      .pager-btns {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }
      .pager-page {
        font-size: 0.875rem;
        font-weight: 600;
        min-width: 6rem;
        text-align: center;
      }

      /* Tablet Portrait and below */
      @media (max-width: 991px) {
        .filters-card {
          padding: 0.9rem 1rem;
        }
        .user-table {
          font-size: 0.8125rem;
        }
        .user-table th,
        .user-table td {
          padding: 0.65rem 0.75rem;
        }
        .th-date {
          white-space: normal;
        }
        .email-cell {
          word-break: break-word;
        }
      }

      /* Mobile Large and below */
      @media (max-width: 767px) {
        .fld-grow {
          min-width: 0;
          width: 100%;
        }
        .filters-row {
          flex-direction: column;
          align-items: stretch;
        }
        .filters-actions-inline {
          width: 100%;
        }
        .filters-actions-inline .btn {
          flex: 1 1 auto;
        }
        .pager-bar {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }
        .pager-btns {
          justify-content: center;
        }
      }

      /* Mobile Small */
      @media (max-width: 480px) {
        .page-head {
          padding-top: 1rem;
        }
        .avatar,
        .avatar-ph {
          width: 32px;
          height: 32px;
          min-width: 32px;
          min-height: 32px;
        }
      }
    `
  ]
})
export class UserManagementComponent implements OnInit {
  readonly pageSize = 20;

  rows = signal<CustomerAdminListDto[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  error = signal('');

  filterSearch = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  rangeLabel(): string {
    const t = this.total();
    if (t === 0) return '0';
    const start = (this.page() - 1) * this.pageSize + 1;
    const end = Math.min(this.page() * this.pageSize, t);
    return `${start}–${end}`;
  }

  applySearch(): void {
    this.page.set(1);
    this.load();
  }

  resetSearch(): void {
    this.filterSearch = '';
    this.page.set(1);
    this.load();
  }

  goPage(p: number): void {
    const max = this.totalPages();
    this.page.set(Math.min(Math.max(1, p), max));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getCustomersAdmin(this.page(), this.pageSize, this.filterSearch || undefined).subscribe({
      next: (res) => {
        const total = res?.total ?? 0;
        const maxPage = Math.max(1, Math.ceil(total / this.pageSize));
        if (this.page() > maxPage) {
          this.page.set(maxPage);
          if (total > 0) {
            this.load();
            return;
          }
        }
        this.rows.set(res?.items ?? []);
        this.total.set(total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.loadErrorMessage(err));
        this.loading.set(false);
        this.rows.set([]);
        this.total.set(0);
      }
    });
  }

  initials(name: string): string {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private loadErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      const fromBody =
        body &&
        typeof body === 'object' &&
        'message' in body &&
        typeof (body as { message: unknown }).message === 'string'
          ? (body as { message: string }).message.trim()
          : '';
      if (fromBody) return fromBody;
      if (err.status === 401 || err.status === 403) {
        return 'Sign in as an administrator to view customers.';
      }
      if (err.status === 404) {
        return 'Customers API not found. Expected GET /api/admin/users/customers (restart the backend after updating).';
      }
      if (err.status === 0) {
        return 'Cannot reach the API. Start the backend and confirm environment.apiUrl.';
      }
      return `Could not load customers (HTTP ${err.status}).`;
    }
    return 'Could not load customers.';
  }
}
