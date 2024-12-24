import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:3000/chat';

  constructor(private http: HttpClient) {}

  getMessages(senderId: string, receiverId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/messages/${senderId}/${receiverId}`);
  }

  sendMessage(messageData: { senderId: string; receiverId: string; content: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/messages`, messageData);
  }
}