import { useState, useEffect, useRef } from "react";
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

const MOCK_CATEGORIES = [
  { id: 1, name: "Laptops", slug: "laptops", icon: "💻" },
  { id: 2, name: "Headphones", slug: "headphones", icon: "🎧" },
  { id: 3, name: "Mobile", slug: "mobile", icon: "📱" },
  { id: 4, name: "Electronics", slug: "electronics", icon: "⚡" },
];

const MOCK_BRANDS = [
  { id: 1, name: "Apple", slug: "apple" },
  { id: 2, name: "Samsung", slug: "samsung" },
  { id: 3, name: "Sony", slug: "sony" },
  { id: 4, name: "Nike", slug: "nike" },
];

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "MacBook Pro 14-inch",
    category: { id: 1, name: "Laptops" },
    brand: { id: 1, name: "Apple" },
    price: 1499.99,
    originalPrice: 1599.99,
    stock: 25,
    lowStockThreshold: 5,
    isActive: true,
    isFeatured: true,
    primaryImageUrl: "https://via.placeholder.com/150/2563eb/ffffff?text=MacBook",
    createdAt: "2026-06-01T10:00:00",
  },
  {
    id: 2,
    name: "AirPods Pro 2",
    category: { id: 2, name: "Headphones" },
    brand: { id: 1, name: "Apple" },
    price: 249.99,
    originalPrice: null,
    stock: 150,
    lowStockThreshold: 10,
    isActive: true,
    isFeatured: true,
    primaryImageUrl: "https://via.placeholder.com/150/16a34a/ffffff?text=AirPods",
    createdAt: "2026-06-02T14:30:00",
  },
  {
    id: 3,
    name: "Galaxy S24 Ultra",
    category: { id: 3, name: "Mobile" },
    brand: { id: 2, name: "Samsung" },
    price: 1199.99,
    originalPrice: 1299.99,
    stock: 3,
    lowStockThreshold: 5,
    isActive: true,
    isFeatured: false,
    primaryImageUrl: "https://via.placeholder.com/150/f59e0b/ffffff?text=Galaxy",
    createdAt: "2026-06-03T09:15:00",
  },
  {
    id: 4,
    name: "WH-1000XM5 Headphones",
    category: { id: 2, name: "Headphones" },
    brand: { id: 3, name: "Sony" },
    price: 349.99,
    originalPrice: null,
    stock: 0,
    lowStockThreshold: 5,
    isActive: false,
    isFeatured: false,
    primaryImageUrl: "https://via.placeholder.com/150/7c3aed/ffffff?text=Sony",
    createdAt: "2026-05-28T16:45:00",
  },
  {
    id: 5,
    name: "Nike Air Max 270",
    category: { id: 4, name: "Electronics" },
    brand: { id: 4, name: "Nike" },
    price: 150.0,
    originalPrice: 180.0,
    stock: 42,
    lowStockThreshold: 5,
    isActive: true,
    isFeatured: true,
    primaryImageUrl: "https://via.placeholder.com/150/dc2626/ffffff?text=Nike",
    createdAt: "2026-06-04T11:20:00",
  },
];

const AdminProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [filteredProducts, setFilteredProducts] = useState(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusToggleConfirm, setStatusToggleConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [categories] = useState(MOCK_CATEGORIES);
  const [brands] = useState(MOCK_BRANDS);
  const [brandSearch, setBrandSearch] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const [currentPage, setCurrentPage] = useState(0);
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
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...formData,
                brand: { id: formData.brandId, name: formData.brandName },
                category: { id: formData.categoryId, name: categories.find((c) => c.id === formData.categoryId)?.name || p.category.name },
                primaryImageUrl: imagePreviews[0]?.url || p.primaryImageUrl,
              }
            : p
        )
      );
      toast.success("Product updated successfully");
    } else {
      const newProduct = {
        id: Date.now(),
        ...formData,
        brand: { id: formData.brandId, name: formData.brandName },
        category: { id: formData.categoryId, name: categories.find((c) => c.id === formData.categoryId)?.name || "Uncategorized" },
        primaryImageUrl: imagePreviews[0]?.url || "https://via.placeholder.com/150/2563eb/ffffff?text=New",
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      toast.success("Product created successfully");
    }
    setSubmitting(false);
    setDrawerOpen(false);
    setEditingProduct(null);
    setImagePreviews([]);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteConfirm.id);
      return next;
    });
    toast.info(`"${deleteConfirm.name}" deleted`);
    setDeleteConfirm(null);
  };

  const confirmToggleStatus = () => {
    if (!statusToggleConfirm) return;
    const newStatus = !statusToggleConfirm.isActive;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === statusToggleConfirm.id ? { ...p, isActive: newStatus } : p
      )
    );
    toast.success(`Product ${newStatus ? "activated" : "deactivated"} successfully`);
    setStatusToggleConfirm(null);
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
toast.success("Product created");
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Products Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button onClick={openCreateDrawer} className="btn btn-modern btn-modern-primary">
          <Plus className="mr-2 h-4 w-4" /> Add New Product
        </button>
      </div>

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950"
        >
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => handleBulkAction("activate")}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Set Active
          </button>
          <button
            onClick={() => handleBulkAction("deactivate")}
            className="rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
          >
            Set Inactive
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Delete Selected
          </button>
        </motion.div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, brand, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedProducts.length > 0 && selectedIds.size === paginatedProducts.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Image</th>
                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Brand</th>
                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Price</th>
                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Stock</th>
                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="p-3 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? "No products match your search." : "No products found. Add your first product!"}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="p-3">
                      <img src={product.primaryImageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                    </td>
                    <td className="p-3">
                      <div className="max-w-[200px] font-medium text-gray-900 dark:text-white line-clamp-2">{product.name}</div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{product.category?.name || "—"}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{product.brand?.name || "—"}</td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(product.price)}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`font-semibold ${product.stock <= product.lowStockThreshold ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        {product.stock}
                      </span>
                      {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                        <span className="ml-1 text-xs text-gray-400">low</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditDrawer(product)} className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setStatusToggleConfirm(product)}
                          className={`rounded-lg p-2 ${product.isActive ? "text-gray-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950" : "text-gray-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"}`}
                          title={product.isActive ? "Deactivate" : "Activate"}
                        >
                          {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setDeleteConfirm(product)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" title="Delete">
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

        <div className="flex flex-col gap-3 border-t border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredProducts.length === 0 ? 0 : startIndex + 1}–
            {Math.min(startIndex + pageSize, filteredProducts.length)} of {filteredProducts.length} results
          </div>
          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={safeCurrentPage === 0} className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-gray-700">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">{safeCurrentPage + 1} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safeCurrentPage >= totalPages - 1} className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-gray-700">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
        className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter product name"
                  maxLength={200}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                <p className="mt-1 text-xs text-gray-400">{form.name.length}/200</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category <span className="text-red-500">*</span></label>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateField("categoryId", Number(e.target.value))}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${errors.categoryId ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
                <button type="button" onClick={() => setNewCategoryForm((prev) => ({ ...prev, show: !prev.show }))} className="mt-1 text-xs text-blue-600 hover:text-blue-700">
                  + Create new category
                </button>
                {newCategoryForm.show && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryForm.name}
                      onChange={(e) => setNewCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Icon emoji"
                      value={newCategoryForm.icon}
                      onChange={(e) => setNewCategoryForm((prev) => ({ ...prev, icon: e.target.value }))}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <button type="button" onClick={onCreateCategory} className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">Save</button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Brand <span className="text-red-500">*</span></label>
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
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${errors.brand ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
              />
              {errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}
              {brandSearch && filteredBrands.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => {
                        setBrandSearch(brand.name);
                        updateField("brandId", brand.id);
                        updateField("brandName", brand.name);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description <span className="text-red-500">*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Enter product description"
                rows={4}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${errors.description ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Price (₹) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="0.00"
                    className={`w-full rounded-lg border py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${errors.price ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
                </div>
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Original Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) => updateField("originalPrice", e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                {discountPercent > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    Showing as: ~~₹{Number(form.originalPrice).toFixed(2)}~~ ₹{Number(form.price).toFixed(2)} ({discountPercent}% off)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Quantity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => updateField("stockQuantity", e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${errors.stockQuantity ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.stockQuantity && <p className="mt-1 text-xs text-red-500">{errors.stockQuantity}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => updateField("lowStockThreshold", Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-400">Alert will show when stock falls to this level.</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Images (up to 10, max 5MB each)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400 dark:border-gray-700"
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Click or drag images here to upload</p>
                <p className="text-xs text-gray-400">JPG, PNG, WebP — max 5MB</p>
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
                    <div key={index} className="group relative aspect-square rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <img src={img.url} alt={`Preview ${index + 1}`} className="h-full w-full rounded-lg object-cover" />
                      {img.isPrimary && (
                        <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">PRIMARY</span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100">
<button type="button" onClick={() => onSetPrimaryImage(index)} className="rounded bg-white/20 p-1 text-white hover:bg-white/40" title="Set as primary">
                           <Star className="h-3 w-3" />
                         </button>
                        <button type="button" onClick={() => onRemoveImage(index)} className="rounded bg-red-500/80 p-1 text-white hover:bg-red-600" title="Remove">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:bg-gray-800">
                {form.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
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
                  className="min-w-[120px] flex-1 border-none bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Specifications</label>
                <button type="button" onClick={addSpec} className="text-xs text-blue-600 hover:text-blue-700">+ Add Specification</button>
              </div>
              {form.specs.map((spec, index) => (
                <div key={index} className="mb-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={spec.key}
                    onChange={(e) => updateSpec(index, "key", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, "value", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <button type="button" onClick={() => removeSpec(index)} className="rounded-lg p-2 text-gray-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {form.specs.length === 0 && <p className="text-xs text-gray-400">No specifications added.</p>}
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
          <button type="button" onClick={onClose} className="btn btn-modern btn-modern-outline">Cancel</button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Active</span>
                <button type="button" onClick={() => updateField("isActive", !form.isActive)} className="text-gray-400">
                  {form.isActive ? <ToggleRight className="h-6 w-6 text-green-600" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Featured</span>
                <button type="button" onClick={() => updateField("isFeatured", !form.isFeatured)} className="text-gray-400">
                  {form.isFeatured ? <ToggleRight className="h-6 w-6 text-blue-600" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
              </label>
            </div>
            <button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-modern btn-modern-primary">
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
  const variantClass = confirmVariant === "success" ? "bg-green-600 hover:bg-green-700" : confirmVariant === "warning" ? "bg-amber-600 hover:bg-amber-700" : "bg-red-600 hover:bg-red-700";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className={`rounded-full p-2 ${confirmVariant === "success" ? "bg-green-100 text-green-600" : confirmVariant === "warning" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn btn-modern btn-modern-outline">Cancel</button>
          <button onClick={onConfirm} className={`btn btn-modern ${variantClass} text-white`}>{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminProducts;
