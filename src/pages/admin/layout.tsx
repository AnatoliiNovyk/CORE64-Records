import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate, Link, useLocation } from 'react-router'
import {
  LayoutDashboard,
  FileText,
  Disc3,
  Users,
  Video,
  Image,
  CalendarDays,
  Handshake,
  Mail,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { LanguageSwitcher } from '@/components/language-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

const NAV_KEYS = [
  { path: '/admin', key: 'dashboard', icon: LayoutDashboard },
  { path: '/admin/content', key: 'content', icon: FileText },
  { path: '/admin/releases', key: 'releases', icon: Disc3 },
  { path: '/admin/producers', key: 'producers', icon: Users },
  { path: '/admin/videos', key: 'videos', icon: Video },
  { path: '/admin/photos', key: 'photos', icon: Image },
  { path: '/admin/events', key: 'events', icon: CalendarDays },
  { path: '/admin/partners', key: 'partners', icon: Handshake },
  { path: '/admin/messages', key: 'messages', icon: Mail },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="p-4">
            <Link to="/admin" className="font-mono text-lg font-bold text-primary neon-text">
              {t('admin.brand')}
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t('admin.nav.management')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_KEYS.map(item => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.path}>
                        <Link to={item.path}>
                          <item.icon className="h-4 w-4" />
                          <span>{t(`admin.nav.${item.key}`)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {t('admin.nav.backToSite')}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              {t('admin.nav.logout')}
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <span className="ml-3 font-mono text-sm text-muted-foreground">{t('admin.header')}</span>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
