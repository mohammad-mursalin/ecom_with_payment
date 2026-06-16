import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { getCategories } from '../services/categoryService';
import { getBrands } from '../services/brandService';
import { createProduct } from '../services/adminService';
import { Loader2, X, Save } from 'lucide-react';
import PageLoader from '../components/PageLoader';
import ErrorState from '../components/ErrorState';

const AdminAddProductPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [initError, setInitError] = useState("");

  const fetchData = async () => {
    setInitialLoading(true);
    setInitError("");
    try {
      const [cats, brnds] = await Promise.all([getCategories(), getBrands()]);
      setCategories(cats || []);
      setBrands(brnds || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to load categories/brands';
      setInitError(msg);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    price: '',
    originalPrice: '',
    stockQuantity: '',
    isFeatured: false,
    imageUrls: ['', '', '', '', ''],
    specifications: [{ key: '', value: '' }],
  });
  const [errors, setErrors] = useState({});
  const firstFieldRef = useRef(null);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateImageUrl = (index, value) => {
    const newUrls = [...form.imageUrls];
    newUrls[index] = value;
    setForm((prev) => ({ ...prev, imageUrls: newUrls }));
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
      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        isFeatured: form.isFeatured,
        imageUrls: form.imageUrls.filter((url) => url.trim()),
        specifications: form.specifications
          .filter((s) => s.key.trim() && s.value.trim())
          .reduce((acc, s) => ({ ...acc, [s.key.trim()]: s.value.trim() }), {}),
      };
      await createProduct(productData);
      toast.success('Product created successfully');
      navigate('/admin/products');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create product';
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
    return <PageLoader message="Loading product form..." />;
  }

  if (initError) {
    return (
      <div className="page-container">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <ErrorState message={initError} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="page-title">Add New Product</h1>
          <p className="page-subtitle">Create a new product for your store</p>
        </div>

        <div className="card">
          <div className="p-6 space-y-6" onKeyDown={handleKeyDown}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="add-product-name">Product Name *</label>
                <input
                  ref={firstFieldRef}
                  id="add-product-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter product name"
                  maxLength={200}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  aria-describedby={errors.name ? 'add-product-name-error' : undefined}
                />
                {errors.name && <p id="add-product-name-error" className="form-helper text-danger">{errors.name}</p>}
                <p className="form-helper">{form.name.length}/200</p>
              </div>

              <div>
                <label className="form-label" htmlFor="add-product-category">Category *</label>
                <select
                  id="add-product-category"
                  value={form.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  className={`form-select ${errors.categoryId ? 'border-red-500' : ''}`}
                  aria-describedby={errors.categoryId ? 'add-product-category-error' : undefined}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p id="add-product-category-error" className="form-helper text-danger">{errors.categoryId}</p>
                )}
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="add-product-brand">Brand *</label>
              <select
                id="add-product-brand"
                value={form.brandId}
                onChange={(e) => updateField('brandId', e.target.value)}
                className={`form-select ${errors.brandId ? 'border-red-500' : ''}`}
                aria-describedby={errors.brandId ? 'add-product-brand-error' : undefined}
              >
                <option value="">Select brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {errors.brandId && <p id="add-product-brand-error" className="form-helper text-danger">{errors.brandId}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="add-product-description">Description *</label>
              <textarea
                id="add-product-description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Enter product description"
                rows={4}
                className={`form-input ${errors.description ? 'border-red-500' : ''}`}
                aria-describedby={errors.description ? 'add-product-description-error' : undefined}
              />
              {errors.description && (
                <p id="add-product-description-error" className="form-helper text-danger">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="add-product-price">Price (₹) *</label>
                <input
                  id="add-product-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="0.00"
                  className={`form-input ${errors.price ? 'border-red-500' : ''}`}
                  aria-describedby={errors.price ? 'add-product-price-error' : undefined}
                />
                {errors.price && <p id="add-product-price-error" className="form-helper text-danger">{errors.price}</p>}
              </div>

              <div>
                <label className="form-label" htmlFor="add-product-originalPrice">Original Price (₹)</label>
                <input
                  id="add-product-originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) => updateField('originalPrice', e.target.value)}
                  placeholder="Optional"
                  className={`form-input ${errors.originalPrice ? 'border-red-500' : ''}`}
                  aria-describedby={errors.originalPrice ? 'add-product-originalPrice-error' : undefined}
                />
                {errors.originalPrice && (
                  <p id="add-product-originalPrice-error" className="form-helper text-danger">{errors.originalPrice}</p>
                )}
                {discountPercent > 0 && (
                  <p className="form-helper text-green-600">
                    {discountPercent}% discount will be shown
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="add-product-stock">Stock Quantity *</label>
              <input
                id="add-product-stock"
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => updateField('stockQuantity', e.target.value)}
                placeholder="0"
                className={`form-input ${errors.stockQuantity ? 'border-red-500' : ''}`}
                aria-describedby={errors.stockQuantity ? 'add-product-stock-error' : undefined}
              />
              {errors.stockQuantity && (
                <p id="add-product-stock-error" className="form-helper text-danger">{errors.stockQuantity}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => updateField('isFeatured', e.target.checked)}
                  className="form-checkbox"
                />
                <span>Is Featured</span>
              </label>
            </div>

            <div>
              <label className="form-label mb-2">Image URLs (up to 5)</label>
              {form.imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    placeholder={`Image URL ${index + 1}`}
                    className="form-input flex-1"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => updateImageUrl(index, '')}
                      className="icon-button text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <p className="form-helper mt-1">
                Enter image URLs. The first image will be the primary image.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">Specifications</label>
                <button
                  type="button"
                  onClick={addSpec}
                  className="text-sm text-blue-600 hover:text-blue-700"
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
                    className="form-input flex-1"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="form-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(index)}
                    className="icon-button text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {form.specifications.length === 0 && (
                <p className="form-helper">No specifications added.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="btn-modern btn-modern-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-modern btn-modern-primary"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {loading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAddProductPage;