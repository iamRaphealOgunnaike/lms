// import multer from "multer"

// const storage = multer.diskStorage({})

// //const upload = multer.MulterError({storage})
// const upload = multer({ storage });


// export default upload

//--update
import multer from "multer";
import path from "path";

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

// Create multer instance
const upload = multer({ storage });

export default upload;
