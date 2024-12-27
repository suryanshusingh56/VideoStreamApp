import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { json } from "stream/consumers"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);

    // Validate pagination values
    if (pageNumber <= 0 || pageLimit <= 0) {
        throw new ApiError(400, 'Invalid pagination parameters');
    }

    // Build the query filter object
    let filter = {};

    // Add a filter for search query if present
    if (query) {
        const regex = new RegExp(query, 'i'); // for case insensitive search
        filter = {
            ...filter,
            $or: [
                { title: { $regex: regex } },
                { description: { $regex: regex } }
            ]
        };
    }

    // Add a filter for userId if provided
    if (userId) {
        filter.owner = userId;
    }

    // Determine sorting order (ascending or descending)
    const sortOrder = sortType === 'asc' ? 1 : -1;

    // Get the total count of videos that match the filter
    const totalVideos = await Video.countDocuments(filter);

    // Get the list of videos with pagination and sorting
    const videos = await Video.find(filter)
        .skip((pageNumber - 1) * pageLimit) // Pagination: (page - 1) * limit
        .limit(pageLimit) // Limit number of results per page
        .sort({ [sortBy]: sortOrder }); // Sorting based on `sortBy` and `sortType`

    // Return the paginated and sorted results
    return res.status(200).json({
        totalVideos,
        totalPages: Math.ceil(totalVideos / pageLimit),
        currentPage: pageNumber,
        videos
    });
    // get all videos based on query, sort, pagination
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(
        [title,description].some((field)=>
            field?.trim()==="")
      ){
        throw new ApiError(400,"Title and Description are required")
      }
    const videoLocalPath=req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath=req.files?.thumbnail?.[0]?.path
    if(!videoLocalPath){
        throw new ApiError(400,"Video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }
    const video=await uploadOnCloudinary(videoLocalPath)
    // console.log(video)
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    if(!video){
        throw new ApiError(400,"Video file upload failed")
    }
    if(!thumbnail){
        throw new ApiError(400,"Thumbnail file upload failed")
    }
    const videoDetails=await Video.create({
        videoFiles:video.url,
        thumbnail:thumbnail.url,
        title,
        duration:video.duration,
        description,
        owner:req.user?._id
    })
    //    const uploadedVideo=Video.findById(videoDetails._id)
    //    if(!uploadedVideo){
    //     throw new ApiResponse(200,uploadedVideo,"Video not uploaded successfully")
    //    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,videoDetails,"Video uploaded successfully")
    )
    // get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"video id is missing")
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video is not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video found")
    )
    // get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"video id is missing")
    }
    const videoLocalFilePath=req.files?.videoFile?.[0]?.path
    const thumbnailLocalFilePath=req.files?.thumbnail?.[0].path
    if(!thumbnailLocalFilePath){
        throw new ApiError(400,"Thumbnail not found")
    }
    if(!videoLocalFilePath){
        throw new ApiError(400,"Video not found")
    }
    const uploadedVideo=await uploadOnCloudinary(videoLocalFilePath)
    const uploadedThumbnail=await uploadOnCloudinary(thumbnailLocalFilePath)

    if(!uploadedVideo){
        throw new ApiError(400,"Error while uploading video")
    }
    if(!uploadedThumbnail){
        throw new ApiError(400,"Error while uploading thumbnail")
    }
    const video=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                videoFiles:uploadedVideo.url,
                duration:uploadedVideo.duration,
                thumbnail:uploadedThumbnail.url
            }
        },{new:true}
    )
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video updated successfully")
    )
    // update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"Invalid videoId")
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"No Video Found")
    }

    const cloudinaryPublicId = video.videoFiles.split('/').pop().split('.')[0];
    console.log(cloudinaryPublicId)
    await deleteFromCloudinary(cloudinaryPublicId)
   
    const deleteVideoFromDb=await Video.findByIdAndDelete(videoId)
    if(!deleteVideoFromDb){
        throw new ApiError(400,"Error occured while deleting file from db")
    }
   
    return res
    .status(200)
    .json(
        new ApiResponse(200,deleteVideoFromDb,"Video Successfully deleted")
    )
    // delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"video id id not valid")
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"video not found")
    }
    const videoStatusUpdate = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished: !video.isPublished
        }
      }, { new: true });
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,videoStatusUpdate,"Pusblish Status Changed")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}