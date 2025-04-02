import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./login.css";
import loadingImage from "../assets/images/loading.gif";
import topImage from "../assets/images/top_img.png";

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }

    // Preloader
    setTimeout(function () {
      document.querySelector(".loader_bg").style.display = "none";
    }, 1500);

    // Mouseover
    const megamenu = document.querySelector(".main-menu ul li.megamenu");
    const wrapper = document.getElementById("wrapper");

    if (megamenu && wrapper) {
      megamenu.addEventListener("mouseover", function () {
        if (!megamenu.parentElement.classList.contains("wrapper")) {
          wrapper.classList.add("overlay");
        }
      });

      megamenu.addEventListener("mouseleave", function () {
        wrapper.classList.remove("overlay");
      });
    }

    // Scroll to Top
    window.addEventListener("scroll", function () {
      const scroll = window.scrollY;
      const backToTop = document.getElementById("back-to-top");

      if (backToTop) {
        if (scroll >= 100) {
          backToTop.classList.add("b-show_scrollBut");
        } else {
          backToTop.classList.remove("b-show_scrollBut");
        }
      }
    });

    const backToTop = document.getElementById("back-to-top");
    if (backToTop) {
      backToTop.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    }

    // Toggle Sidebar
    const sidebarCollapse = document.getElementById("sidebarCollapse");
    const sidebar = document.getElementById("sidebar");

    if (sidebarCollapse && sidebar) {
      sidebarCollapse.addEventListener("click", function () {
        sidebar.classList.toggle("active");
        sidebarCollapse.classList.toggle("active");
      });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="main-layout">
      {/* Loader */}
      <div className="loader_bg">
        <div className="loader">
          <img src={loadingImage} alt="Loading" />
        </div>
      </div>

      {/* Header */}
      <header>
        <div className="head-top">
          <div className="container-fluid">
            <div className="row d_flex">
              <div className="col-sm-3">
                <div className="logo">
                  <a href="/">DecentraVerify</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Slider Section */}
      <div id="top_section" className="banner_main">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div
                id="myCarousel"
                className="carousel slide"
                data-ride="carousel"
              >
                <ol className="carousel-indicators">
                  <li
                    data-target="#myCarousel"
                    data-slide-to="0"
                    className="active"
                  ></li>
                  <li data-target="#myCarousel" data-slide-to="1"></li>
                  <li data-target="#myCarousel" data-slide-to="2"></li>
                </ol>
                <div className="carousel-inner">
                  <div className="carousel-item active">
                    <div className="container-fluid">
                      <div className="carousel-caption relative">
                        <div className="row d_flex">
                          <div className="col-md-6">
                            <div className="con_img">
                              <figure>
                                <img
                                  className="img_responsive"
                                  src={topImage}
                                  alt="#"
                                />
                              </figure>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="bluid">
                              <h1>
                                Protect and
                                <br />
                                Store your <span>Credentials</span> here.
                              </h1>
                              <p>
                                To store your credentials on chain, click the
                                button below to login.
                              </p>
                              <button
                                type="button"
                                className="login_button"
                                onClick={login}
                              >
                                Login with Internet Identity
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
