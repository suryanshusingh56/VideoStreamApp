import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";
import { response } from "express";

    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET
    });
    
const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary",
        //     response.url
        // );
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
const deleteFromCloudinary=async (videoUrl)=>{
    try {
        if(!videoUrl) return null;
        // Note::For deleting file from cloudinary the file type must
        //  be specified otherwise it will throw error if "auto" is mentioned
        const response=await cloudinary.uploader.destroy(videoUrl,{
            resource_type:"video"
        })
        console.log("Cloudinary Deletion Response:", response);
        return response
    } catch (error) {
        console.error("Error occurred while deleting from Cloudinary:", error.message)
        throw new ApiError(400,"Error occured while deleting file")     
    }
}

export {uploadOnCloudinary,deleteFromCloudinary}