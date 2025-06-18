import express from 'express'
import { getUserData, userEnrolledCourses } from '../controllers/userController.js'


const userRouter = express.Router()

// Route to get user data
userRouter.get('/data', getUserData)


// Route to get user's enrolled courses
userRouter.get('/enrolled-course', userEnrolledCourses)

export default userRouter;



