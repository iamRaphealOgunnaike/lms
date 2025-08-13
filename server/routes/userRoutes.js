// import express from 'express'
// import {addUserRatings, getUserData, purchaseCourse, userEnrolledCourses, updateUserCourseProgress, getUserCourseProgress } from '../controllers/userController.js'

// const userRouter = express.Router()

// // Route to get user data
// userRouter.get('/data', getUserData)

// // Route to get user's enrolled courses
// userRouter.get('/enrolled-courses', userEnrolledCourses)

// // Route to get user's Purchase
// userRouter.post('/purchase', purchaseCourse)

// // update course progress
// userRouter.post('/update-course-progress', updateUserCourseProgress)
// userRouter.post('/get-course-progress', getUserCourseProgress)

// // Add user ratings
// userRouter.post('/add-rating', addUserRatings);

// export default userRouter;

// ai modefication
import express from "express";
import {
  addUserRatings,
  getUserData,
  purchaseCourse,
  userEnrolledCourses,
  updateUserCourseProgress,
  getUserCourseProgress,
  updateUserRole,
} from "../controllers/userController.js";

const userRouter = express.Router();

// Route to get user data
userRouter.get("/data", getUserData);

//userRouter.post('/become-educator', updateUserRole)
userRouter.post("/update-role", updateUserRole);

// Route to get user's enrolled courses
userRouter.get("/enrolled-courses", userEnrolledCourses);

// Route to get user's Purchase
userRouter.post("/purchase", purchaseCourse);

// update course progress
userRouter.post("/update-course-progress", updateUserCourseProgress);
userRouter.post("/get-course-progress", getUserCourseProgress);

// Add user ratings
userRouter.post("/add-rating", addUserRatings);

export default userRouter;
