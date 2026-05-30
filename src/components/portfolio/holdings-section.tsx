'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import { deleteHolding } from '@/app/[locale]/portfolio/actions'
import HoldingForm from './holding-form'
import { formatThb, formatPct } from '@/lib/utils'
import type { HoldingWithMetrics } from '@/lib/types'

interface HoldingsSectionProps {
  portfolioId: string
  initialHoldings: HoldingWithMetrics[]
}

export default function HoldingsSection({ portfolioId, initialHoldings }: HoldingsSectionProps) {
  const t = useTranslations('portfolio')
  const tc = useTranslations('common')

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<HoldingWithMetrics | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string>()

  const holdings = initialHoldings

  function handleDelete(id: string) {
    setDeleteError(undefined)
    startTransition(async () => {
      const result = await deleteHolding(id)
      if (result.error) {
        setDeleteError(result.error)
      }
      setConfirmDeleteId(null)
    })
  }

  return (
    <div>
      {/* Add button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('title')}
        </h2>
        <button
          onClick={() => { setShowAdd(true); setEditing(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t('addHolding')}
        </button>
      </div>

      {/* Add form modal */}
      {(showAdd || editing) && (
        <Modal
          title={editing ? t('editHolding') : t('addHolding')}
          onClose={() => { setShowAdd(false); setEditing(null) }}
        >
          <HoldingForm
            portfolioId={portfolioId}
            editing={editing ?? undefined}
            onClose={() => { setShowAdd(false); setEditing(null) }}
          />
        </Modal>
      )}

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <Modal title={t('confirmDelete')} onClose={() => setConfirmDeleteId(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('confirmDeleteMsg', {
              ticker: holdings.find((h) => h.id === confirmDeleteId)?.ticker ?? '',
            })}
          </p>
          {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
            >
              {tc('cancel')}
            </button>
            <button
              onClick={() => handleDelete(confirmDeleteId)}
              disabled={isPending}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? t('deleting') : tc('delete')}
            </button>
          </div>
        </Modal>
      )}

      {/* Empty state */}
      {holdings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-3">{t('emptyPortfolio')}</p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('addFirstHolding')}
          </button>
        </div>
      ) : (
        /* Holdings table */
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {[
                  t('ticker'), t('shares'), t('costPerShare'),
                  t('currentValue'), t('gainLossPct'),
                  t('dividendYield'), t('yieldOnCost'), t('annualIncome'),
                  '',
                ].map((header, i) => (
                  <th
                    key={i}
                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {holdings.map((h) => {
                const gainColor =
                  h.gain_loss > 0
                    ? 'text-green-600 dark:text-green-400'
                    : h.gain_loss < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                return (
                  <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">
                      <div>{h.ticker}</div>
                      {h.stock.name && (
                        <div className="text-xs text-gray-500 truncate max-w-[120px]">{h.stock.name}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-gray-700 dark:text-gray-300">
                      {h.shares.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-gray-700 dark:text-gray-300">
                      {formatThb(h.cost_per_share)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-gray-900 dark:text-white font-medium">
                      {formatThb(h.current_value)}
                    </td>
                    <td className={`px-3 py-3 tabular-nums font-medium ${gainColor}`}>
                      {h.gain_loss >= 0 ? '+' : ''}{formatPct(h.gain_loss_pct)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-gray-700 dark:text-gray-300">
                      {formatPct(h.dividend_yield)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-gray-700 dark:text-gray-300">
                      {formatPct(h.yield_on_cost)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-gray-700 dark:text-gray-300">
                      {formatThb(h.annual_income)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setEditing(h); setShowAdd(false) }}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700"
                          title={t('editHolding')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(h.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                          title={t('deleteHolding')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Simple modal wrapper ────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
