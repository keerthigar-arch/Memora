import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api`;
const TOKEN_KEY = 'lifeevents_token';
const USER_KEY = 'lifeevents_user';

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  profileVisibility: string;
  showEmail: boolean;
  createdAt: string;
  /** "Admin" | "Customer" — from API */
  role?: string;
  mustChangePassword?: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

/** Forgot-password API body when backend runs with Smtp:DevLogOnly (development only). */
export interface ForgotPasswordResponse {
  message: string;
  devEmailSkipped?: boolean;
  resetUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private user = signal<UserProfile | null>(this.loadUserFromStorage());

  isLoggedIn = computed(() => !!this.token());
  currentUser = computed(() => this.user());
  isAdmin = computed(() => this.user()?.role === 'Admin');

  constructor(private http: HttpClient, private router: Router) {}

  private loadUserFromStorage(): UserProfile | null {
    const json = localStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  }

  private saveAuth(token: string, user: UserProfile) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.user.set(user);
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/auth/register`, { email, password, displayName }).pipe(
      tap((res) => this.saveAuth(res.token, res.user))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/auth/login`, { email, password }).pipe(
      tap((res) => this.saveAuth(res.token, res.user))
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigateByUrl(environment.logoutRedirectUrl);
  }

  getToken(): string | null {
    return this.token();
  }

  refreshProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API}/users/me`).pipe(
      tap((u) => {
        this.user.set(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
    );
  }

  updateProfile(displayName?: string, bio?: string, profileImage?: File): Observable<UserProfile> {
    const form = new FormData();
    if (displayName != null) form.append('displayName', displayName);
    if (bio != null) form.append('bio', bio);
    if (profileImage) form.append('profileImage', profileImage);
    return this.http.put<UserProfile>(`${API}/users/me`, form).pipe(
      tap((u) => {
        this.user.set(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
    );
  }

  updatePrivacy(profileVisibility?: string, showEmail?: boolean): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${API}/users/me/privacy`, { profileVisibility, showEmail }).pipe(
      tap((u) => {
        this.user.set(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${API}/users/me/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      tap((u) => {
        this.user.set(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
    );
  }

  forgotPassword(emailOrUsername: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${API}/auth/forgot-password`, {
      userName: emailOrUsername,
      portal: 'customer'
    });
  }

  validateResetPasswordToken(token: string): Observable<{ valid: boolean; expired: boolean }> {
    const params = new HttpParams().set('token', token);
    return this.http.get<{ valid: boolean; expired: boolean }>(`${API}/auth/reset-password/validate`, {
      params
    });
  }

  resetPasswordWithToken(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/auth/reset-password`, { token, newPassword });
  }
}
