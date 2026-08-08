import { todayStr, daysDiff } from './followup'
import { appStatusLabel } from '../constants/applicationStatus'

export function computeStreak(dailyTrend) {
  const byDate = Object.fromEntries(dailyTrend.map((d) => [d.date, d.count]))
  let streak = 0
  const cursor = new Date(todayStr())
  if (!byDate[cursor.toISOString().slice(0, 10)]) cursor.setDate(cursor.getDate() - 1)
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!byDate[key]) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeCurrentFocus(statusCounts) {
  const inFlight = ['APPLIED', 'OA_SCHEDULED', 'OA_CLEARED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_CLEARED']
  const entries = inFlight
    .map((key) => [key, statusCounts[key] || 0])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null
  const [key, count] = entries[0]
  return { key, label: appStatusLabel(key), count }
}

export function computeInsights({ statusCounts, totalApplications, weekTrend, offerCount, dailyTrend }) {
  const insights = []

  if (totalApplications > 0) {
    const interviewish = (statusCounts.INTERVIEW_SCHEDULED || 0) + (statusCounts.INTERVIEW_CLEARED || 0)
    const responseRate = Math.round(((interviewish + offerCount) / totalApplications) * 100)
    insights.push({
      key: 'response-rate',
      tone: responseRate >= 20 ? 'success' : 'accent',
      text: `${responseRate}% of your applications have reached interview stage or beyond.`,
    })
  }

  if (weekTrend !== null && !Number.isNaN(weekTrend)) {
    insights.push({
      key: 'pace',
      tone: weekTrend >= 0 ? 'success' : 'warning',
      text: weekTrend >= 0
        ? `You're applying ${weekTrend}% more this week than last — keep the momentum.`
        : `Applications dipped ${Math.abs(weekTrend)}% vs last week. Consider logging a few more today.`,
    })
  }

  const busiest = [...dailyTrend].sort((a, b) => b.count - a.count)[0]
  if (busiest && busiest.count > 0) {
    const label = new Date(`${busiest.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
    insights.push({ key: 'busiest', tone: 'accent', text: `${label} has been your most active day recently.` })
  }

  const rejected = statusCounts.REJECTED || 0
  if (rejected > 0 && totalApplications > 0) {
    const rejectRate = Math.round((rejected / totalApplications) * 100)
    if (rejectRate >= 40) {
      insights.push({ key: 'reject-rate', tone: 'warning', text: `${rejectRate}% of applications were rejected — consider tailoring your resume per role.` })
    }
  }

  if (insights.length === 0) {
    insights.push({ key: 'empty', tone: 'accent', text: 'Log a few applications to start seeing personalized insights here.' })
  }

  return insights.slice(0, 4)
}

export function buildHeatmapCells(dailyTrend, days = 14) {
  const byDate = Object.fromEntries(dailyTrend.map((d) => [d.date, d.count]))
  const maxCount = Math.max(1, ...dailyTrend.map((d) => d.count))
  const cells = []
  const cursor = new Date(todayStr())
  cursor.setDate(cursor.getDate() - (days - 1))
  for (let i = 0; i < days; i++) {
    const key = cursor.toISOString().slice(0, 10)
    const count = byDate[key] || 0
    cells.push({
      date: key,
      count,
      intensity: count === 0 ? 0 : Math.min(1, count / maxCount),
      label: cursor.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return cells
}

const MOTIVATION_QUOTES = [
  'Every application is a step closer to the right offer.',
  'Consistency beats intensity — a little progress daily adds up.',
  'The right role is looking for you too. Keep going.',
  'Rejections are redirections, not verdicts.',
  'Momentum is built one follow-up at a time.',
]

export function pickMotivation(seed = new Date().getDate()) {
  return MOTIVATION_QUOTES[seed % MOTIVATION_QUOTES.length]
}
