import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Globe,
  Award,
  Layers,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  PackageCheck,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  FolderOpen,
  Link as LinkIcon,
  HardDrive,
  FileImage,
  FolderUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductVariant } from '@/store/cartStore';
import { categories, brands } from '@/data/products';
import { api, API_BASE_URL, formatImageUrl } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  product?: Product | null;
  isSubmitting?: boolean;
}

const PRESET_FLAVORS = [
  'Chocolate',
  'Vanilla',
  'Strawberry',
  'Cookies & Cream',
  'Unflavored',
  'Blue Raspberry',
  'Fruit Punch',
  'Watermelon',
  'Banana',
  'Caramel',
];

const PRESET_WEIGHTS = ['300g', '500g', '1kg', '2kg', '2.5kg', '4kg', '5kg'];

const PRESET_COUNTRIES = [
  'USA',
  'Germany',
  'United Kingdom',
  'Canada',
  'Australia',
  'New Zealand',
  'Japan',
  'Netherlands',
];

export interface WeightPriceConfig {
  weight: string;
  price: string;
}

export interface VariantCell {
  weight: string;
  flavor: string;
  price: number;
  stock: number;
  sku: string;
}

const STEPS = [
  { id: 1, title: 'Basic Info', desc: 'Name, Brand, Category, Origin' },
  { id: 2, title: 'Weights & Pricing', desc: 'Weight options & price' },
  { id: 3, title: 'Flavors & Stock', desc: 'Flavor inventory matrix' },
  { id: 4, title: 'Images', desc: 'Primary & gallery images' },
  { id: 5, title: 'Review & Publish', desc: 'Verify and save product' },
];

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  isSubmitting = false,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ================= STEP 1: BASIC INFO =================
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [description, setDescription] = useState('');

  // ================= STEP 2: WEIGHTS & PRICING =================
  const [weightConfigs, setWeightConfigs] = useState<WeightPriceConfig[]>([
    { weight: '1kg', price: '7000' },
    { weight: '2kg', price: '12000' },
  ]);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [newWeightPriceInput, setNewWeightPriceInput] = useState('');

  // ================= STEP 3: FLAVORS & INVENTORY MATRIX =================
  const [flavors, setFlavors] = useState<string[]>(['Chocolate', 'Vanilla']);
  const [newFlavorInput, setNewFlavorInput] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  // Map key: `${weight}:::${flavor}` -> stock (number)
  const [stockMatrix, setStockMatrix] = useState<Record<string, number>>({
    '1kg:::Chocolate': 0,
    '1kg:::Vanilla': 0,
    '2kg:::Chocolate': 0,
    '2kg:::Vanilla': 0,
  });

  // ================= STEP 4: IMAGES =================
  const [primaryImageSource, setPrimaryImageSource] = useState<'local' | 'url'>('local');
  const [galleryImageSource, setGalleryImageSource] = useState<'local' | 'url'>('local');
  const [primaryImage, setPrimaryImage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [primaryFileName, setPrimaryFileName] = useState<string | null>(null);
  const [primaryFileSize, setPrimaryFileSize] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDraggingPrimary, setIsDraggingPrimary] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Step-level validation tracking
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);

  // Brand and Category list
  const existingBrands = useMemo(() => Array.from(new Set(brands.filter(b => b !== 'All'))), []);
  const existingCategories = useMemo(() => Array.from(new Set(categories.filter(c => c !== 'All'))), []);

  // Initialize or reset form state when modal opens or product changes
  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      setName(product.name || '');
      setBrand(product.brand || '');
      setCategory(product.category || '');
      setCountryOfOrigin(product.countryOfOrigin || '');
      setDescription(product.description || '');
      setPrimaryImage(product.image || '');
      setImagePreview(product.image ? formatImageUrl(product.image) : null);
      setPrimaryFileName(null);
      setPrimaryFileSize(null);
      if (product.image?.startsWith('http://') || product.image?.startsWith('https://')) {
        setPrimaryImageSource('url');
      } else {
        setPrimaryImageSource('local');
      }
      setGalleryImages(
        product.images
          ? product.images.filter(img => img && img !== product.image).map(img => formatImageUrl(img))
          : []
      );

      // Extract weights and prices
      const wList = product.weights && product.weights.length > 0
        ? product.weights
        : product.weight
        ? [product.weight]
        : ['1kg'];

      const fList = product.flavors && product.flavors.length > 0
        ? product.flavors
        : product.flavor
        ? [product.flavor]
        : ['Standard'];

      setFlavors(fList);

      // Build weight configs from variants or fallback
      const wConfigs: WeightPriceConfig[] = wList.map(w => {
        const matchingVariant = product.variants?.find(v => v.weight === w);
        const p = matchingVariant?.price ?? product.price ?? 5000;
        return {
          weight: w,
          price: p.toString(),
        };
      });
      setWeightConfigs(wConfigs.length > 0 ? wConfigs : [{ weight: '1kg', price: '7000' }]);
      setLowStockThreshold(product.lowStockThreshold !== undefined ? Number(product.lowStockThreshold) : 5);

      // Populate stock matrix
      const matrix: Record<string, number> = {};
      wList.forEach(w => {
        fList.forEach(f => {
          const key = `${w}:::${f}`;
          const v = product.variants?.find(
            item => item.weight === w && (item.flavor === f || !item.flavor)
          );
          matrix[key] = v?.stock ?? 0;
        });
      });
      setStockMatrix(matrix);
    } else {
      // Clean state for adding new product
      setName('');
      setBrand('');
      setCategory('');
      setCountryOfOrigin('USA');
      setDescription('');
      setLowStockThreshold(5);
      setWeightConfigs([
        { weight: '500g', price: '4000' },
        { weight: '1kg', price: '7000' },
        { weight: '2kg', price: '12000' },
      ]);
      setFlavors(['Chocolate', 'Vanilla', 'Strawberry']);
      // All variant unit stocks default to 0
      setStockMatrix({
        '500g:::Chocolate': 0,
        '500g:::Vanilla': 0,
        '500g:::Strawberry': 0,
        '1kg:::Chocolate': 0,
        '1kg:::Vanilla': 0,
        '1kg:::Strawberry': 0,
        '2kg:::Chocolate': 0,
        '2kg:::Vanilla': 0,
        '2kg:::Strawberry': 0,
      });
      setPrimaryImage('');
      setImagePreview(null);
      setPrimaryFileName(null);
      setPrimaryFileSize(null);
      setPrimaryImageSource('local');
      setGalleryImageSource('local');
      setGalleryImages([]);
    }

    setCurrentStep(1);
    setStepErrors({});
    setIsSubmittingInternal(false);
  }, [isOpen, product]);

  // Compute full compiled variants list
  const compiledVariants = useMemo<VariantCell[]>(() => {
    const list: VariantCell[] = [];
    const bCode = (brand || 'BF').substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const nCode = (name || 'PRD').substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');

    weightConfigs.forEach(wc => {
      const priceNum = parseFloat(wc.price) || 0;
      flavors.forEach(fl => {
        const key = `${wc.weight}:::${fl}`;
        const stockNum = stockMatrix[key] !== undefined ? stockMatrix[key] : 0;
        const wCode = wc.weight.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const flCode = fl.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sku = `${bCode}-${nCode}-${wCode}-${flCode}`;

        list.push({
          weight: wc.weight,
          flavor: fl,
          price: priceNum,
          stock: stockNum,
          sku,
        });
      });
    });

    return list;
  }, [weightConfigs, flavors, stockMatrix, brand, name]);

  const totalCalculatedStock = useMemo(() => {
    return compiledVariants.reduce((sum, v) => sum + v.stock, 0);
  }, [compiledVariants]);

  const startingPrice = useMemo(() => {
    const prices = weightConfigs.map(wc => parseFloat(wc.price)).filter(p => !isNaN(p) && p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [weightConfigs]);

  // ================= STEP VALIDATION =================
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!name.trim()) errors.name = 'Product name is required.';
      if (!brand.trim()) errors.brand = 'Brand is required.';
      if (!category.trim()) errors.category = 'Category is required.';
      if (!countryOfOrigin.trim()) errors.countryOfOrigin = 'Country of origin is strictly required.';
      if (!description.trim()) errors.description = 'Product description is required.';
    }

    if (step === 2) {
      if (weightConfigs.length === 0) {
        errors.weights = 'Please configure at least one weight option.';
      } else {
        const seen = new Set<string>();
        weightConfigs.forEach((wc, idx) => {
          if (!wc.weight.trim()) {
            errors[`weight_${idx}`] = 'Weight name cannot be empty.';
          } else if (seen.has(wc.weight.trim().toLowerCase())) {
            errors[`weight_${idx}`] = `Duplicate weight "${wc.weight}". Weights must be unique.`;
          } else {
            seen.add(wc.weight.trim().toLowerCase());
          }

          const p = parseFloat(wc.price);
          if (isNaN(p) || p <= 0) {
            errors[`price_${idx}`] = 'Price must be greater than 0.';
          }
        });
      }
    }

    if (step === 3) {
      if (flavors.length === 0) {
        errors.flavors = 'Please add at least one flavor option.';
      } else {
        // Validate stock inputs
        weightConfigs.forEach(wc => {
          flavors.forEach(fl => {
            const key = `${wc.weight}:::${fl}`;
            const s = stockMatrix[key];
            if (s === undefined || isNaN(s) || s < 0) {
              errors[key] = 'Stock cannot be negative.';
            }
          });
        });
      }
    }

    if (step === 4) {
      if (!primaryImage.trim()) {
        errors.image = 'A primary product image is required. Upload an image or enter a valid URL.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepErrors({});
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast.error('Please complete all required fields on this step before proceeding.');
    }
  };

  const handleBack = () => {
    setStepErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ================= WEIGHT CONTROLS =================
  const handleAddWeight = () => {
    const w = newWeightInput.trim();
    const p = newWeightPriceInput.trim();
    if (!w) {
      toast.error('Enter a weight label (e.g. 1kg, 2kg, 500g)');
      return;
    }
    if (weightConfigs.some(wc => wc.weight.toLowerCase() === w.toLowerCase())) {
      toast.error(`Weight "${w}" already exists.`);
      return;
    }
    const priceNum = parseFloat(p);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid selling price greater than 0.');
      return;
    }

    setWeightConfigs([...weightConfigs, { weight: w, price: p }]);
    setNewWeightInput('');
    setNewWeightPriceInput('');

    // Prepopulate matrix for this new weight across existing flavors (default to 0)
    const updated = { ...stockMatrix };
    flavors.forEach(fl => {
      updated[`${w}:::${fl}`] = 0;
    });
    setStockMatrix(updated);
    toast.success(`Added weight option: ${w} at Rs. ${p}`);
  };

  const handleRemoveWeight = (wToRemove: string) => {
    if (weightConfigs.length <= 1) {
      toast.error('Product must have at least one weight option.');
      return;
    }
    setWeightConfigs(weightConfigs.filter(wc => wc.weight !== wToRemove));
  };

  const handleUpdateWeightPrice = (index: number, newPrice: string) => {
    setWeightConfigs(prev =>
      prev.map((wc, i) => (i === index ? { ...wc, price: newPrice } : wc))
    );
  };

  // ================= FLAVOR CONTROLS =================
  const handleAddFlavor = (val: string) => {
    const fl = val.trim();
    if (!fl) return;
    if (flavors.some(f => f.toLowerCase() === fl.toLowerCase())) {
      toast.error(`Flavor "${fl}" already exists.`);
      return;
    }

    setFlavors([...flavors, fl]);
    setNewFlavorInput('');

    // Prepopulate matrix for this flavor across existing weights (default to 0)
    const updated = { ...stockMatrix };
    weightConfigs.forEach(wc => {
      updated[`${wc.weight}:::${fl}`] = 0;
    });
    setStockMatrix(updated);
  };

  const handleRemoveFlavor = (flToRemove: string) => {
    if (flavors.length <= 1) {
      toast.error('Product must have at least one flavor option.');
      return;
    }
    setFlavors(flavors.filter(f => f !== flToRemove));
  };

  const handleUpdateStockCell = (weight: string, flavor: string, value: string) => {
    // Strip leading zeros if more than 1 digit (e.g. "010" -> "10", "05" -> "5")
    const stripped = value.replace(/^0+(?=\d)/, '');
    const num = stripped === '' ? 0 : parseInt(stripped, 10);
    const validNum = isNaN(num) || num < 0 ? 0 : num;
    setStockMatrix(prev => ({
      ...prev,
      [`${weight}:::${flavor}`]: validNum,
    }));
  };

  const handleBulkSetStock = (qty: number) => {
    const updated: Record<string, number> = {};
    weightConfigs.forEach(wc => {
      flavors.forEach(fl => {
        updated[`${wc.weight}:::${fl}`] = qty;
      });
    });
    setStockMatrix(updated);
    toast.success(`Set stock of all variants to ${qty} units.`);
  };

  // ================= IMAGE COMPRESSION & UPLOAD =================
  const compressImageFile = (file: File, maxDim = 1200, quality = 0.82): Promise<{ file: File; dataUrl: string }> => {
    return new Promise((resolve) => {
      // SVGs/GIFs pass through
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, dataUrl: (reader.result as string) || '' });
        reader.onerror = () => resolve({ file, dataUrl: '' });
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ file, dataUrl: (e.target?.result as string) || '' });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outMime, quality);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const optFile = new File([blob], file.name, {
                  type: outMime,
                  lastModified: Date.now(),
                });
                resolve({ file: optFile, dataUrl });
              } else {
                resolve({ file, dataUrl: dataUrl || ((e.target?.result as string) || '') });
              }
            },
            outMime,
            quality
          );
        };
        img.onerror = () => {
          resolve({ file, dataUrl: (e.target?.result as string) || '' });
        };
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve({ file, dataUrl: '' });
      reader.readAsDataURL(file);
    });
  };

  const handlePrimaryFileSelect = async (file?: File) => {
    if (!file) return;

    // Validate format
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PNG, JPG, JPEG, WEBP or GIF formats are allowed.');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    setPrimaryFileName(file.name);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    setPrimaryFileSize(sizeStr);

    setIsUploading(true);
    setUploadProgress(`Processing "${file.name}"...`);

    try {
      // Compress and get instant local preview
      const { file: optimizedFile, dataUrl: compressedDataUrl } = await compressImageFile(file);
      if (compressedDataUrl) {
        setImagePreview(compressedDataUrl);
      }

      // Attempt persistent upload to backend storage
      try {
        setUploadProgress(`Uploading "${file.name}" to storage...`);
        const res = await api.uploadImage(optimizedFile);
        if (res && res.imageUrl) {
          const formatted = formatImageUrl(res.imageUrl);
          setPrimaryImage(formatted);
          setImagePreview(formatted);
          toast.success(`"${file.name}" uploaded successfully!`);
          return;
        }
      } catch (uploadErr) {
        console.warn('Server upload unavailable, using optimized local image data:', uploadErr);
      }

      // Offline / fallback: save compressed data URL so payload stays lightweight
      if (compressedDataUrl) {
        setPrimaryImage(compressedDataUrl);
        toast.success(`"${file.name}" loaded successfully!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process image file');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleGalleryFilesSelect = async (fileList?: FileList | File[]) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Processing ${files.length} image(s)...`);

    let addedCount = 0;
    for (const file of files) {
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) {
        toast.error(`Skipped "${file.name}": Unsupported format.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Skipped "${file.name}": Exceeds 10MB limit.`);
        continue;
      }

      try {
        const { file: optimizedFile, dataUrl: compressedDataUrl } = await compressImageFile(file);
        let finalImage = '';
        try {
          const res = await api.uploadImage(optimizedFile);
          if (res?.imageUrl) {
            finalImage = formatImageUrl(res.imageUrl);
          }
        } catch {
          // Fallback to compressed data URL
        }

        if (!finalImage) {
          finalImage = compressedDataUrl;
        }

        if (finalImage) {
          setGalleryImages(prev => [...prev, finalImage]);
          addedCount++;
        }
      } catch (err: any) {
        toast.error(`Error loading "${file.name}": ${err.message}`);
      }
    }

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} image(s) to gallery!`);
    }
    setIsUploading(false);
    setUploadProgress(null);
  };

  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages([...galleryImages, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };

  // ================= FINAL SUBMISSION =================
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Verify all steps
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        toast.error(`Please correct errors in Step ${s}: ${STEPS[s - 1].title}`);
        return;
      }
    }

    setIsSubmittingInternal(true);

    const compiled: ProductVariant[] = compiledVariants.map(v => ({
      weight: v.weight,
      flavor: v.flavor,
      price: v.price,
      stock: v.stock,
      sku: v.sku,
    }));

    const allImagesList = Array.from(
      new Set([primaryImage.trim(), ...galleryImages.map(img => img.trim()).filter(Boolean)])
    );

    const productPayload: any = {
      ...(product?.id && { id: product.id }),
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      countryOfOrigin: countryOfOrigin.trim(),
      description: description.trim(),
      image: primaryImage.trim(),
      images: allImagesList,
      price: startingPrice,
      stock: totalCalculatedStock,
      lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 5),
      weight: weightConfigs[0]?.weight || '1kg',
      weights: weightConfigs.map(wc => wc.weight),
      flavor: flavors[0] || 'Standard',
      flavors: flavors,
      variants: compiled,
      isActive: true,
    };

    try {
      onSave(productPayload);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
      setIsSubmittingInternal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* ================= MODAL HEADER & STEP PROGRESS ================= */}
        <div className="border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-primary flex items-center justify-center text-primary-foreground shadow-md font-black">
                BF
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  {product ? 'EDIT SUPPLEMENT PRODUCT' : 'ADD NEW SUPPLEMENT PRODUCT'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep} of 5: {STEPS[currentStep - 1].desc}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              title="Close Dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {STEPS.map(step => {
              const isPassed = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    // Allow clicking previous steps or next step if valid
                    if (step.id < currentStep) {
                      setCurrentStep(step.id);
                    } else if (step.id === currentStep + 1 && validateStep(currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`flex flex-col text-left py-2 px-2.5 sm:px-3 rounded-xl border transition-all text-xs font-semibold ${
                    isCurrent
                      ? 'bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/30'
                      : isPassed
                      ? 'bg-secondary/60 border-border text-foreground hover:bg-secondary'
                      : 'bg-background/40 border-border/50 text-muted-foreground opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      Step {step.id}
                    </span>
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                  <span className="truncate text-[11px] sm:text-xs font-bold">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= MODAL BODY / FORM STEPS ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* STEP 1: BASIC PRODUCT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground font-semibold">Step 1: Basic Information</strong> — Provide core supplement identity. All fields in this step are mandatory, including Country of Origin.
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 100% Whey Gold Standard Isolate"
                  className={`w-full h-11 px-4 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    stepErrors.name ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                  }`}
                />
                {stepErrors.name && (
                  <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {stepErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Brand <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={existingBrands.includes(brand) ? brand : 'custom'}
                      onChange={e => {
                        if (e.target.value !== 'custom') {
                          setBrand(e.target.value);
                        }
                      }}
                      className="h-11 px-3 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary w-2/5 cursor-pointer"
                    >
                      <option value="">-- Preset --</option>
                      {existingBrands.map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>

                    <input
                      type="text"
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      placeholder="Brand name"
                      className={`h-11 px-3 bg-background border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary flex-1 ${
                        stepErrors.brand ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                      }`}
                    />
                  </div>
                  {stepErrors.brand && (
                    <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {stepErrors.brand}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={existingCategories.includes(category) ? category : 'custom'}
                      onChange={e => {
                        if (e.target.value !== 'custom') {
                          setCategory(e.target.value);
                        }
                      }}
                      className="h-11 px-3 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary w-2/5 cursor-pointer"
                    >
                      <option value="">-- Preset --</option>
                      {existingCategories.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>

                    <input
                      type="text"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="Category name"
                      className={`h-11 px-3 bg-background border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary flex-1 ${
                        stepErrors.category ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                      }`}
                    />
                  </div>
                  {stepErrors.category && (
                    <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {stepErrors.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Country of Origin (MANDATORY) */}
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Country of Origin <span className="text-destructive font-black">* STRICTLY REQUIRED</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Manufacturing country is prominently displayed to customers
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={PRESET_COUNTRIES.includes(countryOfOrigin) ? countryOfOrigin : 'custom'}
                    onChange={e => {
                      if (e.target.value !== 'custom') {
                        setCountryOfOrigin(e.target.value);
                      }
                    }}
                    className="h-11 px-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary sm:w-48 cursor-pointer"
                  >
                    <option value="">-- Select Country --</option>
                    {PRESET_COUNTRIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="custom">Other Country...</option>
                  </select>

                  <input
                    type="text"
                    value={countryOfOrigin}
                    onChange={e => setCountryOfOrigin(e.target.value)}
                    placeholder="e.g. USA, Germany, United Kingdom, Canada, Australia"
                    className={`h-11 px-4 bg-background border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary flex-1 ${
                      stepErrors.countryOfOrigin ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                    }`}
                  />
                </div>

                {/* Country Quick Select Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold mr-1">Quick Select:</span>
                  {PRESET_COUNTRIES.map(country => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => setCountryOfOrigin(country)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        countryOfOrigin === country
                          ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                          : 'bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>

                {stepErrors.countryOfOrigin && (
                  <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {stepErrors.countryOfOrigin}
                  </p>
                )}
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Product Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Comprehensive description of the supplement product, nutritional highlights, key ingredients, usage instructions..."
                  className={`w-full p-3.5 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none ${
                    stepErrors.description ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                  }`}
                />
                {stepErrors.description && (
                  <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {stepErrors.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCT WEIGHTS & PRICING */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Critical Business Rule Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground space-y-1">
                  <p className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    CRITICAL BUSINESS RULE: Price Depends On Product and Weight Only
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Flavor must NEVER change the price. For each weight, enter one selling price. All flavors of the same product and weight automatically use this same price.
                  </p>
                </div>
              </div>

              {/* Add New Weight Box */}
              <div className="p-4 bg-secondary/30 rounded-xl border border-border/70 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  + Add Weight Option & Selling Price
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={newWeightInput}
                      onChange={e => setNewWeightInput(e.target.value)}
                      placeholder="Weight label (e.g. 500g, 1kg, 2kg)"
                      className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={newWeightPriceInput}
                        onChange={e => setNewWeightPriceInput(e.target.value)}
                        placeholder="Price for this weight"
                        className="w-full h-10 pl-10 pr-3 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      onClick={handleAddWeight}
                      className="w-full h-10 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Weight
                    </Button>
                  </div>
                </div>

                {/* Preset Weight Quick Add Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-semibold mr-1">Quick Weight Presets:</span>
                  {PRESET_WEIGHTS.map(pw => {
                    const alreadyAdded = weightConfigs.some(wc => wc.weight.toLowerCase() === pw.toLowerCase());
                    return (
                      <button
                        key={pw}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => {
                          setNewWeightInput(pw);
                          setNewWeightPriceInput('5000');
                        }}
                        className="text-[10px] px-2 py-1 bg-background hover:bg-secondary rounded-lg border border-border disabled:opacity-40 font-medium transition-colors"
                      >
                        + {pw}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Configured Weights & Prices Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-background">
                <div className="bg-secondary/70 px-4 py-3 text-xs font-bold text-foreground grid grid-cols-12 gap-3 border-b border-border">
                  <span className="col-span-5">Weight Option</span>
                  <span className="col-span-5">Selling Price (Rs.)</span>
                  <span className="col-span-2 text-right">Actions</span>
                </div>

                <div className="divide-y divide-border/60">
                  {weightConfigs.map((wc, index) => {
                    const hasWeightErr = stepErrors[`weight_${index}`];
                    const hasPriceErr = stepErrors[`price_${index}`];

                    return (
                      <div key={index} className="px-4 py-3 grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5">
                          <span className="font-bold text-sm text-foreground px-3 py-1 bg-secondary rounded-lg border border-border/70 inline-block">
                            {wc.weight}
                          </span>
                          {hasWeightErr && (
                            <p className="text-[10px] text-destructive mt-1 font-medium">{hasWeightErr}</p>
                          )}
                        </div>

                        <div className="col-span-5">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                              Rs.
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={wc.price}
                              onChange={e => handleUpdateWeightPrice(index, e.target.value)}
                              className={`w-full h-9 pl-10 pr-3 bg-secondary/50 border rounded-lg text-xs font-bold text-foreground focus:ring-1 focus:ring-primary ${
                                hasPriceErr ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                              }`}
                            />
                          </div>
                          {hasPriceErr && (
                            <p className="text-[10px] text-destructive mt-1 font-medium">{hasPriceErr}</p>
                          )}
                        </div>

                        <div className="col-span-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWeight(wc.weight)}
                            disabled={weightConfigs.length <= 1}
                            className="text-muted-foreground hover:text-destructive h-8 px-2"
                            title="Delete this weight"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {stepErrors.weights && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {stepErrors.weights}
                </p>
              )}
            </div>
          )}

          {/* STEP 3: FLAVORS & INVENTORY MATRIX */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-3">
                <Layers className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <strong className="text-foreground font-semibold">Step 3: Flavors & Inventory Matrix</strong>
                  <p>
                    Stock = Product + Weight + Flavor. Add flavors, then enter the stock quantity for each combination in the inventory matrix below.
                  </p>
                </div>
              </div>

              {/* Flavor Selector & Badges */}
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Available Flavors ({flavors.length}) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">Add all flavors supported for this product</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFlavorInput}
                    onChange={e => setNewFlavorInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFlavor(newFlavorInput);
                      }
                    }}
                    placeholder="Enter flavor name (e.g. Chocolate, Vanilla, Strawberry)..."
                    className="h-10 px-3 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-primary flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddFlavor(newFlavorInput)}
                    className="h-10 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Flavor
                  </Button>
                </div>

                {/* Flavor Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {flavors.map(fl => (
                    <span
                      key={fl}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {fl}
                      <button
                        type="button"
                        onClick={() => handleRemoveFlavor(fl)}
                        className="hover:text-destructive transition-colors ml-0.5"
                        title={`Remove ${fl}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Flavor Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-semibold mr-1">Quick Presets:</span>
                  {PRESET_FLAVORS.map(pf => {
                    const exists = flavors.some(f => f.toLowerCase() === pf.toLowerCase());
                    return (
                      <button
                        key={pf}
                        type="button"
                        disabled={exists}
                        onClick={() => handleAddFlavor(pf)}
                        className="text-[10px] px-2 py-0.5 bg-background hover:bg-secondary rounded border border-border disabled:opacity-40 font-medium transition-colors"
                      >
                        + {pf}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Customizable Low Stock Threshold */}
              <div className="p-4 bg-secondary/30 rounded-xl border border-border/70 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Low Stock Alert Threshold (Customizable)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Variants or products at or below this stock value trigger low stock alert messages. (Default: 5 units)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={lowStockThreshold}
                      onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                      onChange={e => {
                        const stripped = e.target.value.replace(/^0+(?=\d)/, '');
                        const val = stripped === '' ? 0 : parseInt(stripped, 10);
                        setLowStockThreshold(isNaN(val) || val < 0 ? 0 : val);
                      }}
                      className="w-20 h-9 px-3 text-center bg-background border border-border rounded-lg text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">units</span>
                  </div>
                </div>
              </div>

              {/* Low Stock Alert Message Banner */}
              {compiledVariants.some(v => v.stock <= lowStockThreshold) && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-600 dark:text-amber-400 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <strong className="font-bold">Low Stock Alert:</strong>{' '}
                    {compiledVariants.filter(v => v.stock === 0).length > 0 && (
                      <span>{compiledVariants.filter(v => v.stock === 0).length} variant(s) are completely out of stock (0 units). </span>
                    )}
                    {compiledVariants.filter(v => v.stock > 0 && v.stock <= lowStockThreshold).length > 0 && (
                      <span>{compiledVariants.filter(v => v.stock > 0 && v.stock <= lowStockThreshold).length} variant(s) are at or below low stock threshold (≤ {lowStockThreshold} units). </span>
                    )}
                    <span>Admin alert message will be shown to customers and managers.</span>
                  </div>
                </div>
              )}

              {/* Weight x Flavor Inventory Matrix */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Weight & Flavor Inventory Matrix ({compiledVariants.length} Variants)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Each combination has its own dedicated stock level and unique SKU. Default is 0 units.
                    </p>
                  </div>

                  {/* Bulk Stock Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground mr-1">Quick Fill:</span>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(0)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold"
                    >
                      All 0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(5)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold"
                    >
                      All 5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(10)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold"
                    >
                      All 10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(25)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold"
                    >
                      All 25
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(50)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold"
                    >
                      All 50
                    </button>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/70 border-b border-border text-foreground font-bold">
                          <th className="p-3 text-left">Weight Option</th>
                          <th className="p-3 text-left">Fixed Price (Rs.)</th>
                          {flavors.map(fl => (
                            <th key={fl} className="p-3 text-center min-w-[130px]">
                              {fl} Stock
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {weightConfigs.map(wc => (
                          <tr key={wc.weight} className="hover:bg-secondary/10">
                            <td className="p-3 font-bold text-foreground">
                              <span className="px-2.5 py-1 bg-secondary rounded-lg border border-border/80">
                                {wc.weight}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-primary">
                              {formatCurrency(parseFloat(wc.price) || 0)}
                            </td>
                            {flavors.map(fl => {
                              const key = `${wc.weight}:::${fl}`;
                              const currentVal = stockMatrix[key] !== undefined ? stockMatrix[key] : 0;
                              const isOut = currentVal === 0;
                              const isLow = currentVal > 0 && currentVal <= lowStockThreshold;

                              return (
                                <td key={fl} className="p-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={currentVal}
                                      onFocus={e => {
                                        if (e.target.value === '0') {
                                          e.target.select();
                                        }
                                      }}
                                      onChange={e => handleUpdateStockCell(wc.weight, fl, e.target.value)}
                                      className={`w-20 h-8 px-2 text-center bg-secondary border rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary ${
                                        isOut
                                          ? 'border-destructive/60 bg-destructive/5 text-destructive'
                                          : isLow
                                          ? 'border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                          : 'border-border text-foreground'
                                      }`}
                                    />
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                        isOut
                                          ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                                          : isLow
                                          ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                          : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                      }`}
                                    >
                                      {isOut ? 'Out of Stock' : isLow ? `⚠️ Low (${currentVal} units)` : `${currentVal} units`}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Matrix Totals Summary */}
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/60 text-xs">
                  <span className="text-muted-foreground">
                    Total Variants: <strong className="text-foreground">{compiledVariants.length} combinations</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Total Inventory: <strong className="text-primary font-bold">{totalCalculatedStock} units</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRODUCT IMAGES */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <strong className="text-foreground font-semibold">Step 4: Product Images</strong>
                  <p>
                    Add product images using <strong>local folder files</strong> from your computer or <strong>direct web image URLs</strong>. Both methods are supported for primary and gallery images.
                  </p>
                </div>
              </div>

              {/* Primary Image Upload Card */}
              <div className="p-5 bg-background rounded-2xl border-2 border-border/80 hover:border-primary/50 transition-colors space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      Primary Product Image <span className="text-destructive">* REQUIRED</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Main showcase image displayed on cards, detail view, and cart
                    </p>
                  </div>
                  {primaryImage && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 w-fit">
                      <Check className="w-3 h-3" /> Image Configured
                    </span>
                  )}
                </div>

                {/* Source Selection Tabs */}
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <button
                    type="button"
                    onClick={() => setPrimaryImageSource('local')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      primaryImageSource === 'local'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Upload from Local Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrimaryImageSource('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      primaryImageSource === 'url'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Enter Image URL
                  </button>
                </div>

                {/* Option 1: Local Folder Upload Area */}
                {primaryImageSource === 'local' && (
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDraggingPrimary(true);
                    }}
                    onDragLeave={() => setIsDraggingPrimary(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDraggingPrimary(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePrimaryFileSelect(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isDraggingPrimary
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : 'border-border/80 hover:border-primary/60 bg-secondary/10 hover:bg-secondary/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                      <FolderUp className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      Choose an image from your local computer folder
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                      Drag & drop an image here or click below to browse files (PNG, JPG, JPEG, WEBP up to 10MB)
                    </p>
                    <div className="mt-3.5 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={isUploading}
                        onClick={e => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-xs font-bold h-9 px-4 gap-2 shadow-sm"
                      >
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <HardDrive className="w-3.5 h-3.5" />
                        )}
                        Browse Local Files
                      </Button>
                      {primaryImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-xs h-9"
                        >
                          Change File
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePrimaryFileSelect(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Option 2: Image URL Input Area */}
                {primaryImageSource === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={primaryImage}
                          onChange={e => {
                            setPrimaryImage(e.target.value);
                            setImagePreview(e.target.value);
                            setPrimaryFileName(null);
                            setPrimaryFileSize(null);
                          }}
                          placeholder="https://images.unsplash.com/... or any online image URL"
                          className={`w-full h-11 pl-10 pr-4 bg-secondary/30 border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-primary ${
                            stepErrors.image ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                          }`}
                        />
                      </div>
                      {primaryImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPrimaryImage('');
                            setImagePreview(null);
                            setPrimaryFileName(null);
                            setPrimaryFileSize(null);
                          }}
                          className="h-11 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Paste an image URL from Unsplash, manufacturer CDN, or any public image link.
                    </p>
                  </div>
                )}

                {uploadProgress && (
                  <p className="text-xs text-primary font-semibold flex items-center gap-1.5 animate-pulse bg-primary/10 p-2.5 rounded-lg border border-primary/20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadProgress}
                  </p>
                )}

                {stepErrors.image && (
                  <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {stepErrors.image}
                  </p>
                )}

                {/* Primary Image Preview Box */}
                {imagePreview && (
                  <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl border border-border w-full sm:w-fit">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-border shrink-0 bg-background relative">
                      <img
                        src={formatImageUrl(imagePreview)}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        onError={() => setImagePreview('/placeholder.svg')}
                      />
                    </div>
                    <div className="text-xs space-y-1 min-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">Selected Primary Image</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                          {primaryFileName ? '📁 Local Folder' : '🔗 Web URL'}
                        </span>
                      </div>
                      {primaryFileName ? (
                        <p className="text-foreground text-[11px] font-semibold truncate max-w-xs">
                          {primaryFileName} {primaryFileSize && <span className="text-muted-foreground">({primaryFileSize})</span>}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-[11px] truncate max-w-xs">{primaryImage}</p>
                      )}
                      <div className="pt-0.5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (primaryImageSource === 'local') {
                              fileInputRef.current?.click();
                            } else {
                              setPrimaryImage('');
                              setImagePreview(null);
                            }
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPrimaryImage('');
                            setImagePreview(null);
                            setPrimaryFileName(null);
                            setPrimaryFileSize(null);
                          }}
                          className="text-[11px] text-destructive hover:underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Gallery Images */}
              <div className="p-5 bg-secondary/20 rounded-2xl border border-border/70 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-primary" />
                      Additional Gallery Images (Optional)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Extra product shots, nutrition label, ingredient breakdown ({galleryImages.length} image{galleryImages.length === 1 ? '' : 's'})
                    </p>
                  </div>
                </div>

                {/* Gallery Source Tabs */}
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <button
                    type="button"
                    onClick={() => setGalleryImageSource('local')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      galleryImageSource === 'local'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Upload from Local Folder (Multiple)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryImageSource('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      galleryImageSource === 'url'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Add by Web URL
                  </button>
                </div>

                {/* Gallery Local Folder Multi-upload Dropzone */}
                {galleryImageSource === 'local' && (
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDraggingGallery(true);
                    }}
                    onDragLeave={() => setIsDraggingGallery(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDraggingGallery(false);
                      if (e.dataTransfer.files) handleGalleryFilesSelect(e.dataTransfer.files);
                    }}
                    onClick={() => galleryInputRef.current?.click()}
                    className={`p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isDraggingGallery
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : 'border-border/80 hover:border-primary/60 bg-background/50 hover:bg-background/80'
                    }`}
                  >
                    <FolderUp className="w-7 h-7 text-primary mb-2" />
                    <p className="text-xs font-bold text-foreground">
                      Select or drop multiple gallery images from your local folder
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports selecting multiple images at once (PNG, JPG, JPEG, WEBP)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={e => {
                        e.stopPropagation();
                        galleryInputRef.current?.click();
                      }}
                      className="mt-3 text-xs font-bold h-8 gap-1.5"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      Browse Local Folder Images
                    </Button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={e => {
                        if (e.target.files) handleGalleryFilesSelect(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Gallery URL Input */}
                {galleryImageSource === 'url' && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={newGalleryUrl}
                        onChange={e => setNewGalleryUrl(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGalleryUrl();
                          }
                        }}
                        placeholder="Enter additional web image URL..."
                        className="w-full h-10 pl-10 pr-3 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddGalleryUrl}
                      className="h-10 text-xs font-bold px-4"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add URL
                    </Button>
                  </div>
                )}

                {/* Gallery Images Grid */}
                {galleryImages.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      Gallery Collection ({galleryImages.length}):
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {galleryImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group w-20 h-20 rounded-xl overflow-hidden border border-border bg-background shadow-xs"
                        >
                          <img
                            src={formatImageUrl(img)}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded font-bold">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & PUBLISH */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground space-y-1">
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    Ready to Publish / Save
                  </strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Please review all product details, weight-based pricing, and flavor inventory matrix before submitting.
                  </p>
                </div>
              </div>

              {/* Product Overview Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl border border-border space-y-3">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border bg-background">
                    <img
                      src={primaryImage || '/placeholder.svg'}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{brand}</span>
                    <h3 className="font-bold text-sm text-foreground line-clamp-2">{name}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 bg-secondary rounded border border-border font-medium">
                        {category}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-500/20 font-bold">
                        Origin: {countryOfOrigin}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  {/* Description Box */}
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Description</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {description}
                    </p>
                  </div>

                  {/* Weights & Prices Summary */}
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Configured Weights & Selling Prices
                      </h4>
                      <span className="text-[11px] text-muted-foreground">Price by Weight</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {weightConfigs.map(wc => (
                        <div key={wc.weight} className="p-2.5 bg-background rounded-lg border border-border/80">
                          <p className="text-[11px] text-muted-foreground font-semibold">{wc.weight}</p>
                          <p className="text-sm font-bold text-foreground">{formatCurrency(parseFloat(wc.price) || 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flavors Summary */}
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Configured Flavors ({flavors.length})
                      </h4>
                      <span className="text-[11px] text-muted-foreground">Available options</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {flavors.map(fl => (
                        <span
                          key={fl}
                          className="px-2.5 py-0.5 bg-background rounded-md border border-border text-xs font-semibold text-foreground"
                        >
                          {fl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Variant Inventory Table & Low Stock Summary */}
              <div className="border border-border rounded-xl overflow-hidden bg-background space-y-2">
                <div className="bg-secondary/70 px-4 py-2.5 text-xs font-bold text-foreground flex items-center justify-between border-b border-border">
                  <span>Variant Inventory Breakdown ({compiledVariants.length} Combinations)</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Alert Threshold: <strong className="text-amber-500">{lowStockThreshold} units</strong></span>
                    <span>Total Stock: <strong className="text-primary">{totalCalculatedStock} units</strong></span>
                  </div>
                </div>

                {/* Low Stock Alert in Review */}
                {compiledVariants.some(v => v.stock <= lowStockThreshold) && (
                  <div className="mx-3 mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Low Stock Alert Notice: This product contains variants at or below the threshold of {lowStockThreshold} units.</span>
                  </div>
                )}

                <div className="max-h-56 overflow-y-auto divide-y divide-border/50 text-xs">
                  {compiledVariants.map((v, i) => {
                    const isVLow = v.stock > 0 && v.stock <= lowStockThreshold;
                    return (
                      <div key={i} className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{v.weight}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-medium text-foreground">{v.flavor}</span>
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border">
                            SKU: {v.sku}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">{formatCurrency(v.price)}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.stock === 0
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : isVLow
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {v.stock === 0 ? 'Out of Stock' : isVLow ? `⚠️ Low Stock (${v.stock} units)` : `${v.stock} in stock`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER & ACTION CONTROLS ================= */}
        <div className="border-t border-border bg-card/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting || isSubmittingInternal}
                className="h-10 px-4 text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting || isSubmittingInternal}
              className="h-10 px-4 text-xs"
            >
              Cancel
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-10 px-6 text-xs font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next Step <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || isSubmittingInternal || !primaryImage.trim()}
                className="h-11 px-8 text-xs font-black shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting || isSubmittingInternal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Product...
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4 mr-2" />
                    {product ? 'Update Supplement Product' : 'Publish Supplement Product'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
