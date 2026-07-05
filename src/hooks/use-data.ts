import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { SiteContent, Release, Producer, Video, Photo, Event, Partner, ContactMessage } from '@/types/database'

export function useSiteContent() {
  return useQuery({
    queryKey: ['site_content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data as SiteContent[]
    },
  })
}

export function useContentValue(key: string, fallback = '') {
  const { data } = useSiteContent()
  const { i18n } = useTranslation()
  const item = data?.find(c => c.section_key === key)
  if (!item) return fallback
  if (i18n.language === 'uk' && item.value_uk) return item.value_uk
  return item.value || fallback
}

export function useLocalized<T extends { translations?: Record<string, Record<string, string>> }>(
  item: T | null | undefined,
  field: string,
  fallback = ''
): string {
  const { i18n } = useTranslation()
  if (!item) return fallback
  const lang = i18n.language
  const translated = item.translations?.[lang]?.[field]
  if (translated) return translated
  return (item as Record<string, unknown>)[field] as string || fallback
}

export function getLocalizedField<T extends { translations?: Record<string, Record<string, string>> }>(
  item: T,
  field: string,
  lang: string
): string {
  const translated = item.translations?.[lang]?.[field]
  if (translated) return translated
  return (item as Record<string, unknown>)[field] as string || ''
}

export function useReleases() {
  return useQuery({
    queryKey: ['releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order')
      if (error) throw error
      return data as Release[]
    },
  })
}

export function useProducers() {
  return useQuery({
    queryKey: ['producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order')
      if (error) throw error
      return data as Producer[]
    },
  })
}

export function useVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order')
      if (error) throw error
      return data as Video[]
    },
  })
}

export function usePhotos() {
  return useQuery({
    queryKey: ['photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order')
      if (error) throw error
      return data as Photo[]
    },
  })
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_visible', true)
        .gte('date', new Date().toISOString())
        .order('date')
      if (error) throw error
      return data as Event[]
    },
  })
}

export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order')
      if (error) throw error
      return data as Partner[]
    },
  })
}

export function useAboutStats() {
  return useQuery({
    queryKey: ['about_stats'],
    queryFn: async () => {
      const [releasesRes, producersRes] = await Promise.all([
        supabase.from('releases').select('*', { count: 'exact', head: true }).eq('is_visible', true),
        supabase.from('producers').select('*', { count: 'exact', head: true }).eq('is_visible', true),
      ])
      if (releasesRes.error) throw releasesRes.error
      if (producersRes.error) throw producersRes.error
      return {
        releasesCount: releasesRes.count ?? 0,
        producersCount: producersRes.count ?? 0,
      }
    },
  })
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: async (msg: Omit<ContactMessage, 'id' | 'is_read' | 'created_at'>) => {
      const { error } = await supabase.from('contact_messages').insert(msg)
      if (error) throw error
    },
  })
}

export function useAdminReleases() {
  return useQuery({
    queryKey: ['admin_releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data as Release[]
    },
  })
}

export function useAdminProducers() {
  return useQuery({
    queryKey: ['admin_producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data as Producer[]
    },
  })
}

export function useAdminVideos() {
  return useQuery({
    queryKey: ['admin_videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data as Video[]
    },
  })
}

export function useAdminPhotos() {
  return useQuery({
    queryKey: ['admin_photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data as Photo[]
    },
  })
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      return data as Event[]
    },
  })
}

export function useAdminPartners() {
  return useQuery({
    queryKey: ['admin_partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data as Partner[]
    },
  })
}

export function useAdminMessages() {
  return useQuery({
    queryKey: ['admin_messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ContactMessage[]
    },
  })
}

export function useDeleteMutation(table: string, queryKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
  })
}

export function useUpsertMutation<T extends Record<string, unknown>>(table: string, queryKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: T) => {
      const { error } = await supabase.from(table).upsert(item)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
  })
}
