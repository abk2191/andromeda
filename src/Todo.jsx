import { useState, useRef, useEffect } from "react";
import { saveAllData, getAllData } from "./firestore-helpers";

function Todo() {
  // Load todos from Firestore on initial render
  const [renderDeleteWarning, setRenderDeleteWarning] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [todos, setTodos] = useState(() => {
    // Initial empty state - will load from Firestore in useEffect
    return [];
  });

  const [colorSelectorPosition, setColorSelectorPosition] = useState({
    top: 0,
    left: 0,
  });

  const [hex, setHex] = useState("");
  const [colorSelectorActiveTodoId, setColorSelectorActiveTodoId] =
    useState(null);
  const [todoActive, setTodoActive] = useState(false);
  const [selectedTodoIndex, setSelectedTodoIndex] = useState(null);
  const [pinnedTodos, setPinnedTodos] = useState(() => {
    // Initial empty state - will load from Firestore
    return [];
  });

  const [isTodoPinned, setIsTodoPinned] = useState(false);
  const [todoColors, setTodoColors] = useState(() => {
    // Initial empty state - will load from Firestore
    return {};
  });

  // State for editing todo title in modal
  const [editingTitle, setEditingTitle] = useState("");

  // Store tasks for each todo (object with todoId as keys)
  const [tasks, setTasks] = useState(() => {
    // Initial empty state - will load from Firestore
    return {};
  });

  //*******************************************************************************/
  //*******************************************************************************/

  const handleClearUserData = () => {
    if (
      window.confirm(
        "Clear all local todo data? This won't affect your Google account data.",
      )
    ) {
      localStorage.removeItem("todos");
      localStorage.removeItem("pinnedTodos");
      localStorage.removeItem("todoTasks");
      localStorage.removeItem("todoColors");
      localStorage.removeItem("last_saved_user");
      localStorage.removeItem("last_saved_email");

      setTodos([]);
      setPinnedTodos([]);
      setTasks({});
      setTodoColors({});

      alert("Local data cleared. Sign in again to load from Google.");
    }
  };

  // Google sign-in function
  const handleGoogleSignIn = async () => {
    try {
      console.log("🔐 Attempting Google sign-in...");

      // Import dynamically to avoid circular dependencies
      const { auth, googleProvider, signInWithPopup } =
        await import("./firebase.js");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("✅ Google sign-in successful!");
      console.log("📧 Email:", user.email);
      console.log("👤 Name:", user.displayName);
      console.log("🆔 UID:", user.uid);

      alert(`Signed in as: ${user.email}`);

      // Reload to refresh authentication state
      window.location.reload();
    } catch (error) {
      console.error("❌ Google sign-in failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "auth/popup-blocked") {
        alert("Please allow popups for Google sign-in");
      } else if (error.code === "auth/popup-closed-by-user") {
        console.log("User closed the sign-in popup");
      } else {
        alert(`Sign-in failed: ${error.message}`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      const { auth, signOut } = await import("./firebase.js");
      await signOut(auth);
      console.log("✅ Signed out successfully");
      window.location.reload();
    } catch (error) {
      console.error("❌ Sign out failed:", error);
    }
  };

  // Auth state check
  useEffect(() => {
    const checkAuth = async () => {
      const { auth, onAuthStateChanged } = await import("./firebase.js");
      onAuthStateChanged(auth, (user) => {
        if (user && !user.isAnonymous) {
          console.log("✅ Todo: User signed in:", user.email, user.uid);
          setIsAuthenticated(true);
          loadAllDataFromFirestore(); // Load user-specific data
        } else {
          console.log("👤 Todo: No user signed in or anonymous");
          setIsAuthenticated(false);
          // Clear data if user signs out
          if (user === null) {
            setTodos([]);
            setPinnedTodos([]);
            setTasks({});
            setTodoColors({});
          }
        }
      });
    };
    checkAuth();
  }, []);

  // Update this function to use getAllData properly:
  const loadAllDataFromFirestore = async () => {
    console.log("🔄 Loading todo data for current user...");

    try {
      const loadedTodos = await getAllData("todos");
      const loadedPinnedTodos = await getAllData("pinnedTodos");
      const loadedTodoTasks = await getAllData("todoTasks");
      const loadedTodoColors = await getAllData("todoColors");

      setTodos(loadedTodos || []);
      setPinnedTodos(loadedPinnedTodos || []);
      setTasks(loadedTodoTasks || {});
      setTodoColors(loadedTodoColors || {});

      console.log("📊 Loaded:", {
        todos: loadedTodos?.length || 0,
        pinned: loadedPinnedTodos?.length || 0,
        tasks: loadedTodoTasks ? Object.keys(loadedTodoTasks).length : 0,
        colors: loadedTodoColors ? Object.keys(loadedTodoColors).length : 0,
      });
    } catch (error) {
      console.error("Error loading todo data:", error);
    }
  };
  //*******************************************************************************/
  //*******************************************************************************/

  // Load all data from Firestore on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Load todos
        const loadedTodos = await getAllData("todos");
        if (loadedTodos.length > 0) {
          setTodos(loadedTodos);
        } else {
          // Fallback to localStorage if no data in Firestore
          const savedTodos = localStorage.getItem("todos");
          if (savedTodos) {
            setTodos(JSON.parse(savedTodos));
          }
        }

        // Load pinned todos
        const loadedPinnedTodos = await getAllData("pinnedTodos");
        if (loadedPinnedTodos.length > 0) {
          setPinnedTodos(loadedPinnedTodos);
        } else {
          const savedPinnedTodos = localStorage.getItem("pinnedTodos");
          if (savedPinnedTodos) {
            setPinnedTodos(JSON.parse(savedPinnedTodos));
          }
        }

        // Load todo tasks
        const loadedTodoTasks = await getAllData("todoTasks");
        if (loadedTodoTasks && Object.keys(loadedTodoTasks).length > 0) {
          setTasks(loadedTodoTasks);
        } else {
          const savedTasks = localStorage.getItem("todoTasks");
          if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
          }
        }

        // Load todo colors
        const loadedTodoColors = await getAllData("todoColors");
        if (loadedTodoColors && Object.keys(loadedTodoColors).length > 0) {
          setTodoColors(loadedTodoColors);
        } else {
          const savedColors = localStorage.getItem("todoColors");
          if (savedColors) {
            setTodoColors(JSON.parse(savedColors));
          }
        }
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
        // Fallback to localStorage
        const savedTodos = localStorage.getItem("todos");
        const savedPinnedTodos = localStorage.getItem("pinnedTodos");
        const savedTasks = localStorage.getItem("todoTasks");
        const savedColors = localStorage.getItem("todoColors");

        if (savedTodos) setTodos(JSON.parse(savedTodos));
        if (savedPinnedTodos) setPinnedTodos(JSON.parse(savedPinnedTodos));
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedColors) setTodoColors(JSON.parse(savedColors));
      }
    };

    loadAllData();
  }, []);

  // Save todos to Firestore whenever they change
  useEffect(() => {
    const saveTodos = async () => {
      await saveAllData("todos", todos);
    };

    if (todos.length > 0) {
      saveTodos();
    }
  }, [todos]);

  // Save pinned todos to Firestore whenever they change
  useEffect(() => {
    const savePinnedTodos = async () => {
      await saveAllData("pinnedTodos", pinnedTodos);
    };

    if (pinnedTodos.length > 0) {
      savePinnedTodos();
    }
  }, [pinnedTodos]);

  // Save tasks to Firestore whenever they change
  useEffect(() => {
    const saveTodoTasks = async () => {
      await saveAllData("todoTasks", tasks);
    };

    if (Object.keys(tasks).length > 0) {
      saveTodoTasks();
    }
  }, [tasks]);

  // Save todo colors to Firestore whenever they change
  useEffect(() => {
    const saveTodoColors = async () => {
      await saveAllData("todoColors", todoColors);
    };

    if (Object.keys(todoColors).length > 0) {
      saveTodoColors();
    }
  }, [todoColors]);

  useEffect(() => {
    if (todoActive) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    }

    return () => {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    };
  }, [todoActive]);

  function newTodo() {
    // Create a Date object (current time)
    const now = new Date();

    // Get date parts
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();

    // Get time parts
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    // Convert 24-hour to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12;

    // Format time with leading zero
    const formattedHours = hours.toString().padStart(2, "0");

    // Create the formatted strings
    const dateString = `${month}/${day}/${year}`;
    const timeString = `${formattedHours}:${minutes} ${ampm}`;

    const newTodoItem = {
      id: Date.now(),
      title: "Todo List",
      date: dateString,
      time: timeString,
      editedAt: null, // Initialize editedAt as null for new todos
    };

    setTodos((prevTodos) => [...prevTodos, newTodoItem]);

    // Initialize empty tasks for this todo
    setTasks((prev) => ({
      ...prev,
      [newTodoItem.id]: [],
    }));
  }

  function openTodo(todoId) {
    // Check if todo is in pinnedTodos
    const pinnedIndex = pinnedTodos.findIndex((todo) => todo.id === todoId);
    if (pinnedIndex !== -1) {
      // Todo is pinned
      setSelectedTodoIndex(pinnedIndex);
      setIsTodoPinned(true);
      setTodoActive(true);
      setEditingTitle(pinnedTodos[pinnedIndex].title);
      return;
    }

    // Check if todo is in regular todos
    const originalIndex = todos.findIndex((todo) => todo.id === todoId);
    if (originalIndex !== -1) {
      setSelectedTodoIndex(originalIndex);
      setIsTodoPinned(false);
      setTodoActive(true);
      setEditingTitle(todos[originalIndex].title);
    }
  }

  function closeTodo() {
    setTodoActive(false);
    setSelectedTodoIndex(null);
    setIsTodoPinned(false);
    setEditingTitle("");
    setColorSelectorActiveTodoId(null);
  }

  function showDeleteConfirmation(todoId, e) {
    e.stopPropagation();
    e.preventDefault();

    setTodoToDelete(todoId);
    setRenderDeleteWarning(true);
  }

  async function confirmDelete() {
    if (todoToDelete) {
      try {
        // Also remove from Firebase
        const deleteFromFirebase = async () => {
          // Note: For simplicity, we're just updating the full arrays
          // A more optimized approach would delete individual documents
          await saveAllData(
            "todos",
            todos.filter((todo) => todo.id !== todoToDelete),
          );
          await saveAllData(
            "pinnedTodos",
            pinnedTodos.filter((todo) => todo.id !== todoToDelete),
          );

          // Remove tasks entry
          const newTasks = { ...tasks };
          delete newTasks[todoToDelete];
          await saveAllData("todoTasks", newTasks);

          // Remove color entry
          const newColors = { ...todoColors };
          delete newColors[todoToDelete];
          await saveAllData("todoColors", newColors);
        };

        await deleteFromFirebase();
      } catch (error) {
        console.error("Error deleting from Firebase:", error);
        // Continue with local deletion even if Firebase fails
      }

      // Delete from local state
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo.id !== todoToDelete),
      );
      setPinnedTodos((prevPinned) =>
        prevPinned.filter((todo) => todo.id !== todoToDelete),
      );

      // Also remove the tasks for this todo
      setTasks((prev) => {
        const newTasks = { ...prev };
        delete newTasks[todoToDelete];
        return newTasks;
      });

      // Also remove the color for this todo
      setTodoColors((prev) => {
        const newColors = { ...prev };
        delete newColors[todoToDelete];
        return newColors;
      });

      closeTodo();
    }
    cancelDelete();
  }

  function cancelDelete() {
    setRenderDeleteWarning(false);
    setTodoToDelete(null);
  }

  // Function to clear all todos
  async function clearAllTodos() {
    if (window.confirm("Are you sure you want to delete all todo lists?")) {
      try {
        // Clear from Firebase
        await saveAllData("todos", []);
        await saveAllData("pinnedTodos", []);
        await saveAllData("todoTasks", {});
        await saveAllData("todoColors", {});
      } catch (error) {
        console.error("Error clearing from Firebase:", error);
      }

      // Clear local state
      setTodos([]);
      setPinnedTodos([]);
      setTasks({});
      setTodoColors({});

      // Clear localStorage
      localStorage.removeItem("todos");
      localStorage.removeItem("pinnedTodos");
      localStorage.removeItem("todoTasks");
      localStorage.removeItem("todoColors");
    }
  }

  // Filter out pinned todos from regular todos for display
  const unpinnedTodos = todos.filter(
    (todo) => !pinnedTodos.some((pinnedTodo) => pinnedTodo.id === todo.id),
  );

  // Sort todos by ID in descending order (newest first)
  const sortedUnpinnedTodos = [...unpinnedTodos].sort((a, b) => b.id - a.id);
  const sortedPinnedTodos = [...pinnedTodos].sort((a, b) => b.id - a.id);

  function matchesSearch(todo) {
    if (!searchQuery.trim()) return true; // if empty, show everything

    const query = searchQuery.toLowerCase();

    // Search in todo title
    const titleText = todo.title.toLowerCase();
    if (titleText.includes(query)) {
      return true;
    }

    // Search in task text
    const todoTasks = tasks[todo.id] || [];
    for (const task of todoTasks) {
      if (task.text.toLowerCase().includes(query)) {
        return true;
      }
    }

    return false;
  }

  const filteredPinnedTodos = sortedPinnedTodos.filter(matchesSearch);
  const filteredUnpinnedTodos = sortedUnpinnedTodos.filter(matchesSearch);

  async function pinTodo(todoId, e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("Pin triggered for todo:", todoId);
    const todoToPin = todos.find((todo) => todo.id === todoId);

    if (todoToPin && !pinnedTodos.some((todo) => todo.id === todoId)) {
      // Add to pinned todos
      const newPinnedTodos = [...pinnedTodos, todoToPin];
      setPinnedTodos(newPinnedTodos);

      // Remove from regular todos array
      const newTodos = todos.filter((todo) => todo.id !== todoId);
      setTodos(newTodos);

      // Save to Firebase
      try {
        await saveAllData("todos", newTodos);
        await saveAllData("pinnedTodos", newPinnedTodos);
      } catch (error) {
        console.error("Error saving pin operation to Firebase:", error);
      }
    }
  }

  async function unpinTodo(todoId, e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("Unpin triggered for todo:", todoId);

    // Find the todo in pinnedTodos
    const todoToUnpin = pinnedTodos.find((todo) => todo.id === todoId);

    if (todoToUnpin) {
      // Remove from pinnedTodos
      const newPinnedTodos = pinnedTodos.filter((todo) => todo.id !== todoId);
      setPinnedTodos(newPinnedTodos);

      // Add back to todos array
      const newTodos = [...todos, todoToUnpin];
      setTodos(newTodos);

      // Save to Firebase
      try {
        await saveAllData("todos", newTodos);
        await saveAllData("pinnedTodos", newPinnedTodos);
      } catch (error) {
        console.error("Error saving unpin operation to Firebase:", error);
      }
    }
  }

  // Update todo title
  async function updateTodoTitle() {
    if (!editingTitle.trim()) return;

    // Get current date and time for edited timestamp
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, "0");
    const editedAtString = `${month}/${day}/${year} at ${formattedHours}:${minutes} ${ampm}`;

    if (isTodoPinned && selectedTodoIndex !== null) {
      const updatedPinnedTodos = pinnedTodos.map((t, i) =>
        i === selectedTodoIndex
          ? { ...t, title: editingTitle, editedAt: editedAtString }
          : t,
      );
      setPinnedTodos(updatedPinnedTodos);

      // Save to Firebase
      try {
        await saveAllData("pinnedTodos", updatedPinnedTodos);
      } catch (error) {
        console.error("Error saving todo title to Firebase:", error);
      }
    } else if (selectedTodoIndex !== null) {
      const updatedTodos = todos.map((t, i) =>
        i === selectedTodoIndex
          ? { ...t, title: editingTitle, editedAt: editedAtString }
          : t,
      );
      setTodos(updatedTodos);

      // Save to Firebase
      try {
        await saveAllData("todos", updatedTodos);
      } catch (error) {
        console.error("Error saving todo title to Firebase:", error);
      }
    }
  }

  // Color selector functions (EXACTLY like Notes.jsx)
  function handleColorSelector(todoId, e) {
    e.stopPropagation();
    e.preventDefault();
    setColorSelectorActiveTodoId((prev) => (prev === todoId ? null : todoId));
    console.log("Color selector triggered for todo:", todoId);
  }

  async function changeBackgroundColor(todoId, hex, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Update the color for this specific todo
    const newColors = {
      ...todoColors,
      [todoId]: hex,
    };

    setTodoColors(newColors);

    // Save to Firebase
    try {
      await saveAllData("todoColors", newColors);
    } catch (error) {
      console.error("Error saving color to Firebase:", error);
    }

    // Close the color selector
    setColorSelectorActiveTodoId(null);
  }

  // Task-related functions
  async function addTask(todoId) {
    const newTask = {
      id: Date.now(),
      text: "New Task",
      completed: false,
    };

    const newTasks = {
      ...tasks,
      [todoId]: [...(tasks[todoId] || []), newTask],
    };

    setTasks(newTasks);

    // Save to Firebase
    try {
      await saveAllData("todoTasks", newTasks);
    } catch (error) {
      console.error("Error saving tasks to Firebase:", error);
    }
  }

  async function deleteTask(todoId, taskId) {
    const newTasks = {
      ...tasks,
      [todoId]: (tasks[todoId] || []).filter((task) => task.id !== taskId),
    };

    setTasks(newTasks);

    // Save to Firebase
    try {
      await saveAllData("todoTasks", newTasks);
    } catch (error) {
      console.error("Error saving tasks to Firebase:", error);
    }
  }

  async function toggleTaskCompletion(todoId, taskId) {
    const newTasks = {
      ...tasks,
      [todoId]: (tasks[todoId] || []).map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    };

    setTasks(newTasks);

    // Save to Firebase
    try {
      await saveAllData("todoTasks", newTasks);
    } catch (error) {
      console.error("Error saving tasks to Firebase:", error);
    }
  }

  async function updateTaskText(todoId, taskId, newText) {
    // Get current date and time for edited timestamp
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, "0");
    const editedAtString = `${month}/${day}/${year} at ${formattedHours}:${minutes} ${ampm}`;

    const newTasks = {
      ...tasks,
      [todoId]: (tasks[todoId] || []).map((task) =>
        task.id === taskId ? { ...task, text: newText } : task,
      ),
    };

    setTasks(newTasks);

    // Also update the todo's editedAt timestamp when tasks are modified
    if (isTodoPinned) {
      const updatedPinnedTodos = pinnedTodos.map((t) =>
        t.id === todoId ? { ...t, editedAt: editedAtString } : t,
      );
      setPinnedTodos(updatedPinnedTodos);
      await saveAllData("pinnedTodos", updatedPinnedTodos);
    } else {
      const updatedTodos = todos.map((t) =>
        t.id === todoId ? { ...t, editedAt: editedAtString } : t,
      );
      setTodos(updatedTodos);
      await saveAllData("todos", updatedTodos);
    }

    // Save tasks to Firebase
    try {
      await saveAllData("todoTasks", newTasks);
    } catch (error) {
      console.error("Error saving tasks to Firebase:", error);
    }
  }

  // TaskItem component
  function TaskItem({
    todoId,
    task,
    onDelete,
    onToggle,
    onUpdate,
    backgroundColor,
  }) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(task.text);

    const handleSave = () => {
      if (text.trim()) {
        onUpdate(todoId, task.id, text);
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setText(task.text);
      }
    };

    return (
      <div
        className="task-container"
        style={{
          backgroundColor: backgroundColor || "#000033",
        }}
      >
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(todoId, task.id)}
          className="task-checkbox"
          style={{ accentColor: backgroundColor }}
        />
        {isEditing ? (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="task-edit-input"
          />
        ) : (
          <div
            className="task-content"
            onClick={() => setIsEditing(true)}
            style={{
              textDecoration: task.completed ? "line-through" : "none",
              opacity: task.completed ? 0.6 : 1,
              cursor: "pointer",
              padding: "8px",
              flex: 1,
            }}
          >
            {task.text}
          </div>
        )}
        <button
          onClick={() => onDelete(todoId, task.id)}
          className="task-delete-btn"
        >
          <i className="fa-solid fa-trash-can"></i>
        </button>
      </div>
    );
  }

  // Get current todo in modal
  const currentTodo =
    isTodoPinned && selectedTodoIndex !== null
      ? pinnedTodos[selectedTodoIndex]
      : !isTodoPinned && selectedTodoIndex !== null
        ? todos[selectedTodoIndex]
        : null;

  const currentTodoId = currentTodo?.id;
  const currentTodoTasks = currentTodoId ? tasks[currentTodoId] || [] : [];
  const currentTodoColor = currentTodoId
    ? todoColors[currentTodoId]
    : "#000033";

  return (
    <>
      <div className="main-kontainer">
        <div className="wrapper">
          <div className="page-text">
            <h1>TODO</h1>
          </div>
        </div>

        {/* 🔎 Search bar */}
        <div className="search-div">
          <input
            className="search-input"
            type="text"
            placeholder="Search todos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(true); // ✅ ENTER SEARCH MODE
            }}
          />
          {isSearching && (
            <div style={{ marginTop: "10px" }} className="cls-srch-btn-div">
              <button
                className="cls-srch-btn"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearching(false); // ✅ EXIT SEARCH MODE
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}
        </div>
        <div className="kontainer">
          <div className="crt-nt-btn-div">
            {/* Add todo button moved to pinned todos section */}
          </div>

          {/*Search Result*/}
          {isSearching && (
            <div className="notes-list">
              {filteredPinnedTodos.length === 0 &&
              filteredUnpinnedTodos.length === 0 ? (
                <p className="warning">No results found.</p>
              ) : (
                [...filteredPinnedTodos, ...filteredUnpinnedTodos].map(
                  (todo) => {
                    const todoTasks = tasks[todo.id] || [];
                    const completedCount = todoTasks.filter(
                      (t) => t.completed,
                    ).length;
                    const totalCount = todoTasks.length;

                    return (
                      <div
                        key={todo.id}
                        className="note-item"
                        onClick={(e) => {
                          if (e.target.closest(".btn-cntnr")) return;
                          openTodo(todo.id);
                        }}
                      >
                        <div
                          className="nw-nt-div"
                          style={{
                            backgroundColor: todoColors[todo.id] || "#000033",
                          }}
                        >
                          <div className="nt-cntnt-div">
                            <h3
                              style={{
                                color: "white",
                                marginBottom: "8px",
                              }}
                            >
                              {todo.title}
                            </h3>
                            <p
                              style={{
                                fontSize: "14px",
                                color: "white",
                              }}
                            >
                              {totalCount === 0
                                ? "No tasks"
                                : `${completedCount}/${totalCount} completed`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )
              )}
            </div>
          )}

          {/* Pinned Todos - Always show section if there are pinned todos */}
          {!isSearching && (
            <>
              <div className="notes-container">
                <div
                  className="pushable-container"
                  style={{ marginBottom: "30px" }}
                >
                  <button className="add-new-note-button" onClick={newTodo}>
                    <span className="button_top"> ADD TODO </span>
                  </button>
                </div>

                {/* Show pinned todos if they exist */}
                {sortedPinnedTodos.length > 0 && (
                  <div className="pinned-nts">
                    {/* PINNED TODOS HEADER */}
                    <div className="wrapper">
                      <div className="page-text-2">
                        <h2>PINNED LISTS ({sortedPinnedTodos.length})</h2>
                      </div>
                    </div>

                    {/* PINNED TODOS LIST */}
                    <div className="all-pnd-nts">
                      {sortedPinnedTodos.map((todo) => {
                        const todoTasks = tasks[todo.id] || [];
                        const completedCount = todoTasks.filter(
                          (t) => t.completed,
                        ).length;
                        const totalCount = todoTasks.length;

                        return (
                          <div
                            key={todo.id}
                            className="note-item"
                            onClick={(e) => {
                              if (e.target.closest(".btn-cntnr")) return;
                              openTodo(todo.id);
                            }}
                          >
                            <div
                              className="nw-nt-div"
                              style={{
                                backgroundColor:
                                  todoColors[todo.id] || "#000033",
                              }}
                            >
                              <div className="nt-cntnt-div">
                                <h3
                                  style={{
                                    color: "white",
                                    marginBottom: "8px",
                                  }}
                                >
                                  {todo.title}
                                </h3>
                                <p
                                  style={{
                                    fontSize: "14px",
                                    color: "white",
                                  }}
                                >
                                  {totalCount === 0
                                    ? "No tasks"
                                    : `${completedCount}/${totalCount} completed`}
                                </p>
                              </div>

                              <div className="dlt-nt-btn-div">
                                {colorSelectorActiveTodoId === todo.id && (
                                  <div className="color-selector">
                                    <div
                                      className="strict-dark"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#1a1a1a",
                                          e,
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="Navy"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#000033",
                                          e,
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="deep-green"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#256025",
                                          e,
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="maroon"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#1a0505",
                                          e,
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="darkblue"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#360a5e",
                                          e,
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="deep-yellow"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#43431aff",
                                          e,
                                        )
                                      }
                                    ></div>
                                  </div>
                                )}

                                <div className="btn-cntnr">
                                  <div>
                                    <input
                                      type="color"
                                      className="color-picker"
                                      value={todoColors[todo.id] || "#000033"}
                                      onChange={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <button
                                    className="dlt-btn"
                                    title="Select Color"
                                    onClick={(e) =>
                                      handleColorSelector(todo.id, e)
                                    }
                                  >
                                    <i className="fa-solid fa-brush"></i>
                                  </button>

                                  <button
                                    className="dlt-btn"
                                    onClick={(e) => unpinTodo(todo.id, e)}
                                    title="Unpin list"
                                  >
                                    <i className="fa-solid fa-link-slash"></i>
                                  </button>

                                  <button
                                    className="dlt-btn"
                                    onClick={(e) =>
                                      showDeleteConfirmation(todo.id, e)
                                    }
                                    title="Delete list"
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* ALL TODOS HEADER - Always show this, even if there are no pinned todos */}
                    <div className="wrapper">
                      <div className="page-text-2">
                        <h2>ALL LISTS</h2>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Delete Confirmation Warning Modal */}
          {renderDeleteWarning && (
            <>
              <div className="backdrop" onClick={cancelDelete}></div>
              <div className="dlt-wrn">
                <div className="wrng">
                  <p>Are you sure ?</p>
                </div>
                <div className="yes-no-btn-div">
                  <button className="btn-y" onClick={confirmDelete}>
                    Yes
                  </button>
                  <button className="btn-x" onClick={cancelDelete}>
                    No
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Display unpinned todos list */}
          {!isSearching && (
            <div className="notes-list">
              {sortedUnpinnedTodos.length === 0 &&
              sortedPinnedTodos.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    justifyContent: "center",
                    display: "flex",
                    width: "100%",
                  }}
                >
                  <div className="warning">
                    <p> </p>
                  </div>
                </div>
              ) : (
                sortedUnpinnedTodos.map((todo) => {
                  const todoTasks = tasks[todo.id] || [];
                  const completedCount = todoTasks.filter(
                    (t) => t.completed,
                  ).length;
                  const totalCount = todoTasks.length;

                  return (
                    <div
                      key={todo.id}
                      className="note-item"
                      onClick={(e) => {
                        if (e.target.closest(".btn-cntnr")) return;
                        openTodo(todo.id);
                      }}
                    >
                      <div
                        className="nw-nt-div"
                        style={{
                          backgroundColor: todoColors[todo.id] || "#000033",
                        }}
                      >
                        <div className="nt-cntnt-div">
                          <h3
                            style={{
                              color: "white",
                              marginBottom: "8px",
                            }}
                          >
                            {todo.title}
                          </h3>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "white",
                            }}
                          >
                            {totalCount === 0
                              ? "No tasks"
                              : `${completedCount}/${totalCount} completed`}
                          </p>
                        </div>
                        <div className="dlt-nt-btn-div">
                          {colorSelectorActiveTodoId === todo.id && (
                            <div className="color-selector">
                              <div
                                className="strict-dark"
                                onClick={(e) =>
                                  changeBackgroundColor(todo.id, "#1a1a1a", e)
                                }
                              ></div>
                              <div
                                className="Navy"
                                onClick={(e) =>
                                  changeBackgroundColor(todo.id, "#000033", e)
                                }
                              ></div>
                              <div
                                className="deep-green"
                                onClick={(e) =>
                                  changeBackgroundColor(todo.id, "#256025", e)
                                }
                              ></div>
                              <div
                                className="maroon"
                                onClick={(e) =>
                                  changeBackgroundColor(todo.id, "#1a0505", e)
                                }
                              ></div>
                              <div
                                className="darkblue"
                                onClick={(e) =>
                                  changeBackgroundColor(todo.id, "#360a5e", e)
                                }
                              ></div>
                              <div
                                className="deep-yellow"
                                onClick={(e) =>
                                  changeBackgroundColor(todo.id, "#43431aff", e)
                                }
                              ></div>
                            </div>
                          )}
                          <div className="btn-cntnr">
                            <div>
                              <input
                                type="color"
                                className="color-picker"
                                value={todoColors[todo.id] || "#000033"}
                                onChange={(e) =>
                                  changeBackgroundColor(todo.id, e.target.value)
                                }
                              />
                            </div>
                            <button
                              className="dlt-btn"
                              title="Select Color"
                              onClick={(e) => handleColorSelector(todo.id, e)}
                            >
                              <i className="fa-solid fa-brush"></i>
                            </button>
                            <button
                              className="dlt-btn"
                              onClick={(e) => pinTodo(todo.id, e)}
                              title="Pin list"
                            >
                              <i className="fa-solid fa-thumbtack"></i>
                            </button>
                            <button
                              className="dlt-btn"
                              onClick={(e) =>
                                showDeleteConfirmation(todo.id, e)
                              }
                              title="Delete list"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal overlay for viewing/editing a single todo list */}
      {todoActive && currentTodo && (
        <>
          <div className="backdrop" onClick={closeTodo}></div>
          <div
            className="notes-modal"
            style={{
              backgroundColor: currentTodoColor,
            }}
          >
            <div className="mdl-hdr">
              <div className="nt-dt-tm">
                <p style={{ fontWeight: "bold" }}>{currentTodo.date}</p>
                <p>{currentTodo.time}</p>
                {/* ADDED: Edited timestamp */}
                {currentTodo.editedAt && (
                  <p
                    style={{
                      color: "white",
                      fontSize: "12px",
                      fontFamily: "Inter, sans-serif",
                      marginTop: "4px",
                      opacity: 0.9,
                    }}
                  >
                    Edited on: {currentTodo.editedAt}
                  </p>
                )}
              </div>
              <div className="cls-btn-div">
                <button className="cls-nt-btn" onClick={closeTodo}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            <div className="modal-content">
              {/* Todo title - Fixed: Using controlled input */}
              <div
                className="todo-title"
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  padding: "20px 24px 0",
                  marginBottom: "20px",
                  outline: "none",
                  borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                  paddingBottom: "10px",
                }}
              >
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={updateTodoTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      updateTodoTitle();
                    }
                  }}
                  style={{
                    width: "100%",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "white",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Tasks section */}
              <div className="tasks-section" style={{ padding: "0 24px 24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ color: "white", margin: 0 }}>Tasks</h3>
                  <button
                    className="add-task-btn"
                    onClick={() => addTask(currentTodoId)}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor =
                        "rgba(255, 255, 255, 0.3)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor =
                        "rgba(255, 255, 255, 0.2)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    }}
                  >
                    <i className="fa-solid fa-plus"></i> Add Task
                  </button>
                </div>

                <div className="tasks-list">
                  {currentTodoTasks.length === 0 ? (
                    <p
                      className="no-tasks"
                      style={{
                        textAlign: "center",
                        color: "rgba(255, 255, 255, 0.7)",
                        padding: "20px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      No tasks yet. Click "Add Task" to create your first task!
                    </p>
                  ) : (
                    currentTodoTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        todoId={currentTodoId}
                        task={task}
                        onDelete={deleteTask}
                        onToggle={toggleTaskCompletion}
                        onUpdate={updateTaskText}
                        backgroundColor={currentTodoColor}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Todo;
