import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { useState } from "react";
import AppContext from "../Context/Context";
import axios from "../axios";
import { useToast } from "./Toast";
import { ShoppingBasket, Trash2, Edit3, Star, CheckCircle, Package, Calendar, Tag, Info, Sparkles, ArrowLeft, ChevronRight, ShoppingCart, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

const Product = () => {
  const { id } = useParams();
  const { data, addToCart, removeFromCart, cart, refreshData } =
    useContext(AppContext);
  const [product, setProduct] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/product/${id}`
        );
        setProduct(response.data);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, [id]);

  const deleteProduct = async () => {
    try {
      await axios.delete(`/product/${id}`);
      removeFromCart(id);
      showToast("Product deleted successfully");
      refreshData();
      navigate("/");
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Error deleting product");
    }
  };

  const handleEditClick = () => {
    navigate(`/product/update/${id}`);
  };

  const handlAddToCart = () => {
    addToCart(product);
    showToast("Product added to cart");
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="empty-state">
          <ShoppingBasket className="empty-state-icon text-blue-600" />
          <h2 className="empty-state-title">Loading Product</h2>
          <p className="empty-state-description">Please wait while we fetch the product details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 page-transition">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-all mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </Link>

        <div className="product-detail-container">
          <div className="product-detail-image">
            <img
              src={product.imageUrl}
              alt={product.name}
            />
          </div>

          <div className="product-detail-info">
            <div className="flex items-center gap-3 mb-4">
              <span className="tag tag-primary">{product.category}</span>
              {product.productAvailable && (
                <span className="stock-badge in-stock">In Stock</span>
              )}
              {!product.productAvailable && (
                <span className="stock-badge out-of-stock">Out of Stock</span>
              )}
            </div>

            <div className="mb-2">
              <p className="text-sm text-blue-600 font-semibold mb-1">Listed on</p>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(product.releaseDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <h1 className="product-detail-title mb-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                {product.brand}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
              </div>
            </div>

            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg">Product Description</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Stock Available</span>
                <div className="flex items-center gap-2">
                  <div className="progress-bar w-32">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min((product.stockQuantity / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {product.stockQuantity}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8 p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--muted)' }}>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price</p>
                <div className="flex items-baseline gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <span className="product-detail-price">
                    ₹{product.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlAddToCart}
                disabled={!product.productAvailable}
                className="btn btn-modern btn-modern-primary flex-1"
              >
                <ShoppingBasket className="w-5 h-5" />
                Add to Cart
              </motion.button>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditClick}
                  className="btn btn-modern btn-modern-outline"
                >
                  <Edit3 className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteProduct}
                  className="btn btn-modern btn-modern-outline !border-red-500 !text-red-500 hover:!bg-red-500 hover:!text-white"
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--muted)' }}>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Category</p>
                  <p className="font-semibold text-sm">{product.category}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--muted)' }}>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-semibold text-sm">
                    {product.productAvailable ? 'Available' : 'Out of Stock'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Product;