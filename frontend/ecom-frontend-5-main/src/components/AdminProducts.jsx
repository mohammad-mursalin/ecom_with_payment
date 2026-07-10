import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";
import {
  Plus,
  Search,
  Edit3,
  Eye,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Loader2,
  Save,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Star,
} from "lucide-react";
import { getAdminProducts, createProduct, updateProduct, deleteProduct, toggleProductActive } from "../services/adminService";
import { getCategories } from "../services/categoryService";
import { getBrands } from "../services/brandService";

const AdminProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusToggleConfirm, setStatusToggleConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  useEffect(() => {
    let result = products;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.name.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q)
      );
    }
    setFilteredProducts(result);
    setSelectedIds(new Set());
  }, [debouncedSearch, products]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError("");
    try {
      const res = await getAdminProducts({
        page: currentPage,
        size: pageSize,
        search: debouncedSearch || undefined,
      });
      const data = res.data || res;
      const content = data.content || data.items || data || [];
      const total = data.totalElements ?? content.length;
      setProducts(content);
      setFilteredProducts(content);
      setTotalElements(total);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load products";
      setProductsError(msg);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          getCategories(),
          getBrands(),
        ]);
        const catData = catRes.data || catRes;
        setCategories(
          Array.isArray(catData) ? catData : catData.content || catData.items || []
        );
        const brandData = brandRes.data || brandRes;
        setBrands(
          Array.isArray(brandData) ? brandData : brandData.content || brandData.items || []
        );
      } catch (err) {
        console.error("Failed to load categories/brands", err);
      }
    };
    fetchMeta();
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const startIndex = safeCurrentPage * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const openCreateDrawer = () => {
    setEditingProduct(null);
    setImagePreviews([]);
    setBrandSearch("");
    setDrawerOpen(true);
  };

  const openEditDrawer = (product) => {
    setEditingProduct(product);
    setImagePreviews(
      product.primaryImageUrl ? [{ url: product.primaryImageUrl, isPrimary: true }] : []
    );
    setBrandSearch(product.brand?.name || "");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingProduct(null);
    setImagePreviews([]);
    setBrandSearch("");
  };

  const handleSave = async (formData) => {
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stockQuantity: Number(formData.stockQuantity),
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        categoryId: formData.categoryId,
        brandId: formData.brandId,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        tags: formData.tags || [],
        specifications: (formData.specs || []).filter(s => s.key && s.value).reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}),
        imageUrls: imagePreviews.map(img => img.url).filter(Boolean),
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success("Product updated successfully");
      } else {
        await createProduct(payload);
        toast.success("Product created successfully");
      }
      await fetchProducts();
      setDrawerOpen(false);
      setEditingProduct(null);
      setImagePreviews([]);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to save product";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const result = await deleteProduct(deleteConfirm.id);
      const message = result?.message || `"${deleteConfirm.name}" deleted`;
      toast.info(message);
      await fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to delete product";
      toast.error(msg);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmToggleStatus = async () => {
    if (!statusToggleConfirm) return;
    try {
      await toggleProductActive(statusToggleConfirm.id);
      const newStatus = !statusToggleConfirm.isActive;
      toast.success(`Product ${newStatus ? "activated" : "deactivated"} successfully`);
      await fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to update product status";
      toast.error(msg);
    } finally {
      setStatusToggleConfirm(null);
    }
  };

  const handleBulkAction = async (action) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const ids = Array.from(selectedIds);
    if (action === "activate") {
      setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, isActive: true } : p)));
      toast.success(`${ids.length} products activated`);
    } else if (action === "deactivate") {
      setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, isActive: false } : p)));
      toast.info(`${ids.length} products deactivated`);
    } else if (action === "delete") {
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      toast.info(`${ids.length} products deleted`);
    }
    setSelectedIds(new Set());
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.slice(0, 10 - imagePreviews.length).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isPrimary: imagePreviews.length === 0 && newPreviews.length === 0,
    }));
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const setPrimaryImage = (index) => {
    setImagePreviews((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index }))
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryForm.name.trim()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
    toast.success("Category created");
    setNewCategoryForm({ show: false, name: "", icon: "" });
  };

  const [newCategoryForm, setNewCategoryForm] = useState({ show: false, name: "", icon: "" });

  const filteredBrands = brandSearch.trim()
    ? brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands;

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">Products Management</h2>
          <p className="text-sm text-muted">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button onClick={openCreateDrawer} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none">
          <Plus className="mr-2 h-4 w-4" /> Add New Product
        </button>
      </div>

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <button
            onClick={() => handleBulkAction("activate")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Active
          </button>
          <button
            onClick={() => handleBulkAction("deactivate")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-4 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-surface-elevated"
          >
            Set Inactive
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Selected
          </button>
        </motion.div>
      )}

      {loadingProducts && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </div>
      )}
      {productsError && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          {productsError}
          <button onClick={fetchProducts} className="ml-2 underline hover:no-underline">Retry</button>
        </div>
      )}

      {!loadingProducts && !productsError && (
      <div className="overflow-x-auto rounded-2xl border border-default bg-surface-card">
        <div className="flex flex-col gap-3 border-b border-default p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name, brand, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 pl-9 pr-4 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default text-left text-xs font-semibold text-muted uppercase">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedProducts.length > 0 && selectedIds.size === paginatedProducts.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-default"
                  />
                </th>
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted">
                    {searchQuery ? "No products match your search." : "No products found. Add your first product!"}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-default hover:bg-surface-elevated">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="h-4 w-4 rounded border-default"
                      />
                    </td>
                    <td className="p-3">
                      <img src={product.primaryImageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                    </td>
                    <td className="p-3">
                      <div className="max-w-[200px] font-medium text-primary line-clamp-2">{product.name}</div>
                    </td>
                    <td className="p-3 text-secondary">{product.category?.name || "—"}</td>
                    <td className="p-3 text-secondary">{product.brand?.name || "—"}</td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">{formatCurrency(product.price)}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-muted line-through">{formatCurrency(product.originalPrice)}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`font-semibold ${product.stock <= product.lowStockThreshold ? "text-danger" : "text-success"}`}>
                        {product.stock}
                      </span>
                      {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                        <span className="ml-1 text-xs text-muted">low</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${product.isActive ? "bg-success/10 text-success" : "bg-surface-elevated text-muted"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditDrawer(product)} className="rounded-lg p-2 text-muted hover:bg-primary/10 hover:text-primary" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setStatusToggleConfirm(product)}
                          className={`rounded-lg p-2 ${product.isActive ? "text-muted hover:bg-warning/10 hover:text-warning" : "text-muted hover:bg-success/10 hover:text-success"}`}
                          title={product.isActive ? "Deactivate" : "Activate"}
                        >
                          {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setDeleteConfirm(product)} className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-default p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-secondary">
            Showing {filteredProducts.length === 0 ? 0 : startIndex + 1}–
            {Math.min(startIndex + pageSize, filteredProducts.length)} of {filteredProducts.length} results
          </div>
          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
              className="rounded-lg border border-default bg-surface-card px-2 py-1.5 text-sm text-primary"
            >
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={safeCurrentPage === 0} className="rounded-lg border border-default p-2 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-secondary">{safeCurrentPage + 1} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safeCurrentPage >= totalPages - 1} className="rounded-lg border border-default p-2 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      <AnimatePresence>
        {drawerOpen && (
          <ProductDrawer
            editingProduct={editingProduct}
            imagePreviews={imagePreviews}
            setImagePreviews={setImagePreviews}
            brandSearch={brandSearch}
            setBrandSearch={setBrandSearch}
            newCategoryForm={newCategoryForm}
            setNewCategoryForm={setNewCategoryForm}
            categories={categories}
            filteredBrands={filteredBrands}
            brands={brands}
            submitting={submitting}
            setSubmitting={setSubmitting}
            onSave={handleSave}
            onClose={closeDrawer}
            onCreateCategory={handleCreateCategory}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            onSetPrimaryImage={setPrimaryImage}
            fileInputRef={fileInputRef}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="Delete Product"
            message={`Delete "${deleteConfirm.name}"? This will hide it from the store.`}
            confirmLabel="Delete"
            confirmVariant="danger"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {statusToggleConfirm && (
          <ConfirmModal
            title={statusToggleConfirm.isActive ? "Deactivate Product" : "Activate Product"}
            message={`Are you sure you want to ${statusToggleConfirm.isActive ? "deactivate" : "activate"} "${statusToggleConfirm.name}"?`}
            confirmLabel={statusToggleConfirm.isActive ? "Deactivate" : "Activate"}
            confirmVariant={statusToggleConfirm.isActive ? "warning" : "success"}
            onConfirm={confirmToggleStatus}
            onCancel={() => setStatusToggleConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductDrawer = ({
  editingProduct,
  imagePreviews,
  brandSearch,
  setBrandSearch,
  newCategoryForm,
  setNewCategoryForm,
  categories,
  filteredBrands,
  brands,
  submitting,
  setSubmitting,
  onSave,
  onClose,
  onCreateCategory,
  onImageUpload,
  onRemoveImage,
  onSetPrimaryImage,
  fileInputRef,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    stockQuantity: "",
    lowStockThreshold: 5,
    categoryId: "",
    brandId: "",
    brandName: "",
    isActive: true,
    isFeatured: false,
    tags: [],
    specs: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        price: editingProduct.price?.toString() || "",
        originalPrice: editingProduct.originalPrice?.toString() || "",
        stockQuantity: editingProduct.stock?.toString() || "",
        lowStockThreshold: editingProduct.lowStockThreshold || 5,
        categoryId: editingProduct.category?.id || "",
        brandId: editingProduct.brand?.id || "",
        brandName: editingProduct.brand?.name || "",
        isActive: editingProduct.isActive ?? true,
        isFeatured: editingProduct.isFeatured ?? false,
        tags: [],
        specs: [],
      });
    }
  }, [editingProduct]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,/g, "");
      if (tag && !form.tags.includes(tag) && form.tags.length < 20) {
        updateField("tags", [...form.tags, tag]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && tagInput === "" && form.tags.length > 0) {
      updateField("tags", form.tags.slice(0, -1));
    }
  };

  const removeTag = (tag) => {
    updateField("tags", form.tags.filter((t) => t !== tag));
  };

  const addSpec = () => {
    updateField("specs", [...form.specs, { key: "", value: "" }]);
  };

  const updateSpec = (index, field, value) => {
    const next = [...form.specs];
    next[index] = { ...next[index], [field]: value };
    updateField("specs", next);
  };

  const removeSpec = (index) => {
    updateField("specs", form.specs.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    else if (form.name.length > 200) errs.name = "Max 200 characters";
    if (!form.categoryId) errs.categoryId = "Category is required";
    if (!form.brandId && !form.brandName.trim()) errs.brand = "Brand is required";
    if (!form.price || Number(form.price) <= 0) errs.price = "Price must be > 0";
    if (form.stockQuantity === "" || Number(form.stockQuantity) < 0) errs.stockQuantity = "Stock must be >= 0";
    if (!form.description.trim()) errs.description = "Description is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave(form);
    } catch (error) {
      toast.error("Failed to save product");
    }
    setSubmitting(false);
  };

  const discountPercent =
    form.originalPrice && Number(form.originalPrice) > Number(form.price || 0)
      ? Math.round(((Number(form.originalPrice) - Number(form.price || 0)) / Number(form.originalPrice)) * 100)
      : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-surface-card shadow-2xl dark:bg-surface"
      >
        <div className="flex items-center justify-between border-b border-default p-4">
          <h3 className="text-lg font-bold text-primary">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-surface-elevated">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">Product Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter product name"
                  maxLength={200}
                  className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.name ? "border-danger" : ""}`}
                />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
                <p className="mt-1 text-xs text-muted">{form.name.length}/200</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">Category <span className="text-danger">*</span></label>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateField("categoryId", Number(e.target.value))}
                  className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.categoryId ? "border-danger" : ""}`}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-danger">{errors.categoryId}</p>}
                <button type="button" onClick={() => setNewCategoryForm((prev) => ({ ...prev, show: !prev.show }))} className="mt-1 text-xs text-primary hover:text-primary-hover">+ Create new category</button>
                {newCategoryForm.show && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryForm.name}
                      onChange={(e) => setNewCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="flex-1 rounded-lg border border-default bg-surface-card px-2 py-1.5 text-sm text-primary"
                    />
                    <input
                      type="text"
                      placeholder="Icon emoji"
                      value={newCategoryForm.icon}
                      onChange={(e) => setNewCategoryForm((prev) => ({ ...prev, icon: e.target.value }))}
                      className="w-16 rounded-lg border border-default bg-surface-card px-2 py-1.5 text-sm text-primary"
                    />
                    <button type="button" onClick={onCreateCategory} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover">Save</button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">Brand <span className="text-danger">*</span></label>
              <input
                type="text"
                value={brandSearch}
                onChange={(e) => {
                  setBrandSearch(e.target.value);
                  updateField("brandName", e.target.value);
                  const matched = brands.find((b) => b.name.toLowerCase() === e.target.value.toLowerCase());
                  if (matched) updateField("brandId", matched.id);
                }}
                placeholder="Search or type brand name"
                className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.brand ? "border-danger" : ""}`}
              />
              {errors.brand && <p className="mt-1 text-xs text-danger">{errors.brand}</p>}
              {brandSearch && filteredBrands.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-default bg-surface-card">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => {
                        setBrandSearch(brand.name);
                        updateField("brandId", brand.id);
                        updateField("brandName", brand.name);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface-elevated"
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">Description <span className="text-danger">*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Enter product description"
                rows={4}
                className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.description ? "border-danger" : ""}`}
              />
              {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">Price (₹) <span className="text-danger">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="0.00"
                    className={`w-full rounded-lg border border-default bg-surface-card py-2.5 pl-7 pr-3 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.price ? "border-danger" : ""}`}
                  />
                </div>
                {errors.price && <p className="mt-1 text-xs text-danger">{errors.price}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">Original Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) => updateField("originalPrice", e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-default bg-surface-card py-2.5 pl-7 pr-3 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {discountPercent > 0 && (
                  <p className="mt-1 text-xs text-success">
                    Showing as: ~~₹{Number(form.originalPrice).toFixed(2)}~~ ₹{Number(form.price).toFixed(2)} ({discountPercent}% off)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">Stock Quantity <span className="text-danger">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => updateField("stockQuantity", e.target.value)}
                  className={`w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.stockQuantity ? "border-danger" : ""}`}
                />
                {errors.stockQuantity && <p className="mt-1 text-xs text-danger">{errors.stockQuantity}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">Low Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => updateField("lowStockThreshold", Number(e.target.value))}
                  className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-xs text-muted">Alert will show when stock falls to this level.</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">Images (up to 10, max 5MB each)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-default p-6 text-center hover:border-primary"
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted" />
                <p className="text-sm text-secondary">Click or drag images here to upload</p>
                <p className="text-xs text-muted">JPG, PNG, WebP — max 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={onImageUpload}
                className="hidden"
              />
              {imagePreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-3">
                  {imagePreviews.map((img, index) => (
                    <div key={index} className="group relative aspect-square rounded-2xl border border-default bg-surface-elevated">
                      <img src={img.url} alt={`Preview ${index + 1}`} className="h-full w-full rounded-2xl object-cover" />
                      {img.isPrimary && (
                        <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">PRIMARY</span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => onSetPrimaryImage(index)} className="rounded bg-white/20 p-1 text-white hover:bg-white/40" title="Set as primary">
                          <Star className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => onRemoveImage(index)} className="rounded bg-danger/80 p-1 text-white hover:bg-danger" title="Remove">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">Tags</label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-default bg-surface-card p-2">
                {form.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary-hover">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={form.tags.length === 0 ? "Type and press Enter..." : ""}
                  className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-secondary">Specifications</label>
                <button type="button" onClick={addSpec} className="text-xs text-primary hover:text-primary-hover">+ Add Specification</button>
              </div>
              {form.specs.map((spec, index) => (
                <div key={index} className="mb-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={spec.key}
                    onChange={(e) => updateSpec(index, "key", e.target.value)}
                    className="flex-1 rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, "value", e.target.value)}
                    className="flex-1 rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" onClick={() => removeSpec(index)} className="rounded-lg p-2 text-muted hover:text-danger transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {form.specs.length === 0 && <p className="text-xs text-muted">No specifications added.</p>}
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-default p-4">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated">Cancel</button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <span className="text-sm text-secondary">Active</span>
                <button type="button" onClick={() => updateField("isActive", !form.isActive)} className="text-muted">
                  {form.isActive ? <ToggleRight className="h-6 w-6 text-success" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-sm text-secondary">Featured</span>
                <button type="button" onClick={() => updateField("isFeatured", !form.isFeatured)} className="text-muted">
                  {form.isFeatured ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
              </label>
            </div>
            <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {submitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ConfirmModal = ({ title, message, confirmLabel, confirmVariant = "danger", onConfirm, onCancel }) => {
  const variantClass = confirmVariant === "success" ? "bg-success hover:bg-success/90" : confirmVariant === "warning" ? "bg-warning hover:bg-warning/90" : "bg-danger hover:bg-danger/90";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md rounded-2xl bg-surface-card p-6 shadow-xl dark:bg-surface"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className={`rounded-full p-2 ${confirmVariant === "success" ? "bg-success/10 text-success" : confirmVariant === "warning" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-primary">{title}</h3>
        </div>
        <p className="mb-6 text-sm text-secondary">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated">Cancel</button>
          <button onClick={onConfirm} className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors ${variantClass}`}>{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminProducts;
