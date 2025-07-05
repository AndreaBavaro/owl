'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Phone, Mail, Archive, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Lead } from '@/lib/supabase'
import {
  formatPhoneNumber,
  getSourceBadgeClass,
  getPriorityColor,
} from '@/lib/utils'
import Link from 'next/link'

interface LeadCardProps {
  lead: Lead
  onArchive?: (id: number) => void
}

export function LeadCard({ lead, onArchive }: LeadCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.lead_id.toString(),
    data: {
      type: 'lead',
      lead,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleCall = () => {
    window.open(`tel:${lead.phone}`, '_self')
  }

  const handleEmail = () => {
    window.open(`mailto:${lead.email}`, '_self')
  }

  const handleArchive = () => {
    onArchive?.(lead.lead_id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`lead-card relative w-[280px] h-[120px] rounded-lg border bg-white p-4 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
      id={lead.lead_id.toString()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Source Badge */}
      {lead.source && (
        <div className="absolute top-2 right-2">
          <Badge
            className={`text-xs px-2 py-1 ${getSourceBadgeClass(lead.source)}`}
          >
            {lead.source}
          </Badge>
        </div>
      )}

      {/* Priority Indicator - removed as not in Lead schema */}

      {/* Lead Info */}
      <div className="mt-2">
        <Link href={`/lead/${lead.lead_id}`} className="block">
          <h3 className="font-semibold text-gray-900 text-base truncate hover:text-primary">
            {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() ||
              'Unnamed Lead'}
          </h3>
        </Link>

        <div className="mt-1 space-y-1">
          {lead.phone && (
            <p className="text-xs text-gray-600 truncate">
              {formatPhoneNumber(lead.phone)}
            </p>
          )}
          {lead.email && (
            <p className="text-xs text-gray-600 truncate">{lead.email}</p>
          )}
          {lead.referral_name && (
            <p className="text-xs text-gray-600 truncate">
              Referral: {lead.referral_name}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Tags */}
      <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between">
        <div className="flex space-x-1">
          {lead.external_id && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              ID: {lead.external_id}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {new Date(lead.created_at).toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute top-2 right-8 flex space-x-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-white shadow-sm hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation()
              handleCall()
            }}
          >
            <Phone className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-white shadow-sm hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation()
              handleEmail()
            }}
          >
            <Mail className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-white shadow-sm hover:bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
