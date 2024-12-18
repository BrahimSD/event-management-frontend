import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient, private jwtHelper: JwtHelperService) {}

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        map(result => {
          localStorage.setItem('access_token', result.access_token);
          return true;
        })
      );
  }

  register(username: string, password: string, role: string): Observable<boolean> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/register`, { username, password, role })
      .pipe(
        map(result => {
          localStorage.setItem('access_token', result.access_token);
          return true;
        })
      );
  }

  logout() {
    localStorage.removeItem('access_token');
  }

  public get loggedIn(): boolean {
    return !this.jwtHelper.isTokenExpired(localStorage.getItem('access_token')!);
  }
}