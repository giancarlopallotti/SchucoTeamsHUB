// src/services/tags.ts
import type { Tag, UserProfile, Client, Project, Team } from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  WriteBatch,
} from "firebase/firestore";

const TAGS_COLLECTION = "tags";
const USERS_COLLECTION = "users";
const TEAMS_COLLECTION = "teams";
const CLIENTS_COLLECTION = "clients";
const PROJECTS_COLLECTION = "projects";

// Tipo per le categorie di tag
type TagCategory = Tag["category"];

// Funzione helper per ottenere il nome della collezione Firestore basato sulla categoria del tag
const getCollectionNameByCategory = (category: TagCategory): string => {
  switch (category) {
    case "USER": return USERS_COLLECTION;
    case "TEAM": return TEAMS_COLLECTION;
    case "CLIENT": return CLIENTS_COLLECTION;
    case "PROJECT": return PROJECTS_COLLECTION;
    default: throw new Error(`Categoria tag non valida: ${category}`);
  }
};

// CRUD Operations for Tags

export const getTags = async (category?: TagCategory): Promise<Tag[]> => {
  let q = query(collection(db, TAGS_COLLECTION));
  if (category) {
    // Add validation check
    if (typeof category !== 'string') {
      console.error(`[getTags] Invalid category type received: ${typeof category}`, category);
      throw new Error(`[getTags] Invalid category type received: ${typeof category}`);
    }
    q = query(q, where("category", "==", category));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Tag));
};

export const getTagById = async (tagId: string): Promise<Tag | null> => {
  const docRef = doc(db, TAGS_COLLECTION, tagId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Tag;
  }
  return null;
};

export const createTag = async (tagData: Omit<Tag, "id" | "usageCount">): Promise<Tag> => {
  const name = tagData.name.toUpperCase();
  // Add validation check
  if (typeof tagData.category !== 'string') {
      console.error(`[createTag] Invalid category type received: ${typeof tagData.category}`, tagData.category);
      throw new Error(`[createTag] Invalid category type received: ${typeof tagData.category}`);
  }
   if (typeof name !== 'string') {
      console.error(`[createTag] Invalid name type received: ${typeof name}`, name);
      throw new Error(`[createTag] Invalid name type received: ${typeof name}`);
  }
  const q = query(collection(db, TAGS_COLLECTION), where("name", "==", name), where("category", "==", tagData.category));
  const existingTags = await getDocs(q);
  if (!existingTags.empty) {
    console.warn(`Tag "${name}" in category "${tagData.category}" already exists.`);
    throw new Error(`Il tag "${name}" esiste già nella categoria "${tagData.category}".`);
  }

  const newTagPayload = {
    name: name,
    category: tagData.category,
    usageCount: 0,
  };
  const docRef = await addDoc(collection(db, TAGS_COLLECTION), newTagPayload);
  return { id: docRef.id, ...newTagPayload };
};

