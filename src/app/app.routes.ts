import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { EventListComponent } from './event-list/event-list.component';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { EventFormComponent } from './event-form/event-form.component';
import { PeopleComponent } from './people/people.component';
import { ProfileComponent } from './profile/profile.component';
import { ChatComponent } from './chat/chat.component';
import { CalendarComponent } from './calendar/calendar.component';
import { NotificationsComponent } from './notifications/notifications.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: '', 
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: EventListComponent },
      { path: 'events', component: EventListComponent },
      { path: 'events/:id', component: EventDetailComponent },
      { path: 'events/:id/edit', component: EventFormComponent },
      { path: 'people', component: PeopleComponent },
      { path: 'messages', component: ChatComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'notifications', component: NotificationsComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];