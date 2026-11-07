import { inject } from 'vue'
import { useRouter } from 'vue-router'

export const completedCreationKey = Symbol('completedCreation')

// Only discard a creation form after a successful save and navigation.
export function useCreationReturn() {
  const router = useRouter()
  const completed = inject(completedCreationKey, () => {})
  return async target => {
    completed(true)
    try {
      const failure = await router.replace(target)
      if (failure) completed(false)
    } catch (error) {
      completed(false)
      throw error
    }
  }
}
