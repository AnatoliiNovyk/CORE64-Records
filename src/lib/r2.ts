import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const accountId = import.meta.env.VITE_R2_ACCOUNT_ID
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY
const bucketName = import.meta.env.VITE_R2_BUCKET_NAME || 'core64bk'
const publicUrl = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '')

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && publicUrl
)

let s3ClientInstance: S3Client | null = null

function getR2Client(): S3Client | null {
  if (!isR2Configured) return null
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  }
  return s3ClientInstance
}

export async function uploadToR2(file: File, folder: string): Promise<string | null> {
  const client = getR2Client()
  if (!client || !publicUrl) {
    throw new Error('Cloudflare R2 is not configured properly.')
  }

  const ext = file.name.split('.').pop() || 'bin'
  const key = `${folder}/${crypto.randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: file.type || 'application/octet-stream',
  })

  await client.send(command)
  return `${publicUrl}/${key}`
}

export async function deleteFromR2(url: string): Promise<boolean> {
  const client = getR2Client()
  if (!client || !publicUrl) return false

  if (!url.startsWith(publicUrl)) return false
  const key = url.replace(`${publicUrl}/`, '')
  if (!key) return false

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    await client.send(command)
    return true
  } catch (err) {
    console.error('Failed to delete object from R2:', err)
    return false
  }
}
