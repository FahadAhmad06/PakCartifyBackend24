import handleAsyncError from "../midleware/handleasyncerror.js";
import User from "../model/userModel.js";
import PendingRegistration from "../model/pendingRegistrationModel.js";
import HandleError from "../utils/handlerror.js";
import { sendToken } from "../utils/jwtTokens.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { passwordResetTemplate } from "../utils/passwordResetTemplate.js";
import {
  welcomeEmailTemplate,
  otpEmailTemplate,
} from "../utils/emaiTemplate.js";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

export const registerUser = handleAsyncError(async (req, res, next) => {
  const { name, email, phone, password, avatar } = req.body;

  if (!name || !email || !phone || !password) {
    return next(new HandleError("Please fill all required fields", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(
      new HandleError("Email already registered. Please login.", 400),
    );
  }

  const otp = generateOtp();

  await PendingRegistration.findOneAndUpdate(
    { email },
    {
      name,
      email,
      phone,
      password,
      avatar: avatar || "",
      otp: hashOtp(otp),
      otpExpire: Date.now() + 60 * 1000,
      otpSentAt: Date.now(),
    },
    { upsert: true, new: true, runValidators: true },
  );

  try {
    const html = otpEmailTemplate(name, otp);
    await sendEmail({
      email,
      subject: "Verify Your Email – PakCartify Registration OTP",
      html,
    });
  } catch (error) {
    return next(
      new HandleError("Failed to send OTP email. Please try again.", 500),
    );
  }

  res.status(200).json({
    success: true,
    message: `OTP sent to ${email}. Valid for 1 minute.`,
    email,
  });
});

export const verifyRegistrationOtp = handleAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new HandleError("Email and OTP are required", 400));
  }

  const pending = await PendingRegistration.findOne({ email });
  if (!pending) {
    return next(
      new HandleError("Registration session expired. Please register again.", 400),
    );
  }

  if (Date.now() > pending.otpExpire) {
    return next(new HandleError("OTP has expired. Please click Resend OTP.", 400));
  }

  if (hashOtp(otp.toString()) !== pending.otp) {
    return next(new HandleError("Invalid OTP. Please try again.", 400));
  }

  let avatarData;

  if (pending.avatar) {
    const myCloud = await cloudinary.uploader.upload(pending.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
    avatarData = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  } else {
    avatarData = {
      public_id: "avatars/default_profile",
      url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    };
  }

  const user = await User.create({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    password: pending.password,
    avatar: avatarData,
  });

  await PendingRegistration.deleteOne({ email: pending.email });

  try {
    const html = welcomeEmailTemplate(user.name, user.email, user.createdAt);
    await sendEmail({
      email: user.email,
      subject: "Welcome to PakCartify – Your Account Has Been Created!",
      html,
    });
  } catch (error) {
    console.error("Welcome email failed to send:", error.message);
  }

  sendToken(user, 201, res);
});

export const resendRegistrationOtp = handleAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new HandleError("Email is required", 400));
  }

  const pending = await PendingRegistration.findOne({ email });
  if (!pending) {
    return next(
      new HandleError("Registration session expired. Please register again.", 400),
    );
  }

  const timeSinceLastOtp = Date.now() - pending.otpSentAt.getTime();
  if (timeSinceLastOtp < 60 * 1000) {
    const secondsLeft = Math.ceil((60 * 1000 - timeSinceLastOtp) / 1000);
    return next(
      new HandleError(`Please wait ${secondsLeft} seconds before resending OTP`, 400),
    );
  }

  const otp = generateOtp();
  pending.otp = hashOtp(otp);
  pending.otpExpire = Date.now() + 60 * 1000;
  pending.otpSentAt = Date.now();
  await pending.save();

  try {
    const html = otpEmailTemplate(pending.name, otp);
    await sendEmail({
      email: pending.email,
      subject: "Verify Your Email – PakCartify Registration OTP",
      html,
    });
  } catch (error) {
    return next(
      new HandleError("Failed to resend OTP email. Please try again.", 500),
    );
  }

  res.status(200).json({
    success: true,
    message: `New OTP sent to ${email}. Valid for 1 minute.`,
    email,
  });
});

