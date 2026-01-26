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

  /* ---------------- Theme ---------------- */
  const [lightTheme, setLightTheme] = useState(() => {
    const savedTheme = localStorage.getItem("lightTheme");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

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
    } else {
      document.body.classList.add("dark-theme");
      document.documentElement.classList.add("dark-theme");
    }
  }, [lightTheme]);

  useEffect(() => {
    if (lightTheme) {
      document.body.classList.remove("dark-theme");
      document.documentElement.classList.remove("dark-theme");
    }
  }, []);

  /* ---------------- Sign Out Function ---------------- */
  const handleSignOut = async () => {
    try {
      // Import clearLocalUserData function
      const { clearLocalUserData } = await import("./firestore-helpers");

      // Clear all local data before signing out
      clearLocalUserData();

      const { auth, signOut } = await import("./firebase.js");
      await signOut(auth);
      setUser(null);
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
          <div className="navbar">
            <div className="logo">
              <h3 style={{ color: "white" }}>Andromeda.</h3>
            </div>

            {/* User info in navbar */}
            {/* <div
              className="user-info"
              style={{
                position: "absolute",
                right: "80px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "white",
              }}
            >
              <span style={{ fontSize: "14px" }}>{user.email}</span>
            </div> */}

            <button
              className={`hamburger ${isSidebarOpen ? "open" : ""}`}
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          {shouldRenderSidebar && (
            <div ref={sidebarRef} className="sidebar">
              {/* <div>
                <div
                  className="user-info"
                  style={{
                    color: "red",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{user.email}</span>
                </div>
              </div> */}
              <div className="sliding-div-container item-style">
                <span className="user-info">
                  <i class="fa-solid fa-user"></i> &nbsp;{user.email}
                  <div className="placeholder-div"></div>
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
                    <h2 style={{ fontSize: "18px" }}>TODOS</h2>
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
                  // className="sliding-div-two div-style"
                  className="sign-out"
                  onClick={handleSignOut}
                  style={{
                    cursor: "pointer",
                  }}
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
