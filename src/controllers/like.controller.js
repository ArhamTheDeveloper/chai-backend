import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  let like = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!like) {
    const createdLike = await Like.create({
      video: video._id,
      likedBy: req.user._id,
    });
    await createdLike.populate([
      { path: "likedBy", select: "username avatar" },
      { path: "video", select: "title" },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, createdLike, "Video liked successfully"));
  }

  await like.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video unliked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
