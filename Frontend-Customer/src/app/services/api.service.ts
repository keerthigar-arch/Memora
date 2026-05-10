import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api`;

/** Align with API `Paging.MaxPageSize` — never request huge pages from the browser. */
const MAX_PAGE_SIZE = 50;

function clampPage(page: number): number {
  const p = Math.floor(Number(page));
  return Number.isFinite(p) && p >= 1 ? p : 1;
}

function clampPublicPageSize(pageSize: number, fallback = 12): number {
  const s = Math.floor(Number(pageSize));
  const base = Number.isFinite(s) && s >= 1 ? s : fallback;
  return Math.min(Math.max(1, base), MAX_PAGE_SIZE);
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
  isOwner?: boolean;
  invitedEmails?: string[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Recent wishes for feed sidebar (public events only). */
export interface RecentWishSidebarDto {
  id: number;
  senderName: string;
  messagePreview: string;
  createdAt: string;
  eventId: number;
  eventTitle: string;
  eventImageUrl?: string;
}

export interface PricingMatrixRowDto {
  feature: string;
  values: string[];
}

export interface PricingTextSectionDto {
  heading: string;
  items: string[];
}

export interface PricingPageDto {
  category: string;
  country: string;
  countryDisplayName: string;
  currencyCode: string;
  hotlineInternational: string;
  localNumbers: string[];
  packageDays: string[];
  recommendedIndex: number;
  matrix: PricingMatrixRowDto[];
  paymentMethods: string[];
  contentSections: PricingTextSectionDto[];
}

export interface PricingOrderContactPayload {
  category: string;
  country: string;
  packageColumnIndex: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
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
    toDate?: string,
    country?: string
  ): Observable<PagedResult<EventListDto>> {
    const p = clampPage(page);
    const ps = clampPublicPageSize(pageSize, 12);
    let params = new HttpParams().set('page', String(p)).set('pageSize', String(ps));
    if (eventType) params = params.set('eventType', eventType);
    if (search?.trim()) params = params.set('search', search.trim());
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (country?.trim()) params = params.set('country', country.trim());
    return this.http.get<PagedResult<EventListDto>>(`${API}/events`, { params });
  }

  getEvent(id: number): Observable<EventDetailDto> {
    return this.http.get<EventDetailDto>(`${API}/events/${id}`);
  }

  getDisplayOptions(): Observable<{ days: number; price: number; label: string }[]> {
    return this.http.get<{ days: number; price: number; label: string }[]>(`${API}/payments/display-options`);
  }

  getPricingPage(category: string, country: string): Observable<PricingPageDto> {
    let params = new HttpParams();
    params = params.set('category', category);
    params = params.set('country', country);
    return this.http.get<PricingPageDto>(`${API}/pricing/plans`, { params });
  }

  submitPricingDirectOrder(body: PricingOrderContactPayload): Observable<{ reference: string }> {
    return this.http.post<{ reference: string }>(`${API}/pricing-orders/direct`, body);
  }

  createPricingCardCheckoutSession(body: PricingOrderContactPayload): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${API}/pricing-orders/card/checkout-session`, body);
  }

  verifyPricingCardSession(sessionId: string): Observable<{ reference: string }> {
    return this.http.post<{ reference: string }>(`${API}/pricing-orders/card/verify-session`, {
      sessionId
    });
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

  getRecentWishes(take = 10): Observable<RecentWishSidebarDto[]> {
    const params = new HttpParams().set('take', take);
    return this.http.get<RecentWishSidebarDto[]>(`${API}/events/recent-wishes`, { params });
  }
}
