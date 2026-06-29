<template>
  <div class="space-y-4">
    <template v-if="section === 'recrutement'">
      <div v-if="canManage" class="grid gap-4 xl:grid-cols-2">
        <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveOffre">
          <h3 class="title sm:col-span-2">Nouvelle offre d'emploi</h3>
          <input v-model="offreForm.titre" class="input" placeholder="Intitule de l'offre" required />
          <select v-model.number="offreForm.poste_id" class="input">
            <option :value="null">Poste associe</option>
            <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.libelle }}</option>
          </select>
          <select v-model="offreForm.type_contrat" class="input"><option v-for="v in contrats" :key="v" :value="v">{{ v.toUpperCase() }}</option></select>
          <input v-model.number="offreForm.nb_postes" type="number" min="1" class="input" placeholder="Nombre de postes" />
          <input v-model="offreForm.date_publication" type="date" class="input" title="Date de publication" />
          <input v-model="offreForm.date_cloture" type="date" class="input" title="Date de cloture" />
          <select v-model="offreForm.statut" class="input"><option value="brouillon">Brouillon</option><option value="ouverte">Ouverte</option><option value="fermee">Fermee</option><option value="pourvue">Pourvue</option></select>
          <textarea v-model="offreForm.description" rows="2" class="input sm:col-span-2" placeholder="Description du besoin, mission ou profil recherche"></textarea>
          <button class="btn-primary sm:col-span-2">Creer l'offre</button>
        </form>

        <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveCandidat">
          <h3 class="title sm:col-span-2">Ajouter un candidat</h3>
          <input v-model="candidatForm.prenom" class="input" placeholder="Prenom" required />
          <input v-model="candidatForm.nom" class="input" placeholder="Nom" required />
          <input v-model="candidatForm.email" type="email" class="input" placeholder="Email" />
          <input v-model="candidatForm.telephone" class="input" placeholder="Telephone" />
          <input v-model="candidatForm.source" class="input" placeholder="Source : LinkedIn, recommandation..." />
          <select v-model="candidatForm.statut" class="input"><option v-for="s in candidatStatuts" :key="s" :value="s">{{ statusLabel(s) }}</option></select>
          <select v-model.number="candidatForm.offre_id" class="input sm:col-span-2">
            <option :value="null">Offre ciblee</option>
            <option v-for="o in offres" :key="o.id" :value="o.id">{{ o.titre }}</option>
          </select>
          <textarea v-model="candidatForm.notes" rows="2" class="input sm:col-span-2" placeholder="Notes internes, disponibilite, premier avis..."></textarea>
          <button class="btn-primary sm:col-span-2">Ajouter le candidat</button>
        </form>
      </div>

      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <button v-for="s in candidatStatuts" :key="s" type="button" class="panel p-3 text-left transition hover:border-blue-300 hover:bg-blue-50" @click="recruitmentFilter = recruitmentFilter === s ? '' : s">
          <p class="text-xs uppercase text-slate-500">{{ statusLabel(s) }}</p>
          <strong class="text-xl text-slate-900">{{ candidatesByStatus(s).length }}</strong>
        </button>
      </div>

      <section v-if="canManage" class="panel">
        <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="title">Offres d'emploi</h3>
            <p class="text-sm text-slate-500">Suivi rapide des postes ouverts et des candidatures rattachees.</p>
          </div>
          <button class="btn-secondary" @click="load">Actualiser</button>
        </div>
        <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <article v-for="o in offres" :key="o.id" class="rounded-lg border border-slate-200 p-3">
            <div class="flex items-start justify-between gap-3">
              <div><strong class="text-slate-900">{{ o.titre }}</strong><p class="text-xs text-slate-500">{{ o.poste?.libelle || 'Sans poste associe' }}</p></div>
              <span class="badge" :class="offreStatusClass(o.statut)">{{ o.statut }}</span>
            </div>
            <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <div><span class="block uppercase text-slate-400">Contrat</span><strong>{{ String(o.type_contrat || '-').toUpperCase() }}</strong></div>
              <div><span class="block uppercase text-slate-400">Postes</span><strong>{{ o.nb_postes || 1 }}</strong></div>
              <div><span class="block uppercase text-slate-400">Candidats</span><strong>{{ o.candidats_count || 0 }}</strong></div>
            </div>
            <p v-if="o.date_cloture" class="mt-2 text-xs text-slate-500">Cloture : {{ date(o.date_cloture) }}</p>
          </article>
          <p v-if="!offres.length" class="empty lg:col-span-2 xl:col-span-3">Aucune offre d'emploi.</p>
        </div>
      </section>

      <section class="panel">
        <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 class="title">Pipeline des candidats</h3>
            <p class="text-sm text-slate-500">Chaque colonne represente une etape du recrutement.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <input v-model="recruitmentSearch" class="input min-w-64" placeholder="Rechercher candidat, offre, contact..." />
            <select v-model="recruitmentFilter" class="input min-w-44"><option value="">Toutes les etapes</option><option v-for="s in candidatStatuts" :key="s" :value="s">{{ statusLabel(s) }}</option></select>
          </div>
        </div>

        <div class="grid gap-3 xl:grid-cols-6">
          <div v-for="s in visibleRecruitmentStatuses" :key="s" class="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div class="mb-3 flex items-center justify-between gap-2">
              <strong class="text-sm text-slate-800">{{ statusLabel(s) }}</strong>
              <span class="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{{ filteredCandidatesByStatus(s).length }}</span>
            </div>
            <div class="space-y-2">
              <article v-for="c in filteredCandidatesByStatus(s)" :key="c.id" class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div class="flex items-start justify-between gap-2">
                  <strong class="text-sm text-slate-900">{{ c.prenom }} {{ c.nom }}</strong>
                  <span class="badge" :class="candidateStatusClass(c.statut)">{{ statusLabel(c.statut) }}</span>
                </div>
                <p class="mt-1 text-xs text-slate-500">{{ c.offre.titre || 'Candidature spontanee' }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ c.email || c.telephone || 'Contact non renseigne' }}</p>
                <p v-if="c.source" class="mt-1 text-xs text-slate-400">Source : {{ c.source }}</p>
                <select v-if="canManage" v-model="c.statut" class="input mt-3 text-xs" @change="updateCandidat(c)">
                  <option v-for="next in candidatStatuts" :key="next" :value="next">{{ statusLabel(next) }}</option>
                </select>
              </article>
              <p v-if="!filteredCandidatesByStatus(s).length" class="rounded border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-400">Aucun candidat</p>
            </div>
          </div>
        </div>
      </section>
    </template>

    <template v-else-if="section === 'performance'">
      <div v-if="canManage" class="grid gap-4 xl:grid-cols-2">
        <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveObjectif">
          <h3 class="title sm:col-span-2">Nouvel objectif</h3>
          <select v-model.number="objectifForm.employe_id" class="input sm:col-span-2" required>
            <option :value="null">Employe concerne</option>
            <option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option>
          </select>
          <label class="field-label sm:col-span-2">Libelle de l'objectif<input v-model="objectifForm.titre" class="input" placeholder="Ex : Finaliser 20 dossiers clients" required /></label>
          <label class="field-label">Date debut<input v-model="objectifForm.date_debut" type="date" class="input" required /></label>
          <label class="field-label">Date fin<input v-model="objectifForm.date_fin" type="date" class="input" required /></label>
          <label class="field-label">Cible<input v-model.number="objectifForm.cible" type="number" min="0" class="input" placeholder="Valeur cible" required /></label>
          <label class="field-label">Unite<input v-model="objectifForm.unite" class="input" placeholder="%, XOF, clients..." required /></label>
          <textarea v-model="objectifForm.description" rows="2" class="input sm:col-span-2" placeholder="Details, criteres de validation ou commentaire"></textarea>
          <button class="btn-primary sm:col-span-2">Creer l'objectif</button>
        </form>

        <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveEvaluation">
          <h3 class="title sm:col-span-2">Nouvelle evaluation</h3>
          <select v-model.number="evaluationForm.employe_id" class="input sm:col-span-2" required>
            <option :value="null">Employe evalue</option>
            <option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option>
          </select>
          <label class="field-label">Debut periode<input v-model="evaluationForm.periode_debut" type="date" class="input" required /></label>
          <label class="field-label">Fin periode<input v-model="evaluationForm.periode_fin" type="date" class="input" required /></label>
          <label class="field-label">Note / 5<input v-model.number="evaluationForm.note" type="number" min="0" max="5" step="0.1" class="input" /></label>
          <label class="field-label">Statut<select v-model="evaluationForm.statut" class="input"><option value="brouillon">Brouillon</option><option value="partagee">Partagee</option><option value="validee">Validee</option></select></label>
          <textarea v-model="evaluationForm.commentaire" rows="2" class="input sm:col-span-2" placeholder="Commentaire et axes de progression"></textarea>
          <button class="btn-primary sm:col-span-2">Enregistrer l'evaluation</button>
        </form>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button v-for="card in performanceCards" :key="card.key" type="button" class="panel p-3 text-left transition hover:border-blue-300 hover:bg-blue-50" @click="performanceFilter = card.key === 'total' ? '' : (performanceFilter === card.key ? '' : card.key)">
          <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
          <strong class="mt-1 block text-2xl" :class="card.color">{{ card.value }}</strong>
        </button>
      </div>

      <section class="panel">
        <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 class="title">Objectifs et progression</h3>
            <p class="text-sm text-slate-500">Suivi des objectifs avec jauge, statut et echeance.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <input v-model="performanceSearch" class="input min-w-64" placeholder="Rechercher objectif ou employe..." />
            <select v-model="performanceFilter" class="input min-w-44"><option value="">Tous les objectifs</option><option value="en_cours">En cours</option><option value="atteint">Atteints</option><option value="en_retard">En retard</option><option value="faible">Moins de 50%</option></select>
          </div>
        </div>

        <div class="grid gap-3 xl:grid-cols-2">
          <article v-for="o in filteredObjectifs" :key="o.id" class="rounded-lg border border-slate-200 p-4">
            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <strong class="text-slate-900">{{ o.titre }}</strong>
                <p class="mt-1 text-sm text-slate-500">{{ nom(o.employe) }} - {{ date(o.date_debut) }} au {{ date(o.date_fin) }}</p>
                <p v-if="o.description" class="mt-1 text-xs text-slate-500">{{ o.description }}</p>
              </div>
              <span class="badge" :class="objectiveStatusClass(o)">{{ objectiveStatusLabel(o) }}</span>
            </div>

            <div class="mt-4">
              <div class="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>{{ o.realise || 0 }} / {{ o.cible || 0 }} {{ o.unite }}</span>
                <strong :class="progressTextClass(o)">{{ progression(o) }}%</strong>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full transition-all" :class="progressBarClass(o)" :style="{ width: progression(o) + '%' }"></div>
              </div>
            </div>

            <div v-if="canManage" class="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
              <input v-model.number="o.realise" type="number" min="0" class="input" placeholder="Realise" />
              <select v-model="o.statut" class="input"><option value="planifie">Planifie</option><option value="en_cours">En cours</option><option value="atteint">Atteint</option><option value="annule">Annule</option></select>
              <button class="btn-secondary" @click="updateObjectif(o)">Actualiser</button>
            </div>
          </article>
          <p v-if="!filteredObjectifs.length" class="empty xl:col-span-2">Aucun objectif pour ces filtres.</p>
        </div>
      </section>

      <section class="panel overflow-x-auto">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div><h3 class="title">Evaluations</h3><p class="text-sm text-slate-500">Historique des evaluations partagees et validees.</p></div>
          <button class="btn-secondary" @click="load">Actualiser</button>
        </div>
        <table class="mt-3 w-full">
          <thead><tr><th>Employe</th><th>Periode</th><th>Note</th><th>Statut</th><th>Commentaire</th></tr></thead>
          <tbody>
            <tr v-for="e in evaluations" :key="e.id"><td>{{ nom(e.employe) }}</td><td>{{ date(e.periode_debut) }} - {{ date(e.periode_fin) }}</td><td><strong>{{ e.note ?? '-' }} / 5</strong></td><td><span class="badge" :class="evaluationStatusClass(e.statut)">{{ e.statut }}</span></td><td class="max-w-md whitespace-normal">{{ e.commentaire || '-' }}</td></tr>
            <tr v-if="!evaluations.length"><td colspan="5" class="empty">Aucune evaluation.</td></tr>
          </tbody>
        </table>
      </section>
    </template>

    <template v-else-if="section === 'documents'">
      <form v-if="canManage" class="panel grid gap-2 md:grid-cols-4" @submit.prevent="uploadDocument">
        <h3 class="title md:col-span-4">Deposer un document RH</h3>
        <select v-model.number="documentForm.employe_id" class="input">
          <option :value="null">Document général</option>
          <option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option>
        </select>
        <select v-model="documentForm.type" class="input">
          <option v-for="v in documentTypes" :key="v" :value="v">{{ v }}</option>
        </select>
        <input v-model="documentForm.titre" class="input" placeholder="Titre" required />
        <input v-model="documentForm.date_document" type="date" class="input" title="Date du document" />
        <input v-model="documentForm.date_expiration" type="date" class="input" title="Date d'expiration" />
        <select v-model="documentForm.statut" class="input">
          <option value="valide">Valide</option>
          <option value="a_renouveler">A renouveler</option>
          <option value="expire">Expire</option>
          <option value="archive">Archive</option>
        </select>
        <input type="file" class="input" required @change="documentForm.fichier = $event.target.files[0]" />
        <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="documentForm.visible_employe" type="checkbox" /> Visible par l'employé</label>
        <textarea v-model="documentForm.description" rows="2" class="input md:col-span-4" placeholder="Description ou remarque interne"></textarea>
        <button class="btn-primary md:col-span-4">Deposer le document</button>
      </form>

      <section class="panel overflow-x-auto">
        <div class="mb-3 grid gap-2 lg:grid-cols-[1fr_180px_180px_180px_auto]">
          <input v-model="documentFilters.search" class="input" placeholder="Rechercher titre, employe, fichier..." @keyup.enter="load" />
          <select v-model="documentFilters.type" class="input" @change="load"><option value="">Tous les types</option><option v-for="v in documentTypes" :key="v" :value="v">{{ v }}</option></select>
          <select v-model="documentFilters.statut" class="input" @change="load"><option value="">Tous statuts</option><option value="valide">Valide</option><option value="a_renouveler">A renouveler</option><option value="expire">Expire</option><option value="archive">Archive</option></select>
          <select v-model="documentFilters.expiration" class="input" @change="load"><option value="">Toutes expirations</option><option value="soon">A renouveler sous 30 jours</option><option value="expired">Expires</option></select>
          <button class="btn-secondary" @click="load">Actualiser</button>
        </div>
        <table class="w-full">
          <thead><tr><th>Document</th><th>Employe</th><th>Type</th><th>Dates</th><th>Etat</th><th>Visible</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="d in documents" :key="d.id">
              <td class="min-w-72 align-top">
                <input v-if="canManage" v-model="d.titre" class="input min-w-64" @change="updateDocument(d)" />
                <strong v-else class="text-slate-900">{{ d.titre }}</strong>
                <p class="mt-1 text-xs text-slate-500">{{ d.nom_original }}</p>
                <textarea v-if="canManage" v-model="d.description" rows="2" class="input mt-2 min-w-64" placeholder="Description" @change="updateDocument(d)"></textarea>
                <p v-else-if="d.description" class="mt-1 text-xs text-slate-500">{{ d.description }}</p>
              </td>
              <td class="min-w-52 align-top">
                <select v-if="canManage" v-model.number="d.employe_id" class="input min-w-48" @change="updateDocument(d)">
                  <option :value="null">Document general</option>
                  <option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option>
                </select>
                <span v-else>{{ nom(d.employe) }}</span>
              </td>
              <td class="min-w-40 align-top">
                <select v-if="canManage" v-model="d.type" class="input min-w-36" @change="updateDocument(d)"><option v-for="v in documentTypes" :key="v" :value="v">{{ v }}</option></select>
                <span v-else>{{ d.type }}</span>
              </td>
              <td class="min-w-56 align-top">
                <div v-if="canManage" class="grid gap-2">
                  <input v-model="d.date_document" type="date" class="input" title="Date document" @change="updateDocument(d)" />
                  <input v-model="d.date_expiration" type="date" class="input" title="Date expiration" @change="updateDocument(d)" />
                </div>
                <div v-else class="text-sm"><p>{{ date(d.date_document) }}</p><p class="text-xs text-slate-500">Exp. {{ date(d.date_expiration) }}</p></div>
              </td>
              <td class="min-w-44 align-top">
                <select v-if="canManage" v-model="d.statut" class="input min-w-40" @change="updateDocument(d)"><option value="valide">Valide</option><option value="a_renouveler">A renouveler</option><option value="expire">Expire</option><option value="archive">Archive</option></select>
                <span class="mt-2 inline-block rounded px-2 py-1 text-xs font-semibold" :class="documentEtatClass(d)">{{ documentEtatLabel(d) }}</span>
              </td>
              <td class="align-top">
                <label v-if="canManage" class="inline-flex items-center gap-2 text-sm"><input v-model="d.visible_employe" type="checkbox" @change="updateDocument(d)" /> Oui</label>
                <span v-else>{{ d.visible_employe ? 'Oui' : 'Non' }}</span>
              </td>
              <td class="align-top"><button class="btn-secondary" @click="download('/rh/documents/', d)">Telecharger</button></td>
            </tr>
            <tr v-if="!documents.length"><td colspan="7" class="empty">Aucun document RH.</td></tr>
          </tbody>
        </table>
      </section>
    </template>

    <template v-else-if="section === 'paie'">
      <div v-if="canManage" class="grid gap-4 xl:grid-cols-[minmax(420px,520px)_1fr]">
        <div class="space-y-4">
          <form class="panel grid gap-3 sm:grid-cols-2" @submit.prevent="generateBulletin">
            <div class="sm:col-span-2">
              <h3 class="title">Generer une fiche de paie</h3>
              <p class="mt-1 text-sm text-slate-500">Saytu calcule le brut, les retenues, le net a payer et cree le PDF.</p>
            </div>
            <label class="field-label sm:col-span-2">Employe
              <select v-model.number="paieForm.employe_id" class="input" required>
                <option :value="null">Choisir un employe</option>
                <option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option>
              </select>
            </label>
            <label class="field-label">Periode<input v-model="paieForm.periode" type="month" class="input" required /></label>
            <label class="field-label">Mode paiement
              <select v-model="paieForm.mode_paiement" class="input">
                <option value="virement">Virement</option><option value="especes">Especes</option><option value="cheque">Cheque</option><option value="wave">Wave</option><option value="orange_money">Orange Money</option><option value="free_money">Free Money</option><option value="autre">Autre</option>
              </select>
            </label>
            <label class="field-label">Salaire de base<input v-model.number="paieForm.salaire_base" type="number" min="0" step="1" class="input" required /></label>
            <label class="field-label">Primes<input v-model.number="paieForm.primes" type="number" min="0" step="1" class="input" /></label>
            <label class="field-label">Indemnites<input v-model.number="paieForm.indemnites" type="number" min="0" step="1" class="input" /></label>
            <label class="field-label">Heures supp.<input v-model.number="paieForm.heures_supplementaires" type="number" min="0" step="1" class="input" /></label>
            <label class="field-label">Retenues<input v-model.number="paieForm.retenues" type="number" min="0" step="1" class="input" /></label>
            <label class="field-label">Avances<input v-model.number="paieForm.avances" type="number" min="0" step="1" class="input" /></label>
            <label class="field-label sm:col-span-2">Cotisations salariales<input v-model.number="paieForm.cotisations_salariales" type="number" min="0" step="1" class="input" /></label>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <div class="grid grid-cols-3 gap-2 text-sm">
                <div><span class="block text-xs uppercase text-slate-500">Brut</span><strong>{{ money(paiePreview.brut) }}</strong></div>
                <div><span class="block text-xs uppercase text-slate-500">Retenues</span><strong>{{ money(paiePreview.retenues) }}</strong></div>
                <div><span class="block text-xs uppercase text-slate-500">Net</span><strong class="text-green-700">{{ money(paiePreview.net) }}</strong></div>
              </div>
            </div>
            <textarea v-model="paieForm.notes" rows="2" class="input sm:col-span-2" placeholder="Notes internes ou mention sur la paie"></textarea>
            <button class="btn-primary sm:col-span-2">Generer et publier le bulletin</button>
          </form>

          <form class="panel grid gap-3" @submit.prevent="uploadBulletin">
            <div>
              <h3 class="title">Importer un PDF existant</h3>
              <p class="mt-1 text-sm text-slate-500">Optionnel : utile si la paie est calculee ailleurs.</p>
            </div>
            <select v-model.number="bulletinForm.employe_id" class="input" required><option :value="null">Choisir un employe</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
            <input v-model="bulletinForm.periode" type="month" class="input" required />
            <input type="file" class="input" required @change="bulletinForm.fichier = $event.target.files[0]" />
            <button class="btn-secondary">Publier / remplacer par PDF</button>
          </form>
        </div>

        <section class="panel">
          <h3 class="title">Synthese paie</h3>
          <div class="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <button v-for="card in payrollCards" :key="card.key" type="button" class="rounded-lg border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50" @click="applyPayrollQuickFilter(card.key)">
              <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
              <strong class="mt-1 block text-2xl" :class="card.color">{{ card.value }}</strong>
            </button>
          </div>
          <p class="mt-3 text-xs text-slate-500">Les bulletins sont stockes de maniere securisee et accessibles uniquement au responsable RH et a l'employe concerne.</p>
        </section>
      </div>

      <section class="panel overflow-x-auto">
        <div class="mb-3 grid gap-2 lg:grid-cols-[1fr_220px_150px_170px_auto]">
          <input v-model="bulletinFilters.search" class="input" placeholder="Rechercher employe, periode, fichier..." @keyup.enter="load" />
          <select v-if="canManage" v-model.number="bulletinFilters.employe_id" class="input" @change="load">
            <option :value="null">Tous les employes</option>
            <option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option>
          </select>
          <input v-model="bulletinFilters.annee" type="number" min="2000" max="2100" class="input" placeholder="Annee" @keyup.enter="load" />
          <input v-model="bulletinFilters.periode" type="month" class="input" @change="load" />
          <button class="btn-secondary" @click="load">Actualiser</button>
        </div>

        <table class="w-full">
          <thead><tr><th>Employe</th><th>Periode</th><th>Fichier</th><th>Brut</th><th>Retenues</th><th>Net</th><th>Publie le</th><th>Source</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="b in bulletins" :key="b.id">
              <td><strong class="text-slate-900">{{ nom(b.employe) }}</strong><p class="text-xs text-slate-500">{{ b.employe?.matricule || '-' }}</p></td>
              <td><strong class="text-slate-900">{{ b.periode_libelle || b.periode }}</strong><p class="text-xs text-slate-500">{{ b.periode }}</p></td>
              <td class="max-w-xs whitespace-normal"><span>{{ b.nom_original }}</span></td>
              <td>{{ b.brut ? money(b.brut) : '-' }}</td>
              <td>{{ b.total_retenues ? money(b.total_retenues) : '-' }}</td>
              <td><strong class="text-green-700">{{ b.net_a_payer ? money(b.net_a_payer) : '-' }}</strong></td>
              <td>{{ date(b.published_at || b.created_at) }}</td>
              <td><span class="badge" :class="b.source === 'genere' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'">{{ b.source_libelle || 'Publie' }}</span><p class="text-xs text-slate-400">{{ b.taille_libelle || '-' }}</p></td>
              <td><button class="btn-secondary" @click="download('/rh/paie/bulletins/', b)">Telecharger</button></td>
            </tr>
            <tr v-if="!bulletins.length"><td colspan="9" class="empty">Aucun bulletin de paie.</td></tr>
          </tbody>
        </table>
      </section>
    </template>

    <template v-else>
      <div v-if="canManage" class="grid gap-4 xl:grid-cols-[1fr_380px]">
        <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveFormation">
          <h3 class="title sm:col-span-2">Nouvelle formation</h3>
          <label class="field-label">Titre<input v-model="formationForm.titre" class="input" placeholder="Titre" required /></label>
          <label class="field-label">Organisme<input v-model="formationForm.organisme" class="input" placeholder="Organisme" /></label>
          <label class="field-label">Date debut<input v-model="formationForm.date_debut" type="date" class="input" /></label>
          <label class="field-label">Date fin<input v-model="formationForm.date_fin" type="date" class="input" /></label>
          <label class="field-label">Duree heures<input v-model.number="formationForm.duree_heures" type="number" min="0" step="0.5" class="input" placeholder="Duree en heures" /></label>
          <label class="field-label">Statut<select v-model="formationForm.statut" class="input"><option value="brouillon">Brouillon</option><option value="ouverte">Ouverte</option><option value="en_cours">En cours</option><option value="terminee">Terminee</option></select></label>
          <textarea v-model="formationForm.description" rows="2" class="input sm:col-span-2" placeholder="Objectifs, contenu ou remarques"></textarea>
          <button class="btn-primary sm:col-span-2">Creer la formation</button>
        </form>

        <form class="panel grid gap-2" @submit.prevent="assignFormation">
          <h3 class="title">Inscrire un employe</h3>
          <select v-model.number="inscriptionForm.formation_id" class="input" required><option :value="null">Formation</option><option v-for="f in formations" :key="f.id" :value="f.id">{{ f.titre }}</option></select>
          <select v-model.number="inscriptionForm.employe_id" class="input" required><option :value="null">Employe</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
          <button class="btn-primary">Inscrire</button>
        </form>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button v-for="card in trainingCards" :key="card.key" type="button" class="panel p-3 text-left transition hover:border-blue-300 hover:bg-blue-50" @click="applyTrainingQuickFilter(card.key)">
          <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
          <strong class="mt-1 block text-2xl" :class="card.color">{{ card.value }}</strong>
        </button>
      </div>

      <section class="panel">
        <div class="mb-3 grid gap-2 lg:grid-cols-[1fr_170px_140px_auto]">
          <input v-model="formationFilters.search" class="input" placeholder="Rechercher formation, organisme..." @keyup.enter="load" />
          <select v-model="formationFilters.statut" class="input" @change="load"><option value="">Tous statuts</option><option value="brouillon">Brouillon</option><option value="ouverte">Ouverte</option><option value="en_cours">En cours</option><option value="terminee">Terminee</option></select>
          <input v-model="formationFilters.annee" type="number" min="2000" max="2100" class="input" placeholder="Annee" @keyup.enter="load" />
          <button class="btn-secondary" @click="load">Actualiser</button>
        </div>

        <div class="grid gap-3 xl:grid-cols-2">
          <article v-for="f in formations" :key="f.id" class="rounded-lg border border-slate-200 p-4">
            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0 flex-1">
                <input v-if="canManage" v-model="f.titre" class="input font-semibold" @change="updateFormation(f)" />
                <strong v-else class="text-slate-900">{{ f.titre }}</strong>
                <p class="mt-1 text-xs text-slate-500">{{ f.organisme || 'Sans organisme' }}</p>
              </div>
              <span class="badge" :class="formationStatusClass(f.statut)">{{ formationStatusLabel(f.statut) }}</span>
            </div>

            <div v-if="canManage" class="mt-3 grid gap-2 sm:grid-cols-2">
              <input v-model="f.organisme" class="input" placeholder="Organisme" @change="updateFormation(f)" />
              <select v-model="f.statut" class="input" @change="updateFormation(f)"><option value="brouillon">Brouillon</option><option value="ouverte">Ouverte</option><option value="en_cours">En cours</option><option value="terminee">Terminee</option></select>
              <input v-model="f.date_debut" type="date" class="input" @change="updateFormation(f)" />
              <input v-model="f.date_fin" type="date" class="input" @change="updateFormation(f)" />
              <input v-model.number="f.duree_heures" type="number" min="0" step="0.5" class="input" placeholder="Duree" @change="updateFormation(f)" />
              <input class="input" :value="formationTimeLabel(f)" readonly />
              <textarea v-model="f.description" rows="2" class="input sm:col-span-2" placeholder="Description" @change="updateFormation(f)"></textarea>
            </div>
            <p v-else-if="f.description" class="mt-2 text-sm text-slate-500">{{ f.description }}</p>

            <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <div><span class="block uppercase text-slate-400">Periode</span><strong>{{ date(f.date_debut) }} - {{ date(f.date_fin) }}</strong></div>
              <div><span class="block uppercase text-slate-400">Inscrits</span><strong>{{ f.inscriptions_count || 0 }}</strong></div>
              <div><span class="block uppercase text-slate-400">Termines</span><strong>{{ f.inscrits_termines_count || 0 }}</strong></div>
            </div>
          </article>
          <p v-if="!formations.length" class="empty xl:col-span-2">Aucune formation.</p>
        </div>
      </section>

      <section class="panel overflow-x-auto">
        <div class="mb-3 grid gap-2 lg:grid-cols-[1fr_190px_190px_160px_auto]">
          <input v-model="inscriptionFilters.search" class="input" placeholder="Rechercher employe, formation..." @keyup.enter="load" />
          <select v-if="canManage" v-model.number="inscriptionFilters.employe_id" class="input" @change="load"><option :value="null">Tous les employes</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
          <select v-model.number="inscriptionFilters.formation_id" class="input" @change="load"><option :value="null">Toutes formations</option><option v-for="f in formations" :key="f.id" :value="f.id">{{ f.titre }}</option></select>
          <select v-model="inscriptionFilters.statut" class="input" @change="load"><option value="">Tous statuts</option><option value="inscrit">Inscrit</option><option value="en_cours">En cours</option><option value="termine">Termine</option><option value="annule">Annule</option></select>
          <button class="btn-secondary" @click="load">Actualiser</button>
        </div>
        <table class="w-full"><thead><tr><th>Employe</th><th>Formation</th><th>Progression</th><th>Statut</th><th>Certification</th></tr></thead><tbody>
          <tr v-for="i in inscriptions" :key="i.id"><td>{{ nom(i.employe) }}</td><td>{{ i.formation.titre || '-' }}</td><td><div class="min-w-44"><div class="mb-1 flex items-center gap-2"><input v-if="canManage" v-model.number="i.progression" type="number" min="0" max="100" class="input w-24" @change="updateInscription(i)" /><span v-else>{{ i.progression }}%</span></div><div class="h-2 overflow-hidden rounded bg-slate-100"><div class="h-full rounded" :class="trainingProgressClass(i)" :style="{ width: Math.min(100, Number(i.progression || 0)) + '%' }"></div></div></div></td><td><select v-if="canManage" v-model="i.statut" class="input min-w-36" @change="updateInscription(i)"><option value="inscrit">Inscrit</option><option value="en_cours">En cours</option><option value="termine">Termine</option><option value="annule">Annule</option></select><span v-else>{{ i.statut }}</span></td><td><input v-if="canManage" v-model="i.certification" class="input min-w-48" placeholder="Certificat obtenu" @change="updateInscription(i)" /><span v-else>{{ i.certification || '-' }}</span></td></tr>
          <tr v-if="!inscriptions.length"><td colspan="5" class="empty">Aucune inscription.</td></tr>
        </tbody></table>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import FileTable from './RhFileTable.vue'
