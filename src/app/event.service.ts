import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:3000/events';

  constructor(private http: HttpClient) {}

  createEvent(event: any): Observable<any> {
    return this.http.post(this.apiUrl, event);
  }

  getEvents(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getEvent(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateEvent(id: string, event: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  registerForEvent(eventId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/register`, {});
  }
  
  unregisterFromEvent(eventId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/unregister`, {});
  }
}