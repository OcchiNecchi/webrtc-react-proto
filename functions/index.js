// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.scheduledFunction = functions.https.onRequest((request, response) => {
  admin.database().ref('/').remove();
  console.log('削除完了！');
  response.send("Hello from Firebase!");
});
