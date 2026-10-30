export async function leasingOptions(api, endpoint) {
  const rows = []
  let page = 1
  let lastPage = 1
  do {
    const { data } = await api.get(endpoint, { params: { per_page: 100, page } })
    if (!Array.isArray(data.data) || Number(data.current_page) !== page) throw Error('Liste leasing incomplete. Actualisez la page.')
    rows.push(...data.data)
    lastPage = Number(data.last_page || 1)
    page++
  } while (page <= lastPage)
  return rows
}

export function pageMeta(data) {
  return { current_page: data.current_page || 1, last_page: data.last_page || 1,
    total: data.total || 0, from: data.from || 0, to: data.to || 0 }
}
