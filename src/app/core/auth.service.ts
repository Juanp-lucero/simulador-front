import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, switchMap, tap, throwError } from 'rxjs';
import { API_URL } from './api.service';
import { User } from './contracts';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);
  private readonly accessToken = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  token() { return this.accessToken(); }
  logout() { this.accessToken.set(null); this.user.set(null); }
  login(email: string, password: string) {
    const body = new HttpParams().set('username', email).set('password', password);
    return this.http.post<{ access_token: string }>(`${this.base}/auth/login`, body).pipe(
      switchMap(response => {
        this.accessToken.set(response.access_token);
        return this.http.get<User>(`${this.base}/auth/me`);
      }),
      tap(user => this.user.set(user)),
      catchError(error => { this.logout(); return throwError(() => error); }),
    );
  }
  register(email: string, password: string) {
    return this.http.post<User>(`${this.base}/auth/register`, { email, password }).pipe(
      switchMap(() => this.login(email, password)),
    );
  }
}
