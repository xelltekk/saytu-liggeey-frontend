# Comparaison de relevés Canon

Accès : Administration → Leasing imprimantes → Comparer deux relevés.
Le lien Comparer d’un contrat reprend ses tarifs et impose sa série, si renseignée.
La page reprend la protection existante `leasing.view` ; aucun droit n’est ajouté.

1. Charger les PDF précédent et récent (30 Mo / 10 pages maximum par fichier).
2. Vérifier dates, série, compteurs 102, 409 et 112 dans les aperçus rendus localement.
3. Préciser les faces couleur grand format sur la période, y compris zéro, et confirmer
   que les autres impressions sont exclusivement A4.
4. Vérifier les tarifs, confirmer les valeurs et calculer.
5. Exporter CSV ou imprimer/enregistrer en PDF avant de quitter.

Noir A4 = Δ102 − Δ409 − 2 × Δ112 ; couleur A4 = Δ409 − 2 × grands formats couleur.
Scans exclus ; recto verso = deux faces. Calcul spécifique aux compteurs Canon
compatibles, pas un interpréteur universel de compteurs.

La valorisation HT n’applique PAS les pages incluses, loyers ou taxes des contrats.
Aucun relevé cumulatif, facture ou mouvement de stock n’est créé. Les valeurs Canon
pondérées ne doivent pas être copiées comme des compteurs A4 cumulatifs dans Saytu.
Les fichiers et résultats restent en mémoire ; pas d’archivage, pas d’envoi à un
service tiers. La saisie manuelle est disponible en cas d’OCR incomplet.

Tests : `node --test tests/leasingComparison.test.mjs` puis `npm run build`.

Test navigateur isolé : lancer Vite sur `127.0.0.1:5179`, puis
`node tests/leasingComparison.browser.mjs` avec `SAYTU_TEST_RUNTIME` (répertoire
node_modules des dépendances de test) et éventuellement `SAYTU_TEST_BROWSER=msedge`.
Le test génère ses propres PDF texte/scanné, vérifie OCR, résultat, export CSV,
impression sur une page, largeur mobile et absence de requêtes externes.
Le point d’entrée `tests/browser/leasing.html` n’est pas inclus dans le build déployé.
