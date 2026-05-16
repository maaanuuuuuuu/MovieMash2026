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
| `#/action` | Match | Seuls les films avec le genre `action` peuvent être proposés. |
| `#/action/ranking` | Liste | Vue filtrée du classement global sur les films `action`. |
| `#/action/saved` | Liste | Films `action` marqués `interested` ou `removed`, avec restauration. |
| `#/comedy` | Match | Seuls les films avec le genre `comedy` peuvent être proposés. |
| `#/comedy/ranking` | Liste | Vue filtrée du classement global sur les films `comedy`. |
| `#/comedy/saved` | Liste | Films `comedy` marqués `interested` ou `removed`, avec restauration. |

Les onglets `All`, `Action` et `Comedy` ne changent pas de base de données. Ils changent seulement le filtre de vue et de sélection des duels.

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
- `Comedy` : 98 films.

Les genres connus dans le type applicatif sont : `action`, `adventure`, `animation`, `comedy`, `crime`, `documentary`, `drama`, `family`, `fantasy`, `history`, `horror`, `music`, `mystery`, `romance`, `science-fiction`, `thriller`, `tv-movie`, `war`, `western`.

Exemple : `Monsters, Inc.` a les genres `animation`, `comedy`, `family`.

Les genres servent aujourd'hui aux filtres. Ils ne sont pas affichés directement sur les cartes de match ou les lignes de ranking.

Les affiches sont des assets locaux. TMDb peut servir à collecter des données pendant le développement, mais l'application de production ne dépend pas d'un appel runtime à TMDb ou à une autre API externe.

## Classement global et filtres de genre

Il n'existe qu'un seul scope de ranking actif : `default`.

Les filtres `Action` et `Comedy` ne sont pas des listes séparées. Ils sont des vues temporaires sur le classement global :

- Un duel lancé dans `#/action` oppose seulement deux films `action`.
- Un duel lancé dans `#/comedy` oppose seulement deux films `comedy`.
- Le résultat du duel modifie quand même le score global du film.
- La liste `#/action/ranking` montre seulement les films `action`, mais dans l'ordre du classement global.
- La liste `#/comedy/ranking` fait la même chose pour `comedy`.
- Les numéros de rang en vue filtrée restent les rangs globaux. Ils peuvent donc sauter des numéros.

Le compteur de picks sur l'écran de match compte les comparaisons du scope global. Il n'est pas limité au filtre courant.

L'historique d'un film dans la liste lit aussi l'historique global. Un film consulté depuis une vue filtrée peut donc montrer des duels faits hors de ce filtre.

## Écran de match

L'écran de match affiche :

- la navigation de filtre `All`, `Action`, `Comedy` ;
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

Les contrôles tactiles principaux doivent rester confortables. Les onglets de filtre et les boutons de modale ont une hauteur minimale adaptée au toucher.

Dans la page de classement, les titres longs peuvent prendre deux lignes sur mobile. Sur tablette et desktop, ils restent sur une ligne avec troncature si nécessaire.

## Films non vus

Marquer un film comme non vu le désactive dans le ranking global seulement après la fenêtre d'annulation de 10 secondes.

La protection des 10 derniers films est évaluée dans le filtre courant :

- dans `All`, il faut garder au moins 10 films actifs au total ;
- dans `Action`, il faut garder au moins 10 films `action` actifs ;
- dans `Comedy`, il faut garder au moins 10 films `comedy` actifs.

Deux états non-ranking existent :

- `interested` : l'utilisateur n'a pas vu le film mais veut le garder pour plus tard.
- `removed` : l'utilisateur veut retirer le film de son pool actif.

Les deux états désactivent le film dans le ranking global. Même si la protection est évaluée dans le filtre courant, l'état appliqué est global après validation. Un film marqué dans `Action` disparaît aussi de `All` et de toute autre vue où il était présent.

## Page de classement

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

La page `saved` affiche deux vues :

- `Interested` : films marqués `interested`.
- `Removed` : films marqués `removed`.

Chaque vue respecte le filtre courant : `#/action/saved` ne montre que les films `action`, `#/comedy/saved` ne montre que les films `comedy`, et `#/saved` montre tout.

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

Ces notifications sont suivies par filtre (`All`, `Action`, `Comedy`) et par palier. Si plusieurs paliers sont déjà valides, l'application montre d'abord le plus petit palier non affiché. Chaque notification a un bouton vers la page de classement du filtre courant.

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

## Import et export de base

En développement local, un bouton `Dump DB to Pages` peut exporter la base locale et l'envoyer vers l'application GitHub Pages ouverte par la fenêtre.

Ce transfert est limité aux origines prévues par le protocole de dev. Il ne remplace pas une synchronisation utilisateur. L'application n'a pas de compte, pas de backend et pas de sync multi-appareil.

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

- de comptes utilisateurs ;
- de synchronisation serveur ;
- de merge automatique des anciens rankings séparés ;
- d'appel runtime à TMDb ;
- de filtres de genre configurables par l'utilisateur ;
- d'affichage direct des genres sur les cartes ;
- de classement séparé par genre ;
- de génération exhaustive de toutes les paires.
