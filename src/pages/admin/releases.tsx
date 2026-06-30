import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminReleases, useUpsertMutation, useDeleteMutation } from '@/hooks/use-data'
import { useFileUpload } from '@/hooks/use-file-upload'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Release } from '@/types/database'

const emptyRelease: Partial<Release> = {
  title: '', catalog_number: '', artist_name: '', genre: 'dnb',
  release_date: null, cover_art_url: '', description: '', buy_link: '',
  stream_links: {}, sort_order: 0, is_visible: true, translations: {},
}

export default function AdminReleases() {
  const { t } = useTranslation()
  const { data: releases, isLoading } = useAdminReleases()
  const upsert = useUpsertMutation<Record<string, unknown>>('releases', 'admin_releases')
  const deleteMut = useDeleteMutation('releases', 'admin_releases')
  const { upload, uploading } = useFileUpload('releases')
  const [editing, setEditing] = useState<Partial<Release> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [formLang, setFormLang] = useState<'en' | 'uk'>('en')

  const openNew = () => { setEditing({ ...emptyRelease }); setCoverFile(null); setFormLang('en'); setDialogOpen(true) }
  const openEdit = (r: Release) => { setEditing({ ...r }); setCoverFile(null); setFormLang('en'); setDialogOpen(true) }

  const handleSave = async () => {
    if (!editing?.title || !editing?.artist_name) {
      toast.error(t('admin.releases.validation.required'))
      return
    }
    let coverUrl = editing.cover_art_url || ''
    if (coverFile) {
      const url = await upload(coverFile)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      coverUrl = url
    }
    try {
      await upsert.mutateAsync({ ...editing, cover_art_url: coverUrl })
      toast.success(t('toast.saved'))
      setDialogOpen(false)
      setEditing(null)
      setCoverFile(null)
    } catch {
      toast.error(t('toast.saveFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id)
      toast.success(t('toast.deleted'))
    } catch {
      toast.error(t('toast.deleteFailed'))
    }
  }

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
                <TableHead>{t('admin.releases.fields.catalogNumber')}</TableHead>
                <TableHead>{t('admin.releases.fields.title')}</TableHead>
                <TableHead>{t('admin.releases.fields.artistName')}</TableHead>
                <TableHead>{t('admin.releases.fields.genre')}</TableHead>
                <TableHead>{t('admin.releases.fields.visible')}</TableHead>
                <TableHead className="w-24">{t('admin.content.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases?.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.catalog_number}</TableCell>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.artist_name}</TableCell>
                  <TableCell><Badge variant="secondary">{r.genre}</Badge></TableCell>
                  <TableCell>{r.is_visible ? t('admin.common.yes') : t('admin.common.no')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
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
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('admin.common.noResults')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="font-mono">{editing?.id ? t('admin.common.edit') : t('admin.common.add')} - {t('admin.releases.title')}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              <LanguageTabs active={formLang} onChange={setFormLang} />
              {formLang === 'en' ? (
                <Input placeholder={t('admin.releases.fields.title')} value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              ) : (
                <Input placeholder={t('admin.releases.fields.title') + ' (UK)'} value={editing.translations?.uk?.title || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), title: e.target.value } } })} />
              )}
              <Input placeholder={t('admin.releases.fields.catalogNumber')} value={editing.catalog_number || ''} onChange={e => setEditing({ ...editing, catalog_number: e.target.value })} />
              <Input placeholder={t('admin.releases.fields.artistName')} value={editing.artist_name || ''} onChange={e => setEditing({ ...editing, artist_name: e.target.value })} />
              <Select value={editing.genre || 'dnb'} onValueChange={v => setEditing({ ...editing, genre: v as Release['genre'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neurofunk">{t('admin.releases.genres.neurofunk')}</SelectItem>
                  <SelectItem value="dnb">{t('admin.releases.genres.dnb')}</SelectItem>
                  <SelectItem value="breakbeat">{t('admin.releases.genres.breakbeat')}</SelectItem>
                  <SelectItem value="techstep">{t('admin.releases.genres.techstep')}</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={editing.release_date || ''} onChange={e => setEditing({ ...editing, release_date: e.target.value })} />
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('admin.releases.fields.coverArt')}</label>
                <FileUpload value={editing.cover_art_url} onChange={setCoverFile} />
              </div>
              {formLang === 'en' ? (
                <Textarea placeholder={t('admin.releases.fields.description')} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
              ) : (
                <Textarea placeholder={t('admin.releases.fields.description') + ' (UK)'} value={editing.translations?.uk?.description || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), description: e.target.value } } })} rows={3} />
              )}
              <Input placeholder={t('admin.releases.fields.buyLink')} value={editing.buy_link || ''} onChange={e => setEditing({ ...editing, buy_link: e.target.value })} />
              <Input type="number" placeholder={t('admin.releases.fields.sortOrder')} value={editing.sort_order ?? 0} onChange={e => setEditing({ ...editing, sort_order: +e.target.value })} />
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_visible ?? true} onCheckedChange={v => setEditing({ ...editing, is_visible: v })} />
                <span className="text-sm">{t('admin.releases.fields.visible')}</span>
              </div>
              <Button onClick={handleSave} disabled={uploading} className="w-full font-mono">
                {uploading ? t('admin.common.saving') : t('admin.common.save')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
