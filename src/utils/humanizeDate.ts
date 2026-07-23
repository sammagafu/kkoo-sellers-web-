import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import updateLocale from 'dayjs/plugin/updateLocale'

dayjs.extend(relativeTime)
dayjs.extend(updateLocale)

dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  },
})

export function parseMaybeDate(value?: string | Date | null) {
  if (value == null || value === '') return null
  const d = dayjs(value)
  return d.isValid() ? d : null
}

/** e.g. "a day ago", "3 minutes ago", "in 2 days" */
export function formatRelativeDate(value?: string | Date | null) {
  const d = parseMaybeDate(value)
  if (!d) return '—'
  return d.fromNow()
}

/**
 * Remaining window until end date.
 * e.g. "3 days left", "ends today", "ended 2 days ago"
 */
export function formatDaysLeft(endAt?: string | Date | null, now: Date = new Date()) {
  const end = parseMaybeDate(endAt)
  if (!end) return '—'
  const startOfToday = dayjs(now).startOf('day')
  const endDay = end.startOf('day')
  const days = endDay.diff(startOfToday, 'day')
  if (days > 1) return `${days} days left`
  if (days === 1) return '1 day left'
  if (days === 0) {
    if (end.isAfter(now)) return 'ends today'
    return 'ended today'
  }
  if (days === -1) return 'ended a day ago'
  return `ended ${Math.abs(days)} days ago`
}

/** Compact campaign window label for tables. */
export function formatCampaignWindow(startAt?: string | null, endAt?: string | null) {
  const start = parseMaybeDate(startAt)
  const end = parseMaybeDate(endAt)
  if (!start && !end) return { primary: '—', secondary: '' }
  return {
    primary: formatDaysLeft(endAt ?? null),
    secondary: [
      start ? `Started ${start.fromNow()}` : null,
      end ? `Ends ${end.fromNow()}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  }
}
