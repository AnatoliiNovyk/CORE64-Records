import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminVideos, useUpsertMutation, useDeleteMutation } from '@/hooks/use-data'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { LanguageTabs } from '@/components/admin/language-tabs'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Video } from '@/types/database'

export default function AdminVideos() {
  const { t } = useTranslation()
  const { data: videos, isLoading } = useAdminVideos()
  const upsert = useUpsertMutation<Record<string, unknown>>('videos', 'admin_videos')
  const deleteMut = useDeleteMutation('videos', 'admin_videos')
  const [editing, setEditing] = useState<Partial<Video> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formLang, setFormLang] = useState<'en' | 'uk'>('en')

  const openNew = () => { setEditing({ title: '', youtube_url: '', description: '', sort_order: 0, is_visible: true, translations: {} }); setDialogOpen(true) }
  const openEdit = (v: Video) => { setEditing({ ...v }); setDialogOpen(true) }

  const handleSave = async () => {
    if (!editing?.title || !editing?.youtube_url) { toast.error(t('admin.videos.validation.required')); return }
    try { await upsert.mutateAsync(editing as Record<string, unknown>); toast.success(t('toast.saved')); setDialogOpen(false) } catch (err) { toast.error((err as Error)?.message || t('toast.saveFailed')) }
  }

  const handleDelete = async (id: string) => {
    try { await deleteMut.mutateAsync(id); toast.success(t('toast.deleted')) } catch (err) { toast.error((err as Error)?.message || t('toast.deleteFailed')) }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.videos.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.videos.description')}</p>
        </div>
        <Button size="sm" onClick={openNew} className="font-mono"><Plus className="mr-2 h-4 w-4" /> {t('admin.videos.addNew')}</Button>
      </div>

      {isLoading ? <Skeleton className="mt-6 h-48 rounded-lg" /> : (
        <div className="mt-6 rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.videos.fields.title')}</TableHead>
                <TableHead>{t('admin.videos.fields.youtubeUrl')}</TableHead>
                <TableHead>{t('admin.videos.fields.visible')}</TableHead>
                <TableHead className="w-24">{t('admin.content.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos?.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.title}</TableCell>
                  <TableCell className="max-w-48 truncate text-xs">{v.youtube_url}</TableCell>
                  <TableCell>{v.is_visible ? t('admin.common.yes') : t('admin.common.no')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('admin.common.delete')}?</AlertDialogTitle><AlertDialogDescription>{t('admin.common.deleteConfirmation')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(v.id)}>{t('admin.common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!videos || videos.length === 0) && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t('admin.common.noResults')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader><DialogTitle className="font-mono">{editing?.id ? t('admin.common.edit') : t('admin.common.add')} - {t('admin.videos.title')}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <LanguageTabs active={formLang} onChange={setFormLang} />
              {formLang === 'en' ? (
                <Input placeholder={t('admin.videos.fields.title')} value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              ) : (
                <Input placeholder={t('admin.videos.fields.title')} value={editing.translations?.uk?.title || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), title: e.target.value } } })} />
              )}
              <Input placeholder={t('admin.videos.fields.youtubeUrl')} value={editing.youtube_url || ''} onChange={e => setEditing({ ...editing, youtube_url: e.target.value })} />
              {formLang === 'en' ? (
                <Textarea placeholder={t('admin.videos.fields.description')} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
              ) : (
                <Textarea placeholder={t('admin.videos.fields.description')} value={editing.translations?.uk?.description || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), description: e.target.value } } })} rows={3} />
              )}
              <Input type="number" placeholder={t('admin.videos.fields.sortOrder')} value={editing.sort_order ?? 0} onChange={e => setEditing({ ...editing, sort_order: +e.target.value })} />
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_visible ?? true} onCheckedChange={v => setEditing({ ...editing, is_visible: v })} />
                <span className="text-sm">{t('admin.videos.fields.visible')}</span>
              </div>
              <Button onClick={handleSave} className="w-full font-mono">{t('admin.common.save')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
