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
        className="grid"
        style={{
          marginTop: "64px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          padding: "20px",
        }}
      >
        {filteredProducts.length === 0 ? (
          <h2
            className="text-center"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            No Products Available
          </h2>
        ) : (
          filteredProducts.map((product) => {
            if (!product) return null;
            const { id, brand, name, price, productAvailable, imageUrl } =
              product;
            const cardStyle = {
              width: "18rem",
              height: "12rem",
              boxShadow: "rgba(0, 0, 0, 0.24) 0px 2px 3px",
              backgroundColor: productAvailable ? "#fff" : "#ccc",
            };
            return (
              <div
                className="card mb-3"
                style={{
                  width: "250px",
                  height: "360px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  borderRadius: "10px",
                  overflow: "hidden", 
                  backgroundColor: productAvailable ? "#fff" : "#ccc",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent:'flex-start',
                  alignItems:'stretch'
                }}
                key={id}
              >
                <Link
                  to={`/product/${id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={name || 'Product'}
                      style={{
                        width: "100%",
                        height: "150px", 
                        objectFit: "cover",  
                        padding: "5px",
                        margin: "0",
                        borderRadius: "10px 10px 10px 10px", 
                      }}
                    />
                  )}
                  <div
                    className="card-body"
                    style={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: "10px",
                    }}
                  >
                    <div>
                      <h5
                        className="card-title"
                        style={{ margin: "0 10px 0 0", fontSize: "1.2rem" }}
                      >
                        {(name || 'Unnamed Product').toUpperCase()}
                      </h5>
                      <i
                        className="card-brand"
                        style={{ fontStyle: "italic", fontSize: "0.8rem" }}
                      >
                        {"~ " + (brand || 'Unknown')}
                      </i>
                    </div>
                    <hr className="hr-line" style={{ margin: "10px 0" }} />
                    <div className="home-cart-price">
                      <h5
                        className="card-text"
                        style={{ fontWeight: "600", fontSize: "1.1rem",marginBottom:'5px' }}
                      >
                        <i class="bi bi-currency-rupee"></i>
                        {price || 0}
                      </h5>
                    </div>
                    <button
                      className="btn-hover color-9"
                      style={{margin:'10px 25px 0px '  }}
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(product);
                        showToast("Product added to cart");
                      }}
                      disabled={!productAvailable}
                    >
                      {productAvailable ? "Add to Cart" : "Out of Stock"}
                    </button> 
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default Home;