const props = defineProps({ section: String, canManage: Boolean, employes: { type: Array, default: () => [] }, postes: { type: Array, default: () => [] } })
const toast = useToast(), offres = ref([]), candidats = ref([]), objectifs = ref([]), evaluations = ref([]), documents = ref([]), bulletins = ref([]), formations = ref([]), inscriptions = ref([])
const contrats = ['cdi', 'cdd', 'stage', 'prestation', 'journalier'], candidatStatuts = ['nouveau', 'preselectionne', 'entretien', 'offre', 'embauche', 'refuse'], documentTypes = ['contrat', 'identite', 'politique', 'evaluation', 'autre']
const recruitmentSearch = ref(''), recruitmentFilter = ref('')
const offreForm = reactive({ poste_id: null, titre: '', description: '', type_contrat: 'cdi', nb_postes: 1, statut: 'ouverte', date_publication: '', date_cloture: '' }), candidatForm = reactive({ offre_id: null, prenom: '', nom: '', email: '', telephone: '', source: '', statut: 'nouveau', notes: '' })
const objectifForm = reactive({ employe_id: null, titre: '', description: '', date_debut: '', date_fin: '', cible: null, realise: 0, unite: '%', statut: 'en_cours' }), evaluationForm = reactive({ employe_id: null, periode_debut: '', periode_fin: '', note: null, statut: 'brouillon', commentaire: '' })
const performanceSearch = ref(''), performanceFilter = ref('')
const documentForm = reactive({ employe_id: null, type: 'autre', titre: '', date_document: '', date_expiration: '', statut: 'valide', description: '', visible_employe: false, fichier: null }), documentFilters = reactive({ search: '', type: '', statut: '', expiration: '' }), bulletinForm = reactive({ employe_id: null, periode: '', fichier: null }), bulletinFilters = reactive({ search: '', employe_id: null, annee: '', periode: '' })
const paieForm = reactive({ employe_id: null, periode: new Date().toISOString().slice(0, 7), salaire_base: 0, primes: 0, indemnites: 0, heures_supplementaires: 0, retenues: 0, avances: 0, cotisations_salariales: 0, mode_paiement: 'virement', notes: '' })
const formationForm = reactive({ titre: '', organisme: '', date_debut: '', date_fin: '', duree_heures: null, statut: 'ouverte', description: '' }), formationFilters = reactive({ search: '', statut: '', annee: '' }), inscriptionForm = reactive({ formation_id: null, employe_id: null }), inscriptionFilters = reactive({ search: '', employe_id: null, formation_id: null, statut: '' })
function nom(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : '-' } function date(v) { return v ? new Date(v).toLocaleDateString('fr-FR') : '-' } function normalizeDate(v) { return v ? String(v).slice(0, 10) : null } function progression(o) { return Math.min(100, Math.round((Number(o.realise) / Math.max(1, Number(o.cible))) * 100)) } function money(v) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(v || 0)) + ' XOF' }
function statusLabel(s) { return { nouveau: 'Nouveau', preselectionne: 'Preselection', entretien: 'Entretien', offre: 'Offre', embauche: 'Embauche', refuse: 'Refuse' }[s] || s || '-' }
function candidateStatusClass(s) { return { nouveau: 'bg-slate-100 text-slate-700', preselectionne: 'bg-blue-100 text-blue-700', entretien: 'bg-violet-100 text-violet-700', offre: 'bg-amber-100 text-amber-700', embauche: 'bg-green-100 text-green-700', refuse: 'bg-red-100 text-red-700' }[s] || 'bg-slate-100 text-slate-700' }
function offreStatusClass(s) { return { brouillon: 'bg-slate-100 text-slate-700', ouverte: 'bg-green-100 text-green-700', fermee: 'bg-red-100 text-red-700', pourvue: 'bg-blue-100 text-blue-700' }[s] || 'bg-slate-100 text-slate-700' }
function candidatesByStatus(status) { return candidats.value.filter(c => c.statut === status) }
const visibleRecruitmentStatuses = computed(() => recruitmentFilter.value ? [recruitmentFilter.value] : candidatStatuts)
const filteredCandidates = computed(() => {
  const term = recruitmentSearch.value.trim().toLowerCase()
  return candidats.value.filter(c => {
    if (recruitmentFilter.value && c.statut !== recruitmentFilter.value) return false
    if (!term) return true
    return [c.prenom, c.nom, c.email, c.telephone, c.source, c.offre.titre].some(v => String(v || '').toLowerCase().includes(term))
  })
})
function filteredCandidatesByStatus(status) { return filteredCandidates.value.filter(c => c.statut === status) }
function formationTimeLabel(f) { if (f.etat_temps === 'planifiee') return 'Planifiée'; if (f.etat_temps === 'en_cours') return f.jours_restants === null ? 'En cours' : String(f.jours_restants) + ' j restants'; if (f.etat_temps === 'terminee') return 'Terminée'; return 'Non planifiée' } function documentEtatLabel(d) { return { expire: 'Expire', a_renouveler: 'A renouveler', archive: 'Archive', sans_expiration: 'Sans expiration', valide: 'Valide' }[d.etat_expiration || d.statut] || d.statut || '-' } function documentEtatClass(d) { return { expire: 'bg-red-100 text-red-700', a_renouveler: 'bg-amber-100 text-amber-700', archive: 'bg-slate-100 text-slate-600', sans_expiration: 'bg-slate-100 text-slate-600', valide: 'bg-emerald-100 text-emerald-700' }[d.etat_expiration || d.statut] || 'bg-slate-100 text-slate-600' }

