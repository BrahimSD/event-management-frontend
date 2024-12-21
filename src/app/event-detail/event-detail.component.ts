import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class EventDetailComponent implements OnInit {
  event: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.eventService.getEvent(id!).subscribe(event => {
      this.event = event;
    });
  }

  deleteEvent(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.eventService.deleteEvent(id!).subscribe(() => {
      this.router.navigate(['/events']);
    });
  }

  canEdit(): boolean {
    return (
      this.authService.loggedIn &&
      this.event.organizer === this.authService.getUsername()
    );
  }

  register(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.eventService.registerForEvent(id!).subscribe(() => {
      this.event.participants.push(this.authService.getUsername());
    });
  }

  unregister(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.eventService.unregisterFromEvent(id!).subscribe(() => {
      this.event.participants = this.event.participants.filter(
        (user: string) => user !== this.authService.getUsername()
      );
    });
  }

  isRegistered(): boolean {
    return this.event.participants.includes(this.authService.getUsername());
  }
}