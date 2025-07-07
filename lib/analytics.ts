import { Lead } from './supabase'

export interface AnalyticsData {
  totalLeads: number
  totalLeadsThisMonth: number
  topSource: string
  mostRequestedService: string
  sourceDistribution: { source: string; count: number; percentage: number }[]
  serviceDistribution: { service: string; count: number; percentage: number }[]
  monthlyTrends: { month: string; leads: number }[]
  sourcePerformance: { source: string; leads: number }[]
  servicePerformance: { service: string; leads: number; monthlyTrend: number }[]
}

export interface DateRange {
  start: Date
  end: Date
  label: string
}

export const getDateRanges = (): { [key: string]: DateRange } => {
  const now = new Date()
  const ranges = {
    '7d': {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 7 days',
    },
    '30d': {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 30 days',
    },
    '3m': {
      start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 3 months',
    },
    '6m': {
      start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 6 months',
    },
    '1y': {
      start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 1 year',
    },
  }
  return ranges
}

export const filterLeadsByDateRange = (
  leads: Lead[],
  dateRange: DateRange
): Lead[] => {
  return leads.filter((lead) => {
    const leadDate = new Date(lead.created_at)
    return leadDate >= dateRange.start && leadDate <= dateRange.end
  })
}

export const calculateSourceDistribution = (
  leads: Lead[]
): { source: string; count: number; percentage: number }[] => {
  const sourceCount: { [key: string]: number } = {}
  const totalLeads = leads.length

  leads.forEach((lead) => {
    const source = lead.source || 'Unknown'
    sourceCount[source] = (sourceCount[source] || 0) + 1
  })

  return Object.entries(sourceCount)
    .map(([source, count]) => ({
      source,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export const calculateServiceDistribution = (
  leads: Lead[]
): { service: string; count: number; percentage: number }[] => {
  const serviceCount: { [key: string]: number } = {}
  const totalLeads = leads.length

  leads.forEach((lead) => {
    const service = lead.service || 'Not Specified'
    serviceCount[service] = (serviceCount[service] || 0) + 1
  })

  return Object.entries(serviceCount)
    .map(([service, count]) => ({
      service,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export const calculateMonthlyTrends = (
  leads: Lead[],
  months: number = 12
): { month: string; leads: number }[] => {
  const now = new Date()
  const monthlyData: { [key: string]: number } = {}

  // Initialize months
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[monthKey] = 0
  }

  // Count leads by month
  leads.forEach((lead) => {
    const leadDate = new Date(lead.created_at)
    const monthKey = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}`

    if (monthlyData[monthKey] !== undefined) {
      monthlyData[monthKey]++
    }
  })

  return Object.entries(monthlyData)
    .map(([month, leads]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      leads,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export const calculateSourcePerformance = (
  leads: Lead[]
): { source: string; leads: number }[] => {
  const sourceData: { [key: string]: number } = {}

  leads.forEach((lead) => {
    const source = lead.source || 'Unknown'
    sourceData[source] = (sourceData[source] || 0) + 1
  })

  return Object.entries(sourceData)
    .map(([source, leads]) => ({
      source,
      leads,
    }))
    .sort((a, b) => b.leads - a.leads)
}

export const calculateServicePerformance = (
  leads: Lead[]
): { service: string; leads: number; monthlyTrend: number }[] => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const currentYear = now.getFullYear()
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const serviceData: { [key: string]: { current: number; previous: number } } =
    {}

  leads.forEach((lead) => {
    const service = lead.service || 'Not Specified'
    const leadDate = new Date(lead.created_at)
    const leadMonth = leadDate.getMonth()
    const leadYear = leadDate.getFullYear()

    if (!serviceData[service]) {
      serviceData[service] = { current: 0, previous: 0 }
    }

    if (leadYear === currentYear && leadMonth === currentMonth) {
      serviceData[service].current++
    } else if (leadYear === lastMonthYear && leadMonth === lastMonth) {
      serviceData[service].previous++
    }
  })

  return Object.entries(serviceData)
    .map(([service, data]) => ({
      service,
      leads: data.current,
      monthlyTrend:
        data.previous > 0
          ? Math.round(((data.current - data.previous) / data.previous) * 100)
          : data.current > 0
            ? 100
            : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
}

export const generateAnalyticsData = (
  leads: Lead[],
  dateRange?: DateRange
): AnalyticsData => {
  const filteredLeads = dateRange
    ? filterLeadsByDateRange(leads, dateRange)
    : leads

  // Calculate this month's leads
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthLeads = leads.filter(
    (lead) => new Date(lead.created_at) >= startOfMonth
  )

  const sourceDistribution = calculateSourceDistribution(filteredLeads)
  const serviceDistribution = calculateServiceDistribution(filteredLeads)

  return {
    totalLeads: filteredLeads.length,
    totalLeadsThisMonth: thisMonthLeads.length,
    topSource: sourceDistribution[0]?.source || 'No data',
    mostRequestedService: serviceDistribution[0]?.service || 'No data',
    sourceDistribution,
    serviceDistribution,
    monthlyTrends: calculateMonthlyTrends(leads),
    sourcePerformance: calculateSourcePerformance(filteredLeads),
    servicePerformance: calculateServicePerformance(leads),
  }
}

export const exportLeadsToCSV = (leads: Lead[], filename: string = 'leads') => {
  if (leads.length === 0) {
    console.warn('No leads to export')
    return
  }

  // Format leads data for CSV export
  const csvData = leads.map((lead) => ({
    'Lead ID': lead.lead_id,
    'First Name': lead.first_name || '',
    'Last Name': lead.last_name || '',
    Email: lead.email || '',
    Phone: lead.phone || '',
    Source: lead.source || '',
    Service: lead.service || '',
    Status: lead.status_code || '',
    'Referral Name': lead.referral_name || '',
    'Created Date': new Date(lead.created_at).toLocaleDateString(),
  }))

  const headers = Object.keys(csvData[0])
  const csvContent = [
    headers.join(','),
    ...csvData.map((row) =>
      headers.map((header) => `"${row[header as keyof typeof row]}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((header) => `"${row[header]}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
