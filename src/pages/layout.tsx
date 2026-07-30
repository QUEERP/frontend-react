import React from "react"
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CrudToastProvider } from '@/components/providers/crud-toast-provider'
import { SmoothScrolling } from '@/components/smooth-scrolling'
import {
  GlobalCrudLoadingOverlay,
  GlobalLoadingProvider,
} from '@/components/providers/global-loading-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div lang="en" data-scroll-behavior="smooth">
      <div className={`font-sans antialiased`}>
        <SmoothScrolling>
          <GlobalLoadingProvider>
            {children}
            <CrudToastProvider />
            <GlobalCrudLoadingOverlay />
            <Toaster position="top-right" richColors />
          </GlobalLoadingProvider>
        </SmoothScrolling>
      </div>
    </div>
  )
}
