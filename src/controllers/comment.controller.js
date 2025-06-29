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

  await comment.populate([
    { path: "owner", select: "username" },
    { path: "video", select: "title" },
  ]);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        comment.toObject(),
        "Comment added to the video successfully"
      )
    );
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format");
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new ApiError(
      400,
      "Comment content is required and must be a valid string"
    );
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "No comment found");
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(403, "You can only update your own comments");
  }

  comment.content = content;
  await comment.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format");
  }
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "No comment found");
  }

  // Proper ObjectId comparison
  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(403, "You can only delete your own comments");
  }

  // Now it's safe to delete
  await comment.remove();

  return res
    .status(200)
    .json(
      new ApiResponse(200, comment.toObject(), "Comment deleted successfully")
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
