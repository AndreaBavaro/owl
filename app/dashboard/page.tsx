import { Navbar } from '@/components/ui/navbar'
import { LeadDashboard } from '@/components/LeadDashboard'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <main className="flex-1 p-6">
          <LeadDashboard />
        </main>
      </div>
    </div>
  )
}
