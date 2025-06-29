/**
 * Firestore Service Module
 * 
 * Provides a comprehensive set of utilities for interacting with Firebase Firestore.
 * Handles CRUD operations, querying, and data transformation with automatic logging
 * and error handling. All documents are automatically timestamped on creation/update.
 */

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

// Logger instance for tracking Firestore operations
const logger = createLogger('FirestoreService');

/**
 * Creates a new document in the specified Firestore collection
 * 
 * @param collectionPath - The path to the Firestore collection
 * @param data - The document data to store
 * @param id - Optional custom document ID. If not provided, Firestore generates one
 * @returns Promise resolving to the document ID
 * 
 */
export const createDocument = async (
  collectionPath: string,
  data: DocumentData,
  id?: string
): Promise<string> => {
  try {
    // Remove undefined values to prevent Firestore validation errors
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    // Add automatic timestamps for audit trail
    const documentData = {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (id) {
      // Create document with custom ID
      const docRef = doc(db, collectionPath, id);
      await setDoc(docRef, documentData);
      logger.info(`Document created with ID: ${id}`, { collectionPath });
      return id;
    } else {
      // Let Firestore generate a unique ID
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

/**
 * Retrieves a single document from Firestore by ID
 * 
 * @param collectionPath - The path to the Firestore collection
 * @param id - The document ID to retrieve
 * @returns Promise resolving to document data with ID field, or null if not found
 * 
 */
export const getDocument = async (
  collectionPath: string,
  id: string
): Promise<DocumentData | null> => {
  try {
    const docRef = doc(db, collectionPath, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      logger.debug(`Document retrieved: ${id}`, { collectionPath });
      // Include document ID in the returned data for convenience
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

/**
 * Updates an existing document in Firestore
 * 
 * @param collectionPath - The path to the Firestore collection
 * @param id - The document ID to update
 * @param data - Partial document data to update (only specified fields are modified)
 * 
 */
export const updateDocument = async (
  collectionPath: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, id);
    
    // Remove undefined values to prevent Firestore validation errors
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    
    // Automatically update the modification timestamp
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

/**
 * Permanently deletes a document from Firestore
 * 
 * @param collectionPath - The path to the Firestore collection
 * @param id - The document ID to delete
 * 
 */
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

/**
 * Executes a query against a Firestore collection with optional constraints
 * 
 * @param collectionPath - The path to the Firestore collection
 * @param constraints - Array of query constraints (where, orderBy, limit, etc.)
 * @returns Promise resolving to array of documents matching the query
 * 
 */
export const queryDocuments = async (
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<DocumentData[]> => {
  try {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    // Transform query results into a more convenient format
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


/**
 * Retrieves all documents from a collection without any constraints
 * 
 * @param collectionPath - The path to the Firestore collection
 * @returns Promise resolving to array of all documents in the collection
 * 
 */
export const getAllDocuments = async (
  collectionPath: string
): Promise<DocumentData[]> => {
  return queryDocuments(collectionPath);
};

/**
 * Converts a Firestore Timestamp to a JavaScript Date object
 * 
 * @param timestamp - Firestore Timestamp object (can be null/undefined)
 * @returns JavaScript Date object or null if input is null/undefined
 * 
 */
export const timestampToDate = (timestamp: Timestamp | null | undefined): Date | null => {
  if (!timestamp) {
    return null;
  }
  return timestamp.toDate();
};

/**
 * Creates a Firestore DocumentReference for advanced operations
 * 
 * @param collectionPath - The path to the Firestore collection
 * @param id - The document ID
 * @returns DocumentReference object for use in transactions, batch operations, etc.
 * 
 */
export const getDocumentRef = (
  collectionPath: string,
  id: string
): DocumentReference => {
  return doc(db, collectionPath, id);
};

/**
 * Creates a Firestore CollectionReference for advanced operations
 * 
 * @param collectionPath - The path to the Firestore collection
 * @returns CollectionReference object for use in complex queries or batch operations
 * 
 */
export const getCollectionRef = (
  collectionPath: string
): CollectionReference => {
  return collection(db, collectionPath);
};

// Alias for createDocument to match import expectations
export const addDocument = createDocument;

// Alias for queryDocuments to match import expectations
export const getDocuments = queryDocuments;