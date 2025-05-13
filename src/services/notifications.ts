// src/services/notifications.ts
import type { Notification } from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";

const NOTIFICATIONS_COLLECTION = "notifications";

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestampToISO = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  // Handle cases where timestamp might already be a string or needs parsing
  if (typeof timestamp === 'string') {
    try {
        return new Date(timestamp).toISOString();
    } catch(e) {
        console.error("Invalid date string for timestamp", timestamp, e);
        throw new Error("Invalid date string provided for timestamp.");
    }
  }
  if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString();
  }
  console.error("Unrecognized timestamp format", timestamp);
  throw new Error("Unrecognized timestamp format.");
};

const convertNotificationFromFirestore = (notificationDataFromDb: any): Notification => {
  return {
    ...notificationDataFromDb,
    createdAt: convertTimestampToISO(notificationDataFromDb.createdAt),
  };
};

// CRUD Operations for Notifications

export const getNotifications = async (userId?: string, read?: boolean): Promise<Notification[]> => {
  // This is a simplified getNotifications. In a real app, notifications would be targeted to users.
  // For now, it fetches all notifications, optionally filtered by read status.
  // A "userId" parameter would imply notifications are stored with a targetUserId field.
  let q = query(collection(db, NOTIFICATIONS_COLLECTION), orderBy("createdAt", "desc"));

  if (read !== undefined) {
    q = query(q, where("read", "==", read));
  }
  // if (userId) { // Example if notifications are user-specific
  //   q = query(q, where("targetUserId", "==", userId));
  // }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => convertNotificationFromFirestore({ id: docSnap.id, ...docSnap.data() } as any));
};

export const getNotificationById = async (notificationId: string): Promise<Notification | null> => {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return convertNotificationFromFirestore({ id: docSnap.id, ...docSnap.data() } as any);
  }
  return null;
};

export const createNotification = async (
  notificationData: Omit<Notification, "id" | "createdAt">
): Promise<Notification> => {
  const newNotificationPayload = {
    ...notificationData,
    title: notificationData.title,
    message: notificationData.message,
    read: notificationData.read || false,
    link: notificationData.link || "",
    createdAt: Timestamp.fromDate(new Date()),
    // targetUserId: notificationData.targetUserId, // If notifications are user-specific
  };
  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), newNotificationPayload);
  
  const newNotifSnap = await getDoc(docRef);
  if (!newNotifSnap.exists()) throw new Error("Failed to retrieve newly created notification.");
  return convertNotificationFromFirestore({ id: newNotifSnap.id, ...newNotifSnap.data() });
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(notificationRef, { read: true });
};

export const markAllNotificationsAsRead = async (userId?: string): Promise<void> => {
    // Similar to getNotifications, needs a targetUserId field if user-specific
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where("read", "==", false)/*, where("targetUserId", "==", userId)*/);
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
};


export const deleteNotification = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await deleteDoc(notificationRef);
};
