import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { ChatService } from '../chat.service';
import { Socket, io } from 'socket.io-client';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="users-list">
        <div class="search-box">
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search users..." (input)="searchUsers()">
        </div>
        <div class="users">
          <div class="user-item" *ngFor="let user of filteredUsers" (click)="selectUser(user)"
               [class.active]="selectedUser?.username === user.username">
            <div class="user-info-wrapper">
              <div class="user-avatar">
                <img [src]="user.avatar" *ngIf="user.avatar; else defaultAvatar" [alt]="user.username">
                <ng-template #defaultAvatar>
                  <i class="fas fa-user-circle"></i>
                </ng-template>
                <span class="status-indicator" *ngIf="isUserOnline(user.username)"></span>
              </div>
              <div class="user-info">
                <span class="username">{{user.username}}</span>
                <span class="status-text" *ngIf="isUserOnline(user.username)">online</span>
                <div class="last-message" *ngIf="getLastMessage(user)">
                  <div class="message-preview">
                    <p>{{ getLastMessage(user).content | slice:0:30 }}{{ getLastMessage(user).content.length > 30 ? '...' : '' }}</p>
                    <span class="message-time">{{ getLastMessage(user).createdAt | date:'shortTime' }}</span>
                  </div>
                  <div class="message-count" *ngIf="getUnreadCount(user) > 0">
                    {{ getUnreadCount(user) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-content" *ngIf="selectedUser">
        <div class="chat-header">
          <div class="user-info-wrapper">
            <div class="user-avatar">
              <img [src]="selectedUser.avatar" *ngIf="selectedUser.avatar; else defaultAvatar" [alt]="selectedUser.username">
              <ng-template #defaultAvatar>
                <i class="fas fa-user-circle"></i>
              </ng-template>
              <span class="status-indicator" *ngIf="isUserOnline(selectedUser.username)"></span>
            </div>
            <div class="user-info">
              <span class="username">{{selectedUser.username}}</span>
              <span class="status-text" *ngIf="isUserOnline(selectedUser.username)">online</span>
            </div>
          </div>
        </div>

        <div class="messages" #messageContainer>
          <div *ngFor="let message of messages" 
               class="message" 
               [class.sent]="message.sender.username === currentUser"
               [class.received]="message.sender.username !== currentUser">
            <div class="message-content">{{message.content}}</div>
            <div class="message-time">{{message.createdAt | date:'shortTime'}}</div>
          </div>
        </div>

        <div class="message-input">
          <input type="text" [(ngModel)]="newMessage" placeholder="Type a message..." (keyup.enter)="sendMessage()">
          <button (click)="sendMessage()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  
  private userMessages = new Map<string, any[]>();
  private unreadMessages = new Map<string, number>();
  private lastReadTimes = new Map<string, Date>();
  private onlineUsers = new Set<string>();
  private socket: Socket;

  users: any[] = [];
  filteredUsers: any[] = [];
  selectedUser: any = null;
  messages: any[] = [];
  newMessage: string = '';
  searchTerm: string = '';
  currentUser: string;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    const username = this.authService.getUsername();
    this.currentUser = username || '';
    this.socket = io('http://localhost:3000/chat', {
      withCredentials: true,
      transports: ['websocket']
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.socket.emit('join', this.currentUser);
    });

    // Handle initial online users list
    this.socket.on('onlineUsers', (users: string[]) => {
    // Clear and set all online users
    this.onlineUsers.clear();
    users.forEach(username => this.onlineUsers.add(username));
    });
  
    // Online status
    this.socket.on('userConnected', (username: string) => {
      this.onlineUsers.add(username);
    });
  
    this.socket.on('userDisconnected', (username: string) => {
      this.onlineUsers.delete(username);
    });
  
    this.socket.on('newMessage', (message: any) => {
        // Check if message belongs to current chat
        const isCurrentChat = 
          (message.sender.username === this.currentUser && 
           message.receiver.username === this.selectedUser?.username) ||
          (message.sender.username === this.selectedUser?.username && 
           message.receiver.username === this.currentUser);
    
        if (isCurrentChat) {
          // Only add message if it's from the other user
          if (message.sender.username !== this.currentUser) {
            this.messages.push(message);
            this.scrollToBottom();
          }
        }
    
        // Update user messages list
        if (message.sender.username !== this.currentUser) {
          const userMessages = this.userMessages.get(message.sender.username) || [];
          if (!userMessages.some(m => m._id === message._id)) {
            userMessages.push(message);
            this.userMessages.set(message.sender.username, userMessages);
            
            if (message.sender.username !== this.selectedUser?.username) {
              this.updateUnreadCount(message.sender.username, userMessages);
            }
          }
        }
      });
  }

  isUserOnline(username: string): boolean {
    return this.onlineUsers.has(username);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUser) return;
  
    const messageData = {
      senderId: this.currentUser,
      receiverId: this.selectedUser.username,
      content: this.newMessage.trim()
    };
  
    const content = this.newMessage;
    this.newMessage = '';
  
    // Send through socket only
    this.socket.emit('sendMessage', messageData, (response: any) => {
      if (response) {
        // Only add message after server confirmation
        this.messages.push({
          _id: response._id,
          sender: { username: this.currentUser },
          receiver: { username: this.selectedUser.username },
          content: content,
          createdAt: new Date()
        });
        this.scrollToBottom();
      }
    });
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.messages = [];
    this.loadMessages();
    this.lastReadTimes.set(user.username, new Date());
    this.unreadMessages.set(user.username, 0);
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe(users => {
      this.users = users.filter(user => user.username !== this.currentUser);
      this.filteredUsers = [...this.users];
      this.users.forEach(user => {
        this.loadUserMessages(user);
      });
    });
  }

  searchUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(user => 
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  loadUserMessages(user: any) {
    this.chatService.getMessages(this.currentUser, user.username).subscribe(messages => {
      this.userMessages.set(user.username, messages);
      this.updateUnreadCount(user.username, messages);
    });
  }

  getLastMessage(user: any): any {
    const messages = this.userMessages.get(user.username) || [];
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }

  getUnreadCount(user: any): number {
    return this.unreadMessages.get(user.username) || 0;
  }

  updateUnreadCount(username: string, messages: any[]) {
    const lastRead = this.lastReadTimes.get(username) || new Date(0);
    const unreadCount = messages.filter(msg => 
      msg.sender.username === username && 
      new Date(msg.createdAt) > lastRead
    ).length;
    this.unreadMessages.set(username, unreadCount);
  }

  loadMessages() {
    if (!this.selectedUser || !this.currentUser) return;
    
    this.chatService.getMessages(this.currentUser, this.selectedUser.username)
      .subscribe(messages => {
        this.messages = messages;
        this.scrollToBottom();
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messageContainer?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}