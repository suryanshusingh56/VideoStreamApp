import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} =req.body
    if(!content){
        throw new ApiError(400,"Tweet:Message not received")
    }
    const tweeted=await Tweet.create({
        content,
        owner:req.user?._id
    })
    if(!tweeted){
        throw new ApiError(400,"Tweet:Something went wrong")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,tweeted,"Tweet successful")
    )
    // create tweet
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId=req.params.userId||req.user?._id
    if(!userId){
        throw new ApiError(400,"userid is required")
    }
    
    const getTweet=await Tweet.find({
        owner:userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,getTweet,"Tweets fetched successfully")
    )
    // get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId}=req.params
    if(!tweetId){
        throw new ApiError(400,"Invalid tweetId")
    }
    const {content} =req.body
    if(!content){
        throw new ApiError(400,"No content to update")
    }
    const tweet=await Tweet.findByIdAndUpdate(tweetId,{
        $set:{
            content
        }
    },{new:true})
    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet updated Successfully")
    )
    // update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId}=req.params
    if(!tweetId){
        throw new ApiError(400,"Invalid tweetId")
    }
    const deletedTweet=await Tweet.deleteOne({tweetId})
    return res.status(200)
    .json(
        new ApiResponse(200,deleteTweet,"Tweet deleted")
    )
    // delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

