# COVOIT-DZ Mobile (Expo / React Native)

## Important : ce qui a été vérifié dans cette session, et ce qui ne l'a pas été

Je n'ai pas d'émulateur ni d'appareil dans cet environnement — je ne peux
donc **pas** faire tourner visuellement cette app. Ce qui a été fait :
- Le code s'installe (`npm install`, 1154 paquets, aucune erreur)
- Le code **type-check intégralement sans erreur** (`npx tsc --noEmit`)
- La logique métier (appels API, gestion des tokens, navigation) est
  réelle, pas un mock — elle parle au vrai backend NestJS testé dans
  `docs/ROADMAP.md`

Ce qui n'a **pas** été vérifié : rendu visuel réel, comportement sur
iOS/Android réel, gestion des permissions de géolocalisation en conditions
réelles, performance. **Avant de considérer cette app comme "prête"**, il
faut la lancer avec `npx expo start` sur un simulateur ou un appareil réel
et la tester à la main.

## Écrans câblés à l'API (fonctionnels si le backend tourne)

| Écran | Ce qu'il fait réellement |
|---|---|
| `LoginScreen` | Appelle `POST /auth/login`, stocke les tokens dans `expo-secure-store` |
| `RegisterScreen` | Appelle `POST /auth/register`, choix du rôle (locataire/propriétaire) |
| `SearchScreen` | Demande la position réelle (`expo-location`), appelle `GET /vehicles/search` avec lat/lng/rayon, affiche les résultats triés par distance |
| `VehicleDetailScreen` | Charge le véhicule (`GET /vehicles/:id`), crée une réservation (`POST /bookings`) |
| `MyBookingsScreen` | Liste les réservations du locataire (`GET /bookings/mine`) |
| `ProfileScreen` | Affiche l'utilisateur connecté, déconnexion |

Le client API (`src/api/client.ts`) gère le rafraîchissement automatique du
token d'accès sur 401, avec un seul refresh en vol même si plusieurs
requêtes échouent en même temps (`refreshPromise` partagé).

## Ce qui manque pour un vrai MVP (priorité UX, cf. ROADMAP.md du repo racine)

- **Sélecteur de date réel** — actuellement deux champs texte
  `AAAA-MM-JJ` ; il faut `@react-native-community/datetimepicker` ou
  équivalent, volontairement pas ajouté ici pour garder le scaffold léger.
- **Photos** — aucun upload, aucun affichage (le détail véhicule montre un
  placeholder).
- **Écrans propriétaire** — publier une annonce, gérer ses véhicules, voir
  les demandes de réservation entrantes : rien n'existe côté mobile (les
  endpoints backend existent, voir `POST /vehicles`, `GET /vehicles`
  filtré par propriétaire).
- **Carte interactive** — la recherche renvoie des coordonnées mais rien
  n'affiche de carte (ex. `react-native-maps`).
- **Messagerie, avis, état des lieux** — endpoints backend prêts et
  testés, aucun écran mobile.
- **Gestion d'erreurs réseau** — basique (`Alert.alert`), pas de retry ni
  d'état hors-ligne.

## Démarrage

```bash
npm install
npx expo start
```

Par défaut l'app pointe vers `http://localhost:3000/api/v1`
(`app.json > expo.extra.apiBaseUrl`) — à changer pour tester depuis un
appareil physique (remplacer `localhost` par l'IP locale de la machine qui
fait tourner le backend).
