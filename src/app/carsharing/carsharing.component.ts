import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { CarsharingService, Driver } from '../core/services/carsharing/carsharing.service';
import { AuthService } from '../auth.service';
import { EventService } from '../event.service';
import { Router, RouterModule } from '@angular/router';
import { MapsService } from '../core/services/maps/maps.service';

@Component({
  selector: 'app-carsharing',
  templateUrl: './carsharing.component.html',
  styleUrls: ['./carsharing.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, RouterModule],
})
export class CarsharingComponent implements OnInit {
  // Main data
  drivers: Driver[] = [];
  filteredDrivers: Driver[] = [];
  userRides: any[] = [];
  userCarSharings: any[] = [];
  searchLocation: string = '';
  
  // Map related properties
  center = { lat: 46.227638, lng: 2.213749 }; // Center of France
  zoom = 6;
  markers: any[] = [];
  mapInitialized = false;
  selectedDriver: Driver | null = null;
  directionsService: google.maps.DirectionsService | null = null;
  directionsRenderer: google.maps.DirectionsRenderer | null = null;
  mapInstance: google.maps.Map | null = null;
  markerOptions: any = {};
  destinationMarkerOptions: any = {};
  
  activeTab = 'available';
  currentUsername: string = '';
  events: any[] = []; 
  
  joinedRideIds: Set<string> = new Set();

  @ViewChild('mapContainer', { static: false }) mapContainer: any;

  constructor(
    private carsharingService: CarsharingService,
    private authService: AuthService,
    private eventService: EventService,
    private router: Router,
    private mapsService: MapsService
  ) {
    this.currentUsername = this.authService.getUsername() || '';
  }

  async ngOnInit() {
    try {
      await this.initializeMap();
      await this.loadEvents();
      await this.loadDrivers();
      await this.loadUserRides();
      await this.loadUserCarSharings();
    } catch (error) {
      console.error('Error initializing carsharing:', error);
    }
  }

  private async initializeMap() {
    try {
      await this.mapsService.loadGoogleMapsScript();
      
      this.markerOptions = {
        animation: google.maps.Animation.DROP,
        icon: {
          url: 'assets/car-marker.svg', 
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 16)
        }
      };
      
      this.destinationMarkerOptions = {
        animation: google.maps.Animation.DROP,
        icon: {
          url: 'assets/event-marker.svg',
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 16)
        }
      };
      
      this.mapInitialized = true;
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }

  setActiveTab(tabName: string) {
    this.activeTab = tabName;
    if (tabName === 'available') {
      setTimeout(() => {
        this.updateMarkers();
      }, 100);
    }
  }

  loadEvents() {
    return new Promise<void>((resolve) => {
      this.eventService.getEvents().subscribe({
        next: (events) => {
          this.events = events;
          resolve();
        },
        error: (error) => {
          console.error('Error loading events:', error);
          resolve();
        }
      });
    });
  }

  loadDrivers() {
    return new Promise<void>((resolve) => {
      this.carsharingService.getDrivers().subscribe({
        next: (drivers: Driver[]) => {
          this.drivers = drivers;
          this.filteredDrivers = drivers;
          
          // Enrichir chaque conducteur avec les informations de l'événement
          this.drivers.forEach(driver => {
            this.enrichDriverWithEventInfo(driver);
          });
          
          this.updateMarkers();
          resolve();
        },
        error: (error) => {
          console.error('Error loading drivers:', error);
          resolve();
        },
      });
    });
  }

  loadUserRides() {
    return new Promise<void>((resolve) => {
      if (!this.currentUsername) {
        resolve();
        return;
      }
      
      this.carsharingService.getUserRides().subscribe({
        next: (rides) => {
          this.userRides = rides;
          this.joinedRideIds = new Set(rides.map(ride => ride._id));
          resolve();
        },
        error: (error) => {
          console.error('Error loading user rides:', error);
          resolve();
        }
      });
    });
  }

  loadUserCarSharings() {
    return new Promise<void>((resolve) => {
      if (!this.currentUsername) {
        resolve();
        return;
      }
      
      this.carsharingService.getUserCarSharings().subscribe({
        next: (offerings) => {
          this.userCarSharings = offerings;
          resolve();
        },
        error: (error) => {
          console.error('Error loading user car sharings:', error);
          resolve();
        }
      });
    });
  }

  enrichDriverWithEventInfo(driver: Driver) {
    if (driver.eventId) {
      const event = this.events.find(e => e._id === driver.eventId);
      if (event) {
        driver.eventName = event.name || driver.eventName;
        
        if (!driver.eventLocation && event.location) {
          driver.eventLocation = event.location;
          console.log(`Set event location for ${driver.username}: ${driver.eventLocation}`);
          
          if (!driver.eventCoords && event.location) {
            this.geocodeEventLocation(driver, event.location);
          }
        }
        
        if (event.date) {
          driver.eventDate = new Date(event.date);
        }
      } else {
        console.log(`Event with ID ${driver.eventId} not found for driver ${driver.username}`);
      }
    } else {
      console.log(`Driver ${driver.username} has no eventId`);
    }
  }

  private geocodeEventLocation(driver: Driver, location: string) {
    if (!this.mapInitialized) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: location },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const loc = results[0].geometry.location;
          driver.eventCoords = {
            lat: loc.lat(),
            lng: loc.lng()
          };
          driver.eventLocation = results[0].formatted_address;
          this.updateMarkers();
        }
      }
    );
  }

  getEventLocation(eventId: string): string {
    if (!eventId) return '';
    const event = this.events.find(e => e._id === eventId);
    return event ? event.location : '';
  }

  private updateMarkers() {
    if (!this.mapInitialized) return;

    this.markers = [];

    this.filteredDrivers
      .filter((driver) => driver.departure)
      .forEach((driver) => {
        if (driver.departureCoords?.lat && driver.departureCoords?.lng) {
          this.markers.push({
            position: {
              lat: Number(driver.departureCoords.lat),
              lng: Number(driver.departureCoords.lng),
            },
            title: `${driver.username} (départ)`,
            options: this.markerOptions,
          });
        } else {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { address: driver.departure },
            (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
              if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                const location = results[0].geometry.location;
                driver.departureCoords = {
                  lat: location.lat(),
                  lng: location.lng()
                };
                this.markers.push({
                  position: {
                    lat: location.lat(),
                    lng: location.lng(),
                  },
                  title: `${driver.username} (départ)`,
                  options: this.markerOptions,
                });
              }
            }
          );
        }
        
        const eventLocation = driver.eventLocation || this.getEventLocation(driver.eventId);
        if (eventLocation) {
          if (driver.eventCoords?.lat && driver.eventCoords?.lng) {
            this.markers.push({
              position: {
                lat: Number(driver.eventCoords.lat),
                lng: Number(driver.eventCoords.lng),
              },
              title: `${driver.eventName} (événement)`,
              options: this.destinationMarkerOptions,
            });
          } else {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode(
              { address: eventLocation },
              (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                  const location = results[0].geometry.location;
                  driver.eventCoords = {
                    lat: location.lat(),
                    lng: location.lng()
                  };
                  this.markers.push({
                    position: {
                      lat: location.lat(),
                      lng: location.lng(),
                    },
                    title: `${driver.eventName} (événement)`,
                    options: this.destinationMarkerOptions,
                  });
                }
              }
            );
          }
        }
      });
  }

  centerMapOnDriver(driver: Driver) {
    this.selectedDriver = driver;
    
    if (!driver.departureCoords?.lat || !driver.departureCoords?.lng) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: driver.departure },
        (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const location = results[0].geometry.location;
            driver.departureCoords = {
              lat: location.lat(),
              lng: location.lng()
            };
            this.calculateAndDisplayRoute(driver);
          }
        }
      );
    } else if (!driver.eventCoords?.lat || !driver.eventCoords?.lng) {
      const eventLocation = driver.eventLocation || this.getEventLocation(driver.eventId);
      if (eventLocation) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { address: eventLocation },
          (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
              const location = results[0].geometry.location;
              driver.eventCoords = {
                lat: location.lat(),
                lng: location.lng()
              };
              setTimeout(() => this.calculateAndDisplayRoute(driver), 100);
            }
          }
        );
      }
    } else {
      this.calculateAndDisplayRoute(driver);
    }
  }

  calculateAndDisplayRoute(driver: Driver) {
    if (!this.directionsService) {
      this.directionsService = new google.maps.DirectionsService();
    }
    
    if (!this.directionsRenderer) {
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3498db',
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
      this.directionsRenderer.setMap(this.mapInstance!);
    }

    if (!driver.departureCoords || !driver.eventCoords) return;

    this.directionsService.route(
      {
        origin: new google.maps.LatLng(
          driver.departureCoords.lat, 
          driver.departureCoords.lng
        ),
        destination: new google.maps.LatLng(
          driver.eventCoords.lat, 
          driver.eventCoords.lng
        ),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          this.directionsRenderer!.setDirections(response);
        } else {
          console.error("Erreur lors du calcul de l'itinéraire:", status);
        }
      }
    );
  }

  resetRoute() {
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3498db',
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
      this.directionsRenderer.setMap(this.mapInstance!);
    }
    this.selectedDriver = null;
    this.center = { lat: 46.227638, lng: 2.213749 };
    this.zoom = 6;
    this.updateMarkers();
  }

  filterDrivers() {
    if (!this.searchLocation.trim()) {
      this.filteredDrivers = [...this.drivers];
    } else {
      const searchTerm = this.searchLocation.toLowerCase();
      this.filteredDrivers = this.drivers.filter(
        (driver) =>
          driver.departure?.toLowerCase().includes(searchTerm) ||
          driver.username.toLowerCase().includes(searchTerm) ||
          driver.eventName?.toLowerCase().includes(searchTerm) ||
          driver.eventLocation?.toLowerCase().includes(searchTerm)
      );
    }
    this.updateMarkers();
  }

  contactDriver(driver: any) {
    this.router.navigate(['/messages'], { 
      queryParams: { 
        tab: 'messages',
        user: driver.username 
      } 
    });
  }

  isUserJoined(carSharingId: string): boolean {
    return this.joinedRideIds.has(carSharingId);
  }

  isUserDriver(driver: Driver): boolean {
    return this.currentUsername === driver.username;
  }

  getAvailableSeats(driver: Driver): number {
    if (driver.availableSeats !== undefined) {
      return driver.availableSeats;
    }
    const passengersCount = driver.passengers ? driver.passengers.length : 0;
    return Math.max(0, driver.seats - passengersCount);
  }

  joinThisRide(carSharingId: string) {
    if (!this.currentUsername) {
      this.router.navigate(['/login']);
      return;
    }

    this.carsharingService.joinRide(carSharingId).subscribe({
      next: () => {
        this.joinedRideIds.add(carSharingId);
        this.loadUserRides();
        this.loadDrivers(); 
      },
      error: (error) => {
        console.error('Error joining ride:', error);
        alert(error.error.message || "Impossible de rejoindre ce covoiturage");
      }
    });
  }

  leaveThisRide(carSharingId: string) {
    if (!this.currentUsername) {
      this.router.navigate(['/login']);
      return;
    }

    this.carsharingService.leaveRide(carSharingId).subscribe({
      next: () => {
        this.joinedRideIds.delete(carSharingId);
        this.loadUserRides();
        this.loadDrivers(); 
      },
      error: (error) => {
        console.error('Error leaving ride:', error);
        alert(error.error.message || "Impossible de quitter ce covoiturage");
      }
    });
  }

  deleteOffer(eventId: string) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette offre de covoiturage?")) {
      this.carsharingService.deleteCarSharing(eventId).subscribe({
        next: () => {
          this.loadUserCarSharings();
          this.loadDrivers();
        },
        error: (error) => {
          console.error('Error deleting carsharing offer:', error);
          alert(error.error.message || "Impossible de supprimer cette offre");
        }
      });
    }
  }

  onMapInit(map: google.maps.Map) {
    this.mapInstance = map;
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(map);
    }
  }
}