# Instructions pour mettre à jour le composant MeetingScheduler

Pour résoudre l'erreur "API_KEY is not defined" et améliorer la gestion des erreurs avec Google Calendar, suivez ces étapes :

## Étape 1 : Sauvegarde (optionnelle)
Si vous souhaitez conserver l'ancien code comme référence :
```bash
cp MeetingScheduler.js MeetingScheduler.js.backup
```

## Étape 2 : Remplacer le fichier
Remplacez le contenu du fichier `MeetingScheduler.js` par celui de `MeetingSchedulerNew.js` :
```bash
cp MeetingSchedulerNew.js MeetingScheduler.js
```

## Étape 3 : Vérifier les modifications
Les principales modifications apportées sont :
1. Ajout de la clé API Google manquante
2. Amélioration de la gestion des erreurs
3. Ajout d'indicateurs de chargement
4. Meilleure gestion des messages d'erreur

## Étape 4 : Tester
Testez la fonctionnalité de création de réunion pour vous assurer que tout fonctionne correctement.

## Problème résolu
L'erreur "API_KEY is not defined" se produisait car nous avions supprimé la référence à API_KEY dans les constantes, mais nous l'utilisions toujours dans la fonction `gapi.client.init()`.

## Remarque importante
Si vous continuez à rencontrer des problèmes avec l'API Google Calendar, consultez le fichier `README_GOOGLE_CALENDAR.md` pour plus d'informations sur la résolution des problèmes d'autorisation Google.
