import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";

// API Controller Function to Manage Clerk User  with database

export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;
    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + data.last_name,
          imageUrl: data.image_url,
        };

        await User.create(userData);
        return res.json({});
        break;
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + data.last_name,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.json({});
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        res.json({});
        break;
      }

      default:
        break;
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);


export const stripewebhooks = async (request, response ) => {

  const sig = request.headers["stripe-signature"];

  let event;
  try{
    event = Stripe.Webhooks.constructEvent(
      request.body, sig , process.env.STRIPE_WEBHOOK_SECRET) ;
  }
  catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId)
      const userData = await User.findById(purchaseData.userId)
      const courseData = await Course.findById(purchaseData.courseId.toString())
      
      courseData.enrolledStudents.push(userData)
      await courseData.save();

      userData.enrolledCourses.push(courseData._id)
      await userData.save();

      purchaseData.status = "completed";
      await purchaseData.save();

      break;
    }

    case 'paymentIntent.payment_failed': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId
      })

      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);
      purchaseData.status = "failed";
      await purchaseData.save();

      break;
    }
    
   
    //... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }

  // return a response to acknowledge receipt of the event
  //response.json({ received: true });

//     case "customer.created": {
//       const customer = event.data.object;
//       const userData = {
//         _id: customer.id,
//         email: customer.email,
//         name: customer.name || "No Name",
//         imageUrl: customer.metadata.imageUrl || "",
//       };
//       await User.create(userData);
//       break;
//     }

//     case "customer.updated": {
//       const customer = event.data.object;
//       const userData = {
//         email: customer.email,
//         name: customer.name || "No Name",
//         imageUrl: customer.metadata.imageUrl || "",
//       };
//       await User.findByIdAndUpdate(customer.id, userData);
//       break;
//     }

//     case "customer.deleted": {
//       await User.findByIdAndDelete(event.data.object.id);
//       break;
//     }

//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }
//  }
 


// // Ai correction

// import { Webhook } from 'svix';
// import User from '../models/User.js';

// // API Controller Function to Manage Clerk User with database
// export const clerkWebhooks = async (req, res) => {
//     try {
//         const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

//         await whook.verify(JSON.stringify(req.body), {
//             'svix-id': req.headers['svix-id'],
//             'svix-timestamp': req.headers['svix-timestamp'],
//             'svix-signature': req.headers['svix-signature'],
//         });

//         const { data, type } = req.body;

//         switch (type) {
//             case 'user.created': {
//                 const userData = {
//                     _id: data.id,
//                     email: data.email_addresses[0].email_address,
//                     name: `${data.first_name} ${data.last_name}`,
//                     imageUrl: data.image_url,
//                 };

//                 await User.create(userData);
//                 return res.json({});
//             }

//             case 'user.updated': {
//                 const userData = {
//                     email: data.email_addresses[0].email_address,
//                     name: `${data.first_name} ${data.last_name}`,
//                     imageUrl: data.image_url,
//                 };

//                 await User.findByIdAndUpdate(data.id, userData);
//                 return res.json({});
//             }

//             case 'user.deleted': {
//                 await User.findByIdAndDelete(data.id);
//                 return res.json({});
//             }

//             default:
//                 return res.status(400).json({ success: false, message: 'Unhandled event type' });
//         }
//     } catch (error) {
//         return res.status(400).json({ success: false, message: error.message });
//     }
// };
