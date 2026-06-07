import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import AppContext from "../Context/Context";
import { useToast } from "./Toast";
import unplugged from "../assets/unplugged.png"

const Home = ({ selectedCategory }) => {
  const { data, isError, addToCart, refreshData } = useContext(AppContext);
  const { showToast } = useToast();

  if (isError) {
    return (
      <h2 className="text-center" style={{ padding: "18rem" }}>
      <img src={unplugged} alt="Error" style={{ width: '100px', height: '100px' }}/>
      </h2>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <h2 className="text-center" style={{ padding: "18rem" }}>
        No Products Available
      </h2>
    );
  }

  const filteredProducts = selectedCategory
    ? data.filter((product) => product && product.category === selectedCategory)
    : data;
  return (
    <>
      <div
        className="container"
        style={{ marginTop: "64px", padding: "20px" }}
      >
        <h2 className="text-center mb-4">Our Products</h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <h4>No Products Available</h4>
            <p>Select a different category or browse all products</p>
          </div>
        ) : (
          <div
            className="row"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {filteredProducts.map((product) => {
              if (!product) return null;
              const { id, brand, name, price, productAvailable, imageUrl } =
                product;
              return (
                <div
                  className="col"
                  key={id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    className="card mb-3 h-100"
                    style={{
                      backgroundColor: productAvailable ? "#fff" : "#e9ecef",
                      opacity: productAvailable ? "1" : "0.7",
                      transition: "all 0.3s ease",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: productAvailable
                        ? "0 4px 12px rgba(0, 0, 0, 0.1)"
                        : "none",
                    }}
                  >
                    <Link
                      to={`/product/${id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                      className="h-100 d-flex flex-column"
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          paddingTop: "100%",
                          backgroundColor: "#f8f9fa",
                        }}
                      >
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={name || 'Product'}
                            style={{
                              position: "absolute",
                              top: "0",
                              left: "0",
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>
                      <div className="card-body" style={{ padding: "16px", flex: 1 }}>
                        <h5
                          className="card-title"
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: "600",
                            marginBottom: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={name || 'Product'}
                        >
                          {(name || 'Unnamed Product').toUpperCase()}
                        </h5>
                        <p
                          className="card-text"
                          style={{
                            fontSize: "0.9rem",
                            color: "#6c757d",
                            marginBottom: "12px",
                          }}
                        >
                          {brand || 'Unknown Brand'}
                        </p>
                        <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #e9ecef" }} />
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5
                            className="card-text mb-0"
                            style={{
                              fontWeight: "700",
                              fontSize: "1.2rem",
                              color: "#0d6efd",
                            }}
                          >
                            <i className="bi bi-currency-rupee"></i>
                            {price || 0}
                          </h5>
                        </div>
                        <button
                          className="btn btn-primary w-100"
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product);
                            showToast("Product added to cart");
                          }}
                          disabled={!productAvailable}
                          style={{
                            opacity: productAvailable ? "1" : "0.5",
                            cursor: productAvailable ? "pointer" : "not-allowed",
                            padding: "10px",
                            fontSize: "0.95rem",
                            fontWeight: "500",
                          }}
                        >
                          {productAvailable ? "Add to Cart" : "Out of Stock"}
                        </button>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
