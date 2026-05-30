import { cn } from '@/lib/utils'

type Props = { frequency: string; label: string }

const colours: Record<string, string> = {
  annual: 'bg-blue-100 text-blue-700',
  'semi-annual': 'bg-purple-100 text-purple-700',
  quarterly: 'bg-green-100 text-green-700',
}

export default function FrequencyBadge({ frequency, label }: Props) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
        colours[frequency] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {label}
    </span>
  )
}
