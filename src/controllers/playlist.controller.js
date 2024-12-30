import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if([name,description].some((field)=>{
        field?.trim()===""
    })){
        throw new ApiError(400,"All fields are required")
    }
    const createdPlaylist=await Playlist.create({
        name,
        description,
        owner:req.user?._id
    })
    if(!createdPlaylist){
        throw new ApiError(400,"Error occured while creating playlist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,createdPlaylist,"Playlist created")
    )
    // create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!userId){
        throw new ApiError(400,"Invalid user id")
    }
    const playlist= await Playlist.aggregate([
        {
            $match:{
             owner:req.user?._id   
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"playlistVideos",
              pipeline:[
                {
                    $match:{
                        isPublished:true
                    }
                },
                {
                    $addFields:{
                        views:"$playlistVideos.views"
                    }
                }
              ]
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$playlistVideos"
                },
                isOwner:{
                    $cond:{
                        if:{
                            $eq:[req.user?._id,"$owner"]
                        },
                        then:true,
                        else:false
                    }
                   
                }
                
            }
        },
        {
            $project: {
              name: 1,
              description: 1,
              totalVideos: 1,
              createdAt: 1,
              updatedAt: 1,
              isOwner: 1,
              playlistVideos: {
                _id: 1,
                name: 1,
                description: 1,
                views: 1,
                videoFile: 1,
                thumbnail: 1,
                durations: 1,
              },
            },
        }
        
    ])
    if(!playlist.length){
        throw new ApiError(400,"Error while fetching playlist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist fetched successfully")
    )
    // get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Invalid Playlist Id")
    }
    const playlist=await Playlist.find({playlistId})
    if(!playlist){
        throw new ApiError(400,"No Playlist found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist found")
    )
    // get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if([playlistId,videoId].some((fields)=>{
        fields?.trim()===""
    })){
        throw new ApiError(400,"playlistId and videoId is required")
    }
    const playlist=await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
            videos:videoId
        }
    },{new:true})
    if(!playlist){
        throw new ApiError(200,"Video addition failed")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if ([playlistId, videoId].some((field) => !field?.trim())) {
        throw new ApiError(400, "playlistId and videoId are required");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "No playlist found");
    }

    const initialLength = playlist.videos.length;
    playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);

    if (playlist.videos.length === initialLength) {
        throw new ApiError(404, "Video not found in playlist");
    }

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video deleted from playlist")
    )
    //remove playlist from video
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id")
    }
    const playlist =await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"No playlist found");
    }
    const deletedPlaylist=await Playlist.findByIdAndDelete(playlistId)
    if(!deletedPlaylist){
        throw new ApiError(400,"Error occured while deleting playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedPlaylist,"Playlist deleted successfully")
    )
    // delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }
    if([name,description].some((field)=>{
        field?.trim()===""
    })){
        throw new ApiError(400,"name and description required")
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
            name,
            description
        }
    },{new:true})
    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedPlaylist,"Playlist is updated")
    )
    // update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}