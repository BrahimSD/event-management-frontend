import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { User, FollowResponse } from '../user.interface';

@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class PeopleComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  following: Set<string> = new Set();
  currentUser: string | null = null;
  isProcessing: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.getUsername();
  }

  ngOnInit() {
    this.loadUsersAndFollowing();
  }

  loadUsersAndFollowing() {
    if (this.currentUser) {
      this.userService.getUserDetails(this.currentUser).subscribe({
        next: (currentUserDetails) => {
          this.following = new Set(currentUserDetails.following || []);
          this.loadAllUsers();
        },
        error: (error) => {
          console.error('Error loading following status:', error);
        }
      });
    }
  }

  loadAllUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.map(user => ({
          ...user,
          isFollowing: this.following.has(user.username)
        }));
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  toggleFollow(user: User) {
    if (!this.currentUser || this.isProcessing) return;
    
    this.isProcessing = true;
    const isCurrentlyFollowing = this.following.has(user.username);
    
    this.userService.toggleFollow(user.username, !isCurrentlyFollowing).subscribe({
      next: (response) => {
        if (isCurrentlyFollowing) {
          this.following.delete(user.username);
        } else {
          this.following.add(user.username);
        }

        // Update user in the list
        const userIndex = this.users.findIndex(u => u.username === user.username);
        if (userIndex !== -1) {
          this.users[userIndex] = {
            ...this.users[userIndex],
            followers: response.followers,
            following: response.following,
            isFollowing: !isCurrentlyFollowing
          };
        }

        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error toggling follow:', error);
        this.isProcessing = false;
      }
    });
  }

  isFollowing(user: User): boolean {
    const result = this.following.has(user.username);
    return result;
  }


  showUserDetails(user: User) {
    this.userService.getUserDetails(user.username).subscribe({
      next: (userDetails) => {
        this.selectedUser = {
          ...userDetails,
          isFollowing: this.following.has(userDetails.username)
        };
      },
      error: (error) => {
        console.error('Error loading user details:', error);
      }
    });
  }

  closeUserDetails() {
    this.selectedUser = null;
  }
  
  isCurrentUser(username: string): boolean {
    return this.currentUser === username;
  }
  
  startChat(user: User) {
    this.router.navigate(['/dashboard'], { 
      queryParams: { 
        tab: 'messages',
        user: user.username 
      }
    });
  }
}




