import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { SiteContent, Release, Producer, Video, Photo, Event, Partner, ContactMessage, Setting, Track } from '@/types/database'

export interface TrackSaveRow {
  id?: string
  release_id: string
  title: string
  duration: number | null
  audio_url: string | null
  track_number: number
  created_at: string
}

export function buildTrackSaveRows(
  releaseId: string,
  tracks: Array<{ id?: string; title: string; duration: number | null; audio_url: string | null; track_number: number }>,
  uploadedAudioUrls: Map<number, string>,
): TrackSaveRow[] {
  return tracks.map((track, index) => ({
    id: track.id,
    release_id: releaseId,
    title: track.title,
    duration: track.duration,
    audio_url: uploadedAudioUrls.get(index) ?? track.audio_url,
    track_number: index + 1,
    created_at: '',
  }))
}

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
  return useMemo(() => {
    const item = data?.find(c => c.section_key === key)
    if (!item) return fallback
    if (i18n.language === 'uk' && item.value_uk) return item.value_uk
    return item.value || fallback
  }, [data, key, i18n.language, fallback])
}

export function useLocalized<T extends { translations?: Record<string, Record<string, string>> }>(
  item: T | null | undefined,
  field: string,
  fallback = ''
): string {
  const { i18n } = useTranslation()
  const lang = i18n.language
  return useMemo(() => {
    if (!item) return fallback
    const translated = item.translations?.[lang]?.[field]
    if (translated) return translated
    return (item as Record<string, unknown>)[field] as string || fallback
  }, [item, field, lang, fallback])
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
        .select('*, tracks(*)')
        .eq('is_visible', true)
        .order('sort_order')
      if (error) throw error
      const releases = (data ?? []) as Release[]
      releases.forEach(r => {
        r.tracks?.sort((a, b) => a.track_number - b.track_number)
      })
      return releases
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

// Contact submissions intentionally have no client-side hook: they go through
// the submit-contact edge function, which owns rate limiting and reCAPTCHA.
// Anonymous INSERT on contact_messages is revoked at the RLS level.

export function useAdminReleases() {
  return useQuery({
    queryKey: ['admin_releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('releases')
        .select('*, tracks(*)')
        .order('sort_order')
      if (error) throw error
      const releases = (data ?? []) as Release[]
      releases.forEach(r => {
        r.tracks?.sort((a, b) => a.track_number - b.track_number)
      })
      return releases
    },
  })
}

export function useSaveTracks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ releaseId, tracks }: { releaseId: string; tracks: Array<Omit<Track, 'id'> & { id?: string }> }) => {
      const { data: existing, error: fetchError } = await supabase
        .from('tracks')
        .select('id, audio_url')
        .eq('release_id', releaseId)
      if (fetchError) throw fetchError

      const keepIds = new Set(tracks.filter(t => t.id).map(t => t.id))
      const toDelete = (existing || []).filter(t => !keepIds.has(t.id))

      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from('tracks')
          .delete()
          .in('id', toDelete.map(t => t.id))
        if (delError) throw delError
      }

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        const row = {
          release_id: releaseId,
          title: track.title,
          duration: track.duration,
          audio_url: track.audio_url,
          track_number: i + 1,
        }
        if (track.id) {
          // An UPDATE that matches no rows is not an error, so ask for the
          // affected row back. If the id turns out to be stale, insert instead
          // of silently saving nothing.
          const { data: updated, error } = await supabase
            .from('tracks')
            .update(row)
            .eq('id', track.id)
            .select('id')
          if (error) throw error
          if (!updated || updated.length === 0) {
            const { error: insertError } = await supabase.from('tracks').insert(row)
            if (insertError) throw insertError
          }
        } else {
          const { error } = await supabase.from('tracks').insert(row)
          if (error) throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_releases'] })
      queryClient.invalidateQueries({ queryKey: ['releases'] })
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
      const { data, error } = await supabase.from(table).upsert(item).select().maybeSingle()
      if (error) throw error
      return data as T | null
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error
      return data as Setting[]
    },
  })
}

export function useSettingValue(key: string) {
  return useQuery({
    queryKey: ['setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .maybeSingle()
      if (error) throw error
      return data?.value ?? ''
    },
  })
}

export function useUpsertSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['setting'] })
    },
  })
}