// ! Login
export const loginUser = handleAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new HandleError("Please Enter Email and Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new HandleError("Invalid Email or Password", 401));
  }

  const isPassworvalid = await user.comparePassword(password);
  if (!isPassworvalid) {
    return next(new HandleError("Invalid Email or Password", 401));
  }

  sendToken(user, 200, res);
});

// ! LogOut User
export const logoutUser = handleAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged Out Successfully",
  });
});

// !  Forgot Password  -- User

export const requestPasswordReset = handleAsyncError(async (req, res, next) => {
  const { email } = req.body;

const user = await User.findOne({ email });

  if (!user) {
    return next(new HandleError("User Not Found with this Email", 400));
  }
  let resetToken;
  try {
    resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    return next(new HandleError("Please Try Again Later", 500));
  }

  const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetPasswordURL = `${frontendURL}/password/reset/${resetToken}`;
  const html = passwordResetTemplate(resetPasswordURL, user.name);

  try {
    // ! Send Email

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      html,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new HandleError(
        "Error occurred while sending reset password email. Please try again later.",
        500,
      ),
    );
  }
});


// ! Reset Password  -- User
export const resetPassword = handleAsyncError(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new HandleError("Invalid or Expired Password Reset Token", 400),
    );
  }

  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(
      new HandleError("Password and Confirm Password doesn't match", 400),
    );
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

//  Get user details

export const getUserDetails = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

// ! Update User Password

export const updatePassword = handleAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  const checkOldPassword = await user.comparePassword(oldPassword);

  if (!checkOldPassword) {
    return next(new HandleError("Old Password is Incorrect", 400));
  }

  if (newPassword !== confirmPassword) {
    return next(
      new HandleError("New Password and Confirm Password doesn't match", 400),
    );
  }

  user.password = newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// ! Update User Profile
export const updateUserDetails = handleAsyncError(async (req, res, next) => {
  const { name, email, phone, avatar } = req.body;
  const updateUserDetails = {
    name,
    email,
    phone,
  };

  if (avatar !== "") {
    const user = await User.findById(req.user.id);
    const imageId = user.avatar.public_id;
    await cloudinary.uploader.destroy(imageId);
    const myCloud = await cloudinary.uploader.upload(avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    updateUserDetails.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updateUserDetails, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
    user,
  });
});

// ! Admin  getting all users Information -- Admin

export const getUsersList = handleAsyncError(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

// ! Admin  getting Single users Information -- Admin

export const getSingleUser = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new HandleError(`User Not Found with ID: ${req.params.id}`, 400),
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// ! Admin  change User Role and Details -- Admin

export const updateUserRole = handleAsyncError(async (req, res, next) => {
  const { role } = req.body;

  const newUserData = {
    role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(
      new HandleError(`User Not Found with ID: ${req.params.id}`, 400),
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});


// ! Delete user Profile -- Admin

export const deleteUser = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new HandleError(`User Not Found with ID: ${req.params.id}`, 400),
    );
  }

  const imageId=user.avatar.public_id
  await cloudinary.uploader.destroy(imageId)

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});

// ! Toggle Add/Remove Favorite -- User

export const toggleFavorite = handleAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.id);

  const index = user.favorites.findIndex(
    (favId) => favId.toString() === productId,
  );

  let favorited;

  if (index > -1) {
    user.favorites.splice(index, 1);
    favorited = false;
  } else {
    user.favorites.push(productId);
    favorited = true;
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.user.id).populate("favorites");

  res.status(200).json({
    success: true,
    favorited,
    favorites: updatedUser.favorites,
  });
});

// ! Remove Favorite (dedicated) -- User

export const removeFavorite = handleAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.id);

  user.favorites = user.favorites.filter(
    (favId) => favId.toString() !== productId,
  );

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.user.id).populate("favorites");

  res.status(200).json({
    success: true,
    message: "Removed from Favorites",
    favorites: updatedUser.favorites,
  });
});

// ! Get Logged-in User's Favorites -- User

export const getMyFavorites = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("favorites");

  res.status(200).json({
    success: true,
    favorites: user.favorites,
  });
});

// ! Remove all fav
export const removeAllFavorites = handleAsyncError(async (req, res) => {
  const user = await User.findById(req.user.id);

  user.favorites = [];

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Wishlist cleared successfully",
    favorites: [],
  });
});
