'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createLead } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function NewLeadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  // Generate a UUID for display purposes only
  const [leadUuid] = useState(() => crypto.randomUUID())

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    loan_type: '',
    loan_amount: 0,
    notes: '',
    referral_name: '',
    source: '',
    status_code: 'new_lead',
    external_id: null,
    service: '',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const lead = await createLead(formData)
      if (lead) {
        toast({
          title: 'Success',
          description: 'Lead created successfully',
        })
        router.push('/dashboard')
      } else {
        throw new Error('Failed to create lead')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create lead',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
                <h1 className="text-2xl font-bold text-gray-900">New Lead</h1>
                <p className="text-sm text-gray-500">UUID: {leadUuid}</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Lead'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lead Information
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <Select
                value={formData.service}
                onValueChange={(value) =>
                  setFormData({ ...formData, service: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Time Buying">
                    First Time Buying
                  </SelectItem>
                  <SelectItem value="Refinancing">Refinancing</SelectItem>
                  <SelectItem value="Reverse Mortgage">
                    Reverse Mortgage
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Type
              </label>
              <Input
                value={formData.loan_type}
                onChange={(e) =>
                  setFormData({ ...formData, loan_type: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount
              </label>
              <Input
                type="number"
                value={formData.loan_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    loan_amount: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Name
              </label>
              <Input
                value={formData.referral_name}
                onChange={(e) =>
                  setFormData({ ...formData, referral_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <Input
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, status_code: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">New Lead</SelectItem>
                  <SelectItem value="existing_client">
                    Existing Client
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
