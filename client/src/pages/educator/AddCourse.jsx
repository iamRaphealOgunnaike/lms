//.... Ai

import React, { useContext, useEffect, useRef, useState } from "react";
import Quill from "quill";
import { assets } from "../../assets/assets";
import uniqid from "uniqid";
import { AppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";

const AddCourse = () => {
  const { backendUrl, getToken, isEducator } = useContext(AppContext);
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showChapterPopup, setShowChapterPopup] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureUrl: "",
    isPreviewFree: false,
  });

  useEffect(() => {
    console.log("AddCourse - Component mounted"); // Debug
    console.log("AddCourse - isEducator:", isEducator); // Debug
    console.log("AddCourse - backendUrl:", backendUrl); // Debug
    if (!isEducator) {
      toast.error("You must be an educator to add courses.");
      navigate("/"); // Redirect if not educator
    }

    if (!quillRef.current && editorRef.current) {
      try {
        quillRef.current = new Quill(editorRef.current, {
          theme: "snow",
        });
        console.log("Quill initialized successfully"); // Debug
      } catch (error) {
        console.error("Quill initialization error:", error);
        toast.error("Failed to initialize text editor.");
      }
    }
    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [isEducator, navigate]);

  const handleChapter = (action, chapterId) => {
    console.log("handleChapter called with action:", action, "chapterId:", chapterId); // Debug
    if (action === "add") {
      setShowChapterPopup(true);
    } else if (action === "remove") {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === "toggle") {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId
            ? { ...chapter, collapsed: !chapter.collapsed }
            : chapter
        )
      );
    }
  };

  const addChapter = () => {
    console.log("addChapter called, chapterTitle:", chapterTitle); // Debug
    if (!chapterTitle) {
      toast.error("Chapter title is required.");
      return;
    }
    const newChapter = {
      chapterId: uniqid(),
      chapterTitle,
      chapterContent: [],
      collapsed: false,
      chapterOrder:
        chapters.length > 0 ? chapters[chapters.length - 1].chapterOrder + 1 : 1,
    };
    setChapters([...chapters, newChapter]);
    setShowChapterPopup(false);
    setChapterTitle("");
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    console.log("handleLecture called with action:", action, "chapterId:", chapterId, "lectureIndex:", lectureIndex); // Debug
    if (action === "add") {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === "remove") {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId
            ? {
                ...chapter,
                chapterContent: chapter.chapterContent.filter(
                  (_, index) => index !== lectureIndex
                ),
              }
            : chapter
        )
      );
    }
  };

  const addLecture = () => {
    console.log("addLecture called, lectureDetails:", lectureDetails); // Debug
    if (!lectureDetails.lectureTitle || !lectureDetails.lectureUrl) {
      toast.error("Lecture Title and URL are required.");
      return;
    }
    setChapters(
      chapters.map((chapter) =>
        chapter.chapterId === currentChapterId
          ? {
              ...chapter,
              chapterContent: [
                ...chapter.chapterContent,
                {
                  ...lectureDetails,
                  lectureOrder:
                    chapter.chapterContent.length > 0
                      ? chapter.chapterContent[chapter.chapterContent.length - 1]
                          .lectureOrder + 1
                      : 1,
                  lectureId: uniqid(),
                },
              ],
            }
          : chapter
      )
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: "",
      lectureDuration: "",
      lectureUrl: "",
      isPreviewFree: false,
    });
  };

  const handleImageChange = (e) => {
    console.log("handleImageChange called"); // Debug
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPEG or PNG images are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
        return;
      }
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit triggered"); // Debug
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!courseTitle) {
        console.log("Validation failed: Course title missing"); // Debug
        toast.error("Course title is required.");
        return;
      }
      if (!image) {
        console.log("Validation failed: Image missing"); // Debug
        toast.error("Course thumbnail is required.");
        return;
      }
      if (!quillRef.current || !quillRef.current.root.innerHTML || quillRef.current.root.innerHTML === "<p><br></p>") {
        console.log("Validation failed: Description missing or empty"); // Debug
        toast.error("Course description is required.");
        return;
      }
      if (chapters.length === 0) {
        console.log("Validation failed: No chapters"); // Debug
        toast.error("At least one chapter is required.");
        return;
      }

      const courseData = {
        courseTitle,
        courseDescription: DOMPurify.sanitize(quillRef.current.root.innerHTML),
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
      };

      const formData = new FormData();
      formData.append("courseData", JSON.stringify(courseData));
      formData.append("image", image);

      const token = await getToken();
      console.log("AddCourse - Backend URL:", backendUrl); // Debug
      console.log("AddCourse - Token:", token); // Debug
      console.log("AddCourse - FormData:", { courseData, image: image.name }); // Debug

      if (!backendUrl) {
        console.log("Validation failed: Backend URL missing"); // Debug
        toast.error("Backend URL is missing. Check .env configuration.");
        return;
      }
      if (!token) {
        console.log("Validation failed: No token"); // Debug
        toast.error("Authentication token is missing. Please log in.");
        return;
      }

      const response = await axios.post(`${backendUrl}/api/educator/add-course`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
       
      });

      console.log("Backend response:", response.data); // Debug
      if (response.data.success) {
        toast.success(response.data.message);
        setCourseTitle("");
        setCoursePrice(0);
        setDiscount(0);
        setImage(null);
        setChapters([]);
        quillRef.current.root.innerHTML = "";
        navigate("/courses");
      } else {
        toast.error(response.data.message || "Failed to add course.");
      }
    } catch (error) {
      console.error("AddCourse - Submission error:", error);
      let message = "Failed to add course. Please try again.";
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        message = `Cannot connect to backend at ${backendUrl}. Ensure the server is running.`;
      } else if (error.code === "ERR_NETWORK") {
        message = "Network error. Check your internet connection or backend URL.";
      } else if (error.response) {
        message = error.response.data.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        message = "No response from backend. Check your network or backend URL.";
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log("AddCourse - Rendering, isSubmitting:", isSubmitting); // Debug

  return (
    <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-2xl w-full text-gray-500"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="courseTitle">Course Title</label>
          <input
            id="courseTitle"
            onChange={(e) => setCourseTitle(e.target.value)}
            value={courseTitle}
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="courseDescription">Course Description</label>
          <div ref={editorRef}></div>
        </div>
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex flex-col gap-1">
            <label htmlFor="coursePrice">Course Price</label>
            <input
              id="coursePrice"
              onChange={(e) => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              placeholder="0"
              min="0"
              className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
              required
            />
            <div className="flex md:flex-row flex-col items-center gap-3">
              <label htmlFor="thumbnailImage">Course Thumbnail</label>
              <label
                htmlFor="thumbnailImage"
                className="flex items-center gap-3"
                aria-label="Upload course thumbnail"
              >
                <img
                  src={assets.file_upload_icon}
                  alt="Upload icon"
                  className="p-3 bg-blue-500 rounded"
                />
                <input
                  type="file"
                  id="thumbnailImage"
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png"
                  hidden
                />
                {image && (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Thumbnail preview"
                    className="max-h-10"
                  />
                )}
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="discount">Discount %</label>
            <input
              id="discount"
              onChange={(e) => setDiscount(e.target.value)}
              value={discount}
              type="number"
              placeholder="0"
              min="0"
              max="100"
              className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
              required
            />
          </div>
        </div>
        <div>
          {chapters.map((chapter, chapterIndex) => (
            <div
              key={chapter.chapterId}
              className="bg-white border rounded-lg mb-4"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <img
                    onClick={() => handleChapter("toggle", chapter.chapterId)}
                    src={assets.dropdown_icon}
                    width={14}
                    alt="Toggle chapter"
                    className={`mr-2 cursor-pointer transition-all ${
                      chapter.collapsed && "-rotate-90"
                    }`}
                  />
                  <span className="font-semibold">
                    {chapterIndex + 1}. {chapter.chapterTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    {chapter.chapterContent.length} Lectures
                  </span>
                  <img
                    onClick={() => handleChapter("remove", chapter.chapterId)}
                    src={assets.cross_icon}
                    alt="Remove chapter"
                    className="cursor-pointer w-4"
                  />
                </div>
              </div>
              {!chapter.collapsed && (
                <div className="p-4">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div
                      key={lecture.lectureId}
                      className="flex justify-between items-center mb-2"
                    >
                      <span>
                        {lectureIndex + 1}. {lecture.lectureTitle} -{" "}
                        {lecture.lectureDuration} mins -{" "}
                        <a
                          href={lecture.lectureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500"
                        >
                          Link
                        </a>{" "}
                        - {lecture.isPreviewFree ? "Free Preview" : "Paid"}
                      </span>
                      <img
                        src={assets.cross_icon}
                        alt="Remove lecture"
                        onClick={() =>
                          handleLecture("remove", chapter.chapterId, lectureIndex)
                        }
                        className="cursor-pointer w-4"
                      />
                    </div>
                  ))}
                  <div
                    className="inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2"
                    onClick={() => handleLecture("add", chapter.chapterId)}
                    role="button"
                    aria-label="Add lecture"
                  >
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}
          <div
            className="flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer"
            onClick={() => handleChapter("add")}
            role="button"
            aria-label="Add chapter"
          >
            + Add Chapter
          </div>
          {showChapterPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
              <div className="bg-white text-gray-700 p-6 rounded relative w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Add Chapter</h2>
                <div className="mb-4">
                  <label htmlFor="chapterTitle" className="block mb-1">
                    Chapter Title
                  </label>
                  <input
                    id="chapterTitle"
                    type="text"
                    className="block w-full border rounded py-1 px-2"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="button"
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={addChapter}
                >
                  Add
                </button>
                <img
                  src={assets.cross_icon}
                  alt="Close popup"
                  onClick={() => setShowChapterPopup(false)}
                  className="absolute top-4 right-4 w-4 cursor-pointer"
                />
              </div>
            </div>
          )}
          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
              <div className="bg-white text-gray-700 p-6 rounded relative w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>
                <div className="mb-4">
                  <label htmlFor="lectureTitle" className="block mb-1">
                    Lecture Title
                  </label>
                  <input
                    id="lectureTitle"
                    type="text"
                    className="block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureTitle}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureTitle: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="lectureDuration" className="block mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    id="lectureDuration"
                    type="number"
                    className="block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureDuration}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureDuration: e.target.value,
                      })
                    }
                    min="0"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="lectureUrl" className="block mb-1">
                    Lecture URL
                  </label>
                  <input
                    id="lectureUrl"
                    type="url"
                    className="block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureUrl}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureUrl: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="isPreviewFree" className="flex items-center">
                    <input
                      id="isPreviewFree"
                      type="checkbox"
                      className="mr-2"
                      checked={lectureDetails.isPreviewFree}
                      onChange={(e) =>
                        setLectureDetails({
                          ...lectureDetails,
                          isPreviewFree: e.target.checked,
                        })
                      }
                    />
                    Is Preview Free?
                  </label>
                </div>
                <button
                  type="button"
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={addLecture}
                >
                  Add
                </button>
                <img
                  src={assets.cross_icon}
                  alt="Close popup"
                  onClick={() => setShowPopup(false)}
                  className="absolute top-4 right-4 w-4 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-black text-white w-max py-2.5 px-8 rounded my-4 disabled:bg-gray-500"
          disabled={isSubmitting}
          onClick={() => console.log("ADD button clicked")} // Debug
        >
          {isSubmitting ? "Adding..." : "ADD"}
        </button>
      </form>
    </div>
  );
};

