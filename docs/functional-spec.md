# Documentation fonctionnelle de MovieMash

Ce fichier décrit l'application actuelle, à partir du code en place et des décisions prises pendant la discussion. Il ne décrit pas les versions précédentes.

## Règle de maintenance

Toute nouvelle feature ou tout changement fonctionnel doit mettre à jour ce fichier dans le même changement de code.

La documentation doit rester factuelle. Si le code et ce fichier ne disent pas la même chose, il faut corriger le code, la documentation, ou les deux.

## Objectif produit

MovieMash construit un classement personnel de films par duels rapides.

L'utilisateur voit deux films, choisit celui qu'il préfère, peut déclarer une égalité, ou peut sortir un film du ranking actif parce qu'il ne l'a pas vu. Le classement se construit progressivement avec un score global par film.

La route par défaut est l'écran de match. L'application n'a pas de page d'accueil marketing.

## Navigation actuelle

L'application utilise un `HashRouter`, ce qui donne des routes avec `#` sur GitHub Pages.

| Route | Vue | Sens fonctionnel |
| --- | --- | --- |
| `#/` | Match | Tous les films actifs peuvent être proposés. |
| `#/ranking` | Liste | Classement global complet. |
| `#/saved` | Liste | Films globaux marqués `interested` ou `removed`, avec restauration. |
| `#/<genre>` | Match | Seuls les films avec ce genre peuvent être proposés. |
| `#/<genre>/ranking` | Liste | Vue filtrée du classement global sur les films de ce genre. |
| `#/<genre>/saved` | Liste | Films de ce genre marqués `interested` ou `removed`, avec restauration. |

Les routes de genre exposées sont `action`, `adventure`, `animation`, `comedy`, `drama`, `horror`, `science-fiction`, `thriller`, `war`, et `western`.

Le sélecteur de filtre ne change pas de base de données. Il change seulement le filtre de vue et de sélection des duels.

Le filtre actif est visible sur l'écran de match, la page de classement et la page de restauration. Un bouton ouvre un panneau avec `All` et les 10 genres exposés. Chaque option affiche aussi le nombre de films du filtre. Changer de filtre depuis une liste garde le même type de vue.

## Catalogue de films

Le catalogue fonctionnel est une seule liste globale dans `src/data/films.ts`.

Chaque film a les métadonnées suivantes :

- `id` : identifiant stable du film.
- `title` : titre affiché.
- `year` : année affichée.
- `posterPath` : chemin local de l'affiche.
- `genres` : liste de genres normalisés.

Le catalogue actuel contient 397 films. Les filtres actuellement exposés sont :

- `All` : 397 films.
- `Action` : 119 films.
- `Adventure` : 136 films.
- `Animation` : 81 films.
- `Comedy` : 98 films.
- `Drama` : 168 films.
- `Horror` : 18 films.
- `Science Fiction` : 85 films.
- `Thriller` : 75 films.
- `War` : 40 films.
- `Western` : 6 films.

Les 10 filtres de genre exposés couvrent tout le catalogue : chaque film a au moins un de ces genres. `All` ne compte pas dans cette règle de couverture.

Les genres connus dans le type applicatif sont : `action`, `adventure`, `animation`, `comedy`, `crime`, `documentary`, `drama`, `family`, `fantasy`, `history`, `horror`, `music`, `mystery`, `romance`, `science-fiction`, `thriller`, `tv-movie`, `war`, `western`.

Exemple : `Monsters, Inc.` a les genres `animation`, `comedy`, `family`.

Les genres servent aujourd'hui aux filtres. Ils ne sont pas affichés directement sur les cartes de match ou les lignes de ranking.

Les affiches sont des assets locaux. TMDb peut servir à collecter des données pendant le développement, mais l'application de production ne dépend pas d'un appel runtime à TMDb ou à une autre API externe.

## Classement global et filtres de genre

Il n'existe qu'un seul scope de ranking actif : `default`.

Les filtres de genre ne sont pas des listes séparées. Ils sont des vues temporaires sur le classement global :

