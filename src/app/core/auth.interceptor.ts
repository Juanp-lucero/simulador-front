import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from './api.service';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const apiUrl = inject(API_URL);
  const scoped = request.url.startsWith(`${apiUrl}/`);
  const token = auth.token();
  const authorized = scoped && token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;
  return next(authorized).pipe(tap({ error: error => {
    if (scoped && token && error instanceof HttpErrorResponse && error.status === 401) auth.logout();
  } }));
};
