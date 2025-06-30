import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;

  const isInvalidString = (value) =>
    !value || typeof value !== "string" || value.trim() === "";

  if (isInvalidString(name) || isInvalidString(description)) {
    throw new ApiError(
      400,
      "Both 'name' and 'description' are required, must be non-empty strings"
    );
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  await playlist.populate("owner", "username avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const userPlaylists = await Playlist.find({ owner: user._id });

  if (userPlaylists.length < 1) {
    throw new ApiError(404, "This user does not have any playlists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const { playlistId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No playlist with the given id exists");
  }

  await playlist.populate("owner", "username");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (
    !mongoose.isValidObjectId(playlistId) ||
    !mongoose.isValidObjectId(videoId)
  ) {
    throw new ApiError(400, "Invalid video or playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No playlist with the given id exists");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video with the given id exists");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(400, "You can only add videos to your own playlists");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already in the playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save({ validateBeforeSave: false });

  await playlist.populate([
    {
      path: "owner",
      select: "username",
    },
    {
      path: "videos",
      select: "title",
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;

  if (
    !mongoose.isValidObjectId(playlistId) ||
    !mongoose.isValidObjectId(videoId)
  ) {
    throw new ApiError(400, "Invalid video or playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No playlist with the given id exists");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video with the given id exists");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(
      400,
      "You can only remove videos from your own playlists"
    );
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already not in the playlist");
  }

  playlist.videos.remove(videoId);
  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { title: video.title },
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No playlist with the given id exists");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(400, "You can only delete your own playlists");
  }
  await playlist.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No playlist with the given id exists");
  }

  const isInvalidString = (value) =>
    typeof value !== "string" || value.trim() === "";

  if (isInvalidString(name) && isInvalidString(description)) {
    throw new ApiError(
      400,
      "Name or Description is required and should be a non-empty string"
    );
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You can only update your own playlists");
  }

  playlist.name = name.trim() ?? playlist.name;
  playlist.description = description.trim() ?? playlist.description;
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
