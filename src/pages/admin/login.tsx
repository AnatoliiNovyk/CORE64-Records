import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAuth } from '@/lib/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AdminLogin() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(t('admin.login.error'))
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="font-mono text-xl text-primary neon-text">{t('admin.login.title')}</CardTitle>
          <CardDescription>{t('admin.login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder={t('admin.login.email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-secondary"
            />
            <Input
              type="password"
              placeholder={t('admin.login.password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-secondary"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full font-mono">
              {loading ? t('admin.login.loading') : t('admin.login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