export default AddCourse;


// import React, { useEffect, useRef, useState } from "react";
// import uniqid from "uniqid";
// import Quill from "quill";
// import { Form } from "react-router-dom";
// import { assets } from "../../assets/assets";

// const AddCourse = () => {
//   const quillRef = useRef(null);
//   const editorRef = useRef(null);

//   const [courseTitle, setCourseTitle] = useState("");
//   const [coursePrice, setCoursePrice] = useState(0);
//   const [discount, setDiscount] = useState(0);
//   const [image, setImage] = useState(null);
//   const [chapters, setChapters] = useState([]);
//   const [showPopup, setShowPopup] = useState(false);
//   const [currentChapterId, setCurrentChapterId] = useState(null);

//   const [lectureDetails, setLectureDetails] = useState({
//     lectureTitle: "",
//     lectureDuration: "",
//     lectureUrl: "",
//     isPreviewFree: false,
//   });

//   const handleChapter = (action, chapterId) => {
//     if (action === "add") {
//       const title = prompt("Enter Chapter Name:");
//       if (title) {
//         const newChapter = {
//           chapterId: uniqid(),
//           chapterTitle: title,
//           chapterContent: [],
//           collapsed: false,
//           chapterOrder:
//             chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
//         };
//         setChapters([...chapters, newChapter]);
//       }
//     } else if (action === "remove") {
//       setChapters(
//         chapters.filter((chapter) => chapter.chapterId !== chapterId)
//       );
//     } else if (action === "toggle") {
//       setChapters(
//         chapters.map((chapter) =>
//           chapter.chapterId === chapterId
//             ? { ...chapter, collapsed: !chapter.collapsed }
//             : chapter
//         )
//       );
//     }
//   };

//   const handleLecture = (action, chapterId, lectureIndex) => {
//     if (action === "add") {
//       setCurrentChapterId(chapterId);
//       setShowPopup(true);
//     } else if (action === "remove") {
//       setChapters(
//         chapters.map((chapter) => {
//           if (chapter.chapterId === chapterId) {
//             chapter.chapterContent.splice(lectureIndex, 1);
//           }
//           return chapter;
//         })
//       );
//     }
//   };

//   const addLecture = () => {
//     setChapters(
//       chapters.map((chapter) => {
//         if (chapter.chapterId === currentChapterId) {
//           const newLecture = {
//             ...lectureDetails,
//             lectureOrder:
//               chapter.chapterContent.length > 0
//                 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1
//                 : 1,
//             lectureId: uniqid(),
//           };
//           chapter.chapterContent.push(newLecture);
//         }
//         return chapter;
//       })
//     );
//     setShowPopup(false);
//     setLectureDetails({
//       lectureTitle: "",
//       lectureDuration: "",
//       lectureUrl: "",
//       isPreviewFree: false,
//     });
//   };

//   // const handleSubmit = async (e) => {
//   //   e.preventDefault();
//   // };
//   const handleSubmit = async (e) => {
//   e.preventDefault();
//   console.log("handleSubmit triggered"); // Debug
//   setIsSubmitting(true);
//   // ... rest of the function
// };

//   useEffect(() => {
//     // initate Quill only once.
//     if (!quillRef.current && editorRef.current) {
//       quillRef.current = new Quill(editorRef.current, {
//         theme: "snow",
//       });
//     }
//   }, []);

//   return (
//     <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
//       <form
//         onSubmit={handleSubmit}
//         className="flex flex-col  gap-4 max-w-md w-full text-gray-500"
//       >
//         <div className="flex flex-col gap-1">
//           <p>Course Title</p>
//           <input
//             onChange={(e) => setCourseTitle(e.target.value)}
//             value={courseTitle}
//             type="text"
//             placeholder="Type here"
//             className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
//             required
//           />
//         </div>
//         <div className="flex flex-col gap-1">
//           <p>Course Description</p>
//           <div ref={editorRef}></div>
//         </div>

