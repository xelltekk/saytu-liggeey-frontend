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

    <nav class="xell-admin-nav" aria-label="Navigation XELLTEKK Admin">
      <a
        v-for="block in adminBlocks"
        :key="block.id"
        :href="`#${block.id}`"
        class="xell-admin-nav-card"
      >
        <span class="xell-admin-nav-index">{{ block.index }}</span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-black">{{ block.label }}</span>
          <span class="block truncate text-[11px] font-bold opacity-80">{{ block.value }}</span>
        </span>
      </a>
    </nav>

    <section id="sante-saas" class="xell-panel xell-section-anchor overflow-hidden">
      <div class="xell-panel-header">
        <div class="xell-panel-title">
          <span class="xell-section-kicker">Étape 1</span>
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

            <div class="xell-saas-actions">
              <button
                type="button"
                class="xell-saas-export"
                :disabled="exportingTenantId === item.id || !item.tenant_id"
                @click="exportTenantData(item)"
              >
                <Download class="h-3.5 w-3.5" />
                {{ exportingTenantId === item.id ? 'Export...' : 'Export' }}
              </button>
              <button
                type="button"
                class="xell-saas-export"
                :disabled="backingUpTenantId === item.id || !item.tenant_id"
                @click="createTenantBackup(item)"
              >
                <Archive class="h-3.5 w-3.5" />
                {{ backingUpTenantId === item.id ? 'Backup...' : 'Backup' }}
              </button>
              <button
                type="button"
                class="xell-saas-export"
                :disabled="revokingTenantId === item.id || !item.tenant_id"
                @click="revokeTenantSessions(item)"
              >
                <LockKeyhole class="h-3.5 w-3.5" />
                {{ revokingTenantId === item.id ? '...' : 'Sessions' }}
              </button>
            </div>
          </article>

          <div v-if="!saasHealthItems.length" class="rounded-2xl border border-dashed border-[color:var(--saytu-border,#e2e8f0)] p-4 text-center text-sm font-bold text-[color:var(--saytu-muted,#64748b)]">
            Aucun client SaaS à contrôler pour le moment.
          </div>
        </div>
      </div>
    </section>

    <section id="supervision-production" class="xell-panel xell-section-anchor overflow-hidden">
      <div class="xell-panel-header">
        <div class="xell-panel-title">
          <span class="xell-section-kicker">Étape 2</span>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Supervision production</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Les 8 points critiques SaaS : base, isolation, emails, facturation, relances, support, sécurité et sauvegardes.
          </p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-black" :class="productionStatusClass(productionMonitoring.status)">
          {{ productionMonitoring.status_label || 'À vérifier' }}
        </span>
      </div>

      <div class="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="check in productionChecks"
          :key="check.key"
          class="xell-monitor-check"
          :class="productionCheckClass(check.state)"
        >
          <div class="flex items-start gap-2">
            <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" :class="productionDotClass(check.state)"></span>
            <div class="min-w-0">
              <p class="truncate text-sm font-black">{{ check.label }}</p>
              <p class="mt-1 line-clamp-2 text-[11px] font-semibold opacity-80">{{ check.detail }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section id="pilotage-commercial" class="xell-panel xell-section-anchor overflow-hidden">
      <div class="xell-panel-header">
        <div class="xell-panel-title">
          <span class="xell-section-kicker">Étape 3</span>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Pilotage commercial SaaS</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Abonnements, impayés, support, sécurité et sauvegardes clients depuis un seul endroit.
          </p>
        </div>
        <button
          type="button"
          class="btn-primary px-3 py-2 text-xs"
          :disabled="generatingSubscriptionInvoices"
          @click="generateSubscriptionInvoices"
        >
          <CreditCard class="h-4 w-4" />
          {{ generatingSubscriptionInvoices ? 'Génération...' : 'Facturer le mois' }}
        </button>
      </div>

      <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in saasCommerceCards" :key="card.label" class="xell-commerce-card">
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

      <div v-if="subscriptionRisks.length" class="px-4 pb-4">
        <article class="xell-risk-panel">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Abonnements à risque</h3>
              <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
                À traiter avant suspension ou perte de revenu.
              </p>
            </div>
            <span class="rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-700">
              {{ saasCommerce.summary.suspension_risk_count || 0 }} risque(s) suspension
            </span>
          </div>

          <div class="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="risk in subscriptionRisks.slice(0, 4)"
              :key="`subscription-risk-${risk.id}`"
              class="xell-risk-item"
              :class="subscriptionRiskClass(risk.risk_level)"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="subscriptionRiskDotClass(risk.risk_level)"></span>
                  <p class="truncate text-sm font-black">{{ risk.client_nom || 'Client' }}</p>
                </div>
                <p class="mt-1 truncate text-[11px] font-bold opacity-80">
                  {{ risk.numero }} · {{ risk.reason }}
                </p>
                <p class="mt-1 font-mono text-xs font-black">{{ money(risk.montant) }}</p>
              </div>
              <button
                type="button"
                class="xell-mini-chip bg-white/80"
                :disabled="remindingSubscriptionInvoiceId === risk.id || !risk.reminder?.can_send"
                @click="remindSubscriptionInvoice(risk)"
              >
                {{ remindingSubscriptionInvoiceId === risk.id ? '...' : risk.action_label }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <div class="grid gap-3 px-4 pb-4 xl:grid-cols-4">
        <article class="xell-commerce-box">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Factures abonnement</h3>
              <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Dernières factures XELLTEKK.</p>
            </div>
            <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-2 py-0.5 text-[11px] font-black text-[color:var(--saytu-primary,#2563eb)]">
              {{ subscriptionInvoices.length }}
            </span>
          </div>

          <div class="mt-3 space-y-2">
            <div v-for="invoice in subscriptionInvoices.slice(0, 5)" :key="invoice.id" class="xell-commerce-row">
              <div class="min-w-0">
                <p class="truncate text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ invoice.client_nom || 'Client' }}</p>
                <p class="truncate text-[11px] font-bold text-[color:var(--saytu-muted,#64748b)]">
                  {{ invoice.numero }} · échéance {{ formatDate(invoice.date_echeance) }}
                </p>
                <p v-if="invoice.reminder?.count || invoice.reminder?.is_due" class="mt-1 text-[10px] font-black" :class="subscriptionReminderTextClass(invoice.reminder)">
                  {{ invoice.reminder?.label }}
                  <span v-if="invoice.reminder?.count"> · {{ invoice.reminder.count }} relance(s)</span>
                </p>
              </div>
              <div class="xell-subscription-actions">
                <p class="text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ money(invoice.montant) }}</p>
                <div class="flex flex-wrap justify-end gap-1.5">
                  <button
                    type="button"
                    class="xell-mini-chip border-sky-200 bg-sky-50 text-sky-700"
                    @click="openSubscriptionInvoicePdf(invoice)"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    class="xell-mini-chip border-indigo-200 bg-indigo-50 text-indigo-700"
                    :disabled="sendingSubscriptionInvoiceId === invoice.id || !invoice.client_email"
                    @click="sendSubscriptionInvoiceEmail(invoice)"
                  >
                    {{ sendingSubscriptionInvoiceId === invoice.id ? '...' : 'Envoyer' }}
                  </button>
                  <button
                    type="button"
                    class="xell-mini-chip"
                    :class="subscriptionReminderChipClass(invoice.reminder)"
                    :disabled="remindingSubscriptionInvoiceId === invoice.id || !invoice.reminder?.can_send"
                    @click="remindSubscriptionInvoice(invoice)"
                  >
                    {{ remindingSubscriptionInvoiceId === invoice.id ? '...' : 'Relancer' }}
                  </button>
                </div>
                <button
                  type="button"
                  class="xell-mini-chip"
                  :class="subscriptionInvoiceClass(invoice.statut)"
                  :disabled="invoice.statut === 'payee' || payingSubscriptionInvoiceId === invoice.id"
                  @click="markSubscriptionInvoicePaid(invoice)"
                >
                  {{ invoice.statut === 'payee' ? 'Payée' : (payingSubscriptionInvoiceId === invoice.id ? '...' : invoice.statut_label) }}
                </button>
              </div>
            </div>
            <p v-if="!subscriptionInvoices.length" class="xell-empty-mini">Aucune facture abonnement générée.</p>
          </div>
        </article>

        <article class="xell-commerce-box">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Paiements déclarés</h3>
              <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Validation des règlements saisis par les clients.</p>
            </div>
            <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
              {{ saasCommerce.summary.payment_requests_pending_count || 0 }}
            </span>
          </div>

          <div class="mt-3 space-y-2">
            <div v-for="request in paymentRequests.slice(0, 5)" :key="request.id" class="xell-commerce-row">
              <div class="min-w-0">
                <p class="truncate text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ request.client_nom || 'Client' }}</p>
                <p class="truncate text-[11px] font-bold text-[color:var(--saytu-muted,#64748b)]">
                  {{ request.numero }} · {{ request.invoice_numero || 'sans facture' }}
                </p>
                <p class="truncate text-[10px] font-bold text-[color:var(--saytu-muted,#64748b)]">
                  {{ request.mode_paiement }} · réf. {{ request.reference_paiement }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ money(request.montant) }}</p>
                <span class="xell-mini-chip" :class="paymentRequestClass(request.statut)">
                  {{ request.statut_label }}
                </span>
                <div v-if="request.statut === 'en_attente'" class="mt-1 flex justify-end gap-1">
                  <button
                    type="button"
                    class="xell-mini-chip border-emerald-200 bg-emerald-50 text-emerald-700"
                    :disabled="reviewingPaymentRequestId === request.id"
                    @click="reviewPaymentRequest(request, 'validee')"
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    class="xell-mini-chip border-red-200 bg-red-50 text-red-700"
                    :disabled="reviewingPaymentRequestId === request.id"
                    @click="reviewPaymentRequest(request, 'refusee')"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            </div>
            <p v-if="!paymentRequests.length" class="xell-empty-mini">Aucun paiement déclaré à valider.</p>
          </div>
        </article>

        <article class="xell-commerce-box">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Support client</h3>
              <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Demandes à traiter côté XELLTEKK.</p>
            </div>
            <span class="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-black text-cyan-700">
              {{ supportTickets.length }}
            </span>
          </div>

          <div class="mt-3 space-y-2">
            <div v-for="ticket in supportTickets.slice(0, 5)" :key="ticket.id" class="xell-commerce-row xell-ticket-row">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ ticket.sujet }}</p>
                  <p class="truncate text-[11px] font-bold text-[color:var(--saytu-muted,#64748b)]">
                    {{ ticket.client_nom || ticket.requester_email || 'Client' }} · {{ ticket.statut_label }} · {{ formatDateTime(ticket.created_at) }}
                  </p>
                  <p v-if="ticket.last_message" class="mt-1 line-clamp-2 text-[11px] font-semibold text-[color:var(--saytu-muted,#64748b)]">
                    {{ ticket.last_message.author_label }} : {{ ticket.last_message.message }}
                  </p>
                </div>
                <span class="xell-mini-chip" :class="supportTicketClass(ticket.priorite)">
                  {{ ticket.priorite_label }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap justify-end gap-1.5">
                <button
                  type="button"
                  class="xell-mini-chip border-sky-200 bg-sky-50 text-sky-700"
                  :disabled="!ticket.can_reply"
                  @click="toggleAdminSupportReply(ticket)"
                >
                  Répondre
                </button>
                <button
                  v-if="!['resolu', 'ferme'].includes(ticket.statut)"
                  type="button"
                  class="xell-mini-chip border-emerald-200 bg-emerald-50 text-emerald-700"
                  :disabled="updatingSupportTicketId === ticket.id"
                  @click="updateSupportTicketStatus(ticket, 'resolu')"
                >
                  Résoudre
                </button>
                <button
                  v-if="ticket.can_close"
                  type="button"
                  class="xell-mini-chip border-red-200 bg-red-50 text-red-700"
                  :disabled="updatingSupportTicketId === ticket.id"
                  @click="closeAdminSupportTicket(ticket)"
                >
                  Fermer
                </button>
                <button
                  v-if="ticket.can_reopen"
                  type="button"
                  class="xell-mini-chip border-indigo-200 bg-indigo-50 text-indigo-700"
                  :disabled="updatingSupportTicketId === ticket.id"
                  @click="reopenAdminSupportTicket(ticket)"
                >
                  Rouvrir
                </button>
              </div>

              <form v-if="supportReplyForm.ticket_id === ticket.id" class="mt-2 grid gap-2" @submit.prevent="submitAdminSupportReply(ticket)">
                <textarea v-model.trim="supportReplyForm.message" class="input min-h-16" required placeholder="Réponse à envoyer au client..."></textarea>
                <div class="flex justify-end gap-2">
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="resetAdminSupportReply">Annuler</button>
                  <button type="submit" class="btn-primary px-3 py-2 text-xs" :disabled="supportReplySaving">
                    {{ supportReplySaving ? 'Envoi...' : 'Envoyer' }}
                  </button>
                </div>
              </form>
            </div>
            <p v-if="!supportTickets.length" class="xell-empty-mini">Aucun ticket support ouvert.</p>
          </div>
        </article>

        <article class="xell-commerce-box">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Sécurité & backups</h3>
              <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Connexions, alertes et exports serveur.</p>
            </div>
            <LockKeyhole class="h-5 w-5 text-[color:var(--saytu-primary,#2563eb)]" />
          </div>

          <div class="mt-3 space-y-2">
            <div v-for="event in securityEvents.slice(0, 3)" :key="event.id" class="xell-commerce-row">
              <div class="min-w-0">
                <p class="truncate text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ event.event_label }}</p>
                <p class="truncate text-[11px] font-bold text-[color:var(--saytu-muted,#64748b)]">
                  {{ event.client_nom || event.email || event.host || 'Système' }} · {{ formatDateTime(event.created_at) }}
                </p>
              </div>
              <span class="xell-mini-chip" :class="securityEventClass(event.severity)">
                {{ event.success ? 'OK' : 'Alerte' }}
              </span>
            </div>

            <div v-for="backup in tenantBackups.slice(0, 2)" :key="`backup-${backup.id}`" class="xell-commerce-row">
              <div class="min-w-0">
                <p class="truncate text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ backup.client_nom || 'Backup client' }}</p>
                <p class="truncate text-[11px] font-bold text-[color:var(--saytu-muted,#64748b)]">
                  {{ backup.size_label }} · {{ backup.rows_count }} ligne(s)
                </p>
              </div>
              <button type="button" class="xell-action-link" @click="downloadTenantBackup(backup)">
                Télécharger
              </button>
            </div>

            <p v-if="!securityEvents.length && !tenantBackups.length" class="xell-empty-mini">Aucune alerte ni sauvegarde récente.</p>
          </div>
        </article>
      </div>

      <div class="border-t border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
        <p class="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">Moyens de paiement XELLTEKK</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span v-for="method in paymentMethods" :key="method.label" class="xell-saas-metric">
            {{ method.label }} · {{ method.details }}
          </span>
        </div>
      </div>
    </section>

    <section id="centre-actions" class="xell-panel xell-section-anchor overflow-hidden">
      <div class="xell-panel-header">
        <div class="xell-panel-title">
          <span class="xell-section-kicker">Étape 4</span>
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
                Envoyer depuis Saytu
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
                v-else-if="group.key === 'onboarding'"
                type="button"
                class="xell-action-link"
                @click="editLicence(licence)"
              >
                Ouvrir
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

        <div v-if="!licenceActionGroups.length" class="xell-empty-state xl:col-span-4">
          Aucune action urgente : les licences actives, renouvellements et onboardings sont à jour.
        </div>
      </div>
    </section>

    <section id="demandes-demo" class="xell-panel xell-section-anchor overflow-hidden">
      <div class="xell-panel-header">
        <div class="xell-panel-title">
          <span class="xell-section-kicker">Étape 5</span>
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

        <div v-if="!demoRequests.length" class="xell-empty-state lg:col-span-2">
          Aucune demande démo en attente. Les nouveaux prospects apparaîtront ici pour créer une licence rapidement.
        </div>
      </div>
    </section>

    <section id="configuration-email" class="xell-panel xell-section-anchor overflow-hidden">
      <div class="xell-panel-header">
        <div class="xell-panel-title">
          <span class="xell-section-kicker">Étape 6</span>
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

          <label>
            <span class="label">Destinataire demandes démo</span>
            <input v-model="emailForm.demo_notification_to" type="email" class="input" placeholder="xelltekk@xelltekk.com" />
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
            <select v-model="emailForm.scheme" class="input xell-select">
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
          <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">
            Alertes démo : {{ emailSettings.demo_notification_to || emailSettings.from_address }}
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

    <section id="onboarding-client" class="xell-panel xell-section-anchor overflow-hidden">
      <div class="xell-panel-header">
        <div class="xell-panel-title">
          <span class="xell-section-kicker">Étape 7</span>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Assistant onboarding client</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Un parcours court : client, offre, documents commerciaux, puis licence d’activation.
          </p>
        </div>
        <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-3 py-1 text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">
          {{ activeOnboarding ? `${activeOnboarding.status_label} · ${activeOnboarding.progress}%` : (editingId ? 'Pack prêt' : 'Nouveau client') }}
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
              {{ sendingEmailId === activeLicence?.id ? 'Envoi...' : 'Envoyer depuis Saytu' }}
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
              Ouvrir dans Outlook
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

    <section v-else id="formulaire-licence" class="xell-section-anchor grid gap-4 xl:grid-cols-[480px_1fr]">
      <form class="xell-panel overflow-hidden" @submit.prevent="saveLicence">
        <div class="xell-panel-header">
          <div class="xell-panel-title">
            <span class="xell-section-kicker">Étape 8</span>
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
              <span class="label">Stockage max (Mo)</span>
              <input v-model="form.storage_limit_mb" data-numeric-input class="input" placeholder="Ex: 2048" />
            </label>

            <label>
              <span class="label">Documents / mois</span>
              <input v-model="form.monthly_documents_limit" data-numeric-input class="input" placeholder="Ex: 500" />
            </label>

            <label>
              <span class="label">Mensuel</span>
              <input v-model="form.montant_mensuel" data-numeric-input data-decimals="2" class="input" placeholder="0" />
            </label>

            <label>
              <span class="label">Devise</span>
              <select v-model="form.devise" class="input xell-select">
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
                <select v-model="form.billing_cycle" class="input xell-select" @change="applyPaymentTermsForCycle(true)">
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
                <select v-model="form.support_level" class="input xell-select">
                  <option v-for="(description, key) in supportLevels" :key="key" :value="description">{{ supportLabel(key) }}</option>
                </select>
                <p class="mt-1 text-[11px] font-semibold text-[color:var(--saytu-muted,#64748b)]">{{ form.support_level }}</p>
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
            <div class="xell-licence-main min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ licence.client_nom || 'Client sans nom' }}</h3>
                <span class="rounded-full px-2 py-0.5 text-[11px] font-black" :class="statusClass(licence)">
                  {{ statutLabel(licence.statut) }}
                </span>
                <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-2 py-0.5 text-[11px] font-black text-[color:var(--saytu-primary,#2563eb)]">
                  {{ licence.plan_label }}
                </span>
                <span
                  v-if="licence.onboarding"
                  class="xell-onboarding-badge"
                  :class="onboardingStatusClass(licence.onboarding_status)"
                  :title="licence.onboarding_next_action"
                >
                  {{ licence.onboarding_status_label }} · {{ licence.onboarding_progress }}%
                </span>
                <span
                  v-if="licence.is_under_suspension_notice || licence.suspension_notice_expired"
                  class="rounded-full px-2 py-0.5 text-[11px] font-black"
                  :class="licence.suspension_notice_expired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'"
                >
                  Préavis {{ formatDate(licence.suspension_notice_until) }}
                </span>
              </div>
              <p class="mt-1 truncate text-xs text-[color:var(--saytu-muted,#64748b)]">
                {{ licence.numero }} · {{ licence.licence_key }}
              </p>
              <div class="xell-licence-meta">
                <span class="xell-licence-meta-item"><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Fin :</strong> {{ formatDate(licence.date_fin) }}</span>
                <span class="xell-licence-meta-item"><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Modules :</strong> {{ licence.modules_count }}</span>
                <span class="xell-licence-meta-item"><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Limites :</strong> {{ licence.max_utilisateurs || '∞' }} users · {{ licence.monthly_documents_limit || '∞' }} docs</span>
                <span class="xell-licence-meta-item"><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Mensuel :</strong> {{ money(licence.montant_mensuel) }} {{ licence.devise }}</span>
                <a
                  v-if="workspaceUrl(licence)"
                  :href="workspaceUrl(licence)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="xell-licence-workspace hover:underline"
                >
                  {{ workspaceLabel(licence) }}
                </a>
              </div>
              <div v-if="licence.onboarding" class="xell-licence-progress" :title="licence.onboarding_next_action">
                <span :style="onboardingProgressStyle(licence.onboarding_progress)"></span>
              </div>
              <p v-if="licence.onboarding_next_action" class="mt-1 text-[11px] font-bold text-[color:var(--saytu-muted,#64748b)]">
                Suivant : {{ licence.onboarding_next_action }}
              </p>
            </div>

            <div class="xell-licence-actions">
              <div class="xell-licence-action-group">
                <span class="xell-licence-action-title">Licence</span>
                <div class="xell-licence-action-buttons">
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="editLicence(licence)">
                    Modifier
                  </button>
                  <button
                    type="button"
                    class="btn-secondary px-3 py-2 text-xs"
                    :disabled="!licence.licence_certificate"
                    @click="copyText(licence.licence_certificate, 'Certificat copié.')"
                  >
                    <Copy class="h-4 w-4" />
                    Certificat
                  </button>
                </div>
              </div>

              <div class="xell-licence-action-group">
                <span class="xell-licence-action-title">Documents</span>
                <div class="xell-licence-action-buttons">
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="openDocument(licence, 'devis')">
                    Devis
                  </button>
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="openDocument(licence, 'contrat')">
                    Contrat
                  </button>
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="prepareOnboardingEmail(licence)">
                    Outlook
                  </button>
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="sendingEmailId === licence.id" @click="sendOnboardingEmail(licence)">
                    <Send class="h-4 w-4" />
                    {{ sendingEmailId === licence.id ? '...' : 'Envoyer depuis Saytu' }}
                  </button>
                </div>
              </div>

              <div class="xell-licence-action-group">
                <span class="xell-licence-action-title">Abonnement</span>
                <div class="xell-licence-action-buttons">
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="renewLicence(licence)">
                    +12 mois
                  </button>
                  <button
                    v-if="licence.statut !== 'suspendue'"
                    type="button"
                    class="btn-secondary px-3 py-2 text-xs text-amber-700"
                    :disabled="suspensionNoticeLoadingId === licence.id"
                    @click="sendSuspensionNotice(licence)"
                  >
                    {{ suspensionNoticeLoadingId === licence.id ? '...' : 'Préavis 7j' }}
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
              </div>

              <div class="xell-licence-action-group">
                <span class="xell-licence-action-title">Accès</span>
                <div class="xell-licence-action-buttons">
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="resetAdminAccessLoadingId === licence.id" @click="resetTenantAdminAccess(licence)">
                    <KeyRound class="h-4 w-4" />
                    {{ resetAdminAccessLoadingId === licence.id ? '...' : 'Réinitialiser accès' }}
                  </button>
                </div>
              </div>
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
  Archive,
  CheckCircle2,
  Copy,
  CreditCard,
  Database,
  Download,
  FileSignature,
  FileText,
  HardDrive,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
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
import { buildEmailDraft, downloadOutlookEml } from '@/utils/emailComposer'

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
  pro: 35000,
  business: 60000,
}

const DEFAULT_PLAN_LIMITS = {
  starter: {
    max_utilisateurs: 3,
    storage_limit_mb: 512,
    monthly_documents_limit: 100,
  },
  pro: {
    max_utilisateurs: 10,
    storage_limit_mb: 2048,
    monthly_documents_limit: 500,
  },
  business: {
    max_utilisateurs: 50,
    storage_limit_mb: 10240,
    monthly_documents_limit: 5000,
  },
}

const DEFAULT_PAYMENT_METHODS = {
  wave: {
    label: 'Wave Business',
    details: '+221 77 437 09 52',
  },
  virement: {
    label: 'Virement bancaire',
    details: 'ORABANK — SN08 SN17 5014 0404 3148 3019 0178',
  },
  especes: {
    label: 'Espèces',
    details: 'Paiement au bureau XELLTEKK',
  },
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
const backingUpTenantId = ref(null)
const revokingTenantId = ref(null)
const generatingSubscriptionInvoices = ref(false)
const payingSubscriptionInvoiceId = ref(null)
const sendingSubscriptionInvoiceId = ref(null)
const remindingSubscriptionInvoiceId = ref(null)
const updatingSupportTicketId = ref(null)
const supportReplySaving = ref(false)
const reviewingPaymentRequestId = ref(null)
const suspensionNoticeLoadingId = ref(null)
const savingEmailSettings = ref(false)
const testingEmailSettings = ref(false)
const search = ref('')
const editingId = ref(null)
const stats = reactive({
  clients: 0,
  licences_actives: 0,
  a_renouveler: 0,
  revenu_mensuel: 0,
  onboarding_a_finaliser: 0,
})
const reference = reactive({
  plans: DEFAULT_PLANS,
  modules: DEFAULT_MODULES,
  statuts: DEFAULT_STATUTS,
  tarifs: DEFAULT_TARIFS,
  plan_limits: DEFAULT_PLAN_LIMITS,
  payment_methods: DEFAULT_PAYMENT_METHODS,
  contract_defaults: cloneContractDefaults(),
})
const licences = ref([])
const clients = ref([])
const form = reactive(emptyForm())
const emailSettings = reactive(emptyEmailSettings())
const emailForm = reactive(emptyEmailForm())
const supportReplyForm = reactive({
  ticket_id: null,
  message: '',
})
const saasHealth = reactive(emptySaasHealth())
const saasCommerce = reactive(emptySaasCommerce())
const productionMonitoring = reactive(emptyProductionMonitoring())

const plans = computed(() => nonEmptyObject(reference.plans) ? reference.plans : DEFAULT_PLANS)
const statuts = computed(() => nonEmptyObject(reference.statuts) ? reference.statuts : DEFAULT_STATUTS)
const tarifs = computed(() => nonEmptyObject(reference.tarifs) ? reference.tarifs : DEFAULT_TARIFS)
const planLimits = computed(() => nonEmptyObject(reference.plan_limits) ? reference.plan_limits : DEFAULT_PLAN_LIMITS)
const paymentMethods = computed(() => nonEmptyObject(reference.payment_methods) ? reference.payment_methods : DEFAULT_PAYMENT_METHODS)
const contractDefaults = computed(() => normalizeContractDefaults(reference.contract_defaults))
const billingCycles = computed(() => nonEmptyObject(contractDefaults.value.billing_cycles) ? contractDefaults.value.billing_cycles : DEFAULT_CONTRACT_DEFAULTS.billing_cycles)
const paymentTerms = computed(() => nonEmptyObject(contractDefaults.value.payment_terms) ? contractDefaults.value.payment_terms : DEFAULT_CONTRACT_DEFAULTS.payment_terms)
const supportLevels = computed(() => nonEmptyObject(contractDefaults.value.support_levels) ? contractDefaults.value.support_levels : DEFAULT_CONTRACT_DEFAULTS.support_levels)
const activeLicence = computed(() => licences.value.find(licence => licence.id === editingId.value) || null)
const activeOnboarding = computed(() => activeLicence.value?.onboarding || null)
const licenceActionTotal = computed(() => licenceActionGroups.value.reduce((total, group) => total + group.count, 0))
const saasHealthItems = computed(() => Array.isArray(saasHealth.items) ? saasHealth.items : [])
const subscriptionInvoices = computed(() => Array.isArray(saasCommerce.invoices) ? saasCommerce.invoices : [])
const subscriptionRisks = computed(() => Array.isArray(saasCommerce.subscription_risks) ? saasCommerce.subscription_risks : [])
const paymentRequests = computed(() => Array.isArray(saasCommerce.payment_requests) ? saasCommerce.payment_requests : [])
const supportTickets = computed(() => Array.isArray(saasCommerce.support_tickets) ? saasCommerce.support_tickets : [])
const securityEvents = computed(() => Array.isArray(saasCommerce.security_events) ? saasCommerce.security_events : [])
const tenantBackups = computed(() => Array.isArray(saasCommerce.backups) ? saasCommerce.backups : [])
const productionChecks = computed(() => Array.isArray(productionMonitoring.checks) ? productionMonitoring.checks : [])
const adminBlocks = computed(() => [
  {
    index: 1,
    id: 'sante-saas',
    label: 'Santé SaaS',
    value: `${saasHealth.summary.ready_clients || 0}/${saasHealth.summary.total_clients || 0} prêt(s)`,
  },
  {
    index: 2,
    id: 'supervision-production',
    label: 'Supervision',
    value: productionMonitoring.status_label || 'À vérifier',
  },
  {
    index: 3,
    id: 'pilotage-commercial',
    label: 'Commercial',
    value: `${saasCommerce.summary.unpaid_count || 0} impayé(s)`,
  },
  {
    index: 4,
    id: 'centre-actions',
    label: 'Actions licences',
    value: `${licenceActionTotal.value || 0} action(s)`,
  },
  {
    index: 5,
    id: 'demandes-demo',
    label: 'Demandes démo',
    value: `${demoRequests.value.length} prospect(s)`,
  },
  {
    index: 6,
    id: 'configuration-email',
    label: 'Email SMTP',
    value: emailSettings.configured ? 'SMTP prêt' : 'À configurer',
  },
  {
    index: 7,
    id: 'onboarding-client',
    label: 'Onboarding',
    value: activeOnboarding.value ? `${activeOnboarding.value.progress || 0}%` : 'Pack client',
  },
  {
    index: 8,
    id: 'formulaire-licence',
    label: 'Formulaire',
    value: editingId.value ? 'Édition licence' : 'Nouvelle licence',
  },
])

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
    label: 'Onboarding',
    value: stats.onboarding_a_finaliser || 0,
    hint: 'Dossiers client à finaliser',
    icon: CheckCircle2,
  },
  {
    label: 'Mensuel actif',
    value: money(stats.revenu_mensuel),
    hint: 'Revenu mensuel estimé',
    icon: TrendingUp,
  },
])

const saasCommerceCards = computed(() => [
  {
    label: 'MRR abonnement',
    value: money(saasCommerce.summary.subscription_revenue_month || 0),
    hint: 'CA mensuel récurrent',
    icon: CreditCard,
  },
  {
    label: 'Impayés SaaS',
    value: money(saasCommerce.summary.unpaid_amount || 0),
    hint: `${saasCommerce.summary.unpaid_count || 0} facture(s), ${saasCommerce.summary.overdue_count || 0} en retard`,
    icon: AlertTriangle,
  },
  {
    label: 'Risques abonnement',
    value: saasCommerce.summary.subscription_risk_count || 0,
    hint: `${saasCommerce.summary.reminders_due_count || 0} à relancer, ${saasCommerce.summary.suspension_risk_count || 0} critiques`,
    icon: ShieldCheck,
  },
  {
    label: 'Paiements déclarés',
    value: saasCommerce.summary.payment_requests_pending_count || 0,
    hint: 'À vérifier et valider',
    icon: CreditCard,
  },
  {
    label: 'Support ouvert',
    value: saasCommerce.summary.support_open_count || 0,
    hint: 'Tickets clients à traiter',
    icon: LifeBuoy,
  },
  {
    label: 'Alertes sécurité',
    value: saasCommerce.summary.security_alerts_count || 0,
    hint: '7 derniers jours',
    icon: LockKeyhole,
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

  const onboardingTodoStatuses = ['a_preparer', 'a_facturer', 'paiement_attendu']
  const onboardingTodo = all
    .filter(licence => onboardingTodoStatuses.includes(licence.onboarding_status))
    .sort((a, b) => Number(a.onboarding_progress || 0) - Number(b.onboarding_progress || 0))

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
      key: 'onboarding',
      title: 'Onboarding',
      hint: 'À finaliser avant exploitation.',
      icon: CheckCircle2,
      tone: 'warning',
      items: onboardingTodo,
      detail: licence => `${licence.onboarding_progress || 0}% · ${licence.onboarding_next_action || 'Prochaine action à vérifier'}`,
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

const onboardingSteps = computed(() => {
  if (Array.isArray(activeOnboarding.value?.steps) && activeOnboarding.value.steps.length) {
    return activeOnboarding.value.steps.map((step, index) => ({
      index: index + 1,
      label: step.label,
      hint: step.detail || step.hint || 'Étape à vérifier.',
      done: Boolean(step.done),
    }))
  }

  return [
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
  ]
})

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
  reference.plan_limits = nonEmptyObject(incomingReference.plan_limits) ? incomingReference.plan_limits : DEFAULT_PLAN_LIMITS
  reference.payment_methods = nonEmptyObject(incomingReference.payment_methods) ? incomingReference.payment_methods : DEFAULT_PAYMENT_METHODS
  reference.contract_defaults = normalizeContractDefaults(incomingReference.contract_defaults)
  licences.value = Array.isArray(data.licences) ? data.licences : []
  clients.value = Array.isArray(data.clients) ? data.clients : []
  hydrateSaasHealth(data.saas_health)
  hydrateSaasCommerce(data.saas_commerce)
  hydrateProductionMonitoring(data.production_monitoring)
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

function hydrateSaasCommerce(payload = null) {
  const normalized = normalizeSaasCommerce(payload)
  Object.assign(saasCommerce.summary, normalized.summary)
  saasCommerce.invoices = normalized.invoices
  saasCommerce.subscription_risks = normalized.subscription_risks
  saasCommerce.payment_requests = normalized.payment_requests
  saasCommerce.support_tickets = normalized.support_tickets
  saasCommerce.security_events = normalized.security_events
  saasCommerce.backups = normalized.backups
  saasCommerce.payment_methods = normalized.payment_methods
  saasCommerce.plan_limits = normalized.plan_limits
}

function hydrateProductionMonitoring(payload = null) {
  const normalized = normalizeProductionMonitoring(payload)
  Object.assign(productionMonitoring, normalized)
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
    demo_notification_to: normalized.demo_notification_to || normalized.from_address || 'xelltekk@xelltekk.com',
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

async function sendSuspensionNotice(licence) {
  if (!licence?.id) return

  const ok = await askConfirm({
    title: 'Préavis de suspension',
    message: `Envoyer un préavis de 7 jours à ${licence.client_nom || 'ce client'} avant suspension ?`,
    confirmLabel: 'Créer le préavis',
    tone: 'danger',
  })
  if (!ok) return

  suspensionNoticeLoadingId.value = licence.id
  try {
    const { data } = await api.post(`/admin/xelltekk/licences/${licence.id}/suspension-notice`, {
      days: 7,
      raison: 'Préavis de suspension pour abonnement non régularisé.',
    })
    hydrate(data)
    toast.success(data.message || 'Préavis de suspension créé.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de créer le préavis.')
  } finally {
    suspensionNoticeLoadingId.value = null
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
    storage_limit_mb: licence.storage_limit_mb ?? '',
    monthly_documents_limit: licence.monthly_documents_limit ?? '',
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
    storage_limit_mb: parseIntegerOrNull(form.storage_limit_mb),
    monthly_documents_limit: parseIntegerOrNull(form.monthly_documents_limit),
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
  const limits = planLimits.value?.[form.plan] || {}
  form.modules_autorises = Array.isArray(modules) ? [...modules] : []
  if (!parseNumber(form.montant_mensuel)) {
    form.montant_mensuel = tarifs.value?.[form.plan] ?? form.montant_mensuel
  }
  if (!parseIntegerOrNull(form.max_utilisateurs)) {
    form.max_utilisateurs = limits.max_utilisateurs ?? form.max_utilisateurs
  }
  if (!parseIntegerOrNull(form.storage_limit_mb)) {
    form.storage_limit_mb = limits.storage_limit_mb ?? form.storage_limit_mb
  }
  if (!parseIntegerOrNull(form.monthly_documents_limit)) {
    form.monthly_documents_limit = limits.monthly_documents_limit ?? form.monthly_documents_limit
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

async function createTenantBackup(item) {
  if (!item?.id) return

  backingUpTenantId.value = item.id
  try {
    const { data } = await api.post(`/admin/xelltekk/clients/${item.id}/backup`)
    hydrate(data)
    toast.success(data.message || 'Sauvegarde client créée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de créer la sauvegarde client.')
  } finally {
    backingUpTenantId.value = null
  }
}

async function downloadTenantBackup(backup) {
  if (!backup?.id) return

  try {
    const response = await api.get(`/admin/xelltekk/backups/${backup.id}/download`, {
      responseType: 'blob',
      headers: { Accept: 'application/json' },
    })
    const blob = new Blob([response.data], { type: 'application/json;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = backup.filename || filenameFromDisposition(response.headers?.['content-disposition']) || `sauvegarde-saytu-${backup.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch (error) {
    toast.error(await apiBlobErrorMessage(error, 'Impossible de télécharger la sauvegarde.'))
  }
}

async function revokeTenantSessions(item) {
  if (!item?.id) return

  const ok = await askConfirm({
    title: 'Déconnecter le client',
    message: `Déconnecter toutes les sessions actives de ${item.client_nom || item.nom || 'ce client'} ?`,
    confirmLabel: 'Déconnecter',
    tone: 'danger',
  })
  if (!ok) return

  revokingTenantId.value = item.id
  try {
    const { data } = await api.post(`/admin/xelltekk/clients/${item.id}/revoke-sessions`)
    hydrate(data)
    toast.success(data.message || 'Sessions client déconnectées.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de déconnecter les sessions client.')
  } finally {
    revokingTenantId.value = null
  }
}

async function generateSubscriptionInvoices() {
  generatingSubscriptionInvoices.value = true
  try {
    const { data } = await api.post('/admin/xelltekk/subscription-invoices/generate')
    hydrate(data)
    toast.success(data.message || 'Factures abonnement générées.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de générer les factures abonnement.')
  } finally {
    generatingSubscriptionInvoices.value = false
  }
}

async function openSubscriptionInvoicePdf(invoice) {
  if (!invoice?.id) return

  const rawUrl = invoice.pdf_url || `/api/admin/xelltekk/subscription-invoices/${invoice.id}/pdf`
  const endpoint = axiosApiUrl(rawUrl)
  const reservedWindow = window.open('', '_blank')

  if (reservedWindow) {
    reservedWindow.opener = null
    reservedWindow.document.write('<!doctype html><title>Préparation du PDF</title><p style="font-family:system-ui;padding:24px">Préparation de la facture...</p>')
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
    toast.error(await apiBlobErrorMessage(error, 'Impossible d’ouvrir la facture PDF.'))
  }
}

async function sendSubscriptionInvoiceEmail(invoice) {
  if (!invoice?.id) return

  const ok = await askConfirm({
    title: 'Envoyer la facture',
    message: `Envoyer la facture ${invoice.numero || ''} à ${invoice.client_email || invoice.client_nom || 'ce client'} ?`,
    confirmLabel: 'Envoyer',
  })
  if (!ok) return

  sendingSubscriptionInvoiceId.value = invoice.id
  try {
    const endpoint = axiosApiUrl(invoice.send_email_url || `/admin/xelltekk/subscription-invoices/${invoice.id}/email`)
    const { data } = await api.post(endpoint, {})
    hydrate(data)
    toast.success(data.message || 'Facture abonnement envoyée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’envoyer la facture abonnement.')
  } finally {
    sendingSubscriptionInvoiceId.value = null
  }
}

async function remindSubscriptionInvoice(invoice) {
  if (!invoice?.id) return

  const ok = await askConfirm({
    title: 'Relancer l’abonnement',
    message: `Envoyer une relance à ${invoice.client_email || invoice.client_nom || 'ce client'} pour la facture ${invoice.numero || ''} ?`,
    confirmLabel: 'Relancer',
  })
  if (!ok) return

  remindingSubscriptionInvoiceId.value = invoice.id
  try {
    const endpoint = axiosApiUrl(invoice.remind_url || `/admin/xelltekk/subscription-invoices/${invoice.id}/remind`)
    const { data } = await api.post(endpoint, {})
    hydrate(data)
    toast.success(data.message || 'Relance abonnement envoyée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’envoyer la relance abonnement.')
  } finally {
    remindingSubscriptionInvoiceId.value = null
  }
}

async function markSubscriptionInvoicePaid(invoice) {
  if (!invoice?.id) return

  const ok = await askConfirm({
    title: 'Marquer payée',
    message: `Marquer la facture ${invoice.numero || ''} de ${invoice.client_nom || 'ce client'} comme payée ?`,
    confirmLabel: 'Marquer payée',
  })
  if (!ok) return

  payingSubscriptionInvoiceId.value = invoice.id
  try {
    const { data } = await api.post(`/admin/xelltekk/subscription-invoices/${invoice.id}/mark-paid`, {
      payment_mode: 'virement',
    })
    hydrate(data)
    toast.success(data.message || 'Facture abonnement payée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de marquer la facture payée.')
  } finally {
    payingSubscriptionInvoiceId.value = null
  }
}

async function reviewPaymentRequest(paymentRequest, statut) {
  if (!paymentRequest?.id) return

  const isApproval = statut === 'validee'
  const ok = await askConfirm({
    title: isApproval ? 'Valider le paiement' : 'Refuser le paiement',
    message: isApproval
      ? `Valider le paiement déclaré ${paymentRequest.numero || ''} et solder la facture liée si nécessaire ?`
      : `Refuser le paiement déclaré ${paymentRequest.numero || ''} ?`,
    confirmLabel: isApproval ? 'Valider' : 'Refuser',
    tone: isApproval ? 'default' : 'danger',
  })
  if (!ok) return

  reviewingPaymentRequestId.value = paymentRequest.id
  try {
    const { data } = await api.put(`/admin/xelltekk/payment-requests/${paymentRequest.id}`, {
      statut,
      admin_notes: isApproval ? 'Paiement validé par XELLTEKK.' : 'Paiement refusé après vérification.',
    })
    hydrate(data)
    toast.success(data.message || 'Demande de paiement mise à jour.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de traiter ce paiement déclaré.')
  } finally {
    reviewingPaymentRequestId.value = null
  }
}

async function updateSupportTicketStatus(ticket, statut) {
  if (!ticket?.id) return

  updatingSupportTicketId.value = ticket.id
  try {
    const { data } = await api.put(`/admin/xelltekk/support-tickets/${ticket.id}`, { statut })
    hydrate(data)
    toast.success(data.message || 'Ticket support mis à jour.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de mettre à jour le ticket.')
  } finally {
    updatingSupportTicketId.value = null
  }
}

function toggleAdminSupportReply(ticket) {
  if (!ticket?.can_reply) return

  if (supportReplyForm.ticket_id === ticket.id) {
    resetAdminSupportReply()
    return
  }

  Object.assign(supportReplyForm, {
    ticket_id: ticket.id,
    message: '',
  })
}

function resetAdminSupportReply() {
  Object.assign(supportReplyForm, {
    ticket_id: null,
    message: '',
  })
}

async function submitAdminSupportReply(ticket) {
  if (!ticket?.id || !supportReplyForm.message.trim()) {
    toast.error('Renseignez la réponse.')
    return
  }

  supportReplySaving.value = true
  try {
    const { data } = await api.post(`/admin/xelltekk/support-tickets/${ticket.id}/messages`, {
      message: supportReplyForm.message.trim(),
    })
    hydrate(data)
    resetAdminSupportReply()
    toast.success(data.message || 'Réponse envoyée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’envoyer la réponse.')
  } finally {
    supportReplySaving.value = false
  }
}

async function closeAdminSupportTicket(ticket) {
  if (!ticket?.id) return

  const ok = await askConfirm({
    title: 'Fermer le ticket',
    message: `Fermer le ticket ${ticket.numero || ''} ?`,
    confirmLabel: 'Fermer',
    tone: 'danger',
  })
  if (!ok) return

  updatingSupportTicketId.value = ticket.id
  try {
    const { data } = await api.post(`/admin/xelltekk/support-tickets/${ticket.id}/close`, {
      message: 'Ticket fermé par XELLTEKK.',
    })
    hydrate(data)
    resetAdminSupportReply()
    toast.success(data.message || 'Ticket fermé.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de fermer le ticket.')
  } finally {
    updatingSupportTicketId.value = null
  }
}

async function reopenAdminSupportTicket(ticket) {
  if (!ticket?.id) return

  updatingSupportTicketId.value = ticket.id
  try {
    const { data } = await api.post(`/admin/xelltekk/support-tickets/${ticket.id}/reopen`, {
      message: 'Ticket rouvert par XELLTEKK.',
    })
    hydrate(data)
    toast.success(data.message || 'Ticket rouvert.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de rouvrir le ticket.')
  } finally {
    updatingSupportTicketId.value = null
  }
}

async function prepareOnboardingEmail(licence) {
  if (!licence?.id) return

  try {
    const { data } = await api.get(axiosApiUrl(licence.email_onboarding_url || `/admin/xelltekk/licences/${licence.id}/email-onboarding`))
    const draft = buildEmailDraft({
      to: data.to,
      subject: data.subject,
      body: data.body,
      context_type: 'xelltekk_licence',
      context_id: licence.id,
    })

    if (!data.to) {
      await copyText(data.body, 'Email copié : aucun email client renseigné.')
      return
    }

    if (downloadOutlookEml(draft, `offre-saytu-${licence.numero || licence.id}`)) {
      toast.success('Fichier .eml téléchargé. Ouvrez-le avec Outlook classique et joignez les PDF si besoin.')
    } else {
      await copyText(data.body, 'Email copié.')
    }
  } catch (error) {
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
      demo_notification_to: emailForm.demo_notification_to || emailForm.from_address || 'xelltekk@xelltekk.com',
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
    storage_limit_mb: '',
    monthly_documents_limit: '',
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
    demo_notification_to: 'xelltekk@xelltekk.com',
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
    demo_notification_to: 'xelltekk@xelltekk.com',
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

function emptySaasCommerce() {
  return {
    summary: {
      subscription_revenue_month: 0,
      subscription_revenue_year: 0,
      unpaid_amount: 0,
      unpaid_count: 0,
      overdue_count: 0,
      reminders_due_count: 0,
      subscription_risk_count: 0,
      suspension_risk_count: 0,
      payment_requests_pending_count: 0,
      support_open_count: 0,
      security_alerts_count: 0,
      trial_signups_30d: 0,
    },
    invoices: [],
    subscription_risks: [],
    payment_requests: [],
    support_tickets: [],
    security_events: [],
    backups: [],
    plan_limits: DEFAULT_PLAN_LIMITS,
    payment_methods: DEFAULT_PAYMENT_METHODS,
  }
}

function emptyProductionMonitoring() {
  return {
    status: 'warning',
    status_label: 'À vérifier',
    warning_count: 0,
    danger_count: 0,
    checks: [],
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

function normalizeSaasCommerce(payload = null) {
  const fallback = emptySaasCommerce()

  return {
    summary: {
      ...fallback.summary,
      ...(payload?.summary || {}),
    },
    invoices: Array.isArray(payload?.invoices) ? payload.invoices : [],
    subscription_risks: Array.isArray(payload?.subscription_risks) ? payload.subscription_risks : [],
    payment_requests: Array.isArray(payload?.payment_requests) ? payload.payment_requests : [],
    support_tickets: Array.isArray(payload?.support_tickets) ? payload.support_tickets : [],
    security_events: Array.isArray(payload?.security_events) ? payload.security_events : [],
    backups: Array.isArray(payload?.backups) ? payload.backups : [],
    plan_limits: nonEmptyObject(payload?.plan_limits) ? payload.plan_limits : fallback.plan_limits,
    payment_methods: nonEmptyObject(payload?.payment_methods) ? payload.payment_methods : fallback.payment_methods,
  }
}

function normalizeProductionMonitoring(payload = null) {
  const fallback = emptyProductionMonitoring()

  return {
    ...fallback,
    ...(payload || {}),
    checks: Array.isArray(payload?.checks) ? payload.checks : [],
  }
}

function statusClass(licence) {
  if (licence.suspension_notice_expired) return 'bg-red-100 text-red-700'
  if (licence.is_under_suspension_notice) return 'bg-amber-100 text-amber-700'
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

function subscriptionInvoiceClass(status) {
  if (status === 'payee') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'en_retard') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function subscriptionReminderChipClass(reminder) {
  if (!reminder?.can_send) return 'border-slate-200 bg-slate-50 text-slate-400'
  if (reminder.stage === 'en_retard') return 'border-red-200 bg-red-50 text-red-700'
  if (reminder.is_due) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-indigo-200 bg-indigo-50 text-indigo-700'
}

function subscriptionReminderTextClass(reminder) {
  if (reminder?.stage === 'en_retard') return 'text-red-600'
  if (reminder?.is_due) return 'text-amber-600'
  return 'text-[color:var(--saytu-muted,#64748b)]'
}

function subscriptionRiskClass(level) {
  if (level === 'critical') return 'border-red-200 bg-red-50 text-red-800'
  if (level === 'high') return 'border-orange-200 bg-orange-50 text-orange-800'
  if (level === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-sky-200 bg-sky-50 text-sky-800'
}

function subscriptionRiskDotClass(level) {
  if (level === 'critical') return 'bg-red-500'
  if (level === 'high') return 'bg-orange-500'
  if (level === 'warning') return 'bg-amber-500'
  return 'bg-sky-500'
}

function supportTicketClass(priority) {
  if (priority === 'urgente') return 'border-red-200 bg-red-50 text-red-700'
  if (priority === 'haute') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function onboardingStatusClass(status) {
  if (status === 'complete') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'paiement_attendu') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'a_preparer') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'a_facturer') return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function onboardingProgressStyle(progress) {
  const value = Math.max(0, Math.min(100, Number(progress || 0)))
  return { width: `${value}%` }
}

function securityEventClass(severity) {
  if (severity === 'danger') return 'border-red-200 bg-red-50 text-red-700'
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function paymentRequestClass(status) {
  if (status === 'validee') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'refusee' || status === 'annulee') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function productionStatusClass(status) {
  if (status === 'danger') return 'bg-red-100 text-red-700'
  if (status === 'warning') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

function productionCheckClass(status) {
  if (status === 'danger') return 'border-red-200 bg-red-50 text-red-800'
  if (status === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-emerald-200 bg-emerald-50 text-emerald-800'
}

function productionDotClass(status) {
  if (status === 'danger') return 'bg-red-500'
  if (status === 'warning') return 'bg-amber-500'
  return 'bg-emerald-500'
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

.xell-section-anchor {
  scroll-margin-top: 6rem;
}

.xell-admin-nav {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.xell-admin-nav-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 1rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--saytu-surface, #ffffff) 88%, var(--saytu-focus, #22d3ee) 12%),
    color-mix(in srgb, var(--saytu-surface, #ffffff) 96%, var(--saytu-primary, #0ea5e9) 4%)
  );
  color: var(--saytu-shell-text, #082f49);
  padding: 0.65rem 0.75rem;
  text-decoration: none;
  transition: 160ms ease;
}

.xell-admin-nav-card:hover {
  border-color: color-mix(in srgb, var(--saytu-primary, #0ea5e9) 55%, var(--saytu-border, #bae6fd));
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgb(14 165 233 / 0.12);
}

.xell-admin-nav-index,
.xell-section-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 45%, var(--saytu-border, #bae6fd));
  background: color-mix(in srgb, var(--saytu-focus, #22d3ee) 18%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary-hover, #0284c7);
  font-weight: 900;
}

.xell-admin-nav-index {
  width: 2rem;
  height: 2rem;
  border-radius: 0.8rem;
  font-size: 0.78rem;
}

.xell-panel-title {
  min-width: 0;
}

.xell-section-kicker {
  width: max-content;
  margin-bottom: 0.35rem;
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
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
  align-items: stretch;
  gap: 0.85rem;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border-radius: 1rem;
  padding: 1rem;
  transition: 160ms ease;
}

.xell-licence-main {
  width: 100%;
  min-width: 0;
}

.xell-licence-row h3,
.xell-licence-row p {
  min-width: 0;
}

.xell-licence-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.42rem 0.75rem;
  margin-top: 0.65rem;
  color: var(--saytu-muted, #64748b);
  font-size: 0.75rem;
  line-height: 1.35;
}

.xell-licence-meta-item,
.xell-licence-workspace {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: break-word;
  word-break: normal;
}

.xell-licence-workspace {
  color: var(--saytu-primary, #2563eb);
  font-weight: 900;
}

.xell-onboarding-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid;
  border-radius: 999px;
  padding: 0.16rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 900;
  white-space: nowrap;
}

.xell-licence-progress {
  height: 0.38rem;
  width: 100%;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--saytu-border, #e2e8f0) 70%, transparent);
  margin-top: 0.6rem;
}

.xell-licence-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--saytu-primary, #2563eb), #22d3ee);
  transition: width 180ms ease;
}

.xell-licence-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
  gap: 0.55rem;
  width: 100%;
  min-width: 0;
}

.xell-licence-action-group {
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--saytu-border, #e2e8f0) 82%, transparent);
  border-radius: 0.95rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #2563eb) 10%);
  padding: 0.48rem;
}

.xell-licence-action-title {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--saytu-muted, #64748b);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
}

.xell-licence-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.xell-licence-actions .btn-secondary {
  max-width: 100%;
  min-height: 1.95rem;
  padding: 0.42rem 0.62rem;
  font-size: 0.72rem;
  white-space: nowrap;
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

.xell-saas-actions {
  display: flex;
  flex-wrap: wrap;
  align-self: flex-start;
  justify-content: flex-end;
  gap: 0.4rem;
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

.xell-commerce-card,
.xell-commerce-box {
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 94%, var(--saytu-primary, #2563eb) 6%);
}

.xell-commerce-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem;
}

.xell-commerce-box {
  min-height: 16rem;
  padding: 0.9rem;
}

.xell-risk-panel {
  border: 1px solid color-mix(in srgb, var(--saytu-border, #bfdbfe) 90%, transparent);
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, #fef2f2 8%);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
  padding: 0.9rem;
}

.xell-risk-item {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 0.75rem;
  min-height: 8.2rem;
  border: 1px solid;
  border-radius: 1rem;
  padding: 0.8rem;
}

.xell-monitor-check {
  border: 1px solid;
  border-radius: 1rem;
  padding: 0.75rem;
}

.xell-commerce-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 3.1rem;
  border: 1px solid color-mix(in srgb, var(--saytu-border, #e2e8f0) 78%, transparent);
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #2563eb) 10%);
  padding: 0.55rem 0.65rem;
}

.xell-ticket-row {
  display: block;
}

.xell-subscription-actions {
  display: grid;
  justify-items: end;
  gap: 0.35rem;
  min-width: 8.5rem;
  text-align: right;
}

.xell-mini-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-radius: 999px;
  padding: 0.22rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 900;
}

.xell-mini-chip:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.xell-empty-mini {
  border: 1px dashed var(--saytu-border, #e2e8f0);
  border-radius: 0.9rem;
  padding: 0.9rem;
  text-align: center;
  color: var(--saytu-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 800;
}

.xell-empty-state {
  border: 1px dashed color-mix(in srgb, var(--saytu-primary, #0ea5e9) 38%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 86%, var(--saytu-focus, #22d3ee) 14%);
  color: var(--saytu-muted, #64748b);
  padding: 1rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 800;
}

.label {
  display: block;
  margin-bottom: 0.3rem;
  color: var(--saytu-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 800;
}

@media (min-width: 1024px) {
  .xell-licence-actions {
    grid-template-columns: repeat(auto-fit, minmax(10rem, max-content));
    justify-content: end;
  }

  .xell-licence-action-group {
    width: max-content;
    max-width: 100%;
  }
}

@media (min-width: 1280px) {
  .xell-licence-meta {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .xell-panel-header {
    align-items: stretch;
    flex-direction: column;
  }

  .xell-licence-row {
    gap: 0.7rem;
    padding: 0.75rem;
  }

  .xell-licence-actions,
  .xell-saas-actions,
  .xell-licence-action-buttons {
    justify-content: flex-start;
  }

  .xell-saas-row,
  .xell-lead-row,
  .xell-commerce-row {
    align-items: stretch;
    flex-direction: column;
  }

  .xell-subscription-actions {
    justify-items: start;
    min-width: 0;
    text-align: left;
  }
}

@media (max-width: 420px) {
  .xell-licence-row h3 {
    overflow: visible;
    white-space: normal;
    text-overflow: clip;
  }

  .xell-licence-actions .btn-secondary {
    flex: 1 1 100%;
    justify-content: center;
  }
}
</style>
