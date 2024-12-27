import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';



@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class PeopleComponent implements OnInit {
  users: any[] = [];
  selectedUser: any = null;
  following: Set<string> = new Set();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadFollowing();
  }

  loadFollowing() {
    const username = this.authService.getUsername();
    if (username) {
      this.userService.getUserDetails(username).subscribe(user => {
        this.following = new Set(user.following?.map((u: any) => u.username) || []);
      });
    }
  }

  startChat(user: any) {
    // Navigate to messages tab with selected user
    this.router.navigate(['/dashboard'], { 
      queryParams: { 
        tab: 'messages',
        user: user.username 
      }
    });
  }

  isFollowing(user: any): boolean {
    return this.following.has(user.username);
  }

  toggleFollow(user: any) {
    const isCurrentlyFollowing = this.isFollowing(user);
    this.userService.toggleFollow(user.username, !isCurrentlyFollowing).subscribe({
      next: () => {
        if (isCurrentlyFollowing) {
          this.following.delete(user.username);
        } else {
          this.following.add(user.username);
        }
      },
      error: (error) => {
        console.error('Error toggling follow:', error);
      }
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe(users => {
      this.users = users;
    });
  }

  showUserDetails(user: any) {
    this.userService.getUserDetails(user.username).subscribe(userDetails => {
      this.selectedUser = userDetails;
    });
  }

  closeUserDetails() {
    this.selectedUser = null;
  }

  isCurrentUser(username: string): boolean {
    return username === this.authService.getUsername();
  }
}