//         <div className="flex items-center justify-between flex-wrap">
//           <div className="flex flex-col gap-1">
//             <p>Course Price</p>
//             <input
//               onChange={(e) => setCoursePrice(e.target.value)}
//               value={coursePrice}
//               type="number"
//               placeholder="0"
//               className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
//               required
//             />
//             <div className="flex md:flex-row flex-col items-center gap-3">
//               <p>Course Thumbnail</p>
//               <label
//                 htmlFor="thumbnailImage"
//                 className="flex items-center gap-3"
//               >
//                 <img
//                   src={assets.file_upload_icon}
//                   alt=""
//                   className="p-3 bg-blue-500 rounded"
//                 />
//                 <input
//                   type="file"
//                   id="thumbnailImage"
//                   onChange={(e) => setImage(e.target.files[0])}
//                   accept="image/*"
//                   hidden
//                 />
//                 <img
//                   src={image ? URL.createObjectURL(image) : ""}
//                   alt=""
//                   className="max-h-10"
//                 />
//               </label>
//             </div>
//           </div>
//           <div className="flex flex-col gap-1">
//             <p>Discount %</p>
//             <input
//               onChange={(e) => setDiscount(e.target.value)}
//               value={discount}
//               type="number"
//               placeholder="0"
//               min={0}
//               max={100}
//               className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
//               required
//             />
//           </div>
//         </div>
//         {/*Adding Chapters & Lectures */}
//         <div>
//           {chapters.map((chapter, chapterIndex) => (
//             <div key={chapterIndex} className="bg-white border rounded-lg mb-4">
//               <div className="flex justify-between items-center p-4 border-b">
//                 <div className="flex items-center">
//                   <img
//                     onClick={() => handleChapter("toggle", chapter.chapterId)}
//                     src={assets.dropdown_icon}
//                     width={14}
//                     alt=""
//                     className={`mr-2 cursor-pointer transition-all ${
//                       chapter.collapsed && "-rotate-90"
//                     }`}
//                   />
//                   <span className="font-semibold">
//                     {chapterIndex + 1} {chapter.chapterTitle}
//                   </span>
//                 </div>
//                 <span className="text-gray-500">
//                   {chapter.chapterContent.length} Lectures
//                 </span>
//                 <img
//                   onClick={() => handleChapter("remove", chapter.chapterId)}
//                   src={assets.cross_icon}
//                   alt=""
//                   className="cursor-pointer"
//                 />
//               </div>
//               {!chapter.collapsed && (
//                 <div className="p-4">
//                   {chapter.chapterContent.map((lecture, lectureIndex) => (
//                     <div
//                       key={lectureIndex}
//                       className="flex justify-between items-center mb-2"
//                     >
//                       <span>
//                         {lectureIndex + 1} {lecture.lectureTitle} -{" "}
//                         {lecture.lectureDuration} mins -
//                         <a
//                           href={lecture.lectureUrl}
//                           target="_blank"
//                           className="text-blue-500"
//                         >
//                           Link
//                         </a>{" "}
//                         - {lecture.isPreviewFree ? "Free Preview" : "Paid"}
//                       </span>
//                       <img
//                         src={assets.cross_icon}
//                         alt=""
//                         onClick={() =>
//                           handleLecture(
//                             "remove",
//                             chapter.chapterId,
//                             lectureIndex
//                           )
//                         }
//                         className="cursor-pointer"
//                       />
//                     </div>
//                   ))}
//                   <div
//                     className="inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2"
//                     onClick={() => handleLecture("add", chapter.chapterId)}
//                   >
//                     + Add Lecture
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//           <div
//             className="flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer"
//             onClick={() => handleChapter("add")}
//           >
//             + Add Chapter
//           </div>
//           {showPopup && (
//             <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
//               <div className="bg-white text-gray-700 p-4 rounded relative w-full max-w-80">
//                 <h2 className="">Add Lecture</h2>

//                 <div className="mb-2">
//                   <p>Lecture Title</p>
//                   <input
//                     type="text"
//                     className="mt-1 block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureTitle}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureTitle: e.target.value,
//                       })
//                     }
//                   />
//                 </div>

//                 <div className="mb-2">
//                   <p>Duration (minutes)</p>
//                   <input
//                     type="number"
//                     className="mt-1 block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureDuration}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureDuration: e.target.value,
//                       })
//                     }
//                   />
//                 </div>

//                 <div className="mb-2">
//                   <p>Lecture URL</p>
//                   <input
//                     type="text"
//                     className="mt-1 block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureUrl}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureUrl: e.target.value,
//                       })
//                     }
//                   />
//                 </div>

//                 <div className="mb-2">
//                   <p>Is Preview Free?</p>
//                   <input
//                     type="checkbox"
//                     className="mt-1 block w-full border rounded py-1 px-2"
//                     checked={lectureDetails.isPreviewFree}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         isPreviewFree: e.target.checked,
//                       })
//                     }
//                   />
//                 </div>

//                 <button
//                   type="button"
//                   className="w-full bg-blue-400 text-white px-4 py-2 rounded"
//                   onClick={addLecture}
//                 >
//                   Add
//                 </button>

//                 <img
//                   src={assets.cross_icon}
//                   alt=""
//                   onClick={() => setShowPopup(false)}
//                   className="absolute top-4 right-4 w-4 cursor-pointer"
//                 />
//               </div>
//             </div>
//           )}
//         </div>
//         <button
//           type="submit"
//           className="bg-black text-white w-max py-2.5 px-8 rounded my-4"
//         >
//           ADD
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddCourse;


// import React, { useContext, useEffect, useRef, useState } from "react";
// import Quill from "quill";
// import { assets } from "../../assets/assets";
// import uniqid from "uniqid";
// import { AppContext } from "../../context/AppContext";
// import toast from "react-hot-toast";
// import axios from "axios";
// import { Link, useNavigate } from "react-router-dom";




// const AddCourse = () => {

//   const { backendUrl, getToken } = useContext(AppContext);
//   const quillRef = useRef(null);
//   const editorRef = useRef(null);

//   const [courseTitle, setCourseTitle] = useState("");
//   const [coursePrice, setCoursePrice] = useState(0);
//   const [discount, setDiscount] = useState(0);
//   const [image, setImage] = useState(null);
//   const [chapters, setChapters] = useState([]);
//   const [showPopup, setShowPopup] = useState(false);
//   const [currentChapterId, setCurrentChapterId] = useState(null);
//   const [lectureDetails, setLectureDetails] = useState({
//     lectureTitle: "",
//     lectureDuration: "",
//     lectureUrl: "",
//     isPreviewFree: false,
//   });

//   useEffect(() => {
//     if (!quillRef.current && editorRef.current) {
//       quillRef.current = new Quill(editorRef.current, {
//         theme: "snow",
//       });
//     }
//     return () => {
//       if (quillRef.current) {
//         quillRef.current = null;
//       }
//     };
//   }, []);

//   const handleChapter = (action, chapterId) => {
//     if (action === "add") {
//       const title = prompt("Enter Chapter Name:"); // Replace with form later
//       if (title) {
//         const newChapter = {
//           chapterId: uniqid(),
//           chapterTitle: title,
//           chapterContent: [],
//           collapsed: false,
//           chapterOrder:
//             chapters.length > 0 ? chapters[chapters.length - 1].chapterOrder + 1 : 1,
//         };
//         setChapters([...chapters, newChapter]);
//       }
//     } else if (action === "remove") {
//       setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
//     } else if (action === "toggle") {
//       setChapters(
//         chapters.map((chapter) =>
//           chapter.chapterId === chapterId
//             ? { ...chapter, collapsed: !chapter.collapsed }
//             : chapter
//         )
//       );
//     }
//   };