- Un duel lancé dans `#/<genre>` oppose seulement deux films avec ce genre.
- Le résultat du duel modifie quand même le score global du film.
- La liste `#/<genre>/ranking` montre seulement les films de ce genre, mais dans l'ordre du classement global.
- Les numéros de rang en vue filtrée restent les rangs globaux. Ils peuvent donc sauter des numéros.

Le compteur de picks sur l'écran de match compte les comparaisons du scope global. Il n'est pas limité au filtre courant.

L'historique d'un film dans la liste lit aussi l'historique global. Un film consulté depuis une vue filtrée peut donc montrer des duels faits hors de ce filtre.

## Écran de match

L'écran de match affiche :

- le sélecteur de filtre avec `All` et les 10 genres exposés ;
- le contexte du filtre courant ;
- deux cartes de films ;
- une action d'égalité ;
- un bouton flottant icon-only vers la liste ;
- un feedback court après un choix, une égalité, un `interested` ou un `removed` ;
- une célébration de stabilité affichée une seule fois.

Actions utilisateur :

- Cliquer une carte choisit ce film comme gagnant.
- Cliquer le bouton central enregistre une égalité.
- Après un choix gauche, un choix droite ou une égalité, un bouton d'annulation apparaît en bas à gauche.
- Cliquer ce bouton annule le dernier vote, supprime son entrée d'historique, restaure les scores et revient au duel annulé.
- Ce vote reste annulable jusqu'à la prochaine action de match. Il n'y a pas d'historique d'annulation complet.
- Glisser vers le haut depuis la zone centrale du poster marque le film `interested`.
- Glisser vers le bas depuis la zone centrale du poster marque le film `removed`.
- Pendant ce glissement, deux zones apparaissent sur l'écran de match : `Interested` en haut et `Remove` en bas. La zone active se renforce quand le seuil est atteint.
- Le geste doit dépasser un seuil vertical clair. Si le mouvement horizontal domine ou si le seuil n'est pas atteint, la carte revient en place.
- Si le doigt est relâché avant le seuil de validation, le film revient en place et le match ne change pas.
- Après un swipe vertical validé, un bouton d'annulation apparaît en bas à gauche pendant 10 secondes.
- Cliquer ce bouton annule le swipe et revient au duel qui vient d'être swipé.
- Si l'utilisateur joue le duel suivant ou attend 10 secondes, le bouton disparaît et l'état `interested` ou `removed` est enregistré.
- Après chaque action, la file de duels avance immédiatement.

Le bouton flottant vers le ranking est secondaire. Il se cache pendant une interaction et réapparaît après une période d'inactivité.

La file spéculative contient au maximum 4 duels. Elle est recalculée après les changements IndexedDB.

## Responsivité

L'interface est pensée mobile portrait en premier.

Sur l'écran de match, les cartes prennent l'espace vertical disponible dans le viewport. Sur téléphone, elles sont dimensionnées autour du contenu, avec des posters affichés dans un cadre d'affiche `2:3` en image complète pour éviter les crops latéraux. Sur mobile et tablette étroite, une zone basse est réservée pour que le bouton flottant vers le ranking ne masque pas le titre ou l'année des films.

Les contrôles tactiles principaux doivent rester confortables. Le bouton de filtre, les options du panneau de filtre, les boutons flottants, les cartes de match et les lignes de ranking utilisent des textes et cibles tactiles plus grands sur téléphone ou appareil tactile. Sur téléphone et sur les appareils tactiles, le panneau de filtre s'ouvre comme une feuille basse avec une liste en une colonne, de grands boutons et un texte lisible. Sur desktop avec souris ou trackpad, il peut s'ouvrir comme un panneau compact en grille.

Dans la page de classement, les titres longs peuvent prendre deux lignes sur mobile. Sur tablette et desktop, ils restent sur une ligne avec troncature si nécessaire.

## Films non vus

Marquer un film comme non vu le désactive dans le ranking global seulement après la fenêtre d'annulation de 10 secondes.

La protection des 10 derniers films est évaluée dans le filtre courant :

- dans `All`, il faut garder au moins 10 films actifs au total ;
- dans un filtre de genre, il faut garder au moins 10 films actifs avec ce genre.

