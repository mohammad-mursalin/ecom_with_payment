import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="py-4 py-md-5"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      <div className="container">
        <div className="row">
          <div className="col-md-6 mb-4 mb-md-0">
            <Link to="/" className="d-flex align-items-center mb-2 text-decoration-none">
              <span
                className="fs-4 fw-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Mursalin
              </span>
            </Link>
            <p className="mb-0" style={{ color: "var(--text-muted)" }}>
              Quality products for your lifestyle
            </p>
          </div>

          <div className="col-md-6">
            <div className="d-flex flex-wrap gap-3 justify-content-md-end">
              <Link
                to="/"
                className="text-decoration-none"
                style={{ color: "var(--text-muted)" }}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-decoration-none"
                style={{ color: "var(--text-muted)" }}
              >
                Products
              </Link>
              <Link
                to="/products"
                className="text-decoration-none"
                style={{ color: "var(--text-muted)" }}
              >
                Categories
              </Link>
              <Link
                to="/cart"
                className="text-decoration-none"
                style={{ color: "var(--text-muted)" }}
              >
                Cart
              </Link>
              <Link
                to="/wishlist"
                className="text-decoration-none"
                style={{ color: "var(--text-muted)" }}
              >
                Wishlist
              </Link>
              <span style={{ color: "var(--text-muted)", cursor: "default" }}>
                Privacy Policy
              </span>
              <span style={{ color: "var(--text-muted)", cursor: "default" }}>
                Terms
              </span>
            </div>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: "var(--border-color)" }} />

        <p className="text-center mb-0" style={{ color: "var(--text-muted)" }}>
          &copy; {currentYear} Mursalin. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;