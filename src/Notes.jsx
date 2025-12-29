import { useState, useRef, useEffect } from "react";

function Notes() {
  // Load notes from localStorage on initial render
  const [renderDeleteWarning, setRenderDeleteWarning] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null); // Store which note to delete
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem("notes");
    return savedNotes ? JSON.parse(savedNotes) : [];
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
    // Load pinned notes in initial state
    const savedPinnedNotes = localStorage.getItem("pinnedNotes");
    return savedPinnedNotes ? JSON.parse(savedPinnedNotes) : [];
  });
  const [isNotePinned, setIsNotePinned] = useState(false);
  const contentRef = useRef(null);
  const [noteColors, setNoteColors] = useState(() => {
    const savedColors = localStorage.getItem("noteColors");
    return savedColors ? JSON.parse(savedColors) : {};
  });

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

  useEffect(() => {
    localStorage.setItem("noteColors", JSON.stringify(noteColors));
  }, [noteColors]);

  // Debug: Log pinned notes changes
  useEffect(() => {
    console.log("Pinned notes updated:", pinnedNotes);
  }, [pinnedNotes]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Save pinned notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("pinnedNotes", JSON.stringify(pinnedNotes));
    console.log("Saved pinned notes to localStorage:", pinnedNotes);
  }, [pinnedNotes]);

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

    // Create the formatted strings
    const dateString = `${month}/${day}/${year}`;
    const timeString = `${formattedHours}:${minutes} ${ampm}`;

    const newNoteItem = {
      id: Date.now(),
      content: `Add text`,
      date: dateString,
      time: timeString,
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

  function closeNote() {
    setNoteActive(false);
    setSelectedNoteIndex(null);
    setIsNotePinned(false);
    setColorSelectorActiveNoteId(null);
  }

  function showDeleteConfirmation(noteId, e) {
    e.stopPropagation();
    e.preventDefault();

    setNoteToDelete(noteId);
    setRenderDeleteWarning(true);
  }

  function confirmDelete() {
    if (noteToDelete) {
      // Delete from both arrays
      setNotes((prevNotes) =>
        prevNotes.filter((note) => note.id !== noteToDelete)
      );
      setPinnedNotes((prevPinned) =>
        prevPinned.filter((note) => note.id !== noteToDelete)
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
  function clearAllNotes() {
    if (window.confirm("Are you sure you want to delete all notes?")) {
      setNotes([]);
      setPinnedNotes([]);
      setNoteColors({});
      localStorage.removeItem("notes");
      localStorage.removeItem("pinnedNotes");
      localStorage.removeItem("noteColors");
    }
  }

  // Filter out pinned notes from regular notes for display
  const unpinnedNotes = notes.filter(
    (note) => !pinnedNotes.some((pinnedNote) => pinnedNote.id === note.id)
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

  function pinNote(noteId, e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("Pin triggered for note:", noteId);
    const noteToPin = notes.find((note) => note.id === noteId);

    if (noteToPin && !pinnedNotes.some((note) => note.id === noteId)) {
      // Add to pinned notes
      setPinnedNotes((prev) => [...prev, noteToPin]);

      // Remove from regular notes array
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    }
  }

  function unpinNote(noteId, e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("Unpin triggered for note:", noteId);

    // Find the note in pinnedNotes
    const noteToUnpin = pinnedNotes.find((note) => note.id === noteId);

    if (noteToUnpin) {
      // Remove from pinnedNotes
      setPinnedNotes((prev) => prev.filter((note) => note.id !== noteId));

      // Add back to notes array
      setNotes((prevNotes) => [...prevNotes, noteToUnpin]);
    }
  }

  function handleColorSelector(noteId, e) {
    e.stopPropagation();
    e.preventDefault();

    setColorSelectorActiveNoteId((prev) => (prev === noteId ? null : noteId));
  }

  function changeBackgroundColor(noteId, hex, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Update the color for this specific note
    setNoteColors((prev) => ({
      ...prev,
      [noteId]: hex,
    }));

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
            {/* <button className="pushable" onClick={newNote}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front"> ADD NOTE </span>
            </button> */}
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
                  )
                )
              )}
            </div>
          )}

          {/* Pinned Notes - Always show section if there are pinned notes */}
          {/* Pinned Notes */}
          {!isSearching && (
            <>
              <div className="notes-container">
                <div
                  className="pushable-container"
                  style={{ marginBottom: "30px" }}
                >
                  <button className="add-new-note-button" onClick={newNote}>
                    <span class="button_top"> ADD NOTE </span>
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
                                        e
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="Navy"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#000033",
                                        e
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="deep-green"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#256025",
                                        e
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="maroon"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#1a0505",
                                        e
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="darkblue"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#360a5e",
                                        e
                                      )
                                    }
                                  ></div>
                                  <div
                                    className="deep-yellow"
                                    onClick={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        "#646409",
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
                                    value={noteColors[note.id] || "#000033"}
                                    onChange={(e) =>
                                      changeBackgroundColor(
                                        note.id,
                                        e.target.value
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
                        <h2>ALL NOTES</h2>
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
          <div className="backdrop" onClick={closeNote}></div>
          <div
            className="notes-modal"
            style={{
              backgroundColor: isNotePinned
                ? noteColors[pinnedNotes[selectedNoteIndex]?.id] || "#000033"
                : noteColors[notes[selectedNoteIndex]?.id] || "#000033",
            }}
          >
            <div className="mdl-hdr">
              <div className="nt-dt-tm">
                <p style={{ fontWeight: "bold" }}>
                  {isNotePinned
                    ? pinnedNotes[selectedNoteIndex]?.date || "No date"
                    : notes[selectedNoteIndex]?.date || "No date"}
                </p>
                <p>
                  {isNotePinned
                    ? pinnedNotes[selectedNoteIndex]?.time || "No time"
                    : notes[selectedNoteIndex]?.time || "No time"}
                </p>
              </div>
              <div className="cls-btn-div">
                <button className="cls-nt-btn" onClick={closeNote}>
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
                  if (isNotePinned) {
                    // Update pinned note
                    setPinnedNotes((prev) =>
                      prev.map((n, i) =>
                        i === selectedNoteIndex
                          ? { ...n, content: updatedText }
                          : n
                      )
                    );
                  } else {
                    // Update regular note
                    setNotes((prev) =>
                      prev.map((n, i) =>
                        i === selectedNoteIndex
                          ? { ...n, content: updatedText }
                          : n
                      )
                    );
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
