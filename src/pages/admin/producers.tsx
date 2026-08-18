import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminProducers, useUpsertMutation, useDeleteMutation } from '@/hooks/use-data'
import { useFileUpload } from '@/hooks/use-file-upload'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { FileUpload } from '@/components/ui/file-upload'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { LanguageTabs } from '@/components/admin/language-tabs'
import { Plus, Pencil, Trash2, Globe, Mail, Phone, Headphones } from 'lucide-react'
import {
  InstagramIcon,
  FacebookIcon,
  YouTubeIcon,
  TwitterIcon,
  TikTokIcon,
  SoundCloudIcon,
  SpotifyIcon,
  AppleMusicIcon,
  AmazonMusicIcon,
  BeatportIcon,
  TidalIcon,
  DeezerIcon,
  BandcampIcon,
} from '@/components/icons/brand-icons'
import { toast } from 'sonner'
import type { Producer } from '@/types/database'

const SOCIAL_FIELDS = [
  { key: 'website', icon: Globe },
  { key: 'instagram', icon: InstagramIcon },
  { key: 'facebook', icon: FacebookIcon },
  { key: 'youtube', icon: YouTubeIcon },
  { key: 'tiktok', icon: TikTokIcon },
  { key: 'twitter', icon: TwitterIcon },
  { key: 'soundcloud', icon: SoundCloudIcon },
  { key: 'email', icon: Mail },
  { key: 'phone', icon: Phone },
] as const

const MUSIC_FIELDS = [
  { key: 'spotify', icon: SpotifyIcon },
  { key: 'apple_music', icon: AppleMusicIcon },
  { key: 'amazon_music', icon: AmazonMusicIcon },
  { key: 'soundcloud', icon: SoundCloudIcon },
  { key: 'beatport', icon: BeatportIcon },
  { key: 'youtube_music', icon: YouTubeIcon },
  { key: 'tidal', icon: TidalIcon },
  { key: 'deezer', icon: DeezerIcon },
  { key: 'bandcamp', icon: BandcampIcon },
] as const

