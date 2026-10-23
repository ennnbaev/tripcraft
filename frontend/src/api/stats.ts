import { useQuery } from '@tanstack/react-query'
import type { Stats } from '../types/api'
import { api } from './client'

export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('/stats') })
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api<{ status: string; app: string }>('/health'),
    refetchInterval: 30_000,
    retry: false,
  })
}
