import { useState, useEffect } from "react";

function Todo() {
  // Load todos from localStorage on initial render
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem("todos");
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  const [renderDeleteWarning, setRenderDeleteWarning] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null); // Store which todo to delete

  const [todoActive, setTodoActive] = useState(false);
  const [selectedTodoIndex, setSelectedTodoIndex] = useState(null);
  const [pinnedTodos, setPinnedTodos] = useState(() => {
    const savedPinnedTodos = localStorage.getItem("pinnedTodos");
    return savedPinnedTodos ? JSON.parse(savedPinnedTodos) : [];
  });
  const [isTodoPinned, setIsTodoPinned] = useState(false);

  // State for editing todo title in modal
  const [editingTitle, setEditingTitle] = useState("");

  // Store tasks for each todo (object with todoId as keys)
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("todoTasks");
    return savedTasks ? JSON.parse(savedTasks) : {};
  });

  // Color state management (EXACTLY like Notes.jsx)
  const [todoColors, setTodoColors] = useState(() => {
    const savedColors = localStorage.getItem("todoColors");
    return savedColors ? JSON.parse(savedColors) : {};
  });

  const [colorSelectorActiveTodoId, setColorSelectorActiveTodoId] =
    useState(null);

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

  // Save todoColors to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todoColors", JSON.stringify(todoColors));
  }, [todoColors]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // Save pinned todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("pinnedTodos", JSON.stringify(pinnedTodos));
  }, [pinnedTodos]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
  }, [tasks]);

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

  function confirmDelete() {
    if (todoToDelete) {
      // Delete from both arrays
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo.id !== todoToDelete)
      );
      setPinnedTodos((prevPinned) =>
        prevPinned.filter((todo) => todo.id !== todoToDelete)
      );

      // Remove tasks for this todo
      setTasks((prev) => {
        const newTasks = { ...prev };
        delete newTasks[todoToDelete];
        return newTasks;
      });

      // Remove color for this todo
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
  function clearAllTodos() {
    if (window.confirm("Are you sure you want to delete all todo lists?")) {
      setTodos([]);
      setPinnedTodos([]);
      setTasks({});
      setTodoColors({});
      localStorage.removeItem("todos");
      localStorage.removeItem("pinnedTodos");
      localStorage.removeItem("todoTasks");
      localStorage.removeItem("todoColors");
    }
  }

  // Filter out pinned todos from regular todos for display
  const unpinnedTodos = todos.filter(
    (todo) => !pinnedTodos.some((pinnedTodo) => pinnedTodo.id === todo.id)
  );

  // Sort todos by ID in descending order (newest first)
  const sortedUnpinnedTodos = [...unpinnedTodos].sort((a, b) => b.id - a.id);
  const sortedPinnedTodos = [...pinnedTodos].sort((a, b) => b.id - a.id);

  function pinTodo(todoId, e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("Pin triggered for todo:", todoId);
    const todoToPin = todos.find((todo) => todo.id === todoId);

    if (todoToPin && !pinnedTodos.some((todo) => todo.id === todoId)) {
      // Add to pinned todos
      setPinnedTodos((prev) => [...prev, todoToPin]);

      // Remove from regular todos array
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== todoId));
    }
  }

  function unpinTodo(todoId, e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("Unpin triggered for todo:", todoId);

    // Find the todo in pinnedTodos
    const todoToUnpin = pinnedTodos.find((todo) => todo.id === todoId);

    if (todoToUnpin) {
      // Remove from pinnedTodos
      setPinnedTodos((prev) => prev.filter((todo) => todo.id !== todoId));

      // Add back to todos array
      setTodos((prevTodos) => [...prevTodos, todoToUnpin]);
    }
  }

  // Update todo title
  function updateTodoTitle() {
    if (!editingTitle.trim()) return;

    if (isTodoPinned && selectedTodoIndex !== null) {
      setPinnedTodos((prev) =>
        prev.map((t, i) =>
          i === selectedTodoIndex ? { ...t, title: editingTitle } : t
        )
      );
    } else if (selectedTodoIndex !== null) {
      setTodos((prev) =>
        prev.map((t, i) =>
          i === selectedTodoIndex ? { ...t, title: editingTitle } : t
        )
      );
    }
  }

  // Color selector functions (EXACTLY like Notes.jsx)
  function handleColorSelector(todoId, e) {
    e.stopPropagation();
    e.preventDefault();
    setColorSelectorActiveTodoId((prev) => (prev === todoId ? null : todoId));
    console.log("Color selector triggered for todo:", todoId);
  }

  function changeBackgroundColor(todoId, hex, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setTodoColors((prev) => ({
      ...prev,
      [todoId]: hex,
    }));

    setColorSelectorActiveTodoId(null);
  }

  // Task-related functions
  function addTask(todoId) {
    const newTask = {
      id: Date.now(),
      text: "New Task",
      completed: false,
    };

    setTasks((prev) => ({
      ...prev,
      [todoId]: [...(prev[todoId] || []), newTask],
    }));
  }

  function deleteTask(todoId, taskId) {
    setTasks((prev) => ({
      ...prev,
      [todoId]: (prev[todoId] || []).filter((task) => task.id !== taskId),
    }));
  }

  function toggleTaskCompletion(todoId, taskId) {
    setTasks((prev) => ({
      ...prev,
      [todoId]: (prev[todoId] || []).map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  }

  function updateTaskText(todoId, taskId, newText) {
    setTasks((prev) => ({
      ...prev,
      [todoId]: (prev[todoId] || []).map((task) =>
        task.id === taskId ? { ...task, text: newText } : task
      ),
    }));
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

  // Search functionality - NOW SEARCHES BOTH TITLE AND TASK TEXT
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
        <div className="kontainer">
          {/* 🔎 Search bar - EXACTLY like Notes.jsx */}
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
          <div className="crt-nt-btn-div"></div>

          {/* Search Result - EXACTLY like Notes.jsx */}
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
                      (t) => t.completed
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
                  }
                )
              )}
            </div>
          )}

          {/* Pinned Todos - EXACT same structure as Notes.jsx */}
          {!isSearching && (
            <>
              <div className="notes-container">
                <div
                  className="pushable-container"
                  style={{ marginBottom: "30px" }}
                >
                  <button className="add-new-note-button" onClick={newTodo}>
                    <span class="button_top"> ADD TODO </span>
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
                          (t) => t.completed
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
                                          e
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="Navy"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#000033",
                                          e
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="deep-green"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#256025",
                                          e
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="maroon"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#1a0505",
                                          e
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="darkblue"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#360a5e",
                                          e
                                        )
                                      }
                                    ></div>
                                    <div
                                      className="deep-yellow"
                                      onClick={(e) =>
                                        changeBackgroundColor(
                                          todo.id,
                                          "#43431aff",
                                          e
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
                                          e.target.value
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

          {/* Delete Confirmation Warning Modal - EXACTLY like Notes.jsx */}
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
                    (t) => t.completed
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
