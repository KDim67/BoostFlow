import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  CollectionReference,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { createLogger } from '../utils/logger';

const logger = createLogger('FirestoreService');

export const createDocument = async (
  collectionPath: string,
  data: DocumentData,
  id?: string
): Promise<string> => {
  try {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const documentData = {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (id) {
      const docRef = doc(db, collectionPath, id);
      await setDoc(docRef, documentData);
      logger.info(`Document created with ID: ${id}`, { collectionPath });
      return id;
    } else {
      const collectionRef = collection(db, collectionPath);
      const newDocRef = doc(collectionRef);
      await setDoc(newDocRef, documentData);
      logger.info(`Document created with generated ID: ${newDocRef.id}`, { collectionPath });
      return newDocRef.id;
    }
  } catch (error) {
    logger.error('Error creating document', error as Error, { collectionPath });
    throw error;
  }
};

export const getDocument = async (
  collectionPath: string,
  id: string
): Promise<DocumentData | null> => {
  try {
    const docRef = doc(db, collectionPath, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      logger.debug(`Document retrieved: ${id}`, { collectionPath });
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      logger.info(`Document not found: ${id}`, { collectionPath });
      return null;
    }
  } catch (error) {
    logger.error('Error getting document', error as Error, { collectionPath, id });
    throw error;
  }
};

export const updateDocument = async (
  collectionPath: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, id);
    
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    
    const updateData = {
      ...cleanData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
    logger.info(`Document updated: ${id}`, { collectionPath });
  } catch (error) {
    logger.error('Error updating document', error as Error, { collectionPath, id });
    throw error;
  }
};

export const deleteDocument = async (
  collectionPath: string,
  id: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, id);
    await deleteDoc(docRef);
    logger.info(`Document deleted: ${id}`, { collectionPath });
  } catch (error) {
    logger.error('Error deleting document', error as Error, { collectionPath, id });
    throw error;
  }
};

export const queryDocuments = async (
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<DocumentData[]> => {
  try {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const documents: DocumentData[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    logger.debug(`Query executed with ${documents.length} results`, { 
      collectionPath, 
      constraintCount: constraints.length 
    });
    return documents;
  } catch (error) {
    logger.error('Error querying documents', error as Error, { collectionPath });
    throw error;
  }
};


export const getAllDocuments = async (
  collectionPath: string
): Promise<DocumentData[]> => {
  return queryDocuments(collectionPath);
};

export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const getDocumentRef = (
  collectionPath: string,
  id: string
): DocumentReference => {
  return doc(db, collectionPath, id);
};


export const getCollectionRef = (
  collectionPath: string
): CollectionReference => {
  return collection(db, collectionPath);
};

// Alias for createDocument to match import expectations
export const addDocument = createDocument;

// Alias for queryDocuments to match import expectations
export const getDocuments = queryDocuments;