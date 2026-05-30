import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | AC Invest',
    default: 'AC Invest',
  },
  description: 'ข้อมูลการลงทุนสำหรับนักลงทุนไทย — อัตราปันผล SET50 พอร์ตโฟลิโอ และข่าว',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AC Invest',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
