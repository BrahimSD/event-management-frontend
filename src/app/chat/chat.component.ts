import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { ChatService } from '../chat.service';
import { Socket, io } from 'socket.io-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})

export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @Input() set selectedUser(value: any) {
    if (value) {
      this._selectedUser = value;
      this.loadMessages();
    }
  }
  get selectedUser() {
    return this._selectedUser;
  }
  
  private _selectedUser: any = null;
  private userMessages = new Map<string, any[]>();
  private unreadMessages = new Map<string, number>();
  private lastReadTimes = new Map<string, Date>();
  private onlineUsers = new Set<string>();
  private socket: Socket;

  users: any[] = [];
  filteredUsers: any[] = [];
  messages: any[] = [];
  newMessage: string = '';
  searchTerm: string = '';
  currentUser: string;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private router: Router
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

    this.route.queryParams.subscribe(params => {
      if (params['user']) {
        this.userService.getUserDetails(params['user']).subscribe(user => {
          if (user) {
            this.selectUser(user);
          }
        });
      }
    });
  }


  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.socket.emit('join', this.currentUser);
    });

    this.socket.on('onlineUsers', (users: string[]) => {
    this.onlineUsers.clear();
    users.forEach(username => this.onlineUsers.add(username));
    });
  
    this.socket.on('userConnected', (username: string) => {
      this.onlineUsers.add(username);
    });
  
    this.socket.on('userDisconnected', (username: string) => {
      this.onlineUsers.delete(username);
    });
  
    this.socket.on('newMessage', (message: any) => {
        const isCurrentChat = 
          (message.sender.username === this.currentUser && 
           message.receiver.username === this.selectedUser?.username) ||
          (message.sender.username === this.selectedUser?.username && 
           message.receiver.username === this.currentUser);
    
        if (isCurrentChat) {
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
  
    this.socket.emit('sendMessage', messageData, (response: any) => {
      if (response) {
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

    this.router.navigate([], {
      queryParams: { tab: 'messages', user: user.username },
      queryParamsHandling: 'merge' // Conserve les autres paramètres existants
    });
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