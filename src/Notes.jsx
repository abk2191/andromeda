import { useState, useRef, useEffect } from "react";
import { saveAllData, getAllData } from "./firestore-helpers";

function Notes() {
  // Load notes from Firestore on initial render
  const [renderDeleteWarning, setRenderDeleteWarning] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [notes, setNotes] = useState(() => {
    // Initial empty state - will load from Firestore in useEffect
    return [];
  });

  const [colorSelectorPosition, setColorSelectorPosition] = useState({
    top: 0,
    left: 0,
  });

  const [hex, setHex] = useState("");
  const [colorSelectorActiveNoteId, setColorSelectorActiveNoteId] =
    useState(null);
  const [noteActive, setNoteActive] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const [pinnedNotes, setPinnedNotes] = useState(() => {
    // Initial empty state - will load from Firestore
    return [];
  });

  const [isNotePinned, setIsNotePinned] = useState(false);
  const contentRef = useRef(null);
  const [noteColors, setNoteColors] = useState(() => {
    // Initial empty state - will load from Firestore
    return {};
  });

  // New state for modal closing animation
  const [isModalClosing, setIsModalClosing] = useState(false);

  //*******************************************************************************/
  //*******************************************************************************/

  const handleClearUserData = () => {
    if (
      window.confirm(
        "Clear all local notes data? This won't affect your Google account data.",
      )
    ) {
      localStorage.removeItem("notes");
      localStorage.removeItem("pinnedNotes");
      localStorage.removeItem("noteColors");
      localStorage.removeItem("last_saved_user");
      localStorage.removeItem("last_saved_email");

      setNotes([]);
      setPinnedNotes([]);
      setNoteColors({});

      alert("Local data cleared. Sign in again to load from Google.");
    }
  };

  // In your Notes.jsx - Add this function inside the Notes component:
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

  // Also add this useEffect to check auth state
  // In Notes.jsx, update the auth check useEffect:
  useEffect(() => {
    const checkAuth = async () => {
      const { auth, onAuthStateChanged } = await import("./firebase.js");
      onAuthStateChanged(auth, (user) => {
        if (user && !user.isAnonymous) {
          console.log("✅ User signed in:", user.email, user.uid);
          setIsAuthenticated(true);
          loadAllDataFromFirestore(); // Load user-specific data
        } else {
          console.log("👤 No user signed in or anonymous");
          setIsAuthenticated(false);
          // Clear data if user signs out
          if (user === null) {
            // Optionally clear local state
            setNotes([]);
            setPinnedNotes([]);
            setNoteColors({});
          }
        }
      });
    };
    checkAuth();
  }, []);

  // Update this function to use getAllData properly:
  const loadAllDataFromFirestore = async () => {
    console.log("🔄 Loading data for current user...");

    try {
      const loadedNotes = await getAllData("notes");
      const loadedPinnedNotes = await getAllData("pinnedNotes");
      const loadedNoteColors = await getAllData("noteColors");

      setNotes(loadedNotes || []);
      setPinnedNotes(loadedPinnedNotes || []);
      setNoteColors(loadedNoteColors || {});

      console.log("📊 Loaded:", {
        notes: loadedNotes?.length || 0,
        pinned: loadedPinnedNotes?.length || 0,
        colors: loadedNoteColors ? Object.keys(loadedNoteColors).length : 0,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };
  //*******************************************************************************/
  //*******************************************************************************/

  // Function to format month number to abbreviated month name
  const formatMonth = (monthNumber) => {
    const monthNames = {
      1: "Jan",
      2: "Feb",
      3: "Mar",
      4: "Apr",
      5: "May",
      6: "Jun",
      7: "Jul",
      8: "Aug",
      9: "Sep",
      10: "Oct",
      11: "Nov",
      12: "Dec",
    };
    return monthNames[monthNumber] || monthNumber;
  };

  // Function to parse and reformat date string
  const reformatDateString = (dateString) => {
    if (!dateString) return dateString;

    // Check if dateString is already in the new format (contains month name)
    if (dateString.match(/[A-Za-z]{3}\/\d+\/\d{4}/)) {
      return dateString;
    }

    // Parse date string like "2/3/2026"
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0]);
      const day = parts[1];
      const year = parts[2];
      return `${formatMonth(month)}/${day}/${year}`;
    }

    return dateString;
  };

  // Load all data from Firestore on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Load notes
        const loadedNotes = await getAllData("notes");
        if (loadedNotes.length > 0) {
          setNotes(loadedNotes);
        } else {
          // Fallback to localStorage if no data in Firestore
          const savedNotes = localStorage.getItem("notes");
          if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
          }
        }

        // Load pinned notes
        const loadedPinnedNotes = await getAllData("pinnedNotes");
        if (loadedPinnedNotes.length > 0) {
          setPinnedNotes(loadedPinnedNotes);
        } else {
          const savedPinnedNotes = localStorage.getItem("pinnedNotes");
          if (savedPinnedNotes) {
            setPinnedNotes(JSON.parse(savedPinnedNotes));
          }
        }

        // Load note colors
        const loadedNoteColors = await getAllData("noteColors");
        if (loadedNoteColors && Object.keys(loadedNoteColors).length > 0) {
          setNoteColors(loadedNoteColors);
        } else {
          const savedColors = localStorage.getItem("noteColors");
          if (savedColors) {
            setNoteColors(JSON.parse(savedColors));
          }
        }
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
        // Fallback to localStorage
        const savedNotes = localStorage.getItem("notes");
        const savedPinnedNotes = localStorage.getItem("pinnedNotes");
        const savedColors = localStorage.getItem("noteColors");

        if (savedNotes) setNotes(JSON.parse(savedNotes));
        if (savedPinnedNotes) setPinnedNotes(JSON.parse(savedPinnedNotes));
        if (savedColors) setNoteColors(JSON.parse(savedColors));
      }
    };

    loadAllData();
  }, []);

  // Save notes to Firestore whenever they change
  useEffect(() => {
    const saveNotes = async () => {
      await saveAllData("notes", notes);
    };

    if (notes.length > 0) {
      saveNotes();
    }
  }, [notes]);

  // Save pinned notes to Firestore whenever they change
  useEffect(() => {
    const savePinnedNotes = async () => {
      await saveAllData("pinnedNotes", pinnedNotes);
    };

    if (pinnedNotes.length > 0) {
      savePinnedNotes();
    }
  }, [pinnedNotes]);

  // Save note colors to Firestore whenever they change
  useEffect(() => {
    const saveNoteColors = async () => {
      await saveAllData("noteColors", noteColors);
    };

    if (Object.keys(noteColors).length > 0) {
      saveNoteColors();
    }
  }, [noteColors]);

  useEffect(() => {
    if (noteActive) {
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
  }, [noteActive]);

  function newNote() {
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

    // Create the formatted strings with abbreviated month name
    const monthAbbrev = formatMonth(month);
    const dateString = `${monthAbbrev}/${day}/${year}`;
    const timeString = `${formattedHours}:${minutes} ${ampm}`;

    const newNoteItem = {
      id: Date.now(),
      content: `Add text`,
      date: dateString,
      time: timeString,
      editedAt: null, // Initialize editedAt as null for new notes
    };

    setNotes((prevNotes) => [...prevNotes, newNoteItem]);
  }

  function openNote(noteId) {
    // Check if note is in pinnedNotes
    const pinnedIndex = pinnedNotes.findIndex((note) => note.id === noteId);
    if (pinnedIndex !== -1) {
      // Note is pinned
      setSelectedNoteIndex(pinnedIndex);
      setIsNotePinned(true);
      setNoteActive(true);
      setTimeout(() => {
        if (contentRef.current && pinnedNotes[pinnedIndex]) {
          contentRef.current.innerHTML = pinnedNotes[pinnedIndex].content;
        }
      }, 0);
      return;
    }

    // Check if note is in regular notes
    const originalIndex = notes.findIndex((note) => note.id === noteId);
    if (originalIndex !== -1) {
      setSelectedNoteIndex(originalIndex);
      setIsNotePinned(false);
      setNoteActive(true);
      setTimeout(() => {
        if (contentRef.current && notes[originalIndex]) {
          contentRef.current.innerHTML = notes[originalIndex].content;
        }
      }, 0);
    }
  }

  // Function to handle backdrop click (with animation)
  function handleBackdropClick() {
    closeNote();
  }

  // Function to handle closing note with animation
  function closeNote() {
    setIsModalClosing(true);

    // Wait for animation to complete before removing the modal
    setTimeout(() => {
      setNoteActive(false);
      setIsModalClosing(false);
      setSelectedNoteIndex(null);
      setIsNotePinned(false);
      setColorSelectorActiveNoteId(null);
    }, 400); // Match this duration with your CSS animation duration
  }

  function showDeleteConfirmation(noteId, e) {
    e.stopPropagation();
    e.preventDefault();

    setNoteToDelete(noteId);
    setRenderDeleteWarning(true);
  }

  async function confirmDelete() {
    if (noteToDelete) {
      try {
        // Also remove from Firebase
        const deleteFromFirebase = async () => {
          // Note: For simplicity, we're just updating the full arrays
          // A more optimized approach would delete individual documents
          await saveAllData(
            "notes",
            notes.filter((note) => note.id !== noteToDelete),
          );
          await saveAllData(
            "pinnedNotes",
            pinnedNotes.filter((note) => note.id !== noteToDelete),
          );

          // Remove color entry
          const newColors = { ...noteColors };
          delete newColors[noteToDelete];
          await saveAllData("noteColors", newColors);
        };

        await deleteFromFirebase();
      } catch (error) {
        console.error("Error deleting from Firebase:", error);
        // Continue with local deletion even if Firebase fails
      }

      // Delete from local state
      setNotes((prevNotes) =>
        prevNotes.filter((note) => note.id !== noteToDelete),
      );
      setPinnedNotes((prevPinned) =>
        prevPinned.filter((note) => note.id !== noteToDelete),
      );

      // Also remove the color for this note
      setNoteColors((prev) => {
        const newColors = { ...prev };
        delete newColors[noteToDelete];
        return newColors;
      });

      closeNote();
    }
    cancelDelete();
  }

  function cancelDelete() {
    setRenderDeleteWarning(false);
    setNoteToDelete(null);
  }

  // Function to clear all notes
  async function clearAllNotes() {
    if (window.confirm("Are you sure you want to delete all notes?")) {
      try {
        // Clear from Firebase
        await saveAllData("notes", []);
        await saveAllData("pinnedNotes", []);
        await saveAllData("noteColors", {});
      } catch (error) {
        console.error("Error clearing from Firebase:", error);
      }

      // Clear local state
      setNotes([]);
      setPinnedNotes([]);
      setNoteColors({});

      // Clear localStorage
      localStorage.removeItem("notes");
      localStorage.removeItem("pinnedNotes");
      localStorage.removeItem("noteColors");
    }
  }

  // Filter out pinned notes from regular notes for display
  const unpinnedNotes = notes.filter(
    (note) => !pinnedNotes.some((pinnedNote) => pinnedNote.id === note.id),
  );

  // Sort notes by ID in descending order (newest first)
  const sortedUnpinnedNotes = [...unpinnedNotes].sort((a, b) => b.id - a.id);
  const sortedPinnedNotes = [...pinnedNotes].sort((a, b) => b.id - a.id);

  function matchesSearch(note) {
    if (!searchQuery.trim()) return true; // if empty, show everything

    const query = searchQuery.toLowerCase();

    // note.content is HTML, but for simple search we can just search the string
    const contentText = note.content.toLowerCase();
    return contentText.includes(query);
  }

  const filteredPinnedNotes = sortedPinnedNotes.filter(matchesSearch);
  const filteredUnpinnedNotes = sortedUnpinnedNotes.filter(matchesSearch);

  async function pinNote(noteId, e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("Pin triggered for note:", noteId);
    const noteToPin = notes.find((note) => note.id === noteId);

    if (noteToPin && !pinnedNotes.some((note) => note.id === noteId)) {
      // Add to pinned notes
      const newPinnedNotes = [...pinnedNotes, noteToPin];
      setPinnedNotes(newPinnedNotes);

      // Remove from regular notes array
      const newNotes = notes.filter((note) => note.id !== noteId);
      setNotes(newNotes);

      // Save to Firebase
      try {
        await saveAllData("notes", newNotes);
        await saveAllData("pinnedNotes", newPinnedNotes);
      } catch (error) {
        console.error("Error saving pin operation to Firebase:", error);
      }
    }
  }

  async function unpinNote(noteId, e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("Unpin triggered for note:", noteId);

    // Find the note in pinnedNotes
    const noteToUnpin = pinnedNotes.find((note) => note.id === noteId);

    if (noteToUnpin) {
      // Remove from pinnedNotes
      const newPinnedNotes = pinnedNotes.filter((note) => note.id !== noteId);
      setPinnedNotes(newPinnedNotes);

      // Add back to notes array
      const newNotes = [...notes, noteToUnpin];
      setNotes(newNotes);

      // Save to Firebase
      try {
        await saveAllData("notes", newNotes);
        await saveAllData("pinnedNotes", newPinnedNotes);
      } catch (error) {
        console.error("Error saving unpin operation to Firebase:", error);
      }
    }
  }

  function handleColorSelector(noteId, e) {
    e.stopPropagation();
    e.preventDefault();

    setColorSelectorActiveNoteId((prev) => (prev === noteId ? null : noteId));
  }

  async function changeBackgroundColor(noteId, hex, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Update the color for this specific note
    const newColors = {
      ...noteColors,
      [noteId]: hex,
    };

    setNoteColors(newColors);

    // Save to Firebase
    try {
      await saveAllData("noteColors", newColors);
    } catch (error) {
      console.error("Error saving color to Firebase:", error);
    }

    // Close the color selector
    setColorSelectorActiveNoteId(null);
  }

  return (
    <>
      <div className="main-kontainer">
        <div className="wrapper">
          <div className="page-text">
            <h1>NOTES</h1>
          </div>
        </div>

        {/* 🔎 Search bar */}
        <div className="search-div">
          <input
            className="search-input"
            type="text"
            placeholder="Search notes..."
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
            {/* Add note button moved to pinned notes section */}
          </div>

          {/*Search Result*/}
          {isSearching && (
            <div className="notes-list">
              {filteredPinnedNotes.length === 0 &&
              filteredUnpinnedNotes.length === 0 ? (
                <p className="warning">No results found.</p>
              ) : (
                [...filteredPinnedNotes, ...filteredUnpinnedNotes].map(
                  (note) => (
                    <div
                      key={note.id}
                      className="note-item"
                      onClick={(e) => {
                        if (e.target.closest(".btn-cntnr")) return;
                        openNote(note.id);
                      }}
                    >
                      <div
                        className="nw-nt-div"
                        style={{
                          backgroundColor: noteColors[note.id] || "#000033",
                        }}
                      >
                        <div className="nt-cntnt-div">
                          <p
                            dangerouslySetInnerHTML={{ __html: note.content }}
                          ></p>
                        </div>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          )}

          {/* Pinned Notes - Always show section if there are pinned notes */}
          {!isSearching && (
            <>
              <div className="notes-container">
                <div
                  className="pushable-container"
                  style={{ marginBottom: "30px" }}
                >
                  {/* <button className="add-new-note-button" onClick={newNote}>
                    <span className="button_top"> ADD NOTE </span>
                  </button> */}

                  <button
                    type="button"
                    class="new-note-button"
                    onClick={newNote}
                  >
                    <span class="button__text">Add Note</span>
                    <span class="button__icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                        stroke="currentColor"
                        height="24"
                        fill="none"
                        class="svg"
                      >
                        <line y2="19" y1="5" x2="12" x1="12"></line>
                        <line y2="12" y1="12" x2="19" x1="5"></line>
                      </svg>
                    </span>
                  </button>
                </div>

                {/* Show pinned notes if they exist */}
                {sortedPinnedNotes.length > 0 && (
                  <div className="pinned-nts">
                    {/* PINNED NOTES HEADER */}
                    <div className="wrapper">
                      <div className="page-text-2">
                        <h2>PINNED NOTES ({sortedPinnedNotes.length})</h2>
                      </div>
                    </div>

                    {/* PINNED NOTES LIST */}
                    <div className="all-pnd-nts">
                      {sortedPinnedNotes.map((note) => (
                        <div
                          key={note.id}
                          className="note-item"
                          onClick={(e) => {
                            if (e.target.closest(".btn-cntnr")) return;
                            openNote(note.id);
                          }}
                        >
                          <div
                            className="nw-nt-div"
                            style={{
                              backgroundColor: noteColors[note.id] || "#000033",
                            }}
                          >
                            <div className="nt-cntnt-div">
                              <p
                                dangerouslySetInnerHTML={{
                                  __html: note.content,
                                }}
                              ></p>
                            </div>

                            <div className="dlt-nt-btn-div">
                              {colorSelectorActiveNoteId === note.id && (
                                <div className="color-selector">
                                  <div
                                    className="strict-dark"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#1a1a1a",
                                        e,
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="Navy"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#000033",
                                        e,
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="deep-green"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#256025",
                                        e,
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="maroon"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#1a0505",
                                        e,
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="darkblue"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#360a5e",
                                        e,
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="deep-yellow"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#646409",
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
                                    value={noteColors[note.id] || "#000033"}
                                    onChange={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <button
                                  className="dlt-btn"
                                  title="Select Color"
                                  onClick={(e) =>
                                    handleColorSelector(note.id, e)
                                  }
                                >
                                  <i className="fa-solid fa-brush"></i>
                                </button>

                                <button
                                  className="dlt-btn"
                                  onClick={(e) => unpinNote(note.id, e)}
                                  title="Unpin note"
                                >
                                  <i className="fa-solid fa-link-slash"></i>
                                </button>

                                <button
                                  className="dlt-btn"
                                  onClick={(e) =>
                                    showDeleteConfirmation(note.id, e)
                                  }
                                  title="Delete note"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* ALL NOTES HEADER - Always show this, even if there are no pinned notes */}
                    <div className="wrapper">
                      <div className="page-text-2">
                        <h2>ALL NOTES ({sortedUnpinnedNotes.length})</h2>
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

          {/* Display unpinned notes list */}
          {!isSearching && (
            <div className="notes-list">
              {sortedUnpinnedNotes.length === 0 &&
              sortedPinnedNotes.length === 0 ? (
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
                sortedUnpinnedNotes.map((note, index) => (
                  <div
                    key={note.id}
                    className="note-item"
                    onClick={(e) => {
                      if (e.target.closest(".btn-cntnr")) return;
                      openNote(note.id);
                    }}
                  >
                    <div
                      className="nw-nt-div"
                      style={{
                        backgroundColor: noteColors[note.id] || "#000033",
                      }}
                    >
                      <div className="nt-cntnt-div">
                        <p
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        ></p>
                      </div>
                      <div className="dlt-nt-btn-div">
                        {colorSelectorActiveNoteId === note.id && (
                          <div className="color-selector">
                            <div
                              className="strict-dark"
                              onClick={(e) =>
                                changeBackgroundColor(note.id, "#1a1a1a", e)
                              }
                            ></div>
                            <div
                              className="Navy"
                              onClick={(e) =>
                                changeBackgroundColor(note.id, "#000033", e)
                              }
                            ></div>
                            <div
                              className="deep-green"
                              onClick={(e) =>
                                changeBackgroundColor(note.id, "#256025", e)
                              }
                            ></div>
                            <div
                              className="maroon"
                              onClick={(e) =>
                                changeBackgroundColor(note.id, "#1a0505", e)
                              }
                            ></div>
                            <div
                              className="darkblue"
                              onClick={(e) =>
                                changeBackgroundColor(note.id, "#360a5e", e)
                              }
                            ></div>
                            <div
                              className="deep-yellow"
                              onClick={(e) =>
                                changeBackgroundColor(note.id, "#43431aff", e)
                              }
                            ></div>
                          </div>
                        )}
                        <div className="btn-cntnr">
                          <div>
                            <input
                              type="color"
                              className="color-picker"
                              value={noteColors[note.id] || "#000033"}
                              onChange={(e) =>
                                changeBackgroundColor(note.id, e.target.value)
                              }
                            />
                          </div>
                          <button
                            className="dlt-btn"
                            title="Select Color"
                            onClick={(e) => handleColorSelector(note.id, e)}
                          >
                            <i className="fa-solid fa-brush"></i>
                          </button>
                          <button
                            className="dlt-btn"
                            onClick={(e) => pinNote(note.id, e)}
                            title="Pin note"
                          >
                            <i className="fa-solid fa-thumbtack"></i>
                          </button>
                          <button
                            className="dlt-btn"
                            onClick={(e) => showDeleteConfirmation(note.id, e)}
                            title="Delete note"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal overlay for viewing/editing a single note */}
      {noteActive && selectedNoteIndex !== null && (
        <>
          <div className="backdrop" onClick={handleBackdropClick}></div>
          <div
            className={`notes-modal ${isModalClosing ? "modal-closing" : ""}`}
            style={{
              backgroundColor: isNotePinned
                ? noteColors[pinnedNotes[selectedNoteIndex]?.id] || "#000033"
                : noteColors[notes[selectedNoteIndex]?.id] || "#000033",
            }}
          >
            <div className="mdl-hdr">
              <div className="nt-dt-tm">
                <div className="flx-dv">
                  <p>
                    {isNotePinned
                      ? reformatDateString(
                          pinnedNotes[selectedNoteIndex]?.date,
                        ) || "No date"
                      : reformatDateString(notes[selectedNoteIndex]?.date) ||
                        "No date"}
                  </p>

                  <p>
                    {isNotePinned
                      ? pinnedNotes[selectedNoteIndex]?.time || "No time"
                      : notes[selectedNoteIndex]?.time || "No time"}
                  </p>
                </div>
                <div className="flx-clm">
                  {/* ADDED: Edited timestamp */}
                  {isNotePinned && pinnedNotes[selectedNoteIndex]?.editedAt && (
                    <p
                      style={{
                        color: "white",
                        fontSize: "9px",
                        fontFamily: "Inter, sans-serif",
                        marginTop: "4px",
                        opacity: 0.9,
                      }}
                    >
                      Edited on -{" "}
                      {reformatDateString(
                        pinnedNotes[selectedNoteIndex].editedAt.split(
                          " at ",
                        )[0],
                      )}{" "}
                      at{" "}
                      {pinnedNotes[selectedNoteIndex].editedAt.split(" at ")[1]}
                    </p>
                  )}
                </div>
                <div className="flx-clm">
                  {!isNotePinned && notes[selectedNoteIndex]?.editedAt && (
                    <p
                      style={{
                        color: "white",
                        fontSize: "9px",
                        fontFamily: "Inter, sans-serif",
                        marginTop: "4px",
                        opacity: 0.9,
                      }}
                    >
                      Edited on -{" "}
                      {reformatDateString(
                        notes[selectedNoteIndex].editedAt.split(" at ")[0],
                      )}{" "}
                      at {notes[selectedNoteIndex].editedAt.split(" at ")[1]}
                    </p>
                  )}
                </div>
              </div>
              <div className="cls-btn-div">
                <button className="cls-nt-btn" onClick={() => closeNote()}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="modal-content">
              <div
                className="note-content"
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning={true}
                onInput={(e) => {
                  const updatedText = e.target.innerHTML;

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
                  const monthAbbrev = formatMonth(month);
                  const editedAtString = `${monthAbbrev}/${day}/${year} at ${formattedHours}:${minutes} ${ampm}`;

                  if (isNotePinned) {
                    // Update pinned note
                    const updatedPinnedNotes = pinnedNotes.map((n, i) =>
                      i === selectedNoteIndex
                        ? {
                            ...n,
                            content: updatedText,
                            editedAt: editedAtString,
                          }
                        : n,
                    );
                    setPinnedNotes(updatedPinnedNotes);

                    // Save to Firebase
                    saveAllData("pinnedNotes", updatedPinnedNotes).catch(
                      console.error,
                    );
                  } else {
                    // Update regular note
                    const updatedNotes = notes.map((n, i) =>
                      i === selectedNoteIndex
                        ? {
                            ...n,
                            content: updatedText,
                            editedAt: editedAtString,
                          }
                        : n,
                    );
                    setNotes(updatedNotes);

                    // Save to Firebase
                    saveAllData("notes", updatedNotes).catch(console.error);
                  }
                }}
              ></div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Notes;
