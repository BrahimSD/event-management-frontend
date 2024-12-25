import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUsers();
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