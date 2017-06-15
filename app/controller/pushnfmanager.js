var apn = require("apn");

var _ = require('lodash');
var config = require('../config/pushconfig');

//pfx: "app/config/WizeProdPush.p12",

//pfx: "app/config/WizePushCertp12.p12"
var apnConnectionReinitCount = 0;
var certPath = config.apnpushcertdev;
if (config.apnpushcertpflag) certPath = config.apnpushcertprod;
var options = {
  pfx: certPath,//"app/config/WizePushDevCertp12.p12",//"app/config/WizeProdPush1.p12",
  passphrase: "teamwize",
  debug: true,
  production: config.apnpushcertpflag
};

var trackMessageType = 'pushmessage';

//var apnConnection = new apn.Connection(options);
var apnProvider = new apn.Provider(options);
options.pfx = "app/config/WizePushDevCertp12.p12";
options.production = false;
var apnProviderDev = new apn.Provider(options);

function initApnProvider(cb) {
  apnConnectionReinitCount = apnConnectionReinitCount + 1;
  console.log("info", "PUSHSERVER", "initApnProvider invoked count= " + apnConnectionReinitCount);


  var certPath = config.apnpushcertdev;
  if (config.apnpushcertpflag) certPath = config.apnpushcertprod;
  var options = {
    pfx: certPath,//"app/config/WizePushDevCertp12.p12",//"app/config/WizeProdPush1.p12",
    passphrase: "teamwize",
    debug: true,
    production: config.apnpushcertpflag
  };



  //var apnConnection = new apn.Connection(options);
  apnProvider = new apn.Provider(options);
  cb();

}




function apnPush(note, nextDevice, cb) {
  apnProvider.send(note, nextDevice).then((response) => { //,function(sent,failed){ //
    if (response)
      //console.log("respnsoe", response);
      console.log("info", "PUSHSERVER", "APN response " + JSON.stringify(response));
    if (response.sent.length > 0) {
      // console.log("successfully delivered to the following devices", response.sent);
      console.log("info", "PUSHSERVER", "successfully delivered to the following devices" + JSON.stringify(response.sent));
      //pushType,pushEventId,pushDeviceId
      //  trackit(messageType, eventyByid, nextDevice);
      cb()

    }

    if (response.failed.length > 0) {
      console.log("Failed to Delivere due to ", response.failed[0]);
      console.log("error", "PUSHSERVER", "Failed to Deliver due to " + JSON.stringify(response.failed[0]));

      if ((response.failed[0].error) &&
        response.failed[0].error.jse_cause != undefined &&
        response.failed[0].error.jse_cause.errno == 'ECONNRESET') {
        console.log("info", "PUSHSERVER", "Failed to Deliver due to ECONNRESET ..trying to reinitalize apnProvider");

        initApnProvider(function () {
          apnProvider.send(note, nextDevice).then((response) => { //,function(sent,failed){ //

            if (response)
              //console.log("respnsoe", response);
              console.log("info", "PUSHSERVER", "APN response after reinitalizing apnProvider" + JSON.stringify(response));

            if (response.sent.length > 0) {
              // console.log("successfully delivered to the following devices", response.sent);
              console.log("info", "PUSHSERVER", "reinitalizing apnProvider successfully delivered to the following devices" + JSON.stringify(response.sent));

              //pushType,pushEventId,pushDeviceId
              //  trackit(messageType, eventyByid, nextDevice);
              cb()

            } else if (response.failed.length > 0) {
              //console.log("Failed to Delivere due to ", response.failed[0].response);
              console.log("error", "PUSHSERVER", "reinitalizing apnProvider Failed to Deliver due to " + JSON.stringify(response.failed[0]));
              cb(response.failed);
            }
          });
        });
      } else {
        cb(response.failed);
      }

    }
    //  console.log("push method invoke ended for device ", nextDevice);
    console.log("info", "PUSHSERVER", "push method invoke ended for device " + nextDevice);

  });



}

function checkandpushout(track_query, note, cb) {

  console.log("\n\n checkandpushout track_query ", JSON.stringify(track_query));

  var ignoreMessageTypes = [
    'comment',
    'rating',
    'report-abuse'
  ];
  var local_track_query = {
    metadata: {
      "lesson_id": track_query.metadata.lesson_id,
      "event_object_type": track_query.metadata.event_object_type,
      "event_for_id": track_query.metadata.event_for_id,
      "event_by_id": track_query.metadata.event_by_id,
      "event_type": track_query.metadata.event_type,
      "event_sub_type": track_query.metadata.event_sub_type
    }
  }

  apnPush(note, local_track_query.metadata.event_for_id, function (err) {

    if (err) {
      console.log("error", "PUSHSERVER", "apn push error " + JSON.stringify(err));
      cb(err);
    } else {
      console.log("\n\n inside track create new---->", JSON.stringify(local_track_query))
      cb();
    }

  });



}

