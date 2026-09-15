<template>
  <div
    class="email-action-buttons"
    :class="{
      'email-action-buttons-compact': compact,
      'email-action-buttons-dialog': dialog,
    }"
  >
    <template v-if="dialog">
      <button
        type="button"
        class="email-action-trigger"
        :disabled="disabled || sending || !hasRecipient"
        :title="hasRecipient ? 'Choisir le mode de relance email' : 'Aucun email destinataire renseigné'"
        @click="openDialog"
      >
        {{ sending ? 'Envoi...' : triggerLabel }}
      </button>

      <Teleport v-if="dialogOpen" to="body">
        <div class="email-choice-backdrop" @click.self="closeDialog">
          <section class="email-choice-modal" role="dialog" aria-modal="true" aria-label="Choisir le mode d’envoi">
            <button type="button" class="email-choice-close" aria-label="Fermer" @click="closeDialog">×</button>
            <p class="email-choice-kicker">Relance email</p>
            <h3>Choisir le mode d’envoi</h3>
            <p class="email-choice-help">
              Destinataire : <strong>{{ email.to }}</strong>
            </p>
            <p v-if="email.subject" class="email-choice-subject">
              {{ email.subject }}
            </p>

            <button type="button" class="email-history-toggle" :disabled="historyLoading" @click="toggleHistory">
              {{ historyOpen ? 'Masquer l’historique' : 'Voir l’historique des relances' }}
            </button>

            <div v-if="historyOpen" class="email-history-panel">
              <p v-if="historyLoading" class="email-history-empty">Chargement de l’historique...</p>
              <p v-else-if="historyError" class="email-history-empty email-history-error">{{ historyError }}</p>
              <p v-else-if="historyItems.length === 0" class="email-history-empty">Aucune relance enregistrée pour le moment.</p>
              <template v-else>
                <article v-for="item in historyItems" :key="item.id" class="email-history-item">
                  <div class="email-history-item-head">
                    <span :class="historyStatusClass(item.status)">{{ historyStatusLabel(item.status) }}</span>
                    <time>{{ formatHistoryDate(item.created_at) }}</time>
                  </div>
                  <p>{{ item.subject || 'Sans sujet' }}</p>
                  <small>{{ item.user?.name || 'Utilisateur' }} · {{ item.to }}</small>
                </article>
              </template>
            </div>

            <div class="email-choice-actions">
              <button
                type="button"
                class="email-action-btn email-action-btn-primary"
                :disabled="sending"
                @click="sendFromSaytu"
              >
                {{ sending ? 'Envoi...' : sendButtonLabel }}
              </button>
              <button
                type="button"
                class="email-action-btn email-action-btn-secondary"
                :disabled="sending"
                @click="openInOutlook"
              >
                {{ outlookButtonLabel }}
              </button>
            </div>
          </section>
        </div>
      </Teleport>
    </template>

    <template v-else>
      <button
        type="button"
        class="email-action-btn email-action-btn-primary"
        :disabled="disabled || sending || !hasRecipient"
        :title="hasRecipient ? 'Envoyer immédiatement avec le SMTP configuré dans Saytu' : 'Aucun email destinataire renseigné'"
        @click="sendFromSaytu"
      >
        {{ sending ? 'Envoi...' : sendButtonLabel }}
      </button>

      <button
        type="button"
        class="email-action-btn email-action-btn-secondary"
        :disabled="disabled || !hasRecipient"
        :title="hasRecipient ? 'Télécharger un fichier .eml à ouvrir avec Outlook classique' : 'Aucun email destinataire renseigné'"
        @click="openInOutlook"
      >
        {{ outlookButtonLabel }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { buildEmailDraft, downloadOutlookEml } from '@/utils/emailComposer'

const props = defineProps({
  draft: { type: Object, default: () => ({}) },
  filename: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  dialog: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  sendLabel: { type: String, default: '' },
  outlookLabel: { type: String, default: '' },
  triggerLabel: { type: String, default: 'Relancer' },
})

const emit = defineEmits(['sent', 'error', 'outlook'])
const toast = useToast()
const sending = ref(false)
const dialogOpen = ref(false)
const historyOpen = ref(false)
const historyLoading = ref(false)
const historyLoaded = ref(false)
const historyError = ref('')
const historyItems = ref([])

const email = computed(() => buildEmailDraft(props.draft))
const hasRecipient = computed(() => Boolean(email.value.to))
const sendButtonLabel = computed(() => props.sendLabel || 'Envoyer depuis Saytu')
const outlookButtonLabel = computed(() => props.outlookLabel || 'Ouvrir dans Outlook')

function openDialog() {
  if (!hasRecipient.value) {
    toast.error('Aucun email destinataire renseigné.')
    return
  }
  historyOpen.value = false
  historyLoaded.value = false
  historyError.value = ''
  historyItems.value = []
  dialogOpen.value = true
}

function closeDialog() {
  if (!sending.value) dialogOpen.value = false
}

async function sendFromSaytu() {
  if (!hasRecipient.value) {
    toast.error('Aucun email destinataire renseigné.')
    return
  }

  sending.value = true
  try {
    const { data } = await api.post('/emails/send', email.value)
    toast.success(data.message || 'Email envoyé depuis Saytu.')
    emit('sent', data)
    dialogOpen.value = false
  } catch (error) {
    const message = error.response?.data?.message || 'Email non envoyé depuis Saytu.'
    toast.error(message)
    emit('error', error)
  } finally {
    sending.value = false
  }
}

async function openInOutlook() {
  if (!hasRecipient.value) {
    toast.error('Aucun email destinataire renseigné.')
    return
  }

  if (downloadOutlookEml(email.value, props.filename)) {
    try {
      await api.post('/emails/prepared-outlook', email.value)
    } catch (error) {
      // La génération Outlook a réussi : ne pas bloquer l'utilisateur si seule la trace échoue.
    }

    toast.success('Fichier .eml téléchargé. Ouvrez-le avec Outlook classique.')
    emit('outlook', email.value)
    dialogOpen.value = false
  } else {
    toast.error('Impossible de générer le fichier Outlook.')
  }
}

async function toggleHistory() {
  historyOpen.value = !historyOpen.value
  if (historyOpen.value && !historyLoaded.value) {
    await loadHistory()
  }
}

async function loadHistory() {
  historyLoading.value = true
  historyError.value = ''

  try {
    const params = {
      per_page: 5,
      context_type: email.value.context_type || undefined,
      context_id: email.value.context_id || undefined,
      to: email.value.context_type && email.value.context_id ? undefined : email.value.to || undefined,
    }
    const { data } = await api.get('/emails/history', { params })
    historyItems.value = data.data || []
    historyLoaded.value = true
  } catch (error) {
    historyError.value = error.response?.data?.message || 'Historique indisponible pour le moment.'
  } finally {
    historyLoading.value = false
  }
}

function historyStatusLabel(status) {
  return {
    sent: 'Envoyé Saytu',
    outlook_prepared: 'Préparé Outlook',
    failed: 'Échec',
  }[status] || 'Relance'
}

function historyStatusClass(status) {
  return {
    sent: 'email-history-status email-history-status-sent',
    outlook_prepared: 'email-history-status email-history-status-outlook',
    failed: 'email-history-status email-history-status-failed',
  }[status] || 'email-history-status'
}

function formatHistoryDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<style scoped>
.email-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.email-action-btn {
  align-items: center;
  border-radius: 999px;
  border: 1px solid;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 800;
  justify-content: center;
  line-height: 1.1;
  min-height: 2rem;
  padding: 0.5rem 0.75rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
}

.email-action-btn:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgb(14 165 233 / 14%);
  transform: translateY(-1px);
}

