import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024

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

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${folder}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return null
    }

    const { data } = supabase.storage.from('media').getPublicUrl(fileName)
    setUploading(false)
    return data.publicUrl
  }

  async function remove(url: string): Promise<boolean> {
    const path = extractPath(url)
    if (!path) return false

    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove([path])

    if (deleteError) {
      setError(deleteError.message)
      return false
    }
    return true
  }

  return { upload, remove, uploading, error }
}

function extractPath(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/)
  return match ? match[1] : null
}
