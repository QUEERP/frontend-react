import ProductForm from '@/components/dashboard/product-form';

export const metadata = {
  title: 'New Product - Dashboard',
  description: 'Create a new product',
};

export default function AddProductPage() {
  return <ProductForm />;
}
