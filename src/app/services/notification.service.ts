import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth.service';
import { Notification } from '../notification.interface';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

interface NotificationSettings {
  eventReminders: boolean;
  registrationConfirmation: boolean;
  newEventsFromFollowed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiBase}/notifications`;
  private socket: Socket;
  private notificationCountSubject = new BehaviorSubject<number>(0);
  notificationCount$ = this.notificationCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.socket = io(`${environment.apiBase}/notifications`);
    this.setupSocketConnection();
  }

  private setupSocketConnection() {
    const username = this.authService.getUsername();
    if (username) {
      this.socket.emit('join', username);
      
      this.socket.on('newNotification', (notification: Notification) => {
        this.getNotifications(username).subscribe(notifications => {
          const unreadCount = notifications.filter(n => !n.read).length;
          this.notificationCountSubject.next(unreadCount);
        });
      });
    }
  }

  getNotifications(username: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/${username}`);
  }

  getNotificationSettings(username: string): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.apiUrl}/settings/${username}`);
  }

  updateNotificationSettings(username: string, settings: NotificationSettings): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${this.apiUrl}/settings/${username}`, settings);
  }

  markAsRead(notificationId: string): Observable<any> {
    const result = this.http.put(`${this.apiUrl}/${notificationId}/read`, {});
    result.subscribe(() => this.refreshNotificationCount());
    return result;
  }

  deleteNotification(notificationId: string): Observable<any> {
    const result = this.http.delete(`${this.apiUrl}/${notificationId}`);
    result.subscribe(() => this.refreshNotificationCount());
    return result;
  }

  refreshNotificationCount() {
    const username = this.authService.getUsername();
    if (username) {
      this.getNotifications(username).subscribe(notifications => {
        const unreadCount = notifications.filter(n => !n.read).length;
        this.notificationCountSubject.next(unreadCount);
      });
    }
  }

  destroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}