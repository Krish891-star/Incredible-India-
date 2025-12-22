/**
 * Storage Utilities for Supabase Storage
 * Provides helper functions for file uploads and management
 */

import { supabase } from '@/integrations/supabase/client';
import { generateId } from '@/utils/db.utils';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: string = 'public',
  folder: string = 'uploads'
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${generateId()}-${file.name}`;
    
    // Upload file
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    
    if (error) throw error;
    
    // Return the public URL instead of just the path
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return { success: true, path: data.publicUrl };
  } catch (error: any) {
    console.error('[Storage Utils] Upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file'
    };
  }
}

/**
 * Get public URL for a file
 */
export function getFileUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('[Storage Utils] Delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file'
    };
  }
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: string,
  folder: string = ''
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);
    
    if (error) throw error;
    
    return { success: true, files: data };
  } catch (error: any) {
    console.error('[Storage Utils] List files error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list files'
    };
  }
}

/**
 * Create a signed URL for private files
 */
export async function createSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) throw error;
    
    return { success: true, url: data.signedUrl };
  } catch (error: any) {
    console.error('[Storage Utils] Create signed URL error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create signed URL'
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string = 'public',
  folder: string = 'uploads'
): Promise<{ success: boolean; paths?: string[]; error?: string }> {
  try {
    const uploadPromises = files.map(file => uploadFile(file, bucket, folder));
    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);
    
    if (failedUploads.length > 0) {
      console.warn('[Storage Utils] Some files failed to upload:', failedUploads);
    }
    
    const paths = successfulUploads.map(result => result.path!).filter(Boolean);
    
    return { 
      success: successfulUploads.length > 0, 
      paths: paths.length > 0 ? paths : undefined,
      error: failedUploads.length > 0 ? 'Some files failed to upload' : undefined
    };
  } catch (error: any) {
    console.error('[Storage Utils] Multiple upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload files'
    };
  }
}

/**
 * Move a file within storage
 */
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Copy file to new location
    const { error: copyError } = await supabase.storage
      .from(bucket)
      .copy(fromPath, toPath);
    
    if (copyError) throw copyError;
    
    // Remove original file
    const { error: removeError } = await supabase.storage
      .from(bucket)
      .remove([fromPath]);
    
    if (removeError) throw removeError;
    
    return { success: true };
  } catch (error: any) {
    console.error('[Storage Utils] Move file error:', error);
    return {
      success: false,
      error: error.message || 'Failed to move file'
    };
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; metadata?: any; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .info(filePath);
    
    if (error) throw error;
    
    return { success: true, metadata: data };
  } catch (error: any) {
    console.error('[Storage Utils] Get metadata error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get file metadata'
    };
  }
}

export default {
  uploadFile,
  getFileUrl,
  deleteFile,
  listFiles,
  createSignedUrl,
  uploadMultipleFiles,
  moveFile,
  getFileMetadata
};