import express from 'express'
import { getUserData, purchaseCourse, userEnrolledCourses } from '../controllers/userController.js'


const userRouter = express.Router()


// Route to get user data
userRouter.get('/data', getUserData)


// Route to get user's enrolled courses
userRouter.get('/enrolled-courses', userEnrolledCourses)

// Route to get user's Purchase
userRouter.post('/purchase', purchaseCourse)

export default userRouter; 



