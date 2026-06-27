import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSiteContent, useUpsertMutation } from '@/hooks/use-data'
import { useFileUpload } from '@/hooks/use-file-upload'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { LanguageTabs } from '@/components/admin/language-tabs'
import { Save, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function AdminContent() {
  const { t } = useTranslation()
  const { data: content, isLoading } = useSiteContent()
  const upsert = useUpsertMutation('site_content', 'site_content')
  const { upload, uploading } = useFileUpload('content')
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({})
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'uk'>('en')
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newValueEn, setNewValueEn] = useState('')
  const [newValueUk, setNewValueUk] = useState('')
  const [newType, setNewType] = useState('text')
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newLanguage, setNewLanguage] = useState<'en' | 'uk'>('en')

  const handleSave = async (item: { id: string; section_key: string; content_type: string; label: string; sort_order: number; value_uk?: string }) => {
    let value = editValues[`${item.section_key}_en`]
    let value_uk = editValues[`${item.section_key}_uk`]
    const file = imageFiles[item.section_key]

    if (file) {
      const url = await upload(file)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      value = url
      setImageFiles(prev => ({ ...prev, [item.section_key]: null }))
    }

    if (value === undefined && value_uk === undefined && !file) return
    try {
      const updateData: Record<string, any> = { ...item }
      if (value !== undefined) updateData.value = value
      if (value_uk !== undefined) updateData.value_uk = value_uk
      if (file) delete updateData.value_uk

      await upsert.mutateAsync(updateData)
      toast.success(`${t('toast.saved')}: ${item.label || item.section_key}`)
      setEditValues(prev => {
        const next = { ...prev }
        delete next[`${item.section_key}_en`]
        delete next[`${item.section_key}_uk`]
        return next
      })
    } catch {
      toast.error(t('toast.saveFailed'))
    }
  }

  const handleAdd = async () => {
    if (!newKey) return
    let value = newValueEn
    let value_uk = newValueUk
    if (newType === 'image' && newImageFile) {
      const url = await upload(newImageFile)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      value = url
      value_uk = url
    }
    try {
      await upsert.mutateAsync({
        section_key: newKey,
        content_type: newType,
        value,
        value_uk: newType === 'image' ? value : value_uk,
        label: newLabel || newKey,
        sort_order: (content?.length ?? 0) + 1,
      })
      toast.success(t('toast.saved'))
      setNewKey('')
      setNewLabel('')
      setNewValueEn('')
      setNewValueUk('')
      setNewImageFile(null)
      setDialogOpen(false)
    } catch {
      toast.error(t('toast.saveFailed'))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    )
  }

  const sections = new Map<string, typeof content>()
  content?.forEach(item => {
    const prefix = item.section_key.split('_')[0]
    if (!sections.has(prefix)) sections.set(prefix, [])
    sections.get(prefix)!.push(item)
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.content.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.content.description')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-mono">
              <Plus className="mr-2 h-4 w-4" /> {t('admin.common.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle className="font-mono">{t('admin.content.editTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder={t('admin.content.sectionKeyPlaceholder')} value={newKey} onChange={e => setNewKey(e.target.value)} />
              <Input placeholder={t('admin.content.labelPlaceholder')} value={newLabel} onChange={e => setNewLabel(e.target.value)} />
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm"
              >
                <option value="text">{t('admin.content.contentTypes.text')}</option>
                <option value="image">{t('admin.content.contentTypes.image')}</option>
                <option value="html">{t('admin.content.contentTypes.html')}</option>
              </select>
              {newType === 'image' ? (
                <FileUpload value={null} onChange={setNewImageFile} />
              ) : (
                <div className="space-y-3">
                  <div>
                    <LanguageTabs active={newLanguage} onChange={setNewLanguage} />
                    {newLanguage === 'en' ? (
                      <Textarea
                        placeholder={t('admin.content.value')}
                        value={newValueEn}
                        onChange={e => setNewValueEn(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    ) : (
                      <Textarea
                        placeholder={t('admin.content.value')}
                        value={newValueUk}
                        onChange={e => setNewValueUk(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              )}
              <Button onClick={handleAdd} disabled={uploading} className="w-full font-mono">
                {uploading ? t('admin.common.saving') : t('admin.common.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 space-y-6">
        {Array.from(sections.entries()).map(([prefix, items]) => (
          <Card key={prefix} className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-primary">
                {prefix}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items?.map(item => (
                <div key={item.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{item.section_key}</span>
                      <Badge variant="secondary" className="text-[10px]">{item.content_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    {item.content_type === 'image' ? (
                      <div className="mt-2">
                        <FileUpload
                          value={item.value}
                          onChange={file => {
                            setImageFiles(prev => ({ ...prev, [item.section_key]: file }))
                            if (file) setEditValues(prev => ({ ...prev, [item.section_key]: '__pending_upload__' }))
                          }}
                        />
                      </div>
                    ) : (
                      <div className="mt-2">
                        <LanguageTabs active={activeLanguage} onChange={setActiveLanguage} />
                        {activeLanguage === 'en' ? (
                          <Textarea
                            defaultValue={item.value}
                            onChange={e => setEditValues(prev => ({ ...prev, [`${item.section_key}_en`]: e.target.value }))}
                            rows={2}
                            className="mt-2 bg-secondary text-sm"
                          />
                        ) : (
                          <Textarea
                            defaultValue={item.value_uk || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, [`${item.section_key}_uk`]: e.target.value }))}
                            rows={2}
                            className="mt-2 bg-secondary text-sm"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSave(item)}
                    disabled={editValues[`${item.section_key}_en`] === undefined && editValues[`${item.section_key}_uk`] === undefined && !imageFiles[item.section_key]}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {(!content || content.length === 0) && (
          <p className="text-center text-muted-foreground">{t('admin.common.noResults')}</p>
        )}
      </div>
    </div>
  )
}
