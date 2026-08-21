import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminPhotos, useUpsertMutation, useDeleteMutation } from '@/hooks/use-data'
import { useFileUpload } from '@/hooks/use-file-upload'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { FileUpload } from '@/components/ui/file-upload'
import { LanguageTabs } from '@/components/admin/language-tabs'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Photo } from '@/types/database'

export default function AdminPhotos() {
  const { t } = useTranslation()
  const { data: photos, isLoading } = useAdminPhotos()
  const upsert = useUpsertMutation<Record<string, unknown>>('photos', 'admin_photos')
  const deleteMut = useDeleteMutation('photos', 'admin_photos')
  const { upload, uploading } = useFileUpload('photos')
  const [editing, setEditing] = useState<Partial<Photo> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formLang, setFormLang] = useState<'en' | 'uk'>('en')

  const openNew = () => { setEditing({ title: '', image_url: '', caption: '', category: 'general', sort_order: 0, is_visible: true, translations: {} }); setImageFile(null); setDialogOpen(true) }
  const openEdit = (p: Photo) => { setEditing({ ...p }); setImageFile(null); setDialogOpen(true) }

  const handleSave = async () => {
    if (!editing?.image_url && !imageFile) { toast.error(t('admin.photos.validation.required')); return }
    let imageUrl = editing?.image_url || ''
    if (imageFile) {
      const url = await upload(imageFile)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      imageUrl = url
    }
    try {
      await upsert.mutateAsync({ ...editing, image_url: imageUrl } as Record<string, unknown>)
      toast.success(t('toast.saved'))
      setDialogOpen(false)
    } catch (err) {
      toast.error((err as Error)?.message || t('toast.saveFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    try { await deleteMut.mutateAsync(id); toast.success(t('toast.deleted')) } catch { toast.error(t('toast.deleteFailed')) }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.photos.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.photos.description')}</p>
        </div>
        <Button size="sm" onClick={openNew} className="font-mono"><Plus className="mr-2 h-4 w-4" /> {t('admin.photos.addNew')}</Button>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-md" />)}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos?.map(p => (
            <div key={p.id} className="group relative overflow-hidden rounded-md border border-border">
              <img src={p.image_url} alt={p.title || ''} className="aspect-square w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-card/80 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('admin.common.delete')}?</AlertDialogTitle><AlertDialogDescription>{t('admin.common.deleteConfirmation')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)}>{t('admin.common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
              </div>
              {!p.is_visible && <div className="absolute top-1 left-1 rounded bg-destructive/80 px-1 text-[10px] text-destructive-foreground">{t('admin.common.hidden')}</div>}
            </div>
          ))}
          {(!photos || photos.length === 0) && <p className="col-span-full text-center text-muted-foreground">{t('admin.common.noResults')}</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader><DialogTitle className="font-mono">{editing?.id ? t('admin.common.edit') : t('admin.common.add')} - {t('admin.photos.title')}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <LanguageTabs active={formLang} onChange={setFormLang} />
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('admin.photos.fields.image')}</label>
                <FileUpload value={editing.image_url} onChange={setImageFile} />
              </div>
              {formLang === 'en' ? (
                <Input placeholder={t('admin.photos.fields.title')} value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              ) : (
                <Input placeholder={t('admin.photos.fields.title')} value={editing.translations?.uk?.title || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), title: e.target.value } } })} />
              )}
              {formLang === 'en' ? (
                <Input placeholder={t('admin.photos.fields.caption')} value={editing.caption || ''} onChange={e => setEditing({ ...editing, caption: e.target.value })} />
              ) : (
                <Input placeholder={t('admin.photos.fields.caption')} value={editing.translations?.uk?.caption || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), caption: e.target.value } } })} />
              )}
              <Input placeholder={t('admin.photos.fields.category')} value={editing.category || 'general'} onChange={e => setEditing({ ...editing, category: e.target.value })} />
              <Input type="number" placeholder={t('admin.photos.fields.sortOrder')} value={editing.sort_order ?? 0} onChange={e => setEditing({ ...editing, sort_order: +e.target.value })} />
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_visible ?? true} onCheckedChange={v => setEditing({ ...editing, is_visible: v })} />
                <span className="text-sm">{t('admin.photos.fields.visible')}</span>
              </div>
              <Button onClick={handleSave} disabled={uploading} className="w-full font-mono">{uploading ? t('admin.common.saving') : t('admin.common.save')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
