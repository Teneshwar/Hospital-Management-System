import express from "express";
import {
  addNewAdmin,
  addNewDoctor,
  getAllDoctors,
  getUserDetails,
  login,
  logoutAdmin,
  logoutPatient,
  patientRegister,
  sendEmailOtp,    // Added
  verifyEmailOtp,  // Added
  // sendPhoneOtp,    // Added
  // verifyPhoneOtp,  // Added
} from "../controller/userController.js";
import {
  isAdminAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

router.post("/patient/register", patientRegister);
router.post("/login", login);
router.post("/admin/addnew", isAdminAuthenticated, addNewAdmin);
router.post("/doctor/addnew", isAdminAuthenticated, addNewDoctor);
router.get("/doctors", getAllDoctors);
router.get("/patient/me", isPatientAuthenticated, getUserDetails);
router.get("/admin/me", isAdminAuthenticated, getUserDetails);
router.get("/patient/logout", isPatientAuthenticated, logoutPatient);
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);
router.post("/send-email-otp",sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);
// router.post("/send-phone-otp", sendPhoneOtp);
// router.post("/verify-phone-otp", verifyPhoneOtp);
export default router;
