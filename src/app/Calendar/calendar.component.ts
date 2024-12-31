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
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  standalone: true,
  imports: [FullCalendarModule, CommonModule, FormsModule]
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