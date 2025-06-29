import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;

  if (!content || content.trim() === "" || typeof content !== "string") {
    throw new ApiError(
      400,
      "Tweet content is required and must be a valid string"
    );
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  await tweet.populate("owner", "username avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID format");
  }

  const tweet = await Tweet.findOne({ _id: tweetId, owner: req.user._id });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or not owned by you");
  }

  if (!content || content.trim() === "" || typeof content !== "string") {
    throw new ApiError(
      400,
      "Tweet content is required and must be a valid string"
    );
  }

  tweet.content = content;
  await tweet.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID format");
  }

  const tweet = await Tweet.findOne({ _id: tweetId, owner: req.user._id });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or not owned by you");
  }

  await tweet.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
