import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminMessages, useUpsertMutation, useDeleteMutation } from '@/hooks/use-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Eye, Mail, MailOpen } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale/uk'
import { enUS } from 'date-fns/locale/en-US'
import type { ContactMessage } from '@/types/database'

export default function AdminMessages() {
  const { t, i18n } = useTranslation()
  const { data: messages, isLoading } = useAdminMessages()
  const upsert = useUpsertMutation<Record<string, unknown>>('contact_messages', 'admin_messages')
  const deleteMut = useDeleteMutation('contact_messages', 'admin_messages')
  const [viewing, setViewing] = useState<ContactMessage | null>(null)
  const dateLocale = i18n.language === 'uk' ? uk : enUS

  const toggleRead = async (msg: ContactMessage) => {
    try {
      await upsert.mutateAsync({ id: msg.id, is_read: !msg.is_read })
      toast.success(msg.is_read ? t('toast.markedUnread') : t('toast.markedRead'))
    } catch (err) {
      toast.error((err as Error)?.message || t('toast.saveFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id)
      toast.success(t('toast.deleted'))
    } catch (err) {
      toast.error((err as Error)?.message || t('toast.deleteFailed'))
    }
  }

  const unreadCount = messages?.filter(m => !m.is_read).length ?? 0

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.messages.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('admin.messages.description')} {unreadCount > 0 && <Badge className="ml-2">{unreadCount} {t('admin.dashboard.unread')}</Badge>}
          </p>
        </div>
      </div>

      {isLoading ? <Skeleton className="mt-6 h-48 rounded-lg" /> : (
        <div className="mt-6 rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.messages.status')}</TableHead>
                <TableHead>{t('admin.messages.from')}</TableHead>
                <TableHead>{t('contact.email')}</TableHead>
                <TableHead>{t('admin.messages.subject')}</TableHead>
                <TableHead>{t('admin.events.fields.date')}</TableHead>
                <TableHead className="w-32">{t('admin.content.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages?.map(m => (
                <TableRow key={m.id} className={!m.is_read ? 'bg-primary/5' : ''}>
                  <TableCell>{m.is_read ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-xs">{m.email}</TableCell>
                  <TableCell className="max-w-32 truncate text-xs">{m.subject || t('admin.messages.noSubject')}</TableCell>
                  <TableCell className="font-mono text-xs">{format(new Date(m.created_at), 'dd MMM yyyy', { locale: dateLocale })}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setViewing(m); if (!m.is_read) toggleRead(m) }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => toggleRead(m)}>
                        {m.is_read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('admin.common.delete')}?</AlertDialogTitle><AlertDialogDescription>{t('admin.common.deleteConfirmation')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(m.id)}>{t('admin.common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!messages || messages.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('admin.messages.empty')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader><DialogTitle className="font-mono">{t('admin.messages.title')}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{viewing.name}</span>
                <span className="text-xs text-muted-foreground">{viewing.email}</span>
              </div>
              {viewing.subject && <p className="text-sm font-medium">{viewing.subject}</p>}
              <p className="whitespace-pre-wrap rounded-md bg-secondary p-3 text-sm">{viewing.message}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(viewing.created_at), 'dd MMM yyyy, HH:mm', { locale: dateLocale })}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
