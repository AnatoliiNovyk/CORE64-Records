import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useAdminReleases, useUpsertMutation, useDeleteMutation, useSaveTracks } from '@/hooks/use-data'
import { useFileUpload } from '@/hooks/use-file-upload'
import { supabase } from '@/lib/supabase'
import { usePlayer } from '@/lib/player'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { FileUpload } from '@/components/ui/file-upload'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LanguageTabs } from '@/components/admin/language-tabs'
import { TrackListField, tracksToFormValues, type TrackFormValue } from '@/components/admin/track-list-field'
import { ReleaseTypeBadge } from '@/components/player/release-helpers'
import { Plus, Pencil, Trash2, Play } from 'lucide-react'
import { toast } from 'sonner'
import type { Release, ReleaseType } from '@/types/database'

const GENRES = ['neurofunk', 'dnb', 'breakbeat', 'techstep'] as const
const RELEASE_TYPES: ReleaseType[] = ['single', 'ep', 'album']

const trackSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  duration: z.number().nullable(),
  audio_url: z.string().nullable(),

  track_number: z.number(),
})

function makeSchema(releaseType: ReleaseType) {
  const min = releaseType === 'single' ? 1 : releaseType === 'ep' ? 2 : 7
  const max = releaseType === 'single' ? 1 : releaseType === 'ep' ? 6 : null
  return z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    catalog_number: z.string(),
    artist_name: z.string().min(1),
    genre: z.enum(GENRES),
    release_type: z.enum(RELEASE_TYPES),
    release_date: z.string().nullable(),
    cover_art_url: z.string().nullable(),
    description: z.string(),
    buy_link: z.string(),
    stream_links: z.record(z.string(), z.string()),
    translations: z.record(z.string(), z.record(z.string(), z.string())),
    sort_order: z.number(),
    is_visible: z.boolean(),
    tracks: z
      .array(trackSchema)
      .min(min, `At least ${min} track(s) required`)
      .refine((arr) => max === null || arr.length <= max, `At most ${max} tracks allowed`)

  })
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>

