import React, { useState } from "react";

const STORAGE_KEY = "mindmaps";

/* 🎨 Fixed color palette (Notes-style) */
const NODE_COLORS = [
  "red", // navy
  "blue", // slate
  "green", // gray
  "greenyellow", // green
  "gold", // purple
  "magenta", // maroon
  "cyan", // olive
  "#1a1a1a", // dark
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
export default function Mindmap() {
  const [maps, setMaps] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeMap, setActiveMap] = useState(null);
  const [mode, setMode] = useState("idle");
  const [inputMap, setInputMap] = useState({});
  const [scale, setScale] = useState(1);

  /* 🎨 palette open state (single node at a time) */
  const [openColorNode, setOpenColorNode] = useState(null);

  /* ---------- Persistence ---------- */
  const persistMaps = (updated) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

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
            : n
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
            style={{ outline: "none" }}
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
            style={{ border: "none", fontSize: "20px" }}
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
              color: "#000033",
              textShadow: "0 0 10px #000033, 0 0 20px rgba(255, 255, 255, 0.5)",
              fontSize: "45px",
              marginBottom: "15px",
            }}
          >
            {" "}
            <i class="fa-solid fa-brain"></i> Mindmap
          </h1>

          <button className="add-new-note-button" onClick={startNewMap}>
            <span class="button_top"> ADD MAP</span>
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          {maps.map((map) => (
            <div
              key={map.id}
              style={styles.mapCard}
              onClick={() => {
                setActiveMap(JSON.parse(JSON.stringify(map)));
                setMode("editing");
              }}
            >
              <span>{map.nodes[0]?.text || "Untitled"}</span>

              <button
                style={styles.deleteBtn}
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
        <button className="add-new-note-button" onClick={saveMap}>
          <span class="button_top"> SAVE MAP</span>
        </button>

        <div style={styles.zoom}>
          <button
            className="zoom-control-buttons"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          >
            <i class="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <button className="zoom-control-buttons" onClick={() => setScale(1)}>
            <i class="fa-solid fa-arrows-rotate"></i>
          </button>
          <button
            className="zoom-control-buttons"
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
          >
            <i class="fa-solid fa-magnifying-glass-plus"></i>
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
    background: "#000033",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "white",
    height: "80px",
    fontSize: "25px",
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
