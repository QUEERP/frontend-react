import { ContactsPageClient } from '@/components/contacts/contacts-page-client'
import { useParams } from "react-router-dom";

export default function ContactsPage() {
  const { businessId } = useParams()
  return <ContactsPageClient businessId={businessId as string} />
}
