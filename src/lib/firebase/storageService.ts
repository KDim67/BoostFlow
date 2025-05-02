/**
 * Firebase Storage Service
 * 
 * This file provides Firebase Storage functionality for the BoostFlow application.
 * It includes methods for uploading, downloading, and managing files in Firebase Storage.
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
  UploadResult,
  ListResult,
  UploadMetadata
} from 'firebase/storage';
import { storage } from './config';
import { createLogger } from '../utils/logger';

const logger = createLogger('StorageService');

/**
 * Upload a file to Firebase Storage
 * @param path Storage path where the file will be stored
 * @param file File to upload
 * @param metadata Optional metadata for the file
 * @returns Promise resolving to upload result
 */
export const uploadFile = async (
  path: string,
  file: File | Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<UploadResult> => {
  try {
    const storageRef = ref(storage, path);
    const result = await uploadBytes(storageRef, file, metadata);
    logger.info(`File uploaded successfully to path: ${path}`);
    return result;
  } catch (error) {
    logger.error('Error uploading file', error as Error, { path });
    throw error;
  }
};

/**
 * Get download URL for a file
 * @param path Path to the file in storage
 * @returns Promise resolving to download URL
 */
export const getFileDownloadURL = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    logger.debug(`Download URL retrieved for path: ${path}`);
    return url;
  } catch (error) {
    logger.error('Error getting download URL', error as Error, { path });
    throw error;
  }
};

/**
 * Delete a file from storage
 * @param path Path to the file in storage
 * @returns Promise that resolves when the file is deleted
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    logger.info(`File deleted from path: ${path}`);
  } catch (error) {
    logger.error('Error deleting file', error as Error, { path });
    throw error;
  }
};

/**
 * List all files in a directory
 * @param path Path to the directory in storage
 * @returns Promise resolving to list result
 */
export const listFiles = async (path: string): Promise<ListResult> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    logger.debug(`Listed ${result.items.length} files and ${result.prefixes.length} directories in path: ${path}`);
    return result;
  } catch (error) {
    logger.error('Error listing files', error as Error, { path });
    throw error;
  }
};

/**
 * Get a reference to a file or directory in storage
 * @param path Path to the file or directory
 * @returns Storage reference
 */
export const getStorageRef = (path: string): StorageReference => {
  return ref(storage, path);
};

/**
 * Generate a unique file path for storage
 * @param userId User ID
 * @param fileName Original file name
 * @param directory Optional directory path
 * @returns Unique storage path
 */
export const generateUniqueFilePath = (
  userId: string,
  fileName: string,
  directory = 'uploads'
): string => {
  const timestamp = new Date().getTime();
  const extension = fileName.split('.').pop();
  return `${directory}/${userId}/${timestamp}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
};