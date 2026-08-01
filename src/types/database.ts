export interface SiteContent {
  id: string
  section_key: string
  content_type: 'text' | 'image' | 'html'
  value: string
  value_uk: string
  label: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type ReleaseType = 'single' | 'ep' | 'album'

export interface Release {
  id: string
  title: string
  catalog_number: string | null
  artist_name: string
  genre: 'neurofunk' | 'dnb' | 'breakbeat' | 'techstep'
  release_type: ReleaseType
  release_date: string | null
  cover_art_url: string | null
  description: string | null
  buy_link: string | null
  stream_links: Record<string, string>
  translations: Record<string, Record<string, string>>
  sort_order: number
  is_visible: boolean
  created_at: string
  tracks?: Track[]
}

export interface Track {
  id: string
  release_id: string
  title: string
  duration: number | null
  audio_url: string | null
  track_number: number
  created_at: string
}

export interface Producer {
  id: string
  name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  genres: string[]
  social_links: Record<string, string>
  music_links: Record<string, string>
  translations: Record<string, Record<string, string>>
  sort_order: number
  is_visible: boolean
  created_at: string
}

export interface Video {
  id: string
  title: string
  youtube_url: string
  description: string | null
  translations: Record<string, Record<string, string>>
  sort_order: number
  is_visible: boolean
  created_at: string
}

export interface Photo {
  id: string
  title: string | null
  image_url: string
  caption: string | null
  category: string
  translations: Record<string, Record<string, string>>
  sort_order: number
  is_visible: boolean
  created_at: string
}

export interface Event {
  id: string
  title: string
  date: string
  venue: string | null
  city: string | null
  description: string | null
  image_url: string | null
  ticket_link: string | null
  lineup: string[]
  translations: Record<string, Record<string, string>>
  is_visible: boolean
  created_at: string
}

export interface Partner {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  category: 'friend' | 'partner' | 'sponsor'
  translations: Record<string, Record<string, string>>
  sort_order: number
  is_visible: boolean
  created_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

export interface Setting {
  key: string
  value: string
  created_at: string
  updated_at: string
}
