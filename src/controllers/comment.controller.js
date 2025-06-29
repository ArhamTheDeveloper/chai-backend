import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video does not exist");
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new ApiError(
      400,
      "Comment content is required and must be a valid string"
    );
  }

  const comment = await Comment.create({
    content,
    video: video._id,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to create comment");
  }

  const populatedComment = await Comment.find(comment._id)
    .populate("owner", "username")
    .populate("video", "title")
    .lean();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedComment,
        "Comment added to the video successfully"
      )
    );
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
