const BASE = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function api(path, { signal, ...options } = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      signal,
      ...options,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Tidak bisa menghubungi server. Pastikan API Tripdesk berjalan.', { code: 'NETWORK' })
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? 'Permintaan gagal diproses.', {
      status: response.status,
      code: payload?.error?.code ?? 'HTTP_ERROR',
    })
  }
  return payload.data
}

const query = (params) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const getLocations = (signal) => api('/locations', { signal })
export const getPickupPoints = (origin, signal) => api(`/pickup-points${query({ origin })}`, { signal })
export const getRoutes = (params = {}, signal) => api(`/routes${query(params)}`, { signal })
export const getSchedules = (params = {}, signal) => api(`/schedules${query(params)}`, { signal })
export const getNearby = (params = {}, signal) => api(`/nearby${query(params)}`, { signal })
export const getSchedule = (id, date, signal) => api(`/schedules/${id}${query({ date })}`, { signal })
export const getBookings = (params = {}, signal) => api(`/bookings${query(params)}`, { signal })
export const getBooking = (code, signal) => api(`/bookings/${encodeURIComponent(code)}`, { signal })
export const createBooking = (payload) =>
  api('/bookings', { method: 'POST', body: JSON.stringify(payload) })
export const cancelBooking = (code) =>
  api(`/bookings/${encodeURIComponent(code)}/cancel`, { method: 'PATCH' })
export const deleteBooking = (code) =>
  api(`/bookings/${encodeURIComponent(code)}`, { method: 'DELETE' })
export const clearHistory = () => api('/bookings', { method: 'DELETE' })
export const getProfile = (signal) => api('/profile', { signal })
