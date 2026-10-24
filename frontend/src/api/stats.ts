import { useQuery } from '@tanstack/react-query'
import type { Stats } from '../types/api'
import { api } from './client'

export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('/stats') })
}

