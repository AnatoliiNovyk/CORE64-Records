import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSiteContent, useUpsertMutation, useDeleteMutation } from '@/hooks/use-data'
import { useFileUpload } from '@/hooks/use-file-upload'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { LanguageTabs } from '@/components/admin/language-tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { SiteContent } from '@/types/database'

interface ContentItemProps {
  item: SiteContent
  onSave: (item: SiteContent, valueEn: string | undefined, valueUk: string | undefined, file: File | null) => void
  onDelete?: (id: string) => void
  saving: boolean
}

function ContentItem({ item, onSave, onDelete, saving }: ContentItemProps) {
  const { t } = useTranslation()
  const [lang, setLang] = useState<'en' | 'uk'>('en')
  const [valueEn, setValueEn] = useState(item.value || '')
  const [valueUk, setValueUk] = useState(item.value_uk || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setValueEn(item.value || '')
    setValueUk(item.value_uk || '')
    setDirty(false)
  }, [item.value, item.value_uk, item.id])

  const handleEnChange = useCallback((val: string) => {
    setValueEn(val)
    setDirty(true)
  }, [])

  const handleUkChange = useCallback((val: string) => {
    setValueUk(val)
    setDirty(true)
  }, [])

  const handleImageChange = useCallback((file: File | null) => {
    setImageFile(file)
    if (file) setDirty(true)
  }, [])

  const handleSave = () => {
    if (!dirty) return
    const enChanged = valueEn !== item.value ? valueEn : undefined
    const ukChanged = valueUk !== (item.value_uk || '') ? valueUk : undefined
    onSave(item, enChanged, ukChanged, imageFile)
    setDirty(false)
    setImageFile(null)
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-background/50 p-4 sm:flex-row sm:items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground">{item.section_key}</span>
          <Badge variant="secondary" className="text-[10px]">{item.content_type}</Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
        {item.content_type === 'image' ? (
          <div className="mt-2">
            <FileUpload value={item.value} onChange={handleImageChange} />
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <LanguageTabs active={lang} onChange={setLang} />
            {lang === 'en' ? (
              <Textarea
                value={valueEn}
                onChange={e => handleEnChange(e.target.value)}
                rows={2}
                placeholder="English text..."
                className="bg-secondary/60 text-sm font-sans"
              />
            ) : (
              <Textarea
                value={valueUk}
                onChange={e => handleUkChange(e.target.value)}
                rows={2}
                placeholder="Український текст..."
                className="bg-secondary/60 text-sm font-sans"
              />
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 self-end sm:self-start">
        <Button
          size="sm"
          variant={dirty ? "default" : "outline"}
          onClick={handleSave}
          disabled={!dirty || saving}
          className="font-mono text-xs"
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {t('admin.common.save')}
        </Button>
        {item.id && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('admin.common.delete')}?</AlertDialogTitle>
                <AlertDialogDescription>{t('admin.common.deleteConfirmation')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(item.id)}>{t('admin.common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

const DEFAULT_CONTENT_DEFINITIONS: Array<{
  section_key: string
  content_type: 'text' | 'image' | 'html'
  value: string
  value_uk: string
  label: string
  sort_order: number
}> = [
  { section_key: 'site_logo_text', content_type: 'text', value: 'CORE64', value_uk: 'CORE64', label: 'Site Logo Text', sort_order: 1 },
  { section_key: 'home_hero_title', content_type: 'text', value: 'CORE64 RECORDS', value_uk: 'CORE64 RECORDS', label: 'Hero Title', sort_order: 2 },
  { section_key: 'home_hero_subtitle', content_type: 'text', value: 'Neurofunk & Drum and Bass Record Label', value_uk: 'Нейрофанк та Драм-н-бейс Лейбл', label: 'Hero Subtitle', sort_order: 3 },
  { section_key: 'home_hero_tagline', content_type: 'text', value: 'Underground Sound, Elevated.', value_uk: 'Підземний Звук, Піднесений.', label: 'Hero Tagline', sort_order: 4 },
  { section_key: 'about_title', content_type: 'text', value: 'About the Label', value_uk: 'Про Лейбл', label: 'About Title', sort_order: 5 },
  { section_key: 'about_text', content_type: 'text', value: 'CORE64 Records is a neurofunk and drum and bass record label dedicated to pushing the boundaries of electronic music.', value_uk: 'CORE64 Records — нейрофанк та драм-н-бейс лейбл, що прагне розширити кордони електронної музики.', label: 'About Text', sort_order: 6 },
  { section_key: 'about_mission', content_type: 'text', value: 'Our mission is to discover, develop, and deliver the most innovative sounds in underground electronic music.', value_uk: 'Наша місія — відкривати, розвивати та представляти найінноваційніші звуки підземної електронної музики.', label: 'About Mission', sort_order: 7 },
  { section_key: 'releases_title', content_type: 'text', value: 'Releases', value_uk: 'Релізи', label: 'Releases Section Title', sort_order: 8 },
  { section_key: 'producers_title', content_type: 'text', value: 'Producers', value_uk: 'Продюсери', label: 'Producers Section Title', sort_order: 9 },
  { section_key: 'events_title', content_type: 'text', value: 'Events', value_uk: 'Події', label: 'Events Section Title', sort_order: 10 },
  { section_key: 'video_title', content_type: 'text', value: 'Videos', value_uk: 'Відео', label: 'Video Section Title', sort_order: 11 },
  { section_key: 'photo_title', content_type: 'text', value: 'Photos', value_uk: 'Фото', label: 'Photo Section Title', sort_order: 12 },
  { section_key: 'partners_title', content_type: 'text', value: 'Partners & Friends', value_uk: 'Партнери та Друзі', label: 'Partners Section Title', sort_order: 13 },
  { section_key: 'contact_title', content_type: 'text', value: 'Get in Touch', value_uk: 'Зв\'яжіться з нами', label: 'Contact Section Title', sort_order: 14 },
  { section_key: 'contact_description', content_type: 'text', value: 'For bookings, demos, press, or general inquiries, drop us a message below.', value_uk: 'Для букингів, демо, преси або загальних запитів, залиште нам повідомлення нижче.', label: 'Contact Section Description', sort_order: 15 },
  { section_key: 'footer_rights', content_type: 'text', value: '© 2026 CORE64 Records. All rights reserved.', value_uk: '© 2026 CORE64 Records. Усі права захищені.', label: 'Footer Copyright Text', sort_order: 16 },
  { section_key: 'footer_genres', content_type: 'text', value: 'Producers / Releases / Events / Video', value_uk: 'Продюсери / Релізи / Події / Відео', label: 'Footer Quick Links (e.g. Producers / Releases / Events / Video)', sort_order: 17 },
]

export default function AdminContent() {
  const { t } = useTranslation()
  const { data: content, isLoading } = useSiteContent()
  const upsert = useUpsertMutation('site_content', 'site_content')
  const deleteMut = useDeleteMutation('site_content', 'site_content')
  const { upload, uploading } = useFileUpload('content')
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newValueEn, setNewValueEn] = useState('')
  const [newValueUk, setNewValueUk] = useState('')
  const [newType, setNewType] = useState('text')
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newLanguage, setNewLanguage] = useState<'en' | 'uk'>('en')

  const handleItemSave = async (item: SiteContent, valueEn: string | undefined, valueUk: string | undefined, file: File | null) => {
    let uploadedUrl: string | undefined
    if (file) {
      const url = await upload(file)
      if (!url) { toast.error(t('toast.uploadFailed')); return }
      uploadedUrl = url
    }

    try {
      const updateData: Record<string, unknown> = {
        section_key: item.section_key,
        content_type: item.content_type,
        label: item.label,
        sort_order: item.sort_order,
      }
      if (item.id) updateData.id = item.id
      if (uploadedUrl) {
        updateData.value = uploadedUrl
        updateData.value_uk = uploadedUrl
      } else {
        updateData.value = valueEn !== undefined ? valueEn : (item.value || '')
        updateData.value_uk = valueUk !== undefined ? valueUk : (item.value_uk || '')
      }
      await upsert.mutateAsync(updateData)
      toast.success(`${t('toast.saved')}: ${item.label || item.section_key}`)
    } catch (err) {
      toast.error((err as Error)?.message || t('toast.saveFailed'))
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id)
      toast.success(t('toast.deleted'))
    } catch (err) {
      toast.error((err as Error)?.message || t('toast.deleteFailed'))
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
    } catch (err) {
      toast.error((err as Error)?.message || t('toast.saveFailed'))
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

  // 1. Initialize with defaults Map
  const contentMap = new Map<string, SiteContent>()
  DEFAULT_CONTENT_DEFINITIONS.forEach(def => {
    contentMap.set(def.section_key, {
      id: '',
      section_key: def.section_key,
      content_type: def.content_type,
      value: def.value,
      value_uk: def.value_uk,
      label: def.label,
      sort_order: def.sort_order,
      created_at: '',
      updated_at: '',
    })
  })

  // 2. Overwrite with database items (so DB items with real id & values take precedence)
  content?.forEach(item => {
    contentMap.set(item.section_key, item)
  })

  const mergedContent = Array.from(contentMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const sections = new Map<string, SiteContent[]>()
  mergedContent.forEach(item => {
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
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t('admin.content.contentTypes.text')}</SelectItem>
                  <SelectItem value="image">{t('admin.content.contentTypes.image')}</SelectItem>
                  <SelectItem value="html">{t('admin.content.contentTypes.html')}</SelectItem>
                </SelectContent>
              </Select>
              {newType === 'image' ? (
                <FileUpload value={null} onChange={setNewImageFile} />
              ) : (
                <div className="space-y-3">
                  <LanguageTabs active={newLanguage} onChange={setNewLanguage} />
                  {newLanguage === 'en' ? (
                    <Textarea
                      placeholder={t('admin.content.value')}
                      value={newValueEn}
                      onChange={e => setNewValueEn(e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <Textarea
                      placeholder={t('admin.content.value')}
                      value={newValueUk}
                      onChange={e => setNewValueUk(e.target.value)}
                      rows={3}
                    />
                  )}
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
              {items.map(item => (
                <ContentItem
                  key={item.id || item.section_key}
                  item={item}
                  onSave={handleItemSave}
                  onDelete={handleDeleteItem}
                  saving={uploading}
                />
              ))}
            </CardContent>
          </Card>
        ))}
        {(!mergedContent || mergedContent.length === 0) && (
          <p className="text-center text-muted-foreground">{t('admin.common.noResults')}</p>
        )}
      </div>
    </div>
  )
}
