import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable ,catchError} from "rxjs";
import { map, tap } from 'rxjs/operators';
import { User, FollowResponse } from "./user.interface";


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';
  private profileUpdateSubject = new BehaviorSubject<boolean>(false);
  
  constructor(private http: HttpClient) {}

    updateProfile(userData: any): Observable<any> {
    const username = userData.username;
    return this.http.put<any>(`${this.apiUrl}/${username}/profile`, userData).pipe(
      tap(updatedUser => {
        // Notifier les autres composants du changement de profil
        this.notifyProfileUpdate();
      })
    );
  }

  getUserAvatar(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${username}/avatar`).pipe(
      map(response => ({
        avatar: response.avatar || null
      }))
    );
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(users => users.map(user => ({
        ...user,
        avatar: user.avatar || 'fas fa-user-circle'
      }))),
      catchError(error => {
        console.error('Error fetching users:', error);
        throw error;
      })
    );
  }
  
  getUserDetails(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${username}`).pipe(
      map(user => ({
        ...user,
        avatar: user.avatar || 'fas fa-user-circle',
        createdEvents: user.createdEvents || [],
        attendedEvents: user.attendedEvents || []
      })),
      catchError(error => {
        console.error('Error fetching user details:', error);
        throw error;
      })
    );
  }
  
  updateUser(userData: any): Observable<any> {
    const username = userData.username;
    return this.http.put<any>(`${this.apiUrl}/${username}`, userData);
  }

  notifyProfileUpdate() {
    this.profileUpdateSubject.next(true);
  }

  onProfileUpdate(): Observable<boolean> {
    return this.profileUpdateSubject.asObservable();
  }

  toggleFollow(username: string, shouldFollow: boolean): Observable<FollowResponse> {
    if (shouldFollow) {
      return this.followUser(username);
    }
    return this.unfollowUser(username);
  }

  followUser(username: string): Observable<FollowResponse> {
    return this.http.post<FollowResponse>(`${this.apiUrl}/${username}/follow`, {});
  }
  
  unfollowUser(username: string): Observable<FollowResponse> {
    return this.http.post<FollowResponse>(`${this.apiUrl}/${username}/unfollow`, {});
  }
}