import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { LocationService } from '../core/services/location/location.service';

interface UserProfile {
  username: string;
  email: string;
  role: string;
  about?: string;
  location?: string;
  avatar?: string;
  createdEvents?: any[];
  attendedEvents?: any[];
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ProfileComponent implements OnInit {
  user: UserProfile | null = null;
  isEditing = false;
  errorMessage = '';
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    const username = this.authService.getUsername();
    if (username) {
      this.userService.getUserDetails(username).subscribe({
        next: (userDetails: UserProfile) => {
          this.user = userDetails;
        },
        error: (error: Error) => {
          console.error('Error loading profile:', error);
          this.errorMessage = 'Failed to load profile';
        }
      });
    }
  }

  saveChanges() {
    if (this.user) {
      this.userService.updateUser(this.user).subscribe({
        next: (updatedUser: UserProfile) => {
          this.user = updatedUser;
          this.isEditing = false;
          this.authService.updateUserInfo({
            ...updatedUser,
            avatar: updatedUser.avatar
          });
          this.refreshDashboardProfile();
        },
        error: (error: Error) => {
          console.error('Error updating profile:', error);
          this.errorMessage = 'Failed to update profile';
        }
      });
    }
  }

  private refreshDashboardProfile() {
    this.userService.notifyProfileUpdate();
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (this.user && e.target?.result) {
          this.user.avatar = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  getCurrentLocation() {
    this.locationService.getCurrentLocation(
      (location: string) => {
        if (this.user) {
          this.user.location = location;
        }
      },
      (error: string) => {
        this.errorMessage = error;
      }
    );
  }

    onEditClick() {
    if (this.isEditing) {
      this.saveChanges();
    } else {
      this.isEditing = true;
    }
  }
}