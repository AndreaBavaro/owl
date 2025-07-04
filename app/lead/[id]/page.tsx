'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, Save, Trash2, UserCheck, UserPlus, ExternalLink, Calendar, User, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeadWithUI, getLeadById, updateLead, deleteLead } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [lead, setLead] = useState<LeadWithUI | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    external_id: '',
    loan_type: '',
    loan_amount: 0,
    notes: '',
    referral_name: '',
    source: '',
    status_code: 'new_lead',
    service: ''
  })

  useEffect(() => {
    if (params.id) {
      loadLead(params.id as string)
    }
  }, [params.id])

  const loadLead = async (id: string) => {
    try {
      const leadId = parseInt(id)
      if (isNaN(leadId)) {
        throw new Error('Invalid lead ID')
      }
      
      const data = await getLeadById(leadId)
      if (data) {
        setLead(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          external_id: data.external_id || '',
          loan_type: data.loan_type || '',
          loan_amount: data.loan_amount || 0,
          notes: data.notes || '',
          referral_name: data.referral_name || '',
          source: data.source || '',
          status_code: data.status_code || 'new_lead',
          service: data.service || ''
        })
      } else {
        toast({
          title: 'Error',
          description: 'Lead not found',
          variant: 'destructive',
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error loading lead:', error)
      toast({
        title: 'Error',
        description: 'Failed to load lead details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!lead) return

    setSaving(true)
    try {
      const success = await updateLead(lead.lead_id, formData)
      if (success) {
        toast({
          title: 'Success',
          description: 'Lead updated successfully',
        })
        setLead({ ...lead, ...formData })
      } else {
        throw new Error('Failed to update lead')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!lead) return

    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        const success = await deleteLead(lead.lead_id)
        if (success) {
          toast({
            title: 'Success',
            description: 'Lead deleted successfully',
          })
          router.push('/dashboard')
        } else {
          throw new Error('Failed to delete lead')
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete lead',
          variant: 'destructive',
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Lead not found</h2>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
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
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">{lead.fullName || 'Unnamed Lead'}</h1>
                  <Badge className={lead.status_code === 'new_lead' || lead.status_code === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {lead.status_code === 'new_lead' || lead.status_code === 'new' ? 'New Lead' : 'Existing Client'}
                  </Badge>
                  {lead.source && <Badge className="bg-purple-100 text-purple-800">{lead.source}</Badge>}
                  {lead.service && <Badge className="bg-orange-100 text-orange-800">{lead.service}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service
                    </label>
                    <Select
                      value={formData.service}
                      onValueChange={(value) => setFormData({ ...formData, service: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Time Buying">First Time Buying</SelectItem>
                        <SelectItem value="Refinancing">Refinancing</SelectItem>
                        <SelectItem value="Reverse Mortgage">Reverse Mortgage</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Select
                      value={formData.status_code}
                      onValueChange={(value) => setFormData({ ...formData, status_code: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_lead">
                          <div className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2" />
                            New Lead
                          </div>
                        </SelectItem>
                        <SelectItem value="new">
                          <div className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2" />
                            New (Tally Form)
                          </div>
                        </SelectItem>
                        <SelectItem value="existing_client">
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 mr-2" />
                            Existing Client
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={6}
                  placeholder="Add notes about this lead..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            <Card className="bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete a lead, there is no going back.
                </p>
                <Button variant="destructive" onClick={handleDelete} className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Lead
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
