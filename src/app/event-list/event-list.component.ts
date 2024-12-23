import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
})
export class EventListComponent implements OnInit {
  private userAvatars = new Map<string, string>();
  events: any[] = [];
  filteredEvents: any[] = [];
  searchTerm: string = '';

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getEvents().subscribe(events => {
      this.events = events;
      this.filteredEvents = events;
      this.events.forEach(event => {
        this.loadOrganizerAvatar(event.organizer);
      });
    });
  }

  loadOrganizerAvatar(username: string): void {
    if (!this.userAvatars.has(username)) {
      this.userService.getUserAvatar(username).subscribe({
        next: (response) => {
          if (response && response.avatar) {
            this.userAvatars.set(username, response.avatar);
          } else {
            this.userAvatars.set(username, 'fas fa-user-circle');
          }
        },
        error: () => {
          this.userAvatars.set(username, 'fas fa-user-circle');
        }
      });
    }
  }

  getOrganizerAvatar(username: string): string {
    return this.userAvatars.get(username) || 'fas fa-user-circle';
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
}