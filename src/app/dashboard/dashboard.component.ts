import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DashboardComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isOrganizer(): boolean {
    return this.authService.getRole() === 'organizer';
  }
  
  navigateToCreateEvent() {
    if (this.isOrganizer()) {
      this.router.navigate(['/events/new']);
    } else {
      alert('You do not have permission to create events.');
    }
  }
}