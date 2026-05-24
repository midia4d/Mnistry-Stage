import { openDB } from "idb";

export interface MediaItem {
  id: string;
  path: string;
  name: string;
  type: 'video' | 'image';
}

const DB_NAME = "ministrystage-media-cache";

const initMediaDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media", { keyPath: "id" });
      }
    },
  });
};

export const getMediaList = async (): Promise<MediaItem[]> => {
  try {
    const db = await initMediaDB();
    const items = await db.getAll("media");
    return items as MediaItem[];
  } catch (e) {
    console.error("Failed to load media from IndexedDB", e);
    return [];
  }
};

export const saveMediaItem = async (item: MediaItem): Promise<void> => {
  try {
    const db = await initMediaDB();
    await db.put("media", item);
  } catch (e) {
    console.error("Failed to save media to IndexedDB", e);
  }
};

export const removeMediaItem = async (id: string): Promise<void> => {
  try {
    const db = await initMediaDB();
    await db.delete("media", id);
  } catch (e) {
    console.error("Failed to delete media from IndexedDB", e);
  }
};
