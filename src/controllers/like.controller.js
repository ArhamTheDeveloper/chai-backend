import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

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
  //TODO: toggle like on comment
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  let like = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (!like) {
    const createdLike = await Like.create({
      comment: comment._id,
      likedBy: req.user._id,
    });
    await createdLike.populate([
      { path: "likedBy", select: "username avatar" },
      { path: "comment", select: "content" },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, createdLike, "Comment liked successfully"));
  }

  await like.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment unliked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID format");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  let like = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (!like) {
    const createdLike = await Like.create({
      tweet: tweet._id,
      likedBy: req.user._id,
    });
    await createdLike.populate([
      { path: "likedBy", select: "username avatar" },
      { path: "tweet", select: "content" },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, createdLike, "Tweet liked successfully"));
  }

  await like.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet unliked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;

  const likedVideosCount = await Like.countDocuments({
    likedBy: userId,
    video: { $exists: true, $ne: null },
  });

  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $exists: true, $ne: null },
  })
    .populate("video", "title thumbnail")
    .populate("likedBy", "username avatar");

  if (likedVideos.length < 1) {
    throw new ApiError(404, "No liked videos found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedVideos, likedVideosCount },
        "Liked videos fetched successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
