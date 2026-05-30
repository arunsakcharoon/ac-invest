import { NextRequest } from 'next/server'

export function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('authorization')
  return secret === `Bearer ${process.env.CRON_SECRET}`
}

export function verifyAdminKey(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.ADMIN_API_KEY}`
}
