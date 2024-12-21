import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private router: Router
  ) {}

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<{ access_token: string; role: string }>(
      `${this.apiUrl}/login`,
      { username, password }
    ).pipe(
      map((result) => {
        if (result && result.access_token) {
          localStorage.setItem('access_token', result.access_token);
          localStorage.setItem('role', result.role);
          return true;
        }
        return false;
      })
    );
  }

  register(username: string, password: string, role: string): Observable<boolean> {
    return this.http.post<{ access_token: string }>(
      `${this.apiUrl}/register`,
      { username, password, role }
    ).pipe(
      map((result) => {
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('role', role);
        return true;
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

  public get loggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    return !!(token && !this.jwtHelper.isTokenExpired(token));
  }

  public getUsername(): string | null {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken?.username || null;
    }
    return null;
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  public isOrganizer(): boolean {
    return this.getRole() === 'organizer';
  }
}