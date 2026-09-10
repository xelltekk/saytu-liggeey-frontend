<template>
  <div class="space-y-4">
    <section class="theme-hero-card rounded-2xl p-5 text-white">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] opacity-80">XELLTEKK</p>
          <h1 class="mt-1 text-2xl font-black">Admin licences clients</h1>
          <p class="mt-1 max-w-3xl text-sm opacity-85">
            Créez les clés, choisissez les modules, renouvelez les abonnements et copiez le certificat à installer chez le client.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary bg-white/90" :disabled="loading" @click="loadDashboard">
            <RefreshCw class="h-4 w-4" />
            Actualiser
          </button>
          <button type="button" class="btn-primary" @click="resetForm">
            <Plus class="h-4 w-4" />
            Nouvelle licence
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in statCards" :key="card.label" class="xell-card">
        <div>
          <p class="xell-card-label">{{ card.label }}</p>
          <p class="mt-2 text-2xl font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ card.value }}</p>
          <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">{{ card.hint }}</p>
        </div>
        <span class="xell-card-icon">
          <component :is="card.icon" class="h-5 w-5" />
        </span>
      </article>
    </section>

    <section class="xell-panel overflow-hidden">
      <div class="xell-panel-header">
        <div>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Santé SaaS</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Contrôle rapide de l’isolation, des sous-domaines, licences, utilisateurs et fichiers par client.
          </p>
        </div>
        <span
          class="rounded-full px-3 py-1 text-xs font-black"
          :class="saasHealth.summary.blocked_clients > 0 ? 'bg-red-100 text-red-700' : (saasHealth.summary.warning_clients > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')"
        >
          {{ saasHealth.summary.ready_clients }}/{{ saasHealth.summary.total_clients }} prêt(s)
        </span>
      </div>

      <div class="grid gap-3 p-4 xl:grid-cols-[300px_1fr]">
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <article v-for="card in saasHealthCards" :key="card.label" class="xell-saas-summary">
            <span class="xell-card-icon h-9 w-9 rounded-xl">
              <component :is="card.icon" class="h-4 w-4" />
            </span>
            <div>
              <p class="xell-card-label">{{ card.label }}</p>
              <p class="mt-1 text-lg font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ card.value }}</p>
              <p class="text-[11px] font-semibold text-[color:var(--saytu-muted,#64748b)]">{{ card.hint }}</p>
            </div>
          </article>
        </div>

        <div class="space-y-2">
          <article
            v-for="item in saasHealthItems"
            :key="item.id"
            class="xell-saas-row"
            :class="`xell-saas-row-${item.status || 'warning'}`"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">
                  {{ item.client_nom || 'Client sans nom' }}
                </h3>
                <span class="rounded-full px-2 py-0.5 text-[11px] font-black" :class="saasHealthStatusClass(item.status)">
                  {{ item.status_label || 'À vérifier' }}
                </span>
                <a
                  v-if="workspaceUrl(item)"
                  :href="workspaceUrl(item)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="truncate rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-2 py-0.5 text-[11px] font-black text-[color:var(--saytu-primary,#2563eb)] hover:underline"
                >
                  {{ workspaceLabel(item) }}
                </a>
              </div>

              <div class="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-[color:var(--saytu-muted,#64748b)]">
                <span class="xell-saas-metric"><Server class="h-3.5 w-3.5" /> Tenant #{{ item.tenant_id || '-' }}</span>
                <span class="xell-saas-metric"><Users class="h-3.5 w-3.5" /> {{ item.users_count || 0 }} utilisateur(s)</span>
                <span class="xell-saas-metric"><Database class="h-3.5 w-3.5" /> {{ item.business_rows_total || 0 }} ligne(s)</span>
                <span class="xell-saas-metric"><HardDrive class="h-3.5 w-3.5" /> {{ item.storage?.total_label || '0 o' }}</span>
                <span class="xell-saas-metric"><KeyRound class="h-3.5 w-3.5" /> {{ item.licence_label || 'Sans licence' }} · {{ item.licence_ends_at ? formatDate(item.licence_ends_at) : 'sans fin' }}</span>
              </div>

              <div v-if="visibleBusinessCounts(item).length" class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="count in visibleBusinessCounts(item)" :key="`${item.id}-${count.table}`" class="xell-saas-count-chip">
                  {{ count.label }} {{ count.count }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="check in item.checks || []"
                  :key="`${item.id}-${check.key}`"
                  class="xell-saas-check"
                  :class="saasCheckClass(check.state)"
                  :title="check.detail"
                >
                  <CheckCircle2 v-if="check.state === 'ok'" class="h-3 w-3" />
                  <AlertTriangle v-else class="h-3 w-3" />
                  {{ check.label }}
                </span>
              </div>
            </div>

            <button
              type="button"
              class="xell-saas-export"
              :disabled="exportingTenantId === item.id || !item.tenant_id"
              @click="exportTenantData(item)"
            >
              <Download class="h-3.5 w-3.5" />
              {{ exportingTenantId === item.id ? 'Export...' : 'Export' }}
            </button>
          </article>

          <div v-if="!saasHealthItems.length" class="rounded-2xl border border-dashed border-[color:var(--saytu-border,#e2e8f0)] p-4 text-center text-sm font-bold text-[color:var(--saytu-muted,#64748b)]">
            Aucun client SaaS à contrôler pour le moment.
          </div>
        </div>
      </div>
    </section>

    <section v-if="licenceActionGroups.length" class="xell-panel overflow-hidden">
      <div class="xell-panel-header">
        <div>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Centre d’action licences</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Les dossiers à traiter en priorité pour garder les clients actifs et relancer vite.
          </p>
        </div>
        <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-3 py-1 text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">
          {{ licenceActionTotal }} action(s)
        </span>
      </div>

      <div class="grid gap-3 p-4 xl:grid-cols-4">
        <article
          v-for="group in licenceActionGroups"
          :key="group.key"
          class="xell-action-card"
          :class="`xell-action-card-${group.tone}`"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="xell-card-label">{{ group.title }}</p>
              <p class="mt-1 text-2xl font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ group.count }}</p>
              <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">{{ group.hint }}</p>
            </div>
            <span class="xell-action-icon">
              <component :is="group.icon" class="h-4 w-4" />
            </span>
          </div>

          <div class="mt-3 space-y-2">
            <div v-for="licence in group.items" :key="`${group.key}-${licence.id}`" class="xell-action-row">
              <button type="button" class="min-w-0 flex-1 text-left" @click="editLicence(licence)">
                <span class="block truncate text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">
                  {{ licence.client_nom || 'Client sans nom' }}
                </span>
                <span class="block truncate text-[11px] font-semibold text-[color:var(--saytu-muted,#64748b)]">
                  {{ group.detail(licence) }}
                </span>
              </button>

              <button
                v-if="group.key === 'a_envoyer'"
                type="button"
                class="xell-action-link"
                :disabled="sendingEmailId === licence.id"
                @click="sendOnboardingEmail(licence)"
              >
                Envoyer
              </button>
              <button
                v-else-if="group.key === 'expirees' || group.key === 'a_renouveler'"
                type="button"
                class="xell-action-link"
                @click="renewLicence(licence)"
              >
                +12m
              </button>
              <button
                v-else
                type="button"
                class="xell-action-link"
                @click="toggleLicenceStatus(licence)"
              >
                Réactiver
              </button>
            </div>

            <p v-if="group.moreCount > 0" class="text-[11px] font-bold text-[color:var(--saytu-muted,#64748b)]">
              + {{ group.moreCount }} autre(s) — utilisez la recherche pour filtrer.
            </p>
          </div>
        </article>
      </div>
    </section>

    <section v-if="demoRequests.length" class="xell-panel overflow-hidden">
      <div class="xell-panel-header">
        <div>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Demandes démo</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Prospects captés depuis la page publique.
          </p>
        </div>
        <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-3 py-1 text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">
          {{ demoRequests.length }} à traiter
        </span>
      </div>

      <div class="grid gap-3 p-4 lg:grid-cols-2">
        <article v-for="lead in demoRequests" :key="lead.id" class="xell-lead-row">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ lead.nom }}</h3>
              <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">Prospect</span>
            </div>
            <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">
              {{ lead.email || 'Email non renseigné' }} · {{ lead.telephone || 'Téléphone non renseigné' }}
            </p>
            <a
              v-if="workspaceUrl(lead)"
              :href="workspaceUrl(lead)"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-flex max-w-full truncate rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-2 py-0.5 text-[11px] font-black text-[color:var(--saytu-primary,#2563eb)] hover:underline"
            >
              {{ workspaceLabel(lead) }}
            </a>
            <p class="mt-2 xell-lead-notes">{{ lead.notes }}</p>
          </div>
          <button type="button" class="btn-primary shrink-0 px-3 py-2 text-xs" @click="startLicenceFromLead(lead)">
            <Plus class="h-4 w-4" />
            Préparer licence
          </button>
        </article>
      </div>
    </section>

    <section class="xell-panel overflow-hidden">
      <div class="xell-panel-header">
        <div>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Configuration email</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Envoi serveur des offres XELLTEKK avec devis et contrat PDF en pièces jointes.
          </p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-black" :class="emailSettings.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
          {{ emailSettings.configured ? 'SMTP prêt' : 'À configurer' }}
        </span>
      </div>

      <div class="grid gap-4 p-4 xl:grid-cols-[1fr_320px]">
        <div class="grid gap-3 md:grid-cols-3">
          <label>
            <span class="label">Email expéditeur</span>
            <input v-model="emailForm.from_address" type="email" class="input" placeholder="xelltekk@xelltekk.com" />
          </label>

          <label>
            <span class="label">Nom expéditeur</span>
            <input v-model="emailForm.from_name" class="input" placeholder="XELLTEKK" />
          </label>

          <label class="flex items-end gap-2 rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-shell-bg,#f8fafc)] px-3 py-2">
            <input v-model="emailForm.is_active" type="checkbox" class="h-4 w-4 accent-[color:var(--saytu-primary,#2563eb)]" />
            <span class="pb-1 text-sm font-bold text-[color:var(--saytu-shell-text,#0f172a)]">Envoi serveur actif</span>
          </label>

          <label>
            <span class="label">Serveur SMTP</span>
            <input v-model="emailForm.host" class="input" placeholder="mail.infomaniak.com" />
          </label>

          <label>
            <span class="label">Port</span>
            <input v-model="emailForm.port" data-numeric-input class="input" placeholder="587" />
          </label>

          <label>
            <span class="label">Sécurité</span>
            <select v-model="emailForm.scheme" class="input">
              <option value="smtp">STARTTLS / 587</option>
              <option value="smtps">SSL / 465</option>
            </select>
          </label>

          <label>
            <span class="label">Utilisateur SMTP</span>
            <input v-model="emailForm.username" type="email" class="input" placeholder="xelltekk@xelltekk.com" />
          </label>

          <label class="md:col-span-2">
            <span class="label">Mot de passe SMTP</span>
            <input v-model="emailForm.password" type="password" class="input" :placeholder="emailSettings.password_configured ? 'Déjà configuré — laisser vide pour conserver' : 'Mot de passe de la boîte mail'" autocomplete="new-password" />
          </label>
        </div>

        <div class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3">
          <p class="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">État SMTP</p>
          <p class="mt-2 text-sm font-bold text-[color:var(--saytu-shell-text,#0f172a)]">{{ emailSettings.status_message }}</p>
          <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">
            Mot de passe : {{ emailSettings.password_configured ? 'configuré et chiffré' : 'non renseigné' }}
          </p>
          <p v-if="emailSettings.last_tested_at" class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">
            Dernier test : {{ formatDateTime(emailSettings.last_tested_at) }}
          </p>

          <label class="mt-3 block">
            <span class="label">Destinataire test</span>
            <input v-model="emailForm.test_to" type="email" class="input" placeholder="xelltekk@xelltekk.com" />
          </label>

          <div class="mt-3 grid gap-2">
            <button type="button" class="btn-primary" :disabled="savingEmailSettings" @click="saveEmailSettings()">
              <Save class="h-4 w-4" />
              {{ savingEmailSettings ? 'Sauvegarde...' : 'Enregistrer SMTP' }}
            </button>
            <button type="button" class="btn-secondary" :disabled="testingEmailSettings || savingEmailSettings" @click="testEmailSettings">
              <Send class="h-4 w-4" />
              {{ testingEmailSettings ? 'Test...' : 'Tester l’envoi' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="xell-panel overflow-hidden">
      <div class="xell-panel-header">
        <div>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Assistant onboarding client</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Un parcours court : client, offre, documents commerciaux, puis licence d’activation.
          </p>
        </div>
        <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-3 py-1 text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">
          {{ editingId ? 'Pack prêt' : 'Nouveau client' }}
        </span>
      </div>

      <div class="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
        <div class="grid gap-3 md:grid-cols-4">
          <article
            v-for="step in onboardingSteps"
            :key="step.label"
            class="xell-step"
            :class="step.done ? 'xell-step-done' : ''"
          >
            <div class="flex items-center gap-2">
              <span class="xell-step-number">{{ step.index }}</span>
              <h3 class="font-black">{{ step.label }}</h3>
            </div>
            <p class="mt-2 text-xs text-[color:var(--saytu-muted,#64748b)]">{{ step.hint }}</p>
          </article>
        </div>

        <div class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3">
          <p class="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">Pack commercial</p>
          <p class="mt-2 font-black text-[color:var(--saytu-shell-text,#0f172a)]">
            {{ form.client_nom || 'Client à renseigner' }}
          </p>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            {{ planLabel(form.plan) }} · {{ money(form.montant_mensuel) }} {{ currencyLabel(form.devise) }}/mois · {{ form.modules_autorises.length }} module(s)
          </p>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button type="button" class="btn-primary col-span-2" :disabled="saving" @click="saveLicence">
              <Save class="h-4 w-4" />
              {{ editingId ? 'Mettre à jour le pack' : 'Créer licence + pack' }}
            </button>
            <button type="button" class="btn-secondary col-span-2 px-3 py-2 text-xs" :disabled="!activeLicence || sendingEmailId === activeLicence?.id" @click="sendOnboardingEmail(activeLicence)">
              <Send class="h-4 w-4" />
              {{ sendingEmailId === activeLicence?.id ? 'Envoi...' : 'Envoyer offre + PDF' }}
            </button>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="!activeLicence" @click="openDocument(activeLicence, 'devis')">
              <FileText class="h-4 w-4" />
              Devis
            </button>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="!activeLicence" @click="openDocument(activeLicence, 'contrat')">
              <FileSignature class="h-4 w-4" />
              Contrat
            </button>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="!activeLicence" @click="prepareOnboardingEmail(activeLicence)">
              <Mail class="h-4 w-4" />
              Email
            </button>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="!activeLicence?.licence_certificate" @click="copyText(activeLicence?.licence_certificate, 'Certificat copié.')">
              <Copy class="h-4 w-4" />
              Certificat
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="loading" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#fff)] p-8 text-center text-[color:var(--saytu-muted,#64748b)]">
      Chargement de l’espace XELLTEKK Admin...
    </section>

    <section v-else class="grid gap-4 xl:grid-cols-[480px_1fr]">
      <form class="xell-panel overflow-hidden" @submit.prevent="saveLicence">
        <div class="xell-panel-header">
          <div>
            <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">
              {{ editingId ? 'Modifier une licence' : 'Créer une licence' }}
            </h2>
            <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
              Le certificat généré sera signé et copiable pour l’installation client.
            </p>
          </div>
          <span v-if="editingId" class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-3 py-1 text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">
            Édition
          </span>
        </div>

        <div class="space-y-4 p-4">
          <div class="grid gap-3 md:grid-cols-2">
            <label class="md:col-span-2">
              <span class="label">Client / société <span class="text-red-500">*</span></span>
              <input v-model="form.client_nom" required class="input" placeholder="Nom du client" />
            </label>

            <label>
              <span class="label">Email</span>
              <input v-model="form.client_email" type="email" class="input" placeholder="client@entreprise.com" />
            </label>

            <label>
              <span class="label">Téléphone</span>
              <input v-model="form.client_telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
            </label>

            <label>
              <span class="label">Sous-domaine / domaine</span>
              <input v-model="form.domaine" class="input" placeholder="client.saytu.xelltekk.com" />
              <a
                v-if="form.domaine"
                :href="urlFromDomain(form.domaine)"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-1 inline-block text-xs font-black text-[color:var(--saytu-primary,#2563eb)] hover:underline"
              >
                Ouvrir l’espace
              </a>
            </label>

            <label>
              <span class="label">Contact</span>
              <input v-model="form.contact_nom" class="input" placeholder="Nom du contact" />
            </label>

            <label>
              <span class="label">Formule</span>
              <select v-model="form.plan" class="input xell-select" required @change="applyPlanModules">
                <option disabled value="">Choisir une formule</option>
                <option v-for="(plan, key) in plans" :key="key" :value="key">{{ plan.label }}</option>
              </select>
            </label>

            <label>
              <span class="label">Statut</span>
              <select v-model="form.statut" class="input xell-select" required>
                <option disabled value="">Choisir un statut</option>
                <option v-for="(label, key) in statuts" :key="key" :value="key">{{ label }}</option>
              </select>
            </label>

            <label>
              <span class="label">Début</span>
              <input v-model="form.date_debut" type="date" class="input" />
            </label>

            <label>
              <span class="label">Fin</span>
              <input v-model="form.date_fin" type="date" class="input" />
            </label>

            <label>
              <span class="label">Utilisateurs max</span>
              <input v-model="form.max_utilisateurs" data-numeric-input class="input" placeholder="Illimité" />
            </label>

            <label>
              <span class="label">Mensuel</span>
              <input v-model="form.montant_mensuel" data-numeric-input data-decimals="2" class="input" placeholder="0" />
            </label>

            <label>
              <span class="label">Devise</span>
              <select v-model="form.devise" class="input">
                <option value="XOF">XOF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </label>

            <label>
              <span class="label">Fin essai</span>
              <input v-model="form.periode_essai_fin" type="date" class="input" />
            </label>
          </div>

          <section class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] p-3">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Contrat PDF</h3>
                <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
                  Ces informations apparaissent sur le devis, le contrat et l’email client.
                </p>
              </div>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="applyContractDefaults">
                Conditions types
              </button>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <label>
                <span class="label">Périodicité</span>
                <select v-model="form.billing_cycle" class="input" @change="applyPaymentTermsForCycle(true)">
                  <option v-for="(label, key) in billingCycles" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>

              <label>
                <span class="label">Frais d’activation</span>
                <input v-model="form.setup_fee" data-numeric-input data-decimals="2" class="input" placeholder="0" />
              </label>

              <label>
                <span class="label">Préavis résiliation (jours)</span>
                <input v-model="form.cancellation_notice_days" data-numeric-input class="input" placeholder="30" />
              </label>

              <label>
                <span class="label">Support</span>
                <select v-model="form.support_level" class="input">
                  <option v-for="(label, key) in supportLevels" :key="key" :value="label">{{ supportLabel(key) }}</option>
                </select>
              </label>

              <label class="md:col-span-2">
                <span class="label">Modalités de paiement</span>
                <textarea v-model="form.payment_terms" class="input min-h-20" placeholder="Ex : paiement mensuel à la réception de facture."></textarea>
              </label>

              <label class="md:col-span-2">
                <span class="label">Conditions particulières</span>
                <textarea v-model="form.contract_terms" class="input min-h-24" placeholder="Clauses particulières visibles sur le contrat client."></textarea>
              </label>
            </div>
          </section>

          <section class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] p-3">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Modules autorisés</h3>
                <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">{{ form.modules_autorises.length }} module(s) sélectionné(s).</p>
              </div>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="applyPlanModules">
                Formule
              </button>
            </div>

            <div class="max-h-72 space-y-3 overflow-y-auto pr-1">
              <div v-for="group in groupedModules" :key="group.name">
                <p class="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">{{ group.name }}</p>
                <div class="grid gap-2 sm:grid-cols-2">
                  <button
                    v-for="module in group.items"
                    :key="module.key"
                    type="button"
                    class="xell-module-chip"
                    :class="moduleEnabled(module.key) ? 'xell-module-chip-active' : ''"
                    @click="toggleModule(module.key)"
                  >
                    {{ module.label }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <label>
            <span class="label">Notes internes</span>
            <textarea v-model="form.notes" class="input min-h-20" placeholder="Suivi commercial, conditions, observations..."></textarea>
          </label>

          <div class="flex flex-wrap justify-end gap-2 border-t border-[color:var(--saytu-border,#e2e8f0)] pt-3">
            <button type="button" class="btn-secondary" @click="resetForm">Réinitialiser</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <Save class="h-4 w-4" />
              {{ saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer + générer le pack' }}
            </button>
          </div>
        </div>
      </form>

      <section class="xell-panel overflow-hidden">
        <div class="xell-panel-header">
          <div>
            <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Portefeuille licences</h2>
            <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
              {{ filteredLicences.length }} licence(s) affichée(s).
            </p>
          </div>
          <div class="relative w-full max-w-xs">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--saytu-muted,#64748b)]" />
            <input v-model="search" class="input pl-9" placeholder="Rechercher client, clé..." />
          </div>
        </div>

        <div class="max-h-[calc(100vh-22rem)] min-h-[30rem] overflow-y-auto p-3">
          <article
            v-for="licence in filteredLicences"
            :key="licence.id"
            class="xell-licence-row"
            :class="editingId === licence.id ? 'xell-licence-row-active' : ''"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ licence.client_nom || 'Client sans nom' }}</h3>
                <span class="rounded-full px-2 py-0.5 text-[11px] font-black" :class="statusClass(licence)">
                  {{ statutLabel(licence.statut) }}
                </span>
                <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-2 py-0.5 text-[11px] font-black text-[color:var(--saytu-primary,#2563eb)]">
                  {{ licence.plan_label }}
                </span>
              </div>
              <p class="mt-1 truncate text-xs text-[color:var(--saytu-muted,#64748b)]">
                {{ licence.numero }} · {{ licence.licence_key }}
              </p>
              <div class="mt-2 grid gap-2 text-xs text-[color:var(--saytu-muted,#64748b)] sm:grid-cols-4">
                <span><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Fin :</strong> {{ formatDate(licence.date_fin) }}</span>
                <span><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Modules :</strong> {{ licence.modules_count }}</span>
                <span><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Mensuel :</strong> {{ money(licence.montant_mensuel) }} {{ licence.devise }}</span>
                <a
                  v-if="workspaceUrl(licence)"
                  :href="workspaceUrl(licence)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="truncate font-black text-[color:var(--saytu-primary,#2563eb)] hover:underline"
                >
                  {{ workspaceLabel(licence) }}
                </a>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="editLicence(licence)">
                Modifier
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="copyText(licence.licence_certificate, 'Certificat copié.')">
                <Copy class="h-4 w-4" />
                Certificat
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="openDocument(licence, 'devis')">
                Devis
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="openDocument(licence, 'contrat')">
                Contrat
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="prepareOnboardingEmail(licence)">
                Email
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="resetAdminAccessLoadingId === licence.id" @click="resetTenantAdminAccess(licence)">
                <KeyRound class="h-4 w-4" />
                {{ resetAdminAccessLoadingId === licence.id ? '...' : 'Réinitialiser accès' }}
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="sendingEmailId === licence.id" @click="sendOnboardingEmail(licence)">
                <Send class="h-4 w-4" />
                {{ sendingEmailId === licence.id ? '...' : 'Envoyer' }}
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="renewLicence(licence)">
                +12 mois
              </button>
              <button
                type="button"
                class="btn-secondary px-3 py-2 text-xs"
                :class="licence.statut === 'suspendue' ? 'text-emerald-700' : 'text-red-700'"
                @click="toggleLicenceStatus(licence)"
              >
                {{ licence.statut === 'suspendue' ? 'Réactiver' : 'Suspendre' }}
              </button>
            </div>
          </article>

          <div v-if="!filteredLicences.length" class="rounded-2xl border border-dashed border-[color:var(--saytu-border,#e2e8f0)] p-8 text-center text-sm text-[color:var(--saytu-muted,#64748b)]">
            Aucune licence trouvée.
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileSignature,
  FileText,
  HardDrive,
  KeyRound,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-vue-next'
import api from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { buildMailtoUrl, closeReservedEmailComposerWindow, openEmailComposer, reserveEmailComposerWindow } from '@/utils/emailComposer'

const DEFAULT_MODULES = {
  dashboard: { label: 'Tableau de bord', group: 'Pilotage' },
  pilotage: { label: 'Aujourd’hui', group: 'Pilotage' },
  agenda: { label: 'Agenda', group: 'Pilotage' },
  clients: { label: 'Clients', group: 'Ventes' },
  prospection: { label: 'Prospection', group: 'Ventes' },
  devis: { label: 'Devis', group: 'Ventes' },
  factures: { label: 'Factures', group: 'Ventes' },
  caisse: { label: 'Caisse', group: 'Boutique' },
  produits: { label: 'Produits', group: 'Stock' },
  stock: { label: 'Stock & entrepôts', group: 'Stock' },
  achats: { label: 'Achats fournisseurs', group: 'Achats' },
  leasing: { label: 'Leasing imprimantes', group: 'Métiers' },
  paiements: { label: 'Paiements clients', group: 'Comptabilité' },
  recouvrement: { label: 'Recouvrement clients', group: 'Comptabilité' },
  depenses: { label: 'Dépenses', group: 'Comptabilité' },
  fournisseurs_reglements: { label: 'Règlements fournisseurs', group: 'Comptabilité' },
  comptabilite: { label: 'Écritures comptables', group: 'Analyse' },
  tresorerie: { label: 'Trésorerie', group: 'Analyse' },
  rh: { label: 'Ressources humaines', group: 'RH' },
  utilisateurs: { label: 'Utilisateurs', group: 'Administration' },
  access_control: { label: 'Rôles & permissions', group: 'Administration' },
  licence: { label: 'Licence & abonnement', group: 'Administration' },
  xelltekk_admin: { label: 'XELLTEKK Admin', group: 'Administration' },
  securite: { label: 'Sécurité & sauvegarde', group: 'Administration' },
  parametres: { label: 'Paramètres société', group: 'Administration' },
  activites: { label: 'Journal des activités', group: 'Administration' },
  corbeille: { label: 'Corbeille', group: 'Administration' },
  notifications: { label: 'Notifications', group: 'Système' },
  exports: { label: 'Exports', group: 'Système' },
}

const DEFAULT_PLANS = {
  starter: {
    label: 'Starter',
    description: 'Vente, clients, devis, factures, caisse et stock simple.',
    modules: ['dashboard', 'pilotage', 'agenda', 'clients', 'prospection', 'devis', 'factures', 'caisse', 'produits', 'stock', 'paiements', 'notifications'],
  },
  pro: {
    label: 'Pro',
    description: 'Gestion commerciale complète avec achats, trésorerie et recouvrement.',
    modules: ['dashboard', 'pilotage', 'agenda', 'clients', 'prospection', 'devis', 'factures', 'caisse', 'produits', 'stock', 'achats', 'paiements', 'recouvrement', 'depenses', 'fournisseurs_reglements', 'comptabilite', 'tresorerie', 'notifications'],
  },
  business: {
    label: 'Business',
    description: 'Tous les modules, administration avancée et pilotage complet.',
    modules: Object.keys(DEFAULT_MODULES),
  },
}

const DEFAULT_STATUTS = {
  actif: 'Active',
  essai: 'Essai',
  suspendue: 'Suspendue',
  expiree: 'Expirée',
}

const DEFAULT_TARIFS = {
  starter: 15000,
  pro: 30000,
  business: 50000,
}

const DEFAULT_CONTRACT_DEFAULTS = {
  billing_cycles: {
    mensuel: 'Mensuel',
    trimestriel: 'Trimestriel',
    annuel: 'Annuel',
  },
  payment_terms: {
    mensuel: 'Paiement mensuel à la réception de facture. Activation après signature du contrat et validation du premier règlement.',
    trimestriel: 'Paiement trimestriel à la réception de facture. Activation après signature du contrat et validation du premier règlement.',
    annuel: 'Paiement annuel à la réception de facture. Activation après signature du contrat et validation du premier règlement.',
  },
  support_levels: {
    standard: 'Support standard ouvré : assistance à l’utilisation, corrections et accompagnement raisonnable.',
    prioritaire: 'Support prioritaire ouvré : assistance accélérée, corrections et accompagnement renforcé.',
    premium: 'Support premium : assistance prioritaire, accompagnement avancé et suivi commercial dédié.',
  },
  contract_terms: '',
  cancellation_notice_days: 30,
}

const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const loading = ref(false)
const saving = ref(false)
const sendingEmailId = ref(null)
const resetAdminAccessLoadingId = ref(null)
const exportingTenantId = ref(null)
const savingEmailSettings = ref(false)
const testingEmailSettings = ref(false)
const search = ref('')
const editingId = ref(null)
const stats = reactive({
  clients: 0,
  licences_actives: 0,
  a_renouveler: 0,
  revenu_mensuel: 0,
})
const reference = reactive({
  plans: DEFAULT_PLANS,
  modules: DEFAULT_MODULES,
  statuts: DEFAULT_STATUTS,
  tarifs: DEFAULT_TARIFS,
  contract_defaults: cloneContractDefaults(),
})
const licences = ref([])
const clients = ref([])
const form = reactive(emptyForm())
const emailSettings = reactive(emptyEmailSettings())
const emailForm = reactive(emptyEmailForm())
const saasHealth = reactive(emptySaasHealth())

const plans = computed(() => nonEmptyObject(reference.plans) ? reference.plans : DEFAULT_PLANS)
const statuts = computed(() => nonEmptyObject(reference.statuts) ? reference.statuts : DEFAULT_STATUTS)
const tarifs = computed(() => nonEmptyObject(reference.tarifs) ? reference.tarifs : DEFAULT_TARIFS)
const contractDefaults = computed(() => normalizeContractDefaults(reference.contract_defaults))
const billingCycles = computed(() => nonEmptyObject(contractDefaults.value.billing_cycles) ? contractDefaults.value.billing_cycles : DEFAULT_CONTRACT_DEFAULTS.billing_cycles)
const paymentTerms = computed(() => nonEmptyObject(contractDefaults.value.payment_terms) ? contractDefaults.value.payment_terms : DEFAULT_CONTRACT_DEFAULTS.payment_terms)
const supportLevels = computed(() => nonEmptyObject(contractDefaults.value.support_levels) ? contractDefaults.value.support_levels : DEFAULT_CONTRACT_DEFAULTS.support_levels)
const activeLicence = computed(() => licences.value.find(licence => licence.id === editingId.value) || null)
const licenceActionTotal = computed(() => licenceActionGroups.value.reduce((total, group) => total + group.count, 0))
const saasHealthItems = computed(() => Array.isArray(saasHealth.items) ? saasHealth.items : [])

const saasHealthCards = computed(() => [
  {
    label: 'Espaces prêts',
    value: `${saasHealth.summary.ready_clients || 0}/${saasHealth.summary.total_clients || 0}`,
    hint: 'Tenant + licence + admin OK',
    icon: Server,
  },
  {
    label: 'À vérifier',
    value: saasHealth.summary.warning_clients || 0,
    hint: 'Points non bloquants',
    icon: AlertTriangle,
  },
  {
    label: 'À corriger',
    value: saasHealth.summary.blocked_clients || 0,
    hint: 'Tenant/licence/admin manquant',
    icon: ShieldCheck,
  },
  {
    label: 'Fichiers isolés',
    value: saasHealth.summary.storage_label || '0 o',
    hint: 'Stockage tenant détecté',
    icon: HardDrive,
  },
])

const statCards = computed(() => [
  {
    label: 'Clients',
    value: stats.clients,
    hint: 'Comptes suivis',
    icon: Users,
  },
  {
    label: 'Licences actives',
    value: stats.licences_actives,
    hint: 'Installations autorisées',
    icon: ShieldCheck,
  },
  {
    label: 'À renouveler',
    value: stats.a_renouveler,
    hint: 'Échéance ≤ 30 jours',
    icon: KeyRound,
  },
  {
    label: 'Mensuel actif',
    value: money(stats.revenu_mensuel),
    hint: 'Revenu mensuel estimé',
    icon: TrendingUp,
  },
])

const groupedModules = computed(() => {
  const groups = new Map()
  Object.entries(reference.modules || {}).forEach(([key, module]) => {
    const groupName = module.group || 'Autres'
    if (!groups.has(groupName)) groups.set(groupName, [])
    groups.get(groupName).push({ key, ...module })
  })

  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
})

const filteredLicences = computed(() => {
  const needle = search.value.trim().toLowerCase()
  if (!needle) return licences.value

  return licences.value.filter((licence) => {
    return [
      licence.client_nom,
      licence.client_email,
      licence.domaine,
      licence.numero,
      licence.licence_key,
      licence.plan_label,
      licence.statut,
    ].join(' ').toLowerCase().includes(needle)
  })
})

const demoRequests = computed(() => {
  return clients.value
    .filter(client => client.statut === 'prospect')
    .slice()
    .sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')))
    .slice(0, 6)
})

const licenceActionGroups = computed(() => {
  const all = Array.isArray(licences.value) ? licences.value : []
  const buildGroup = ({ key, title, hint, icon, tone, items, detail }) => ({
    key,
    title,
    hint,
    icon,
    tone,
    count: items.length,
    items: items.slice(0, 3),
    moreCount: Math.max(items.length - 3, 0),
    detail,
  })

  const expired = all
    .filter(isLicenceExpired)
    .sort(sortByUrgency)

  const renewSoon = all
    .filter(isLicenceToRenewSoon)
    .sort(sortByUrgency)

  const unsent = all
    .filter(isLicenceOfferToSend)
    .sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')))

  const suspended = all
    .filter(licence => licence.statut === 'suspendue')
    .sort(sortByUrgency)

  return [
    buildGroup({
      key: 'expirees',
      title: 'Expirées',
      hint: 'À renouveler ou suspendre.',
      icon: AlertTriangle,
      tone: 'danger',
      items: expired,
      detail: licenceDeadlineLabel,
    }),
    buildGroup({
      key: 'a_renouveler',
      title: 'À renouveler',
      hint: 'Échéance dans 30 jours.',
      icon: KeyRound,
      tone: 'warning',
      items: renewSoon,
      detail: licenceDeadlineLabel,
    }),
    buildGroup({
      key: 'a_envoyer',
      title: 'Offre à envoyer',
      hint: 'Pack créé, email non envoyé.',
      icon: Mail,
      tone: 'info',
      items: unsent,
      detail: licence => `${licence.numero || 'Licence'} · ${licence.client_email || 'email manquant'}`,
    }),
    buildGroup({
      key: 'suspendues',
      title: 'Suspendues',
      hint: 'À réactiver après régularisation.',
      icon: ShieldCheck,
      tone: 'muted',
      items: suspended,
      detail: licence => `${licence.numero || 'Licence'} · ${licence.plan_label || planLabel(licence.plan)}`,
    }),
  ].filter(group => group.count > 0)
})

const onboardingSteps = computed(() => [
  {
    index: 1,
    label: 'Client',
    hint: form.client_nom && form.client_email ? 'Identité et email prêts.' : 'Renseigner au minimum le nom et l’email.',
    done: Boolean(form.client_nom && form.client_email),
  },
  {
    index: 2,
    label: 'Offre',
    hint: form.plan && parseNumber(form.montant_mensuel) > 0 ? 'Formule et tarif définis.' : 'Choisir une formule et un montant mensuel.',
    done: Boolean(form.plan && parseNumber(form.montant_mensuel) > 0),
  },
  {
    index: 3,
    label: 'Modules',
    hint: form.modules_autorises.length ? `${form.modules_autorises.length} module(s) inclus.` : 'Sélectionner les modules autorisés.',
    done: form.modules_autorises.length > 0,
  },
  {
    index: 4,
    label: 'Documents',
    hint: activeLicence.value ? 'Devis, contrat, email et certificat disponibles.' : 'Créer la licence pour générer le pack.',
    done: Boolean(activeLicence.value?.licence_certificate),
  },
])

onMounted(loadDashboard)

async function loadDashboard() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/xelltekk')
    hydrate(data)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur de chargement de l’espace XELLTEKK Admin.')
  } finally {
    loading.value = false
  }
}

function hydrate(data) {
  Object.assign(stats, data.stats || {})
  const incomingReference = data.reference || {}
  reference.plans = nonEmptyObject(incomingReference.plans) ? incomingReference.plans : DEFAULT_PLANS
  reference.modules = nonEmptyObject(incomingReference.modules) ? incomingReference.modules : DEFAULT_MODULES
  reference.statuts = nonEmptyObject(incomingReference.statuts) ? incomingReference.statuts : DEFAULT_STATUTS
  reference.tarifs = nonEmptyObject(incomingReference.tarifs) ? incomingReference.tarifs : DEFAULT_TARIFS
  reference.contract_defaults = normalizeContractDefaults(incomingReference.contract_defaults)
  licences.value = Array.isArray(data.licences) ? data.licences : []
  clients.value = Array.isArray(data.clients) ? data.clients : []
  hydrateSaasHealth(data.saas_health)
  ensureSelectableDefaults()
  hydrateEmailSettings(data.email_settings)
  if (!editingId.value && form.modules_autorises.length === 0) {
    applyPlanModules()
  }
}

function hydrateSaasHealth(payload = null) {
  const normalized = normalizeSaasHealth(payload)
  Object.assign(saasHealth.summary, normalized.summary)
  saasHealth.items = normalized.items
}

function hydrateEmailSettings(settings = null) {
  const normalized = {
    ...emptyEmailSettings(),
    ...(settings || {}),
  }
  Object.assign(emailSettings, normalized)
  Object.assign(emailForm, {
    ...emptyEmailForm(),
    is_active: normalized.is_active,
    host: normalized.host || 'mail.infomaniak.com',
    port: normalized.port || 587,
    scheme: normalized.scheme || 'smtp',
    username: normalized.username || 'xelltekk@xelltekk.com',
    from_address: normalized.from_address || 'xelltekk@xelltekk.com',
    from_name: normalized.from_name || 'XELLTEKK',
    test_to: emailForm.test_to || normalized.from_address || 'xelltekk@xelltekk.com',
  })
}

async function saveLicence() {
  ensureSelectableDefaults()
  if (!String(form.client_nom || '').trim()) {
    toast.error('Renseignez le nom du client avant de créer la licence.')
    return
  }
  if (!form.plan || !form.statut) {
    toast.error('Choisissez une formule et un statut avant d’enregistrer.')
    return
  }

  saving.value = true
  try {
    const payload = licencePayload()
    const request = editingId.value
      ? api.put(`/admin/xelltekk/licences/${editingId.value}`, payload)
      : api.post('/admin/xelltekk/licences', payload)
    const { data } = await request
    hydrate(data)
    if (data.licence) editLicence(data.licence)
    toast.success(data.message || 'Licence enregistrée.')
  } catch (error) {
    toast.error(apiErrorMessage(error, 'Impossible d’enregistrer la licence.'))
  } finally {
    saving.value = false
  }
}

async function renewLicence(licence) {
  const ok = await askConfirm({
    title: 'Renouveler la licence',
    message: `Ajouter 12 mois à la licence de ${licence.client_nom} ?`,
    confirmLabel: 'Renouveler',
  })
  if (!ok) return

  try {
    const { data } = await api.post(`/admin/xelltekk/licences/${licence.id}/renouveler`, { mois: 12 })
    hydrate(data)
    toast.success(data.message || 'Licence renouvelée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de renouveler la licence.')
  }
}

async function toggleLicenceStatus(licence) {
  const action = licence.statut === 'suspendue' ? 'reactiver' : 'suspendre'
  const ok = await askConfirm({
    title: action === 'reactiver' ? 'Réactiver la licence' : 'Suspendre la licence',
    message: `${action === 'reactiver' ? 'Réactiver' : 'Suspendre'} la licence de ${licence.client_nom} ?`,
    confirmLabel: action === 'reactiver' ? 'Réactiver' : 'Suspendre',
    tone: action === 'reactiver' ? 'default' : 'danger',
  })
  if (!ok) return

  try {
    const { data } = await api.post(`/admin/xelltekk/licences/${licence.id}/${action}`)
    hydrate(data)
    toast.success(data.message || 'Statut mis à jour.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de changer le statut.')
  }
}

async function resetTenantAdminAccess(licence) {
  const ok = await askConfirm({
    title: 'Réinitialiser l’accès admin',
    message: `Générer un nouveau mot de passe temporaire pour ${licence.client_nom} ? L’ancien mot de passe admin ne fonctionnera plus.`,
    confirmLabel: 'Réinitialiser',
    tone: 'danger',
  })
  if (!ok) return

  resetAdminAccessLoadingId.value = licence.id
  try {
    const { data } = await api.post(`/admin/xelltekk/licences/${licence.id}/reset-admin-access`)
    hydrate(data)
    if (data.licence) editLicence(data.licence)

    const access = data.tenant_admin_access || {}
    const credentials = [
      `Espace : ${access.workspace_url || workspaceUrl(data.licence || licence) || ''}`,
      `Email : ${access.email || ''}`,
      `Mot de passe temporaire : ${access.password || ''}`,
      'À changer après la première connexion.',
    ].filter(Boolean).join('\n')

    if (access.email && access.password) {
      await copyText(credentials, 'Nouveaux accès copiés.')
    } else {
      toast.success(data.message || 'Accès admin réinitialisé.')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de réinitialiser l’accès admin.')
  } finally {
    resetAdminAccessLoadingId.value = null
  }
}

function editLicence(licence) {
  editingId.value = licence.id
  const cycle = licence.billing_cycle || 'mensuel'
  Object.assign(form, {
    ...emptyForm(),
    ...licence,
    billing_cycle: cycle,
    payment_terms: licence.payment_terms || paymentTermsForCycle(cycle),
    support_level: licence.support_level || defaultSupportLevel(),
    setup_fee: licence.setup_fee ?? '',
    cancellation_notice_days: licence.cancellation_notice_days ?? contractDefaults.value.cancellation_notice_days ?? 30,
    contract_terms: licence.contract_terms || '',
    modules_autorises: Array.isArray(licence.modules_autorises) ? [...licence.modules_autorises] : [],
    max_utilisateurs: licence.max_utilisateurs ?? '',
    montant_mensuel: licence.montant_mensuel ?? '',
    date_debut: licence.date_debut || '',
    date_fin: licence.date_fin || '',
    periode_essai_fin: licence.periode_essai_fin || '',
  })
  ensureSelectableDefaults()
}

function resetForm() {
  editingId.value = null
  Object.assign(form, emptyForm())
  ensureSelectableDefaults()
  applyPlanModules()
}

function startLicenceFromLead(lead) {
  editingId.value = null
  const preferredPlan = inferPlanFromNotes(lead.notes)
  Object.assign(form, {
    ...emptyForm(),
    client_nom: lead.nom || '',
    client_email: lead.email || '',
    client_telephone: lead.telephone || '',
    domaine: lead.workspace_domain || lead.domaine || '',
    contact_nom: lead.contact_nom || '',
    client_notes: lead.notes || '',
    client_statut: 'client',
    plan: preferredPlan,
    notes: lead.notes ? `Origine demande démo :\n${lead.notes}` : '',
  })
  ensureSelectableDefaults()
  applyPlanModules()
  toast.info('Demande chargée. Vérifiez l’offre puis créez la licence.')
}

function licencePayload() {
  ensureSelectableDefaults()

  return {
    client_nom: form.client_nom,
    client_email: form.client_email || null,
    client_telephone: cleanPhone(form.client_telephone),
    domaine: form.domaine || null,
    contact_nom: form.contact_nom || null,
    client_notes: form.client_notes || null,
    client_statut: form.client_statut || 'client',
    plan: form.plan,
    statut: form.statut,
    date_debut: form.date_debut || null,
    date_fin: form.date_fin || null,
    periode_essai_fin: form.periode_essai_fin || null,
    max_utilisateurs: parseIntegerOrNull(form.max_utilisateurs),
    modules_autorises: [...new Set(form.modules_autorises || [])],
    montant_mensuel: parseNumber(form.montant_mensuel),
    devise: form.devise || 'XOF',
    billing_cycle: form.billing_cycle || 'mensuel',
    payment_terms: form.payment_terms || paymentTermsForCycle(form.billing_cycle),
    support_level: form.support_level || defaultSupportLevel(),
    setup_fee: parseNumber(form.setup_fee),
    cancellation_notice_days: parseIntegerOrNull(form.cancellation_notice_days) ?? 30,
    contract_terms: form.contract_terms || null,
    notes: form.notes || null,
  }
}

function applyPlanModules() {
  const modules = plans.value?.[form.plan]?.modules
  form.modules_autorises = Array.isArray(modules) ? [...modules] : []
  if (!parseNumber(form.montant_mensuel)) {
    form.montant_mensuel = tarifs.value?.[form.plan] ?? form.montant_mensuel
  }
  if (!form.payment_terms) {
    form.payment_terms = paymentTermsForCycle(form.billing_cycle)
  }
  if (!form.support_level) {
    form.support_level = defaultSupportLevel()
  }
}

function applyPaymentTermsForCycle(force = false) {
  const defaults = Object.values(paymentTerms.value || {})
  if (force || !form.payment_terms || defaults.includes(form.payment_terms)) {
    form.payment_terms = paymentTermsForCycle(form.billing_cycle)
  }
}

function applyContractDefaults() {
  form.payment_terms = paymentTermsForCycle(form.billing_cycle)
  form.support_level = defaultSupportLevel()
  form.cancellation_notice_days = contractDefaults.value.cancellation_notice_days ?? 30
  form.contract_terms = contractDefaults.value.contract_terms || form.contract_terms || ''
  toast.info('Conditions types appliquées.')
}

function paymentTermsForCycle(cycle = 'mensuel') {
  return paymentTerms.value?.[cycle] || paymentTerms.value?.mensuel || 'Paiement mensuel à la réception de facture.'
}

function defaultSupportLevel() {
  return supportLevels.value?.standard || 'Support standard ouvré : assistance à l’utilisation, corrections et accompagnement raisonnable.'
}

function supportLabel(key) {
  return {
    standard: 'Standard',
    prioritaire: 'Prioritaire',
    premium: 'Premium',
  }[key] || key
}

function moduleEnabled(moduleKey) {
  return Array.isArray(form.modules_autorises) && form.modules_autorises.includes(moduleKey)
}

function toggleModule(moduleKey) {
  const modules = new Set(form.modules_autorises || [])
  if (modules.has(moduleKey)) {
    modules.delete(moduleKey)
  } else {
    modules.add(moduleKey)
  }
  form.modules_autorises = Array.from(modules)
}

async function copyText(value, successMessage = 'Copié.') {
  const text = String(value || '')
  if (!text) return

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    toast.success(successMessage)
  } catch (error) {
    toast.error('Impossible de copier automatiquement.')
  }
}

async function openDocument(licence, type) {
  if (!licence?.id) return

  const rawUrl = type === 'contrat'
    ? licence.contrat_pdf_url || `/api/admin/xelltekk/licences/${licence.id}/contrat-pdf`
    : licence.devis_pdf_url || `/api/admin/xelltekk/licences/${licence.id}/devis-pdf`
  const endpoint = axiosApiUrl(rawUrl)
  const label = type === 'contrat' ? 'contrat' : 'devis'
  const reservedWindow = window.open('', '_blank')

  if (reservedWindow) {
    reservedWindow.opener = null
    reservedWindow.document.write('<!doctype html><title>Préparation du PDF</title><p style="font-family:system-ui;padding:24px">Préparation du PDF...</p>')
  }

  try {
    const response = await api.get(endpoint, {
      responseType: 'blob',
      headers: { Accept: 'application/json, application/pdf' },
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const objectUrl = URL.createObjectURL(blob)

    if (reservedWindow) {
      reservedWindow.location.href = objectUrl
    } else {
      window.open(objectUrl, '_blank')
    }

    setTimeout(() => URL.revokeObjectURL(objectUrl), 120000)
  } catch (error) {
    if (reservedWindow && !reservedWindow.closed) {
      reservedWindow.close()
    }
    toast.error(await apiBlobErrorMessage(error, `Impossible d’ouvrir le ${label} PDF.`))
  }
}

async function exportTenantData(item) {
  if (!item?.id) return

  exportingTenantId.value = item.id
  try {
    const response = await api.get(`/admin/xelltekk/clients/${item.id}/export`, {
      responseType: 'blob',
      headers: { Accept: 'application/json' },
    })
    const blob = new Blob([response.data], { type: 'application/json;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filenameFromDisposition(response.headers?.['content-disposition'])
      || `sauvegarde-saytu-${slugForFilename(item.client_nom || item.code || 'client')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    toast.success('Export client téléchargé.')
  } catch (error) {
    toast.error(await apiBlobErrorMessage(error, 'Impossible de télécharger l’export client.'))
  } finally {
    exportingTenantId.value = null
  }
}

async function prepareOnboardingEmail(licence) {
  if (!licence?.id) return

  const reservedWindow = reserveEmailComposerWindow()
  try {
    const { data } = await api.get(axiosApiUrl(licence.email_onboarding_url || `/admin/xelltekk/licences/${licence.id}/email-onboarding`))
    const mailto = buildMailtoUrl({
      to: data.to,
      subject: data.subject,
      body: data.body,
    })

    if (!data.to) {
      closeReservedEmailComposerWindow(reservedWindow)
      await copyText(data.body, 'Email copié : aucun email client renseigné.')
      return
    }

    if (openEmailComposer(mailto, reservedWindow)) {
      toast.success('Email préparé. Pensez à joindre le devis et le contrat PDF.')
    } else {
      closeReservedEmailComposerWindow(reservedWindow)
      await copyText(data.body, 'Email copié.')
    }
  } catch (error) {
    closeReservedEmailComposerWindow(reservedWindow)
    toast.error(error.response?.data?.message || 'Impossible de préparer l’email.')
  }
}

async function sendOnboardingEmail(licence) {
  if (!licence?.id) return

  if (!licence.client_email) {
    toast.error('Aucun email client renseigné pour cette licence.')
    return
  }

  const ok = await askConfirm({
    title: 'Envoyer l’offre au client',
    message: `Envoyer le devis et le contrat PDF à ${licence.client_email} ?`,
    confirmLabel: 'Envoyer',
  })
  if (!ok) return

  sendingEmailId.value = licence.id
  try {
    const endpoint = axiosApiUrl(licence.send_onboarding_email_url || `/admin/xelltekk/licences/${licence.id}/email-onboarding/envoyer`)
    const { data } = await api.post(endpoint, {})
    hydrate(data)
    if (data.licence && editingId.value === licence.id) editLicence(data.licence)
    toast.success(data.message || 'Offre envoyée avec les PDF en pièces jointes.')
  } catch (error) {
    const payload = error.response?.data?.email
    if (payload?.body) {
      await copyText(payload.body, 'Email copié en secours.')
    }
    toast.error(error.response?.data?.message || 'Impossible d’envoyer l’offre.')
  } finally {
    sendingEmailId.value = null
  }
}

async function saveEmailSettings(showToast = true) {
  savingEmailSettings.value = true
  try {
    const payload = {
      is_active: Boolean(emailForm.is_active),
      host: emailForm.host || 'mail.infomaniak.com',
      port: parseIntegerOrNull(emailForm.port) || 587,
      scheme: emailForm.scheme || 'smtp',
      username: emailForm.username || emailForm.from_address || 'xelltekk@xelltekk.com',
      from_address: emailForm.from_address || emailForm.username || 'xelltekk@xelltekk.com',
      from_name: emailForm.from_name || 'XELLTEKK',
    }
    if (emailForm.password) payload.password = emailForm.password

    const { data } = await api.put('/admin/xelltekk/email/settings', payload)
    hydrateEmailSettings(data.email_settings)
    emailForm.password = ''
    if (showToast) toast.success(data.message || 'Configuration email enregistrée.')
    return true
  } catch (error) {
    if (showToast) toast.error(error.response?.data?.message || 'Impossible d’enregistrer la configuration email.')
    return false
  } finally {
    savingEmailSettings.value = false
  }
}

async function testEmailSettings() {
  testingEmailSettings.value = true
  try {
    if (emailForm.password) {
      const saved = await saveEmailSettings(false)
      if (!saved) return
    }

    const { data } = await api.post('/admin/xelltekk/email/settings/test', {
      to: emailForm.test_to || emailForm.from_address || 'xelltekk@xelltekk.com',
    })
    hydrateEmailSettings(data.email_settings)
    toast.success(data.message || 'Email de test envoyé.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de tester la configuration email.')
  } finally {
    testingEmailSettings.value = false
  }
}

function axiosApiUrl(url) {
  return String(url || '').replace(/^\/api(?=\/)/, '')
}

function filenameFromDisposition(disposition = '') {
  const value = String(disposition || '')
  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].replace(/"/g, ''))
    } catch {
      return utf8[1].replace(/"/g, '')
    }
  }

  const classic = value.match(/filename="?([^";]+)"?/i)
  return classic?.[1] || ''
}

function slugForFilename(value) {
  return String(value || 'client')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'client'
}

function nonEmptyObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0)
}

function cloneContractDefaults() {
  return {
    ...DEFAULT_CONTRACT_DEFAULTS,
    billing_cycles: { ...DEFAULT_CONTRACT_DEFAULTS.billing_cycles },
    payment_terms: { ...DEFAULT_CONTRACT_DEFAULTS.payment_terms },
    support_levels: { ...DEFAULT_CONTRACT_DEFAULTS.support_levels },
  }
}

function normalizeContractDefaults(value = {}) {
  const defaults = cloneContractDefaults()
  const source = nonEmptyObject(value) ? value : {}

  return {
    ...defaults,
    ...source,
    billing_cycles: nonEmptyObject(source.billing_cycles) ? source.billing_cycles : defaults.billing_cycles,
    payment_terms: nonEmptyObject(source.payment_terms) ? source.payment_terms : defaults.payment_terms,
    support_levels: nonEmptyObject(source.support_levels) ? source.support_levels : defaults.support_levels,
    contract_terms: source.contract_terms ?? defaults.contract_terms,
    cancellation_notice_days: source.cancellation_notice_days ?? defaults.cancellation_notice_days,
  }
}

function objectHasKey(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key)
}

function preferredKey(object, preferred, fallback) {
  const keys = Object.keys(object || {})
  if (preferred && keys.includes(preferred)) return preferred
  return keys[0] || fallback
}

function ensureSelectableDefaults() {
  if (!form.plan || !objectHasKey(plans.value, form.plan)) {
    form.plan = preferredKey(plans.value, 'business', 'business')
  }

  if (!form.statut || !objectHasKey(statuts.value, form.statut)) {
    form.statut = preferredKey(statuts.value, 'actif', 'actif')
  }

  if (!form.billing_cycle || !objectHasKey(billingCycles.value, form.billing_cycle)) {
    form.billing_cycle = preferredKey(billingCycles.value, 'mensuel', 'mensuel')
  }

  if (!form.payment_terms) {
    form.payment_terms = paymentTermsForCycle(form.billing_cycle)
  }

  if (!form.support_level) {
    form.support_level = defaultSupportLevel()
  }
}

function apiErrorMessage(error, fallback) {
  const errors = error.response?.data?.errors
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat().find(Boolean)
    if (first) return String(first)
  }

  return error.response?.data?.message || fallback
}

async function apiBlobErrorMessage(error, fallback) {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      const text = await data.text()
      const parsed = JSON.parse(text)
      return parsed?.message || fallback
    } catch {
      return fallback
    }
  }

  return error?.response?.data?.message || fallback
}

function emptyForm() {
  return {
    client_nom: '',
    client_email: '',
    client_telephone: '',
    domaine: '',
    contact_nom: '',
    client_notes: '',
    client_statut: 'client',
    plan: 'business',
    statut: 'actif',
    date_debut: today(),
    date_fin: addMonths(today(), 12),
    periode_essai_fin: '',
    max_utilisateurs: '',
    modules_autorises: [],
    montant_mensuel: '',
    devise: 'XOF',
    billing_cycle: 'mensuel',
    payment_terms: 'Paiement mensuel à la réception de facture. Activation après signature du contrat et validation du premier règlement.',
    support_level: 'Support standard ouvré : assistance à l’utilisation, corrections et accompagnement raisonnable.',
    setup_fee: '',
    cancellation_notice_days: 30,
    contract_terms: '',
    notes: '',
  }
}

function emptyEmailSettings() {
  return {
    id: null,
    is_active: true,
    host: 'mail.infomaniak.com',
    port: 587,
    scheme: 'smtp',
    username: 'xelltekk@xelltekk.com',
    from_address: 'xelltekk@xelltekk.com',
    from_name: 'XELLTEKK',
    password_configured: false,
    configured: false,
    status_message: 'Mot de passe SMTP manquant : saisissez-le dans la configuration email XELLTEKK.',
    last_tested_at: null,
    updated_at: null,
  }
}

function emptyEmailForm() {
  return {
    is_active: true,
    host: 'mail.infomaniak.com',
    port: 587,
    scheme: 'smtp',
    username: 'xelltekk@xelltekk.com',
    password: '',
    from_address: 'xelltekk@xelltekk.com',
    from_name: 'XELLTEKK',
    test_to: 'xelltekk@xelltekk.com',
  }
}

function emptySaasHealth() {
  return {
    summary: {
      total_clients: 0,
      ready_clients: 0,
      warning_clients: 0,
      blocked_clients: 0,
      missing_tenants: 0,
      storage_bytes: 0,
      storage_label: '0 o',
    },
    items: [],
  }
}

function normalizeSaasHealth(payload = null) {
  const fallback = emptySaasHealth()
  return {
    summary: {
      ...fallback.summary,
      ...(payload?.summary || {}),
    },
    items: Array.isArray(payload?.items) ? payload.items : [],
  }
}

function statusClass(licence) {
  if (licence.statut === 'suspendue') return 'bg-red-100 text-red-700'
  if (licence.is_expired || licence.statut === 'expiree') return 'bg-amber-100 text-amber-700'
  if (licence.expires_soon) return 'bg-yellow-100 text-yellow-700'
  if (licence.statut === 'essai') return 'bg-blue-100 text-blue-700'
  return 'bg-emerald-100 text-emerald-700'
}

function statutLabel(statut) {
  return statuts.value?.[statut] || statut || '-'
}

function planLabel(plan) {
  return plans.value?.[plan]?.label || plan || '-'
}

function inferPlanFromNotes(notes = '') {
  const value = String(notes).toLowerCase()
  if (value.includes('starter')) return 'starter'
  if (value.includes('pro')) return 'pro'
  if (value.includes('business')) return 'business'
  return 'business'
}

function parseNumber(value) {
  const raw = String(value ?? '').replace(/\s/g, '').replace(',', '.')
  const number = Number(raw)
  return Number.isFinite(number) ? number : 0
}

function parseIntegerOrNull(value) {
  const number = parseNumber(value)
  return number > 0 ? Math.trunc(number) : null
}

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00221')) return digits.slice(5, 14)
  if (digits.startsWith('221') && digits.length > 9) return digits.slice(3, 12)
  return digits.slice(0, 9) || null
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function currencyLabel(devise) {
  return {
    XOF: 'FCFA BCEAO',
    FCFA: 'FCFA BCEAO',
    EUR: '€',
    USD: '$',
  }[String(devise || '').toUpperCase()] || devise || ''
}

function urlFromDomain(domain) {
  const value = String(domain || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function workspaceUrl(item) {
  return item?.workspace_url || urlFromDomain(item?.workspace_domain || item?.domaine)
}

function workspaceLabel(item) {
  return item?.workspace_domain || item?.domaine || item?.subdomain || item?.workspace_url || ''
}

function saasHealthStatusClass(status) {
  if (status === 'danger') return 'bg-red-100 text-red-700'
  if (status === 'warning') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

function saasCheckClass(status) {
  if (status === 'danger') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function visibleBusinessCounts(item) {
  return Array.isArray(item?.business_counts)
    ? item.business_counts.filter(row => Number(row?.count || 0) > 0).slice(0, 4)
    : []
}

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR')
  } catch (e) {
    return value
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  try {
    return new Date(value.replace(' ', 'T')).toLocaleString('fr-FR')
  } catch (e) {
    return value
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function addMonths(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00`)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

function daysUntil(value) {
  if (!value) return null
  const target = new Date(`${value}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const current = new Date()
  current.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - current.getTime()) / 86400000)
}

function isLicenceExpired(licence) {
  const days = daysUntil(licence?.date_fin)
  return licence?.statut === 'expiree' || licence?.is_expired || (days !== null && days < 0)
}

function isLicenceToRenewSoon(licence) {
  const days = daysUntil(licence?.date_fin)
  return !isLicenceExpired(licence)
    && licence?.statut !== 'suspendue'
    && days !== null
    && days <= 30
}

function isLicenceOfferToSend(licence) {
  return Boolean(licence?.client_email)
    && !licence?.last_sent_at
    && !['suspendue', 'expiree'].includes(licence?.statut)
}

function licenceDeadlineLabel(licence) {
  const days = daysUntil(licence?.date_fin)
  if (days === null) return `${licence?.numero || 'Licence'} · sans date de fin`
  if (days < 0) return `${licence?.numero || 'Licence'} · expirée depuis ${Math.abs(days)} j`
  if (days === 0) return `${licence?.numero || 'Licence'} · expire aujourd’hui`
  return `${licence?.numero || 'Licence'} · J-${days}`
}

function sortByUrgency(a, b) {
  const first = daysUntil(a?.date_fin)
  const second = daysUntil(b?.date_fin)
  return (first ?? 99999) - (second ?? 99999)
}
</script>

<style scoped>
.xell-panel,
.xell-card,
.xell-licence-row {
  border: 1px solid var(--saytu-border, #e2e8f0);
  background: var(--saytu-surface, #ffffff);
  color: var(--saytu-shell-text, #334155);
  box-shadow: 0 14px 42px rgb(15 23 42 / 0.06);
}

.xell-panel {
  border-radius: 1rem;
}

.xell-select {
  color: var(--saytu-shell-text, #0f172a) !important;
  background-color: color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, var(--saytu-primary, #2563eb) 8%) !important;
}

.xell-select option {
  background-color: var(--saytu-surface, #ffffff);
  color: var(--saytu-shell-text, #0f172a);
}

.xell-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--saytu-border, #e2e8f0);
  padding: 0.85rem 1rem;
}

.xell-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 1rem;
  padding: 1rem;
}

.xell-card-label {
  color: var(--saytu-muted, #64748b);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.xell-card-icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  flex-shrink: 0;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
}

.xell-module-chip {
  min-height: 2.25rem;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 94%, var(--saytu-primary, #2563eb) 6%);
  color: var(--saytu-shell-text, #334155);
  padding: 0.45rem 0.65rem;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 800;
  transition: 160ms ease;
}

.xell-module-chip:hover,
.xell-module-chip-active {
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 55%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
}

.xell-step {
  min-height: 7rem;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 94%, var(--saytu-primary, #2563eb) 6%);
  padding: 0.9rem;
  transition: 160ms ease;
}

.xell-step-done {
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 52%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 10%, var(--saytu-surface, #ffffff));
}

.xell-step-number {
  display: grid;
  height: 1.8rem;
  width: 1.8rem;
  place-items: center;
  border-radius: 999px;
  background: var(--saytu-primary, #2563eb);
  color: white;
  font-size: 0.78rem;
  font-weight: 900;
}

.xell-action-card {
  min-height: 13.5rem;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 95%, var(--saytu-primary, #2563eb) 5%);
  padding: 0.85rem;
}

.xell-action-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  flex-shrink: 0;
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
}

.xell-action-card-danger .xell-action-icon {
  background: color-mix(in srgb, #ef4444 14%, var(--saytu-surface, #ffffff));
  color: #dc2626;
}

.xell-action-card-warning .xell-action-icon {
  background: color-mix(in srgb, #f59e0b 16%, var(--saytu-surface, #ffffff));
  color: #b45309;
}

.xell-action-card-muted .xell-action-icon {
  background: color-mix(in srgb, var(--saytu-muted, #64748b) 14%, var(--saytu-surface, #ffffff));
  color: var(--saytu-muted, #64748b);
}

.xell-action-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 3rem;
  border: 1px solid color-mix(in srgb, var(--saytu-border, #e2e8f0) 75%, transparent);
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 88%, var(--saytu-primary, #2563eb) 12%);
  padding: 0.55rem 0.65rem;
}

.xell-action-link {
  flex-shrink: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
  padding: 0.35rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 900;
}

.xell-action-link:disabled {
  cursor: wait;
  opacity: 0.55;
}

.xell-licence-row {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border-radius: 1rem;
  padding: 1rem;
  transition: 160ms ease;
}

.xell-licence-row + .xell-licence-row {
  margin-top: 0.75rem;
}

.xell-licence-row:hover,
.xell-licence-row-active {
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 55%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 8%, var(--saytu-surface, #ffffff));
}

.xell-lead-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 94%, var(--saytu-primary, #2563eb) 6%);
  padding: 0.85rem;
}

.xell-lead-notes {
  display: -webkit-box;
  max-height: 2.8rem;
  overflow: hidden;
  color: var(--saytu-muted, #64748b);
  font-size: 0.75rem;
  line-height: 1.35;
  white-space: pre-line;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.xell-saas-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 94%, var(--saytu-primary, #2563eb) 6%);
  padding: 0.75rem;
}

.xell-saas-row {
  display: flex;
  gap: 0.75rem;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-left-width: 4px;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 96%, var(--saytu-primary, #2563eb) 4%);
  padding: 0.75rem;
}

.xell-saas-row-ok {
  border-left-color: #10b981;
}

.xell-saas-row-warning {
  border-left-color: #f59e0b;
}

.xell-saas-row-danger {
  border-left-color: #ef4444;
}

.xell-saas-metric {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #2563eb) 10%);
  padding: 0.28rem 0.5rem;
}

.xell-saas-count-chip {
  border-radius: 999px;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 10%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
  padding: 0.25rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 900;
}

.xell-saas-check {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  border: 1px solid;
  border-radius: 999px;
  padding: 0.25rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 900;
}

.xell-saas-export {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  align-self: flex-start;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 45%, var(--saytu-border, #e2e8f0));
  border-radius: 999px;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 10%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
  padding: 0.35rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 900;
}

.xell-saas-export:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.label {
  display: block;
  margin-bottom: 0.3rem;
  color: var(--saytu-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 800;
}

@media (min-width: 1024px) {
  .xell-licence-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
