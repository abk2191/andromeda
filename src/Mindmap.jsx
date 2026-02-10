import React, { useState, useEffect } from "react";
import {
  saveAllData,
  getAllData,
  saveMindmapData,
  loadMindmapData,
} from "./firestore-helpers";

const STORAGE_KEY = "mindmaps";

/* 🎨 Fixed color palette (Notes-style) */
const NODE_COLORS = [
  "#1A1A2E", // Dark navy
  "#16213E", // Deep blue
  "#0F3460", // Ocean blue
  "#533483", // Royal purple
  "#0D7377", // Dark teal
  "#393E46", // Charcoal
  "#222831", // Gunmetal
  "#323232", // Dark gray
];

/* ---------- Helpers ---------- */
const createEmptyMap = () => ({
  id: Math.random().toString(36).slice(2),
  nodes: [
    {
      id: "root",
      text: "Main Topic",
      parentId: null,
      children: [],
      color: "#000033",
    },
  ],
});

/* ---------- Component ---------- */
export default function Mindmap({ lightTheme }) {
  const [maps, setMaps] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMap, setActiveMap] = useState(null);
  const [mode, setMode] = useState("idle");
  const [inputMap, setInputMap] = useState({});
  const [scale, setScale] = useState(1);

  const [isDarkTheme, setIsDarkTheme] = useState(!lightTheme);

  /* 🎨 palette open state (single node at a time) */
  const [openColorNode, setOpenColorNode] = useState(null);

  //******************************************************************/

  useEffect(() => {
    const checkAuth = async () => {
      const { auth, onAuthStateChanged } = await import("./firebase.js");
      onAuthStateChanged(auth, (user) => {
        if (user && !user.isAnonymous) {
          console.log("✅ Mindmap: User signed in:", user.email, user.uid);
          setIsAuthenticated(true);
          loadMindmapsFromFirestore(); // Load user-specific data
        } else {
          console.log("👤 Mindmap: No user signed in or anonymous");
          setIsAuthenticated(false);
          // Clear data if user signs out
          if (user === null) {
            setMaps([]);
            setActiveMap(null);
          }
        }
      });
    };
    checkAuth();
  }, []);

  // Load mindmaps from Firestore
  const loadMindmapsFromFirestore = async () => {
    try {
      const loadedMaps = await loadMindmapData();
      if (loadedMaps.length > 0) {
        setMaps(loadedMaps);
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        setMaps(saved ? JSON.parse(saved) : []);
      }
    } catch (error) {
      console.error("Error loading mindmaps from Firestore:", error);
      // Fallback to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      setMaps(saved ? JSON.parse(saved) : []);
    }
  };

  // Update persistMaps to save to Firestore
  const persistMaps = async (updated) => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Save to Firestore
    try {
      await saveMindmapData(updated);
      console.log("✅ Mindmaps saved to Firestore");
    } catch (error) {
      console.error("Error saving mindmaps to Firestore:", error);
    }
  };

  // Add Google sign-in/sign-out functions
  const handleGoogleSignIn = async () => {
    try {
      const { auth, googleProvider, signInWithPopup } =
        await import("./firebase.js");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      alert(`Signed in as: ${user.email}`);
      window.location.reload();
    } catch (error) {
      console.error("❌ Google sign-in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { auth, signOut } = await import("./firebase.js");
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("❌ Sign out failed:", error);
    }
  };

  const handleClearUserData = () => {
    if (window.confirm("Clear all local mindmap data?")) {
      localStorage.removeItem(STORAGE_KEY);
      setMaps([]);
      setActiveMap(null);
      alert("Local mindmap data cleared.");
    }
  };

  //******************************************************************/

  useEffect(() => {
    setIsDarkTheme(!lightTheme);
  }, [lightTheme]);

  /* ---------- Map Actions ---------- */
  const startNewMap = () => {
    setActiveMap(createEmptyMap());
    setMode("editing");
  };

  const saveMap = () => {
    setMaps((prev) => {
      const exists = prev.find((m) => m.id === activeMap.id);
      const updated = exists
        ? prev.map((m) => (m.id === activeMap.id ? activeMap : m))
        : [...prev, activeMap];

      persistMaps(updated);
      return updated;
    });

    setActiveMap(null);
    setMode("idle");
  };

  const deleteMap = (id) => {
    if (!window.confirm("Delete this map?")) return;

    setMaps((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      persistMaps(updated);
      return updated;
    });
  };

  /* ---------- Node Logic ---------- */
  const updateNode = (id, patch) => {
    setActiveMap((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  };

  const addChild = (parentId) => {
    const text = inputMap[parentId];
    if (!text) return;

    const newNode = {
      id: Math.random().toString(36).slice(2),
      text,
      parentId,
      children: [],
      color: "#374151",
    };

    setActiveMap((prev) => ({
      ...prev,
      nodes: prev.nodes
        .map((n) =>
          n.id === parentId
            ? { ...n, children: [...n.children, newNode.id] }
            : n,
        )
        .concat(newNode),
    }));

    setInputMap((p) => ({ ...p, [parentId]: "" }));
  };

  /* ---------- Recursive Renderer ---------- */
  const renderNode = (node, level = 0) => {
    const children = node.children
      .map((id) => activeMap.nodes.find((n) => n.id === id))
      .filter(Boolean);

    return (
      <div key={node.id} style={{ marginLeft: level === 0 ? 0 : 24 }}>
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateNode(node.id, { text: e.target.innerText })}
          style={{ ...styles.node, background: node.color }}
        >
          {node.text}
        </div>

        <div style={styles.controls}>
          {/* 🎨 Color palette selector (REPLACED color picker) */}
          <button
            className="paint-btn"
            onClick={() =>
              setOpenColorNode(openColorNode === node.id ? null : node.id)
            }
            style={{ color: isDarkTheme ? "white" : "#000033" }} // Added
          >
            <i class="fa-solid fa-brush"></i>
          </button>

          {openColorNode === node.id && (
            <div style={styles.palette}>
              {NODE_COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => {
                    updateNode(node.id, { color: c });
                    setOpenColorNode(null);
                  }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: c,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}

          <input
            value={inputMap[node.id] || ""}
            style={{
              outline: "none",
              background: "transparent",
              border: "none",
              color: isDarkTheme ? "white" : "#000033",
            }}
            onChange={(e) =>
              setInputMap((p) => ({
                ...p,
                [node.id]: e.target.value,
              }))
            }
            placeholder="Add sub-topic"
          />

          <button
            onClick={() => addChild(node.id)}
            style={{ border: "none", fontSize: "20px", background: "none" }}
          >
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        {children.length > 0 && (
          <div style={styles.children}>
            {children.map((child) => (
              <div key={child.id} style={styles.childRow}>
                <div style={styles.horizontalLine} />
                {renderNode(child, level + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ---------- UI ---------- */
  if (mode === "idle") {
    return (
      <div style={styles.container}>
        <div className="in-center">
          <h1
            style={{
              color: isDarkTheme ? "white" : "#000033", // Added
              // textShadow: isDarkTheme
              //   ? "0 0 10px white, 0 0 20px rgba(255, 255, 255, 0.5)"
              //   : "0 0 10px #000033, 0 0 20px rgba(255, 255, 255, 0.5)", // Added
              fontSize: "45px",
              marginBottom: "15px",
            }}
          >
            {" "}
            <i class="fa-solid fa-brain"></i> Mindmap
          </h1>

          <button className="new-action-button" onClick={startNewMap}>
            ADD MAP &nbsp;<i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          {maps.map((map) => (
            <div
              key={map.id}
              style={{
                padding: "32px",
                background: "transparent",
                cursor: "pointer",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: isDarkTheme ? "white" : "#000033",
                height: "80px",
                fontSize: "25px",
                borderBottom: isDarkTheme
                  ? "1px solid #1a1a1a"
                  : "1px solid rgb(202, 201, 201)",
              }}
              onClick={() => {
                setActiveMap(JSON.parse(JSON.stringify(map)));
                setMode("editing");
              }}
            >
              <span>{map.nodes[0]?.text || "Untitled"}</span>

              <button
                style={{
                  border: "none",
                  background: "transparent",
                  color: isDarkTheme ? "white" : "#000033", // Changed this line
                  cursor: "pointer",
                  fontSize: "20px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMap(map.id);
                }}
              >
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const root = activeMap.nodes.find((n) => n.parentId === null);

  return (
    <div style={styles.container}>
      <div className="in-center">
        <button className="new-action-button" onClick={saveMap}>
          SAVE MAP
        </button>

        <div style={styles.zoom}>
          <button
            className="zoom-control-buttons"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            style={{ color: isDarkTheme ? "white" : "#000033" }} // Added
          >
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>

          <button
            className="zoom-control-buttons"
            onClick={() => setScale(1)}
            style={{ color: isDarkTheme ? "white" : "#000033" }} // Added
          >
            <i className="fa-solid fa-arrows-rotate"></i>
          </button>

          <button
            className="zoom-control-buttons"
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            style={{ color: isDarkTheme ? "white" : "#000033" }} // Added
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
        </div>
      </div>

      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {root && renderNode(root)}
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  container: {
    padding: 20,
    marginTop: 100,
    fontFamily: "sans-serif",
  },
  node: {
    padding: "8px 14px",
    borderRadius: 12,
    color: "#fff",
    display: "inline-block",
  },
  controls: {
    display: "flex",
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
    position: "relative",
  },
  palette: {
    display: "flex",
    gap: 6,
    padding: 6,
    background: "gray",
    borderRadius: 8,
  },
  mapCard: {
    padding: 32,
    background: "transparent",

    cursor: "pointer",
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#000033",
    height: "80px",
    fontSize: "25px",
    borderBottom: "1px solid #000033",
  },
  deleteBtn: {
    border: "none",
    background: "transparent",
    color: "white",
    cursor: "pointer",
    fontSize: "20px",
  },
  zoom: {
    display: "flex",
    gap: 15,
    marginBottom: 10,
  },
  children: {
    borderLeft: "2px solid #9ca3af",
    marginLeft: 10,
    paddingLeft: 12,
  },
  childRow: {
    display: "flex",
  },
  horizontalLine: {
    width: 12,
    height: 2,
    background: "#9ca3af",
    marginTop: 14,
    marginRight: 6,
  },
};
