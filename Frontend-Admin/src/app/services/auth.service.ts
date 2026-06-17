import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api`;
const TOKEN_KEY = 'lifeevents_token';
const USER_KEY = 'lifeevents_user';
/** Backup flag so reset route works even if profile parsing glitches */
const PENDING_FIRST_LOGIN_KEY = 'lifeevents_pending_first_login';

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
  /** True until admin sets a new password after first login with a temporary password */
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
  isAdmin = computed(() => {
    const r = this.user()?.role;
    return r === 'Admin' || r?.toLowerCase() === 'admin';
  });

  constructor(private http: HttpClient, private router: Router) {}

  /** Use raw login response (not only signals) so navigation never misses `mustChangePassword`. */
  parseLoginResponse(res: AuthResponse): { isAdmin: boolean; mustReset: boolean } {
    const raw = res.user as unknown as Record<string, unknown>;
    const role = String(res.user.role ?? raw['Role'] ?? '').trim();
    const isAdmin = role.toLowerCase() === 'admin';
    const rawMust = res.user.mustChangePassword ?? raw['MustChangePassword'] ?? raw['mustChangePassword'];
    const mustReset =
      rawMust === true || rawMust === 1 || rawMust === '1' || rawMust === 'true';
    return { isAdmin, mustReset };
  }

  hasPendingFirstLogin(): boolean {
    return sessionStorage.getItem(PENDING_FIRST_LOGIN_KEY) === '1';
  }

  /** Maps API JSON whether properties are camelCase or PascalCase (e.g. MustChangePassword). */
  private normalizeUserFromApi(user: UserProfile): UserProfile {
    const r = user as unknown as Record<string, unknown>;
    const role = ((user.role ?? r['Role']) as string | undefined)?.trim();
    const rawMust = user.mustChangePassword ?? r['MustChangePassword'] ?? r['mustChangePassword'];
    const mustChangePassword =
      rawMust === true || rawMust === 1 || rawMust === '1' || rawMust === 'true';
    return {
      ...user,
      role,
      mustChangePassword
    };
  }

  private loadUserFromStorage(): UserProfile | null {
    const json = localStorage.getItem(USER_KEY);
    if (!json) return null;
    const u = this.normalizeUserFromApi(JSON.parse(json) as UserProfile);
    this.syncPendingFirstLoginFlag(u);
    return u;
  }

  private syncPendingFirstLoginFlag(user: UserProfile) {
    if (user.mustChangePassword) {
      sessionStorage.setItem(PENDING_FIRST_LOGIN_KEY, '1');
    } else {
      sessionStorage.removeItem(PENDING_FIRST_LOGIN_KEY);
    }
  }

  private saveAuth(token: string, user: UserProfile) {
    const normalized = this.normalizeUserFromApi(user);
    this.syncPendingFirstLoginFlag(normalized);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    this.token.set(token);
    this.user.set(normalized);
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

  /** Clears session. Optional query params (e.g. after first-login password reset → login with message). */
  logout(queryParams?: Record<string, string | boolean | null>) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(PENDING_FIRST_LOGIN_KEY);
    this.token.set(null);
    this.user.set(null);
    const hasQuery = queryParams && Object.keys(queryParams).length > 0;
    if (hasQuery) {
      this.router.navigate([environment.logoutRedirectUrl], { queryParams });
    } else {
      this.router.navigateByUrl(environment.logoutRedirectUrl);
    }
  }

  getToken(): string | null {
    return this.token();
  }

  refreshProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API}/users/me`).pipe(
      tap((u) => {
        const normalized = this.normalizeUserFromApi(u);
        this.syncPendingFirstLoginFlag(normalized);
        this.user.set(normalized);
        localStorage.setItem(USER_KEY, JSON.stringify(normalized));
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
        const normalized = this.normalizeUserFromApi(u);
        this.syncPendingFirstLoginFlag(normalized);
        this.user.set(normalized);
        localStorage.setItem(USER_KEY, JSON.stringify(normalized));
      })
    );
  }

  updatePrivacy(profileVisibility?: string, showEmail?: boolean): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${API}/users/me/privacy`, { profileVisibility, showEmail }).pipe(
      tap((u) => {
        const normalized = this.normalizeUserFromApi(u);
        this.syncPendingFirstLoginFlag(normalized);
        this.user.set(normalized);
        localStorage.setItem(USER_KEY, JSON.stringify(normalized));
      })
    );
  }

  /** Change password from profile (admin). API returns updated profile. */
  changePassword(currentPassword: string, newPassword: string): Observable<UserProfile> {
    return this.http
      .put<UserProfile>(`${API}/users/me/change-password`, {
        currentPassword,
        newPassword
      })
      .pipe(
        tap((u) => {
          const normalized = this.normalizeUserFromApi(u);
          this.syncPendingFirstLoginFlag(normalized);
          this.user.set(normalized);
          localStorage.setItem(USER_KEY, JSON.stringify(normalized));
        })
      );
  }

  /** First login: set new password (session already proved temp password at login). */
  firstLoginResetPassword(newPassword: string): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${API}/auth/first-login-password`, {
      newPassword
    });
  }

  forgotPassword(userName: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${API}/auth/forgot-password`, {
      userName,
      portal: 'admin'
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
