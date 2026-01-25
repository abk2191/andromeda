// src/firestore-helpers.js - FIXED IMPORTS
import { db } from "./firebase.js";
import { getAuth } from "firebase/auth"; // ✅ ADD THIS IMPORT
import { doc, setDoc, getDoc } from "firebase/firestore";

// Save/load specific module data
export const saveTodoData = async (data) => {
  await saveAllData("todos", data);
};

export const loadTodoData = async () => {
  return await getAllData("todos");
};

export const saveCalendarData = async (data) => {
  await saveAllData("calendarEvents", data);
};

export const loadCalendarData = async () => {
  return await getAllData("calendarEvents");
};

export const saveMindmapData = async (data) => {
  await saveAllData("mindmaps", data);
};

export const loadMindmapData = async () => {
  return await getAllData("mindmaps");
};

// Save/load additional calendar data
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

// Save/load todo-specific data
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

export const getCurrentUser = () => {
  const auth = getAuth();
  console.log(
    "🔍 Checking current user:",
    auth.currentUser?.email,
    auth.currentUser?.uid,
  );
  return auth.currentUser;
};

export const getCurrentUserId = () => {
  const user = getCurrentUser();
  const userId = user ? user.uid : null;
  console.log("🆔 Current User ID:", userId);
  return userId;
};

export const saveAllData = async (dataType, data) => {
  const userId = getCurrentUserId();
  const user = getCurrentUser();

  console.log(`💾 Attempting to save ${dataType}...`);
  console.log(`👤 User: ${user ? user.email : "Anonymous"}`);
  console.log(`🆔 User ID: ${userId || "No ID"}`);

  // Save to localStorage regardless
  localStorage.setItem(dataType, JSON.stringify(data));

  // If user is signed in with Google, save to Firestore
  if (userId && user && !user.isAnonymous) {
    try {
      console.log(`📤 Saving to Google user's Firestore: ${userId}`);

      const docRef = doc(db, "users", userId, "appData", dataType);

      await setDoc(docRef, {
        data,
        lastUpdated: new Date().toISOString(),
        userEmail: user.email,
        userName: user.displayName || "unknown",
      });

      // Store which user this data belongs to
      localStorage.setItem("last_saved_user", userId);
      localStorage.setItem("last_saved_email", user.email);

      console.log(`✅ Successfully saved ${dataType} to Google account`);
    } catch (error) {
      console.error(`❌ Error saving ${dataType} to Firestore:`, error);
    }
  } else {
    console.log(
      `📝 User not signed in with Google - saving to localStorage only`,
    );
  }
};

export const getAllData = async (dataType) => {
  const userId = getCurrentUserId();
  const user = getCurrentUser();

  console.log(`📥 Loading ${dataType}...`);
  console.log(`👤 Current user:`, user?.email || "Anonymous");
  console.log(`🆔 User ID: ${userId || "No ID"}`);

  // Check if user is signed in with Google
  if (userId && user && !user.isAnonymous) {
    try {
      console.log(`🔍 Loading from Google user's Firestore...`);

      const docRef = doc(db, "users", userId, "appData", dataType);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const firestoreData = snapshot.data().data;

        // Save to localStorage for offline access
        localStorage.setItem(dataType, JSON.stringify(firestoreData));
        localStorage.setItem("last_saved_user", userId);
        localStorage.setItem("last_saved_email", user.email);

        console.log(`✅ Loaded ${dataType} from Google account`);
        return firestoreData;
      } else {
        console.log(`📭 No ${dataType} found in Firestore for ${user.email}`);
        // Check if localStorage has data from previous session
        return getLocalDataWithMigrationCheck(dataType, userId);
      }
    } catch (error) {
      console.error(`❌ Error loading ${dataType} from Firestore:`, error);
      return getLocalDataWithMigrationCheck(dataType, userId);
    }
  } else {
    console.log(`👤 User not signed in with Google - using localStorage`);
    return getLocalDataWithMigrationCheck(dataType, userId);
  }
};

// Helper function to check localStorage data
const getLocalDataWithMigrationCheck = (dataType, currentUserId) => {
  const localData = localStorage.getItem(dataType);
  const lastSavedUser = localStorage.getItem("last_saved_user");

  console.log(`📂 Local data check:`);
  console.log(`   - Has local data: ${!!localData}`);
  console.log(`   - Last saved user: ${lastSavedUser}`);
  console.log(`   - Current user: ${currentUserId}`);

  if (!localData) {
    return dataType === "noteColors" ? {} : [];
  }

  // Check if this local data belongs to a different user
  if (lastSavedUser && currentUserId && lastSavedUser !== currentUserId) {
    console.log(
      `⚠️ Local data belongs to different user (${lastSavedUser}), returning empty`,
    );
    return dataType === "noteColors" ? {} : [];
  }

  // Data belongs to current user or no user is signed in
  try {
    return JSON.parse(localData);
  } catch (e) {
    return dataType === "noteColors" ? {} : [];
  }
};
