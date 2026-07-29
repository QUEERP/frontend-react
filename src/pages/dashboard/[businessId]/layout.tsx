import React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardThemeProvider } from "@/components/dashboard/dashboard-theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { BusinessDataProvider } from "@/components/dashboard/business-data-provider"
import { DashboardLoadingGate } from "@/components/dashboard/dashboard-loading-gate"
import { DashboardGlobalHeader } from "@/components/dashboard/global-header"
import { useParams } from "react-router-dom";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { businessId } = useParams()
  return (
    <DashboardThemeProvider>
      <SidebarProvider>
        <BusinessDataProvider businessId={businessId}>
          <AppSidebar />
          <SidebarInset className="min-h-svh bg-muted/30">
            <DashboardGlobalHeader businessId={businessId} />
            <DashboardLoadingGate>{children}</DashboardLoadingGate>
          </SidebarInset>
        </BusinessDataProvider>
      </SidebarProvider>
      <Toaster />
    </DashboardThemeProvider>
  )
}
