import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { Line } from 'rc-progress'
import Footer from '../../components/student/Footer'
import toast from 'react-hot-toast'
import { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const MyEnrollments = () => {

const {enrolledCourses , calculateCourseDuration,navigate, userData, fetchUserEnrolledCourses, backendUrl, getToken, calculateNoOfLectures } = useContext(AppContext)

const [progressArray, setProgressArray] = useState([])

const getCourseProgress = async () => {
  try {
    const token = await getToken();
    const tempProgressArray = await Promise.all(enrolledCourses.map(async (course) => {
      // const { data } = await axios.post(`${backendUrl}/api/user/course-progress`, {courseId: course._id}, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   }})
// Ai correction 


      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId: course._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );



        let totalLectures  = calculateNoOfLectures(course);

       //const lectureCompleted = data.progressData ? data.progressData.lectureCompleted.length : 0;
       // ai correction 
       const lectureCompleted = data.progressData ? data.progressData.lecturesCompleted.length : 0;

       
       return {
        totalLectures,
        lectureCompleted,
       }
      })
    )
    setProgressArray(tempProgressArray);
  } catch (error) {
    toast.error(error.message);   
   }
  }

  useEffect(() => {
    if (userData){
      fetchUserEnrolledCourses();
    } 
    }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseProgress();
    }    
  }, [enrolledCourses]);



  return (
    <>
      <div className='md:px-36 px-8 pt-10'>
      <h1 className='text-2xl font-semibold'>My Enrollments </h1>
      <table className='md:table-auto table-fixed w-full overflow-hidden border mt-10'>
        <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden'>
          <tr>
            <th className='px-4 py-3 font-semibold truncated'>Course</th>
            <th className='px-4 py-3 font-semibold truncated'>Duration</th>
            <th className='px-4 py-3 font-semibold truncated'>Completed</th>
            <th className='px-4 py-3 font-semibold truncated'>Status</th>
          </tr>
        </thead>
        <tbody className='text-gray-700'>
          {enrolledCourses.map((course, index)=>(
            <tr key={index} className='border-b border-gray-500/20'>
              <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3'>
                <img src={course.courseThumbnail} alt="" className='w-14 sm:w-24 md:w-28' />
                <div className='flex-1'>
                  <p className='mb-1 max-sm:text-sm'>{course.courseTitle}</p>
                  <Line strokeWidth={2} percent={progressArray[index] ? (progressArray[index].lectureCompleted*100) / progressArray[index].totalLectures : 0} className='bg-gray-300 rounded-full'/>
                </div>
              </td>
              <td className='px-4 py-3 max-sm:hidden'>
                {calculateCourseDuration(course)}
              </td>
              <td className='px-4 py-3 max-sm:hidden'>
                {progressArray[index] && `${progressArray[index].lectureCompleted} / ${progressArray[index].totalLectures}`} <span>Lectures</span>
              </td>
              <td className='px-4 py-3 max-sm:text-right'>
                <button className='px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 max-sm:text-xs text-white' onClick={()=> navigate('/player/' + course._id)}>

                  {progressArray[index] && progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 ? 'completed' : 'On Going'}
    
                </button>

              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Footer/>
    </>
  )
}

export default MyEnrollments

//ai

// import React, { useContext } from 'react';
// import { AppContext } from '../../context/AppContext';

// const MyEnrollments = () => {
//   const { enrolledCourses, calculateCourseDuration } = useContext(AppContext);

//   return (
//     <div className='md:px-36 px-8 pt-10'>
//       <h1 className='text-2xl font-semibold'>My Enrollments</h1>
//       <table className='md:table-auto table-fixed w-full overflow-hidden border mt-10'>
//         <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden'>
//           <tr>
//             <th className='px-4 py-3 font-semibold'>Course</th>
//             <th className='px-4 py-3 font-semibold'>Duration</th>
//             <th className='px-4 py-3 font-semibold'>Completed</th>
//             <th className='px-4 py-3 font-semibold'>Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {enrolledCourses.map((course, index) => (
//             <tr key={index} className='border-b border-gray-200 hover:bg-gray-50'>
//               <td className='px-4 py-4'>
//                 <div className='flex items-center gap-4'>
//                   <img src={course.courseThumbnail} alt={course.courseTitle} className='w-14 sm:w-24 md:w-28 rounded-md object-cover' />
//                   <p className='font-medium text-sm sm:text-base'>{course.courseTitle}</p>
//                 </div>
//               </td>
//               <td className='px-4 py-4'>
//                 {calculateCourseDuration(course)}
//               </td>
//               <td className='px-4 py-4'>
//                 {course.completedLectures} / {course.totalLectures} <span className='text-gray-500'>Lectures</span>
//               </td>
//               <td className='px-4 py-4'>
//                 <span className='inline-block px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full'>
//                   {course.status || 'On Going'}
//                 </span>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default MyEnrollments;
