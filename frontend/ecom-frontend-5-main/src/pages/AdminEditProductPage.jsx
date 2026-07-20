import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { getCategories } from '../services/categoryService';
import { getBrands } from '../services/brandService';
import { getProduct } from '../services/productService';
import { updateProduct } from '../services/adminService';
import { Loader2, X, Save, Upload } from 'lucide-react';
import PageLoader from '../components/PageLoader';

const AdminEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    price: '',
    originalPrice: '',
    stockQuantity: '',
    isFeatured: false,
    images: [],
    specifications: [{ key: '', value: '' }],
  });
  const [errors, setErrors] = useState({});
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const firstFieldRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [cats, brnds, productData] = await Promise.all([
          getCategories(),
          getBrands(),
          getProduct(id),
        ]);
        setCategories(cats || []);
        setBrands(brnds || []);

        const spec = productData.specifications || {};
        setExistingImageUrl(productData.imageUrl || '');
        setForm({
          name: productData.name || '',
          description: productData.description || '',
          categoryId: productData.category?.id?.toString() || '',
          brandId: productData.brand?.id?.toString() || '',
          price: productData.price?.toString() || '',
          originalPrice: productData.originalPrice?.toString() || '',
          stockQuantity: productData.stockQuantity?.toString() || '',
          isFeatured: productData.isFeatured || false,
          images: [],
          specifications: Object.entries(spec).map(([key, value]) => ({
            key,
            value: value?.toString() || '',
          })),
        });
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to load product data';
        toast.error(msg);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [id, toast]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 2) {
        toast.error(`${file.name} exceeds 2MB limit`);
        return false;
      }
      return true;
    });
    setForm((prev) => ({ ...prev, images: [...prev.images, ...validFiles].slice(0, 1) }));
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addSpec = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const removeSpec = (index) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const updateSpec = (index, field, value) => {
    const specs = [...form.specifications];
    specs[index] = { ...specs[index], [field]: value };
    setForm((prev) => ({ ...prev, specifications: specs }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.categoryId) errs.categoryId = 'Category is required';
    if (!form.brandId) errs.brandId = 'Brand is required';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Price must be > 0';
    if (form.originalPrice && Number(form.originalPrice) <= Number(form.price)) {
      errs.originalPrice = 'Original price must be greater than current price';
    }
    if (form.stockQuantity === '' || Number(form.stockQuantity) < 0) {
      errs.stockQuantity = 'Stock must be >= 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const specsArray = form.specifications
        .filter((s) => s.key.trim() && s.value.trim())
        .map((s) => ({
          specKey: s.key.trim(),
          specValue: s.value.trim(),
        }));

      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        isFeatured: form.isFeatured,
        tags: [],
        specs: specsArray,
      };

      const multipart = new FormData();
      multipart.append(
        "request",
        new Blob([JSON.stringify(productData)], { type: "application/json" })
      );

      if (form.images.length > 0) {
        multipart.append("imageFile", form.images[0]);
      }

      await updateProduct(id, multipart);
      toast.success('Product updated successfully');
      navigate('/admin/products');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update product';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const discountPercent =
    form.originalPrice && Number(form.originalPrice) > Number(form.price || 0)
      ? Math.round(((Number(form.originalPrice) - Number(form.price || 0)) / Number(form.originalPrice)) * 100)
      : 0;

  if (initialLoading) {
    return <PageLoader message="Loading product data..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Edit Product</h1>
        <p className="text-sm text-muted">Update product details</p>
      </div>

      <div className="rounded-2xl border border-default bg-surface-card shadow-sm">
        <div className="p-6 space-y-6" onKeyDown={handleKeyDown}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="edit-product-name">Product Name *</label>
              <input
                ref={firstFieldRef}
                id="edit-product-name"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter product name"
                maxLength={200}
                className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.name ? 'border-danger' : ''}`}
                aria-describedby={errors.name ? 'edit-product-name-error' : undefined}
              />
              {errors.name && <p id="edit-product-name-error" className="mt-1 text-xs text-danger">{errors.name}</p>}
              <p className="mt-1 text-xs text-muted">{form.name.length}/200</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="edit-product-category">Category *</label>
              <select
                id="edit-product-category"
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.categoryId ? 'border-danger' : ''}`}
                aria-describedby={errors.categoryId ? 'edit-product-category-error' : undefined}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p id="edit-product-category-error" className="mt-1 text-xs text-danger">{errors.categoryId}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="edit-product-brand">Brand *</label>
            <select
              id="edit-product-brand"
              value={form.brandId}
              onChange={(e) => updateField('brandId', e.target.value)}
              className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.brandId ? 'border-danger' : ''}`}
              aria-describedby={errors.brandId ? 'edit-product-brand-error' : undefined}
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors.brandId && <p id="edit-product-brand-error" className="mt-1 text-xs text-danger">{errors.brandId}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="edit-product-description">Description *</label>
            <textarea
              id="edit-product-description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter product description"
              rows={4}
              className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.description ? 'border-danger' : ''}`}
              aria-describedby={errors.description ? 'edit-product-description-error' : undefined}
            />
            {errors.description && (
              <p id="edit-product-description-error" className="mt-1 text-xs text-danger">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="edit-product-price">Price (₹) *</label>
              <input
                id="edit-product-price"
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="0.00"
                className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.price ? 'border-danger' : ''}`}
                aria-describedby={errors.price ? 'edit-product-price-error' : undefined}
              />
              {errors.price && <p id="edit-product-price-error" className="mt-1 text-xs text-danger">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="edit-product-originalPrice">Original Price (₹)</label>
              <input
                id="edit-product-originalPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.originalPrice}
                onChange={(e) => updateField('originalPrice', e.target.value)}
                placeholder="Optional"
                className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.originalPrice ? 'border-danger' : ''}`}
                aria-describedby={errors.originalPrice ? 'edit-product-originalPrice-error' : undefined}
              />
              {errors.originalPrice && (
                <p id="edit-product-originalPrice-error" className="mt-1 text-xs text-danger">{errors.originalPrice}</p>
              )}
              {discountPercent > 0 && (
                <p className="mt-1 text-xs text-success">
                  {discountPercent}% discount will be shown
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="edit-product-stock">Stock Quantity *</label>
            <input
              id="edit-product-stock"
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => updateField('stockQuantity', e.target.value)}
              placeholder="0"
              className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.stockQuantity ? 'border-danger' : ''}`}
              aria-describedby={errors.stockQuantity ? 'edit-product-stock-error' : undefined}
            />
            {errors.stockQuantity && <p id="edit-product-stock-error" className="mt-1 text-xs text-danger">{errors.stockQuantity}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="edit-product-isFeatured"
                checked={form.isFeatured}
                onChange={(e) => updateField('isFeatured', e.target.checked)}
                className="h-4 w-4 rounded border-default accent-primary"
              />
              <span className="text-sm text-secondary">Is Featured</span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-secondary mb-0">Product Image</label>
              {form.images.length > 0 && (
                <span className="text-xs text-muted">New image selected</span>
              )}
            </div>

            {existingImageUrl && !form.images.length > 0 && (
              <div className="mb-4">
                <img
                  src={existingImageUrl}
                  alt="Current product"
                  className="w-full h-48 object-cover rounded-lg border border-default"
                />
                <p className="text-xs text-muted text-center mt-1">Current image</p>
              </div>
            )}

            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-default rounded-lg cursor-pointer hover:border-primary hover:bg-surface-elevated/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-muted mb-2" />
                <p className="text-sm text-secondary">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted mt-1">JPG, PNG, or WebP (max 2MB)</p>
              </div>
              <input
                id="edit-image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            {form.images.length > 0 && (
              <div className="mt-4 relative group">
                <img
                  src={URL.createObjectURL(form.images[0])}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-default"
                />
                <button
                  type="button"
                  onClick={() => removeImage(0)}
                  className="absolute top-1 right-1 bg-danger text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-muted text-center mt-1">
                  {(form.images[0].size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-secondary mb-0">Specifications</label>
              <button
                type="button"
                onClick={addSpec}
                className="text-sm text-primary hover:text-primary-hover"
              >
                + Add Row
              </button>
            </div>
            {form.specifications.map((spec, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => updateSpec(index, 'key', e.target.value)}
                  placeholder="Key"
                  className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1"
                  aria-label={`Specification key ${index + 1}`}
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1"
                  aria-label={`Specification value ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeSpec(index)}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-muted hover:text-danger transition-colors"
                  aria-label={`Remove specification ${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {form.specifications.length === 0 && (
              <p className="text-xs text-muted">No specifications added.</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-default">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEditProductPage;