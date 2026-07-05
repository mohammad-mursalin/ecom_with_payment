import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-default">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 text-decoration-none">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-white">M</span>
              </div>
              <span className="text-xl font-bold text-primary">Mursalin</span>
            </Link>
            <p className="text-base text-muted">
              Quality products for your lifestyle
            </p>
          </div>

          <div className="flex flex-wrap gap-6 justify-start md:justify-end">
            <Link
              to="/"
              className="text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Products
            </Link>
            <Link
              to="/products"
              className="text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Categories
            </Link>
            <Link
              to="/cart"
              className="text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Cart
            </Link>
            <Link
              to="/wishlist"
              className="text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Wishlist
            </Link>
            <span className="text-sm font-medium text-muted">
              Privacy Policy
            </span>
            <span className="text-sm font-medium text-muted">
              Terms
            </span>
          </div>
        </div>

        <div className="border-t border-default" />

        <p className="text-center text-sm text-muted mt-8">
          © {currentYear} Mursalin. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
