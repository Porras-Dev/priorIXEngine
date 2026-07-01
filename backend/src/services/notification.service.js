require('dotenv').config();
const prisma = require('../lib/prisma');

let firebaseMessaging = null;

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail || projectId === 'your-firebase-project-id') {
    console.log('[FCM] Firebase not configured — push notifications disabled');
    return;
  }

  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail
        })
      });
    }
    firebaseMessaging = admin.messaging();
    console.log('[FCM] Firebase initialized — push notifications enabled');
  } catch (err) {
    console.error('[FCM] Firebase init error:', err.message);
  }
}

initFirebase();

async function createNotification({ userId, title, body }) {
  const notification = await prisma.notification.create({
    data: { userId, title, body }
  });

  if (firebaseMessaging) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true }
      });
      if (user?.fcmToken) {
        await firebaseMessaging.send({
          token: user.fcmToken,
          notification: { title, body }
        });
      }
    } catch (err) {
      console.error('[FCM] Push send error:', err.message);
    }
  }

  return notification;
}

module.exports = { createNotification };
