import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { LocationService } from '../core/services/location/location.service';
import { CarsharingService } from '../core/services/carsharing/carsharing.service';
import { EventService } from '../event.service';

interface UserProfile {
  username: string;
  email: string;
  role: string;
  password: string;
  about: string;
  location: string;
  avatar: string;
  createdEvents?: any[];
  attendedEvents?: any[];
  hasCar: boolean;
  carSettings: {
    seats: number;
    departureLocation: string;
    departureCoords?: {
      lat: number;
      lng: number;
    };
    eventId?: string;
    departureTime?: Date;
  };
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ProfileComponent implements OnInit {
  @ViewChild('departureLocationInput') departureLocationInput!: ElementRef;
  
  user: UserProfile = {
    username: '',
    email: '',
    role: '',
    password: '',
    about: '',
    location: '',
    avatar: '',
    hasCar: false,
    carSettings: {
      seats: 4,
      departureLocation: '',
      departureCoords: undefined,
      eventId: '',
      departureTime: new Date()
    },
  };

  isEditing = false;
  errorMessage = '';
  availableEvents: any[] = [];
  selectedEventId: string = '';
  currentUsername: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private locationService: LocationService,
    private carsharingService: CarsharingService,
    private eventService: EventService
  ) {
    // Stocker le nom d'utilisateur au moment de l'initialisation
    this.currentUsername = this.authService.getUsername() || '';
  }

  ngAfterViewInit() {
    if (this.user.hasCar) {
      this.initLocationAutocomplete();
    }
  }

  private initLocationAutocomplete() {
    setTimeout(() => {
      if (this.departureLocationInput?.nativeElement) {
        this.locationService.initGooglePlaces(
          this.departureLocationInput.nativeElement,
          (location: string) => {
            this.user.carSettings!.departureLocation = location;
          }
        );
      }
    }, 1000);
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadAvailableEvents();
  }

  loadUserProfile() {
    if (this.currentUsername) {
      this.userService.getUserDetails(this.currentUsername).subscribe({
        next: (userDetails: UserProfile) => {
          this.user = {
            ...userDetails,
            avatar: userDetails.avatar || '',
            about: userDetails.about || '',
            location: userDetails.location || '',
            hasCar: userDetails.hasCar ?? false,
            carSettings: {
              seats: userDetails.carSettings?.seats ?? 4,
              departureLocation: userDetails.carSettings?.departureLocation ?? userDetails.location ?? '',
              departureCoords: userDetails.carSettings?.departureCoords,
              eventId: userDetails.carSettings?.eventId ?? '',
              departureTime: userDetails.carSettings?.departureTime ?? new Date()
            }
          };
          
          if (this.user.carSettings.eventId) {
            this.selectedEventId = this.user.carSettings.eventId;
          }

          if (this.user.hasCar) {
            this.initLocationAutocomplete();
          }
        },
        error: (error: Error) => {
          console.error('Error loading profile:', error);
          this.errorMessage = 'Failed to load profile';
        },
      });
    }
  }

  loadAvailableEvents() {
    if (this.currentUsername) {
      this.eventService.getEvents().subscribe(events => {
        this.availableEvents = events.filter(event => 
          event.participants?.includes(this.currentUsername) && 
          event.status !== 'completed' &&
          new Date(event.date) > new Date()
        );
      });
    }
  }
  
  onEventSelected() {
    if (this.selectedEventId && this.user.carSettings) {
      const selectedEvent = this.availableEvents.find(event => event._id === this.selectedEventId);
      if (selectedEvent) {
        this.user.carSettings.eventId = selectedEvent._id;
        const eventDate = new Date(selectedEvent.date);
        eventDate.setHours(eventDate.getHours() - 2);
        this.user.carSettings.departureTime = eventDate;
      }
    }
  }

