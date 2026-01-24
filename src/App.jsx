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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState(false);
  const sidebarRef = useRef(null);

  /* ---------------- Theme ---------------- */
  const [lightTheme, setLightTheme] = useState(() => {
    const savedTheme = localStorage.getItem("lightTheme");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

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

  /* ---------------- Close Sidebar When Clicking Outside ---------------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If sidebar is open and click is outside the sidebar
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        // Also check if click is not on the hamburger button
        !event.target.closest(".hamburger")
      ) {
        closeSidebar();
      }
    };

    // Add event listener when sidebar is open
    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
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

  return (
    /* ✅ CHANGED basename */
    <Router basename="/andromeda">
      <div>
        {/* ---------------- Navbar ---------------- */}
        <div className="navbar">
          <div className="logo">
            <h3 style={{ color: "white" }}>Andromeda.</h3>
          </div>

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

        {/* ---------------- Sidebar ---------------- */}
        {shouldRenderSidebar && (
          <div ref={sidebarRef} className="sidebar">
            <div className="sliding-div-container item-style">
              <div
                className="sliding-div div-style"
                onClick={() => {
                  window.location.href = "/andromeda/notes";
                  closeSidebar();
                }}
              >
                <div className="sidebar-menu-items">
                  <i className="fa-solid fa-lightbulb"></i>
                  <h2 style={{ fontSize: "25px" }}>NOTES</h2>
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
                  <h2 style={{ fontSize: "25px" }}>TODOS</h2>
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
                  <h2 style={{ fontSize: "25px" }}>CALENDAR</h2>
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
                  <h2 style={{ fontSize: "25px" }}>MINDMAP</h2>
                </div>
              </div>
            </div>

            {/* ---------------- Theme Toggle ---------------- */}
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
                <h2 style={{ color: "white", fontSize: "20px" }}>
                  <i className="fa-solid fa-flask"></i> iINTUIT Labs.
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Routes ---------------- */}
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
  );
}

export default App;
