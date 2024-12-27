import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { EventService } from '../event.service';
import { EventListComponent } from '../event-list/event-list.component';
import { EventFormComponent } from '../event-form/event-form.component';
import { UserService } from '../user.service';
import { PeopleComponent } from "../people/people.component";
import { CalendarComponent } from '../calendar/calendar.component';
import { ChatComponent } from '../chat/chat.component';
import { ProfileComponent } from '../profile/profile.component';
import { PersonalComponent } from '../personal/personal.component';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    EventListComponent,
    EventFormComponent,
    PeopleComponent,
    CalendarComponent,
    ChatComponent,
    ProfileComponent,
    PersonalComponent
]
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
  users: any[] = [];
  selectedUser: any = null;
  showSettingsMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    this.profileImage = this.authService.getAvatar();
    this.loadEvents();

    // Add type for params
    this.route.queryParams.subscribe((params: { [key: string]: string }) => {
      if (params['tab']) {
        this.setActiveTab(params['tab']);
      }
      if (params['user']) {
        this.userService.getUserDetails(params['user']).subscribe(user => {
          this.selectedUser = user;
        });
      }
    });
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
    this.showSettingsMenu = false;
    if (tab === 'profile') {
      this.refreshProfile();
    }
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

  showEventHistory() {
    this.setActiveTab('people');
    const username = this.authService.getUsername();
    if (username) {
      this.userService.getUserDetails(username).subscribe(
        (userDetails: any) => {
          this.selectedUser = userDetails;
        }
      );
    }
  }

  toggleSettingsMenu() {
    this.showSettingsMenu = !this.showSettingsMenu;
    if (this.showSettingsMenu) {
      this.showProfileMenu = false;
    }
  }
}