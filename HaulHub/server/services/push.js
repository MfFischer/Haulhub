const webpush = require('web-push');
const admin = require('firebase-admin');
const User = require('../models/User');
require('dotenv').config();

// Firebase initialization
const firebaseConfig = {
  credential: process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
    ? admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH))
    : admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID
};

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp(firebaseConfig);
    console.log('Firebase Admin SDK initialized');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

// Initialize Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@haulhub.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('Web Push initialized');
} else {
  console.warn('Web Push not fully configured. Push notifications via Web Push will not work.');
}

/**
 * Store or update a push subscription for a user
 * @param {string} userId - User ID
 * @param {Object} subscription - Push subscription object
 * @returns {Promise<Object>} - Updated user record
 */
const savePushSubscription = async (userId, subscription) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    // Set subscription object in user profile
    user.pushSubscriptions = user.pushSubscriptions || [];
    
    // Check if subscription already exists
    const existingIndex = user.pushSubscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    );
    
    if (existingIndex >= 0) {
      // Update existing subscription
      user.pushSubscriptions[existingIndex] = {
        ...subscription,
        updatedAt: new Date()
      };
    } else {
      // Add new subscription
      user.pushSubscriptions.push({
        ...subscription,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await user.save();
    return user;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
};

/**
 * Store a Firebase Cloud Messaging token for a user
 * @param {string} userId - User ID
 * @param {string} token - FCM token
 * @param {string} deviceId - Unique device identifier
 * @returns {Promise<Object>} - Updated user record
 */
const saveFcmToken = async (userId, token, deviceId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    // Set FCM tokens array in user profile
    user.fcmTokens = user.fcmTokens || [];
    
    // Check if token already exists
    const existingIndex = user.fcmTokens.findIndex(
      t => t.deviceId === deviceId
    );
    
    if (existingIndex >= 0) {
      // Update existing token
      user.fcmTokens[existingIndex] = {
        token,
        deviceId,
        updatedAt: new Date()
      };
    } else {
      // Add new token
      user.fcmTokens.push({
        token,
        deviceId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await user.save();
    return user;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
};

/**
 * Send push notification to a user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Notification results
 */
const sendPushToUser = async (userId, notification) => {
  try {
    // Find user
    const user = await User.findById(userId).lean();
    
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    const results = {
      webpush: { sent: 0, failed: 0, errors: [] },
      fcm: { sent: 0, failed: 0, errors: [] }
    };
    
    // Process Web Push subscriptions
    if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      await Promise.all(user.pushSubscriptions.map(async (subscription) => {
        try {
          await sendWebPushNotification(subscription, notification);
          results.webpush.sent++;
        } catch (error) {
          results.webpush.failed++;
          results.webpush.errors.push(error.message);
          console.error('Web Push notification failed:', error);
          
          // Handle expired or invalid subscriptions
          if (error.statusCode === 404 || error.statusCode === 410) {
            // Remove invalid subscription
            await User.findByIdAndUpdate(userId, {
              $pull: { pushSubscriptions: { endpoint: subscription.endpoint } }
            });
          }
        }
      }));
    }
    
    // Process FCM tokens
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      await Promise.all(user.fcmTokens.map(async ({ token, deviceId }) => {
        try {
          await sendFcmNotification(token, notification);
          results.fcm.sent++;
        } catch (error) {
          results.fcm.failed++;
          results.fcm.errors.push(error.message);
          console.error('FCM notification failed:', error);
          
          // Handle invalid tokens
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            // Remove invalid token
            await User.findByIdAndUpdate(userId, {
              $pull: { fcmTokens: { deviceId } }
            });
          }
        }
      }));
    }
    
    return {
      userId,
      results,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error sending push notification to user:', error);
    throw error;
  }
};

/**
 * Send Web Push notification
 * @param {Object} subscription - Push subscription object
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Web Push send result
 */
const sendWebPushNotification = async (subscription, notification) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('Web Push not configured');
  }
  
  // Prepare payload
  const payload = JSON.stringify({
    title: notification.title || 'HaulHub',
    body: notification.body || '',
    icon: notification.icon || '/icon-192x192.png',
    badge: notification.badge || '/badge-72x72.png',
    image: notification.image || null,
    tag: notification.tag || 'default',
    data: notification.data || {},
    actions: notification.actions || [],
    // Required by Firefox
    requireInteraction: notification.requireInteraction || false,
    renotify: notification.renotify || false,
    silent: notification.silent || false
  });
  
  // Send notification
  return await webpush.sendNotification(subscription, payload);
};

/**
 * Send Firebase Cloud Messaging notification
 * @param {string} token - FCM token
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - FCM send result
 */
const sendFcmNotification = async (token, notification) => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  // Prepare message
  const message = {
    token,
    notification: {
      title: notification.title || 'HaulHub',
      body: notification.body || ''
    },
    data: {},
    android: {
      notification: {
        icon: 'ic_notification',
        color: '#16a34a', // haulhub-primary color
        sound: 'default',
        channelId: notification.channelId || 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          badge: notification.badge ? 1 : 0,
          sound: 'default',
          category: notification.category || 'default'
        }
      }
    }
  };
  
  // Add data fields if provided
  if (notification.data) {
    // FCM requires all data values to be strings
    Object.keys(notification.data).forEach(key => {
      const value = notification.data[key];
      message.data[key] = typeof value === 'string' ? value : JSON.stringify(value);
    });
  }
  
  // Send message
  return await admin.messaging().send(message);
};

/**
 * Send notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Notification results
 */
const sendPushToUsers = async (userIds, notification) => {
  const results = {
    total: userIds.length,
    successful: 0,
    failed: 0,
    users: {}
  };
  
  // Process users in batches of 10 to avoid overwhelming the server
  const batchSize = 10;
  
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    
    // Process batch in parallel
    await Promise.all(batch.map(async (userId) => {
      try {
        const result = await sendPushToUser(userId, notification);
        results.successful++;
        results.users[userId] = { success: true, ...result.results };
      } catch (error) {
        results.failed++;
        results.users[userId] = { 
          success: false, 
          error: error.message 
        };
      }
    }));
  }
  
  return results;
};

/**
 * Send notification to users by criteria (like user type)
 * @param {Object} criteria - Mongoose query criteria
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Notification results
 */
const sendPushByCriteria = async (criteria, notification) => {
  try {
    // Find matching users
    const users = await User.find(criteria).select('_id').lean();
    const userIds = users.map(user => user._id.toString());
    
    return await sendPushToUsers(userIds, notification);
  } catch (error) {
    console.error('Error sending push notification by criteria:', error);
    throw error;
  }
};

/**
 * Send job-related notifications
 * @param {string} type - Notification type
 * @param {Object} job - Job object
 * @returns {Promise<Object>} - Notification results
 */
const sendJobNotification = async (type, job) => {
  // Get users involved in the job
  const recipientIds = [];
  let notification = {};
  
  switch (type) {
    case 'job_created':
      // Notify nearby haulers
      notification = {
        title: 'New job available nearby!',
        body: `${job.title} - ${job.pickup.address} to ${job.dropoff.address}`,
        data: {
          type: 'job_created',
          jobId: job._id.toString()
        },
        tag: 'job_available'
      };
      
      // Find haulers near pickup location
      // In a real app, you'd query haulers based on location proximity
      // For demonstration, we'll just notify all haulers
      const haulers = await User.find({ userType: 'hauler' }).select('_id').lean();
      haulers.forEach(hauler => recipientIds.push(hauler._id.toString()));
      break;
      
    case 'job_accepted':
      // Notify job poster
      notification = {
        title: 'Your job has been accepted!',
        body: `A hauler has accepted your job: ${job.title}`,
        data: {
          type: 'job_accepted',
          jobId: job._id.toString(),
          haulerId: job.haulerId.toString()
        },
        tag: 'job_update'
      };
      
      recipientIds.push(job.posterId.toString());
      break;
      
    case 'job_pickup':
      // Notify job poster
      notification = {
        title: 'Hauler is picking up your items',
        body: `The hauler is at the pickup location for your job: ${job.title}`,
        data: {
          type: 'job_pickup',
          jobId: job._id.toString()
        },
        tag: 'job_update'
      };
      
      recipientIds.push(job.posterId.toString());
      break;
      
    case 'job_completed':
      // Notify job poster
      notification = {
        title: 'Your job has been completed!',
        body: `Your job has been delivered: ${job.title}`,
        data: {
          type: 'job_completed',
          jobId: job._id.toString()
        },
        tag: 'job_update'
      };
      
      recipientIds.push(job.posterId.toString());
      break;
      
    case 'job_cancelled':
      // Notify other party
      const cancelledByPoster = job.meta.cancelledBy === job.posterId.toString();
      
      notification = {
        title: 'Job has been cancelled',
        body: `${cancelledByPoster ? 'The poster has' : 'The hauler has'} cancelled the job: ${job.title}`,
        data: {
          type: 'job_cancelled',
          jobId: job._id.toString()
        },
        tag: 'job_update'
      };
      
      // Notify the other party
      recipientIds.push(cancelledByPoster ? job.haulerId.toString() : job.posterId.toString());
      break;
  }
  
  if (recipientIds.length > 0) {
    return await sendPushToUsers(recipientIds, notification);
  }
  
  return { 
    message: 'No recipients for this notification type',
    type,
    recipientIds: []
  };
};

/**
 * Get VAPID public key
 * @returns {string} - VAPID public key
 */
const getVapidPublicKey = () => {
  return VAPID_PUBLIC_KEY;
};

/**
 * Remove push subscription
 * @param {string} userId - User ID
 * @param {string} endpoint - Subscription endpoint
 * @returns {Promise<Object>} - Updated user record
 */
const removePushSubscription = async (userId, endpoint) => {
  try {
    const result = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { pushSubscriptions: { endpoint } }
      },
      { new: true }
    );
    
    return result;
  } catch (error) {
    console.error('Error removing push subscription:', error);
    throw error;
  }
};

/**
 * Remove FCM token
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object>} - Updated user record
 */
const removeFcmToken = async (userId, deviceId) => {
  try {
    const result = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { fcmTokens: { deviceId } }
      },
      { new: true }
    );
    
    return result;
  } catch (error) {
    console.error('Error removing FCM token:', error);
    throw error;
  }
};

module.exports = {
  savePushSubscription,
  saveFcmToken,
  sendPushToUser,
  sendPushToUsers,
  sendPushByCriteria,
  sendJobNotification,
  getVapidPublicKey,
  removePushSubscription,
  removeFcmToken
};