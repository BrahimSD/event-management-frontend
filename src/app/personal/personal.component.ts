import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { LocationService } from '../core/services/location/location.service';

interface PersonalSettings {
  username: string;
  email: string;
  password: string;
  about: string;
  location: string;
}

@Component({
  selector: 'app-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})

export class PersonalComponent implements OnInit {
  settings: PersonalSettings = {
    username: '',
    email: '',
    password: '',
    about: '',
    location: ''
  };
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.loadUserSettings();
  }

  loadUserSettings() {
    const username = this.authService.getUsername();
    if (username) {
      this.userService.getUserDetails(username).subscribe({
        next: (user) => {
          this.settings = {
            username: user.username,
            email: user.email,
            password: '',
            about: user.about || '',
            location: user.location || ''
          };
        },
        error: (error) => {
          this.errorMessage = 'Failed to load user settings';
          console.error(error);
        }
      });
    }
  }

  saveChanges() {
    const updateData: any = {
      location: this.settings.location,
      about: this.settings.about
    };

    if (this.settings.password) {
      updateData.password = this.settings.password;
    }

    this.userService.updateUser({
      ...updateData,
      username: this.settings.username
    }).subscribe({
      next: () => {
        this.errorMessage = '';
        this.settings.password = '';
      },
      error: (error) => {
        this.errorMessage = 'Failed to update settings';
        console.error(error);
      }
    });
  }

  getCurrentLocation() {
    this.locationService.getCurrentLocation(
      (location: string) => {
        this.settings.location = location;
      },
      (error: string) => {
        this.errorMessage = error;
      }
    );
  }
}