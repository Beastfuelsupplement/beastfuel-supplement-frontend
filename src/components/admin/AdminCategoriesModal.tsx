import React, { useState } from 'react';
import {
  X,
  Plus,
  Upload,
  Trash2,
  Edit2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  HardDrive,
  Link as LinkIcon,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { CategoryItem, api, formatImageUrl } from '@/lib/api';
import { toast } from 'sonner';

interface AdminCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (categoryName: string) => void;
}

export const AdminCategoriesModal: React.FC<AdminCategoriesModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const { data: categories = [], isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [featured, setFeatured] = useState(true);
  const [syncProducts, setSyncProducts] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsEditing(true);
    setSelectedCategoryId(null);
    setName('');
    setImage('');
    setDescription('');
    setOrder(categories.length + 1);
    setFeatured(true);
    setSyncProducts(true);
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setIsEditing(true);
    setSelectedCategoryId(cat._id);
    setName(cat.name || '');
    setImage(cat.image || '');
    setDescription(cat.description || '');
    setOrder(cat.order !== undefined ? cat.order : 0);
    setFeatured(cat.featured !== undefined ? Boolean(cat.featured) : true);
    setSyncProducts(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedCategoryId(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.imageUrl) {
        const formatted = formatImageUrl(res.imageUrl);
        setImage(formatted);
        toast.success(`Category image uploaded: ${file.name}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload category image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      image: image.trim(),
      description: description.trim(),
      featured,
      order: Number(order) || 0,
      syncProducts,
    };

    try {
      if (selectedCategoryId && !selectedCategoryId.startsWith('dynamic-')) {
        await updateCategoryMutation.mutateAsync({ id: selectedCategoryId, data: payload });
      } else {
        const created = await createCategoryMutation.mutateAsync(payload);
        if (onSelectCategory && created) {
          onSelectCategory(created.name);
        }
      }
      setIsEditing(false);
      setSelectedCategoryId(null);
    } catch (err) {
      // Errors handled in mutation
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (cat._id.startsWith('dynamic-')) {
      toast.error('This category is generated from active products. Edit or reassign those products to remove it.');
      return;
    }
    const count = cat.productCount || 0;
    const confirmMsg =
      count > 0
        ? `Category "${cat.name}" has ${count} active product(s). Are you sure you want to delete it? Products will retain their category name unless reassigned.`
        : `Are you sure you want to delete category "${cat.name}"?`;

    if (window.confirm(confirmMsg)) {
      try {
        await deleteCategoryMutation.mutateAsync({ id: cat._id, force: true });
      } catch (err) {
        // handled in mutation
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-card border border-border/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                Category & Cover Image Manager
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage supplement categories, cover photos, and the homepage "Shop by Category" section.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                size="sm"
                onClick={handleStartCreate}
                className="gap-1.5 font-bold uppercase tracking-wider text-xs"
              >
                <Plus className="w-4 h-4" /> Add Category
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              title="Close Dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            /* Category Edit / Create Form */
            <form onSubmit={handleSave} className="space-y-5 bg-secondary/30 p-5 rounded-2xl border border-border/80">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {selectedCategoryId ? 'Edit Category & Cover Image' : 'Add New Category'}
                </h3>
                <span className="text-xs text-muted-foreground">
                  Saved categories instantly appear on homepage and product filters
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Category Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Whey Protein, Pre-Workout, Mass Gainers"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Display Order (Sorting)
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    placeholder="1"
                    className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Lower numbers display first on the homepage</p>
                </div>
              </div>

              {/* Cover Image Upload / URL */}
              <div className="p-4 rounded-xl bg-background/80 border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary" /> Category Cover Photo
                  </label>
                  <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-lg border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        imageInputMode === 'upload'
                          ? 'bg-card text-foreground shadow-xs font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <HardDrive className="w-3 h-3 inline mr-1" /> Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        imageInputMode === 'url'
                          ? 'bg-card text-foreground shadow-xs font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3 inline mr-1" /> Image URL
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Live Preview */}
                  <div className="relative w-28 h-36 rounded-xl border border-border overflow-hidden bg-zinc-900 shrink-0 shadow-md flex flex-col justify-end p-2 text-center">
                    {image ? (
                      <>
                        <img
                          src={formatImageUrl(image)}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">
                            {name || 'Category'}
                          </p>
                          <span className="text-[8px] text-amber-400 font-medium">Shop Now →</span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
                        <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                        <span className="text-[10px]">No image set</span>
                      </div>
                    )}
                  </div>

                  {/* Input area */}
                  <div className="flex-1 w-full space-y-2">
                    {imageInputMode === 'upload' ? (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/60 hover:bg-secondary/40 transition-all p-3">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                        {isUploading ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-primary">
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                            <span className="text-xs font-semibold text-foreground">Click to upload category cover photo</span>
                            <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP up to 5MB</span>
                          </div>
                        )}
                      </label>
                    ) : (
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}

                    {image && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/60">
                        <span className="truncate max-w-[280px]">{image}</span>
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="text-destructive hover:underline font-semibold ml-2 shrink-0"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Category Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Short description highlighting supplement benefits..."
                  className="w-full p-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Featured toggle & Sync products */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-secondary/40 rounded-xl border border-border/60">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Feature on Homepage</span>
                    <span className="text-[11px] text-muted-foreground">
                      Display in the "Shop by Category" section on the main store page
                    </span>
                  </div>
                </label>

                {selectedCategoryId && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncProducts}
                      onChange={(e) => setSyncProducts(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Sync name to existing products
                    </span>
                  </label>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending || isUploading}
                  className="font-bold gap-1.5"
                >
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Save Category
                </Button>
              </div>
            </form>
          ) : null}

          {/* Categories Grid / Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                All Active Categories ({categories.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                Click "Edit" on any category to change its cover photo or name
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-semibold">Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border p-6">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-sm">No categories found</p>
                <p className="text-xs mt-1">Click "+ Add Category" above to create your first supplement category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const hasImage = Boolean(cat.image);
                  return (
                    <div
                      key={cat._id}
                      className="group relative flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80 hover:border-primary/50 shadow-xs hover:shadow-md transition-all"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-14 h-16 rounded-lg bg-zinc-900 border border-border overflow-hidden shrink-0">
                        {hasImage ? (
                          <img
                            src={formatImageUrl(cat.image)}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary text-muted-foreground text-[10px] font-semibold text-center p-1">
                            <ImageIcon className="w-4 h-4 opacity-40 mb-0.5" />
                            <span>No Pic</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground truncate">{cat.name}</h4>
                          {cat.isDynamic && (
                            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                              From Products
                            </span>
                          )}
                          {cat.featured && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                              Home
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cat.productCount !== undefined ? `${cat.productCount} product(s)` : '0 products'}
                        </p>
                        {cat.description && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{cat.description}</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEdit(cat)}
                          className="h-8 w-8 hover:bg-secondary text-foreground hover:text-primary rounded-lg"
                          title="Edit Category & Image"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {!cat.isDynamic && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cat)}
                            className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Categories configured here automatically sync to the homepage "Shop by Category" section.</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesModal;
