import React, { useEffect, useState } from "react";
import Home from "./Home"
import API from "../axios";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onSelectCategory }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const getInitialTheme = () => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme ? storedTheme : "light-theme";
  };
  const [selectedCategory, setSelectedCategory] = useState("");
  const [theme, setTheme] = useState(getInitialTheme());
  const [input, setInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleChange = async (value) => {
    setInput(value);
    if (value.length >= 1) {
      setShowSearchResults(true);
      try {
        const response = await API.get(
          `/products/search?keyword=${value}`
        );
        setSearchResults(response.data);
        setNoResults(response.data.length === 0);
      } catch (error) {
        console.error("Error searching:", error);
      }
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
      setNoResults(false);
    }
  };

  
  // const handleChange = async (value) => {
  //   setInput(value);
  //   if (value.length >= 1) {
  //     setShowSearchResults(true);
  //     try {
  //       let response;
  //       if (!isNaN(value)) {
  //         // Input is a number, search by ID
  //         response = await axios.get(`http://localhost:8080/api/products/search?id=${value}`);
  //       } else {
  //         // Input is not a number, search by keyword
  //         response = await axios.get(`http://localhost:8080/api/products/search?keyword=${value}`);
  //       }

  //       const results = response.data;
  //       setSearchResults(results);
  //       setNoResults(results.length === 0);
  //       console.log(results);
  //     } catch (error) {
  //       console.error("Error searching:", error.response ? error.response.data : error.message);
  //     }
  //   } else {
  //     setShowSearchResults(false);
  //     setSearchResults([]);
  //     setNoResults(false);
  //   }
  // };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    onSelectCategory(category);
  };
  const toggleTheme = () => {
    const newTheme = theme === "dark-theme" ? "light-theme" : "dark-theme";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const categories = [
    "Laptop",
    "Headphone",
    "Mobile",
    "Electronics",
    "Toys",
    "Fashion",
  ];
  return (
    <>
      <header>
        <nav className="navbar navbar-expand-lg fixed-top">
          <div className="container-fluid">
            <a className="navbar-brand" href="https://github.com/mohammad-mursalin">
              Mursalin
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <a className="nav-link active" aria-current="page" href="/">
                      Home
                    </a>
                  </li>
                  {isAuthenticated && (
                    <li className="nav-item">
                      <a className="nav-link" href="/orders">
                        My Orders
                      </a>
                    </li>
                  )}
                  {isAdmin && (
                    <>
                      <li className="nav-item">
                        <a className="nav-link" href="/add_product">
                          Add Product
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="/admin">
                          Admin Dashboard
                        </a>
                      </li>
                    </>
                  )}
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="/"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Categories
                    </a>

                    <ul className="dropdown-menu">
                      {categories.map((category) => (
                        <li key={category}>
                          <button
                            className="dropdown-item"
                            onClick={() => handleCategorySelect(category)}
                          >
                            {category}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
                {isAuthenticated && (
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                      <span className="nav-link">
                        Welcome, {user?.fullName || user?.email}
                      </span>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="/profile">
                        Profile
                      </a>
                    </li>
                    <li className="nav-item">
                      <button
                        className="btn btn-link nav-link"
                        onClick={logout}
                        style={{ cursor: "pointer" }}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
                {!isAuthenticated && (
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                      <a className="nav-link" href="/login">
                        Login
                      </a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="/register">
                        Register
                      </a>
                    </li>
                  </ul>
                )}
              <button className="theme-btn" onClick={() => toggleTheme()}>
                {theme === "dark-theme" ? (
                  <i className="bi bi-moon-fill"></i>
                ) : (
                  <i className="bi bi-sun-fill"></i>
                )}
              </button>
               <div className="d-flex align-items-center">
                 <a href="/cart" className="nav-link text-dark">
                   <i className="bi bi-cart me-2"></i>
                   Cart
                 </a>
                 <input
                   className="form-control me-2"
                   type="search"
                   placeholder="Search products..."
                   aria-label="Search"
                   value={input}
                   onChange={(e) => handleChange(e.target.value)}
                   onFocus={() => setSearchFocused(true)}
                   onBlur={() => setSearchFocused(false)}
                   style={{ maxWidth: '250px' }}
                 />
                 {showSearchResults && (
                   <ul className="list-group" style={{ position: 'absolute', top: '100%', right: 0, minWidth: '200px', zIndex: 1000 }}>
                     {searchResults.length > 0 ? (
                       searchResults.map((result) => (
                         <li key={result.id} className="list-group-item">
                           <a href={`/product/${result.id}`} className="search-result-link">
                             <span>{result.name}</span>
                           </a>
                         </li>
                       ))
                     ) : (
                       noResults && (
                         <p className="no-results-message">
                           No product found
                         </p>
                       )
                     )}
                   </ul>
                 )}
               </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
