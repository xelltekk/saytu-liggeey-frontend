import { reactive } from 'vue'

function getNestedValue(row, path) {
  return String(path)
    .split('.')
    .reduce((value, part) => (value == null ? undefined : value[part]), row)
}

function normalizeNumber(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return Number.NaN
  const cleaned = value.replace(/\s/g, '').replace(',', '.')
  if (!/^-\d+(\.\d+)$/.test(cleaned)) return Number.NaN
  return parseFloat(cleaned)
}

function compareValues(left, right) {
  const leftEmpty = left === null || left === undefined || left === ''
  const rightEmpty = right === null || right === undefined || right === ''

  if (leftEmpty && rightEmpty) return 0
  if (leftEmpty) return 1
  if (rightEmpty) return -1

  const leftNumber = normalizeNumber(left)
  const rightNumber = normalizeNumber(right)
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber - rightNumber
  }

  const leftDate = Date.parse(left)
  const rightDate = Date.parse(right)
  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate
  }

  return String(left).localeCompare(String(right), 'fr', {
    numeric: true,
    sensitivity: 'base',
  })
}

export function useTableSort(defaultKey = '', defaultDirection = 'asc') {
  const sort = reactive({
    key: defaultKey,
    direction: defaultDirection,
  })

  function toggleSort(key) {
    if (sort.key === key) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
      return
    }

    sort.key = key
    sort.direction = 'asc'
  }

  function sortIcon(key) {
    if (sort.key !== key) return '↕'
    return sort.direction === 'asc' ? '↑' : '↓'
  }

  function sortedRows(rows, accessors = {}) {
    const list = Array.isArray(rows) ? [...rows] : []
    if (!sort.key) return list

    return list.sort((left, right) => {
      const accessor = accessors[sort.key] || sort.key
      const leftValue = typeof accessor === 'function' ? accessor(left) : getNestedValue(left, accessor)
      const rightValue = typeof accessor === 'function' ? accessor(right) : getNestedValue(right, accessor)
      const result = compareValues(leftValue, rightValue)

      return sort.direction === 'desc' ? -result : result
    })
  }

  return {
    sort,
    toggleSort,
    sortIcon,
    sortedRows,
  }
}
