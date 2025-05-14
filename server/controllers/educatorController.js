
import { clerkClient } from '@clerk/express'
import { parse } from 'dotenv'
import Course from '../models/Course.js'
import { v2 as cloudinary } from 'cloudinary'

// update role to educator

export const updateRoleToEducator = async (req, res) =>{
    try {
        const userId = req.auth.userId
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata:{
                role: 'educator',

            }
        })

        res.json({ success: true, message: 'You can publish a course now'})
        
    } catch (error) {
        res.json({ success: false, message: error.message})
    }
}

// Add New Course

export const addCourse = async (req, res)=>{
    try {
        const {courseData} = req.body;
        const imageFile = req.file
        const educatorId = req.auth.userId

        if(!imageFile){
            return res.json({ success: false, message: 'Thumbnail Not Attached'})
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator  = educatorId

       const newCourse =  await Course.create(parsedCourseData)
       const imageUpload = await cloudinary.uploader.upload(imageFile.path)
       newCourse.courseThumbnail = imageUpload.secure_url
       await  newCourse.save()

       res.json({ success: true , message: 'Course Added'})

    } catch (error) {
        res,json({success: false, message: error.message})

    }
}

// import fs from 'fs/promises';

// export const addCourse = async (req, res) => {
//     try {
//         const { courseData } = req.body;
//         const imageFile = req.file;
//         const educatorId = req.auth.userId;

//         if (!imageFile) {
//             return res.json({ success: false, message: 'Thumbnail Not Attached' });
//         }

//         if (typeof courseData !== 'string') {
//             return res.json({ success: false, message: 'Invalid course data format' });
//         }

//         const parsedCourseData = JSON.parse(courseData);
//         parsedCourseData.educator = educatorId;

//         const newCourse = await Course.create(parsedCourseData);
//         const imageUpload = await cloudinary.uploader.upload(imageFile.path);
//         newCourse.courseThumbnail = imageUpload.secure_url;
//         await newCourse.save();

//         // Clean up temporary file
//         await fs.unlink(imageFile.path);

//         res.json({ success: true, message: 'Course Added' });
//     } catch (error) {
//         console.error('Error adding course:', error);
//         res.json({ success: false, message: error.message });
//     }
// };