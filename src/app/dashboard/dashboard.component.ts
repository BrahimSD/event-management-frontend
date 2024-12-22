import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { EventService } from '../event.service';
import { EventListComponent } from '../event-list/event-list.component';
import { EventFormComponent } from '../event-form/event-form.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EventListComponent, EventFormComponent]
})
export class DashboardComponent implements OnInit {
  searchTerm: string = '';
  activeTab = 'dashboard';
  showProfileMenu = false;
  username: string | null = null;
  profileImage: string | null = null;
  events: any[] = [];
  filteredEvents: any[] = [];
  showEventModal = false;


  constructor(
    private authService: AuthService,
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    this.profileImage = this.authService.getAvatar();
    this.loadEvents();
  }

  toggleEventModal() {
    this.showEventModal = !this.showEventModal;
  }

  onEventSaved() {
    this.showEventModal = false;
    this.loadEvents();
    this.setActiveTab('events');
    this.refreshProfile();
  }

  createEvent() {
    this.showEventModal = true;
  }

  loadEvents() {
    this.eventService.getEvents().subscribe(events => {
      this.events = events;
      this.filteredEvents = events;
    });
  }

  searchEvents() {
    if (this.searchTerm.trim()) {
      this.eventService.searchEvents(this.searchTerm).subscribe(events => {
        this.filteredEvents = events;
      });
    } else {
      this.filteredEvents = this.events;
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.showProfileMenu = false;
    this.refreshProfile();
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    this.refreshProfile();
  }

  refreshProfile() {
    this.profileImage = this.authService.getAvatar();
    this.username = this.authService.getUsername();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isOrganizer(): boolean {
    return this.authService.getRole() === 'organizer';
  }
}