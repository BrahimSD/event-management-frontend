import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../auth.service';

export interface Driver {
  _id: string;
  username: string;
  avatar: string;
  departure: string;
  departureCoords?: {
    lat: number;
    lng: number;
  };
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventDate: Date;
  eventCoords?: {
    lat: number;
    lng: number;
  };
  seats: number;
  availableSeats?: number;
  departureTime: Date;
  available: boolean;
  passengers?: { 
    username: string;
    avatar: string;
  }[];
  driver?: {
    username: string;
    avatar: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CarsharingService {
  private apiUrl = 'http://localhost:3000/carsharing';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getDrivers(eventId?: string): Observable<Driver[]> {
    const url = eventId
      ? `${this.apiUrl}/events/${eventId}/drivers`
      : `${this.apiUrl}/drivers`;
    return this.http.get<Driver[]>(url);
  }

  updateCarSettings(settings: {
    seats: number;
    departureLocation: string;
    departureCoords?: { lat: number; lng: number };
    eventId: string;
    departureTime?: Date;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}`, settings);
  }

  updateExistingCarSharing(id: string, settings: {
    seats: number;
    departureLocation: string;
    departureCoords?: { lat: number; lng: number };
    eventId: string;
    departureTime?: Date;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, settings);
  }

  deleteCarSharing(eventId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${eventId}`);
  }
  
  joinRide(carSharingId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${carSharingId}/join`, {});
  }

  leaveRide(carSharingId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${carSharingId}/leave`, {});
  }
  
  getUserCarSharings(): Observable<any[]> {
    const username = this.authService.getUsername();
    return this.http.get<any[]>(`${this.apiUrl}/user/${username}`);
  }
  
  getUserRides(): Observable<any[]> {
    const username = this.authService.getUsername();
    return this.http.get<any[]>(`${this.apiUrl}/passenger/${username}`);
  }
}