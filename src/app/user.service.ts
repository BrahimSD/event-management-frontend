import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable ,catchError} from "rxjs";
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';
  private profileUpdateSubject = new BehaviorSubject<boolean>(false);
  
  constructor(private http: HttpClient) {}

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

  toggleFollow(username: string, shouldFollow: boolean): Observable<any> {
    const endpoint = shouldFollow ? 'follow' : 'unfollow';
    return this.http.post<any>(`${this.apiUrl}/${username}/${endpoint}`, {});
  }
}