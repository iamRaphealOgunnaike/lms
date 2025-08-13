// import { createContext, useEffect, useState } from "react";
// import { dummyCourses } from "../assets/assets";
// import { useNavigate } from "react-router-dom";
// import humanizeDuration from "humanize-duration";
// import { useAuth, useUser } from "@clerk/clerk-react";
// import axios from "axios";
// import { toast } from "react-hot-toast";

// export const AppContext = createContext();

// export const AppContextProvider = (props) => {
//   const backendUrl = import.meta.env.VITE_BACKEND_URL;

//   const currency = import.meta.env.VITE_CURRENCY;
//   const navigate = useNavigate();

//   const { getToken } = useAuth();
//   const { user } = useUser();

//   const [allCourses, setAllCourses] = useState([]);
//   const [isEducator, setIsEducator] = useState(false);
//   const [enrolledCourses, setEnrolledCourses] = useState([]);
//   const [userData, setUserData] = useState(null);

//   // Fetch All Courses
//   const fetchAllCourses = async () => {
//     try {
//       const { data } = await axios.get(backendUrl + "/api/course/all");

//       if (data.success) {
//         setAllCourses(data.courses);
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   // Fetch UserData

//   const fetchUserData = async () => {
//     if (user?.publicMetadata.role === "educator") {
//       setIsEducator(true);
//     }

//     try {
//       const token = await getToken();
//       const { data } = await axios.get(backendUrl + "/api/user/data", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (data.success) {
//         setUserData(data.user);
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   // Function to calculate average rating of course
//   const calculateRating = (course) => {
//     if (course.courseRatings.length === 0) {
//       return 0;
//     }
//     let totalRating = 0;
//     course.courseRatings.forEach((rating) => {
//       totalRating += rating.rating;
//     });
//     return Math.floor(totalRating / course.courseRatings.length);
//   };

//   //functionn to calculate course chapter Time

//   const calculateChapterTime = (chapter) => {
//     let time = 0;
//     chapter.chapterContent.map((lecture) => (time += lecture.lectureDuration));
//     return humanizeDuration(60 * time * 1000, { units: ["h", "m"] });
//   };

//   // function to calculate course duration
//   const calculateCourseDuration = (course) => {
//     let time = 0;

//     course.courseContent.map((chapter) =>
//       chapter.chapterContent.map((lecture) => (time += lecture.lectureDuration))
//     );
//     return humanizeDuration(60 * time * 1000, { units: ["h", "m"] });
//   };

//   //function calculate to No of lectures in the course

//   const calculateNoOfLectures = (course) => {
//     let totalLectures = 0;
//     course.courseContent.forEach((chapter) => {
//       if (Array.isArray(chapter.chapterContent)) {
//         totalLectures += chapter.chapterContent.length;
//       }
//     });
//     return totalLectures;
//   };

//   //Fetch User Entrolled courses

//   const fetchUserEnrolledCourses = async () => {
//     try {
//       const token = await getToken();
//       const { data } = await axios.get(
//         backendUrl + "/api/user/enrolled-courses",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (data.success) {
//         setEnrolledCourses(data.enrolledCourses.reverse());
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   // Fetch courses on mount
//   useEffect(() => {
//     fetchAllCourses();
//   }, []);

//   useEffect(() => {
//     if (user) {
//       fetchUserData();
//       fetchUserEnrolledCourses();
//     }
//   }, [user]);

//   const value = {
//     currency,
//     allCourses,
//     navigate,
//     calculateRating,
//     isEducator,
//     setIsEducator,
//     calculateChapterTime,
//     calculateCourseDuration,
//     calculateNoOfLectures,
//     enrolledCourses,
//     fetchUserEnrolledCourses,
//     userData,
//     setUserData,
//     fetchUserData,
//     backendUrl,
//     fetchAllCourses,
//     // user,
//     getToken,
//     setAllCourses,
//     setEnrolledCourses,
//   };

//   return (
//     <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
//   );
// };

// ...... Ai correction 

import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  // Fetch All Courses
  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/all`);
      if (data.success) {
        setAllCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch User Data
  const fetchUserData = async () => {
    if (user?.publicMetadata.role === "educator") {
      setIsEducator(true);
    }
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Calculate average rating
  const calculateRating = (course) => {
    if (!course?.courseRatings?.length) return 0;
    const total = course.courseRatings.reduce((sum, r) => sum + r.rating, 0);
    return Math.floor(total / course.courseRatings.length);
  };

  // Calculate chapter time
  const calculateChapterTime = (chapter) => {
    let time = 0;
    chapter?.chapterContent?.forEach((lecture) => {
      time += lecture.lectureDuration;
    });
    return humanizeDuration(60 * time * 1000, { units: ["h", "m"] });
  };

  // Calculate course duration
  const calculateCourseDuration = (course) => {
    let time = 0;
    course?.courseContent?.forEach((chapter) => {
      chapter?.chapterContent?.forEach((lecture) => {
        time += lecture.lectureDuration;
      });
    });
    return humanizeDuration(60 * time * 1000, { units: ["h", "m"] });
  };

  // Calculate number of lectures
  const calculateNoOfLectures = (course) => {
    let total = 0;
    course?.courseContent?.forEach((chapter) => {
      total += chapter?.chapterContent?.length || 0;
    });
    return total;
  };

  // Fetch User Enrolled Courses
  const fetchUserEnrolledCourses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setEnrolledCourses(data.enrolledCourses.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Initial Fetch
  useEffect(() => { fetchAllCourses(); }, []);
  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserEnrolledCourses();
    }
  }, [user]);

  const value = {
    currency,
    allCourses,
    setAllCourses,
    navigate,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    enrolledCourses,
    setEnrolledCourses,
    fetchUserEnrolledCourses,
    isEducator,
    setIsEducator,
    userData,
    setUserData,
    fetchUserData,
    backendUrl,
    getToken,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
