import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { EventService } from '../event.service';
import { EventListComponent } from '../event-list/event-list.component';
import { EventFormComponent } from '../event-form/event-form.component';
import { UserService } from '../user.service';
import { PeopleComponent } from '../people/people.component';
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
    NotificationsComponent,
  ],
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
  private notificationSubscriptions: Subscription[] = [];
  private notificationInitialized = false;
  upcomingEvents: any[] = [];
  registeredEvents: any[] = [];
  createdEvents: any[] = [];
  followingCount: number = 0;
  private userAvatars = new Map<string, string>();

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
    
    // Initialiser les notifications une seule fois
    if (!this.notificationInitialized) {
      this.initializeNotifications();
      this.notificationInitialized = true;
    }
    
    this.loadDashboardData();

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

  private initializeNotifications() {
    // Souscrire aux notifications une seule fois
    this.notificationSubscriptions.push(
      this.notificationService.notificationCount$.subscribe(count => {
        this.unreadNotificationsCount = count;
      })
    );
  }

  ngOnDestroy() {
    // Nettoyer toutes les souscriptions
    if (this.notificationSubscriptions) {
      this.notificationSubscriptions.forEach(sub => sub.unsubscribe());
    }
    this.notificationInitialized = false;
    this.notificationService.destroy();
  }

  loadDashboardData() {
    const username = this.authService.getUsername();
    if (username) {
      // Charger les événements une seule fois
      this.notificationSubscriptions.push(
        this.eventService.getEvents().subscribe((events) => {
          const now = new Date();

          this.upcomingEvents = events
            .filter((event) => {
              const eventDate = new Date(event.date);
              return eventDate > now && event.status === 'upcoming';
            })
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .slice(0, 6);

          // Load avatars for organizers
          this.upcomingEvents.forEach((event) => {
            this.loadOrganizerAvatar(event.organizer);
          });

          this.registeredEvents = events.filter(
            (event) =>
              event.participants?.includes(username) &&
              event.status !== 'completed'
          );

          this.createdEvents = events.filter(
            (event) => event.organizer === username
          );

          this.events = this.upcomingEvents;
          this.filteredEvents = this.upcomingEvents;
        })
      );

      // Charger le nombre d'abonnements une seule fois
      this.notificationSubscriptions.push(
        this.userService.getUserDetails(username).subscribe((user) => {
          this.followingCount = user.following?.length || 0;
        })
      );

      // Ne rafraîchir le compte de notifications qu'une seule fois au chargement
      this.notificationService.refreshNotificationCount();
    }
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
        },
      });
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
      this.filteredEvents = this.events.filter(
        (event) =>
          event.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          event.description
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
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
    this.router.navigate(['dashboard', tab]);
    if (tab === 'profile') {
      this.refreshProfile();
    }
    if (tab === 'notifications') {
      this.notificationService.refreshNotificationCount();
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
      this.userService
        .getUserDetails(username)
        .subscribe((userDetails: any) => {
          this.selectedUser = userDetails;
        });
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

  getOrganizerAvatar(username: string): string {
    return this.userAvatars.get(username) || 'fas fa-user-circle';
  }

  isRegistered(event: any): boolean {
    const username = this.authService.getUsername();
    return event.participants?.includes(username) || false;
  }

  register(id: string): void {
    this.eventService.registerForEvent(id).subscribe(() => {
      this.loadDashboardData();
    });
  }
}
