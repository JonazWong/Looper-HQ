import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Footer } from "./footer"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 px-4">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
