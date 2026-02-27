import { initializeApp } from 'firebase/app';
// This side-effect import is necessary to register the firestore service.
import 'firebase/firestore';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';
import type { Audience } from '../types';

// --- Firebase Configuration ---
// IMPORTANT: Replace the placeholder values below with your own Firebase project's configuration.
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// --- Initialize Firebase and Firestore ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// It's a good practice to use a unique identifier for your application's data,
// especially in a shared environment. For this example, we'll use a static ID.
const appId = "market-research-assistant-v1";
const audiencesCollectionRef = collection(db, `artifacts/${appId}/public/data/audiences`);

// --- Firestore Service Functions ---

/**
 * Adds a new audience document to Firestore.
 * @param audienceData The data for the new audience.
 * @returns The ID of the newly created document.
 */
export const addAudience = async (audienceData: { name: string; demographics: string; interests: string; behaviors: string; }): Promise<string> => {
  try {
    const docRef = await addDoc(audiencesCollectionRef, {
      ...audienceData,
      owner: "Me", // Placeholder for ownership
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not save the audience to the database.");
  }
};

/**
 * Fetches all audience documents from Firestore, ordered by creation date.
 * @returns An array of Audience objects.
 */
export const getAudiences = async (): Promise<Audience[]> => {
    try {
        const q = query(audiencesCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Audience));
    } catch (error) {
        console.error("Error fetching documents: ", error);
        throw new Error("Could not retrieve audiences from the database.");
    }
};

/**
 * Fetches a single audience document by its ID.
 * @param id The ID of the document to fetch.
 * @returns An Audience object.
 */
export const getAudience = async (id: string): Promise<Audience> => {
    try {
        const docRef = doc(audiencesCollectionRef, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Audience;
        } else {
            throw new Error("No such audience found!");
        }
    } catch (error) {
        console.error("Error fetching document: ", error);
        throw new Error(`Could not retrieve the audience (ID: ${id}) from the database.`);
    }
};