Deux états non-ranking existent :

- `interested` : l'utilisateur n'a pas vu le film mais veut le garder pour plus tard.
- `removed` : l'utilisateur veut retirer le film de son pool actif.

Les deux états désactivent le film dans le ranking global. Même si la protection est évaluée dans le filtre courant, l'état appliqué est global après validation. Un film marqué dans un filtre de genre disparaît aussi de `All` et de toute autre vue où il était présent.

## Page de classement

La page de classement affiche aussi le sélecteur de filtre `All` et les 10 genres exposés.

La page de classement trie les films actifs par score décroissant.

Chaque ligne affiche :

- le rang global ;
- l'affiche ;
- le titre ;
- l'année ;
- le score en points ;
- le niveau de stabilité : `new`, `settling` ou `stable`.

Cliquer une ligne ouvre l'historique des duels du film. Les entrées affichent le résultat, l'adversaire et le changement de points quand il existe. Les événements `notSeen` ne sont pas listés dans cet historique.

La page de classement a un bouton icon-only vers la page des films sauvegardés. Les films `interested` et `removed` ne sont pas affichés au-dessus du ranking.

Glisser une ligne de ranking vers la gauche marque le film `interested`. Glisser une ligne vers la droite marque le film `removed`. Les deux gestes utilisent la même protection des 10 derniers films.

## Page de restauration

La page de restauration affiche aussi le sélecteur de filtre `All` et les 10 genres exposés.

La page `saved` affiche deux vues :

- `Interested` : films marqués `interested`.
- `Removed` : films marqués `removed`.

Chaque vue respecte le filtre courant : `#/<genre>/saved` ne montre que les films de ce genre, et `#/saved` montre tout.

Les films sont triés par date de dernière mise à jour décroissante.

Chaque ligne a un bouton `Restore`. Restaurer un film remet `active: true`, `notSeen: false` et `notSeenDisposition: null`. Le score et l'historique de ranking ne sont pas remis à zéro.

## Moteur de ranking

Tous les films commencent à 1000 points.

Le moteur est de type Elo :

- victoire : le gagnant prend des points et le perdant en perd ;
- égalité : les deux films reçoivent un score de résultat de 0,5 ;
- le facteur K vaut 44 avant 5 apparitions, 30 avant 15 apparitions, puis 20.

Les compteurs `appearances`, `wins`, `losses` et `ties` sont stockés avec le score.

## Sélection des duels

Le système ne génère pas toutes les paires possibles.

La sélection actuelle :

- privilégie d'abord les films actifs jamais proposés ;
- si un seul film est inédit, il est opposé à un partenaire proche ;
- sinon, une partie des duels sert à l'exploration ;
- le cas standard cherche des adversaires proches en score ;
- les films avec peu d'apparitions sont favorisés ;
- les paires récentes sont pénalisées dans la file courante.

## Stabilité du classement

Un film est :

- `new` avec moins de 3 apparitions ;
- `stable` à partir de 8 apparitions ;
- `stable` dès 5 apparitions si son score a bougé d'au moins 70 points ou si son écart victoires/défaites atteint 3 ;
- `settling` dans les autres cas.

Les notifications de top stable apparaissent pour les paliers top 10, top 15 et top 20.

Un palier est atteint quand tous les films du top N courant ont le niveau `stable`.

Ces notifications sont suivies par filtre (`All` et chaque genre exposé) et par palier. Si plusieurs paliers sont déjà valides, l'application montre d'abord le plus petit palier non affiché. Chaque notification a un bouton vers la page de classement du filtre courant.

## Persistance locale

L'état utilisateur est stocké dans IndexedDB via Dexie.

Base actuelle :

- nom IndexedDB : `movie-mash-v1` ;
- version Dexie : 4 ;
- table `catalogRankingStates` : état de ranking par `catalogId` et `itemId`, avec `notSeenDisposition` pour `interested` ou `removed` ;
- table `comparisons` : historique des choix, égalités et états non vus, avec les changements de score requis pour annuler le dernier vote ;
- table `meta` : petits drapeaux applicatifs, comme les notifications de top stable déjà affichées.

