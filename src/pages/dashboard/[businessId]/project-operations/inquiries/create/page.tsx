import { CreateInquiryClient } from "./CreateInquiryClient";
import { useParams } from "react-router-dom";

export default function CreateInquiryPage() {
  const { businessId } = useParams();
  return <CreateInquiryClient businessId={businessId as string} />;
}
