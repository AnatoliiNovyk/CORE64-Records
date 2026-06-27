import { useTranslation } from 'react-i18next'
import { useAdminReleases, useAdminProducers, useAdminMessages, useAdminEvents } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Disc3, Users, Mail, CalendarDays } from 'lucide-react'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { data: releases } = useAdminReleases()
  const { data: producers } = useAdminProducers()
  const { data: messages } = useAdminMessages()
  const { data: events } = useAdminEvents()

  const unreadMessages = messages?.filter(m => !m.is_read).length ?? 0

  const stats = [
    { label: t('admin.dashboard.releases'), value: releases?.length ?? 0, icon: Disc3 },
    { label: t('admin.dashboard.producers'), value: producers?.length ?? 0, icon: Users },
    { label: `${t('admin.dashboard.messages')} (${t('admin.dashboard.unread')})`, value: unreadMessages, icon: Mail },
    { label: t('admin.dashboard.events'), value: events?.length ?? 0, icon: CalendarDays },
  ]

  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.dashboard.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('admin.dashboard.description')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
