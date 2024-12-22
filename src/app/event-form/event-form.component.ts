import { Component, OnInit, Output, EventEmitter } from '@angular/core';
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
  @Output() eventSaved = new EventEmitter<void>();

  event: any = {
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image: null
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
    if (!this.event.name || !this.event.description || !this.event.date || !this.event.location) {
      this.validateForm();
      return;
    }

    const dateTime = new Date(this.event.date);
    const [hours, minutes] = this.event.time.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const eventData = {
      ...this.event,
      date: dateTime.toISOString()
    };

    if (this.isEditMode) {
      const id = this.route.snapshot.paramMap.get('id');
      this.eventService.updateEvent(id!, eventData).subscribe({
        next: () => {
          this.eventSaved.emit();
        },
        error: (error) => {
          console.error('Error updating event:', error);
        }
      });
    } else {
      this.eventService.createEvent(eventData).subscribe({
        next: () => {
          this.eventSaved.emit();
          this.event = {
            name: '',
            description: '',
            date: '',
            time: '',
            location: '',
            image: null
          };
        },
        error: (error) => {
          console.error('Error creating event:', error);
        }
      });
    }
  }

  validateForm(): void {
    const form = document.querySelector('.event-form') as HTMLFormElement;
    if (form) {
      form.classList.add('submitted');
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

  cancel() {
    if (this.isEditMode) {
      const id = this.route.snapshot.paramMap.get('id');
      this.router.navigate(['/events', id]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}