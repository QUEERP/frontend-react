import ProductForm from '@/components/dashboard/product-form';
import { useParams } from "react-router-dom";

export const metadata = {
  title: 'Edit Product - Dashboard',
  description: 'Edit product details',
};

interface EditProductPageProps {
  params: Promise<{
    businessId: string;
    productId: string;
  }>;
}

export default function EditProductPage() {
  const { productId } = useParams();
  return <ProductForm productId={productId} />;
}
