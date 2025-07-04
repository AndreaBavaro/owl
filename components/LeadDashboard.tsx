'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LeadWithUI, 
  getLeads,
  isAuthenticated,
  updateLeadStatus
} from '@/lib/supabase'
import { generateAnalyticsData } from '@/lib/analytics'
import { useToast } from '@/hooks/use-toast'
import { formatPhoneNumber } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  Filter,
  ArrowUpDown,
  UserCheck,
  UserPlus,
  BarChart3,
  RefreshCw
} from 'lucide-react'

export function LeadDashboard() {
  const [leads, setLeads] = useState<LeadWithUI[]>([])
  const [filteredLeads, setFilteredLeads] = useState<LeadWithUI[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof LeadWithUI | null;
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' })
  const [analyticsData, setAnalyticsData] = useState({
    totalLeadsThisMonth: 0,
    topSource: 'No data',
    mostRequestedService: 'No data',
  })
  
  const router = useRouter()
  const { toast } = useToast()

  // Combined authentication check and data loading
  useEffect(() => {
    let isMounted = true
    
    const checkAuthAndLoadData = async () => {
      try {
        setLoading(true)
        const authenticated = await isAuthenticated()
        
        if (!authenticated) {
          router.push('/login')
          return
        }
        
        if (isMounted) {
          setAuthChecked(true)
          const data = await getLeads()
          
          if (isMounted) {
            setLeads(data)
            const analytics = generateAnalyticsData(data)
            setAnalyticsData({
              totalLeadsThisMonth: analytics.totalLeadsThisMonth,
              topSource: analytics.topSource,
              mostRequestedService: analytics.mostRequestedService,
            })
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Error in authentication or loading data:', error)
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load dashboard data',
            variant: 'destructive',
          })
          setLoading(false)
        }
      }
    }
    
    checkAuthAndLoadData()
    
    return () => {
      isMounted = false
    }
  }, [router, toast])

  // Filter and sort leads when dependencies change
  useEffect(() => {
    let result = [...leads]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(lead => 
        (lead.fullName?.toLowerCase().includes(query) || false) ||
        (lead.first_name?.toLowerCase().includes(query) || false) ||
        (lead.last_name?.toLowerCase().includes(query) || false) ||
        (lead.email?.toLowerCase().includes(query) || false) ||
        (lead.phone?.includes(query) || false) ||
        (lead.source?.toLowerCase().includes(query) || false) ||
        (lead.service?.toLowerCase().includes(query) || false)
      )
    }
    
    // Apply status filter
    if (statusFilter) {
      // Special case for "new_lead" filter to include both "new_lead" and "new" statuses
      if (statusFilter === 'new_lead') {
        result = result.filter(lead => lead.status_code === 'new_lead' || lead.status_code === 'new')
      } else {
        result = result.filter(lead => lead.status_code === statusFilter)
      }
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof LeadWithUI]
        const bValue = b[sortConfig.key as keyof LeadWithUI]
        
        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        
        // For dates
        if (sortConfig.key === 'created_at') {
          return sortConfig.direction === 'asc'
            ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
            : new Date(bValue as string).getTime() - new Date(aValue as string).getTime()
        }
        
        return 0
      })
    }
    
    setFilteredLeads(result)
  }, [leads, searchQuery, statusFilter, sortConfig])

  const refreshLeads = async () => {
    try {
      setLoading(true)
      const data = await getLeads()
      setLeads(data)
      const analytics = generateAnalyticsData(data)
      setAnalyticsData({
        totalLeadsThisMonth: analytics.totalLeadsThisMonth,
        topSource: analytics.topSource,
        mostRequestedService: analytics.mostRequestedService,
      })
    } catch (error) {
      console.error('Error refreshing leads:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh leads',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: keyof LeadWithUI) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      // Find the lead
      const lead = leads.find(l => l.lead_id === leadId)
      if (!lead) return
      
      // Optimistic update
      setLeads(prev => 
        prev.map(l => 
          l.lead_id === leadId 
            ? { ...l, status_code: newStatus }
            : l
        )
      )
      
      const success = await updateLeadStatus(leadId, newStatus)
      if (success) {
        toast({
          title: 'Status Updated',
          description: `Lead status changed to ${newStatus === 'new_lead' ? 'New Lead' : 'Existing Client'}`,
        })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      // Revert on error
      refreshLeads() // Reload all leads to ensure consistency
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (statusCode: string | null) => {
    if (statusCode === 'new_lead' || statusCode === 'new') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">New Lead</Badge>
    } else if (statusCode === 'existing_client') {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Existing Client</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Unknown</Badge>
  }

  // Dashboard stats
  const totalLeads = leads.length
  const newLeadsCount = leads.filter(lead => lead.status_code === 'new_lead').length
  const existingClientsCount = leads.filter(lead => lead.status_code === 'existing_client').length

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Checking authentication...</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Leads This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analyticsData.totalLeadsThisMonth}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Top Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{analyticsData.topSource}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Most Requested Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{analyticsData.mostRequestedService}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Link */}
      <div className="flex justify-end">
        <Link href="/analytics">
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            View Detailed Analytics
          </Button>
        </Link>
      </div>

      {/* Refresh and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={refreshLeads} 
          disabled={loading} 
          className="h-10 w-10 shrink-0"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-48">
          <Select
            value={statusFilter || ''}
            onValueChange={(value) => setStatusFilter(value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="new_lead">New Leads</SelectItem>
              <SelectItem value="existing_client">Existing Clients</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Manage all your mortgage leads in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px] cursor-pointer" onClick={() => handleSort('first_name')}>
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                  Contact
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('source')}>
                  Source
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('service')}>
                  Service
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                  Date Added
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.lead_id}>
                    <TableCell className="font-medium">
                      <Link href={`/lead/${lead.lead_id}`} className="hover:text-primary">
                        {lead.fullName || 'Unnamed Lead'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{formatPhoneNumber(lead.phone)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{lead.source || '-'}</TableCell>
                    <TableCell>{lead.service || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status_code || ''}
                        onValueChange={(value) => handleStatusChange(lead.lead_id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            {getStatusBadge(lead.status_code)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_lead">New Lead</SelectItem>
                          <SelectItem value="new">New (Tally Form)</SelectItem>
                          <SelectItem value="existing_client">Existing Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/lead/${lead.lead_id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchQuery || statusFilter ? 
                      'No leads match your search criteria' : 
                      'No leads found. Add your first lead to get started.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
