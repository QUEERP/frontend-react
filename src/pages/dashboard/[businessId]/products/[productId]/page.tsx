import ProductForm from '@/components/dashboard/product-form';
import { useParams } from "react-router-dom";

export const metadata = {
  title: 'Product Details - Dashboard',
  description: 'View product details',
};

interface EditProductPageProps {
  params: Promise<{
    businessId: string;
    productId: string;
  }>;
}

export default function ViewProductPage() {
  const { productId } = useParams();
  return <ProductForm productId={productId} isViewMode={true} />;
}
