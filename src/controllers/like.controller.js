import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"video id invalid")
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video not found")
    }

    const isLiked=await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })
    
    if(isLiked){
       await Like.deleteOne({
            video:videoId,
            likedBy:req.user?._id
       })
       return res
       .status(200)
       .json(
            new  ApiResponse(200,isLiked,"Video is Unliked")
       )
    }
   const liked= await Like.create({
        video:videoId,
        likedBy:req.user?._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200,liked,"Video is liked")
    )
    // toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => { //Not Tested
    const {commentId} = req.params
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid comment id")
    }
    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400,"Comment not found")
    }
    const likedComment=await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })
    if(likedComment){
       await Like.deleteOne({
            comment:commentId,
            likedBy:req.user?._id
        })
        return res
        .status(200)
        .json(
            new ApiResponse(200,likedComment,"comment unliked")
        )
    }
    const liked=await Like.create({
        comment:commentId,
        likedBy:req.user?._id
    })
    return res
    .status
    .json(
        new ApiResponse(200,liked,"comment liked")
    )
    // toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {  //Not Tested
    const {tweetId} = req.params
    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400,"tweet id invalid")
    }
    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400,"Tweet not found")
    }

    const isLiked=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })
    
    if(isLiked){
       await Like.deleteOne({
            tweet:tweetId,
            likedBy:req.user?._id
       })
       return res
       .status(200)
       .json(
            new  ApiResponse(200,isLiked,"Tweet is Unliked")
       )
    }
    const liked= await Like.create({
        tweet:tweetId,
        likedBy:req.user?._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200,liked,"Tweet is liked")
    )
    // toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
   
    // const likedVideos=await Like.aggregate([
    //     {
    //         $match:{
    //             likedBy:req.user?._id,
    //             video:{$ne:null}
    //         }
    //     },
    //     {
    //         $lookup:{
    //             from:"videos",
    //             localField:"video",
    //             foreignField:"_id",
    //             as:"likedVideos",
    //             pipeline:[
    //                 {
    //                     $lookup:{
    //                         from:"users",
    //                         localField:"owner",
    //                         foreignField:"_id",
    //                         as:"videoOwner",
    //                         pipeline:[
    //                             {
    //                                 $project:{
    //                                    username:1,
    //                                    avatar:1
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $lookup:{
    //                         from:"likes",
    //                         localField:"_id",
    //                         foreignField:"video",
    //                         as:"videoLikes"
    //                     }
    //                 },
    //                 {
    //                     $addFields:{
    //                         likesCount:{
    //                              $size:"$videoLikes"
    //                         }
    //                     }
    //                 }
    //             ]
    //         }
    //     },
        
    // ])
    const likedVideos = await Like.aggregate([
        {
          $match: {
            likedBy: req.user?._id,
            video: { $ne: null },
          },
        },
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "videoDetails",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "videoOwner",
                  pipeline: [
                    {
                      $project: {
                        username: 1,
                        avatar: 1,
                      },
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: "likes",
                  localField: "_id",
                  foreignField: "video",
                  as: "videoLikes",
                },
              },
              {
                $addFields: {
                  likesCount: { $size: "$videoLikes" },
                },
              },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  description: 1,
                  videoFiles: 1,
                  thumbnail: 1,
                  duration: 1,
                  likesCount: 1,
                  "videoOwner.username": { $arrayElemAt: ["$videoOwner.username", 0] },
                  "videoOwner.avatar": { $arrayElemAt: ["$videoOwner.avatar", 0] },
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 0,
            video: { $arrayElemAt: ["$videoDetails", 0] },
          },
        },
      ]);
      
    console.log(likedVideos)
    if(!likedVideos){
        throw new ApiError(400,"Failed to get liked videos")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,likedVideos,"Liked video fetched successfully")
    )
    // get all liked videos

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}