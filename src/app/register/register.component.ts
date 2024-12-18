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

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    if (!this.username || !this.password || !this.role) {
      this.errorMessage = 'All fields are required';
      return;
    }

    this.authService.register(this.username, this.password, this.role).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage = 'Username already exists';
        } else if (err.status === 400) {
          this.errorMessage = 'Invalid input';
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
}