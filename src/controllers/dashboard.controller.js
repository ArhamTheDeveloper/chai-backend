import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user._id;

  const [videoViews, videoCount, likesCount, subscriberCount] =
    await Promise.all([
      Video.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
      ]),
      Video.countDocuments({ owner: userId }),
      Like.aggregate([
        { $match: { video: { $ne: null } } },
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "videoData",
          },
        },
        { $unwind: "$videoData" },
        { $match: { "videoData.owner": userId } },
        { $count: "totalLikes" },
      ]),
      Subscription.countDocuments({ channel: userId }),
    ]);

  const totalVideoViews = videoViews[0]?.totalViews || 0;
  const totalVideos = videoCount || 0;
  const totalLikes = likesCount[0]?.totalLikes || 0;
  const totalSubscribers = subscriberCount || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideoViews,
        totalVideos,
        totalLikes,
        totalSubscribers,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const videos = await Video.find({ owner: req.user._id });

  if (videos.length < 1) {
    throw new ApiError(404, "This channel has no videos uploaded");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videos,
        "All videos uploaded by the channel fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