  saveUserProfile() {
    // Vérification que l'utilisateur est bien identifié
    if (!this.currentUsername) {
      this.errorMessage = 'User not authenticated';
      return;
    }
  
    // Vérifier que l'événement est sélectionné
    if (this.user.hasCar && !this.selectedEventId) {
      this.errorMessage = 'Please select an event';
      return;
    }
  
    const carSettings = this.user.hasCar ? {
      seats: this.user.carSettings.seats,
      departureLocation: this.user.carSettings.departureLocation,
      departureCoords: this.user.carSettings.departureCoords,
      eventId: this.selectedEventId,
      departureTime: this.user.carSettings.departureTime
    } : null;
    
    // Mise à jour des paramètres de covoiturage via le service dédié
    if (this.user.hasCar && carSettings) {
      this.carsharingService.updateCarSettings(carSettings).subscribe({
        next: () => {
          console.log('Car settings updated successfully');
          
          // Mettre à jour le profil utilisateur pour refléter qu'il a une voiture
          this.userService.updateUser({
            ...this.user, 
            username: this.currentUsername,
            hasCar: true
          }).subscribe({
            next: (updatedUser) => {
              this.user = updatedUser;
              this.errorMessage = '';
              this.refreshDashboardProfile();
              this.loadUserProfile(); // Recharger le profil
            },
            error: (error) => {
              console.error('Error updating user profile:', error);
              this.errorMessage = 'Failed to update profile';
            }
          });
        },
        error: (error) => {
          console.error('Error updating car settings:', error);
          this.errorMessage = 'Failed to update car settings';
        }
      });
    } else {
      // Si l'utilisateur désactive l'option voiture
      this.userService.updateUser({
        ...this.user,
        username: this.currentUsername,
        hasCar: false
      }).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.errorMessage = '';
          this.refreshDashboardProfile();
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.errorMessage = 'Failed to update profile';
        }
      });
    }
  }

  saveChanges() {
    if (this.user && this.currentUsername) {
      this.userService.updateUser({...this.user, username: this.currentUsername}).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.isEditing = false;
          this.authService.updateUserInfo({
            ...updatedUser,
            avatar: updatedUser.avatar,
          });
          this.refreshDashboardProfile();
        },
        error: (error: Error) => {
          console.error('Error updating profile:', error);
          this.errorMessage = 'Failed to update profile';
        },
      });
    }
  }

  private refreshDashboardProfile() {
    this.userService.notifyProfileUpdate();
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.user) {
          this.user.avatar = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  getCurrentLocation() {
    this.locationService.getCurrentLocation(
      (location: string) => {
        this.user.location = location;
      },
      (error: string) => {
        this.errorMessage = error;
      }
    );
  }

  getCurrentDepartureLocation() {
    this.locationService.getCurrentLocation(
      (location: string) => {
        this.user.carSettings!.departureLocation = location;
      },
      (error: string) => {
        this.errorMessage = error;
      }
    );
  }

  onEditClick() {
    if (this.isEditing) {
      this.saveChanges();
    } else {
      this.isEditing = true;
    }
  }

  async updateProfile() {
    if (!this.currentUsername) {
      this.errorMessage = 'User not authenticated';
      return;
    }
  
    try {
      if (this.user.hasCar && this.user.carSettings) {
        await this.carsharingService
          .updateCarSettings({
            seats: this.user.carSettings.seats,
            departureLocation: this.user.carSettings.departureLocation || this.user.location || '',
            departureCoords: this.user.carSettings.departureCoords,
            eventId: this.selectedEventId || '',
            departureTime: this.user.carSettings.departureTime
          })
          .toPromise();
      }
  
      this.saveChanges();
    } catch (error) {
      console.error('Error updating car settings:', error);
      this.errorMessage = 'Failed to update car settings';
    }
  }

  increaseSeats() {
    if (this.user.carSettings!.seats < 8) {
      this.user.carSettings!.seats++;
    }
  }
  
  decreaseSeats() {
    if (this.user.carSettings!.seats > 1) {
      this.user.carSettings!.seats--;
    }
  }
}