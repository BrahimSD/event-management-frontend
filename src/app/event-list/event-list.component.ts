import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
})
export class EventListComponent implements OnInit {
  events: any[] = [];
  filteredEvents: any[] = [];
  searchTerm: string = '';

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getEvents().subscribe((events) => {
      this.events = events;
      this.filteredEvents = events;
    });
  }

  isRegistered(event: any): boolean {
    const username = this.authService.getUsername();
    return event.participants?.includes(username) || false;
  }

  register(id: string): void {
    this.eventService.registerForEvent(id).subscribe(() => {
      this.loadEvents();
    });
  }

  unregister(id: string): void {
    this.eventService.unregisterFromEvent(id).subscribe(() => {
      this.loadEvents();
    });
  }

  deleteEvent(id: string): void {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.deleteEvent(id).subscribe(() => {
        this.loadEvents();
      });
    }
  }

  canEdit(event: any): boolean {
    return (
      this.authService.loggedIn &&
      event.organizer === this.authService.getUsername()
    );
  }

  getOrganizerAvatar(username: string): string {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.username === username) {
        return user.avatar;
      }
    }
    return 'fas fa-user-circle';
  }
}