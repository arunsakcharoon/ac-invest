import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminKey } from '@/lib/api-auth'
import { writeBlob } from '@/lib/data-store'
import type { DividendRow } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!verifyAdminKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows: DividendRow[] = await req.json()
  const url = await writeBlob('dividends.json', rows)
  return NextResponse.json({ ok: true, url })
}
