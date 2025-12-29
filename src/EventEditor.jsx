import { useState, useEffect } from "react";

function EventEditor({ onClose, onSaveEvent, editingEvent }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    time: "",
    endDate: "", // Add endDate to formData
  });

  // ✅ Auto-fill form when editing an existing event
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        name: editingEvent.name || "",
        description: editingEvent.description || "",
        location: editingEvent.location || "",
        time: editingEvent.time || "",
        endDate: editingEvent.endDate ? editingEvent.endDate.toString() : "", // Handle endDate
      });
    } else {
      // Reset when creating new event
      setFormData({
        name: "",
        description: "",
        location: "",
        time: "",
        endDate: "", // Reset endDate
      });
    }
  }, [editingEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    if (onSaveEvent) {
      // Pass all form data including endDate
      onSaveEvent({
        name: formData.name,
        description: formData.description,
        time: formData.time,
        location: formData.location,
        endDate: formData.endDate, // Include endDate
      });
    }

    if (onClose) onClose();
  };

  return (
    <div className="event-editor-container">
      <div className="event-editor">
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        <form
          onSubmit={handleSubmit}
          style={{ color: "white", width: "100%", marginTop: "140px" }}
        >
          <div>
            <label htmlFor="name">Event Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter event name.."
            />
          </div>

          <div>
            <label htmlFor="description">Event Description:</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Enter event description.."
            />
          </div>

          <div>
            <label htmlFor="time">Time:</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="endDate">End Date (optional):</label>
            <input
              type="number"
              id="endDate"
              name="endDate"
              min="1"
              max="31"
              placeholder="Leave empty for single day"
              value={formData.endDate}
              onChange={handleChange}
            />
            <small>
              Enter the ending day number if event spans multiple days
            </small>
          </div>

          <div>
            <label htmlFor="location">Location:</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Enter event Location.."
            />
          </div>

          <button type="submit">
            {editingEvent ? "Update Event" : "Save Event"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EventEditor;