export const updateTag = async (tagId: string, tagData: Partial<Omit<Tag, "id" | "usageCount">>): Promise<Tag> => {
  const tagRef = doc(db, TAGS_COLLECTION, tagId);
  const updatePayload: Partial<Tag> = {};
  if (tagData.name) updatePayload.name = tagData.name.toUpperCase();
  if (tagData.category) updatePayload.category = tagData.category;

  if (updatePayload.name || updatePayload.category) {
    const currentTagSnap = await getDoc(tagRef);
    if (!currentTagSnap.exists()) throw new Error(`Tag con ID ${tagId} non trovato.`);
    const currentTagData = currentTagSnap.data();
    const currentName = currentTagData.name;
    const currentCategory = currentTagData.category;

    const newName = updatePayload.name || currentName;
    const newCategory = updatePayload.category || currentCategory;

    // Verifica duplicati solo se nome o categoria cambiano effettivamente
    if (newName !== currentName || newCategory !== currentCategory) {
      // Verifica se la categoria può essere cambiata (solo se usageCount è 0)
      if (newCategory !== currentCategory && currentTagData.usageCount > 0) {
        throw new Error("Impossibile cambiare la categoria di un tag in uso.");
      }
      // Add validation check before query
      if (typeof newName !== 'string' || typeof newCategory !== 'string') {
         console.error(`[updateTag] Invalid type for newName or newCategory: Name(${typeof newName}), Category(${typeof newCategory})`);
         throw new Error(`[updateTag] Invalid type for newName or newCategory`);
      }
      // Verifica duplicati
      const q = query(collection(db, TAGS_COLLECTION), where("name", "==", newName), where("category", "==", newCategory));
      const existingTags = await getDocs(q);
      if (!existingTags.empty && existingTags.docs.some(d => d.id !== tagId)) {
        throw new Error(`Un tag con nome "${newName}" esiste già nella categoria "${newCategory}".`);
      }
    }
  }

  await updateDoc(tagRef, updatePayload);
  const updatedTagSnap = await getDoc(tagRef);
  if (!updatedTagSnap.exists()) throw new Error("Tag not found after update.");
  return { id: updatedTagSnap.id, ...updatedTagSnap.data() } as Tag;
};

export const deleteTag = async (tagId: string): Promise<void> => {
  const tagRef = doc(db, TAGS_COLLECTION, tagId);
  const tagSnap = await getDoc(tagRef);

  if (!tagSnap.exists()) {
    console.warn(`Tentativo di eliminare un tag non esistente: ${tagId}`);
    return; // Il tag non esiste, operazione completata.
  }

  const tagData = tagSnap.data() as Tag;

  // Impedisci l'eliminazione se il tag è in uso
  if (tagData.usageCount > 0) {
    throw new Error(`Impossibile eliminare il tag "${tagData.name}" perché è attualmente utilizzato da ${tagData.usageCount} elementi.`);
  }

  // Se non è in uso, procedi con l'eliminazione
  await deleteDoc(tagRef);
};

// --- Funzioni per la gestione delle associazioni ---

/**
 * Recupera le entità (utenti, team, clienti, progetti) associate a un tag specifico.
 */
export const getEntitiesByTag = async (
  tagName: string,
  category: TagCategory
): Promise<Array<Pick<UserProfile | Team | Client | Project, "id" | "firstName" | "lastName" | "companyName" | "name">>> => {
  const collectionName = getCollectionNameByCategory(category);
  const fieldName = (category === 'CLIENT' || category === 'PROJECT') ? 'name' : category === 'TEAM' ? 'name' : 'firstName'; // Adjust based on entity type

  // Add validation check
  if (typeof tagName !== 'string') {
    console.error(`[getEntitiesByTag] Invalid tagName type received: ${typeof tagName}`, tagName);
    throw new Error(`[getEntitiesByTag] Invalid tagName type received: ${typeof tagName}`);
  }
  const q = query(collection(db, collectionName), where("tags", "array-contains", tagName.toUpperCase()));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    const entity: any = { id: docSnap.id };
    // Estrai i campi rilevanti per l'identificazione
    if (data.firstName) entity.firstName = data.firstName;
    if (data.lastName) entity.lastName = data.lastName;
    if (data.companyName) entity.companyName = data.companyName;
    if (data.name) entity.name = data.name; // Per Project e Team
    return entity;
  });
};

/**
 * Aggiorna le associazioni di un tag con le entità specificate,
 * modificando l'array 'tags' nelle entità e aggiornando usageCount del tag.
 * Utilizza un batch write per garantire l'atomicità.
 */
