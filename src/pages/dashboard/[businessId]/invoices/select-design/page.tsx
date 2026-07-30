import { SelectDesignClient } from '@/components/dashboard/select-design-client'
import { Suspense } from 'react'
import { Loader2Icon } from 'lucide-react'
import { useParams } from "react-router-dom";

export default function SelectDesignPage() {
  const { businessId } = useParams()
  
  return (
    <Suspense fallback={
      <div className="flex h-svh items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-primary" />
      </div>
    }>
      <SelectDesignClient businessId={businessId as string} />
    </Suspense>
  )
}
