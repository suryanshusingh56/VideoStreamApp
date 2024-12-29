import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    const healthCheckResponse={
       "message":"ok",
       "status":200

    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,healthCheckResponse,"Health CheckUp Response")
    )
    // build a healthcheck response that simply returns the OK status as json with a message
})

export {
    healthcheck
    }
    