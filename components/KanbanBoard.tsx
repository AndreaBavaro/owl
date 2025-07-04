'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { LeadCard } from '@/components/LeadCard'
import { 
  LeadWithUI, 
  Status,
  getLeads, 
  updateLeadStatus, 
  getLeadCounts,
  getStatuses,
  isAuthenticated
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
  const [leads, setLeads] = useState<LeadWithUI[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [activeId, setActiveId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const leadId = Number(active.id)
    const newStatusCode = over.id as string
    
    // Find the lead being moved
    const lead = leads.find(l => l.lead_id === leadId)
    if (!lead || lead.status_code === newStatusCode) return

    const oldStatusCode = lead.status_code || ''

    // Optimistic update
    setLeads(prev => 
      prev.map(l => 
        l.lead_id === leadId 
          ? { ...l, status_code: newStatusCode }
          : l
      )
    )

    // Update counts optimistically
    setLeadCounts(prev => ({
      ...prev,
      [oldStatusCode]: (prev[oldStatusCode] || 0) - 1,
      [newStatusCode]: (prev[newStatusCode] || 0) + 1,
    }))

    try {
      const success = await updateLeadStatus(leadId, newStatusCode)
      if (success) {
        const statusName = statuses.find(s => s.status_code === newStatusCode)?.description || newStatusCode
        toast({
          title: 'Status Updated',
          description: `Lead moved to ${statusName}`,
        })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      // Revert optimistic update on error
      setLeads(prev => 
        prev.map(l => 
          l.lead_id === leadId 
            ? { ...l, status_code: oldStatusCode }
            : l
        )
      )
      setLeadCounts(prev => ({
        ...prev,
        [oldStatusCode]: (prev[oldStatusCode] || 0) + 1,
        [newStatusCode]: (prev[newStatusCode] || 0) - 1,
      }))
      
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive',
      })
    }
  }

  const getLeadsByStatus = (statusCode: string) => {
    return leads.filter(lead => lead.status_code === statusCode)
  }

  const activeLead = activeId ? leads.find(lead => lead.lead_id === activeId) : null

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
        <div className="text-xl font-semibold mb-2">No status columns found</div>
        <p className="text-gray-500">Please configure status columns in your Supabase database</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-container flex gap-6 overflow-x-auto pb-6">
        {statuses.map((status, index) => {
          const columnLeads = getLeadsByStatus(status.status_code)
          const colorIndex = index % DEFAULT_COLORS.length
          
          return (
            <div
              key={status.status_code}
              className={`kanban-column flex-shrink-0 w-80 rounded-lg border-2 border-dashed p-4 ${DEFAULT_COLORS[colorIndex]}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{status.description || status.status_code}</h3>
                <Badge variant="secondary" className="ml-2">
                  {leadCounts[status.status_code] || 0}
                </Badge>
              </div>

              {/* Column Content */}
              <SortableContext
                items={columnLeads.map(lead => lead.lead_id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 min-h-[200px]">
                  {columnLeads.map((lead) => (
                    <LeadCard key={lead.lead_id} lead={lead} />
                  ))}
                  {columnLeads.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                      No leads in this column
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