const currentYear = String(new Date().getFullYear())
const currentMonth = new Date().toISOString().slice(0, 7)
const paiePreview = computed(() => {
  const brut = Number(paieForm.salaire_base || 0) + Number(paieForm.primes || 0) + Number(paieForm.indemnites || 0) + Number(paieForm.heures_supplementaires || 0)
  const retenues = Number(paieForm.retenues || 0) + Number(paieForm.avances || 0) + Number(paieForm.cotisations_salariales || 0)
  return { brut, retenues, net: Math.max(0, brut - retenues) }
})
const payrollCards = computed(() => {
  const currentYearCount = bulletins.value.filter(b => String(b.periode || '').startsWith(currentYear + '-')).length
  const currentMonthCount = bulletins.value.filter(b => b.periode === currentMonth).length
  const employeeIds = new Set(bulletins.value.map(b => b.employe_id).filter(Boolean))
  const monthNet = bulletins.value.filter(b => b.periode === currentMonth).reduce((sum, b) => sum + Number(b.net_a_payer || 0), 0)
  return [
    { key: 'total', label: 'Bulletins', value: bulletins.value.length, color: 'text-slate-900' },
    { key: 'year', label: 'Annee en cours', value: currentYearCount, color: 'text-blue-700' },
    { key: 'month', label: 'Mois en cours', value: currentMonthCount, color: 'text-green-700' },
    { key: 'employees', label: 'Employes couverts', value: employeeIds.size, color: 'text-violet-700' },
    { key: 'net_month', label: 'Net du mois', value: money(monthNet), color: 'text-emerald-700' },
  ]
})
function applyPayrollQuickFilter(key) {
  if (key === 'year') bulletinFilters.annee = currentYear
  if (key === 'month') bulletinFilters.periode = currentMonth
  if (key === 'total' || key === 'employees') Object.assign(bulletinFilters, { search: '', employe_id: null, annee: '', periode: '' })
  load()
}

