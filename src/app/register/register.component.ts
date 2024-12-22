import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [FormsModule, HttpClientModule, RouterModule, CommonModule]
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  role: string = 'participant'; 
  errorMessage: string = '';
  avatarPreview: string | null = null;
  avatarFile: File | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    if (!this.username || !this.password || !this.role) {
      this.errorMessage = 'All fields are required';
      return;
    }
  
    const userData = {
      username: this.username,
      password: this.password,
      role: this.role,
      avatar: this.avatarPreview // Include the base64 image data
    };
  
    this.authService.register(userData).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage = 'Username already exists';
        } else {
          this.errorMessage = 'Registration failed';
        }
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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
}