import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService, PricingOrderAdminDto } from '../../services/api.service';

@Component({
  selector: 'app-pricing-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div class="container">
        <h1>Pricing payments</h1>
        <p class="page-lead">Review pricing orders, payment channels, and direct transfer confirmations.</p>
      </div>
    </section>

    <section class="container panel-wrap">
      <div class="filters-card">
        <div class="filters-row filters-row--search">
          <label class="fld fld-grow">
            <span class="lbl">Search</span>
            <input
              type="search"
              class="inp"
              placeholder="Reference, customer name, email, or phone"
              [(ngModel)]="filterSearch"
              name="filterSearch"
              (keydown.enter)="applyFilters()"
            />
          </label>
          <div class="filters-actions-inline">
            <button type="button" class="btn btn-primary" (click)="applyFilters()">Search</button>
            <button type="button" class="btn btn-ghost" (click)="resetFilters()">Reset</button>
          </div>
        </div>

        <div class="filters-row filters-row--controls">
          <label class="fld">
            <span class="lbl">Payment channel</span>
            <select class="inp" [(ngModel)]="filterChannel" name="filterChannel" (change)="onChannelChange()">
              <option value="">All channels</option>
              <option value="direct">Direct transfer</option>
              <option value="card">Card</option>
            </select>
          </label>
          <label class="fld">
            <span class="lbl">Payment status</span>
            <select class="inp" [(ngModel)]="filterStatus" name="filterStatus">
              <option value="">All statuses</option>
              <option value="pending_payment">Awaiting payment</option>
              <option value="direct_open">Reference issued</option>
              <option value="paid_card">Paid (card)</option>
              <option value="paid_direct">Paid (direct)</option>
            </select>
          </label>
          <label class="fld">
            <span class="lbl">Direct confirmation</span>
            <select
              class="inp"
              [(ngModel)]="filterManual"
              name="filterManual"
              [disabled]="filterChannel === 'card'"
            >
              <option value="">All direct orders</option>
              <option value="pending">Awaiting confirmation</option>
              <option value="received">Payment confirmed</option>
            </select>
          </label>
          <label class="fld">
            <span class="lbl">Date range</span>
            <select class="inp" [(ngModel)]="filterDatePreset" name="filterDatePreset" (change)="onDatePresetChange()">
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="month">This month</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
        </div>

        @if (filterDatePreset === 'custom') {
          <div class="filters-row filters-row--dates">
            <label class="fld">
              <span class="lbl">From</span>
              <input type="date" class="inp" [(ngModel)]="filterDateFrom" name="filterDateFrom" />
            </label>
            <label class="fld">
              <span class="lbl">To</span>
              <input type="date" class="inp" [(ngModel)]="filterDateTo" name="filterDateTo" />
            </label>
          </div>
        }

        <div class="filters-foot">
          <button type="button" class="btn btn-primary btn-sm" (click)="applyFilters()">Apply filters</button>
          @if (hasActiveFilters()) {
            <span class="active-filters-hint">{{ activeFiltersLabel() }}</span>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div><p>Loading…</p></div>
      } @else if (error()) {
        <div class="banner err">{{ error() }}</div>
      } @else if (rows().length === 0) {
        <div class="empty">
          <p class="empty-title">No orders found</p>
          <p class="muted empty-sub">Try adjusting filters or check again later.</p>
        </div>
      } @else {
        <div class="table-shell">
          <table class="pay-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Package</th>
                <th class="th-num">Price</th>
                <th class="th-date">Created</th>
                <th>Direct confirmation</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id) {
                <tr>
                  <td class="mono ref-cell">{{ row.referenceCode || '—' }}</td>
                  <td>
                    <span class="ch-badge" [class.ch-direct]="isDirect(row)" [class.ch-card]="isCard(row)">{{
                      row.paymentChannel
                    }}</span>
                  </td>
                  <td><span class="pill">{{ statusLabel(row) }}</span></td>
                  <td class="name-cell">{{ row.customerName }}</td>
                  <td class="contact-cell">
                    <div>{{ row.customerEmail }}</div>
                    <div class="muted">{{ row.customerPhone }}</div>
                  </td>
                  <td class="pkg-cell">
                    <span class="muted">{{ row.category }}</span>
                    <span class="dot">·</span>
                    {{ row.country }}
                    <div class="pkg-line">{{ row.packageDayLabel }}</div>
                  </td>
                  <td class="num-cell">{{ row.amountDisplay }} <span class="cur">{{ row.currencyCode }}</span></td>
                  <td class="date-cell muted">{{ row.createdAt | date: 'mediumDate' }}</td>
                  <td class="direct-cell">
                    @if (isDirect(row)) {
                      <label class="check-wrap">
                        <input
                          type="checkbox"
                          [checked]="row.directManualPaymentReceived"
                          [disabled]="savingId() === row.id"
                          (change)="onDirectToggle(row, $any($event.target).checked)"
                        />
                        <span>Received</span>
                      </label>
                      @if (row.directManualPaymentMarkedAt) {
                        <div class="muted tiny">{{ row.directManualPaymentMarkedAt | date: 'short' }}</div>
                      }
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pager-bar">
          <div class="pager-meta muted">
            Showing {{ rangeLabel() }} of {{ total() }} orders
          </div>
          <div class="pager-btns">
            <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="goPage(page() - 1)">
              Previous
            </button>
            <span class="pager-page">Page {{ page() }} / {{ totalPages() }}</span>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              [disabled]="page() >= totalPages()"
              (click)="goPage(page() + 1)"
            >
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
        margin: 0 0 0.3rem;
        font-size: clamp(1.35rem, 2.8vw, 1.75rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--primary-dark);
      }
      .page-lead {
        margin: 0;
        max-width: 42rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--text-muted);
      }
      .panel-wrap {
        padding-bottom: 2.5rem;
      }
      .filters-card {
        margin-bottom: 1.25rem;
        padding: 1rem 1.15rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 1px 2px rgba(13, 61, 50, 0.04), 0 6px 20px rgba(13, 61, 50, 0.05);
      }
      .filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem 0.85rem;
        align-items: flex-end;
      }
      .filters-row--search {
        margin-bottom: 0.85rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid rgba(13, 61, 50, 0.08);
      }
      .filters-row--controls {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem 0.85rem;
      }
      @media (min-width: 900px) {
        .filters-row--controls {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
      .filters-row--dates {
        margin-top: 0.65rem;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 28rem;
      }
      .fld {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin: 0;
        min-width: 0;
      }
      .fld-grow {
        flex: 1;
        min-width: 200px;
      }
      .lbl {
        font-size: 0.6875rem;
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
        background: #fff;
        color: inherit;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .inp:hover:not(:disabled) {
        border-color: #c5d8d0;
      }
      .inp:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
      }
      .inp:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        background: #f7faf8;
      }
      .filters-actions-inline {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .filters-foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.65rem 1rem;
        margin-top: 0.85rem;
        padding-top: 0.85rem;
        border-top: 1px solid rgba(13, 61, 50, 0.08);
      }
      .active-filters-hint {
        font-size: 0.8125rem;
        color: var(--text-muted);
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
      .table-shell {
        overflow-x: auto;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        box-shadow: 0 8px 28px rgba(15, 42, 34, 0.06);
      }
      .pay-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
        min-width: 920px;
      }
      .pay-table thead {
        background: linear-gradient(180deg, rgba(26, 95, 74, 0.12), rgba(26, 95, 74, 0.05));
      }
      .pay-table th {
        padding: 0.85rem 1rem;
        text-align: left;
        font-weight: 700;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--primary-dark);
        border-bottom: 2px solid rgba(26, 95, 74, 0.15);
      }
      .th-num,
      .num-cell {
        text-align: right;
      }
      .th-date {
        white-space: nowrap;
      }
      .pay-table td {
        padding: 0.85rem 1rem;
        vertical-align: top;
        border-bottom: 1px solid var(--border);
      }
      .pay-table tbody tr {
        transition: background 0.15s ease;
      }
      .pay-table tbody tr:nth-child(even) {
        background: rgba(26, 95, 74, 0.025);
      }
      .pay-table tbody tr:hover {
        background: rgba(26, 95, 74, 0.07);
      }
      .mono {
        font-family: ui-monospace, 'Cascadia Code', monospace;
        font-weight: 600;
        font-size: 0.8125rem;
      }
      .ref-cell {
        white-space: nowrap;
      }
      .muted {
        color: var(--text-muted);
      }
      .tiny {
        font-size: 0.72rem;
        margin-top: 0.25rem;
      }
      .pill {
        display: inline-block;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        background: rgba(26, 95, 74, 0.12);
        color: var(--primary-dark);
      }
      .ch-badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .ch-direct {
        background: rgba(59, 130, 246, 0.15);
        color: #1d4ed8;
      }
      .ch-card {
        background: rgba(139, 92, 246, 0.15);
        color: #6d28d9;
      }
      .name-cell {
        font-weight: 600;
        max-width: 160px;
      }
      .contact-cell {
        max-width: 200px;
        word-break: break-word;
        font-size: 0.8125rem;
      }
      .pkg-cell {
        max-width: 180px;
        font-size: 0.8125rem;
      }
      .pkg-line {
        margin-top: 0.2rem;
        font-weight: 600;
      }
      .dot {
        margin: 0 0.15rem;
        opacity: 0.5;
      }
      .num-cell {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
      }
      .cur {
        font-weight: 500;
        opacity: 0.75;
        font-size: 0.8rem;
      }
      .date-cell {
        white-space: nowrap;
        font-size: 0.8125rem;
      }
      .direct-cell {
        white-space: nowrap;
      }
      .check-wrap {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        cursor: pointer;
        font-weight: 600;
      }
      .check-wrap input {
        width: 1rem;
        height: 1rem;
        accent-color: var(--primary);
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
    `
  ]
})
export class PricingPaymentsComponent implements OnInit {
  readonly pageSize = 20;

  rows = signal<PricingOrderAdminDto[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  error = signal('');
  savingId = signal<number | null>(null);

  filterSearch = '';
  filterChannel = '';
  filterStatus = '';
  filterManual = '';
  filterDatePreset = 'all';
  filterDateFrom = '';
  filterDateTo = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  onChannelChange(): void {
    if (this.filterChannel === 'card') {
      this.filterManual = '';
    }
  }

  onDatePresetChange(): void {
    if (this.filterDatePreset === 'custom') {
      return;
    }
    const range = this.resolveDatePresetRange(this.filterDatePreset);
    this.filterDateFrom = range.from;
    this.filterDateTo = range.to;
  }

  hasActiveFilters(): boolean {
    return (
      !!this.filterSearch.trim() ||
      !!this.filterChannel ||
      !!this.filterStatus ||
      !!this.filterManual ||
      this.filterDatePreset !== 'all'
    );
  }

  activeFiltersLabel(): string {
    const parts: string[] = [];
    if (this.filterSearch.trim()) parts.push('search');
    if (this.filterChannel) parts.push('channel');
    if (this.filterStatus) parts.push('status');
    if (this.filterManual) parts.push('direct confirmation');
    if (this.filterDatePreset !== 'all') parts.push('date');
    return parts.length ? `Active: ${parts.join(', ')}` : '';
  }

  private resolveDatePresetRange(preset: string): { from: string; to: string } {
    if (preset === 'all') {
      return { from: '', to: '' };
    }
    const today = new Date();
    const to = this.formatDateInput(today);
    if (preset === '7d') {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: this.formatDateInput(from), to };
    }
    if (preset === '30d') {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: this.formatDateInput(from), to };
    }
    if (preset === 'month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: this.formatDateInput(from), to };
    }
    return { from: this.filterDateFrom, to: this.filterDateTo };
  }

  private formatDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private resolvedDateFilters(): { from?: string; to?: string } {
    if (this.filterDatePreset === 'all') {
      return {};
    }
    const range = this.resolveDatePresetRange(this.filterDatePreset);
    return {
      from: range.from || undefined,
      to: range.to || undefined
    };
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

  applyFilters(): void {
    if (this.filterChannel === 'card') {
      this.filterManual = '';
    }
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.filterSearch = '';
    this.filterChannel = '';
    this.filterStatus = '';
    this.filterManual = '';
    this.filterDatePreset = 'all';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.page.set(1);
    this.load();
  }

  goPage(p: number): void {
    const max = this.totalPages();
    const next = Math.min(Math.max(1, p), max);
    this.page.set(next);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    let directManualReceived: boolean | undefined;
    if (this.filterManual === 'received') directManualReceived = true;
    else if (this.filterManual === 'pending') directManualReceived = false;

    const dates = this.resolvedDateFilters();

    this.api
      .getPricingOrdersAdmin({
        page: this.page(),
        pageSize: this.pageSize,
        paymentChannel: this.filterChannel || undefined,
        status: this.filterStatus || undefined,
        search: this.filterSearch || undefined,
        dateFrom: dates.from,
        dateTo: dates.to,
        directManualReceived
      })
      .subscribe({
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
        return 'Sign in as an administrator to view pricing payments.';
      }
      if (err.status === 404) {
        return 'Payments API not found. Expected GET /api/pricing-orders/admin/all.';
      }
      if (err.status === 0) {
        return 'Cannot reach the API. Start the backend and confirm environment.apiUrl in the admin app matches the server.';
      }
      return `Could not load payments (HTTP ${err.status}).`;
    }
    return 'Could not load payments.';
  }

  isDirect(row: PricingOrderAdminDto): boolean {
    return row.paymentChannel?.toLowerCase() === 'direct';
  }

  isCard(row: PricingOrderAdminDto): boolean {
    return row.paymentChannel?.toLowerCase() === 'card';
  }

  statusLabel(row: PricingOrderAdminDto): string {
    if (row.paymentChannel?.toLowerCase() === 'card') {
      return 'Paid (card)';
    }
    const s = (row.status || '').toLowerCase();
    if (s === 'direct_open') return 'Reference issued';
    if (s === 'paid_direct') return 'Paid (direct)';
    if (s === 'pending_payment') return 'Awaiting payment';
    return row.status;
  }

  onDirectToggle(row: PricingOrderAdminDto, checked: boolean): void {
    if (!this.isDirect(row)) return;
    this.savingId.set(row.id);
    this.api.setPricingOrderDirectReceived(row.id, checked).subscribe({
      next: () => {
        this.savingId.set(null);
        this.load();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Could not update manual payment flag.');
        this.savingId.set(null);
        this.load();
      }
    });
  }
}
