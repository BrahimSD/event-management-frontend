import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    if (this.authService.loggedIn) {
      if (state.url === '/login') {
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    } else {
      if (state.url !== '/login' && state.url !== '/register') {
        this.router.navigate(['/login']);
        return false;
      }
      return true;
    }
  }
}