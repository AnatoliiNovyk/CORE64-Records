import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useContentValue, useSettingValue } from '@/hooks/use-data'

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

function useContactSchema() {
  const { t } = useTranslation()
  return z.object({
    name: z.string().min(2, t('contact.validation.nameMin')),
    email: z.string().email(t('contact.validation.emailRequired')),
    subject: z.string().optional(),
    message: z.string().min(10, t('contact.validation.messageMin')),
  })
}

type ContactForm = {
  name: string
  email: string
  subject?: string
  message: string
}

type ModalState = { open: false } | { open: true; success: boolean; message: string }

export default function ContactSection() {
  const { t } = useTranslation()
  const title = useContentValue('contact_title', t('contact.title'))
  const description = useContentValue('contact_description', t('contact.description'))
  const { data: recaptchaSiteKey } = useSettingValue('recaptcha_site_key')
  const contactSchema = useContactSchema()
  const [modal, setModal] = useState<ModalState>({ open: false })
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Inject reCAPTCHA v3 script when site key is available
  useEffect(() => {
    if (!recaptchaSiteKey) return
    if (document.getElementById('recaptcha-script')) return

    const script = document.createElement('script')
    script.id = 'recaptcha-script'
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`
    script.async = true
    document.head.appendChild(script)
    scriptRef.current = script

    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current)
      }
    }
  }, [recaptchaSiteKey])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    let recaptchaToken = ''

    if (recaptchaSiteKey) {
      try {
        await new Promise<void>((resolve) => window.grecaptcha.ready(resolve))
        recaptchaToken = await window.grecaptcha.execute(recaptchaSiteKey, { action: 'contact' })
      } catch {
        setModal({ open: true, success: false, message: t('contact.recaptchaError') })
        return
      }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      setModal({ open: true, success: false, message: t('config.body') })
      return
    }

    // Submissions always go through the edge function: it owns rate limiting,
    // reCAPTCHA verification and length validation. There is deliberately no
    // direct-insert fallback, which would bypass all three.
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/submit-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject || null,
          message: data.message,
          recaptcha_token: recaptchaToken,
        }),
      })

      if (response.ok) {
        setModal({ open: true, success: true, message: t('contact.successModal.body') })
        reset()
        return
      }

      const result = await response.json().catch(() => ({}))
      if (result?.error === 'recaptcha_failed' || result?.error === 'recaptcha_missing') {
        setModal({ open: true, success: false, message: t('contact.recaptchaError') })
        return
      }
      if (result?.error === 'rate_limited' || response.status === 429) {
        setModal({ open: true, success: false, message: t('contact.rateLimited') })
        return
      }
      setModal({ open: true, success: false, message: t('contact.error') })
    } catch {
      setModal({ open: true, success: false, message: t('contact.error') })
    }
  }

  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('contact.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">{description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                placeholder={t('contact.name')}
                className="bg-card"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Input
                placeholder={t('contact.email')}
                type="email"
                className="bg-card"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <Input
              placeholder={t('contact.subject')}
              className="bg-card"
              {...register('subject')}
            />
          </div>
          <div>
            <Textarea
              placeholder={t('contact.message')}
              rows={5}
              className="bg-card resize-none"
              {...register('message')}
            />
            {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-mono"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? t('contact.sending') : t('contact.send')}
          </Button>
        </form>
      </div>

      <Dialog open={modal.open} onOpenChange={(open) => !open && setModal({ open: false })}>
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex justify-center">
              {modal.open && modal.success ? (
                <CheckCircle2 className="h-12 w-12 text-primary" />
              ) : (
                <XCircle className="h-12 w-12 text-destructive" />
              )}
            </div>
            <DialogTitle className="text-center font-mono text-lg">
              {modal.open && modal.success
                ? t('contact.successModal.title')
                : t('contact.errorModal.title')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {modal.open ? modal.message : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setModal({ open: false })} className="font-mono">
              {t('admin.common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
