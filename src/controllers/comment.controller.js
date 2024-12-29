import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pageNum=parseInt(page)
    const limitNo=parseInt(limit)

    const videoComments=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $skip:(pageNum-1)*limitNo
            
        },
        {
            $limit:limitNo
        }
    ])
    if(!videoComments || videoComments.length === 0){
        throw new ApiError(400,"No comments found")      
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,videoComments,"Comments on video fetched successfully")
    )
    // get all comments for a video
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId}=req.params
    if(!videoId){
        throw new ApiError(400,"Invalid videoId")
    }
    const {content}=req.body
    if(!content){
        throw new ApiError(400,"Invalid comment")
    }
    
    const comment=await Comment.create({
        content,
        video:videoId,
        owner:req.user?._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment added Successfully")
    )
    //  add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    if(!commentId){
        throw new ApiError(400,"Invalid commentId")
    }
    const {newComment}=req.body
    if(!newComment){
        throw new ApiError(400,"Comment is required")
    }
    const updatedComment=await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content:newComment
        }
    },{new:true})

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedComment,"Comment updated Successfully")
    )
    // update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    if(!commentId){
        throw new ApiError(400,"comment id is required")
    }
    const deletedComment=await Comment.deleteOne({commentId})
     
    if(!deletedComment){
        throw new ApiError(400,"Comment not deleted")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,deleteComment,"Comment deleted")
    )
    //  delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }