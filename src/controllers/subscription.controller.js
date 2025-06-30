import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID format");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel does not exist");
  }

  const subscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channel._id,
  });

  if (!subscription) {
    if (channelId == req.user._id) {
      throw new ApiError(400, "You can not subscribe to your own channel");
    }
    const subscription = await Subscription.create({
      subscriber: req.user._id,
      channel: channel._id,
    });

    await subscription.populate([
      { path: "subscriber", select: "username avatar fullName" },
      { path: "channel", select: "username avatar fullName" },
    ]);

    return res
      .status(201)
      .json(
        new ApiResponse(201, subscription, "Subscription added successfully")
      );
  }

  await subscription.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Subscription removed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID format");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel does not exist");
  }

  const subscribersCount = await Subscription.countDocuments({
    channel: channelId,
  });

  const subscribers = await Subscription.find({ channel: channelId }).populate([
    { path: "channel", select: "username" },
    { path: "subscriber", select: "username avatar" },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribers, subscribersCount },
        "User channel subscribers fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
