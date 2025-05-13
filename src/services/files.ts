// src/services/files.ts
import type { FileAttachment } from "@/types";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  writeBatch,
  arrayRemove,
} from "firebase/firestore";
import {
  ref,
  deleteObject,
} from "firebase/storage";

const COLLECTIONS_WITH_FILES = ["users", "teams", "clients", "projects"]; // Add other collections if needed

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestampToISO = (timestamp: any, fieldName: string): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
   if (typeof timestamp === 'string') {
        try {
            return new Date(timestamp).toISOString();
        } catch (e) {
            console.error(`Invalid date string for required field ${fieldName}`, timestamp, e);
            throw new Error(`Invalid date string provided for required field ${fieldName}.`);
        }
    }
   if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
        return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString();
    }
  console.error(`Unrecognized timestamp format for required field ${fieldName}`, timestamp);
  throw new Error(`Unrecognized timestamp format for required field ${fieldName}.`);
};

// Function to fetch all files from all relevant collections
export const getAllFiles = async (): Promise<FileAttachment[]> => {
  console.log("getAllFiles service: Fetching files from all collections:", COLLECTIONS_WITH_FILES);
  let allFiles: FileAttachment[] = [];

  for (const collectionName of COLLECTIONS_WITH_FILES) {
    console.log(`getAllFiles service: Fetching files from collection: ${collectionName}`);
    const q = query(collection(db, collectionName));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((docSnap) {
      const data = docSnap.data();
      const filesField = collectionName === 'clients' || collectionName === 'projects' ? 'attachments' : 'files'; // Adjust field name based on collection
      
      if (data[filesField] && Array.isArray(data[filesField])) {
        const filesFromDoc = data[filesField].map((fileData: any) => {
            // Attempt to enrich file data with parent info if possible
            const fileId = fileData.id || `${collectionName}-${docSnap.id}-${fileData.name}-${fileData.size}`; // Create a more unique temp ID if missing
            return {
                ...fileData,
                id: fileId, // Ensure each file has a unique ID for the list
                uploadedAt: convertTimestampToISO(fileData.uploadedAt, `${collectionName}.${docSnap.id}.${filesField}.uploadedAt`),
                // Add linkedTo if not present, or ensure it's correct
                linkedTo: fileData.linkedTo || [{ type: collectionName.slice(0, -1) as any, id: docSnap.id }],
            };
        });
        allFiles = allFiles.concat(filesFromDoc);
      }
    });
     console.log(`getAllFiles service: Found ${querySnapshot.docs.length} documents in ${collectionName}. Total files so far: ${allFiles.length}`);
  }

  console.log(`getAllFiles service: Finished fetching. Total unique files found: ${allFiles.length}`);
  // Note: This approach might list the same physical file multiple times if linked to multiple entities.
  // A more robust solution might involve a dedicated 'files' collection.
  // Deduplication might be needed based on storagePath if that's the unique identifier.
  
  // Simple deduplication based on storagePath if available
  const uniqueFilesMap = new Map<string, FileAttachment>();
  allFiles.forEach(file => {
    if (file.storagePath && !uniqueFilesMap.has(file.storagePath)) {
      uniqueFilesMap.set(file.storagePath, file);
    } else if (!file.storagePath) {
        // Handle files without storagePath (maybe older ones or different structure)
        // Use a combination of fields as a key, or assign a temporary unique ID
        const tempKey = file.id || `${file.name}-${file.size}-${file.uploadedAt}`;
         if (!uniqueFilesMap.has(tempKey)) {
             uniqueFilesMap.set(tempKey, file);
         } else {
            // Merge linkedTo information if the same file is found multiple times
            const existingFile = uniqueFilesMap.get(tempKey);
            if (existingFile && file.linkedTo) {
                 existingFile.linkedTo = [...new Set([...(existingFile.linkedTo || []), ...file.linkedTo])];
            }
         }
    }
  });

  const uniqueFiles = Array.from(uniqueFilesMap.values());
  console.log(`getAllFiles service: Returning ${uniqueFiles.length} unique files after deduplication.`);
  return uniqueFiles;
};


