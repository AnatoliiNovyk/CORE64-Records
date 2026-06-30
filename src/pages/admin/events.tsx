import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminEvents, useUpsertMutation, useDeleteMutation } from '@/hooks/use-data'
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
import { LanguageTabs } from '@/components/admin/language-tabs'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Event } from '@/types/database'

export default function AdminEvents() {
  const { t } = useTranslation()
  const { data: events, isLoading } = useAdminEvents()
  const upsert = useUpsertMutation<Record<string, unknown>>('events', 'admin_events')
  const deleteMut = useDeleteMutation('events', 'admin_events')
  const { upload, uploading } = useFileUpload('events')
  const [editing, setEditing] = useState<Partial<Event> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [lineupInput, setLineupInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formLang, setFormLang] = useState<'en' | 'uk'>('en')

  const openNew = () => {
    setEditing({ title: '', date: '', venue: '', city: '', description: '', image_url: '', ticket_link: '', lineup: [], is_visible: true, translations: {} })
    setLineupInput('')
    setImageFile(null)
    setFormLang('en')
    setDialogOpen(true)
  }
  const openEdit = (e: Event) => {
    setEditing({ ...e })
    setLineupInput(e.lineup?.join(', ') || '')
    setImageFile(null)
    setFormLang('en')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editing?.title || !editing?.date) { toast.error(t('admin.events.validation.required')); return }
    let imageUrl = editing.image_url || ''
    if (imageFile) {
      const url = await upload(imageFile)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      imageUrl = url
    }
    const lineup = lineupInput.split(',').map(s => s.trim()).filter(Boolean)
    try {
      await upsert.mutateAsync({ ...editing, image_url: imageUrl, lineup })
      toast.success(t('toast.saved'))
      setDialogOpen(false)
    } catch {
      toast.error(t('toast.saveFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    try { await deleteMut.mutateAsync(id); toast.success(t('toast.deleted')) } catch { toast.error(t('toast.deleteFailed')) }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.events.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.events.description')}</p>
        </div>
        <Button size="sm" onClick={openNew} className="font-mono"><Plus className="mr-2 h-4 w-4" /> {t('admin.events.addNew')}</Button>
      </div>

      {isLoading ? <Skeleton className="mt-6 h-48 rounded-lg" /> : (
        <div className="mt-6 rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.events.fields.date')}</TableHead>
                <TableHead>{t('admin.events.fields.title')}</TableHead>
                <TableHead>{t('admin.events.fields.venue')}</TableHead>
                <TableHead>{t('admin.events.fields.city')}</TableHead>
                <TableHead>{t('admin.events.fields.visible')}</TableHead>
                <TableHead className="w-24">{t('admin.content.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{format(new Date(e.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>{e.venue}</TableCell>
                  <TableCell>{e.city}</TableCell>
                  <TableCell>{e.is_visible ? t('admin.common.yes') : t('admin.common.no')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('admin.common.delete')}?</AlertDialogTitle><AlertDialogDescription>{t('admin.common.deleteConfirmation')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(e.id)}>{t('admin.common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!events || events.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('admin.common.noResults')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader><DialogTitle className="font-mono">{editing?.id ? t('admin.common.edit') : t('admin.common.add')} - {t('admin.events.title')}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              <LanguageTabs active={formLang} onChange={setFormLang} />
              {formLang === 'en' ? (
                <Input placeholder={t('admin.events.fields.title')} value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              ) : (
                <Input placeholder={t('admin.events.fields.title') + ' (UK)'} value={editing.translations?.uk?.title || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), title: e.target.value } } })} />
              )}
              <Input type="datetime-local" value={editing.date ? editing.date.slice(0, 16) : ''} onChange={e => setEditing({ ...editing, date: e.target.value })} />
              <Input placeholder={t('admin.events.fields.venue')} value={editing.venue || ''} onChange={e => setEditing({ ...editing, venue: e.target.value })} />
              <Input placeholder={t('admin.events.fields.city')} value={editing.city || ''} onChange={e => setEditing({ ...editing, city: e.target.value })} />
              {formLang === 'en' ? (
                <Textarea placeholder={t('admin.events.fields.description')} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
              ) : (
                <Textarea placeholder={t('admin.events.fields.description') + ' (UK)'} value={editing.translations?.uk?.description || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), description: e.target.value } } })} rows={3} />
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('admin.events.fields.image')}</label>
                <FileUpload value={editing.image_url} onChange={setImageFile} />
              </div>
              <Input placeholder={t('admin.events.fields.ticketLink')} value={editing.ticket_link || ''} onChange={e => setEditing({ ...editing, ticket_link: e.target.value })} />
              <Input placeholder={t('admin.events.fields.lineup')} value={lineupInput} onChange={e => setLineupInput(e.target.value)} />
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_visible ?? true} onCheckedChange={v => setEditing({ ...editing, is_visible: v })} />
                <span className="text-sm">{t('admin.events.fields.visible')}</span>
              </div>
              <Button onClick={handleSave} disabled={uploading} className="w-full font-mono">{uploading ? t('admin.common.saving') : t('admin.common.save')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
