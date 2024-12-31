import mongoose from "mongoose"
import { User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelStats=await User.aggregate([
        {
            $match:{
                _id:req.user?._id
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"uploadedVideos",
                pipeline:[
                    {
                        $project:{
                            videoFiles:1,
                            title:1,
                            thumbnail:1,
                            isPublished:1,
                            views:1
                        }
                    },
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"video",
                            as:"videoLikes"
                        }
                    }
                   
                ]
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$uploadedVideos"
                },
                totalViews:{
                    $sum:"$uploadedVideos.views"
                },
                totalVideoLikes: {
                    $sum: {
                        $map: {
                            input: "$uploadedVideos",
                            as: "video",
                            in: { $size: "$$video.videoLikes" },
                        },
                    },
                },
                totalSubscribers:{
                    $size:"$subscribers"
                }
            }
        },
       
        {
            $project:{
                username:1,
                email:1,
                fullName:1,
                avatar:1,
                uploadedVideos:1,
                totalVideos:1,
                totalViews:1,
                totalVideoLikes:1,
                subscribers:1,
                totalSubscribers:1
            }
        }
    
        
    ])
    if(channelStats.length===0){
        throw new ApiError(400,"Channel Stats not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,channelStats,"Channel Stats found successfully")
    )
    // console.log(channelStats)
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})
// getChannelStats()

const getChannelVideos = asyncHandler(async (req, res) => {
        const getMyUploadedVideos=await User.aggregate([
            {
                $match:{
                    _id:req.user?._id
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"_id",
                    foreignField:"owner",
                    as:"myVideos"
                }
            },
            {
                $project:{
                    myVideos:1
                }
            }
        ])
        
        if(getMyUploadedVideos.length===0){
            throw  new ApiError(404,"No Videos Found")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,getMyUploadedVideos[0].myVideos))
   
    
    // Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }