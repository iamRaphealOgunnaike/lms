import express from 'express'
import { getAllCourse, getAllCourseId } from '../controllers/courseController.js'

const courseRouter = express.Router()

courseRouter.get('/all', getAllCourse)
courseRouter.get('/:id', getAllCourseId)


export default courseRouter;
