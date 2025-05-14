# Module Ressources & Documents

## Description
Le module Ressources & Documents est une fonctionnalité complète permettant la gestion des documents au sein de l'application de gestion de projets. Il permet aux utilisateurs de télécharger, organiser, partager et gérer des documents liés à leurs projets.

## Fonctionnalités principales

### 1. Gestion des documents
- **Téléchargement** : Ajout de nouveaux documents au système
- **Visualisation** : Aperçu des documents dans une interface intuitive
- **Téléchargement** : Récupération des documents stockés
- **Suppression** : Retrait des documents obsolètes
- **Organisation** : Classement par projet, type, date, etc.

### 2. Association avec les projets
- Liaison automatique des documents aux projets
- Affichage des documents associés dans la page de détails du projet
- Navigation facilitée entre les projets et leurs documents

### 3. Gestion des permissions
- Contrôle d'accès basé sur les rôles
- Permissions différenciées (lecture, modification, suppression)
- Protection des documents sensibles

### 4. Fonctionnalités avancées
- **Épinglage** : Mise en avant des documents importants
- **Versionnement** : Suivi des modifications des documents
- **Filtrage** : Recherche avancée par type, date, auteur, etc.

## Guide d'utilisation

### Page principale des ressources

La page principale des ressources offre une vue d'ensemble de tous les documents disponibles :

1. **Barre de navigation supérieure**
   - Sélecteur de projet pour filtrer les documents
   - Barre de recherche pour trouver rapidement un document
   - Bouton "Ajouter un document" pour télécharger de nouveaux fichiers

2. **Liste des documents**
   - Affichage tabulaire avec colonnes (nom, type, taille, auteur, date)
   - Icônes spécifiques selon le type de document
   - Indicateurs pour les documents épinglés
   - Menu d'actions pour chaque document (télécharger, partager, modifier, supprimer)

3. **Vue détaillée**
   - Aperçu du document sélectionné
   - Informations détaillées (métadonnées, historique, etc.)
   - Options de gestion avancées

### Documents dans les projets

Chaque projet dispose d'une section dédiée aux documents :

1. **Onglet "Documents" dans la page de détails du projet**
   - Liste des documents associés au projet
   - Bouton pour ajouter rapidement un document au projet
   - Accès direct à la gestion complète des ressources

2. **Intégration avec les autres fonctionnalités**
   - Lien avec les tâches et activités du projet
   - Historique des modifications
   - Notifications lors de l'ajout ou la modification de documents

## Types de fichiers supportés

- Documents bureautiques (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
- Images (JPG, JPEG, PNG, GIF)
- Fichiers texte (TXT, CSV)
- Archives (ZIP, RAR)
- Autres formats courants

## Limites et restrictions

- Taille maximale par fichier : 50 MB
- Types de fichiers restreints pour des raisons de sécurité
- Permissions basées sur les rôles utilisateurs et l'appartenance aux projets

## Développement futur

Fonctionnalités prévues pour les prochaines versions :

- Aperçu intégré pour plus de types de fichiers
- Édition collaborative de documents
- Commentaires sur des sections spécifiques des documents
- Intégration avec des services de stockage cloud externes
- Recherche plein texte dans le contenu des documents
- Analyse automatique du contenu des documents

## Architecture technique

Le module Ressources & Documents s'appuie sur :

- **Frontend** : React avec CoreUI pour l'interface utilisateur
- **Backend** : Node.js avec Express pour l'API
- **Stockage** : Système de fichiers local avec références en base de données
- **Base de données** : MongoDB pour les métadonnées et références
- **Sécurité** : Contrôle d'accès basé sur JWT et vérification des permissions

## Contribution

Pour contribuer au développement de ce module :

1. Assurez-vous de comprendre l'architecture existante
2. Suivez les conventions de code établies
3. Testez vos modifications avant de les soumettre
4. Documentez les nouvelles fonctionnalités ou modifications
