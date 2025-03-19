import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Steps for solving problem of registeringUser.
  // get user details from frontend ✔️
  // validation - fields should not be empty ✔️
  // check if user already exists: username, email ✔️
  // check for images, check for avatar ✔️
  // upload them to cloudinary, check for avatar ✔️
  //   WE ARE CHECKING FOR AVATAR IN BOTH ABOVE LINES COZ ITS A REQUIRED FIELD UNLIKE COVER IMAGE
  // create user object - create entry in db ✔️
  // remove password and refresh token field from response ✔️
  // check for user creation ✔️
  // return res ✔️
  // Aur ab jab ham ne saare steps likh liye hain then we can say that ab aap ke pass algorithm aagayi / design hogayi hai is logic ki / ke liye. To agar aapko steps follow karne aate hain to wo steps he algorithm hai.

  //   getting user details from frontend
  const { username, email, fullName, password } = req.body; // req.body by default express deta hai
  //   console.log(`email: ${email} password: ${password}`);

  //   validation
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  } // email ki validation bhi likh sakte ho aksar production grade apps main validation ki alag se hi files hoti hain jahan se bas methods call akr lete hain

  //   checking if user already exists
  const existingUser = await User.findOne({
    // operators in mongoose
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //   Handling/checking images/files
  const avatarLocalPath = req.files?.avatar[0]?.path; //req.files ka access hamain multer deta hai
  // console.log(req.files?.avatar) ye main ne apni understanding ke liye kiya tha
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //   Uploading to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required"); // error message koi doosra shayad likhun main iske liye
  }

  //   Creating a new user object/new entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    username: username.toLowerCase(),
    coverImage: coverImage?.url || "",
    email,
    password,
  });

  //   checked for user creation and removing password and refresh token fields from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //   Finally returning response to frontend
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  /* Steps To Solve this Problem
      Get user data from frontend.
      find user via checking the user's username or email
      check user's password
      Once validated generate access token and refresh token.
      send tokens as cookies to the user
      in the end send response that user is logged in successfully
      Once its done the user now should be authenticated and authorized to do certain things.
  */

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // cookies bhejne ke liye kuch options likhne hote hain which is an object
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export { registerUser, loginUser, logoutUser };
