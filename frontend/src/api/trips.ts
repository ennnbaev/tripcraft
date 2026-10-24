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
  create: (body: TripRequest, signal?: AbortSignal) =>
    api<TripResponse>('/trips', { method: 'POST', body: JSON.stringify(body), signal }),
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

/** Pass a signal to make the request cancellable (the Generating screen's Cancel button). */
export function useCreateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ body, signal }: { body: TripRequest; signal?: AbortSignal }) => tripsApi.create(body, signal),
    onSuccess: (trip) => {
      qc.setQueryData(tripKeys.detail(trip.id), trip)
      qc.invalidateQueries({ queryKey: tripKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

/** Optimistic: the trip leaves the list at once and comes back if the DELETE fails. */
export function useDeleteTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tripsApi.remove,
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: tripKeys.all, exact: true })
      const previous = qc.getQueryData<TripSummary[]>(tripKeys.all)
      qc.setQueryData<TripSummary[]>(tripKeys.all, (old) => old?.filter((t) => t.id !== id))
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(tripKeys.all, context.previous)
    },
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: tripKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['stats'] })
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
