'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Lead,
  getLeads,
  isAuthenticated,
  subscribeToLeads,
  unsubscribeFromLeads,
} from '@/lib/supabase'
import {
  generateAnalyticsData,
  getDateRanges,
  filterLeadsByDateRange,
  exportToCSV,
  exportLeadsToCSV,
  AnalyticsData,
  DateRange,
} from '@/lib/analytics'
import { useToast } from '@/hooks/use-toast'

export default function AnalyticsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDateRange, setSelectedDateRange] = useState('30d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [comparisonData, setComparisonData] = useState<AnalyticsData | null>(
    null
  )
  const [showComparison, setShowComparison] = useState(false)

  const dateRanges = getDateRanges()

  // Combined authentication and data loading effect with real-time subscriptions
  useEffect(() => {
    let isMounted = true
    let subscription: any = null

    const initializeAnalytics = async () => {
      try {
        setLoading(true)

        // Check authentication first
        const authenticated = await isAuthenticated()
        if (!isMounted) return

        if (!authenticated) {
          router.push('/login')
          return
        }

        // Load and process data
        await refreshData()

        // Set up real-time subscription for live analytics updates
        subscription = subscribeToLeads((payload) => {
          console.log('Analytics: Real-time update received:', payload)

          if (!isMounted) return

          // Refresh analytics data when leads change
          refreshData()
        })
      } catch (error) {
        console.error('Analytics initialization error:', error)
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load analytics data',
            variant: 'destructive',
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAnalytics()

    return () => {
      isMounted = false
      if (subscription) {
        unsubscribeFromLeads(subscription)
      }
    }
  }, [router, toast])

  useEffect(() => {
    if (leads.length > 0) {
      calculateAnalytics()
    }
  }, [leads, selectedDateRange])

  const refreshData = async () => {
    try {
      setLoading(true)
      const data = await getLeads()
      setLeads(data)
      calculateAnalytics()
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh analytics data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = () => {
    const currentRange = dateRanges[selectedDateRange]
    const currentData = generateAnalyticsData(leads, currentRange)
    setAnalyticsData(currentData)

    if (showComparison) {
      // Calculate comparison data for previous period
      const rangeDuration =
        currentRange.end.getTime() - currentRange.start.getTime()
      const previousRange: DateRange = {
        start: new Date(currentRange.start.getTime() - rangeDuration),
        end: currentRange.start,
        label: `Previous ${currentRange.label.toLowerCase()}`,
      }
      const previousData = generateAnalyticsData(leads, previousRange)
      setComparisonData(previousData)
    }
  }

  const handleExportLeads = () => {
    const currentRange = dateRanges[selectedDateRange]
    const filteredLeads = filterLeadsByDateRange(leads, currentRange)
    const filename =
      selectedDateRange === 'all' ? 'all_leads' : `leads_${selectedDateRange}`

    exportLeadsToCSV(filteredLeads, filename)

    toast({
      title: 'Export Started',
      description: `Exporting ${filteredLeads.length} leads to CSV`,
    })
  }

  const getPercentageChange = (
    current: number,
    previous: number
  ): { value: number; isPositive: boolean } => {
    if (previous === 0)
      return { value: current > 0 ? 100 : 0, isPositive: current > 0 }
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600">
                  Lead insights and performance metrics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select
                value={selectedDateRange}
                onValueChange={setSelectedDateRange}
              >
                <SelectTrigger className="w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dateRanges).map(([key, range]) => (
                    <SelectItem key={key} value={key}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowComparison(!showComparison)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {showComparison ? 'Hide' : 'Show'} Comparison
              </Button>
              <Button
                variant="outline"
                onClick={handleExportLeads}
                className="flex items-center gap-2"
                title="Export leads to CSV"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={refreshData}
                disabled={loading}
                title="Refresh data"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {analyticsData && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analyticsData.totalLeads}
                  </div>
                  {showComparison && comparisonData && (
                    <div className="mt-2">
                      {(() => {
                        const change = getPercentageChange(
                          analyticsData.totalLeads,
                          comparisonData.totalLeads
                        )
                        return (
                          <Badge
                            className={
                              change.isPositive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {change.isPositive ? '+' : '-'}
                            {change.value}%
                          </Badge>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {analyticsData.totalLeadsThisMonth}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">New leads</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Top Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-purple-600">
                    {analyticsData.topSource}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {analyticsData.sourceDistribution[0]?.count || 0} leads
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Top Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-orange-600">
                    {analyticsData.mostRequestedService}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {analyticsData.serviceDistribution[0]?.count || 0} requests
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Sources */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Lead Sources
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportLeads}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.sourceDistribution.map((item, index) => (
                      <div
                        key={item.source}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor: `hsl(${(index * 360) / analyticsData.sourceDistribution.length}, 70%, 50%)`,
                            }}
                          />
                          <span className="font-medium">{item.source}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{item.count}</div>
                          <div className="text-sm text-gray-600">
                            {item.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Service Distribution */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Service Requests
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportLeads}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.serviceDistribution.map((item, index) => (
                      <div
                        key={item.service}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor: `hsl(${(index * 360) / analyticsData.serviceDistribution.length + 180}, 70%, 50%)`,
                            }}
                          />
                          <span className="font-medium">{item.service}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{item.count}</div>
                          <div className="text-sm text-gray-600">
                            {item.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Source Performance */}
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Source Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.sourcePerformance.slice(0, 5).map((item) => (
                      <div key={item.source} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.source}</span>
                          <div className="text-right">
                            <div className="text-sm">{item.leads} leads</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min((item.leads / Math.max(...analyticsData.sourcePerformance.map((s) => s.leads))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Monthly Trends
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportLeads}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {analyticsData.monthlyTrends.map((item) => (
                    <div key={item.month} className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-600">
                        {item.month}
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {item.leads}
                      </div>
                      <div className="text-sm text-gray-600">leads</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
