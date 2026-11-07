import { onActivated, onDeactivated } from 'vue'
import { useToast } from '@/composables/useToast'

// Initial loading stays in onMounted. Only refresh server data on subsequent
// visits; never replay navigation, form initialization or timer registration.
export function usePageReactivation(refresh) {
  const toast = useToast()
  let firstActivation = true
  let active = false
  onDeactivated(() => { active = false })
  onActivated(async () => {
    active = true
    if (firstActivation) {
      firstActivation = false
      return
    }
    try {
      await refresh()
    } catch {
      if (active) toast.error('Impossible d’actualiser les données. Réessayez dans quelques instants.')
    }
  })
}
