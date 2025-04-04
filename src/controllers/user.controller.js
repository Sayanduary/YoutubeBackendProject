import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";

import { User } from '../models/user.model.js'

import { uploadOnCloudinary } from "../utils/cloudinary.service.js";

import { ApiResponse } from "../utils/ApiResponse.js";



const generateAccessAndRefreshTokens = async (userId) => {
  try {

    const user = await User.findById(userId);
    const accessToken = user.generateRefreshToken()
    const refreshToken = user.generateAccessToken()

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, 'Something Went Wrong While Generating Refresh and Access Token')
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;
  console.log('fullname :', fullname);

  if ([fullname, email, password, username].some(field => field?.trim() === '')) {
    throw new ApiError(400, 'All fields are required');
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });
  if (existingUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }

  console.log("Uploaded files:", req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while creating user');
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully")
  );
});


const loginUser = asyncHandler(async (req, res) => {

  // take data from request body

  // username or email  

  // find the user 

  // check password

  // generate access and refresh token 

  //  send the tokens to cookies

  // responds

  const { username, email, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, 'username or password is rerquired')
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, 'User does not exist')
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials')
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  //  send to the cookies

  const loggedInUser = await User.findOne(user._id).select("--password --refreshToken")

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .cookie('AccessToken :', accessToken, options)
    .cookie('RefreshToken :', refreshToken, options)
    .json(
      new ApiResponse
        (200,
          {
            user: loggedInUser, accessToken, refreshToken,
          }, 'User Logged In Succesfully'

        )
    )


})


const logoutUser = asyncHandler(async (req,res)=>{
  
})





export { registerUser, loginUser };