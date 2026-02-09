// App.jsx - UPDATED WITH LOGIN CONDITION AND SIGNOUT
import { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Notes from "./Notes";
import Todo from "./Todo";
import Calendar from "./Calendar";
import Mindmap from "./Mindmap";
import Login from "./Login";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState(false);
  const sidebarRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load selectedThemeColor from localStorage on initial render
  const [selectedThemeColor, setSelectedThemeColor] = useState(() => {
    const savedColor = localStorage.getItem("selectedThemeColor");
    return savedColor || "#000033"; // Default to navy blue
  });

  // Load selectedAccentColor from localStorage on initial render
  const [selectedAccentColor, setSelectedAccentColor] = useState(() => {
    const savedAccent = localStorage.getItem("selectedAccentColor");
    return savedAccent || "";
  });

  /* ---------------- Theme ---------------- */
  const [lightTheme, setLightTheme] = useState(() => {
    const savedTheme = localStorage.getItem("lightTheme");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // Helper function to generate accent color
  const generateAccentColor = (color, isLightTheme) => {
    let accentColor = "";

    // Set accent color based on selected theme color (only in light mode)
    if (isLightTheme) {
      if (color === "rgb(30, 6, 27)") {
        accentColor = "rgb(63, 13, 56)"; // Lighter yellow
      } else if (color === "rgb(185, 210, 61)") {
        accentColor = "rgb(177, 199, 62)"; // Lighter maroon
      } else if (color === "#000033") {
        accentColor = "#0e0e5f"; // Lighter navy blue
      } else if (color === "rgb(38, 134, 38)") {
        accentColor = "rgb(26, 90, 26)"; // Lighter green
      }
    }

    setSelectedAccentColor(accentColor);
    localStorage.setItem("selectedAccentColor", accentColor); // Save to localStorage
  };

  function handleThemeChange(color) {
    console.log("Triggered:", color);
    setSelectedThemeColor(color);
    localStorage.setItem("selectedThemeColor", color); // Save to localStorage

    // Generate accent color based on selected theme color (only in light mode)
    generateAccentColor(color, lightTheme);
  }

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { auth, onAuthStateChanged } = await import("./firebase.js");
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading Firebase:", error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem("lightTheme", JSON.stringify(lightTheme));

    if (lightTheme) {
      document.body.classList.remove("dark-theme");
      document.documentElement.classList.remove("dark-theme");

      // When switching back to light mode, regenerate accent color if a theme color is selected
      if (selectedThemeColor && selectedThemeColor !== "#000033") {
        generateAccentColor(selectedThemeColor, true);
      }
    } else {
      document.body.classList.add("dark-theme");
      document.documentElement.classList.add("dark-theme");
      // Clear accent color when switching to dark mode
      if (selectedAccentColor) {
        setSelectedAccentColor("");
        localStorage.setItem("selectedAccentColor", "");
      }
    }
  }, [lightTheme]);

  // Add this useEffect to regenerate accent color on initial load
  useEffect(() => {
    if (lightTheme && selectedThemeColor && selectedThemeColor !== "#000033") {
      generateAccentColor(selectedThemeColor, lightTheme);
    }
  }, []); // Run only once on initial render

  /* ---------------- Sign Out Function ---------------- */
  const handleSignOut = async () => {
    try {
      // Import clearLocalUserData function
      const { clearLocalUserData } = await import("./firestore-helpers");

      // Clear all local data before signing out
      clearLocalUserData();

      // Optionally clear theme color on sign out
      // localStorage.removeItem("selectedThemeColor");

      const { auth, signOut } = await import("./firebase.js");
      await signOut(auth);
      setUser(null);
      // Reset to default color on sign out if desired
      // setSelectedThemeColor("");
      closeSidebar();
    } catch (error) {
      console.error("❌ Sign out failed:", error);
    }
  };

  /* ---------------- Close Sidebar When Clicking Outside ---------------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".hamburger")
      ) {
        closeSidebar();
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  /* ---------------- Sidebar Logic ---------------- */
  const toggleSidebar = () => {
    if (!isSidebarOpen) {
      setShouldRenderSidebar(true);
    } else {
      if (sidebarRef.current) {
        sidebarRef.current.classList.remove("sidebar-open");
        sidebarRef.current.classList.add("sidebar-close");
      }
      setTimeout(() => {
        setShouldRenderSidebar(false);
      }, 300);
    }
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (shouldRenderSidebar && isSidebarOpen && sidebarRef.current) {
      setTimeout(() => {
        sidebarRef.current.classList.add("sidebar-open");
        sidebarRef.current.classList.remove("sidebar-close");
      }, 10);
    }
  }, [shouldRenderSidebar, isSidebarOpen]);

  const closeSidebar = () => {
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  function handleThemeSwitch() {
    setLightTheme((prev) => !prev);
  }

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#000033",
          color: "white",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1>Andromeda</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, show login page
  if (!user) {
    return <Login />;
  }

  // If user is logged in, show the main app
  return (
    <>
      <Router basename="/andromeda">
        <div>
          <div
            className="navbar"
            style={{
              backgroundColor: selectedThemeColor || "#000033",
              background: selectedThemeColor || "#000033",
            }}
          >
            <div className="logo">
              <h3 style={{ color: "white" }}>Andromeda.</h3>
            </div>

            <button
              className={`hamburger ${isSidebarOpen ? "open" : ""} ${lightTheme && selectedAccentColor ? "has-accent-hover" : ""}`}
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
              style={
                lightTheme && selectedAccentColor
                  ? {
                      "--accent-hover-color": selectedAccentColor,
                    }
                  : {}
              }
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          {shouldRenderSidebar && (
            <div
              ref={sidebarRef}
              className="sidebar"
              style={{
                backgroundColor: selectedThemeColor || "#000033",
                background: selectedThemeColor || "#000033",
                borderTop:
                  lightTheme && selectedAccentColor
                    ? `1px solid ${selectedAccentColor}`
                    : undefined,
              }}
            >
              <div className="sliding-div-container item-style">
                <span
                  className="user-info"
                  style={{
                    borderBottom:
                      lightTheme && selectedAccentColor
                        ? `1px solid ${selectedAccentColor}`
                        : undefined,
                  }}
                >
                  <div className="flex-div">
                    <i className="fa-solid fa-user"></i>
                    {user.email}{" "}
                  </div>
                </span>
                <div
                  className="sliding-div div-style"
                  onClick={() => {
                    window.location.href = "/andromeda/notes";
                    closeSidebar();
                  }}
                >
                  <div className="sidebar-menu-items">
                    <i className="fa-solid fa-lightbulb"></i>
                    <h2 style={{ fontSize: "18px" }}>NOTES</h2>
                  </div>
                </div>

                <div
                  className="sliding-div-two div-style"
                  onClick={() => {
                    window.location.href = "/andromeda/todo";
                    closeSidebar();
                  }}
                >
                  <div className="sidebar-menu-items">
                    <i className="fa-solid fa-list-check"></i>
                    <h2 style={{ fontSize: "18px" }}>LISTS</h2>
                  </div>
                </div>

                <div
                  className="sliding-div-two div-style"
                  onClick={() => {
                    window.location.href = "/andromeda/calendar";
                    closeSidebar();
                  }}
                >
                  <div className="sidebar-menu-items">
                    <i className="fa-solid fa-calendar-days"></i>
                    <h2 style={{ fontSize: "18px" }}>CALENDAR</h2>
                  </div>
                </div>

                <div
                  className="sliding-div-two div-style"
                  onClick={() => {
                    window.location.href = "/andromeda/mindmap";
                    closeSidebar();
                  }}
                >
                  <div className="sidebar-menu-items">
                    <i className="fa-solid fa-brain"></i>
                    <h2 style={{ fontSize: "18px" }}>MINDMAP</h2>
                  </div>
                </div>

                {/* Sign Out Button in Sidebar */}
                <div
                  className="sign-out"
                  style={
                    lightTheme && selectedAccentColor
                      ? {
                          backgroundColor: selectedAccentColor,
                        }
                      : {}
                  }
                  onClick={handleSignOut}
                >
                  <div className="sign-out-btn">
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <h2 style={{ fontSize: "20px", color: "white" }}>
                      SIGN OUT
                    </h2>
                  </div>
                </div>
              </div>

              <div className="theme-holder-main">
                <div className="theme-holder">
                  <h2 className="theme-text">
                    {lightTheme ? (
                      <>
                        <i className="fa-solid fa-sun"></i> Light
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-moon"></i> Dark
                      </>
                    )}
                  </h2>

                  <div className="toggle-border">
                    <input
                      id="one"
                      type="checkbox"
                      checked={lightTheme}
                      onChange={handleThemeSwitch}
                    />
                    <label htmlFor="one">
                      <div className="handle"></div>
                    </label>
                  </div>
                </div>

                <div className="theme-switcher-div">
                  <div
                    className="color-yellow-div"
                    onClick={() => handleThemeChange("rgb(30, 6, 27)")}
                  ></div>
                  <div
                    className="color-maroon-div"
                    onClick={() => handleThemeChange("rgb(185, 210, 61)")}
                  ></div>
                  <div
                    className="color-blue-div"
                    onClick={() => handleThemeChange("#000033")}
                  ></div>
                  <div
                    className="color-green-div"
                    onClick={() => handleThemeChange("rgb(38, 134, 38)")}
                  ></div>
                </div>

                <div className="name-brand">
                  <h2 style={{ color: "white" }}>
                    <i className="fa-solid fa-flask"></i> iINTUIT Labs.
                  </h2>
                </div>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Navigate to="/notes" />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/todo" element={<Todo />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route
              path="/mindmap"
              element={<Mindmap lightTheme={lightTheme} />}
            />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