Le code initialise seulement le scope `default`. Si de nouveaux films sont ajoutés au catalogue, leurs états manquants sont créés avec 1000 points sans effacer l'historique existant.

Comportement des anciennes bases :

- Les anciennes bases sans `catalogId` sont migrées vers `default`.
- Les anciens films `notSeen` sans disposition sont migrés vers `removed`.
- Les anciens scopes séparés `action` ou `comedy`, s'ils existent déjà dans IndexedDB, ne sont pas fusionnés automatiquement.
- L'application actuelle ne lit pas ces anciens scopes séparés.
- Une vraie fusion des anciens scores `action`/`comedy` vers `default` demanderait une migration dédiée.

## Comptes Google et sauvegarde cloud V2

La sauvegarde cloud est optionnelle. Sans connexion Google, le comportement reste local-first et identique au mode IndexedDB existant.

Si la configuration Firebase web est absente, le bouton de compte ne s'affiche pas et l'application reste locale.

Le déploiement GitHub Pages doit recevoir les variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` et `VITE_FIREBASE_APP_ID` via les variables ou secrets GitHub Actions. Sinon le workflow de déploiement échoue pour éviter de publier une version sans connexion Google.

Un bouton icon-only en haut à droite permet de se connecter avec Google via Firebase Auth. Quand l'utilisateur est connecté, ce bouton affiche son avatar Google quand il est disponible. Cliquer ce bouton quand l'utilisateur est connecté le déconnecte.

Si Google sign-in échoue, le bouton affiche un état d'erreur et un court message visible. Par exemple, si le domaine GitHub Pages n'est pas autorisé dans Firebase Auth, le message indique que ce domaine n'est pas autorisé.

Firestore stocke l'état cloud dans :

- `users/{uid}` : petit document de profil technique avec `schemaVersion`, `createdAt` quand il est créé, et `updatedAt`.
- `users/{uid}/state/current` : document de sauvegarde avec `schemaVersion`, `appSchemaVersion`, `updatedAt`, la raison de l'écriture, et le snapshot IndexedDB complet.

La source de vérité au moment de la connexion est simple :

- si `users/{uid}/state/current` n'existe pas, la base IndexedDB locale du navigateur courant initialise Firestore ;
- si `users/{uid}/state/current` existe, l'état Firestore remplace entièrement la base IndexedDB locale du navigateur courant.

Il n'y a pas de merge entre une partie locale existante et une partie cloud existante. Le cloud gagne toujours après la première sauvegarde cloud.

Après l'initialisation, l'application sauvegarde le snapshot IndexedDB courant vers Firestore toutes les 30 secondes pendant que l'utilisateur est connecté. Elle tente aussi une sauvegarde quand l'onglet passe en arrière-plan.

Les règles Firestore autorisent un utilisateur connecté à lire et écrire uniquement sous `users/{uid}` quand `request.auth.uid == uid`.

## Offline et déploiement

En production, un service worker est enregistré si le navigateur le supporte.

Il cache :

- le shell applicatif ;
- `index.html` ;
- les ressources chargées depuis la même origine ;
- les affiches locales des films.

Le build GitHub Pages utilise `VITE_BASE_PATH` pour servir correctement l'application depuis le sous-chemin du repository.

Le workflow GitHub Pages sur `main` installe les dépendances, lance le lint, lance les tests, build l'application, puis publie `dist`.

La CI peut aussi publier des previews sur la branche `gh-pages`. Le sélecteur de preview ne s'affiche que dans un contexte GitHub Pages compatible et seulement s'il y a plusieurs déploiements connus.

## Hors périmètre actuel

L'application actuelle ne fait pas :

- de merge automatique des anciens rankings séparés ;
- de merge entre un état local existant et un état cloud existant ;
- d'appel runtime à TMDb ;
- de filtres de genre configurables par l'utilisateur ;
- d'affichage direct des genres sur les cartes ;
- de classement séparé par genre ;
- de génération exhaustive de toutes les paires.
