import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TripRequest, TripResponse, TripSummary } from '../types/api'
import { api } from './client'

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: number) => ['trips', id] as const,
  regenerate: (id: number) => ['trips', id, 'regenerate'] as const,
}

export const tripsApi = {
  list: () => api<TripSummary[]>('/trips'),
  get: (id: number) => api<TripResponse>(`/trips/${id}`),
  create: (body: TripRequest) =>
    api<TripResponse>('/trips', { method: 'POST', body: JSON.stringify(body) }),
  remove: (id: number) => api<void>(`/trips/${id}`, { method: 'DELETE' }),
  regenerateDay: (id: number, dayNumber: number, feedback: string) =>
    api<TripResponse>(`/trips/${id}/days/${dayNumber}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),
  generatePackingList: (id: number) =>
    api<TripResponse>(`/trips/${id}/packing-list`, { method: 'POST' }),
}

export function useTrips() {
  return useQuery({ queryKey: tripKeys.all, queryFn: tripsApi.list })
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => tripsApi.get(id),
    enabled: Number.isFinite(id),
  })
}

export function useCreateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tripsApi.create,
    onSuccess: (trip) => {
      qc.setQueryData(tripKeys.detail(trip.id), trip)
      qc.invalidateQueries({ queryKey: tripKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDeleteTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tripsApi.remove,
    onSuccess: (_, id) => {
      qc.setQueryData<TripSummary[]>(tripKeys.all, (old) => old?.filter((t) => t.id !== id))
      qc.removeQueries({ queryKey: tripKeys.detail(id) })
    },
  })
}

export function useRegenerateDay(tripId: number) {
  const qc = useQueryClient()
  return useMutation({
    // shared key lets other days see that a regeneration is running (see DayCard)
    mutationKey: tripKeys.regenerate(tripId),
    mutationFn: ({ dayNumber, feedback }: { dayNumber: number; feedback: string }) =>
      tripsApi.regenerateDay(tripId, dayNumber, feedback),
    onSuccess: (trip) => {
      qc.setQueryData(tripKeys.detail(tripId), trip)
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useGeneratePackingList(tripId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => tripsApi.generatePackingList(tripId),
    onSuccess: (trip) => {
      qc.setQueryData(tripKeys.detail(tripId), trip)
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
