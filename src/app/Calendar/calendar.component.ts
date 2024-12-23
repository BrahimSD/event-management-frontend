import { Component, OnInit } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, CommonModule, FormsModule],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <button class="view-button" (click)="changeView('dayGridMonth')">Month</button>
        <button class="view-button" (click)="changeView('timeGridWeek')">Week</button>
        <button class="view-button" (click)="changeView('timeGridDay')">Day</button>
      </div>
      <full-calendar [options]="calendarOptions"></full-calendar>
    </div>

    <!-- Event Details Modal -->
    <div class="modal" *ngIf="selectedEvent">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Event Details</h2>
          <button class="close-btn" (click)="closeEventDetails()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <h3>{{ selectedEvent.title }}</h3>
          <p><i class="fas fa-calendar"></i> {{ selectedEvent.start | date:'EEEE, MMMM d, y' }}</p>
          <p><i class="fas fa-clock"></i> {{ selectedEvent.start | date:'shortTime' }}</p>
          <p><i class="fas fa-map-marker-alt"></i> {{ selectedEvent.extendedProps?.location }}</p>
          <p>{{ selectedEvent.extendedProps?.description }}</p>
        </div>
      </div>
    </div>

    <!-- Create Event Modal -->
    <div class="modal" *ngIf="showCreateEventModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Create New Event</h2>
          <button class="close-btn" (click)="closeCreateEventModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="createEvent()" #eventForm="ngForm">
            <div class="form-group">
              <label for="title">Event Title</label>
              <input type="text" id="title" [(ngModel)]="newEvent.name" name="title" required>
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" [(ngModel)]="newEvent.description" name="description"></textarea>
            </div>
            <div class="form-group">
              <label for="location">Location</label>
              <input type="text" id="location" [(ngModel)]="newEvent.location" name="location" required>
            </div>
            <div class="form-group">
              <label for="image">Event Image</label>
              <div class="image-upload">
                <input type="file" id="image" (change)="onFileSelected($event)" accept="image/*" #imageInput>
                <label for="image" class="upload-label">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>Choose an image</span>
                </label>
                <div class="preview-container" *ngIf="newEvent.image">
                  <img [src]="newEvent.image" alt="Preview" class="image-preview">
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-cancel" (click)="closeCreateEventModal()">Cancel</button>
              <button type="submit" class="btn-submit" [disabled]="!eventForm.form.valid">Create Event</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  selectedEvent: any = null;
  showCreateEventModal = false;
  newEvent: any = {
    name: '',
    description: '',
    date: null,
    location: '',
    organizer: ''
  };
  selectedDate: Date | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    events: [],
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    eventClick: this.handleEventClick.bind(this),
    select: this.handleDateSelect.bind(this)
  };

  constructor(
    private eventService: EventService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    const currentUser = this.authService.getUsername();
    
    this.eventService.getEvents().subscribe(events => {
      // Filter events for current user
      const userEvents = events.filter(event => 
        event.organizer === currentUser || 
        event.participants?.includes(currentUser)
      );

      const calendarEvents = userEvents.map(event => ({
        id: event._id,
        title: event.name,
        start: new Date(event.date),
        description: event.description,
        location: event.location,
        backgroundColor: event.organizer === currentUser ? '#3498db' : '#2ecc71',
        borderColor: event.organizer === currentUser ? '#2980b9' : '#27ae60',
        allDay: false
      }));
      
      this.calendarOptions.events = calendarEvents;
    });
  }

  changeView(viewName: string) {
    const calendar = document.querySelector('full-calendar');
    if (calendar) {
      const calendarApi = (calendar as any).getApi();
      calendarApi.changeView(viewName);
    }
  }

  handleEventClick(info: any) {
    this.selectedEvent = info.event;
  }

  handleDateSelect(selectInfo: any) {
    if (this.authService.getRole() === 'organizer') {
      this.selectedDate = selectInfo.start;
      this.newEvent = {
        name: '',
        description: '',
        date: this.selectedDate,
        location: '',
        organizer: this.authService.getUsername()
      };
      this.showCreateEventModal = true;
    }
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  }

  createEvent() {
    if (this.selectedDate) {
      this.eventService.createEvent(this.newEvent).subscribe(() => {
        this.loadEvents();
        this.closeCreateEventModal();
      });
    }
  }

  closeCreateEventModal() {
    this.showCreateEventModal = false;
    this.newEvent = {
      name: '',
      description: '',
      date: null,
      location: '',
      organizer: ''
    };
  }

  closeEventDetails() {
    this.selectedEvent = null;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.newEvent.image = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}