//   const handleLecture = (action, chapterId, lectureIndex) => {
//     if (action === "add") {
//       setCurrentChapterId(chapterId);
//       setShowPopup(true);
//     } else if (action === "remove") {
//       setChapters(
//         chapters.map((chapter) =>
//           chapter.chapterId === chapterId
//             ? {
//                 ...chapter,
//                 chapterContent: chapter.chapterContent.filter(
//                   (_, index) => index !== lectureIndex
//                 ),
//               }
//             : chapter
//         )
//       );
//     }
//   };

//   const addLecture = () => {
//     // Basic validation
//     if (!lectureDetails.lectureTitle || !lectureDetails.lectureUrl) {
//       alert("Lecture Title and URL are required.");
//       return;
//     }

//     setChapters(
//       chapters.map((chapter) =>
//         chapter.chapterId === currentChapterId
//           ? {
//               ...chapter,
//               chapterContent: [
//                 ...chapter.chapterContent,
//                 {
//                   ...lectureDetails,
//                   lectureOrder:
//                     chapter.chapterContent.length > 0
//                       ? chapter.chapterContent[chapter.chapterContent.length - 1]
//                           .lectureOrder + 1
//                       : 1,
//                   lectureId: uniqid(),
//                 },
//               ],
//             }
//           : chapter
//       )
//     );

//     setShowPopup(false);
//     setLectureDetails({
//       lectureTitle: "",
//       lectureDuration: "",
//       lectureUrl: "",
//       isPreviewFree: false,
//     });
//   };

//   const handleSubmit = async (e) => {

//     try {
//       e.preventDefault();
//       if(!image) {
//         toast.error('Thumbnail not Selected')
//       }

//       const courseData = {
//         courseTitle,
//         courseDescription: quillRef.current.root.innerHTML,
//         coursePrice: Number(coursePrice),
//         discount: Number(discount),
//         courseContent: chapters,
//       };

//       const formData = new FormData();
//       formData.append("courseData", JSON.stringify(courseData));
//       formData.append("image", image);

//       const token = await getToken();
//       const { data } = await axios.post(backendUrl + "/api/educator/add-course", formData,{
//         headers: {
//           
//           Authorization: `Bearer ${token}`,
//         },
//       });
      
//       if(data.success) {
//         toast.success(data.message);
//         setCourseTitle("");
//         setCoursePrice(0);
//         setDiscount(0);
//         setImage(null);
//         setChapters([]);
//         quillRef.current.innerHTML = "";
//       }else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
    
    
//   };

