import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";

const CourseDetails = () => {
  const { id } = useParams()

  const [courseData, setCourseData] = useState(null);

  const { allCourses, calculateRating, calculateNoOfLectures, calculateCourseDuration, calculateChapterTime } = useContext(AppContext);

  const fetchCourseData = async ()=>{
    const findCourse = allCourses.find(course => course._id === id);
    setCourseData(findCourse);
  };

  useEffect(() => {
    fetchCourseData();
  }, []);

  return courseData ? (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left">
        <div className="absolute top-0 left-0 w-full h-section-height -z-10 bg-gradient-to-b from-cyan-100/70"></div>
        {/* left column*/}
        <div className="max-w-xl z-10 text-gray-500">
          <h1 className="md:text-course-details-heading-large text-course-details-heading-small font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>
          <p
            className="pt-4 md:text-base text-sm"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription.slice(0, 200),
            }}
          ></p>

          {/*review and rating */}
          <div className="flex items-center space-x-2">
            <p>{calculateRating(courseData)}</p>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={
                    i < Math.floor(calculateRating(courseData))
                      ? assets.star
                      : assets.star_blank
                  }
                  alt=""
                  className="w-3.5 h-3.5"
                />
              ))}
            </div>
            <p className="text-blue-600">
              {courseData.courseRatings.length}
              {courseData.courseRatings.length > 1 ? "ratings" : "rating"}
            </p>
            <p>
              {courseData.enrolledStudents.length}
              {courseData.enrolledStudents.length > 1 ? "students" : "student"}
            </p>
          </div>

          <p className="text-sm">
            Course by <span className="text-blue-600">GreatStack</span>
          </p>
          <div className="pt-8 text-gray-800">
<h2>Course Structure</h2>
<div className="pt-5">
  {courseData.courseContent.map((chapter, index)=>(
    <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none">
        <div className="flex items-center gap-2">
          <img src={assets.down_arrow_icon} alt="arrow icon" />
          <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
        </div>
        <p className="text-sm md:text-default">{chapter.chapterContent.length} lectures -{calculateChapterTime(chapter)}</p>
      </div> 
      <div className="overflow-hidden transition-all duration-300 max-h-96 ">
        <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t bordr-gray-300">
          {chapter.chapterContent.map((lecture, i) =>(
            <li key={i} className="flex items-start gap-2 py-1">
              <img src={assets.play_icon} alt="" className="w-h-4 mt-1"/>
              <div>
                <p>{lecture.lectureTitle}</p>
                <div>
                  {lecture.isPreviewFree && <p>Preview</p>}
                  <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, {units:['h','m']})}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  ))}
</div>
          </div>
        </div>
        {/* Right column*/}
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default CourseDetails;
