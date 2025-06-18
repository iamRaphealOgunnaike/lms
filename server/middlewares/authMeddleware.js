// import { clerkClient } from "@clerk/express";

// // Middleware ( Protect Educator Routes)

// export const protectEducator = async (req, res, next) => {


//     try {

//         const userId = req.auth.userId
//         const response = await  clerkClient.users.getUser(userId)

//         if(response.publicMetadata.role !== 'educator'){
//             return res.json({ success: false, message: 'unauthorized Access'})
//         }

//         next()
        
//     } catch (error) {
//         res.json({success:false, message: error.message})
        
//     }
// }

import { clerkClient } from "@clerk/express";

// Middleware to protect educator routes
export const protectEducator = async (req, res, next) => {
    try {
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userId = req.auth.userId;
        const response = await clerkClient.users.getUser(userId);

        if (response.publicMetadata.role !== 'educator') {
            return res.status(403).json({ success: false, message: 'Unauthorized Access' });
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