const trainingCards = computed(() => [
  { key: 'total', label: 'Formations', value: formations.value.length, color: 'text-slate-900' },
  { key: 'ouverte', label: 'Ouvertes', value: formations.value.filter(f => f.statut === 'ouverte').length, color: 'text-blue-700' },
  { key: 'en_cours', label: 'En cours', value: formations.value.filter(f => f.statut === 'en_cours').length, color: 'text-amber-700' },
  { key: 'terminee', label: 'Terminees', value: formations.value.filter(f => f.statut === 'terminee').length, color: 'text-green-700' },
])
function applyTrainingQuickFilter(key) {
  formationFilters.statut = key === 'total' ? '' : key
  load()
}
function formationStatusLabel(statut) {
  return { brouillon: 'Brouillon', ouverte: 'Ouverte', en_cours: 'En cours', terminee: 'Terminee' }[statut] || statut || '-'
}
function formationStatusClass(statut) {
  return { brouillon: 'bg-slate-100 text-slate-700', ouverte: 'bg-blue-100 text-blue-700', en_cours: 'bg-amber-100 text-amber-700', terminee: 'bg-green-100 text-green-700' }[statut] || 'bg-slate-100 text-slate-700'
}
function trainingProgressClass(item) {
  if (item.statut === 'termine' || Number(item.progression || 0) >= 100) return 'bg-green-600'
  if (item.statut === 'annule') return 'bg-slate-400'
  if (Number(item.progression || 0) < 50) return 'bg-amber-500'
  return 'bg-blue-600'
}
async function load() { const s = props.section; if (s === 'recrutement' && props.canManage) [offres.value, candidats.value] = await Promise.all([api.get('/rh/recrutement/offres').then(r => r.data), api.get('/rh/recrutement/candidats').then(r => r.data)]); if (s === 'performance') [objectifs.value, evaluations.value] = await Promise.all([api.get('/rh/performance/objectifs').then(r => r.data), api.get('/rh/performance/evaluations').then(r => r.data)]); if (s === 'documents') documents.value = (await api.get('/rh/documents', { params: documentFilters })).data; if (s === 'paie') bulletins.value = (await api.get('/rh/paie/bulletins', { params: bulletinFilters })).data; if (s === 'formations') [formations.value, inscriptions.value] = await Promise.all([api.get('/rh/formations', { params: formationFilters }).then(r => r.data), api.get('/rh/formations/inscriptions', { params: inscriptionFilters }).then(r => r.data)]) }
async function act(fn, message) { try { await fn(); toast.success(message); await load() } catch (e) { toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Action impossible.') } }
const saveOffre = () => act(() => api.post('/rh/recrutement/offres', offreForm), 'Offre créée.')
const saveCandidat = () => act(() => api.post('/rh/recrutement/candidats', candidatForm), 'Candidat ajouté.')
const updateCandidat = c => act(() => api.put(`/rh/recrutement/candidats/${c.id}`, { statut: c.statut }), 'Pipeline actualisé.')
const saveObjectif = () => act(() => api.post('/rh/performance/objectifs', objectifForm), 'Objectif créé.')
const updateObjectif = o => act(() => api.put(`/rh/performance/objectifs/${o.id}`, { realise: o.realise }), 'Progression actualisée.')
const saveEvaluation = () => act(() => api.post('/rh/performance/evaluations', evaluationForm), 'Évaluation enregistrée.')
function formData(obj) { const f = new FormData(); Object.entries(obj).forEach(([k, v]) => { if (v !== null && v !== '') f.append(k, typeof v === 'boolean' ? Number(v) : v) }); return f }
const uploadDocument = () => act(() => api.post('/rh/documents', formData(documentForm), { headers: { 'Content-Type': 'multipart/form-data' } }).then(() => Object.assign(documentForm, { employe_id: null, type: 'autre', titre: '', date_document: '', date_expiration: '', statut: 'valide', description: '', visible_employe: false, fichier: null })), 'Document depose.')
const updateDocument = d => act(() => api.put(`/rh/documents/${d.id}`, { employe_id: d.employe_id || null, type: d.type, titre: d.titre, date_document: normalizeDate(d.date_document), date_expiration: normalizeDate(d.date_expiration), statut: d.statut, description: d.description || '', visible_employe: Boolean(d.visible_employe) }), 'Document mis a jour.')
const uploadBulletin = () => act(() => api.post('/rh/paie/bulletins', formData(bulletinForm), { headers: { 'Content-Type': 'multipart/form-data' } }).then(() => Object.assign(bulletinForm, { employe_id: null, periode: '', fichier: null })), 'Bulletin publie.')
const generateBulletin = () => act(() => api.post('/rh/paie/generer-bulletin', { ...paieForm }).then(() => resetPaieForm()), 'Fiche de paie generee.')
function resetPaieForm() { Object.assign(paieForm, { employe_id: null, periode: currentMonth, salaire_base: 0, primes: 0, indemnites: 0, heures_supplementaires: 0, retenues: 0, avances: 0, cotisations_salariales: 0, mode_paiement: 'virement', notes: '' }) }
const saveFormation = () => act(() => api.post('/rh/formations', formationForm).then(() => Object.assign(formationForm, { titre: '', organisme: '', date_debut: '', date_fin: '', duree_heures: null, statut: 'ouverte', description: '' })), 'Formation creee.')
const updateFormation = f => act(() => api.put(`/rh/formations/${f.id}`, { titre: f.titre, organisme: f.organisme || '', date_debut: normalizeDate(f.date_debut), date_fin: normalizeDate(f.date_fin), duree_heures: f.duree_heures || null, statut: f.statut, description: f.description || '' }), 'Formation mise a jour.')
const assignFormation = () => act(() => api.post(`/rh/formations/${inscriptionForm.formation_id}/inscriptions`, { employe_id: inscriptionForm.employe_id }), 'Employé inscrit.')
const updateInscription = i => act(() => api.put(`/rh/formations/inscriptions/${i.id}`, { progression: i.progression }), 'Progression actualisée.')
async function download(prefix, item) { try { const r = await api.get(`${prefix}${item.id}/telecharger`, { responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = item.nom_original; a.click(); URL.revokeObjectURL(a.href) } catch { toast.error('Téléchargement impossible.') } }
watch(() => props.section, load); onMounted(load)
</script>

<style scoped>
.panel { @apply rounded-lg border border-slate-200 bg-white p-4; }.title { @apply font-bold text-slate-900; } th { @apply whitespace-nowrap bg-slate-50 px-3 py-2 text-left text-xs uppercase text-slate-500; } td { @apply whitespace-nowrap border-t border-slate-100 px-3 py-2 text-sm text-slate-700; }.empty { @apply py-8 text-center text-sm text-slate-400; }
</style>