export default function AdminProducers() {
  const { t } = useTranslation()
  const { data: producers, isLoading } = useAdminProducers()
  const upsert = useUpsertMutation<Record<string, unknown>>('producers', 'admin_producers')
  const deleteMut = useDeleteMutation('producers', 'admin_producers')
  const { upload, uploading } = useFileUpload('producers')
  const [editing, setEditing] = useState<Partial<Producer> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [genresInput, setGenresInput] = useState('')
  const [socialInputs, setSocialInputs] = useState<Record<string, string>>({})
  const [musicInputs, setMusicInputs] = useState<Record<string, string>>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [formLang, setFormLang] = useState<'en' | 'uk'>('en')

  const openNew = () => {
    setEditing({ name: '', slug: '', bio: '', avatar_url: '', genres: [], social_links: {}, music_links: {}, sort_order: 0, is_visible: true, translations: {} })
    setGenresInput('')
    setSocialInputs({})
    setMusicInputs({})
    setAvatarFile(null)
    setFormLang('en')
    setDialogOpen(true)
  }

  const openEdit = (p: Producer) => {
    setEditing({ ...p })
    setGenresInput(p.genres?.join(', ') || '')
    setSocialInputs(p.social_links || {})
    setMusicInputs(p.music_links || {})
    setAvatarFile(null)
    setFormLang('en')
    setDialogOpen(true)
  }

  const handleSocialChange = (key: string, value: string) => {
    setSocialInputs(prev => ({ ...prev, [key]: value }))
  }

  const handleMusicChange = (key: string, value: string) => {
    setMusicInputs(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    let slug = (editing?.slug || '').trim()
    if (!slug && editing?.name) {
      slug = editing.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    if (!editing?.name || !slug) {
      toast.error(t('admin.producers.validation.required'))
      return
    }
    let avatarUrl = editing.avatar_url || ''
    if (avatarFile) {
      const url = await upload(avatarFile)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      avatarUrl = url
    }
    const genres = genresInput.split(',').map(g => g.trim()).filter(Boolean)
    const social_links: Record<string, string> = {}
    for (const [key, value] of Object.entries(socialInputs)) {
      if (value.trim()) social_links[key] = value.trim()
    }
    const music_links: Record<string, string> = {}
    for (const [key, value] of Object.entries(musicInputs)) {
      if (value.trim()) music_links[key] = value.trim()
    }
    try {
      await upsert.mutateAsync({ ...editing, slug, avatar_url: avatarUrl, genres, social_links, music_links })
      toast.success(t('toast.saved'))
      setDialogOpen(false)
    } catch (err) {
      const msg = (err as Error)?.message || ''
      if (msg.includes('producers_slug_key')) {
        toast.error(`Продюсер з таким Slug (${slug}) вже існує! Будь ласка, змініть полі Slug на інше унікальне ім'я.`)
      } else {
        toast.error(msg || t('toast.saveFailed'))
      }
    }
  }

  const handleDelete = async (id: string) => {
    try { await deleteMut.mutateAsync(id); toast.success(t('toast.deleted')) } catch (err) { toast.error((err as Error)?.message || t('toast.deleteFailed')) }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.producers.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.producers.description')}</p>
        </div>
        <Button size="sm" onClick={openNew} className="font-mono"><Plus className="mr-2 h-4 w-4" /> {t('admin.producers.addNew')}</Button>
      </div>

      {isLoading ? <Skeleton className="mt-6 h-48 rounded-lg" /> : (
        <div className="mt-6 rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t('admin.producers.fields.avatar')}</TableHead>
                <TableHead>{t('admin.producers.fields.name')}</TableHead>
                <TableHead>{t('admin.producers.fields.slug')}</TableHead>
                <TableHead>{t('admin.producers.fields.genres')}</TableHead>
                <TableHead>{t('admin.producers.fields.visible')}</TableHead>
                <TableHead className="w-24">{t('admin.content.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {producers?.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={p.avatar_url || undefined} alt={p.name} className="object-cover" />
                      <AvatarFallback className="bg-secondary font-mono text-xs">
                        {p.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                  <TableCell className="text-xs">{p.genres?.join(', ')}</TableCell>
                  <TableCell>{p.is_visible ? t('admin.common.yes') : t('admin.common.no')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>{t('admin.common.delete')}?</AlertDialogTitle><AlertDialogDescription>{t('admin.common.deleteConfirmation')}</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)}>{t('admin.common.delete')}</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!producers || producers.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('admin.common.noResults')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader><DialogTitle className="font-mono">{editing?.id ? t('admin.common.edit') : t('admin.common.add')} - {t('admin.producers.title')}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <LanguageTabs active={formLang} onChange={setFormLang} />
              <Input
                placeholder={t('admin.producers.fields.name')}
                value={editing.name || ''}
                onChange={e => {
                  const name = e.target.value
                  const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  setEditing(prev => prev ? { ...prev, name, slug: prev.id ? (prev.slug || '') : autoSlug } : null)
                }}
              />
              <Input placeholder={t('admin.producers.fields.slug')} value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} />
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('admin.producers.fields.avatar')}</label>
                <FileUpload value={editing.avatar_url} onChange={setAvatarFile} />
              </div>
              {formLang === 'en' ? (
                <Textarea placeholder={t('admin.producers.fields.bio')} value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value })} rows={3} />
              ) : (
                <Textarea placeholder={t('admin.producers.fields.bio')} value={editing.translations?.uk?.bio || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), bio: e.target.value } } })} rows={3} />
              )}
              <Input placeholder={t('admin.producers.fields.genres')} value={genresInput} onChange={e => setGenresInput(e.target.value)} />
              <Input type="number" placeholder={t('admin.producers.fields.sortOrder')} value={editing.sort_order ?? 0} onChange={e => setEditing({ ...editing, sort_order: +e.target.value })} />
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_visible ?? true} onCheckedChange={v => setEditing({ ...editing, is_visible: v })} />
                <span className="text-sm">{t('admin.producers.fields.visible')}</span>
              </div>

              <Separator />
              <p className="text-sm font-medium text-foreground">{t('admin.producers.fields.socialLinksSection')}</p>

              {SOCIAL_FIELDS.map(({ key, icon: Icon }) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder={t(`admin.producers.fields.social.${key}`)}
                    value={socialInputs[key] || ''}
                    onChange={e => handleSocialChange(key, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}

              <Separator />
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">{t('admin.producers.fields.musicLinksSection')}</p>
              </div>

              {MUSIC_FIELDS.map(({ key, icon: Icon }) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-primary/5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder={t(`admin.producers.fields.music.${key}`)}
                    value={musicInputs[key] || ''}
                    onChange={e => handleMusicChange(key, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}

              <Button onClick={handleSave} disabled={uploading} className="w-full font-mono">{uploading ? t('admin.common.saving') : t('admin.common.save')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
