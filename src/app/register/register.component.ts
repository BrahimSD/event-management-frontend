import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { LocationService } from '../core/services/location/location.service';

declare const google: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [FormsModule, HttpClientModule, RouterModule, CommonModule]
})
export class RegisterComponent implements AfterViewInit {
  user = {
    username: '',
    email: '',
    password: '',
    about: '',
    location: '',
    role: 'participant',
    avatar: null as string | null
  };
  
  errorMessage: string = '';
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  locationOptions: any[] = [];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private locationService : LocationService
  ) {}

  register() {
    if (!this.validateForm()) {
      return;
    }

    const userData = {
      username: this.user.username,
      email: this.user.email,
      password: this.user.password,
      role: this.user.role,
      avatar: this.avatarPreview,
      about: this.user.about,
      location: this.user.location
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 409) {
          if (err.error.message.includes('Username')) {
            this.errorMessage = 'Username already exists';
          } else if (err.error.message.includes('Email')) {
            this.errorMessage = 'Email already exists';
          } else {
            this.errorMessage = err.error.message;
          }
        } else {
          this.errorMessage = 'Registration failed';
        }
      }
    });
  }

  validateForm(): boolean {
    if (!this.user.username || !this.user.email || !this.user.password || !this.user.location) {
      this.errorMessage = 'Username, email, password and location are required';
      return false;
    }
    if (!this.validateEmail(this.user.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }
    if (this.user.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return false;
    }
    return true;
  }

  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  ngAfterViewInit() {
    const input = document.getElementById('location') as HTMLInputElement;
    this.locationService.initGooglePlaces(input, (location: string) => {
      this.user.location = location;
    });
  }

  getCurrentLocation() {
    this.locationService.getCurrentLocation(
      (location: string) => {
        this.user.location = location;
      },
      (error: string) => {
        this.errorMessage = error;
      }
    );
  }
}