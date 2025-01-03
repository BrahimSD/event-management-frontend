import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../auth.service';
import { Notification } from '../notification.interface';

interface NotificationSettings {
  eventReminders: boolean;
  registrationConfirmation: boolean;
  newEventsFromFollowed: boolean;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [CommonModule , FormsModule]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  emailNotifications: NotificationSettings = {
    eventReminders: true,
    registrationConfirmation: true,
    newEventsFromFollowed: true
  };

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.loadNotificationSettings();
  }

  loadNotifications() {
    const username = this.authService.getUsername();
    if (username) {
      this.notificationService.getNotifications(username).subscribe({
        next: (notifications) => {
          this.notifications = notifications;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
        }
      });
    }
  }

  loadNotificationSettings() {
    const username = this.authService.getUsername();
    if (username) {
      this.notificationService.getNotificationSettings(username).subscribe({
        next: (settings: NotificationSettings) => {
          this.emailNotifications = settings;
        },
        error: (error: Error) => {
          console.error('Error loading notification settings:', error);
        }
      });
    }
  }

  updateNotificationSettings() {
    const username = this.authService.getUsername();
    if (username) {
      this.notificationService.updateNotificationSettings(username, this.emailNotifications).subscribe({
        next: () => {
          console.log('Notification settings updated');
        },
        error: (error: Error) => {
          console.error('Error updating notification settings:', error);
        }
      });
    }
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  deleteNotification(notificationId: string) {
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }
}