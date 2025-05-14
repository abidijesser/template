# Résolution du problème d'accès à Google Calendar

## Problème rencontré

Lors de la création de réunions avec Google Calendar, vous avez rencontré l'erreur suivante :

```
Accès bloqué : pidev n'a pas terminé la procédure de validation de Google
Erreur 403 : access_denied
```

## Cause du problème

Cette erreur se produit pour l'une des raisons suivantes :

1. **Application non vérifiée par Google** : Lorsqu'une application utilise les API Google et accède à des données sensibles, Google exige que l'application passe par un processus de vérification. Si l'application n'a pas été vérifiée, seuls les utilisateurs explicitement ajoutés comme testeurs peuvent l'utiliser.

2. **Configuration OAuth incorrecte** : Les identifiants client OAuth utilisés dans le composant MeetingScheduler ne correspondaient pas à ceux configurés dans la console Google Cloud.

3. **Utilisateur non autorisé** : Votre compte Google n'est pas dans la liste des testeurs autorisés pour cette application.

## Solution

Un nouveau fichier `MeetingSchedulerNew.js` a été créé avec les améliorations suivantes :

1. **Utilisation des identifiants corrects** : Les identifiants OAuth ont été mis à jour pour correspondre à ceux du fichier `credentials.json` du serveur.

2. **Gestion améliorée des erreurs** : Le code affiche maintenant des messages d'erreur plus précis et explicites.

3. **Amélioration de l'expérience utilisateur** : Ajout d'indicateurs de chargement et de messages d'erreur visibles.

## Comment utiliser la nouvelle version

Pour utiliser la nouvelle version du planificateur de réunions :

1. Renommez `MeetingSchedulerNew.js` en `MeetingScheduler.js` (après avoir sauvegardé l'ancienne version si nécessaire)
2. Assurez-vous que votre compte Google est ajouté comme testeur dans la console Google Cloud pour le projet "pidev-455214"

## Solution alternative

Si vous continuez à rencontrer des problèmes avec l'API Google Calendar, vous pouvez :

1. **Utiliser un lien direct vers Google Calendar** : Au lieu d'utiliser l'API, fournir un lien qui ouvre Google Calendar avec les détails de la réunion pré-remplis.

2. **Compléter la vérification de l'application** : Suivre le processus de vérification de Google pour votre application. Cela implique de fournir des informations sur votre application et de passer par un processus de vérification.

3. **Limiter l'accès aux scopes moins sensibles** : Utiliser des scopes d'API qui ne nécessitent pas de vérification complète.

## Ressources utiles

- [Documentation Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Processus de vérification des applications Google](https://support.google.com/cloud/answer/7454865)
- [API Google Calendar](https://developers.google.com/calendar)
