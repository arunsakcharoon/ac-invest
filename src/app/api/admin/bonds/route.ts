import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminKey } from '@/lib/api-auth'
import { writeBlob } from '@/lib/data-store'
import type { BondIPO } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!verifyAdminKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bonds: BondIPO[] = await req.json()
  const url = await writeBlob('bonds.json', bonds)
  return NextResponse.json({ ok: true, url })
}
