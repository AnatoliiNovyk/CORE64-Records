import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings, useUpsertSetting } from '@/hooks/use-data'

const settingsSchema = z.object({
  recaptcha_site_key: z.string(),
  recaptcha_secret_key: z.string(),
})

type SettingsForm = z.infer<typeof settingsSchema>

export default function AdminSettings() {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useSettings()
  const upsertSetting = useUpsertSetting()
  const [showSecret, setShowSecret] = useState(false)

  const getValue = (key: string) =>
    settings?.find((s) => s.key === key)?.value ?? ''

  const { control, handleSubmit, formState: { isSubmitting, isDirty } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: {
      recaptcha_site_key: getValue('recaptcha_site_key'),
      recaptcha_secret_key: getValue('recaptcha_secret_key'),
    },
  })

  const onSubmit = async (data: SettingsForm) => {
    try {
      await Promise.all([
        upsertSetting.mutateAsync({ key: 'recaptcha_site_key', value: data.recaptcha_site_key }),
        upsertSetting.mutateAsync({ key: 'recaptcha_secret_key', value: data.recaptcha_secret_key }),
      ])
      toast.success(t('toast.saved'))
    } catch {
      toast.error(t('toast.saveFailed'))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-foreground">{t('admin.settings.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.settings.description')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-primary">
              {t('admin.settings.recaptchaSection')}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t('admin.settings.recaptchaDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Controller
              name="recaptcha_site_key"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="recaptcha_site_key" className="text-sm font-medium">
                    {t('admin.settings.siteKey')}
                  </Label>
                  <Input
                    id="recaptcha_site_key"
                    placeholder={t('admin.settings.siteKeyPlaceholder')}
                    className="bg-secondary font-mono text-sm"
                    {...field}
                  />
                </div>
              )}
            />

            <Controller
              name="recaptcha_secret_key"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="recaptcha_secret_key" className="text-sm font-medium">
                    {t('admin.settings.secretKey')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="recaptcha_secret_key"
                      type={showSecret ? 'text' : 'password'}
                      placeholder={t('admin.settings.secretKeyPlaceholder')}
                      className="bg-secondary pr-10 font-mono text-sm"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showSecret ? t('admin.settings.hideSecret') : t('admin.settings.showSecret')}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="font-mono"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? t('admin.common.saving') : t('admin.common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
