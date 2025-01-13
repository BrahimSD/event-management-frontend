import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:3000/events';
  private eventsUpdated = new Subject<void>();

  constructor(private http: HttpClient) {}

  getEventsUpdateListener() {
    return this.eventsUpdated.asObservable();
  }

  createEvent(event: any): Observable<any> {
    return this.http.post(this.apiUrl, event).pipe(
      tap(() => {
        this.eventsUpdated.next();
      })
    );
  }

  searchEvents(searchTerm: string): Observable<any[]> {
    return this.getEvents().pipe(
      map(events => events.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
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