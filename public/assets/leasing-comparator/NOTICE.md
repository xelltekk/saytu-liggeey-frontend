# Moteurs de lecture locaux

Ces moteurs sont repris du dossier `printer-app/dist/vendor`
fourni pour l’intégration dans Saytu. Aucun PDF client ni exemple réel n’est inclus.

- PDF.js 5.6.205 — Mozilla Foundation — licence Apache-2.0 ; notices conservées en tête des fichiers.
- Tesseract.js, son worker, Tesseract.js-core et le modèle anglais : moteurs OCR embarqués du dossier source ; notices intégrées conservées.

Les chemins worker/core/lang sont explicitement locaux. Les moteurs sont chargés
à la première importation, sans service OCR externe. Les mises à jour doivent
conserver des versions compatibles du moteur, du worker et du cœur WebAssembly.

Le modèle `eng.traineddata.gz` est décompressé en `eng.traineddata` sans changement
de contenu et chargé avec `gzip: false`. Les ressources publiques sont dans
`/assets/leasing-comparator/` : les protections serveur bloquant `/vendor/` et les
archives `.gz` restent inchangées.
