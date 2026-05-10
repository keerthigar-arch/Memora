import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:5000/api';

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
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (eventType) params = params.set('eventType', eventType);
    if (search?.trim()) params = params.set('search', search.trim());
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<PagedResult<EventListDto>>(`${API}/events`, { params });
  }

  getEvent(id: number): Observable<EventDetailDto> {
    return this.http.get<EventDetailDto>(`${API}/events/${id}`);
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
}
