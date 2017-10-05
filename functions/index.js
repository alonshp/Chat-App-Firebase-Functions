const functions = require('firebase-functions');

//import admin module
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.emojify =
    functions.database.ref('/chats/messages/{pushId}/text')
    .onWrite(event => {
        // Database write events include new, modified, or deleted
        // database nodes. All three types of events at the specific
        // database path trigger this cloud function.
        // For this function we only want to emojify new database nodes,
        // so we'll first check to exit out of the function early if
        // this isn't a new message.

        // !event.data.val() is a deleted event
        // event.data.previous.val() is a modified event
        if (!event.data.val() || event.data.previous.val()) {
            console.log("not a new write event");
            return;
        }

        // Now we begin the emoji transformation
        console.log("emojifying!");

        // Get the value from the 'text' key of the message
        const originalText = event.data.val();
        const emojifiedText = emojifyText(originalText);

        // Return a JavaScript Promise to update the database node
        return event.data.ref.set(emojifiedText);
    });

// Returns text with keywords replaced by emoji
// Replacing with the regular expression /.../ig does a case-insensitive
// search (i flag) for all occurrences (g flag) in the string
function emojifyText(text) {
    var emojifiedText = text;
    emojifiedText = emojifiedText.replace(/\blol\b/ig, "😂");
    emojifiedText = emojifiedText.replace(/\bcat\b/ig, "😸");
    return emojifiedText;
}

// Listens for new messages added to messages/:pushId
exports.pushNotification = functions.database.ref('/chats/messages/{pushId}').onWrite( event => {

    console.log('Push notification event triggered');

    //  Grab the current value of what was written to the Realtime Database.
    var valueObject = event.data.val();

    // if(valueObject.photoUrl != null) {
    //   valueObject.photoUrl= "Sent you a photo!";
    // }

  // Create a notification
    const payload = {
        notification: {
            title:valueObject.name,
            body: valueObject.text,
            sound: "default"
        },
    };


  //Create an options object that contains the time to live for the notification and the priority
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };


    return admin.messaging().sendToTopic("pushNotifications", payload, options);
});

