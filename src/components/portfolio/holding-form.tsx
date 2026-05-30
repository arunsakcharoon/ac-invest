'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { addHolding, updateHolding } from '@/app/[locale]/portfolio/actions'
import type { HoldingWithMetrics } from '@/lib/types'

interface HoldingFormProps {
  portfolioId: string
  editing?: HoldingWithMetrics
  onClose: () => void
}

export default function HoldingForm({ portfolioId, editing, onClose }: HoldingFormProps) {
  const t = useTranslations('portfolio')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const [form, setForm] = useState({
    ticker: editing?.ticker ?? '',
    shares: editing ? String(editing.shares) : '',
    cost_per_share: editing ? String(editing.cost_per_share) : '',
    purchase_date: editing?.purchase_date ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)

    const shares = parseFloat(form.shares)
    const cost_per_share = parseFloat(form.cost_per_share)
    if (!form.ticker.trim() || isNaN(shares) || shares <= 0 || isNaN(cost_per_share) || cost_per_share <= 0) {
      setError(tc('error'))
      return
    }

    const data = {
      ticker: form.ticker,
      shares,
      cost_per_share,
      purchase_date: form.purchase_date || null,
    }

    startTransition(async () => {
      const result = editing
        ? await updateHolding(editing.id, data)
        : await addHolding(portfolioId, data)

      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('ticker')}
        </label>
        <input
          name="ticker"
          value={form.ticker}
          onChange={handleChange}
          placeholder="e.g. PTT"
          required
          disabled={!!editing}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm uppercase placeholder:normal-case disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('shares')}
        </label>
        <input
          name="shares"
          type="number"
          min="0.0001"
          step="any"
          value={form.shares}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('costPerShare')}
        </label>
        <input
          name="cost_per_share"
          type="number"
          min="0.0001"
          step="any"
          value={form.cost_per_share}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('purchaseDate')}
        </label>
        <input
          name="purchase_date"
          type="date"
          value={form.purchase_date ?? ''}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {tc('cancel')}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? t('saving') : tc('save')}
        </button>
      </div>
    </form>
  )
}
