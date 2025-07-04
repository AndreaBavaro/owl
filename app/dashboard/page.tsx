import { Navbar } from '@/components/ui/navbar'
import { Sidebar } from '@/components/ui/sidebar'
import { LeadDashboard } from '@/components/LeadDashboard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage all your mortgage leads in one place
              </p>
            </div>
            <Link href="/dashboard/new-lead">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </Link>
          </div>
          <LeadDashboard />
        </main>
      </div>
    </div>
  )
}
