import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {   
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"channel id is invalid")
    }
    const isSubscribed=await Subscription.findOne({
        subscriber:req.user?._id,
        channel:new mongoose.Types.ObjectId(channelId)
    })
    if (isSubscribed) {
        await Subscription.deleteOne({ _id: isSubscribed._id });
        return res.status(200).json(
            new ApiResponse(200, null, "Unsubscribed successfully")
        );
    } else {
        const newSubscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: new mongoose.Types.ObjectId(channelId),
        });
        return res.status(200).json(
            new ApiResponse(200, newSubscription, "Subscribed successfully")
        );
    }
    // toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new  ApiError(400,"channel id is invalid")
    }
    const subscriberList=await Subscription.aggregate([
        {
            $match: {
              channel: new mongoose.Types.ObjectId(channelId),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "subscriber",
              foreignField: "_id",
              as: "channelSubscribers",
            },
          },
          {
            $group: {
              _id: "$channel", // Group by channel
              subscribers: { $push: "$channelSubscribers" }, // Collect all subscribers for the channel
              totalSubscriberCount: { $sum: 1 }, // Count the total number of subscribers
            },
          },
          {
            $project: {
              channelSubscribers: "$subscribers",
              channelSubscriberCount: "$totalSubscriberCount", // Include the total count in the output
            },
          },
        
    ])
    if(subscriberList.length===0){
        throw new ApiError(400,"No subscriber found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscriberList,"Subscriber List found successfully")
    )
 })

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"subscriber id is invalid")
    }
    const subscribedChannel=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
           $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelDetails"
           }
        },
        {
            $project:{
                channel:1,
                channelDetails:{name:1,email:1,avatar:1}
            }
        }
    ])

    if(subscribedChannel.length===0){
        throw new ApiError(400,"No channels subscribed")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribedChannel,"Channel subscribed is fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}