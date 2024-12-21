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
  imports: [
    RouterModule,
    CommonModule,
    FormsModule, 
  ],
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
    this.eventService.getEvents().subscribe((events) => {
      this.events = events;
      this.filteredEvents = events;
    });
  }

  searchEvents(): void {
    if (this.searchTerm) {
      this.filteredEvents = this.events.filter((event) =>
        event.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredEvents = this.events;
    }
  }

  viewDetails(id: string): void {
    this.router.navigate(['/events', id]);
  }

  editEvent(id: string): void {
    this.router.navigate(['/events', id, 'edit']);
  }

  deleteEvent(id: string): void {
    this.eventService.deleteEvent(id).subscribe(() => {
      this.filteredEvents = this.filteredEvents.filter(event => event._id !== id);
    });
  }

  canEdit(event: any): boolean {
    return (
      this.authService.loggedIn &&
      event.organizer === this.authService.getUsername()
    );
  }
}