export const updateTagAssociations = async (
    tagId: string,
    tagName: string, // Nome del tag (MAIUSCOLO)
    category: TagCategory,
    entityIdsToAdd: string[], // IDs delle entità a cui aggiungere il tag
    entityIdsToRemove: string[] // IDs delle entità da cui rimuovere il tag
): Promise<void> => {
    const batch = writeBatch(db);
    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    const collectionName = getCollectionNameByCategory(category);
    const tagNameUpper = tagName.toUpperCase(); // Assicura che il nome sia maiuscolo

     // Add validation check for tagNameUpper
    if (typeof tagNameUpper !== 'string') {
      console.error(`[updateTagAssociations] Invalid tagNameUpper type: ${typeof tagNameUpper}`, tagNameUpper);
      throw new Error(`[updateTagAssociations] Invalid tagNameUpper type: ${typeof tagNameUpper}`);
    }


    // 1. Rimuovi il tag dalle entità specificate
    for (const entityId of entityIdsToRemove) {
        const entityRef = doc(db, collectionName, entityId);
        batch.update(entityRef, { tags: arrayRemove(tagNameUpper) });
    }

    // 2. Aggiungi il tag alle entità specificate
    for (const entityId of entityIdsToAdd) {
        const entityRef = doc(db, collectionName, entityId);
        batch.update(entityRef, { tags: arrayUnion(tagNameUpper) });
    }

    // 3. Aggiorna il conteggio di utilizzo del tag
    const changeInUsage = entityIdsToAdd.length - entityIdsToRemove.length;
    if (changeInUsage !== 0) {
        batch.update(tagRef, { usageCount: increment(changeInUsage) });
    }

    // Esegui il batch write
    await batch.commit();
};


// --- Funzioni Deprecate/Da Rivedere per Usage Count ---
// Le seguenti funzioni potrebbero non essere necessarie se l'aggiornamento
// di usageCount viene gestito centralmente tramite updateTagAssociations.
// Mantenute per riferimento o se si decide un approccio ibrido.

export const incrementTagUsage = async (tagName: string, category: TagCategory): Promise<void> => {
  const tagNameUpper = tagName.toUpperCase();
  // Add validation check
  if (typeof tagNameUpper !== 'string' || typeof category !== 'string') {
      console.error(`[incrementTagUsage] Invalid type for tagNameUpper or category: Name(${typeof tagNameUpper}), Category(${typeof category})`);
      throw new Error(`[incrementTagUsage] Invalid type for tagNameUpper or category`);
  }
  const q = query(collection(db, TAGS_COLLECTION), where("name", "==", tagNameUpper), where("category", "==", category));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const tagDoc = snapshot.docs[0];
    await updateDoc(tagDoc.ref, { usageCount: increment(1) });
  } else {
    console.warn(`Tentativo di incrementare l'uso per il tag non esistente: ${tagNameUpper} [${category}]`);
    // Non creiamo il tag qui, dovrebbe già esistere se associato.
  }
};

export const decrementTagUsage = async (tagName: string, category: TagCategory): Promise<void> => {
  const tagNameUpper = tagName.toUpperCase();
   // Add validation check
  if (typeof tagNameUpper !== 'string' || typeof category !== 'string') {
      console.error(`[decrementTagUsage] Invalid type for tagNameUpper or category: Name(${typeof tagNameUpper}), Category(${typeof category})`);
      throw new Error(`[decrementTagUsage] Invalid type for tagNameUpper or category`);
  }
  const q = query(collection(db, TAGS_COLLECTION), where("name", "==", tagNameUpper), where("category", "==", category));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const tagDoc = snapshot.docs[0];
    // Assicurati che usageCount non diventi negativo
    const currentCount = tagDoc.data().usageCount;
    if (currentCount > 0) {
        await updateDoc(tagDoc.ref, { usageCount: increment(-1) });
    } else {
        console.warn(`Tentativo di decrementare l'uso per il tag ${tagNameUpper} [${category}] con conteggio ${currentCount}. Azione saltata.`);
    }
  } else {
      console.warn(`Tentativo di decrementare l'uso per il tag non esistente: ${tagNameUpper} [${category}]`);
  }
};
