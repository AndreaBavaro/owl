import { Lead } from './supabase'

export interface AnalyticsData {
  totalLeads: number
  totalLeadsThisMonth: number
  topSource: string
  mostRequestedService: string
  sourceDistribution: { source: string; count: number; percentage: number }[]
  serviceDistribution: { service: string; count: number; percentage: number }[]
  conversionFunnel: { status: string; count: number; percentage: number }[]
  monthlyTrends: { month: string; leads: number; conversions: number }[]
  sourcePerformance: { source: string; leads: number; conversions: number; rate: number }[]
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
      label: 'Last 7 days'
    },
    '30d': {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 30 days'
    },
    '3m': {
      start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 3 months'
    },
    '6m': {
      start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 6 months'
    },
    '1y': {
      start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 1 year'
    }
  }
  return ranges
}

export const filterLeadsByDateRange = (leads: Lead[], dateRange: DateRange): Lead[] => {
  return leads.filter(lead => {
    const leadDate = new Date(lead.created_at)
    return leadDate >= dateRange.start && leadDate <= dateRange.end
  })
}

export const calculateSourceDistribution = (leads: Lead[]): { source: string; count: number; percentage: number }[] => {
  const sourceCount: { [key: string]: number } = {}
  const totalLeads = leads.length

  leads.forEach(lead => {
    const source = lead.source || 'Unknown'
    sourceCount[source] = (sourceCount[source] || 0) + 1
  })

  return Object.entries(sourceCount)
    .map(([source, count]) => ({
      source,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
}

export const calculateServiceDistribution = (leads: Lead[]): { service: string; count: number; percentage: number }[] => {
  const serviceCount: { [key: string]: number } = {}
  const totalLeads = leads.length

  leads.forEach(lead => {
    const service = lead.service || 'Not Specified'
    serviceCount[service] = (serviceCount[service] || 0) + 1
  })

  return Object.entries(serviceCount)
    .map(([service, count]) => ({
      service,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
}

export const calculateConversionFunnel = (leads: Lead[]): { status: string; count: number; percentage: number }[] => {
  const statusCount: { [key: string]: number } = {}
  const totalLeads = leads.length

  leads.forEach(lead => {
    const status = lead.status_code || 'Unknown'
    statusCount[status] = (statusCount[status] || 0) + 1
  })

  const statusOrder = ['new', 'new_lead', 'existing_client']
  const orderedStatuses = statusOrder.filter(status => statusCount[status])
  const otherStatuses = Object.keys(statusCount).filter(status => !statusOrder.includes(status))

  return [...orderedStatuses, ...otherStatuses]
    .map(status => ({
      status: status === 'new_lead' ? 'New Lead' : 
              status === 'new' ? 'New (Tally)' :
              status === 'existing_client' ? 'Existing Client' : status,
      count: statusCount[status],
      percentage: totalLeads > 0 ? Math.round((statusCount[status] / totalLeads) * 100) : 0
    }))
}

export const calculateMonthlyTrends = (leads: Lead[], months: number = 12): { month: string; leads: number; conversions: number }[] => {
  const now = new Date()
  const monthlyData: { [key: string]: { leads: number; conversions: number } } = {}

  // Initialize last N months
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
    monthlyData[monthKey] = { leads: 0, conversions: 0 }
  }

  leads.forEach(lead => {
    const leadDate = new Date(lead.created_at)
    const monthKey = leadDate.toISOString().slice(0, 7)
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].leads++
      if (lead.status_code === 'existing_client') {
        monthlyData[monthKey].conversions++
      }
    }
  })

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      leads: data.leads,
      conversions: data.conversions
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export const calculateSourcePerformance = (leads: Lead[]): { source: string; leads: number; conversions: number; rate: number }[] => {
  const sourceData: { [key: string]: { leads: number; conversions: number } } = {}

  leads.forEach(lead => {
    const source = lead.source || 'Unknown'
    if (!sourceData[source]) {
      sourceData[source] = { leads: 0, conversions: 0 }
    }
    sourceData[source].leads++
    if (lead.status_code === 'existing_client') {
      sourceData[source].conversions++
    }
  })

  return Object.entries(sourceData)
    .map(([source, data]) => ({
      source,
      leads: data.leads,
      conversions: data.conversions,
      rate: data.leads > 0 ? Math.round((data.conversions / data.leads) * 100) : 0
    }))
    .sort((a, b) => b.leads - a.leads)
}

export const calculateServicePerformance = (leads: Lead[]): { service: string; leads: number; monthlyTrend: number }[] => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const currentYear = now.getFullYear()
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const serviceData: { [key: string]: { current: number; previous: number } } = {}

  leads.forEach(lead => {
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
      monthlyTrend: data.previous > 0 ? 
        Math.round(((data.current - data.previous) / data.previous) * 100) : 
        data.current > 0 ? 100 : 0
    }))
    .sort((a, b) => b.leads - a.leads)
}

export const generateAnalyticsData = (leads: Lead[], dateRange?: DateRange): AnalyticsData => {
  const filteredLeads = dateRange ? filterLeadsByDateRange(leads, dateRange) : leads
  
  // Calculate this month's leads
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthLeads = leads.filter(lead => new Date(lead.created_at) >= startOfMonth)

  const sourceDistribution = calculateSourceDistribution(filteredLeads)
  const serviceDistribution = calculateServiceDistribution(filteredLeads)

  return {
    totalLeads: filteredLeads.length,
    totalLeadsThisMonth: thisMonthLeads.length,
    topSource: sourceDistribution[0]?.source || 'No data',
    mostRequestedService: serviceDistribution[0]?.service || 'No data',
    sourceDistribution,
    serviceDistribution,
    conversionFunnel: calculateConversionFunnel(filteredLeads),
    monthlyTrends: calculateMonthlyTrends(leads),
    sourcePerformance: calculateSourcePerformance(filteredLeads),
    servicePerformance: calculateServicePerformance(leads)
  }
}

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
