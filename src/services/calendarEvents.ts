// src/services/calendarEvents.ts
import type { CalendarEvent } from "@/types";
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

const CALENDAR_EVENTS_COLLECTION = "calendarEvents";

// Helper to convert Firestore Timestamps to ISO strings and vice-versa
const convertTimestampToISO = (timestamp: any, fieldName: string, isOptional: boolean = false): string | undefined => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString();
    }
     if (typeof timestamp === 'string') {
        try {
            return new Date(timestamp).toISOString();
        } catch (e) {
            const errorMsg = `Stringa data non valida per il campo ${isOptional ? 'opzionale' : 'richiesto'} ${fieldName}: ${timestamp}`;
            if (!isOptional) {
                console.error(errorMsg, e);
                throw new Error(errorMsg);
            }
            console.warn(errorMsg + ", restituendo undefined.", e);
            return undefined;
        }
    }
    if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
        return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString();
    }

    if (isOptional && (timestamp === undefined || timestamp === null)) {
      return undefined;
    }
    
    const generalErrorMsg = `Formato timestamp mancante o non riconosciuto per il campo ${isOptional ? 'opzionale' : 'richiesto'} ${fieldName}. Valore: ${JSON.stringify(timestamp)}`;
    if (!isOptional) {
        console.error(generalErrorMsg);
        throw new Error(generalErrorMsg);
    }
    console.warn(generalErrorMsg + ", restituendo undefined.");
    return undefined;
};

const convertCalendarEventFromFirestore = (eventDataFromDb: any): CalendarEvent => {
  return {
    ...eventDataFromDb,
    start: convertTimestampToISO(eventDataFromDb.start, 'start', false)!,
    end: convertTimestampToISO(eventDataFromDb.end, 'end', false)!,
    // Optional: createdAt/updatedAt if you add them
  };
};

const convertCalendarEventToFirestore = (eventData: Partial<CalendarEvent>) => {
  const firestoreData: any = { ...eventData };
  if (eventData.start) {
    firestoreData.start = Timestamp.fromDate(new Date(eventData.start));
  }
  if (eventData.end) {
    firestoreData.end = Timestamp.fromDate(new Date(eventData.end));
  }
  // Handle other fields like projectId, teamId if they are optional and could be null/undefined
  if (eventData.hasOwnProperty('projectId') && !eventData.projectId) firestoreData.projectId = null;
  if (eventData.hasOwnProperty('teamId') && !eventData.teamId) firestoreData.teamId = null;

  return firestoreData;
};


// CRUD Operations for Calendar Events

export const getCalendarEvents = async (userId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> => {
  // Fetches events for a specific user, optionally within a date range.
  // Assumes events are linked to a user via 'userId' field.
  // And may be further filtered by 'teamId' or 'projectId' in a more complex query.
  let q = query(collection(db, CALENDAR_EVENTS_COLLECTION), where("userId", "==", userId));

  if (startDate) {
    q = query(q, where("start", ">=", Timestamp.fromDate(new Date(startDate))));
  }
  if (endDate) {
    // For range queries on different fields (start and end of event), 
    // Firestore might require composite indexes or restructuring data.
    // A common approach is to query events that *start* within the range,
    // or query events that *overlap* the range which is more complex.
    // Simple query: events ending before or at endDate
    q = query(q, where("end", "<=", Timestamp.fromDate(new Date(endDate))));
  }
  q = query(q, orderBy("start", "asc"));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => convertCalendarEventFromFirestore({ id: docSnap.id, ...docSnap.data() } as any));
};

export const getCalendarEventById = async (eventId: string): Promise<CalendarEvent | null> => {
  const docRef = doc(db, CALENDAR_EVENTS_COLLECTION, eventId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return convertCalendarEventFromFirestore({ id: docSnap.id, ...docSnap.data() } as any);
  }
  return null;
};

export const createCalendarEvent = async (
  eventData: Omit<CalendarEvent, "id">
): Promise<CalendarEvent> => {
  const newEventPayload = convertCalendarEventToFirestore({
    ...eventData,
    title: eventData.title,
    start: eventData.start, // Will be converted to Timestamp
    end: eventData.end,     // Will be converted to Timestamp
    allDay: eventData.allDay || false,
    description: eventData.description || "",
    type: eventData.type,
    projectId: eventData.projectId || null,
    teamId: eventData.teamId || null,
    userId: eventData.userId,
  });

  const docRef = await addDoc(collection(db, CALENDAR_EVENTS_COLLECTION), newEventPayload);
  
  const newEventSnap = await getDoc(docRef);
  if (!newEventSnap.exists()) throw new Error("Failed to retrieve newly created calendar event.");
  return convertCalendarEventFromFirestore({ id: newEventSnap.id, ...newEventSnap.data() });
};

export const updateCalendarEvent = async (
  eventId: string,
  eventData: Partial<Omit<CalendarEvent, "id" | "userId">> // userId usually shouldn't change
): Promise<CalendarEvent> => {
  const eventRef = doc(db, CALENDAR_EVENTS_COLLECTION, eventId);
  const updatePayload = convertCalendarEventToFirestore(eventData);

  await updateDoc(eventRef, updatePayload);
  
  const updatedEventSnap = await getDoc(eventRef);
  if (!updatedEventSnap.exists()) throw new Error("Calendar event not found after update.");
  return convertCalendarEventFromFirestore({ id: updatedEventSnap.id, ...updatedEventSnap.data() });
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const eventRef = doc(db, CALENDAR_EVENTS_COLLECTION, eventId);
  await deleteDoc(eventRef);
};
