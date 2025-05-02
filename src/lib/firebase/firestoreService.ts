/**
 * Firebase Firestore Service
 * 
 * This file provides Firestore database functionality for the BoostFlow application.
 * It includes methods for creating, reading, updating, and deleting documents,
 * as well as querying collections with various filters.
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

const logger = createLogger('FirestoreService');

/**
 * Create a new document in a collection
 * @param collectionPath Path to the collection
 * @param data Document data
 * @param id Optional document ID (if not provided, Firestore will generate one)
 * @returns Promise that resolves when the document is created
 */
export const createDocument = async (
  collectionPath: string,
  data: DocumentData,
  id?: string
): Promise<void> => {
  try {
    // Add timestamps
    const documentData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (id) {
      // Use provided ID
      const docRef = doc(db, collectionPath, id);
      await setDoc(docRef, documentData);
      logger.info(`Document created with ID: ${id}`, { collectionPath });
    } else {
      // Let Firestore generate ID
      const collectionRef = collection(db, collectionPath);
      const newDocRef = doc(collectionRef);
      await setDoc(newDocRef, documentData);
      logger.info(`Document created with generated ID: ${newDocRef.id}`, { collectionPath });
    }
  } catch (error) {
    logger.error('Error creating document', error as Error, { collectionPath });
    throw error;
  }
};

/**
 * Get a document by ID
 * @param collectionPath Path to the collection
 * @param id Document ID
 * @returns Promise resolving to document data or null if not found
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
 * Update an existing document
 * @param collectionPath Path to the collection
 * @param id Document ID
 * @param data Updated document data
 * @returns Promise that resolves when the document is updated
 */
export const updateDocument = async (
  collectionPath: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, id);
    
    // Add updated timestamp
    const updateData = {
      ...data,
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
 * Delete a document
 * @param collectionPath Path to the collection
 * @param id Document ID
 * @returns Promise that resolves when the document is deleted
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
 * Query documents in a collection
 * @param collectionPath Path to the collection
 * @param constraints Query constraints (where, orderBy, limit, etc.)
 * @returns Promise resolving to array of document data
 */
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

/**
 * Get all documents in a collection
 * @param collectionPath Path to the collection
 * @returns Promise resolving to array of document data
 */
export const getAllDocuments = async (
  collectionPath: string
): Promise<DocumentData[]> => {
  return queryDocuments(collectionPath);
};

/**
 * Helper function to convert Firestore Timestamp to JavaScript Date
 * @param timestamp Firestore Timestamp
 * @returns JavaScript Date object
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Helper function to create a reference to a document
 * @param collectionPath Path to the collection
 * @param id Document ID
 * @returns DocumentReference
 */
export const getDocumentRef = (
  collectionPath: string,
  id: string
): DocumentReference => {
  return doc(db, collectionPath, id);
};

/**
 * Helper function to create a reference to a collection
 * @param collectionPath Path to the collection
 * @returns CollectionReference
 */
export const getCollectionRef = (
  collectionPath: string
): CollectionReference => {
  return collection(db, collectionPath);
};