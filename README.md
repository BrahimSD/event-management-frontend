# Frontend - Event Management App

Application Angular pour la gestion d'événements avec interface moderne, carsharing et chat en temps réel.

## Technologies

- **Framework**: Angular 17
- **Langage**: TypeScript
- **Styles**: SCSS
- **Icons**: Font Awesome
- **HTTP Client**: Angular HttpClient
- **Maps**: Google Maps Integration

## Installation

```bash
npm install
```

## Scripts Disponibles

```bash
# Développement
ng serve                   # Serveur de développement (http://localhost:4200)
ng serve --open           # Ouvre automatiquement le navigateur

# Build
ng build                   # Build pour le développement
ng build --configuration production # Build pour la production

```

## Structure du Projet

```
src/app/
├── auth/                  # Authentification (login/register)
├── dashboard/             # Tableau de bord principal
├── events/               # Gestion des événements
├── event-form/           # Formulaire création/édition événement
├── event-detail/         # Détails d'un événement
├── carsharing/           # Module de carsharing avec cartes
├── chat/                 # Chat en temps réel
├── people/               # Gestion des utilisateurs/contacts
├── profile/              # Profil utilisateur avec paramètres voiture
├── notifications/        # Centre de notifications
├── calendar/             # Vue calendrier des événements
└── guards/               # Guards de protection des routes
```

## Fonctionnalités Principales

### 🏠 Dashboard
- Vue d'ensemble des événements à venir
- Statistiques personnalisées
- Accès rapide aux fonctionnalités principales

### 📅 Gestion d'Événements
- Création et modification d'événements
- Upload d'images via Cloudinary
- Géolocalisation avec Google Maps
- Gestion des participants

### 🚗 Carsharing
- Carte interactive avec Google Maps
- Création d'offres de covoiturage
- Réservation de places
- Calcul d'itinéraires automatique
- Gestion de ses propres offres

### 👥 People
- Liste des utilisateurs
- Profils détaillés
- Système de follow/unfollow
- Envoi de messages directs

### 💬 Chat
- Messagerie en temps réel
- Messages privés entre utilisateurs

### 📊 Profile
- Gestion du profil personnel
- Paramètres de voiture pour carsharing

## Routes Principales

```typescript
/auth/login              # Page de connexion
/auth/register           # Page d'inscription
/dashboard              # Tableau de bord
/events                 # Liste des événements
/events/:id             # Détails d'un événement
/events/:id/edit        # Édition d'un événement
/carsharing            # Carsharing avec carte
/people                # Gestion des contacts
/messages              # Chat/messages
/calendar              # Vue calendrier
/profile               # Profil utilisateur
/notifications         # Centre de notifications
```

## Services Principaux

### AuthService
Gestion de l'authentification JWT

### EventService
CRUD des événements avec upload d'images

### CarsharingService
Gestion des offres de covoiturage et géolocalisation

### ChatService
Chat en temps réel via WebSockets

### UserService
Gestion des profils et contacts

## Développement

1. **Démarrer le serveur de développement**
   ```bash
   ng serve
   ```

2. **Accéder à l'application**
   http://localhost:4200

3. **Développement avec hot reload**
   L'application se recharge automatiquement

## Build et Déploiement

```bash
ng build --configuration production
```
### Backend requis
- Backend NestJS en cours d'exécution sur le port 3000
- Base de données MongoDB connectée
- Services Cloudinary et Google Maps configurés

## Fonctionnalités Avancées

### Carsharing avec cartes
- Intégration Google Maps
- Géolocalisation automatique
- Calcul d'itinéraires en temps réel
- Marqueurs interactifs

### Upload d'images
- Intégration Cloudinary
- Compression automatique
- Formats multiples supportés

### Chat temps réel
- WebSockets pour la messagerie instantanée
- Notifications en temps réel
