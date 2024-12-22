import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  private currentUser: any = null;

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private router: Router
  ) {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          this.currentUser = {
            username: response.username,
            role: response.role,
            avatar: response.avatar,
            token: response.access_token
          };
          
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('role', response.role);
          localStorage.setItem('user', JSON.stringify(this.currentUser)); // Stocker l'utilisateur complet
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.access_token) {
            this.currentUser = {
              username: userData.username,
              role: userData.role,
              avatar: userData.avatar,
              token: response.access_token
            };
            localStorage.setItem('user', JSON.stringify(this.currentUser));
          }
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

  getAvatar(): string {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.avatar || 'fas fa-user-circle';
    }
    return 'fas fa-user-circle';
  }
}