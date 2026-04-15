/**
 * Agregações para o dashboard do avaliador (ideias em ação).
 */

export function resolveAreaLabel(
  submittedSector: string | null | undefined,
  userSetor: string | null | undefined
): string {
  const s = (submittedSector ?? "").trim()
  if (s.length > 0) return s
  const u = (userSetor ?? "").trim()
  if (u.length > 0) return u
  return "(Sem área)"
}

export function hasAuthorAiRefinement(aiEnhancement: unknown): boolean {
  if (!aiEnhancement || typeof aiEnhancement !== "object") return false
  const o = aiEnhancement as Record<string, unknown>
  const desc = o.description as { refinedWithAi?: boolean } | undefined
  const prob = o.problem as { refinedWithAi?: boolean } | undefined
  return desc?.refinedWithAi === true || prob?.refinedWithAi === true
}

export function hasMorrison(aiEnhancement: unknown): boolean {
  if (!aiEnhancement || typeof aiEnhancement !== "object") return false
  const o = aiEnhancement as Record<string, unknown>
  const m = o.morrison as { evaluatorNote?: string } | undefined
  return typeof m?.evaluatorNote === "string" && m.evaluatorNote.trim().length > 0
}

function morrisonSnippet(aiEnhancement: unknown, maxLen: number): string | null {
  if (!aiEnhancement || typeof aiEnhancement !== "object") return null
  const o = aiEnhancement as Record<string, unknown>
  const m = o.morrison as { evaluatorNote?: string } | undefined
  const t = m?.evaluatorNote?.trim() ?? ""
  if (!t) return null
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen - 1)}…`
}

export function paidAmount(payment: unknown): number {
  if (!payment || typeof payment !== "object") return 0
  const o = payment as { status?: string; amount?: number }
  if (o.status !== "paid" || typeof o.amount !== "number" || Number.isNaN(o.amount)) return 0
  return Math.max(0, o.amount)
}

export type EvaluatorDashRow = {
  id: string
  ideaNumber: number
  status: string
  aiEnhancement: unknown
  payment: unknown
  createdAt: Date
  updatedAt: Date
  submittedSector: string | null
  userSetor: string | null
}

export type ForecastRow = {
  createdAt: Date
  submittedSector: string | null
  userSetor: string | null
}

export interface EvaluatorDashboardComputed {
  analyst: { id: string; displayName: string }
  counts: {
    evaluated: number
    approved: number
    rejected: number
    pending: number
  }
  statusBarData: { label: string; value: number }[]
  areaShare: { area: string; count: number; pct: number }[]
  approvalRate: number | null
  authorAiUsagePct: number | null
  morrisonUsagePct: number | null
  areaForecast: { area: string; ideasLast90Days: number; projectedMonthly: number }[]
  totalPaidAmount: number
  areaDiagnostics: {
    area: string
    ideasCount: number
    withMorrison: number
    snippet: string | null
  }[]
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function computeEvaluatorDashboard(
  analyst: { id: string; displayName: string },
  assigned: EvaluatorDashRow[],
  recentForForecast: ForecastRow[]
): EvaluatorDashboardComputed {
  const n = assigned.length
  let pending = 0
  let evaluated = 0
  let approved = 0
  let rejected = 0
  let aiAuthor = 0
  let morrisonN = 0
  const areaCounts = new Map<string, number>()

  for (const r of assigned) {
    const st = r.status
    if (st === "NEW" || st === "IN_REVIEW") {
      pending += 1
    } else {
      evaluated += 1
    }

    if (st === "APPROVED" || st === "IN_PROGRESS" || st === "DONE") {
      approved += 1
    }
    if (st === "NOT_IMPLEMENTED") {
      rejected += 1
    }

    if (hasAuthorAiRefinement(r.aiEnhancement)) {
      aiAuthor += 1
    }
    if (hasMorrison(r.aiEnhancement)) {
      morrisonN += 1
    }

    const area = resolveAreaLabel(r.submittedSector, r.userSetor)
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1)
  }

  const decided = approved + rejected
  const approvalRate = decided > 0 ? round1((approved / decided) * 100) : null
  const authorAiUsagePct = n > 0 ? round1((aiAuthor / n) * 100) : null
  const morrisonUsagePct = n > 0 ? round1((morrisonN / n) * 100) : null

  const areaShare = [...areaCounts.entries()]
    .map(([area, count]) => ({
      area,
      count,
      pct: n > 0 ? round1((count / n) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  let totalPaid = 0
  for (const r of assigned) {
    totalPaid += paidAmount(r.payment)
  }

  const forecastGlobal = new Map<string, number>()
  for (const r of recentForForecast) {
    const a = resolveAreaLabel(r.submittedSector, r.userSetor)
    forecastGlobal.set(a, (forecastGlobal.get(a) ?? 0) + 1)
  }

  const areasOfInterest =
    areaShare.length > 0
      ? areaShare.map((x) => x.area)
      : [...forecastGlobal.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([a]) => a)

  const areaForecast = areasOfInterest.map((area) => {
    const ideasLast90Days = forecastGlobal.get(area) ?? 0
    const projectedMonthly = round1(ideasLast90Days / 3)
    return { area, ideasLast90Days, projectedMonthly }
  })

  const byArea = new Map<string, EvaluatorDashRow[]>()
  for (const r of assigned) {
    const a = resolveAreaLabel(r.submittedSector, r.userSetor)
    if (!byArea.has(a)) {
      byArea.set(a, [])
    }
    byArea.get(a)!.push(r)
  }

  const areaDiagnostics = [...byArea.entries()]
    .map(([area, rows]) => {
      const withM = rows.filter((x) => hasMorrison(x.aiEnhancement))
      const sorted = [...withM].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      const snippet = sorted[0] ? morrisonSnippet(sorted[0].aiEnhancement, 280) : null
      return {
        area,
        ideasCount: rows.length,
        withMorrison: withM.length,
        snippet,
      }
    })
    .sort((a, b) => b.ideasCount - a.ideasCount)

  return {
    analyst,
    counts: {
      evaluated,
      approved,
      rejected,
      pending,
    },
    statusBarData: [
      { label: "Avaliadas", value: evaluated },
      { label: "Aprovadas", value: approved },
      { label: "Recusadas", value: rejected },
      { label: "Pendentes", value: pending },
    ],
    areaShare,
    approvalRate,
    authorAiUsagePct,
    morrisonUsagePct,
    areaForecast,
    totalPaidAmount: Math.round(totalPaid * 100) / 100,
    areaDiagnostics,
  }
}
