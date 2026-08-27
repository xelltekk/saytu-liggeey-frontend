import { computed, reactive } from 'vue'

const minimizedWindows = reactive([])

function sortWindows() {
  minimizedWindows.sort((a, b) => (a.minimizedAt || 0) - (b.minimizedAt || 0))
}

export function useWindowDock() {
  function register(windowData) {
    const existing = minimizedWindows.find((item) => item.id === windowData.id)

    if (existing) {
      Object.assign(existing, windowData, {
        minimizedAt: existing.minimizedAt || Date.now(),
      })
    } else {
      minimizedWindows.push({
        ...windowData,
        minimizedAt: Date.now(),
      })
    }

    sortWindows()
  }

  function update(id, patch) {
    const existing = minimizedWindows.find((item) => item.id === id)
    if (existing) Object.assign(existing, patch)
  }

  function unregister(id) {
    const index = minimizedWindows.findIndex((item) => item.id === id)
    if (index !== -1) minimizedWindows.splice(index, 1)
  }

  return {
    windows: computed(() => minimizedWindows),
    register,
    update,
    unregister,
  }
}