var apnsserver = {

  //send a message

  sendMessage1: function (messagePayload, cb) {
    console.log("info", "PUSHSERVER", "messagePayload " + messagePayload.message);
    console.log("messagePayload", JSON.stringify(messagePayload));
    var note = new apn.Notification();
    var payload = {
      type: messagePayload.type,
      message: messagePayload.message,
      title: messagePayload.title
    };

    // userid or lesson id called need to identify

    var track_query = {

      metadata: {
        event_object_type: messagePayload.type,
        event_sub_type: messagePayload.event_sub_type,
        event_type: 'push',
        event_by_id: messagePayload.event_by_id
      }
    }
    if (messagePayload.type == 'user') {
      payload.user_id = messagePayload.user_id;
      track_query.metadata.user_id = messagePayload.user_id;

    } else if (messagePayload.type == 'lesson') {
      payload.lesson_id = messagePayload.lesson_id
      track_query.metadata.lesson_id = messagePayload.lesson_id;
    }

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    //note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = payload.message;
    note.payload = payload;
    note.topic = "fm.wize.wizeapp";

    _.forEach(messagePayload.iphone_device_tokens,
      function (nextDevice) {
        track_query.metadata.event_for_id = nextDevice;

        checkandpushout(track_query, note, function (err) {

          if (err) cb(err)
          else cb();

        });
      });



  },



  deliverToAPN: function (message, payload, iphone_device_token, env) {

    //console.log("deliverToAPN to method invoked");
    console.log("info", "PUSHSERVER", "deliverToAPN to method invoked");

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    //note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = message;
    note.payload = payload;
    note.topic = "fm.wize.wizeapp";

    if (env != undefined && env == 'dev') {
      apnProviderDev.send(note, iphone_device_token).then((response) => { //,function(sent,failed){ //

        if (response.sent.length > 0) {
          //console.log("successfully delivered to the following devices", response.sent);

          console.log("info", "PUSHSERVER", "successfully delivered to the following devices" + JSON.stringify(response.sent));

        }
        if (response.failed.length > 0) {
          //console.log("Failed to Delivere due to ", response.failed[0].response);

          console.log("error", "PUSHSERVER", "Failed to Delivere due to " + JSON.stringify(rresponse.failed[0].response));

        }
        // response.sent: Array of device tokens to which the notification was sent succesfully
        // response.failed: Array of objects containing the device token (`device`) and either an `error`, or a `status` and `response` from the API
      });
    } else {
      //apnProvider.
      apnProviderDev.send(note, iphone_device_token).then((response) => { //,function(sent,failed){ //

        if (response.sent.length > 0) {
          // console.log("successfully delivered to the following devices", response.sent," message :",message," payload",payload);
          console.log("info", "PUSHSERVER", "successfully delivered to the following devices" + JSON.stringify(response.sent) + " message :" + message + " payload" + JSON.stringify(payload));

        }
        if (response.failed.length > 0) {
          // console.log("Failed to Delivere due to ", response.failed[0].response);
          console.log("error", "PUSHSERVER", "Failed to Delivere due to " + JSON.stringify(rresponse.failed[0].response));

        }
        // response.sent: Array of device tokens to which the notification was sent succesfully
        // response.failed: Array of objects containing the device token (`device`) and either an `error`, or a `status` and `response` from the API
      });
    }
    //console.log("deliverToAPN to method invoke ended");
    console.log("info", "PUSHSERVER", "deliverToAPN to method invoke ended");


  },


  sendAMessage2: function (message, payload, iphone_device_token) {

    console.log("push send messge invoked for a device ", iphone_device_token, " message ", message);
    //  var myDevice = new apn.Device(iphone_device_token);
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    //note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = message;
    note.payload = payload;

    // apnConnection.pushNotification(note, myDevice);

    apnProvider.send(note, iphone_device_token).then((response) => { //,function(sent,failed){ //

      if (response)
        console.log("respnsoe", response, "response.failed[0].response", response.failed[0].response);
    });

  }
};



module.exports = apnsserver;
