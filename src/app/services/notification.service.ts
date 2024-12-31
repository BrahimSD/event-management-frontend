import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth.service';
import { Notification } from '../notification.interface';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/notifications';
  private notificationCountSubject = new BehaviorSubject<number>(0);
  notificationCount$ = this.notificationCountSubject.asObservable();


  constructor(    
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getNotifications(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${username}`);
  }

  getNotificationSettings(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/settings/${username}`);
  }

  updateNotificationSettings(username: string, settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/${username}`, settings);
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${notificationId}/read`, {});
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`);
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
}