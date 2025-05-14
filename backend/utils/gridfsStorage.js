// utils/gridfsStorage.js - Utility for MongoDB GridFS storage
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');

let gridFSBucket;

/**
 * Initialize GridFS bucket
 */
const initGridFS = async () => {
  if (!gridFSBucket) {
    // Get the db instance from mongoose connection
    const db = mongoose.connection.db;
    gridFSBucket = new GridFSBucket(db, { bucketName: 'streetviews' });
    console.log('GridFS bucket initialized for streetview storage');
  }
  return gridFSBucket;
};

/**
 * Upload a file to GridFS
 * @param {string} filePath - Path to the file to upload
 * @param {string} filename - Name to save the file as
 * @param {Object} metadata - Additional metadata for the file
 * @returns {Promise<string>} - MongoDB ID of the saved file
 */
const uploadFile = async (filePath, filename, metadata = {}) => {
  try {
    const bucket = await initGridFS();
    
    return new Promise((resolve, reject) => {
      // Create a read stream for the file
      const readStream = fs.createReadStream(filePath);
      
      // Create a write stream to GridFS
      const uploadStream = bucket.openUploadStream(filename, {
        metadata
      });
      
      // Get the ID of the file
      const fileId = uploadStream.id;
      
      // Handle errors
      uploadStream.on('error', (error) => {
        reject(error);
      });
      
      // When the upload is complete, resolve the promise with the file ID
      uploadStream.on('finish', () => {
        resolve(fileId.toString());
      });
      
      // Pipe the read stream to the write stream
      readStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('Error uploading file to GridFS:', error);
    throw error;
  }
};

/**
 * Save a buffer directly to GridFS (for in-memory images)
 * @param {Buffer} buffer - The buffer to save
 * @param {string} filename - Name to save the file as
 * @param {Object} metadata - Additional metadata for the file
 * @returns {Promise<string>} - MongoDB ID of the saved file
 */
const saveBuffer = async (buffer, filename, metadata = {}) => {
  try {
    const bucket = await initGridFS();
    
    return new Promise((resolve, reject) => {
      // Create a write stream to GridFS
      const uploadStream = bucket.openUploadStream(filename, {
        metadata
      });
      
      // Get the ID of the file
      const fileId = uploadStream.id;
      
      // Handle errors
      uploadStream.on('error', (error) => {
        reject(error);
      });
      
      // When the upload is complete, resolve the promise with the file ID
      uploadStream.on('finish', () => {
        resolve(fileId.toString());
      });
      
      // Write the buffer to the upload stream
      uploadStream.write(buffer);
      uploadStream.end();
    });
  } catch (error) {
    console.error('Error saving buffer to GridFS:', error);
    throw error;
  }
};

/**
 * Download a file from GridFS by ID or filename
 * @param {string} fileIdOrName - MongoDB ID or filename of the file
 * @param {boolean} isId - Whether the first parameter is an ID (true) or filename (false)
 * @returns {Promise<Buffer>} - File content as a buffer
 */
const downloadFile = async (fileIdOrName, isId = true) => {
  try {
    const bucket = await initGridFS();
    
    return new Promise((resolve, reject) => {
      // Create a download stream based on ID or filename
      const downloadStream = isId 
        ? bucket.openDownloadStream(new mongoose.Types.ObjectId(fileIdOrName))
        : bucket.openDownloadStreamByName(fileIdOrName);
      
      const chunks = [];
      
      // Handle errors
      downloadStream.on('error', (error) => {
        reject(error);
      });
      
      // Collect the chunks
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      // When the download is complete, resolve the promise with the file content
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });
  } catch (error) {
    console.error('Error downloading file from GridFS:', error);
    throw error;
  }
};

/**
 * Check if a file exists in GridFS
 * @param {string} filename - Name of the file to check
 * @returns {Promise<boolean>} - Whether the file exists
 */
const fileExists = async (filename) => {
  try {
    const bucket = await initGridFS();
    
    // Find the file by filename
    const files = await bucket.find({ filename }).toArray();
    
    return files.length > 0;
  } catch (error) {
    console.error('Error checking if file exists in GridFS:', error);
    return false;
  }
};

/**
 * Delete a file from GridFS
 * @param {string} fileId - MongoDB ID of the file
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
const deleteFile = async (fileId) => {
  try {
    const bucket = await initGridFS();
    
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    return true;
  } catch (error) {
    console.error('Error deleting file from GridFS:', error);
    return false;
  }
};

module.exports = {
  initGridFS,
  uploadFile,
  saveBuffer,
  downloadFile,
  fileExists,
  deleteFile
};