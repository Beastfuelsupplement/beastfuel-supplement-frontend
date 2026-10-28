import React, { useState } from 'react';
import {
  X,
  Plus,
  Upload,
  Trash2,
  Edit2,
  Globe,
  Award,
  ExternalLink,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  HardDrive,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '@/hooks/useBrands';
import { BrandItem, api, formatImageUrl } from '@/lib/api';
import { toast } from 'sonner';

interface AdminBrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBrand?: (brandName: string) => void;
}

export const AdminBrandsModal: React.FC<AdminBrandsModalProps> = ({
  isOpen,
  onClose,
  onSelectBrand,
}) => {
  const { data: brands = [], isLoading } = useBrands();
  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsEditing(true);
    setSelectedBrandId(null);
    setName('');
    setLogo('');
    setCountryOfOrigin('');
    setDescription('');
    setWebsite('');
    setFeatured(false);
  };

  const handleStartEdit = (b: BrandItem) => {
    setIsEditing(true);
    setSelectedBrandId(b._id);
    setName(b.name || '');
    setLogo(b.logo || '');
    setCountryOfOrigin(b.countryOfOrigin || '');
    setDescription(b.description || '');
    setWebsite(b.website || '');
    setFeatured(Boolean(b.featured));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedBrandId(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.imageUrl) {
        const formatted = formatImageUrl(res.imageUrl);
        setLogo(formatted);
        toast.success(`Logo uploaded: ${file.name}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      logo: logo.trim(),
      countryOfOrigin: countryOfOrigin.trim(),
      description: description.trim(),
      website: website.trim(),
      featured,
    };

    try {
      if (selectedBrandId && !selectedBrandId.startsWith('dynamic-')) {
        await updateBrandMutation.mutateAsync({ id: selectedBrandId, data: payload });
      } else {
        const created = await createBrandMutation.mutateAsync(payload);
        if (onSelectBrand && created) {
          onSelectBrand(created.name);
        }
      }
      setIsEditing(false);
      setSelectedBrandId(null);
    } catch (err) {
      // Errors handled in mutation
    }
  };

  const handleDelete = async (b: BrandItem) => {
    const count = b.productCount || 0;
    const confirmMsg = count > 0
      ? `Brand "${b.name}" is currently assigned to ${count} active product(s). Deleting it will permanently remove it from the store, dropdowns, and clear it from these products. Are you sure you want to permanently delete it?`
      : `Are you sure you want to permanently delete brand "${b.name}"?`;

    if (window.confirm(confirmMsg)) {
      try {
        await deleteBrandMutation.mutateAsync({ id: b._id, force: true });
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
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                Brand & Logo Manager
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage all official brands, manufacturer logos, and storefront brand catalog.
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
                <Plus className="w-4 h-4" /> Add Brand
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
            /* Brand Edit / Create Form */
            <form onSubmit={handleSave} className="space-y-5 bg-secondary/30 p-5 rounded-2xl border border-border/80">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {selectedBrandId ? 'Edit Brand & Logo' : 'Add New Brand & Logo'}
                </h3>
                <span className="text-xs text-muted-foreground">
                  Saved brands immediately appear on the Brands page
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Brand Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Optimum Nutrition, MuscleTech, Ghost"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Country of Origin */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    placeholder="e.g. USA, Germany, United Kingdom, Sri Lanka"
                    className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Brand Logo Upload or URL */}
              <div className="p-4 rounded-xl bg-background border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Brand Logo
                  </label>
                  <div className="flex rounded-lg border border-border p-0.5 bg-secondary/50 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setLogoInputMode('upload')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                        logoInputMode === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <HardDrive className="w-3 h-3 inline mr-1" /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoInputMode('url')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                        logoInputMode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3 inline mr-1" /> Image URL
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview */}
                  <div className="w-24 h-24 rounded-xl bg-white/95 dark:bg-zinc-900 border border-border flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-inner">
                    {logo ? (
                      <img
                        src={formatImageUrl(logo)}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain filter contrast-125"
                      />
                    ) : (
                      <div className="text-[10px] text-muted-foreground text-center font-bold">
                        No Logo
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    {logoInputMode === 'upload' ? (
                      <div>
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border hover:border-primary rounded-xl cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition-all text-center">
                          {isUploading ? (
                            <div className="flex items-center gap-2 text-xs text-primary font-bold">
                              <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                              <span className="text-xs font-semibold text-foreground">
                                Click or drag brand logo here (PNG, SVG, WebP)
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                Transparent PNG/SVG recommended for clean display
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}

                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        className="text-[11px] text-destructive hover:underline font-semibold"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Brand Description / Slogan
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. The World's #1 selling whey protein brand, setting the Gold Standard in sports nutrition."
                  className="w-full p-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="brandFeatured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="brandFeatured" className="text-xs font-bold uppercase tracking-wider text-foreground cursor-pointer">
                  Featured Top Brand (highlighted on Brands showcase page)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="text-xs uppercase font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                  className="gap-2 text-xs uppercase font-bold"
                >
                  {(createBrandMutation.isPending || updateBrandMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Save Brand
                </Button>
              </div>
            </form>
          ) : null}

          {/* Brands List Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                All Brands in Database ({brands.length})
              </span>
              <a
                href="/brands"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View Public Brands Page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Loading brands...
              </div>
            ) : brands.length === 0 ? (
              <div className="p-8 text-center bg-secondary/20 rounded-xl border border-border text-muted-foreground text-xs">
                No brands configured yet. Click "Add Brand" above to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {brands.map((b) => (
                  <div
                    key={b._id}
                    className="p-3.5 rounded-xl bg-card border border-border/80 flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-white/95 dark:bg-zinc-900 border border-border flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner">
                        {b.logo ? (
                          <img
                            src={formatImageUrl(b.logo)}
                            alt={b.name}
                            className="max-h-full max-w-full object-contain filter contrast-125"
                          />
                        ) : (
                          <span className="text-xs font-black text-foreground">
                            {b.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {b.name}
                          </h4>
                          {b.featured && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-500 font-black">
                              Top
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {b.countryOfOrigin || 'International'}
                        </div>
                        <div className="text-[11px] font-semibold text-primary mt-0.5">
                          {b.productCount || 0} product(s) linked
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1">
                      {onSelectBrand && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectBrand(b.name);
                            onClose();
                          }}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Select for Product
                        </button>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Edit Brand"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-card/95 flex justify-end">
          <Button variant="outline" onClick={onClose} className="text-xs uppercase font-bold">
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AdminBrandsModal;