.email-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.email-action-btn-primary {
  background: linear-gradient(135deg, var(--saytu-primary, #2563eb), var(--saytu-accent, #22d3ee));
  border-color: transparent;
  color: white;
}

.email-action-btn-secondary {
  background: var(--saytu-soft, #eef6ff);
  border-color: var(--saytu-border, #bfdbfe);
  color: var(--saytu-primary, #2563eb);
}

.email-action-buttons-compact .email-action-btn {
  min-height: 1.75rem;
  padding: 0.38rem 0.58rem;
}

.email-action-buttons-dialog {
  display: inline-flex;
}

.email-action-trigger {
  align-items: center;
  background: var(--saytu-soft, #eef6ff);
  border: 1px solid var(--saytu-border, #bfdbfe);
  border-radius: 999px;
  color: var(--saytu-primary, #2563eb);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 850;
  justify-content: center;
  min-height: 1.9rem;
  padding: 0.42rem 0.8rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
}

.email-action-trigger:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgb(14 165 233 / 14%);
  transform: translateY(-1px);
}

.email-action-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.email-choice-backdrop {
  align-items: center;
  background: rgb(8 47 73 / 32%);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 10000;
}

.email-choice-modal {
  background:
    linear-gradient(135deg, rgb(255 255 255 / 98%), rgb(236 254 255 / 98%)),
    #ffffff;
  border: 1px solid #7dd3fc;
  border-radius: 1.35rem;
  box-shadow: 0 28px 80px rgb(8 47 73 / 26%);
  max-width: 460px;
  padding: 1.25rem;
  position: relative;
  width: min(460px, 100%);
}

.email-choice-close {
  align-items: center;
  border-radius: 999px;
  color: #0369a1;
  display: inline-flex;
  font-size: 1.3rem;
  height: 2rem;
  justify-content: center;
  position: absolute;
  right: 0.75rem;
  top: 0.65rem;
  width: 2rem;
}

.email-choice-close:hover {
  background: rgb(14 165 233 / 10%);
  color: #075985;
}

.email-choice-kicker {
  color: #0284c7;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.email-choice-modal h3 {
  color: #082f49;
  font-size: 1.18rem;
  font-weight: 950;
  margin: 0.25rem 2rem 0.4rem 0;
}

.email-choice-help,
.email-choice-subject {
  color: #334155;
  font-size: 0.86rem;
  margin: 0;
}

.email-choice-help strong {
  color: #0f172a;
  font-weight: 900;
}

.email-choice-subject {
  background: #f8fdff;
  border: 1px solid #bae6fd;
  border-radius: 0.9rem;
  color: #0f172a;
  font-weight: 850;
  line-height: 1.35;
  margin-top: 0.75rem;
  padding: 0.75rem 0.85rem;
}

.email-choice-actions {
  display: grid;
  gap: 0.6rem;
  margin-top: 1rem;
}

.email-history-toggle {
  color: #0369a1;
  font-size: 0.78rem;
  font-weight: 900;
  margin-top: 0.85rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.email-history-toggle:disabled {
  opacity: 0.55;
}

.email-history-panel {
  background: rgb(255 255 255 / 86%);
  border: 1px solid #bae6fd;
  border-radius: 1rem;
  display: grid;
  gap: 0.45rem;
  margin-top: 0.65rem;
  max-height: 210px;
  overflow-y: auto;
  padding: 0.65rem;
}

.email-history-empty {
  color: #475569;
  font-size: 0.78rem;
  margin: 0;
}

.email-history-error {
  color: #be123c;
}

.email-history-item {
  border-bottom: 1px solid #e0f2fe;
  display: grid;
  gap: 0.2rem;
  padding: 0.45rem 0;
}

.email-history-item:last-child {
  border-bottom: 0;
}

.email-history-item-head {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}

.email-history-item p {
  color: #0f172a;
  font-size: 0.8rem;
  font-weight: 850;
  line-height: 1.25;
  margin: 0;
}

.email-history-item small,
.email-history-item time {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 650;
}

.email-history-status {
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 900;
  padding: 0.18rem 0.48rem;
}

.email-history-status-sent {
  background: #dcfce7;
  color: #166534;
}

.email-history-status-outlook {
  background: #e0f2fe;
  color: #0369a1;
}

.email-history-status-failed {
  background: #ffe4e6;
  color: #be123c;
}

.email-choice-actions .email-action-btn {
  font-size: 0.82rem;
  min-height: 2.55rem;
  width: 100%;
}
</style>
