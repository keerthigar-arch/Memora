import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api`;

/** Match backend `Paging.MaxPageSize` / `Paging.AdminMaxPageSize`. */
const MAX_PUBLIC_PAGE_SIZE = 50;
const MAX_ADMIN_PAGE_SIZE = 100;

function clampPage(page: number): number {
  const p = Math.floor(Number(page));
  return Number.isFinite(p) && p >= 1 ? p : 1;
}

function clampPublicPageSize(pageSize: number, fallback: number): number {
  const s = Math.floor(Number(pageSize));
  const base = Number.isFinite(s) && s >= 1 ? s : fallback;
  return Math.min(Math.max(1, base), MAX_PUBLIC_PAGE_SIZE);
}

function clampAdminPageSize(pageSize: number, fallback: number): number {
  const s = Math.floor(Number(pageSize));
  const base = Number.isFinite(s) && s >= 1 ? s : fallback;
  return Math.min(Math.max(1, base), MAX_ADMIN_PAGE_SIZE);
}

export interface EventListDto {
  id: number;
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  birthDate?: string;
  deathDate?: string;
  weddingDate?: string;
  location?: string;
  country?: string;
  mainImageUrl?: string;
  createdBy: string;
  createdAt: string;
  wishCount: number;
  visibility?: string;
}

export interface AdminEventListDto extends EventListDto {
  isPublished: boolean;
  displayValidityEndDate?: string | null;
  paymentReceived?: boolean;
}

export interface WishDto {
  id: number;
  senderName: string;
  message: string;
  mediaUrl?: string;
  createdAt: string;
}

export interface EventDetailDto {
  id: number;
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  birthDate?: string;
  deathDate?: string;
  weddingDate?: string;
  location?: string;
  country?: string;
  mainImageUrl?: string;
  galleryUrls?: string;
  createdBy: string;
  createdAt: string;
  wishes: WishDto[];
  visibility?: string;
  paymentReceived?: boolean;
  isOwner?: boolean;
  invitedEmails?: string[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Customer accounts registered on the public site (admin list). */
export interface CustomerAdminListDto {
  id: number;
  email: string;
  displayName: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  profileVisibility: string;
  showEmail: boolean;
  createdAt: string;
  eventCount: number;
}

/** Pricing-page orders (customer site direct / Stripe). */
export interface PricingOrderAdminDto {
  id: number;
  referenceCode: string | null;
  status: string;
  paymentChannel: string;
  category: string;
  country: string;
  packageDayLabel: string;
  amountDisplay: string;
  currencyCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAmountMinorUnits: number | null;
  paidCurrencyCode: string | null;
  directManualPaymentReceived: boolean;
  directManualPaymentMarkedAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getEvents(
    page = 1,
    pageSize = 12,
    eventType?: string,
    search?: string,
    fromDate?: string,
    toDate?: string
  ): Observable<PagedResult<EventListDto>> {
    let params = new HttpParams()
      .set('page', String(clampPage(page)))
      .set('pageSize', String(clampPublicPageSize(pageSize, 12)));
    if (eventType) params = params.set('eventType', eventType);
    if (search?.trim()) params = params.set('search', search.trim());
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<PagedResult<EventListDto>>(`${API}/events`, { params });
  }

  getEvent(id: number): Observable<EventDetailDto> {
    return this.http.get<EventDetailDto>(`${API}/events/${id}`);
  }

  /** Organizer: all own events including hidden / unpublished. */
  getMyEvents(
    page = 1,
    pageSize = 12,
    eventType?: string,
    search?: string
  ): Observable<PagedResult<AdminEventListDto>> {
    let params = new HttpParams()
      .set('page', String(clampPage(page)))
      .set('pageSize', String(clampPublicPageSize(pageSize, 12)));
    if (eventType) params = params.set('eventType', eventType);
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<PagedResult<AdminEventListDto>>(`${API}/events/mine`, { params });
  }

  /** Load event for edit (works when hidden from public feed). */
  getEventForAdmin(id: number): Observable<EventDetailDto> {
    return this.http.get<EventDetailDto>(`${API}/events/admin/${id}`);
  }

  setEventPublished(id: number, published: boolean): Observable<void> {
    return this.http.patch<void>(`${API}/events/${id}/published`, { published });
  }

  getDisplayOptions(): Observable<{ days: number; price: number; label: string }[]> {
    return this.http.get<{ days: number; price: number; label: string }[]>(`${API}/payments/display-options`);
  }

  saveEventDraft(formData: FormData): Observable<{ draftId: number; displayDays: number; price: number; label: string }> {
    return this.http.post<{ draftId: number; displayDays: number; price: number; label: string }>(`${API}/events/save-draft`, formData);
  }

  createCheckoutSession(draftId: number): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${API}/payments/create-checkout-session`, { draftId });
  }

  verifyStripeSession(sessionId: string): Observable<EventDetailDto> {
    return this.http.post<EventDetailDto>(`${API}/payments/verify-session`, { sessionId });
  }

  confirmPaymentMock(draftId: number): Observable<EventDetailDto> {
  return this.http.post<EventDetailDto>(
    `${API}/payments/confirm-mock`, 
    { draftId },                          // 👈 camelCase matches C# record ConfirmPaymentRequest(int DraftId)
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

  createEvent(formData: FormData): Observable<EventDetailDto> {
    return this.http.post<EventDetailDto>(`${API}/events`, formData);
  }

  updateEvent(id: number, formData: FormData): Observable<EventDetailDto> {
    return this.http.put<EventDetailDto>(`${API}/events/${id}`, formData);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/events/${id}`);
  }

  addWish(eventId: number, senderName: string, message: string, mediaUrl?: string): Observable<WishDto> {
    return this.http.post<WishDto>(`${API}/events/${eventId}/wishes`, { senderName, message, mediaUrl });
  }

  uploadWishMedia(eventId: number, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${API}/events/${eventId}/wishes/upload-media`, formData);
  }

  submitContact(name: string, email: string, subject: string, message: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/contact`, { name, email, subject, message });
  }

  getCountryStats(): Observable<{ country: string; count: number }[]> {
    return this.http.get<{ country: string; count: number }[]>(`${API}/events/stats/count-by-country`);
  }

  /** Admin: pricing-package orders — paged (default 20), filterable on server. */
  getPricingOrdersAdmin(filters: {
    page?: number;
    pageSize?: number;
    paymentChannel?: string;
    status?: string;
    search?: string;
    category?: string;
    country?: string;
    dateFrom?: string;
    dateTo?: string;
    directManualReceived?: boolean;
  }): Observable<PagedResult<PricingOrderAdminDto>> {
    let params = new HttpParams()
      .set('page', String(clampPage(filters.page ?? 1)))
      .set('pageSize', String(clampAdminPageSize(filters.pageSize ?? 20, 20)));
    const setIf = (key: string, val?: string | null) => {
      if (val != null && String(val).trim() !== '') params = params.set(key, String(val).trim());
    };
    setIf('paymentChannel', filters.paymentChannel);
    setIf('status', filters.status);
    setIf('search', filters.search);
    setIf('category', filters.category);
    setIf('country', filters.country);
    setIf('dateFrom', filters.dateFrom);
    setIf('dateTo', filters.dateTo);
    if (filters.directManualReceived !== undefined) {
      params = params.set('directManualReceived', String(filters.directManualReceived));
    }
    return this.http.get<PagedResult<PricingOrderAdminDto>>(`${API}/pricing-orders/admin/all`, { params });
  }

  setPricingOrderDirectReceived(id: number, received: boolean): Observable<{ received: boolean }> {
    return this.http.patch<{ received: boolean }>(
      `${API}/pricing-orders/admin/${id}/direct-payment-received`,
      { received }
    );
  }

  /** Admin: paged customer users (excludes admin accounts). */
  getCustomersAdmin(page = 1, pageSize = 20, search?: string): Observable<PagedResult<CustomerAdminListDto>> {
    let params = new HttpParams()
      .set('page', String(clampPage(page)))
      .set('pageSize', String(clampAdminPageSize(pageSize, 20)));
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<PagedResult<CustomerAdminListDto>>(`${API}/admin/users/customers`, { params });
  }

  /** Admin: single customer row (404 if admin account or missing). */
  getCustomerAdmin(id: number): Observable<CustomerAdminListDto> {
    return this.http.get<CustomerAdminListDto>(`${API}/admin/users/customers/${id}`);
  }

  /** Admin: delete customer profile (204 No Content on success). */
  deleteCustomerAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/admin/users/customers/${id}`);
  }
}