//   return (
//     <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
//       <form
//         onSubmit={handleSubmit}
//         className="flex flex-col gap-4 max-w-md w-full text-gray-500"
//       >
//         <div className="flex flex-col gap-1">
//           <label htmlFor="courseTitle">Course Title</label>
//           <input
//             id="courseTitle"
//             onChange={(e) => setCourseTitle(e.target.value)}
//             value={courseTitle}
//             type="text"
//             placeholder="Type here"
//             className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
//             required
//           />
//         </div>
//         <div className="flex flex-col gap-1">
//           <label htmlFor="courseDescription">Course Description</label>
//           <div ref={editorRef}></div>
//         </div>
//         <div className="flex items-center justify-between flex-wrap">
//           <div className="flex flex-col gap-1">
//             <label htmlFor="coursePrice">Course Price</label>
//             <input
//               id="coursePrice"
//               onChange={(e) => setCoursePrice(e.target.value)}
//               value={coursePrice}
//               type="number"
//               placeholder="0"
//               min="0"
//               className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
//               required
//             />
//             <div className="flex md:flex-row flex-col items-center gap-3">
//               <label htmlFor="thumbnailImage">Course Thumbnail</label>
//               <label
//                 htmlFor="thumbnailImage"
//                 className="flex items-center gap-3"
//                 aria-label="Upload course thumbnail"
//               >
//                 <img
//                   src={assets.file_upload_icon}
//                   alt="Upload icon"
//                   className="p-3 bg-blue-500 rounded"
//                 />
//                 <input
//                   type="file"
//                   id="thumbnailImage"
//                   onChange={(e) => setImage(e.target.files[0])}
//                   accept="image/*"
//                   hidden
//                 />
//                 {image && (
//                   <img
//                     src={URL.createObjectURL(image)}
//                     alt="Thumbnail preview"
//                     className="max-h-10"
//                   />
//                 )}
//               </label>
//             </div>
//           </div>
//           <div className="flex flex-col gap-1">
//             <label htmlFor="discount">Discount %</label>
//             <input
//               id="discount"
//               onChange={(e) => setDiscount(e.target.value)}
//               value={discount}
//               type="number"
//               placeholder="0"
//               min="0"
//               max="100"
//               className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
//               required
//             />
//           </div>
//         </div>
//         {/* Adding Chapters & Lectures */}
//         <div>
//           {chapters.map((chapter, chapterIndex) => (
//             <div
//               key={chapter.chapterId}
//               className="bg-white border rounded-lg mb-4"
//             >
//               <div className="flex justify-between items-center p-4 border-b">
//                 <div className="flex items-center">
//                   <img
//                     onClick={() => handleChapter("toggle", chapter.chapterId)}
//                     src={assets.dropdown_icon}
//                     width={14}
//                     alt="Toggle chapter"
//                     className={`mr-2 cursor-pointer transition-all ${
//                       chapter.collapsed && "-rotate-90"
//                     }`}
//                   />
//                   <span className="font-semibold">
//                     {chapterIndex + 1}. {chapter.chapterTitle}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-gray-500">
//                     {chapter.chapterContent.length} Lectures
//                   </span>
//                   <img
//                     onClick={() => handleChapter("remove", chapter.chapterId)}
//                     src={assets.cross_icon}
//                     alt="Remove chapter"
//                     className="cursor-pointer w-4"
//                   />
//                 </div>
//               </div>
//               {!chapter.collapsed && (
//                 <div className="p-4">
//                   {chapter.chapterContent.map((lecture, lectureIndex) => (
//                     <div
//                       key={lecture.lectureId}
//                       className="flex justify-between items-center mb-2"
//                     >
//                       <span>
//                         {lectureIndex + 1}. {lecture.lectureTitle} -{" "}
//                         {lecture.lectureDuration} mins -{" "}
//                         <a
//                           href={lecture.lectureUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-blue-500"
//                         >
//                           Link
//                         </a>{" "}
//                         - {lecture.isPreviewFree ? "Free Preview" : "Paid"}
//                       </span>
//                       <img
//                         src={assets.cross_icon}
//                         alt="Remove lecture"
//                         onClick={() =>
//                           handleLecture("remove", chapter.chapterId, lectureIndex)
//                         }
//                         className="cursor-pointer w-4"
//                       />
//                     </div>
//                   ))}
//                   <div
//                     className="inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2"
//                     onClick={() => handleLecture("add", chapter.chapterId)}
//                   >
//                     + Add Lecture
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//           <div
//             className="flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer"
//             onClick={() => handleChapter("add")}
//           >
//             + Add Chapter
//           </div>
//           {showPopup && (
//             <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
//               <div className="bg-white text-gray-700 p-6 rounded relative w-full max-w-md">
//                 <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>
//                 <div className="mb-4">
//                   <label htmlFor="lectureTitle" className="block mb-1">
//                     Lecture Title
//                   </label>
//                   <input
//                     id="lectureTitle"
//                     type="text"
//                     className="block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureTitle}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureTitle: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label htmlFor="lectureDuration" className="block mb-1">
//                     Duration (minutes)
//                   </label>
//                   <input
//                     id="lectureDuration"
//                     type="number"
//                     className="block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureDuration}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureDuration: e.target.value,
//                       })
//                     }
//                     min="0"
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label htmlFor="lectureUrl" className="block mb-1">
//                     Lecture URL
//                   </label>
//                   <input
//                     id="lectureUrl"
//                     type="url"
//                     className="block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureUrl}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureUrl: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label htmlFor="isPreviewFree" className="flex items-center">
//                     <input
//                       id="isPreviewFree"
//                       type="checkbox"
//                       className="mr-2"
//                       checked={lectureDetails.isPreviewFree}
//                       onChange={(e) =>
//                         setLectureDetails({
//                           ...lectureDetails,
//                           isPreviewFree: e.target.checked,
//                         })
//                       }
//                     />
//                     Is Preview Free?
//                   </label>
//                 </div>
//                 <button
//                   type="button"
//                   className="w-full bg-blue-500 text-white px-4 py-2 rounded"
//                   onClick={addLecture}
//                 >
//                   Add
//                 </button>
//                 <img
//                   src={assets.cross_icon}
//                   alt="Close popup"
//                   onClick={() => setShowPopup(false)}
//                   className="absolute top-4 right-4 w-4 cursor-pointer"
//                 />
//               </div>
//             </div>
//           )}
//         </div>
//         <button
//           type="submit"
//           className="bg-black text-white w-max py-2.5 px-8 rounded my-4"
//         >
//           ADD
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddCourse;

// ai Grok

// import React, { useContext, useEffect, useRef, useState } from "react";
// import Quill from "quill";
// import { assets } from "../../assets/assets";
// import uniqid from "uniqid";
// import { AppContext } from "../../context/AppContext.jsx";
// import toast from "react-hot-toast";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import DOMPurify from "dompurify";

// const AddCourse = () => {
//   const { backendUrl, getToken } = useContext(AppContext);
//   const navigate = useNavigate();
//   const quillRef = useRef(null);
//   const editorRef = useRef(null);

//   const [courseTitle, setCourseTitle] = useState("");
//   const [coursePrice, setCoursePrice] = useState(0);
//   const [discount, setDiscount] = useState(0);
//   const [image, setImage] = useState(null);
//   const [chapters, setChapters] = useState([]);
//   const [showPopup, setShowPopup] = useState(false);
//   const [showChapterPopup, setShowChapterPopup] = useState(false);
//   const [chapterTitle, setChapterTitle] = useState("");
//   const [currentChapterId, setCurrentChapterId] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [lectureDetails, setLectureDetails] = useState({
//     lectureTitle: "",
//     lectureDuration: "",
//     lectureUrl: "",
//     isPreviewFree: false,
//   });

//   useEffect(() => {
//     if (!quillRef.current && editorRef.current) {
//       quillRef.current = new Quill(editorRef.current, {
//         theme: "snow",
//       });
//     }
//     return () => {
//       if (quillRef.current) {
//         quillRef.current = null;
//       }
//     };
//   }, []);

//   const handleChapter = (action, chapterId) => {
//     if (action === "add") {
//       setShowChapterPopup(true);
//     } else if (action === "remove") {
//       setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
//     } else if (action === "toggle") {
//       setChapters(
//         chapters.map((chapter) =>
//           chapter.chapterId === chapterId
//             ? { ...chapter, collapsed: !chapter.collapsed }
//             : chapter
//         )
//       );
//     }
//   };

//   const addChapter = () => {
//     if (!chapterTitle) {
//       toast.error("Chapter title is required.");
//       return;
//     }
//     const newChapter = {
//       chapterId: uniqid(),
//       chapterTitle,
//       chapterContent: [],
//       collapsed: false,
//       chapterOrder:
//         chapters.length > 0 ? chapters[chapters.length - 1].chapterOrder + 1 : 1,
//     };
//     setChapters([...chapters, newChapter]);
//     setShowChapterPopup(false);
//     setChapterTitle("");
//   };

