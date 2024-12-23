import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
  })
  export class UserService {
    private apiUrl = 'http://localhost:3000/users';
  
    constructor(private http: HttpClient) {}
  
    getUserAvatar(username: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/${username}/avatar`);
    }

    getAllUsers(): Observable<any[]> {
      return this.http.get<any[]>(this.apiUrl);
    }
  
    getUserDetails(username: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/${username}`);
    }
  }