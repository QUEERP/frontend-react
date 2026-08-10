import React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardThemeProvider } from "@/components/dashboard/dashboard-theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { BusinessDataProvider } from "@/components/dashboard/business-data-provider"
import { DashboardLoadingGate } from "@/components/dashboard/dashboard-loading-gate"
import { DashboardGlobalHeader } from "@/components/dashboard/global-header"
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getCookie } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { businessId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) {
      navigate('/signin')
    }
  }, [location.pathname, navigate])

  return (
    <DashboardThemeProvider>
      <SidebarProvider>
        <BusinessDataProvider businessId={businessId as string}>
          <AppSidebar />
          <SidebarInset className="min-h-svh bg-muted/30">
            <DashboardGlobalHeader businessId={businessId as string} />
            <DashboardLoadingGate>{children}</DashboardLoadingGate>
          </SidebarInset>
        </BusinessDataProvider>
      </SidebarProvider>
      <Toaster />
    </DashboardThemeProvider>
  )
}
