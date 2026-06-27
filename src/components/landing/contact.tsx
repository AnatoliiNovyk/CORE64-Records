import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useSubmitContact, useContentValue } from '@/hooks/use-data'

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

export default function ContactSection() {
  const { t } = useTranslation()
  const title = useContentValue('contact_title', t('contact.title'))
  const description = useContentValue('contact_description', t('contact.description'))
  const submitContact = useSubmitContact()
  const contactSchema = useContactSchema()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    try {
      await submitContact.mutateAsync({
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        message: data.message,
      })
      toast.success(t('contact.success'))
      reset()
    } catch {
      toast.error(t('contact.error'))
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
    </section>
  )
}