//   const handleLecture = (action, chapterId, lectureIndex) => {
//     if (action === "add") {
//       setCurrentChapterId(chapterId);
//       setShowPopup(true);
//     } else if (action === "remove") {
//       setChapters(
//         chapters.map((chapter) =>
//           chapter.chapterId === chapterId
//             ? {
//                 ...chapter,
//                 chapterContent: chapter.chapterContent.filter(
//                   (_, index) => index !== lectureIndex
//                 ),
//               }
//             : chapter
//         )
//       );
//     }
//   };

//   const addLecture = () => {
//     if (!lectureDetails.lectureTitle || !lectureDetails.lectureUrl) {
//       toast.error("Lecture Title and URL are required.");
//       return;
//     }
//     setChapters(
//       chapters.map((chapter) =>
//         chapter.chapterId === currentChapterId
//           ? {
//               ...chapter,
//               chapterContent: [
//                 ...chapter.chapterContent,
//                 {
//                   ...lectureDetails,
//                   lectureOrder:
//                     chapter.chapterContent.length > 0
//                       ? chapter.chapterContent[chapter.chapterContent.length - 1]
//                           .lectureOrder + 1
//                       : 1,
//                   lectureId: uniqid(),
//                 },
//               ],
//             }
//           : chapter
//       )
//     );
//     setShowPopup(false);
//     setLectureDetails({
//       lectureTitle: "",
//       lectureDuration: "",
//       lectureUrl: "",
//       isPreviewFree: false,
//     });
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (!["image/jpeg", "image/png"].includes(file.type)) {
//         toast.error("Only JPEG or PNG images are allowed.");
//         return;
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error("Image size must be less than 5MB.");
//         return;
//       }
//       setImage(file);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     try {
//       // Validate inputs
//       if (!courseTitle) {
//         toast.error("Course title is required.");
//         return;
//       }
//       if (!image) {
//         toast.error("Course thumbnail is required.");
//         return;
//       }
//       if (!quillRef.current.root.innerHTML || quillRef.current.root.innerHTML === "<p><br></p>") {
//         toast.error("Course description is required.");
//         return;
//       }
//       if (chapters.length === 0) {
//         toast.error("At least one chapter is required.");
//         return;
//       }

//       const courseData = {
//         courseTitle,
//         courseDescription: DOMPurify.sanitize(quillRef.current.root.innerHTML),
//         coursePrice: Number(coursePrice),
//         discount: Number(discount),
//         courseContent: chapters,
//       };

//       const formData = new FormData();
//       formData.append("courseData", JSON.stringify(courseData));
//       formData.append("image", image);

//       const token = await getToken();
//       if (!token) {
//         toast.error("Authentication token is missing. Please log in.");
//         return;
//       }

//       console.log("Backend URL:", backendUrl); // Debug
//       console.log("Token:", token); // Debug

//       const response = await axios.post(`${backendUrl}/api/educator/add-course`, formData, {
//         headers: {
          
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.data.success) {
//         toast.success(response.data.message);
//         setCourseTitle("");
//         setCoursePrice(0);
//         setDiscount(0);
//         setImage(null);
//         setChapters([]);
//         quillRef.current.root.innerHTML = "";
//         navigate("/courses");
//       } else {
//         toast.error(response.data.message || "Failed to add course.");
//       }
//     } catch (error) {
//       console.error("Submission error:", error);
//       const message =
//         error.response?.data?.message ||
//         "Failed to add course. Please check your network or try again.";
//       toast.error(message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
//       <form
//         onSubmit={handleSubmit}
//         className="flex flex-col gap-4 max-w-2xl w-full text-gray-500"
//       >
//         <div className="flex flex-col gap-1">
//           <label htmlFor="courseTitle">Course Title</label>
//           <input
//             id="courseTitle"
//             onChange={(e) => setCourseTitle(e.target.value)}
//             value={courseTitle}
//             type="text"
//             placeholder="Type here"
//             className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
//             required
//           />
//         </div>
//         <div className="flex flex-col gap-1">
//           <label htmlFor="courseDescription">Course Description</label>
//           <div ref={editorRef}></div>
//         </div>
//         <div className="flex items-center justify-between flex-wrap">
//           <div className="flex flex-col gap-1">
//             <label htmlFor="coursePrice">Course Price</label>
//             <input
//               id="coursePrice"
//               onChange={(e) => setCoursePrice(e.target.value)}
//               value={coursePrice}
//               type="number"
//               placeholder="0"
//               min="0"
//               className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
//               required
//             />
//             <div className="flex md:flex-row flex-col items-center gap-3">
//               <label htmlFor="thumbnailImage">Course Thumbnail</label>
//               <label
//                 htmlFor="thumbnailImage"
//                 className="flex items-center gap-3"
//                 aria-label="Upload course thumbnail"
//               >
//                 <img
//                   src={assets.file_upload_icon}
//                   alt="Upload icon"
//                   className="p-3 bg-blue-500 rounded"
//                 />
//                 <input
//                   type="file"
//                   id="thumbnailImage"
//                   onChange={handleImageChange}
//                   accept="image/jpeg,image/png"
//                   hidden
//                 />
//                 {image && (
//                   <img
//                     src={URL.createObjectURL(image)}
//                     alt="Thumbnail preview"
//                     className="max-h-10"
//                   />
//                 )}
//               </label>
//             </div>
//           </div>
//           <div className="flex flex-col gap-1">
//             <label htmlFor="discount">Discount %</label>
//             <input
//               id="discount"
//               onChange={(e) => setDiscount(e.target.value)}
//               value={discount}
//               type="number"
//               placeholder="0"
//               min="0"
//               max="100"
//               className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
//               required
//             />
//           </div>
//         </div>
//         <div>
//           {chapters.map((chapter, chapterIndex) => (
//             <div
//               key={chapter.chapterId}
//               className="bg-white border rounded-lg mb-4"
//             >
//               <div className="flex justify-between items-center p-4 border-b">
//                 <div className="flex items-center">
//                   <img
//                     onClick={() => handleChapter("toggle", chapter.chapterId)}
//                     src={assets.dropdown_icon}
//                     width={14}
//                     alt="Toggle chapter"
//                     className={`mr-2 cursor-pointer transition-all ${
//                       chapter.collapsed && "-rotate-90"
//                     }`}
//                   />
//                   <span className="font-semibold">
//                     {chapterIndex + 1}. {chapter.chapterTitle}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-gray-500">
//                     {chapter.chapterContent.length} Lectures
//                   </span>
//                   <img
//                     onClick={() => handleChapter("remove", chapter.chapterId)}
//                     src={assets.cross_icon}
//                     alt="Remove chapter"
//                     className="cursor-pointer w-4"
//                   />
//                 </div>
//               </div>
//               {!chapter.collapsed && (
//                 <div className="p-4">
//                   {chapter.chapterContent.map((lecture, lectureIndex) => (
//                     <div
//                       key={lecture.lectureId}
//                       className="flex justify-between items-center mb-2"
//                     >
//                       <span>
//                         {lectureIndex + 1}. {lecture.lectureTitle} -{" "}
//                         {lecture.lectureDuration} mins -{" "}
//                         <a
//                           href={lecture.lectureUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-blue-500"
//                         >
//                           Link
//                         </a>{" "}
//                         - {lecture.isPreviewFree ? "Free Preview" : "Paid"}
//                       </span>
//                       <img
//                         src={assets.cross_icon}
//                         alt="Remove lecture"
//                         onClick={() =>
//                           handleLecture("remove", chapter.chapterId, lectureIndex)
//                         }
//                         className="cursor-pointer w-4"
//                       />
//                     </div>
//                   ))}
//                   <div
//                     className="inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2"
//                     onClick={() => handleLecture("add", chapter.chapterId)}
//                     role="button"
//                     aria-label="Add lecture"
//                   >
//                     + Add Lecture
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//           <div
//             className="flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer"
//             onClick={() => handleChapter("add")}
//             role="button"
//             aria-label="Add chapter"
//           >
//             + Add Chapter
//           </div>
//           {showChapterPopup && (
//             <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
//               <div className="bg-white text-gray-700 p-6 rounded relative w-full max-w-md">
//                 <h2 className="text-lg font-semibold mb-4">Add Chapter</h2>
//                 <div className="mb-4">
//                   <label htmlFor="chapterTitle" className="block mb-1">
//                     Chapter Title
//                   </label>
//                   <input
//                     id="chapterTitle"
//                     type="text"
//                     className="block w-full border rounded py-1 px-2"
//                     value={chapterTitle}
//                     onChange={(e) => setChapterTitle(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   className="w-full bg-blue-500 text-white px-4 py-2 rounded"
//                   onClick={addChapter}
//                 >
//                   Add
//                 </button>
//                 <img
//                   src={assets.cross_icon}
//                   alt="Close popup"
//                   onClick={() => setShowChapterPopup(false)}
//                   className="absolute top-4 right-4 w-4 cursor-pointer"
//                 />
//               </div>
//             </div>
//           )}
//           {showPopup && (
//             <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
//               <div className="bg-white text-gray-700 p-6 rounded relative w-full max-w-md">
//                 <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>
//                 <div className="mb-4">
//                   <label htmlFor="lectureTitle" className="block mb-1">
//                     Lecture Title
//                   </label>
//                   <input
//                     id="lectureTitle"
//                     type="text"
//                     className="block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureTitle}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureTitle: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label htmlFor="lectureDuration" className="block mb-1">
//                     Duration (minutes)
//                   </label>
//                   <input
//                     id="lectureDuration"
//                     type="number"
//                     className="block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureDuration}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureDuration: e.target.value,
//                       })
//                     }
//                     min="0"
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label htmlFor="lectureUrl" className="block mb-1">
//                     Lecture URL
//                   </label>
//                   <input
//                     id="lectureUrl"
//                     type="url"
//                     className="block w-full border rounded py-1 px-2"
//                     value={lectureDetails.lectureUrl}
//                     onChange={(e) =>
//                       setLectureDetails({
//                         ...lectureDetails,
//                         lectureUrl: e.target.value,
//                       })
//                     }
//                     required
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label htmlFor="isPreviewFree" className="flex items-center">
//                     <input
//                       id="isPreviewFree"
//                       type="checkbox"
//                       className="mr-2"
//                       checked={lectureDetails.isPreviewFree}
//                       onChange={(e) =>
//                         setLectureDetails({
//                           ...lectureDetails,
//                           isPreviewFree: e.target.checked,
//                         })
//                       }
//                     />
//                     Is Preview Free?
//                   </label>
//                 </div>
//                 <button
//                   type="button"
//                   className="w-full bg-blue-500 text-white px-4 py-2 rounded"
//                   onClick={addLecture}
//                 >
//                   Add
//                 </button>
//                 <img
//                   src={assets.cross_icon}
//                   alt="Close popup"
//                   onClick={() => setShowPopup(false)}
//                   className="absolute top-4 right-4 w-4 cursor-pointer"
//                 />
//               </div>
//             </div>
//           )}
//         </div>
//         <button
//           type="submit"
//           className="bg-black text-white w-max py-2.5 px-8 rounded my-4 disabled:bg-gray-500"
//           disabled={isSubmitting}
//         >
//           {isSubmitting ? "Adding..." : "ADD"}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddCourse;
