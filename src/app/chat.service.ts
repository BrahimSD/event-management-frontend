import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiBase}/chat`;

  constructor(private http: HttpClient) {}

  getMessages(senderId: string, receiverId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/messages/${senderId}/${receiverId}`);
  }

  sendMessage(messageData: { senderId: string; receiverId: string; content: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/messages`, messageData);
  }
}