// Function to delete a file from storage and optionally update the parent document
export const deleteFile = async (fileId: string, storagePath?: string): Promise<void> => {
    console.log(`deleteFile service: Attempting to delete file with ID: ${fileId}, storagePath: ${storagePath}`);

    if (!storagePath) {
        console.warn(`deleteFile service: No storagePath provided for fileId ${fileId}. Cannot delete from storage. Searching for file reference in documents.`);
        // If no storage path, we might need to search for the file reference to delete it
        // This is complex and inefficient without a dedicated files collection or knowing the parent
        // For now, we'll just log a warning or potentially throw an error.
        // throw new Error("Storage path is required to delete the file from storage.");
        // OR try to find and remove the reference (example below - adapt carefully)
        
        // --- Example Search Logic (Inefficient - Use with caution) ---
        let foundAndRemoved = false;
        for (const collectionName of COLLECTIONS_WITH_FILES) {
            const filesField = collectionName === 'clients' || collectionName === 'projects' ? 'attachments' : 'files';
             const q = query(collection(db, collectionName)); // Potentially add where clause if possible
             const snapshot = await getDocs(q);
             const batch = writeBatch(db);
             let batchHasWrites = false;

             snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const filesArray = data[filesField] as any[];
                if (filesArray && Array.isArray(filesArray)) {
                    const fileToRemove = filesArray.find(f => f.id === fileId); // Match by provided ID
                    if (fileToRemove) {
                        console.log(`deleteFile service: Found reference to fileId ${fileId} in ${collectionName}/${docSnap.id}. Removing reference.`);
                        batch.update(docSnap.ref, { [filesField]: arrayRemove(fileToRemove) });
                        foundAndRemoved = true;
                        batchHasWrites = true;
                    }
                }
             });
             if (batchHasWrites) {
                await batch.commit();
                console.log(`deleteFile service: Batch committed for collection ${collectionName}`);
             }
        }
         if (!foundAndRemoved) {
             console.error(`deleteFile service: File reference with ID ${fileId} not found in any collection.`);
             throw new Error(`File reference with ID ${fileId} not found.`);
         }
         console.log(`deleteFile service: Successfully removed reference for fileId ${fileId}.`);
         return; // Exit because we only removed the reference
        // --- End Example Search Logic ---
    }

    // Proceed with storage deletion if storagePath is provided
    const fileStorageRef = ref(storage, storagePath);

    try {
        await deleteObject(fileStorageRef);
        console.log(`deleteFile service: File deleted from storage: ${storagePath}`);
        
        // Now, remove the file reference from all documents that might link to it.
        // This still requires iterating through collections or having a better structure.
        // Using the search logic again, but now focused on removing by storagePath potentially.

        let foundAndRemoved = false;
        for (const collectionName of COLLECTIONS_WITH_FILES) {
             const filesField = collectionName === 'clients' || collectionName === 'projects' ? 'attachments' : 'files';
             const q = query(collection(db, collectionName)); // Potentially add where clause if possible
             const snapshot = await getDocs(q);
             const batch = writeBatch(db);
             let batchHasWrites = false;

             snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const filesArray = data[filesField] as any[];
                if (filesArray && Array.isArray(filesArray)) {
                    // Find the file object to remove based on storagePath
                    const fileToRemove = filesArray.find(f => f.storagePath === storagePath); 
                    if (fileToRemove) {
                        console.log(`deleteFile service: Found reference to storagePath ${storagePath} in ${collectionName}/${docSnap.id}. Removing reference.`);
                        batch.update(docSnap.ref, { [filesField]: arrayRemove(fileToRemove) });
                        foundAndRemoved = true;
                        batchHasWrites = true;
                    }
                }
             });
             if (batchHasWrites) {
                await batch.commit();
                console.log(`deleteFile service: Batch committed for collection ${collectionName} to remove reference.`);
             }
        }
         if (!foundAndRemoved) {
             console.warn(`deleteFile service: Reference for storagePath ${storagePath} not found in any document after storage deletion.`);
         }


    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            console.warn(`deleteFile service: File not found in storage at ${storagePath}. It might have been already deleted. Attempting to remove references anyway.`);
             // Attempt to remove references even if storage deletion failed because file wasn't there
             let foundAndRemoved = false;
             for (const collectionName of COLLECTIONS_WITH_FILES) {
                  const filesField = collectionName === 'clients' || collectionName === 'projects' ? 'attachments' : 'files';
                  const q = query(collection(db, collectionName)); 
                  const snapshot = await getDocs(q);
                  const batch = writeBatch(db);
                  let batchHasWrites = false;
     
                  snapshot.forEach(docSnap => {
                     const data = docSnap.data();
                     const filesArray = data[filesField] as any[];
                     if (filesArray && Array.isArray(filesArray)) {
                         const fileToRemove = filesArray.find(f => f.storagePath === storagePath || f.id === fileId); // Try both
                         if (fileToRemove) {
                             batch.update(docSnap.ref, { [filesField]: arrayRemove(fileToRemove) });
                             foundAndRemoved = true;
                             batchHasWrites = true;
                         }
                     }
                  });
                  if (batchHasWrites) {
                     await batch.commit();
                  }
             }
              if (!foundAndRemoved) {
                  console.warn(`deleteFile service: Reference for fileId ${fileId} / storagePath ${storagePath} not found.`);
              }
        } else {
            console.error(`deleteFile service: Error deleting file from storage: ${storagePath}`, error);
            throw error; // Re-throw other storage errors
        }
    }
};
