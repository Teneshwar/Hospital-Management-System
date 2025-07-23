import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer'; 
import validator from "validator";

// import { config } from "dotenv";
// config({ path: "./config/config.env" });

const auth = {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS, 
}
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: auth,
});

// //const sendSms = async (phoneNumber, message) => {
//   console.log(`Sending SMS to ${phoneNumber}: ${message}`);
//   // Implement actual SMS sending logic here using a service like Twilio, Msg91, etc.
//   // Example with Twilio (requires twilio npm package and account setup):
//   /*
//   const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
//   try {
//     await client.messages.create({
//       body: message,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: phoneNumber
//     });
//     console.log('SMS sent successfully!');
//     return true;
//   } catch (error) {
//     console.error('Error sending SMS:', error);
//     return false;
//   }
//   */
//   return true; // Assume success for demonstration
// };

export const sendEmailOtp = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  if (!email || !validator.isEmail(email)) {
    return next(new ErrorHandler("Please provide a valid email!", 400));
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
        email,
        role: "Patient",
        isEmailVerified: false,
        isPhoneVerified: false,
        firstName: "Temp",
        lastName: "User",
        phone: "0000000000", 
        nic: "0000000000000", 
        dob: new Date(), 
        gender: "Male", 
        password: "TempPassword123", 
     });
  }
  const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.emailOtp = otp;
  user.emailOtpExpires = otpExpires;
  await user.save({ validateBeforeSave: false }); 

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Hospital Management System',
    text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);

  res.status(200).json({
    success: true,
    message: "Email OTP sent successfully!",
  });
});

export const verifyEmailOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new ErrorHandler("Please provide email and OTP!", 400));
  }

  const user = await User.findOne({ email }).select("+emailOtp +emailOtpExpires");
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  if (user.emailOtp !== otp) {
    return next(new ErrorHandler("Invalid Email OTP!", 400));
  }

  if (user.emailOtpExpires < Date.now()) {
    return next(new ErrorHandler("Email OTP expired!", 400));
  }

  user.isEmailVerified = true;
  user.emailOtp = null;
  user.emailOtpExpires = null;
  await user.save({ validateBeforeSave: false }); 

  res.status(200).json({
    success: true,
    message: "Email verified successfully!",
  });
});

// export const sendPhoneOtp = catchAsyncErrors(async (req, res, next) => {
//   const { phone, email } = req.body; 
//   if (!phone) {
//     return next(new ErrorHandler("Please provide a valid phone number!", 400));
//   }

//   let user = await User.findOne({ email }); 
//   if (!user) {
//     return next(new ErrorHandler("User not found with provided email!", 404));
//   }

//   const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
//   const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

//   user.phoneOtp = otp;
//   user.phoneOtpExpires = otpExpires;
//   await user.save({ validateBeforeSave: false });

//   await sendSms(phone, `Your OTP for Hospital Management System is: ${otp}. It is valid for 5 minutes.`);

//   res.status(200).json({
//     success: true,
//     message: "Phone OTP sent successfully!",
//   });
// });

// export const verifyPhoneOtp = catchAsyncErrors(async (req, res, next) => {
//   const { phone, otp, email } = req.body;
//   if (!phone || !otp || !email) {
//     return next(new ErrorHandler("Please provide phone number, email and OTP!", 400));
//   }

//   const user = await User.findOne({ email }).select("+phoneOtp +phoneOtpExpires");
//   if (!user) {
//     return next(new ErrorHandler("User not found!", 404));
//   }

//   if (user.phoneOtp !== otp) {
//     return next(new ErrorHandler("Invalid Phone OTP!", 400));
//   }

//   if (user.phoneOtpExpires < Date.now()) {
//     return next(new ErrorHandler("Phone OTP expired!", 400));
//   }

//   user.isPhoneVerified = true;
//   user.phoneOtp = null;
//   user.phoneOtpExpires = null;
//   await user.save({ validateBeforeSave: false });

//   res.status(200).json({
//     success: true,
//     message: "Phone number verified successfully!",
//   });
// });


export const patientRegister = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, nic, dob, gender, password } = req.body;

  let user = await User.findOne({ email: email });

  if (!user) {
    return next(new ErrorHandler("User not found or email/phone not verified. Please verify both first!", 400));
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.nic = nic;
  user.dob = dob;
  user.gender = gender;
  user.password = password; 
  user.role = "Patient";
  user.phone = phone
  await user.save(); 

  res.status(200).json({"sucess": "you are registered"})
});


export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, confirmPassword, role } = req.body;
  if (!email || !password || !confirmPassword || !role) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  if (password !== confirmPassword) {
    return next(
      new ErrorHandler("Password & Confirm Password Do Not Match!", 400)
    );
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }

  if (!user.isEmailVerified) {
    return next(new ErrorHandler("Please verify both your email and phone number first!", 403));
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }
  if (role !== user.role) {
    return next(new ErrorHandler(`User Not Found With This Role!`, 400));
  }
  generateToken(user, "Login Successfully!", 201, res);
});

export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, nic, dob, gender, password } =
    req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !password
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler("Admin With This Email Already Exists!", 400));
  }

  const admin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Admin",
      isEmailVerified: true,
    isPhoneVerified: true, // New: Admins are considered verified upon creation
  });
  res.status(200).json({
    success: true,
    message: "New Admin Registered",
    admin,
  });
});

export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Doctor Avatar Required!", 400));
  }
  const { docAvatar } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype)) {
    return next(new ErrorHandler("File Format Not Supported!", 400));
  }
  const {
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    doctorDepartment,
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !password ||
    !doctorDepartment ||
    !docAvatar
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(
      new ErrorHandler("Doctor With This Email Already Exists!", 400)
    );
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(
    docAvatar.tempFilePath
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponse.error || "Unknown Cloudinary error"
    );
    return next(
      new ErrorHandler("Failed To Upload Doctor Avatar To Cloudinary", 500)
    );
  }
  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Doctor",
    doctorDepartment,
    docAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  res.status(200).json({
    success: true,
    message: "New Doctor Registered",
    doctor,
  });
});

export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctors = await User.find({ role: "Doctor" });
  res.status(200).json({
    success: true,
    doctors,
  });
});

export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

// Logout function for dashboard admin
export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("adminToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Admin Logged Out Successfully.",
    });
});

// Logout function for frontend patient
export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("patientToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Patient Logged Out Successfully.",
    });
});