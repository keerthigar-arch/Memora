import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api`;

export interface AdminNotificationDto {
  id: number;
  kind: string;
  title: string;
  eventType: string;
  customerDisplayName: string;
  createdAt: string;
  eventId?: number | null;
  pendingEventId?: number | null;
  isRead: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  unreadCount = signal(0);

  constructor(private http: HttpClient) {}

  loadUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${API}/notifications/unread-count`).pipe(
      tap((res) => this.unreadCount.set(res.unreadCount))
    );
  }

  getNotifications(take = 25): Observable<AdminNotificationDto[]> {
    return this.http.get<AdminNotificationDto[]>(`${API}/notifications`, {
      params: { take: String(take) }
    });
  }

  markAsRead(id: number): Observable<void> {
    return this.http.post<void>(`${API}/notifications/${id}/read`, {}).pipe(
      switchMap(() => this.loadUnreadCount()),
      map(() => undefined)
    );
  }
}
