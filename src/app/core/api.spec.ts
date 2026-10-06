import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { API_URL, ApiService } from './api.service';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';
import { errorMessage } from './errors';

describe('API and authentication contracts', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: API_URL, useValue: 'http://localhost:8000' },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('logs in using OAuth2 form fields and loads the current user', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('pilot@example.com', 'ExamplePass123!').subscribe();
    const login = http.expectOne('http://localhost:8000/auth/login');
    expect(login.request.body.get('username')).toBe('pilot@example.com');
    expect(login.request.body.get('password')).toBe('ExamplePass123!');
    login.flush({ access_token: 'test-token' });
    const me = http.expectOne('http://localhost:8000/auth/me');
    expect(me.request.headers.get('Authorization')).toBe('Bearer test-token');
    me.flush({ id: 1, username: 'pilot', email: 'pilot@example.com', role: 'user', is_active: true });
    expect(auth.user()?.username).toBe('pilot');

    TestBed.inject(HttpClient).get('https://example.test/resource').subscribe();
    const external = http.expectOne('https://example.test/resource');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
    auth.logout();
    expect(auth.token()).toBeNull();
    expect(auth.user()).toBeNull();
  });

  it('uses the real preview contract', () => {
    TestBed.inject(ApiService).preview([2, 4], 60).subscribe();
    const request = http.expectOne('http://localhost:8000/simulation/preview');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ route_ids: [2, 4], elapsed_s: 60 });
    request.flush({ elapsed_s: 60, states: [] });
  });

  it('formats validation errors without copying submitted input', () => {
    const error = new HttpErrorResponse({
      status: 422, error: { detail: [{ loc: ['body', 'password'], msg: 'Too short', input: 'sensitive' }] },
    });
    expect(errorMessage(error)).toBe('password: Too short');
    expect(errorMessage(error)).not.toContain('sensitive');
  });
});
