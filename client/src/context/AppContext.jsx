// import { createContext, useEffect, useState } from "react";
// import { dummyCourses } from "../assets/assets";
// import { useNavigate } from "react-router-dom";

// export const AppContext = createContext()

// export const AppContextProvider = (props) => {

//     const currency = import.meta.env.VITE_CURRENCY

//     const navigate = useNavigate()

//     const [allCourses, setAllCourses] = useState([])

//     // Fetch All Courses

//     const fetchAllCourses = async () => {
//         setAllCourses(dummyCourses)
//     }

//     // Function to calculate average rating of course
//     const calculateRating = (course) => {
//         if(course.courseRatings.length === 0){
//             return 0;
//         }
//         let totalRating = 0
//         course.courseRatings.forEach(rating => {
//             totalRating += rating.rating
//         })
//         return  totalRating/ course.courseRatings.length
//     }

//     to(()=>{
//         fetchAllCourses()
//     })

//     const value = {

//         currency, allCourses, navigate, calculateRating

//     }

//     return (
//         <AppContext.Provider value={value}>
//             {props.children}

//         </AppContext.Provider>
//     )

// }

import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import {useAuth, useUser} from '@clerk/clerk-react'

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const {getToken} = useAuth()
  const {user} = useUser()

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Fetch All Courses
  const fetchAllCourses = async () => {
    setAllCourses(dummyCourses);
  };

  // Function to calculate average rating of course
  const calculateRating = (course) => {
    if (course.courseRatings.length === 0) {
      return 0;
    }
    const totalRating = course.courseRatings.reduce((total, rating) => total + rating.rating, 0);
    return totalRating / course.courseRatings.length;
  }; 

  //functionn to calculate course chapter Time

  const calculateChapterTime = (chapter)=>{
    let time = 0
    chapter.chapterContent.map((lecture) => time += lecture.lectureDuration)
    return humanizeDuration( 60 * time * 1000, {units: ['h','m']})
  }

  // function to calculate course duration 
  const calculateCourseDuration = (course) =>{
    let time = 0

    course.courseContent.map((chapter)=> chapter.chapterContent.map((lecture) => time += lecture.lectureDuration))
    return humanizeDuration( 60 * time * 1000, {units: ['h','m']})
  }

  //function calculate to No of lectures in the course

  const calculateNoOfLectures = (course) =>{
    let totalLectures = 0;
    course.courseContent.forEach(chapter =>{
      if (Array.isArray(chapter.chapterContent)){
        totalLectures += chapter.chapterContent.length
      }
    });
    return totalLectures;
  }

  //Fetch User Entrolled courses

  const fetchUserEnrolledCourses = async ()=>{
    setEnrolledCourses(dummyCourses)
  }

  // Fetch courses on mount
  useEffect(() => {
    fetchAllCourses();
    fetchUserEnrolledCourses();
  }, []);


    const logToken = async () => {
      console.log(await getToken());
    }

  useEffect(()=>{
    if (user){
        logToken()
    }
  },[user])

  const value = {
    currency,
    allCourses,
    navigate,
    calculateRating,
    isEducator, 
    setIsEducator,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    enrolledCourses,
    fetchUserEnrolledCourses
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};
