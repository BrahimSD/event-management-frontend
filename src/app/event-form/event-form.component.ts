import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class EventFormComponent implements OnInit {
  event: any = {
    name: '',
    description: '',
    date: '',
    location: ''
  };
  isEditMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.eventService.getEvent(id).subscribe(event => {
        this.event = event;
      });
    }
  }

  saveEvent(): void {
    if (this.isEditMode) {
      const id = this.route.snapshot.paramMap.get('id');
      this.eventService.updateEvent(id!, this.event).subscribe(() => {
        this.router.navigate(['/events', id]);
      });
    } else {
      this.eventService.createEvent(this.event).subscribe(() => {
        this.router.navigate(['/events']);
      });
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.event.image = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}