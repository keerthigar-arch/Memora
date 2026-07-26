import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AdminPaymentEventDto,
  ApiService,
  CustomerDraftListDto,
  CustomerPaidEventDto,
  PricingOrderAdminDto
} from '../../services/api.service';
import { environment } from '../../../environments/environment';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

@Component({
  selector: 'app-pricing-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePickerComponent],
  template: `
    <section class="page-head">
      <div class="container">
        <h1>Payments</h1>
        <p class="page-lead">All event and pricing payments in one place.</p>
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
              placeholder="Reference or customer email"
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
              <option value="paid_card">Paid</option>
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
              <app-date-picker
                [(ngModel)]="filterDateFrom"
                name="filterDateFrom"
                placeholder="From date"
                ariaLabel="Filter from date"
                (ngModelChange)="filterDateFrom = $event || ''"
              ></app-date-picker>
            </label>
            <label class="fld">
              <span class="lbl">To</span>
              <app-date-picker
                [(ngModel)]="filterDateTo"
                name="filterDateTo"
                placeholder="To date"
                ariaLabel="Filter to date"
                (ngModelChange)="filterDateTo = $event || ''"
              ></app-date-picker>
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

      @if (loading() || offlineLoading() || adminPaymentsLoading() || paidLoading()) {
        <div class="loading"><div class="spinner"></div><p>Loading…</p></div>
      } @else if (error() || offlineError() || adminPaymentsError() || paidError()) {
        <div class="banner err">{{ error() || offlineError() || adminPaymentsError() || paidError() }}</div>
      } @else if (
        rows().length === 0 &&
        filteredOfflineDrafts().length === 0 &&
        adminPaymentEvents().length === 0 &&
        filteredPaidEvents().length === 0
      ) {
        <div class="empty">
          <p class="empty-title">No payments found</p>
          <p class="muted empty-sub">Try adjusting filters or check again later.</p>
        </div>
      } @else {
        <div class="table-shell">
          <table class="pay-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Source</th>
                <th>Status</th>
                <th>Email</th>
                <th class="th-num">Amount</th>
                <th class="th-date">Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (d of filteredOfflineDrafts(); track 'offline-' + d.id) {
                <tr class="row-offline">
                  <td class="mono ref-cell">{{ d.referenceCode || ('#' + d.id) }}</td>
                  <td>
                    <span class="source-badge source-offline">Customer offline</span>
                  </td>
                  <td>
                    <span class="pill">{{ d.paymentReceived ? 'Received — publish' : 'Awaiting payment' }}</span>
                  </td>
                  <td class="email-cell">{{ d.ownerEmail || '—' }}</td>
                  <td class="num-cell">{{ formatUsd(d.amountPaid) }}</td>
                  <td class="date-cell muted">{{ (d.offlineSubmittedAt || d.createdAt) | date: 'medium' }}</td>
                  <td>
                    <div class="action-stack">
                      <label class="check-wrap">
                        <input
                          type="checkbox"
                          [checked]="!!d.paymentReceived"
                          [disabled]="!!d.paymentReceived || customerDraftSavingId() === d.id"
                          (change)="markCustomerDraftReceived(d, $any($event.target).checked)"
                        />
                        <span class="check-label">
                          @if (customerDraftSavingId() === d.id) {
                            <span class="btn-spinner check-spinner" aria-hidden="true"></span>
                            Saving…
                          } @else {
                            Received
                          }
                        </span>
                      </label>
                      <a [routerLink]="['/pending-event', d.id]" class="btn btn-outline btn-sm">
                        {{ d.paymentReceived ? 'Publish' : 'Review' }}
                      </a>
                    </div>
                  </td>
                </tr>
              }

              @for (paid of filteredPaidEvents(); track 'paid-' + paid.id) {
                <tr class="row-paid" [class.row-card]="isCardPaid(paid)">
                  <td class="mono ref-cell">{{ paid.referenceCode || ('#' + paid.id) }}</td>
                  <td>
                    <span
                      class="source-badge"
                      [class.source-card]="isCardPaid(paid)"
                      [class.source-offline]="!isCardPaid(paid)"
                    >
                      {{ isCardPaid(paid) ? 'Customer card' : 'Customer offline' }}
                    </span>
                  </td>
                  <td><span class="pill pill-paid">Paid</span></td>
                  <td class="email-cell">{{ paid.ownerEmail || '—' }}</td>
                  <td class="num-cell">{{ formatUsd(paid.amountPaid) }}</td>
                  <td class="date-cell muted">{{ paid.paidAt | date: 'medium' }}</td>
                  <td>
                    <a [href]="customerEventUrl(paid.id)" class="btn btn-outline btn-sm">
                      View event
                    </a>
                  </td>
                </tr>
              }

              @for (event of adminPaymentEvents(); track 'admin-' + event.id) {
                <tr class="row-admin">
                  <td class="mono ref-cell">#{{ event.id }}</td>
                  <td><span class="source-badge source-admin">Admin event</span></td>
                  <td><span class="pill">Awaiting payment</span></td>
                  <td class="email-cell muted">—</td>
                  <td class="num-cell">{{ formatUsd(event.amountDue) }}</td>
                  <td class="date-cell muted">{{ event.createdAt | date: 'medium' }}</td>
                  <td>
                    <label class="check-wrap">
                      <input
                        type="checkbox"
                        [checked]="false"
                        [disabled]="adminPaymentSavingId() === event.id"
                        (change)="markAdminPaymentReceived(event, $any($event.target).checked)"
                      />
                      <span class="check-label">
                        @if (adminPaymentSavingId() === event.id) {
                          <span class="btn-spinner check-spinner" aria-hidden="true"></span>
                          Saving…
                        } @else {
                          Received
                        }
                      </span>
                    </label>
                  </td>
                </tr>
              }

              @for (row of rows(); track row.id) {
                <tr [class.row-card]="isCard(row)" [class.row-direct]="isDirect(row)">
                  <td class="mono ref-cell">{{ row.referenceCode || '—' }}</td>
                  <td><span class="source-badge" [class.source-direct]="isDirect(row)" [class.source-card]="isCard(row)">
                    {{ isCard(row) ? 'Card' : 'Direct transfer' }}
                  </span></td>
                  <td><span class="pill">{{ statusLabel(row) }}</span></td>
                  <td class="email-cell">{{ row.customerEmail || '—' }}</td>
                  <td class="num-cell">{{ row.amountDisplay }}</td>
                  <td class="date-cell muted">{{ row.createdAt | date: 'medium' }}</td>
                  <td class="direct-cell">
                    @if (isDirect(row)) {
                      <label class="check-wrap">
                        <input
                          type="checkbox"
                          [checked]="row.directManualPaymentReceived"
                          [disabled]="savingId() === row.id"
                          (change)="onDirectToggle(row, $any($event.target).checked)"
                        />
                        <span class="check-label">
                          @if (savingId() === row.id) {
                            <span class="btn-spinner check-spinner" aria-hidden="true"></span>
                            Saving…
                          } @else {
                            Received
                          }
                        </span>
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
            Pricing orders: {{ rangeLabel() }} of {{ total() }}
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
      .section-block {
        margin-bottom: 2rem;
      }
      .section-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.35rem;
      }
      .section-head h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--primary-dark);
      }
      .section-lead {
        margin: 0 0 0.85rem;
        font-size: 0.84rem;
        color: var(--text-muted);
      }
      .count-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        background: #eef2f0;
        color: #52635c;
      }
      .count-pill.has-items {
        background: #fef3c7;
        color: #92400e;
      }
      .empty-sm {
        padding: 1.25rem 1rem;
      }
      .loading-sm {
        padding: 1rem;
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
      .pay-table tbody tr.row-offline {
        background: #eff6ff;
        border-left: 4px solid #3b82f6;
      }
      .pay-table tbody tr.row-admin {
        background: #fffbeb;
        border-left: 4px solid #f59e0b;
      }
      .pay-table tbody tr.row-card {
        background: #f0fdf4;
        border-left: 4px solid #22c55e;
      }
      .pay-table tbody tr.row-direct {
        background: #faf5ff;
        border-left: 4px solid #a855f7;
      }
      .pay-table tbody tr.row-offline:hover { background: #dbeafe; }
      .pay-table tbody tr.row-admin:hover { background: #fef3c7; }
      .pay-table tbody tr.row-card:hover { background: #dcfce7; }
      .pay-table tbody tr.row-direct:hover { background: #f3e8ff; }
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
      .pill-paid {
        background: #dcfce7;
        color: #166534;
      }
      .source-badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .source-offline {
        background: #dbeafe;
        color: #1e40af;
      }
      .source-admin {
        background: #fef3c7;
        color: #92400e;
      }
      .source-card {
        background: #dcfce7;
        color: #166534;
      }
      .source-direct {
        background: #f3e8ff;
        color: #6b21a8;
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
      .email-cell {
        max-width: 240px;
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
      .check-label {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .check-spinner {
        width: 0.85rem;
        height: 0.85rem;
        border-color: rgba(26, 95, 74, 0.25);
        border-top-color: var(--primary);
      }
      .action-stack {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.45rem;
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

      /* Tablet Landscape filters: 4 columns */
      @media (min-width: 992px) {
        .filters-row--controls {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }

      /* Tablet Portrait and below */
      @media (max-width: 991px) {
        .filters-card {
          padding: 0.9rem 1rem;
        }
        .pay-table {
          min-width: 720px;
          font-size: 0.8125rem;
        }
        .pay-table th,
        .pay-table td {
          padding: 0.65rem 0.75rem;
        }
      }

      /* Mobile Large and below */
      @media (max-width: 767px) {
        .filters-row--controls {
          grid-template-columns: 1fr;
        }
        .filters-row--dates {
          grid-template-columns: 1fr;
          max-width: none;
        }
        .fld-grow {
          min-width: 0;
          width: 100%;
        }
        .filters-actions-inline,
        .filters-foot {
          width: 100%;
        }
        .filters-actions-inline .btn,
        .filters-foot .btn {
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
        .section-head {
          flex-wrap: wrap;
        }
      }

      /* Mobile Small */
      @media (max-width: 480px) {
        .page-head {
          padding-top: 1rem;
        }
        .pay-table {
          min-width: 640px;
        }
        .action-stack {
          width: 100%;
        }
        .action-stack .btn {
          width: 100%;
        }
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

  offlineDrafts = signal<CustomerDraftListDto[]>([]);
  offlineLoading = signal(true);
  offlineError = signal('');

  paidEvents = signal<CustomerPaidEventDto[]>([]);
  paidLoading = signal(true);
  paidError = signal('');

  adminPaymentEvents = signal<AdminPaymentEventDto[]>([]);
  adminPaymentsLoading = signal(true);
  adminPaymentsError = signal('');
  adminPaymentSavingId = signal<number | null>(null);
  customerDraftSavingId = signal<number | null>(null);

  filterSearch = '';
  filterChannel = '';
  filterStatus = '';
  filterManual = '';
  filterDatePreset = 'all';
  filterDateFrom = '';
  filterDateTo = '';

  /** Offline drafts still awaiting admin action (not card). */
  filteredOfflineDrafts(): CustomerDraftListDto[] {
    if (this.filterChannel === 'card') return [];
    if (this.filterStatus === 'paid_card' || this.filterStatus === 'paid_direct') return [];
    return this.applyCommonClientFilters(this.offlineDrafts(), (d) => ({
      title: d.title,
      owner: d.ownerDisplayName,
      email: d.ownerEmail,
      reference: d.referenceCode,
      date: d.offlineSubmittedAt || d.createdAt
    }));
  }

  /** Published customer payments (card + offline) kept as payment history. */
  filteredPaidEvents(): CustomerPaidEventDto[] {
    if (this.filterChannel === 'direct') return [];
    if (this.filterStatus === 'pending_payment' || this.filterStatus === 'direct_open') return [];
    if (this.filterChannel === 'card' || this.filterStatus === 'paid_card') {
      return this.applyCommonClientFilters(
        this.paidEvents().filter((e) => (e.paymentMethod || '').toLowerCase() === 'card'),
        (e) => ({
          title: e.title,
          owner: e.ownerDisplayName,
          email: e.ownerEmail,
          reference: e.referenceCode,
          date: e.paidAt
        })
      );
    }
    if (this.filterStatus === 'paid_direct') return [];
    return this.applyCommonClientFilters(this.paidEvents(), (e) => ({
      title: e.title,
      owner: e.ownerDisplayName,
      email: e.ownerEmail,
      reference: e.referenceCode,
      date: e.paidAt
    }));
  }

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadOffline();
    this.loadPaidEvents();
    this.loadAdminPaymentEvents();
    this.load();
  }

  isCardPaid(e: CustomerPaidEventDto): boolean {
    return (e.paymentMethod || '').toLowerCase() === 'card';
  }

  customerEventUrl(eventId: number): string {
    return `${environment.customerPortalUrl}/event/${eventId}`;
  }

  markCustomerDraftReceived(draft: CustomerDraftListDto, checked: boolean): void {
    if (!checked || draft.paymentReceived || this.customerDraftSavingId() !== null) return;
    if (!confirm(`Mark payment received for "${draft.title}"? You can publish it after marking.`)) {
      return;
    }

    this.customerDraftSavingId.set(draft.id);
    this.offlineError.set('');
    this.api.markOfflinePaymentReceived(draft.id).subscribe({
      next: () => {
        this.offlineDrafts.update((items) =>
          items.map((item) => (item.id === draft.id ? { ...item, paymentReceived: true } : item))
        );
        this.customerDraftSavingId.set(null);
      },
      error: (err) => {
        this.offlineError.set(this.loadErrorMessage(err));
        this.customerDraftSavingId.set(null);
      }
    });
  }

  formatUsd(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  }

  loadOffline(): void {
    this.offlineLoading.set(true);
    this.offlineError.set('');
    this.api.getPendingOfflineApprovals().subscribe({
      next: (items) => {
        this.offlineDrafts.set(items ?? []);
        this.offlineLoading.set(false);
      },
      error: (err) => {
        this.offlineError.set(this.loadErrorMessage(err));
        this.offlineDrafts.set([]);
        this.offlineLoading.set(false);
      }
    });
  }

  loadPaidEvents(): void {
    this.paidLoading.set(true);
    this.paidError.set('');
    this.api.getCustomerPaidEvents().subscribe({
      next: (items) => {
        this.paidEvents.set(items ?? []);
        this.paidLoading.set(false);
      },
      error: (err) => {
        this.paidError.set(this.loadErrorMessage(err));
        this.paidEvents.set([]);
        this.paidLoading.set(false);
      }
    });
  }

  loadAdminPaymentEvents(): void {
    this.adminPaymentsLoading.set(true);
    this.adminPaymentsError.set('');
    this.api.getAdminPaymentPendingEvents().subscribe({
      next: (events) => {
        this.adminPaymentEvents.set(events ?? []);
        this.adminPaymentsLoading.set(false);
      },
      error: (err) => {
        this.adminPaymentsError.set(this.loadErrorMessage(err));
        this.adminPaymentEvents.set([]);
        this.adminPaymentsLoading.set(false);
      }
    });
  }

  markAdminPaymentReceived(event: AdminPaymentEventDto, checked: boolean): void {
    if (!checked || this.adminPaymentSavingId() !== null) return;

    this.adminPaymentSavingId.set(event.id);
    this.adminPaymentsError.set('');
    this.api.markAdminEventPaymentReceived(event.id).subscribe({
      next: () => {
        this.adminPaymentEvents.update((events) => events.filter((item) => item.id !== event.id));
        this.adminPaymentSavingId.set(null);
      },
      error: (err) => {
        this.adminPaymentsError.set(this.loadErrorMessage(err));
        this.adminPaymentSavingId.set(null);
      }
    });
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
    this.loadOffline();
    this.loadPaidEvents();
    this.loadAdminPaymentEvents();
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
    this.loadOffline();
    this.loadPaidEvents();
    this.loadAdminPaymentEvents();
  }

  private applyCommonClientFilters<T>(
    items: T[],
    pick: (item: T) => {
      title: string;
      owner?: string | null;
      email?: string | null;
      reference?: string | null;
      date: string;
    }
  ): T[] {
    const q = this.filterSearch.trim().toLowerCase();
    const dates = this.resolvedDateFilters();
    const from = dates.from ? new Date(`${dates.from}T00:00:00`) : null;
    const to = dates.to ? new Date(`${dates.to}T23:59:59`) : null;

    return items.filter((item) => {
      const meta = pick(item);
      if (q) {
        const hay = `${meta.title} ${meta.owner || ''} ${meta.email || ''} ${meta.reference || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (from || to) {
        const when = new Date(meta.date);
        if (Number.isNaN(when.getTime())) return false;
        if (from && when < from) return false;
        if (to && when > to) return false;
      }
      return true;
    });
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
      return 'Paid';
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
