// src/firestore-helpers.js - UPDATED FOR USER ISOLATION WITH ALL EXPORTS
import { db } from "./firebase.js";
import { getAuth } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Helper to get current user with better error handling
export const getCurrentUser = () => {
  try {
    const auth = getAuth();
    return auth.currentUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user ? user.uid : null;
};

// Save data to Firestore with user isolation
export const saveAllData = async (dataType, data) => {
  const userId = getCurrentUserId();
  const user = getCurrentUser();

  console.log(`💾 Saving ${dataType} for user:`, userId);

  // Always save to localStorage as backup
  localStorage.setItem(dataType, JSON.stringify(data));

  // If user is signed in, save to Firestore
  if (userId && user && !user.isAnonymous) {
    try {
      // Create user-specific document path
      const docRef = doc(db, "users", userId, "userData", dataType);

      await setDoc(docRef, {
        data,
        userId: userId,
        userEmail: user.email,
        lastUpdated: new Date().toISOString(),
      });

      // Store which user this data belongs to
      localStorage.setItem("last_saved_user", userId);
      localStorage.setItem("last_saved_email", user.email);

      console.log(
        `✅ Successfully saved ${dataType} to Firestore for user ${user.email}`,
      );
    } catch (error) {
      console.error(`❌ Error saving ${dataType} to Firestore:`, error);
    }
  } else {
    console.log(`📝 User not signed in - saving to localStorage only`);
  }
};

// Load data from Firestore with user isolation
export const getAllData = async (dataType) => {
  const userId = getCurrentUserId();
  const user = getCurrentUser();

  console.log(`📥 Loading ${dataType} for user:`, userId);

  // If user is signed in, try to load from Firestore
  if (userId && user && !user.isAnonymous) {
    try {
      const docRef = doc(db, "users", userId, "userData", dataType);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const firestoreData = snapshot.data().data;

        // Save to localStorage for offline access
        localStorage.setItem(dataType, JSON.stringify(firestoreData));
        localStorage.setItem("last_saved_user", userId);
        localStorage.setItem("last_saved_email", user.email);

        console.log(
          `✅ Loaded ${dataType} from Firestore for user ${user.email}`,
        );
        return firestoreData;
      } else {
        console.log(
          `📭 No ${dataType} found in Firestore for user ${user.email}`,
        );
        return getLocalDataWithMigrationCheck(dataType, userId);
      }
    } catch (error) {
      console.error(`❌ Error loading ${dataType} from Firestore:`, error);
      return getLocalDataWithMigrationCheck(dataType, userId);
    }
  } else {
    console.log(`👤 User not signed in - using localStorage`);
    return getLocalDataWithMigrationCheck(dataType, userId);
  }
};

// Helper function to check localStorage data
const getLocalDataWithMigrationCheck = (dataType, currentUserId) => {
  const localData = localStorage.getItem(dataType);
  const lastSavedUser = localStorage.getItem("last_saved_user");

  console.log(`📂 Local data check for ${dataType}:`);
  console.log(`   - Current user: ${currentUserId}`);
  console.log(`   - Last saved user: ${lastSavedUser}`);

  // Clear data if it belongs to a different user
  if (currentUserId && lastSavedUser && lastSavedUser !== currentUserId) {
    console.log(`⚠️ Clearing local data from previous user`);
    localStorage.removeItem(dataType);
    localStorage.removeItem("last_saved_user");
    localStorage.removeItem("last_saved_email");
    return dataType === "noteColors" ||
      dataType === "todoColors" ||
      dataType === "calendarDateColors"
      ? {}
      : [];
  }

  if (!localData) {
    return dataType === "noteColors" ||
      dataType === "todoColors" ||
      dataType === "calendarDateColors"
      ? {}
      : [];
  }

  try {
    return JSON.parse(localData);
  } catch (e) {
    return dataType === "noteColors" ||
      dataType === "todoColors" ||
      dataType === "calendarDateColors"
      ? {}
      : [];
  }
};

// Clear all local data for current user
export const clearLocalUserData = () => {
  const dataTypes = [
    "notes",
    "pinnedNotes",
    "noteColors",
    "todos",
    "pinnedTodos",
    "todoTasks",
    "todoColors",
    "calendarEvents",
    "calendarMoods",
    "calendarDateColors",
    "calendarReminders",
    "mindmaps",
  ];

  dataTypes.forEach((type) => {
    localStorage.removeItem(type);
  });

  localStorage.removeItem("last_saved_user");
  localStorage.removeItem("last_saved_email");

  console.log("🧹 Cleared all local user data");
};

// ============ SPECIFIC SAVE/LOAD FUNCTIONS ============
// These are used by your components, so we need to export them all

// Notes
export const saveTodoData = async (data) => {
  await saveAllData("todos", data);
};

export const loadTodoData = async () => {
  return await getAllData("todos");
};

// Calendar
export const saveCalendarData = async (data) => {
  await saveAllData("calendarEvents", data);
};

export const loadCalendarData = async () => {
  return await getAllData("calendarEvents");
};

export const saveCalendarMoods = async (data) => {
  await saveAllData("calendarMoods", data);
};

export const loadCalendarMoods = async () => {
  return await getAllData("calendarMoods");
};

export const saveCalendarDateColors = async (data) => {
  await saveAllData("calendarDateColors", data);
};

export const loadCalendarDateColors = async () => {
  return await getAllData("calendarDateColors");
};

export const saveCalendarReminders = async (data) => {
  await saveAllData("calendarReminders", data);
};

export const loadCalendarReminders = async () => {
  return await getAllData("calendarReminders");
};

// Mindmap
export const saveMindmapData = async (data) => {
  await saveAllData("mindmaps", data);
};

export const loadMindmapData = async () => {
  return await getAllData("mindmaps");
};

// Todo specific
export const savePinnedTodos = async (data) => {
  await saveAllData("pinnedTodos", data);
};

export const loadPinnedTodos = async () => {
  return await getAllData("pinnedTodos");
};

export const saveTodoTasks = async (data) => {
  await saveAllData("todoTasks", data);
};

export const loadTodoTasks = async () => {
  return await getAllData("todoTasks");
};

export const saveTodoColors = async (data) => {
  await saveAllData("todoColors", data);
};

export const loadTodoColors = async () => {
  return await getAllData("todoColors");
};

// Notes specific
export const saveNoteColors = async (data) => {
  await saveAllData("noteColors", data);
};

export const loadNoteColors = async () => {
  return await getAllData("noteColors");
};

export const savePinnedNotes = async (data) => {
  await saveAllData("pinnedNotes", data);
};

export const loadPinnedNotes = async () => {
  return await getAllData("pinnedNotes");
};
