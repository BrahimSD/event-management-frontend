import { Injectable } from '@angular/core';
import { MapsService } from '../maps/maps.service';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  constructor(private mapsService: MapsService) {}

  async initGooglePlaces(input: HTMLInputElement, setLocation: (location: string) => void) {
    try {
      await this.mapsService.loadGoogleMapsScript();
      
      if (!input) return;

      const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'FR' },
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['geocode']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setLocation(place.formatted_address);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places:', error);
    }
  }

  async getCurrentLocation(setLocation: (location: string) => void, setError: (error: string) => void) {
    try {
      await this.mapsService.loadGoogleMapsScript();

      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geocoder = new google.maps.Geocoder();
          const latlng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          geocoder.geocode({ location: latlng }, (results: any, status: any) => {
            if (status === 'OK') {
              if (results[0]) {
                const franceAddress = results.find((result: any) => 
                  result.formatted_address.includes('France')
                );
                
                if (franceAddress) {
                  setLocation(franceAddress.formatted_address);
                } else {
                  setError('Location must be in France');
                }
              } else {
                setError('No results found');
              }
            } else {
              setError('Geocoder failed: ' + status);
            }
          });
        },
        (error) => {
          switch(error.code) {
            case error.PERMISSION_DENIED:
              setError('Location permission denied');
              break;
            case error.POSITION_UNAVAILABLE:
              setError('Location information unavailable');
              break;
            case error.TIMEOUT:
              setError('Location request timed out');
              break;
            default:
              setError('An unknown error occurred');
          }
        }
      );
    } catch (error) {
      setError('Error loading Google Maps');
    }
  }
}