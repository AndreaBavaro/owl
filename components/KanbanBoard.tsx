'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { LeadCard } from '@/components/LeadCard'
import {
  Lead,
  Status,
  getLeads,
  getLeadCounts,
  getStatuses,
  isAuthenticated,
  deleteLead,
} from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

// Default column colors - will be used if no statuses are fetched
const DEFAULT_COLORS = [
  'bg-blue-50 border-blue-200',
  'bg-yellow-50 border-yellow-200',
  'bg-green-50 border-green-200',
  'bg-gray-50 border-gray-200',
  'bg-purple-50 border-purple-200',
  'bg-red-50 border-red-200',
]

export function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/login')
      } else {
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [])

  // Load data after authentication is confirmed
  useEffect(() => {
    if (authChecked) {
      loadStatuses()
      loadLeads()
      loadLeadCounts()
    }
  }, [authChecked])

  const loadStatuses = async () => {
    try {
      const data = await getStatuses()
      setStatuses(data)
    } catch (error) {
      console.error('Error loading statuses:', error)
      toast({
        title: 'Error',
        description: 'Failed to load status columns',
        variant: 'destructive',
      })
    }
  }

  const loadLeads = async () => {
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (error) {
      console.error('Error loading leads:', error)
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadLeadCounts = async () => {
    try {
      const counts = await getLeadCounts()
      setLeadCounts(counts)
    } catch (error) {
      console.error('Error loading lead counts:', error)
    }
  }

  const getLeadsForStatus = (statusCode: string) => {
    return leads.filter((lead) => lead.status_code === statusCode)
  }

  const handleDelete = async (leadId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this lead? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      const result = await deleteLead(leadId)
      if (result.success) {
        // Remove lead from UI immediately
        setLeads((prevLeads) =>
          prevLeads.filter((lead) => lead.lead_id !== leadId)
        )

        // Update lead counts
        const deletedLead = leads.find((lead) => lead.lead_id === leadId)
        if (deletedLead && deletedLead.status_code) {
          const statusCode = deletedLead.status_code
          setLeadCounts((prevCounts) => ({
            ...prevCounts,
            [statusCode]: Math.max(0, (prevCounts[statusCode] || 0) - 1),
          }))
        }

        toast({
          title: 'Lead Deleted',
          description: 'The lead has been permanently deleted.',
        })
      } else {
        throw new Error(result.error?.message || 'Failed to delete lead')
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description:
          error instanceof Error ? error.message : 'Could not delete lead.',
        variant: 'destructive',
      })
    }
  }

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

  // If no statuses are loaded, show a message
  if (statuses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-xl font-semibold mb-2">
          No status columns found
        </div>
        <p className="text-gray-500">
          Please configure status columns in your Supabase database
        </p>
      </div>
    )
  }

  return (
    <div className="kanban-container flex gap-6 overflow-x-auto pb-6">
      {statuses.map((status, index) => {
        const columnLeads = getLeadsForStatus(status.status_code)
        const colorIndex = index % DEFAULT_COLORS.length

        return (
          <div
            key={status.status_code}
            className={`kanban-column flex-shrink-0 w-80 rounded-lg border-2 border-dashed p-4 ${DEFAULT_COLORS[colorIndex]}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {status.description || status.status_code}
              </h3>
              <Badge variant="secondary" className="ml-2">
                {leadCounts[status.status_code] || 0}
              </Badge>
            </div>

            {/* Column Content */}
            <div className="space-y-3 min-h-[200px]">
              {columnLeads.map((lead) => (
                <LeadCard
                  key={lead.lead_id}
                  lead={lead}
                  onArchive={handleDelete}
                />
              ))}
              {columnLeads.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  No leads in this column
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