export default function AdminReleases() {
  const { t } = useTranslation()
  const { data: releases, isLoading } = useAdminReleases()
  const upsert = useUpsertMutation<Record<string, unknown>>('releases', 'admin_releases')
  const deleteMut = useDeleteMutation('releases', 'admin_releases')
  const saveTracks = useSaveTracks()
  const { upload: uploadImage } = useFileUpload('releases')
  const { upload: uploadAudio } = useFileUpload('tracks', 100 * 1024 * 1024)
  const player = usePlayer()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [audioFiles, setAudioFiles] = useState<Map<number, File>>(new Map())
  const [formLang, setFormLang] = useState<'en' | 'uk'>('en')
  const [editingId, setEditingId] = useState<string | undefined>(undefined)

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema('single')) as never,
    defaultValues: {
      title: '', catalog_number: '', artist_name: '', genre: 'dnb', release_type: 'single',
      release_date: null, cover_art_url: '', description: '', buy_link: '',
      stream_links: {}, translations: {}, sort_order: 0, is_visible: true,
      tracks: [{ title: '', duration: null, audio_url: null, track_number: 1 }],
    },
    mode: 'onChange',
  })

  const { fields, append, remove, update, swap } = useFieldArray({ control: form.control, name: 'tracks' })
  const releaseType = form.watch('release_type')

  const handleTrackUpdate = (index: number, value: TrackFormValue) => {
    update(index, value as never)
  }
  const handleAudioSelect = (index: number, file: File | null) => {
    setAudioFiles(prev => {
      const next = new Map(prev)
      if (file) next.set(index, file)
      else next.delete(index)
      return next
    })
  }
  const handleTrackAppend = (value: TrackFormValue) => {
    append(value as never)
  }
  const handleTrackRemove = (index: number) => {
    remove(index)
  }
  const handleTrackSwap = (a: number, b: number) => {
    swap(a, b)
  }

  const openNew = () => {
    setEditingId(undefined)
    setCoverFile(null)
    setAudioFiles(new Map())
    setFormLang('en')
    form.reset({
      title: '', catalog_number: '', artist_name: '', genre: 'dnb', release_type: 'single',
      release_date: null, cover_art_url: '', description: '', buy_link: '',
      stream_links: {}, translations: {}, sort_order: 0, is_visible: true,
      tracks: [{ title: '', duration: null, audio_url: null, track_number: 1 }],
    })
    setDialogOpen(true)
  }

  const openEdit = (r: Release) => {
    setEditingId(r.id)
    setCoverFile(null)
    setAudioFiles(new Map())
    setFormLang('en')
    const trackVals = tracksToFormValues(r.tracks)
    form.reset({
      id: r.id,
      title: r.title,
      catalog_number: r.catalog_number || '',
      artist_name: r.artist_name,
      genre: r.genre,
      release_type: r.release_type,
      release_date: r.release_date,
      cover_art_url: r.cover_art_url,
      description: r.description || '',
      buy_link: r.buy_link || '',
      stream_links: r.stream_links || {},
      translations: r.translations || {},
      sort_order: r.sort_order,
      is_visible: r.is_visible,
      tracks: trackVals.length > 0 ? trackVals : [{ title: '', duration: null, audio_url: null, track_number: 1 }],
    })
    setDialogOpen(true)
  }

  const handleSave = form.handleSubmit(async (values) => {
    let coverUrl = values.cover_art_url || ''
    if (coverFile) {
      const url = await uploadImage(coverFile)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      coverUrl = url
    }

    const tracks: TrackFormValue[] = values.tracks.map((tr, i) => ({
      ...tr,
      track_number: i + 1,
    }))

    for (let i = 0; i < tracks.length; i++) {
      if (!tracks[i].audio_url && !audioFiles.get(i)) {
        toast.error(`Track ${i + 1}: audio file required`)
        return
      }
      const file = audioFiles.get(i)
      if (file) {
        const url = await uploadAudio(file)
        if (!url) {
          toast.error(`Track ${i + 1}: upload failed — check file size or connection`)
          return
        }
        tracks[i].audio_url = url
      }
    }

    try {
      const payload: Record<string, unknown> = {
        title: values.title,
        catalog_number: values.catalog_number,
        artist_name: values.artist_name,
        genre: values.genre,
        release_type: values.release_type,
        release_date: values.release_date,
        cover_art_url: coverUrl,
        description: values.description,
        buy_link: values.buy_link,
        stream_links: values.stream_links,
        translations: values.translations,
        sort_order: values.sort_order,
        is_visible: values.is_visible,
      }
      if (editingId) payload.id = editingId

      let targetId: string
      if (editingId) {
        await upsert.mutateAsync({ ...payload, id: editingId })
        targetId = editingId
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('releases')
          .insert(payload)
          .select('id')
          .single()
        if (insertError || !inserted?.id) throw insertError ?? new Error('Insert returned no id')
        targetId = inserted.id
      }

      if (targetId) {
        await saveTracks.mutateAsync({
          releaseId: targetId,
          tracks: tracks.map((tr) => ({
            id: tr.id || undefined,
            release_id: targetId,
            title: tr.title,
            duration: tr.duration,
            audio_url: tr.audio_url,
            track_number: tr.track_number,
            created_at: '',
          })),
        })
      }

      toast.success(t('toast.saved'))
      setDialogOpen(false)
    } catch {
      toast.error(t('toast.saveFailed'))
    }
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id)
      toast.success(t('toast.deleted'))
    } catch {
      toast.error(t('toast.deleteFailed'))
    }
  }

  const trackErrors = form.formState.errors.tracks as
    | { message?: string; [k: number]: { title?: { message: string }; audio_url?: { message: string } } }
    | undefined
  const minTracks = releaseType === 'single' ? 1 : releaseType === 'ep' ? 2 : 7
  const maxTracks = releaseType === 'single' ? 1 : releaseType === 'ep' ? 6 : null

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.releases.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.releases.description')}</p>
        </div>
        <Button size="sm" onClick={openNew} className="font-mono">
          <Plus className="mr-2 h-4 w-4" /> {t('admin.releases.addNew')}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="mt-6 h-64 rounded-lg" />
      ) : (
        <div className="mt-6 rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{t('admin.releases.fields.title')}</TableHead>
                <TableHead>{t('admin.releases.fields.artistName')}</TableHead>
                <TableHead>{t('admin.releases.fields.type')}</TableHead>
                <TableHead>{t('admin.releases.fields.genre')}</TableHead>
                <TableHead>{t('admin.releases.fields.tracks')}</TableHead>
                <TableHead>{t('admin.releases.fields.visible')}</TableHead>
                <TableHead className="w-24">{t('admin.content.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases?.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {r.cover_art_url ? (
                        <img src={r.cover_art_url} alt="" className="h-10 w-10 rounded object-cover border border-border" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-secondary border border-border" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <p>{r.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.catalog_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>{r.artist_name}</TableCell>
                  <TableCell>
                    <ReleaseTypeBadge type={r.release_type} label={t(`player.types.${r.release_type}`)} />
                  </TableCell>
                  <TableCell><Badge variant="secondary">{r.genre}</Badge></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.tracks?.length ?? 0}
                  </TableCell>
                  <TableCell>{r.is_visible ? t('admin.common.yes') : t('admin.common.no')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.tracks && r.tracks.length > 0 && r.tracks.some(tr => tr.audio_url) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => player.playRelease(r, 0)}
                          aria-label={t('player.play')}
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('admin.common.delete')}?</AlertDialogTitle>
                            <AlertDialogDescription>{t('admin.common.deleteConfirmation')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(r.id)}>{t('admin.common.delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!releases || releases.length === 0) && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t('admin.common.noResults')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="font-mono">
              {editingId ? t('admin.common.edit') : t('admin.common.add')} - {t('admin.releases.title')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave}>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <LanguageTabs active={formLang} onChange={setFormLang} />

              <Controller
                control={form.control}
                name="release_type"
                render={({ field }) => (
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">{t('admin.releases.fields.releaseType')}</label>
                    <Select value={field.value} onValueChange={(v) => {
                      field.onChange(v)
                      const newType = v as ReleaseType
                      const newMin = newType === 'single' ? 1 : newType === 'ep' ? 2 : 7
                      const current = form.getValues('tracks')
                      if (current.length < newMin) {
                        const toAdd = newMin - current.length
                        for (let i = 0; i < toAdd; i++) {
                          append({ title: '', duration: null, audio_url: null, track_number: current.length + i + 1 })
                        }
                      } else if (newType === 'single' && current.length > 1) {
                        for (let i = current.length - 1; i > 0; i--) remove(i)
                      }
                    }}>
                      <SelectTrigger aria-invalid={!!form.formState.errors.release_type}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">{t('player.types.single')} (1)</SelectItem>
                        <SelectItem value="ep">{t('player.types.ep')} (2-6)</SelectItem>
                        <SelectItem value="album">{t('player.types.album')} (7+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              {formLang === 'en' ? (
                <Controller
                  control={form.control}
                  name="title"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input placeholder={t('admin.releases.fields.title')} {...field} aria-invalid={!!fieldState.error} />
                      {fieldState.error && <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              ) : (
                <Controller
                  control={form.control}
                  name="translations"
                  render={({ field }) => (
                    <Input
                      placeholder={t('admin.releases.fields.title') + ' (UK)'}
                      value={field.value?.uk?.title || ''}
                      onChange={(e) => field.onChange({ ...field.value, uk: { ...field.value?.uk, title: e.target.value } })}
                    />
                  )}
                />
              )}

              <Controller
                control={form.control}
                name="catalog_number"
                render={({ field }) => <Input placeholder={t('admin.releases.fields.catalogNumber')} {...field} />}
              />

              <Controller
                control={form.control}
                name="artist_name"
                render={({ field, fieldState }) => (
                  <div>
                    <Input placeholder={t('admin.releases.fields.artistName')} {...field} aria-invalid={!!fieldState.error} />
                    {fieldState.error && <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />

              <Controller
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neurofunk">{t('admin.releases.genres.neurofunk')}</SelectItem>
                      <SelectItem value="dnb">{t('admin.releases.genres.dnb')}</SelectItem>
                      <SelectItem value="breakbeat">{t('admin.releases.genres.breakbeat')}</SelectItem>
                      <SelectItem value="techstep">{t('admin.releases.genres.techstep')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              <Controller
                control={form.control}
                name="release_date"
                render={({ field }) => (
                  <Input type="date" value={field.value || ''} onChange={(e) => field.onChange(e.target.value || null)} />
                )}
              />

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('admin.releases.fields.coverArt')}</label>
                <FileUpload value={form.watch('cover_art_url')} onChange={setCoverFile} />
              </div>

              {formLang === 'en' ? (
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => <Textarea placeholder={t('admin.releases.fields.description')} {...field} rows={3} />}
                />
              ) : (
                <Controller
                  control={form.control}
                  name="translations"
                  render={({ field }) => (
                    <Textarea
                      placeholder={t('admin.releases.fields.description') + ' (UK)'}
                      value={field.value?.uk?.description || ''}
                      onChange={(e) => field.onChange({ ...field.value, uk: { ...field.value?.uk, description: e.target.value } })}
                      rows={3}
                    />
                  )}
                />
              )}

              <Controller
                control={form.control}
                name="buy_link"
                render={({ field }) => <Input placeholder={t('admin.releases.fields.buyLink')} {...field} />}
              />

              <Controller
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <Input
                    type="number"
                    placeholder={t('admin.releases.fields.sortOrder')}
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(+e.target.value)}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="is_visible"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-sm">{t('admin.releases.fields.visible')}</span>
                  </div>
                )}
              />

              <div className="border-t border-border pt-3">
                <p className="mb-2 font-mono text-sm font-medium text-foreground">
                  {t('admin.releases.tracksSection')}
                </p>
                <TrackListField
                  fields={fields as unknown as Array<TrackFormValue & { id: string }>}
                  onUpdate={handleTrackUpdate}
                  onAppend={handleTrackAppend}
                  onRemove={handleTrackRemove}
                  onSwap={handleTrackSwap}
                  onAudioSelect={handleAudioSelect}
                  audioFiles={audioFiles}
                  errors={trackErrors as Record<number, { title?: { message?: string }; audio_url?: { message?: string } }> | undefined}
                  minTracks={minTracks}
                  maxTracks={maxTracks}
                />
                {form.formState.errors.tracks?.message && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.tracks.message as string}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={upsert.isPending || saveTracks.isPending} className="w-full font-mono">
                {upsert.isPending || saveTracks.isPending ? t('admin.common.saving') : t('admin.common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
