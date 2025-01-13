import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { NotificationsComponent } from '../notifications/notifications.component';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../notification.interface';
import { Subscription } from 'rxjs';

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
    PersonalComponent,
    NotificationsComponent
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
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
  unreadNotificationsCount: number = 0;
  private notificationSubscription!: Subscription;
  upcomingEvents: any[] = [];
  registeredEvents: any[] = [];
  createdEvents: any[] = [];
  followingCount: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    this.profileImage = this.authService.getAvatar();
    this.loadDashboardData();
    
    // Subscribe to notifications
    this.notificationSubscription = this.notificationService.notificationCount$
      .subscribe(count => {
        this.unreadNotificationsCount = count;
      });

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

  loadDashboardData() {
    const username = this.authService.getUsername();
    if (username) {
      // Load events
      this.eventService.getEvents().subscribe(events => {
        const now = new Date();
        
        // Filter upcoming events
        this.upcomingEvents = events
          .filter(event => new Date(event.date) > now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 6);

        // Filter registered events
        this.registeredEvents = events
          .filter(event => event.participants?.includes(username))
          .slice(0, 6);

        // Filter created events
        this.createdEvents = events
          .filter(event => event.organizer === username);

        // Set filtered events for search
        this.events = events;
        this.filteredEvents = events;
      });

      // Load following count
      this.userService.getUserDetails(username).subscribe(user => {
        this.followingCount = user.following?.length || 0;
      });

      // Load notifications count
      this.notificationService.refreshNotificationCount();
    }
  }

  toggleEventModal() {
    this.showEventModal = !this.showEventModal;
  }

  onEventSaved() {
    this.showEventModal = false;
    this.loadDashboardData();
    this.setActiveTab('events');
    this.refreshProfile();
  }

  createEvent() {
    this.showEventModal = true;
  }

  searchEvents() {
    if (this.searchTerm.trim()) {
      this.filteredEvents = this.events.filter(event =>
        event.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
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

  goToNotifications(): void {
    this.setActiveTab('notifications');
    this.showSettingsMenu = false;
    this.showProfileMenu = false;
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    this.notificationService.destroy();
  }
}