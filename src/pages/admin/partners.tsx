import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminPartners, useUpsertMutation, useDeleteMutation } from '@/hooks/use-data'
import { useFileUpload } from '@/hooks/use-file-upload'
import { Input } from '@/components/ui/input'
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
import type { Partner } from '@/types/database'

export default function AdminPartners() {
  const { t } = useTranslation()
  const { data: partners, isLoading } = useAdminPartners()
  const upsert = useUpsertMutation<Record<string, unknown>>('partners', 'admin_partners')
  const deleteMut = useDeleteMutation('partners', 'admin_partners')
  const { upload, uploading } = useFileUpload('partners')
  const [editing, setEditing] = useState<Partial<Partner> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [formLang, setFormLang] = useState<'en' | 'uk'>('en')

  const openNew = () => { setEditing({ name: '', logo_url: '', website_url: '', category: 'partner', sort_order: 0, is_visible: true, translations: {} }); setLogoFile(null); setDialogOpen(true) }
  const openEdit = (p: Partner) => { setEditing({ ...p }); setLogoFile(null); setDialogOpen(true) }

  const handleSave = async () => {
    if (!editing?.name) { toast.error(t('admin.partners.validation.required')); return }
    let logoUrl = editing.logo_url || ''
    if (logoFile) {
      const url = await upload(logoFile)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      logoUrl = url
    }
    try {
      await upsert.mutateAsync({ ...editing, logo_url: logoUrl } as Record<string, unknown>)
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
          <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.partners.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.partners.description')}</p>
        </div>
        <Button size="sm" onClick={openNew} className="font-mono"><Plus className="mr-2 h-4 w-4" /> {t('admin.partners.addNew')}</Button>
      </div>

      {isLoading ? <Skeleton className="mt-6 h-48 rounded-lg" /> : (
        <div className="mt-6 rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.partners.fields.name')}</TableHead>
                <TableHead>{t('admin.partners.fields.category')}</TableHead>
                <TableHead>{t('admin.partners.fields.websiteUrl')}</TableHead>
                <TableHead>{t('admin.partners.fields.visible')}</TableHead>
                <TableHead className="w-24">{t('admin.content.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners?.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="secondary">{t(`admin.partners.categories.${p.category}`)}</Badge></TableCell>
                  <TableCell className="max-w-36 truncate text-xs">{p.website_url}</TableCell>
                  <TableCell>{p.is_visible ? t('admin.common.yes') : t('admin.common.no')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('admin.common.delete')}?</AlertDialogTitle><AlertDialogDescription>{t('admin.common.deleteConfirmation')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)}>{t('admin.common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!partners || partners.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('admin.common.noResults')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader><DialogTitle className="font-mono">{editing?.id ? t('admin.common.edit') : t('admin.common.add')} - {t('admin.partners.title')}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <LanguageTabs active={formLang} onChange={setFormLang} />
              {formLang === 'en' ? (
                <Input placeholder={t('admin.partners.fields.name')} value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              ) : (
                <Input placeholder={t('admin.partners.fields.name')} value={editing.translations?.uk?.name || ''} onChange={e => setEditing({ ...editing, translations: { ...(editing.translations || {}), uk: { ...(editing.translations?.uk || {}), name: e.target.value } } })} />
              )}
              <Select value={editing.category || 'partner'} onValueChange={v => setEditing({ ...editing, category: v as Partner['category'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friend">{t('admin.partners.categories.friend')}</SelectItem>
                  <SelectItem value="partner">{t('admin.partners.categories.partner')}</SelectItem>
                  <SelectItem value="sponsor">{t('admin.partners.categories.sponsor')}</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('admin.partners.fields.logo')}</label>
                <FileUpload value={editing.logo_url} onChange={setLogoFile} />
              </div>
              <Input placeholder={t('admin.partners.fields.websiteUrl')} value={editing.website_url || ''} onChange={e => setEditing({ ...editing, website_url: e.target.value })} />
              <Input type="number" placeholder={t('admin.partners.fields.sortOrder')} value={editing.sort_order ?? 0} onChange={e => setEditing({ ...editing, sort_order: +e.target.value })} />
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_visible ?? true} onCheckedChange={v => setEditing({ ...editing, is_visible: v })} />
                <span className="text-sm">{t('admin.partners.fields.visible')}</span>
              </div>
              <Button onClick={handleSave} disabled={uploading} className="w-full font-mono">{uploading ? t('admin.common.saving') : t('admin.common.save')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
