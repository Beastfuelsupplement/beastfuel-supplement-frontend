import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ProductModal from '@/components/admin/ProductModal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { Product } from '@/store/cartStore';
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/currency';

const AdminProducts = () => {
  const { data: products = [], isLoading } = useProducts(false);
  const addProductMutation = useAddProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData && productData.id) {
      updateProductMutation.mutate({ id: productData.id, ...productData });
    } else {
      addProductMutation.mutate(productData);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirm({ isOpen: true, product });
  };

  const confirmDelete = () => {
    if (deleteConfirm.product) {
      deleteProductMutation.mutate(deleteConfirm.product.id);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-display text-3xl md:text-4xl bg-gradient-to-r from-amber-600 via-violet-600 to-rose-600 dark:from-amber-400 dark:via-violet-400 dark:to-rose-400 bg-clip-text text-transparent">PRODUCTS</h1>
            <p className="text-muted-foreground">Manage your product inventory ({products.length} products)</p>
          </div>
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm border border-amber-500/20 rounded-lg overflow-hidden shadow-lg"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-violet-500/10">
                  <th className="text-left p-4 text-sm font-semibold text-amber-600 dark:text-amber-400">Product</th>
                  <th className="text-left p-4 text-sm font-semibold text-amber-600 dark:text-amber-400">Category</th>
                  <th className="text-left p-4 text-sm font-semibold text-amber-600 dark:text-amber-400">Price</th>
                  <th className="text-left p-4 text-sm font-semibold text-amber-600 dark:text-amber-400">Stock</th>
                  <th className="text-left p-4 text-sm font-semibold text-amber-600 dark:text-amber-400">Weight</th>
                  <th className="text-left p-4 text-sm font-semibold text-amber-600 dark:text-amber-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border last:border-0 hover:bg-amber-500/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.flavor && (
                            <p className="text-sm text-muted-foreground">{product.flavor}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(product.price)}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        product.stock === 0 
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30' 
                          : product.stock <= 10 
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{product.weight}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteProduct(product)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, product: null })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm.product?.name}"? This action cannot be undone.`}
      />
    </AdminLayout>
  );
};

export default AdminProducts;
