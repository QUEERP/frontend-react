import { SettingsPageClient } from '@/components/dashboard/settings-page-client'
import { useParams } from "react-router-dom";

export default function SettingsPage() {
  const { businessId } = useParams()
  return <SettingsPageClient businessId={businessId as string} />
}
