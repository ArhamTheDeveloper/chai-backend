import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { formatDuration } from "../utils/formatDuration.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  const {
    page = 1,
    limit = 5,
    query,
    sortBy = "createdAt",
    sortType = "asc",
    userId,
  } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  if (
    isNaN(pageNumber) ||
    isNaN(limitNumber) ||
    pageNumber < 1 ||
    limitNumber < 1
  ) {
    throw new ApiError(400, "Page and limit must be positive integers.");
  }

  // Validate sortBy field to avoid unwanted fields being used
  const allowedSortFields = ["createdAt", "views"]; // Add more as needed
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  // Set sort order: 1 for ascending, -1 for descending
  const sortOrder = sortType === "asc" ? 1 : -1;

  // Build the base pipeline
  const pipeline = [
    {
      $match: {
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ];

  // getting all videos of a user based on userId query and other queries if there are any like sortBy, sortType, search query
  if (userId) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Please provide a valid userId");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, "No such user exists");
    }

    pipeline.push({
      $match: {
        "owner._id": new mongoose.Types.ObjectId(userId),
      },
    });

    if (sortBy && sortType) {
      pipeline.push({
        $sort: {
          [sortField]: sortOrder,
        },
      });
    }

    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      });
    }

    // Pagination
    const skip = (pageNumber - 1) * limitNumber;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNumber });

    const videos = await Video.aggregate(pipeline);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          videos,
          "All videos of the user fetched successfully"
        )
      );
  } else if (query) {
    // getting all videos according to the search query and other queries if there are any like sortBy, sortType
    let videos = await Video.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        {
          description: { $regex: query, $options: "i" },
        },
      ],
    });

    if (!videos || videos.length === 0) {
      throw new ApiError(404, "No videos available according to the query");
    }

    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });

    if (sortBy && sortType) {
      pipeline.push({
        $sort: {
          [sortField]: sortOrder,
        },
      });
    }

    // Pagination
    const skip = (pageNumber - 1) * limitNumber;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNumber });

    videos = await Video.aggregate(pipeline);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          videos,
          "Videos fetched according to the search query successfully"
        )
      );
  } else {
    // getting all videos and conditionally giving results based on query like sortBy, sortType

    // Conditionally push $sort stage
    if (sortBy && sortType) {
      pipeline.push({
        $sort: {
          [sortField]: sortOrder,
        },
      });
    }

    // Pagination
    const skip = (pageNumber - 1) * limitNumber;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNumber });

    const videos = await Video.aggregate(pipeline);

    res
      .status(200)
      .json(new ApiResponse(200, videos, "All videos fetched successfully"));
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  let videoFileLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoFileLocalPath = req.files.videoFile[0].path;
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  let thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: formatDuration(videoFile.duration),
    owner: req.user._id,
  });

  // populate directly on the created document
  const populatedVideo = await Video.findById(video._id).populate({
    path: "owner",
    select: "username fullName email avatar",
  });

  if (!populatedVideo) {
    throw new ApiError(500, "Something went wrong while publishing the video");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, populatedVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  const { videoId } = req.params;

  // ✅ Check for valid ObjectId
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body;

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is missing");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  await Video.deleteOne({ _id: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);

  if (video.isPublished === false) {
    video.isPublished = true;
    video.save({ validateBeforeSave: false });
  } else {
    video.isPublished = false;
    video.save({ validateBeforeSave: false });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status toggled Successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
