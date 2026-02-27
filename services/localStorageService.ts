import type { Audience } from '../types';

const STORAGE_KEY = 'audiences';

/**
 * Fetches all audience documents from localStorage, ordered by creation date.
 * @returns An array of Audience objects.
 */
export const getAudiences = (): Audience[] => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return [];
    }
    const audiences: Audience[] = JSON.parse(rawData);
    // Sort by creation date, descending, to show newest first
    return audiences.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching audiences from localStorage: ", error);
    // If parsing fails, clear the corrupted data to prevent future errors
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

/**
 * Adds a new audience document to localStorage.
 * @param audienceData The data for the new audience.
 * @returns The newly created Audience object.
 */
export const addAudience = (audienceData: { name: string; demographics: string; interests: string; behaviors: string; }): Audience => {
  const audiences = getAudiences();
  const now = new Date().toISOString();
  
  const newAudience: Audience = {
    ...audienceData,
    id: Date.now().toString(),
    owner: "Me", // Placeholder for ownership
    createdAt: now,
    updatedAt: now,
  };

  const updatedAudiences = [newAudience, ...audiences];
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAudiences));
    return newAudience;
  } catch (error) {
    console.error("Error saving audience to localStorage: ", error);
    throw new Error("Could not save the audience to local storage.");
  }
};

/**
 * Fetches a single audience document by its ID from localStorage.
 * @param id The ID of the document to fetch.
 * @returns An Audience object or null if not found.
 */
export const getAudience = (id: string): Audience | null => {
  try {
    const audiences = getAudiences();
    const audience = audiences.find(a => a.id === id);
    return audience || null;
  } catch (error) {
    console.error("Error fetching audience from localStorage: ", error);
    throw new Error(`Could not retrieve the audience (ID: ${id}) from local storage.`);
  }
};

/**
 * Deletes an audience document by its ID from localStorage.
 * @param id The ID of the document to delete.
 */
export const deleteAudience = (id: string): void => {
  try {
    const audiences = getAudiences();
    const updatedAudiences = audiences.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAudiences));
  } catch (error) {
    console.error("Error deleting audience from localStorage: ", error);
    throw new Error(`Could not delete the audience (ID: ${id}) from local storage.`);
  }
};

/**
 * Updates an existing audience document in localStorage.
 * @param id The ID of the document to update.
 * @param audienceData The new data for the audience.
 * @returns The updated Audience object.
 */
export const updateAudience = (id: string, audienceData: { name: string; demographics: string; interests: string; behaviors: string; }): Audience => {
  const audiences = getAudiences();
  const now = new Date().toISOString();

  let updatedAudience: Audience | null = null;

  const updatedAudiences = audiences.map(audience => {
    if (audience.id === id) {
      updatedAudience = {
        ...audience, // keep id, createdAt, owner
        ...audienceData,
        updatedAt: now,
      };
      return updatedAudience;
    }
    return audience;
  });

  if (!updatedAudience) {
    throw new Error(`Audience with ID ${id} not found for update.`);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAudiences));
    return updatedAudience;
  } catch (error) {
    console.error("Error updating audience in localStorage: ", error);
    throw new Error(`Could not update the audience (ID: ${id}) in local storage.`);
  }
};