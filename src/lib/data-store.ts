import { put } from '@vercel/blob'

const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? ''

export async function readBlob<T>(filename: string): Promise<T | null> {
  try {
    const url = `${BLOB_BASE_URL}/${filename}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export async function writeBlob(filename: string, data: unknown): Promise<string> {
  const blob = await put(filename, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
  return blob.url
}
