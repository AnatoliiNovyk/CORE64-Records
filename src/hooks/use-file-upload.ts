import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isR2Configured, uploadToR2, deleteFromR2 } from '@/lib/r2'

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB for audio tracks / high-res media

export function useFileUpload(folder: string, maxFileSize?: number) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File): Promise<string | null> {
    const limit = maxFileSize ?? DEFAULT_MAX_FILE_SIZE
    if (file.size > limit) {
      setError('fileTooLarge')
      return null
    }

    setUploading(true)
    setError(null)

    // 1. Upload to Supabase Storage
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${folder}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, { contentType: file.type || 'application/octet-stream', upsert: true })

      if (!uploadError) {
        const { data } = supabase.storage.from('media').getPublicUrl(fileName)
        setUploading(false)
        return data.publicUrl
      }
      console.warn('Supabase storage upload returned error, trying R2:', uploadError)
    } catch (err) {
      console.warn('Supabase storage upload exception:', err)
    }

    // 2. Fallback to Cloudflare R2 if configured
    if (isR2Configured) {
      try {
        const publicUrl = await uploadToR2(file, folder)
        setUploading(false)
        return publicUrl
      } catch (r2Error) {
        console.error('R2 upload failed:', r2Error)
      }
    }

    setError('Upload failed')
    setUploading(false)
    return null
  }

  async function remove(url: string): Promise<boolean> {
    if (!url) return false

    // If it's a Supabase storage URL
    const path = extractPath(url)
    if (path) {
      const { error: deleteError } = await supabase.storage
        .from('media')
        .remove([path])
      if (!deleteError) return true
    }

    // If it's an R2 URL
    if (isR2Configured) {
      const r2Deleted = await deleteFromR2(url)
      if (r2Deleted) return true
    }

    return false
  }

  return { upload, remove, uploading, error }
}

export function extractPath(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/)
  return match ? match[1] : null
}
