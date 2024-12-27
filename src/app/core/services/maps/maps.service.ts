import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface WindowWithCallbacks extends Window {
  [key: string]: any;
}

declare const window: WindowWithCallbacks;

@Injectable({
  providedIn: 'root'
})
export class MapsService {
  private loaded = false;
  private loading: Promise<void> | null = null;
  private apiUrl = 'http://localhost:3000/config';

  constructor(private http: HttpClient) {}

  async loadGoogleMapsScript(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (this.loading) return this.loading;

    this.loading = new Promise<void>(async (resolve, reject) => {
      try {
        // Get API key from backend
        const response = await firstValueFrom(this.http.get<{apiKey: string}>(`${this.apiUrl}/maps-key`));
        const uniqueId = `googleMapsCallback_${Math.random().toString(36).substring(7)}`;
        
        window[uniqueId] = () => {
          this.loaded = true;
          resolve();
          delete window[uniqueId];
        };

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.async = true;
        script.defer = true;
        script.setAttribute('loading', 'async');
        
        const nonce = Math.random().toString(36).substring(7);
        script.setAttribute('nonce', nonce);
        
        const params = new URLSearchParams({
          libraries: 'places',
          callback: uniqueId,
          loading: 'async',
          nonce: nonce
        });
        script.src = `https://maps.googleapis.com/maps/api/js?${params}&key=${response.apiKey}`;
        
        script.onerror = (error) => {
          reject(error);
          delete window[uniqueId];
        };

        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });

    return this.loading;
  }
}