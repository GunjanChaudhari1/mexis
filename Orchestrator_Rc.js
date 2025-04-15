//------------------------------------------------------------------------------------------------------------------------------------------
// âœ¨ Program: RingCentral To Orchestrator
//------------------------------------------------------------------------------------------------------------------------------------------

const { performance } = require('perf_hooks');
const { Console } = require('console');
const LOGGER = require('./Handler_Logger');
const SESSION = require('./Handler_Session');
const CONSTANTS = require('./Constants');
const DF = require('./Handler_DialogFlow');
const RC = require('./Handler_RingCentral');
const UTIL = require('./Util');
// ðŸ“¸ Banner Image Preview
// new latest changes for sentiment
const sentimentCheck = require('./UserStory_SentimentCheck');

let score = '';
let magnitude = '';
//
//-----------------------------------------------------------------------------------------------------
let BANNER = {};

// ðŸŒ„ Environment Variables
//------------------------------------------------------------------------------------------------
const { TIMEOUT_RETRY_COUNT } = process.env;

// ðŸ‘‡primary entry point for RC.
//----------------------------------------------------------------------------------------------------
exports.handler = async (event, context, callback) => {
  console.log('RingCentral request data: ', JSON.stringify(event));

  // Populate GCP credentials and RC access token in the entry point itself
  UTIL.populateEnvironmentKeys();
  await UTIL.populateRCAccessTokenSecret();
  await UTIL.populateGCPCredentialsSecret();
  await UTIL.populateRCVerficationTokenSecret();
  const populateRCDimeloSecret = await UTIL.populateRCDimeloSecret();

  const apiRequestId = event.requestContext.requestId;
  const StartTime = new Date().addHours(8).toUTCString();
  const StartClock = performance.now();
  // let rawText    = "";
  let queryText = '';
  let messageId = '';
  let primary_msisdn = '';
  let msisdn = '';
  let intentName = '';
  let isAgentTransfer = false;
  let threadId = '';
  let isLog = false;
  let replyId = '';
  let botMessage = '';
  let channelName = '';
  let sessionID = '';
  let authorId = '';
  let channelID = '';
  const getChannelName = '';
  const displayNameChannel = '';

  // ðŸ•‘ Performance Counters
  let MS_RC_IDENTITY = 0;
  let MS_RC_REPLY = 0;
  let MS_DF_REPLY = 0;

  UTIL.Dump(event, 'Incoming RAW request');

  try {
    const eventMethod = event.httpMethod;
    console.log('event Method', JSON.stringify(eventMethod));
    // âš¡ GET is  using Proxy Integration - therefore event contains only headers, body, etc
    if (eventMethod == 'GET' && event.queryStringParameters != undefined) {
      console.log('Get if queryStringParameters undefine');
      const challenge = event.queryStringParameters['hub.challenge'];
      const mode = event.queryStringParameters['hub.mode'];
      const token = event.queryStringParameters['hub.verify_token'];
      console.log(`challenge--->${challenge}, mode---->${mode}, ${token}`);
      if (mode == 'subscribe' && token == UTIL.RC_VERFICATION_TOKEN) {
        console.log('âœ… RING CENTRAL: Verification succeeded.');
        // return UTIL.CreateTextResponse(challenge);
        callback(null, UTIL.CreateTextResponse(challenge));
      } else {
        console.log('âœ… RING CENTRAL Verification failed.');
        // return UTIL.CreateUnAuthorized();
        callback(null, UTIL.CreateUnAuthorized());
      }
    } else if (eventMethod == 'POST') {
      const dimeloSecret = event.headers['X-Dimelo-Secret'];
      console.log('âœ…dimelo Secret', dimeloSecret, UTIL.RC_DIMELO_SECRET);
      if (dimeloSecret == undefined || dimeloSecret == '' || dimeloSecret != UTIL.RC_DIMELO_SECRET) {
        console.log('âœ… RING CENTRAL Dimelo secret failed.');
        return UTIL.CreateUnAuthorized();
      }
      callback(null, UTIL.CreateTextResponse('OK'));
      console.log('âœ… ACK 200 Sent');

      if (BANNER != undefined || Object.keys(BANNER).length != 0) {
        BANNER = await RC.GetBanner();
      }

      body = event.body;
      console.log('RingCentral Event body: ', JSON.stringify(body));
      let A;
      let B;
      if (body.events[0].type == 'content.imported') {
        A = performance.now();
        const Identity = await RC.GetIdentity(body);
        console.log('âœ… Identity User channel info', Identity);
        B = performance.now();
        MS_RC_IDENTITY = B - A;

        rawText = await RC.GetQueryText(body);
        // queryText = RC.GetQueryText(body);
        messageId = RC.GetReplyId(body);
        replyId = RC.GetReplyId(body);
        threadId = RC.GetThreadId(body);
        channelID = RC.GetSourceId(body);
        sessionID = threadId;
        authorId = RC.GetAuthorId(body);
        msisdn = Identity.mobile_phone;
        primary_msisdn = Identity.mobile_phone;


        console.log(`ðŸ‘‡  ðŸ›ðŸ’° rawText${rawText}, messageId${messageId},replyId${messageId},threadId${messageId},channelID${channelID},sessionID${sessionID},authorId${authorId}, msisdn${msisdn}`);
        if (primary_msisdn == undefined || primary_msisdn == null || primary_msisdn == ''){
          primary_msisdn = await SESSION.GetPrimaryMSISDN(sessionID);
        }
        if (msisdn == undefined || msisdn == null || msisdn == '') {
          msisdn = await SESSION.GetMSISDN(sessionID);
        }
        const lastIntent = await SESSION.GetLastIntent(sessionID);
        queryText = await RC.translateToEng(rawText, msisdn, sessionID, false, lastIntent);
        channelName = UTIL.getChannelBySource(channelID);
        console.log('ðŸ›ðŸ’° information of msisdn msisdn, lastIntent, queryText, channelName', msisdn, lastIntent, queryText, channelName);
        if (Identity == undefined) {
          // await RC.SendText(replyId, `Sorry ${Identity.display_name}, something went wrong Ã°Å¸Ëœâ€“. Please try again later.`);
          await RC.Call(replyId, `Sorry ${Identity.display_name}, something went wrong Ã°Å¸Ëœâ€“. Please try again later.`);
          console.log(`ðŸ”» Identity Undefined: [${sessionID}][${queryText}]. Terminated.`);
          return;
        }
        if (RC.IsContainBOT(body)) {
          isLog = true; // enable flag for logging
          // ðŸ‘‡ keeps session alive for the next N min
          const sessionData = {
            channel_name: channelName,
            channel_id: channelID,
            api_request_id: apiRequestId,
            session_id: sessionID,
            primary_msisdn,
            msisdn,
            message_id: messageId,
            author_id: authorId,
          };
          await SESSION.KeepAlive(sessionData);

          // ðŸ‘‡ DIALOG FLOW: calling dialog flow
          //-----------------------------------------------------------------------------------
          context = await SESSION.GetContext(sessionID); // retrive context from db
          let DfReply = {};
          A = performance.now();
          for (let i = 0; i < TIMEOUT_RETRY_COUNT; i++) {
            console.log(`ðŸŸ¢ REQ ðŸ¤ž Attempt ${i + 1}: [${sessionID}] [${queryText}]`);
            const Cache = await SESSION.GetCache(sessionID);
            if (Identity.type == 'twtr') {
              console.log('Identity.screenname*******Twitter', Identity.screenname);
              Cache.displayNameChannel = Identity.screenname;
            } else if (Identity.type == 'mobile_messaging') {
              if (Identity.screenname == null) {
                Cache.displayNameChannel = '@';
              } else {
                Cache.displayNameChannel = Identity.display_name;
              }
            } else {
              console.log('Identity.screenname*******else', Identity.screenname);
              Cache.displayNameChannel = Identity.display_name;
            }
            console.log('username************', Cache.displayNameChannel, body.events[0].resource.metadata.location == undefined);
            Cache.getChannelName = Identity.type;
            const lastEvent = await SESSION.GetLastEvent(sessionID);
            let IRLastEvent = '';
            if (lastEvent != undefined) {
              IRLastEvent = lastEvent.event;
            }

            if (body.events[0].resource.metadata.has_attachment == true && body.events[0].resource.metadata.body == null && body.events[0].resource.metadata.location == undefined && lastEvent != undefined) {
              console.log('Locate payment--->', 'attachment id ', body.events[0].resource.id);
              const contentResult = await RC.GetContentData(body.events[0].resource.id);
              const audioRegex = /[.](mp3|oga|ogg|wav)/gi;
              const { filename } = contentResult.attachments[0];
              const { virus_signature } = contentResult.attachments[0];
              // const virus_signature = 'virus';
              console.log('Is attachement has virus', virus_signature);
              console.log('The file name -> ', filename);
              console.log('This is the last Event -> ', lastEvent);
              console.log('RC Last Event -> ', lastEvent.event);

              // if (filename.match(audioRegex)) {
              // console.log('Matched -> audio')
              // Cache['AudioAttachment'] = [{ "filename": contentResult.attachments[0].filename, "size": contentResult.attachments[0].size, "url": contentResult.attachments[0].url }]
              // await SESSION.SetCache(sessionID, Cache);
              // DfReply = await DF.Call("Knowledge.Crawler.Attachment.Check",sessionID, msisdn, context)
              // break;
              // }
              //if (lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights' || lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_InvalidImage' || lastEvent.event === 'IRTR_FristRouterImage_IR_API_Initiate') {
              if (virus_signature !== undefined && (lastEvent.event == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights'
                || lastEvent.event == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_InvalidImage'
                || lastEvent.event == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo'
                || lastEvent.event == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_NoIR'
                || lastEvent.event == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_NoIR')) {
                console.log('I have found the image from virus, So performing diagnostic Results');
                Cache.ImageVirus = true;
                await SESSION.SetCache(sessionID, Cache);
                await SESSION.SetLastEvent(sessionID, { event: '', param: '' });
                DfReply = await DF.Call('IRTR.Network.Fibre.SlowWifi.DiagnosticCheck.VirusImage', sessionID, msisdn, context);
                break;
              } else if (lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights' || lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_InvalidImage') {
                console.log('Matched -> Image');
                console.log('THis is the content resultsss ----- > ', contentResult);
                const currentTime = new Date();
                console.log('This is the current time', currentTime);
                const lastImageRecognition = Cache.ImageRecognition;
                console.log('This is the cached Image Recognition ', lastImageRecognition);
                console.log('This is the enterred image url -> ', contentResult.attachments[0].url);
                if (Cache.ImageRecognitionFirstPhotoUploaded == undefined || Cache.ImageRecognitionFirstPhotoUploaded == false){

                  if (lastImageRecognition) {
                    console.log('Image Recognition Exists');
                    Cache.ImageRecognitionFirstPhotoUploaded = true;
                    const lastFileTimeStamp = lastImageRecognition[lastImageRecognition.length - 1].timestamp;
                    const lastTime = new Date(lastFileTimeStamp);
                    const diff = Math.abs(currentTime - lastTime);
                    console.log('The cached timestamp ', lastFileTimeStamp);
                    console.log('The converted time ', lastTime);
                    console.log('The time difference is ', diff);
                    // 60000 = 1 Minute in Milliseconds
                    //if (diff > 60000) {
                      if (diff > 60000) {
                      console.log('Last Image Recognition Attachment Was More Than 60 Seconds ', diff);
                      Cache.ImageRecognition = [{
                        filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                      }];
                      console.log('ImageRecognition Body ', Cache.ImageRecognition);
                      await SESSION.SetCache(sessionID, Cache);
                      DfReply = await DF.Call('IRTR.FristRouterImage.AttachmentCheck', sessionID, context);
                    } else {
                      console.log('Image Recognition within 60 seconds', diff);
                      Cache.ImageRecognition = [...lastImageRecognition, {
                        filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                      }];
                      console.log('ImageRecognition Body ', Cache.ImageRecognition);
                      await SESSION.SetCache(sessionID, Cache);
                      DfReply = await DF.Call('IRTR.FristRouterImage.AttachmentCheck', sessionID, msisdn, context);
                    }
                  } else {
                    Cache.ImageRecognitionFirstPhotoUploaded = true;
                    console.log('Creating new Image Recognition');
                    Cache.ImageRecognition = [{
                      filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                    }];
                    console.log('ImageRecognition Body ', Cache.ImageRecognition);
                    await SESSION.SetCache(sessionID, Cache);
                    DfReply = await DF.Call('IRTR.FristRouterImage.AttachmentCheck', sessionID, msisdn, context);
                  }

                } else {
                  console.log("Image First 11 Uploaded >> ")
                }
                break;
              } else if (lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_InvalidFormat' || lastEvent.event === 'IRTR_FristRouterImage_IR_API_Initiate') {
                console.log("Image First Invalid Uploaded >> ")
              } else if (lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_InvalidFormat' || lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_ValidFirstSecondPhoto_OfferDiagnosticCheck') {
                console.log("Image Second Invalid Uploaded >> ")
              } else if (lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo') {
                console.log('👍Matched -> Second Router Image');
                console.log('THis is the content resultsss ----- > ', contentResult);
                const currentTime = new Date();
                console.log('ðŸ‘‰This is the current time', currentTime);
                const { DiagnosticResult_SecondRouterImage_IR } = Cache;

                console.log('ðŸ‘‰ðŸ‘‰This is the Second Router Image to Attach CRM Case with IR ', DiagnosticResult_SecondRouterImage_IR);
                console.log('ðŸ‘“This is the enterred image url -> ', contentResult.attachments[0].url);

                if (Cache.DiagnosticResultSecondRouterImageUploaded == undefined || Cache.DiagnosticResultSecondRouterImageUploaded == false){

                  if (DiagnosticResult_SecondRouterImage_IR) {
                    console.log('ðŸ‘‰SecondRouterImage for CRM Case Creation');
                    Cache.DiagnosticResultSecondRouterImageUploaded = true;
                    const lastFileTimeStamp = DiagnosticResult_SecondRouterImage_IR[DiagnosticResult_SecondRouterImage_IR.length - 1].timestamp;
                    const lastTime = new Date(lastFileTimeStamp);
                    const diff = Math.abs(currentTime - lastTime);
                    console.log('ðŸ‘‰ This is Cached TimeStamp', lastFileTimeStamp);
                    console.log('The converted time ', lastTime);
                    console.log('The time difference is ', diff);
                    // 60000 = 1 Minute in Milliseconds
                    if (diff > 60000) {
                      console.log('first Router Image to Attach CRM Case Was More Than 60 Seconds ', diff);
                      Cache.DiagnosticResult_SecondRouterImage_IR = [{
                        filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                      }];
                      console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_SecondRouterImage_IR);
                      await SESSION.SetCache(sessionID, Cache);
                      DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.ValidFirstSecondPhoto.OfferDiagnosticCheck.AttachmentCheck', sessionID, context);
                    } else {
                      console.log('Second Router Image within 60 Secconds');
                      Cache.DiagnosticResult_SecondRouterImage_IR = [...DiagnosticResult_SecondRouterImage_IR, {
                        filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                      }];
                      console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_SecondRouterImage_IR);
                      await SESSION.SetCache(sessionID, Cache);
                      DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.ValidFirstSecondPhoto.OfferDiagnosticCheck.AttachmentCheck', sessionID, msisdn, context);
                    }
                  } else {
                    console.log('Uploading Second Router Image');
                    console.log('contentResult', contentResult);
                    Cache.DiagnosticResultSecondRouterImageUploaded = true;
                    Cache.DiagnosticResult_SecondRouterImage_IR = [{
                      filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                    }];
                    console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_SecondRouterImage_IR);
                    await SESSION.SetCache(sessionID, Cache);
                    DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.ValidFirstSecondPhoto.OfferDiagnosticCheck.AttachmentCheck', sessionID, context);
                  }

                } else {
                  console.log("Image Uploaded >> ")
                }
                break;
              } else if (lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_NoIR') {
                console.log('ðŸ‘Matched -> Image');
                console.log('THis is the content resultsss ----- > ', contentResult);
                const currentTime = new Date();
                console.log('ðŸ‘‰This is the current time', currentTime);
                const { DiagnosticResult_FirstRouterImage } = Cache;

                console.log('ðŸ‘‰ðŸ‘‰This is the first Router Image to Attach CRM Case ', DiagnosticResult_FirstRouterImage);
                console.log('ðŸ‘“This is the enterred image url -> ', contentResult.attachments[0].url);

                if(Cache.DiagnosticResultFirstRouterImageUploaded === undefined || Cache.DiagnosticResultFirstRouterImageUploaded === false) 
                {

                  if (DiagnosticResult_FirstRouterImage) {
                    console.log('ðŸ‘‰FirstRouterImage for CRM Case Creation');
                    const lastFileTimeStamp = DiagnosticResult_FirstRouterImage[DiagnosticResult_FirstRouterImage.length - 1].timestamp;
                    const lastTime = new Date(lastFileTimeStamp);
                    const diff = Math.abs(currentTime - lastTime);
                    console.log('ðŸ‘‰ This is Cached TimeStamp', lastFileTimeStamp);
                    console.log('The converted time ', lastTime);
                    console.log('The time difference is ', diff);
                    // 60000 = 1 Minute in Milliseconds
                    if (diff > 60000) {
                      console.log('first Router Image to Attach CRM Case Was More Than 60 Seconds ', diff);
                      Cache.DiagnosticResultFirstRouterImageUploaded = true;
                      Cache.DiagnosticResult_FirstRouterImage = [{
                        filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                      }];
                      console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_FirstRouterImage);
                      await SESSION.SetCache(sessionID, Cache);
                      DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.FirstPhoto.IndicatorLights.NoIR.AttachmentCheck', sessionID, context);
                    } else {
                      console.log('First Router Image within 60 Secconds');
                      Cache.DiagnosticResultFirstRouterImageUploaded = true;
                      Cache.DiagnosticResult_FirstRouterImage = [...DiagnosticResult_FirstRouterImage, {
                        filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                      }];
                      console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_FirstRouterImage);
                      await SESSION.SetCache(sessionID, Cache);
                      DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.FirstPhoto.IndicatorLights.NoIR.AttachmentCheck', sessionID, msisdn, context);
                    }
                  } else {
                    console.log('Uploading first Router Image');
                    console.log('contentResult', contentResult);
                    Cache.DiagnosticResultFirstRouterImageUploaded = true;
                    Cache.DiagnosticResult_FirstRouterImage = [{
                      filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                    }];
                    console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_FirstRouterImage);
                    await SESSION.SetCache(sessionID, Cache);
                    DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.FirstPhoto.IndicatorLights.NoIR.AttachmentCheck', sessionID, context);
                  }

                }
                break;
              } else if (lastEvent.event === 'lms_creation_inprogress' || lastEvent === 'Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_Yes_END' || lastEvent.event === 'MAXbot_TroubleshootHomeWifiFailedCaseCreation' || lastEvent.event === 'Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes_Notify') {
                console.log('Image Second Uploaded >>> ');
              }
              else if (lastEvent.event === 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_NoIR') {
                console.log('ðŸ‘Matched -> Image');
                console.log('THis is the content resultsss ----- > ', contentResult);
                const currentTime = new Date();
                console.log('ðŸ‘‰This is the current time', currentTime);
                const { DiagnosticResult_SecondRouterImage } = Cache;

                console.log('ðŸ‘‰ðŸ‘‰This is the Second Router Image to Attach CRM Case ', DiagnosticResult_SecondRouterImage);
                console.log('ðŸ‘“This is the enterred image url -> ', contentResult.attachments[0].url);

                if(Cache.DiagnosticResultSecondRouterImageUploaded === undefined || Cache.DiagnosticResultSecondRouterImageUploaded === false) 
                {

                  if (DiagnosticResult_SecondRouterImage) {
                    console.log('ðŸ‘‰SecodRouterImage for CRM Case Creation');
                    const lastFileTimeStamp = DiagnosticResult_SecondRouterImage[DiagnosticResult_SecondRouterImage.length - 1].timestamp;
                    const lastTime = new Date(lastFileTimeStamp);
                    const diff = Math.abs(currentTime - lastTime);
                    console.log('ðŸ‘‰ This is Cached TimeStamp', lastFileTimeStamp);
                    console.log('The converted time ', lastTime);
                    console.log('The time difference is ', diff);
                    // 60000 = 1 Minute in Milliseconds
                    if (diff > 60000) {
                      console.log('Second Router Image to Attach CRM Case Was More Than 60 Seconds ', diff);
                      Cache.DiagnosticResultSecondRouterImageUploaded = true;
                      Cache.DiagnosticResult_SecondRouterImage = [{
                        filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                      }];
                      console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_SecondRouterImage);
                      await SESSION.SetCache(sessionID, Cache);
                      DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.SecondPhoto.PortSerialNo.NoIR.AttachmentCheck', sessionID, context);
                    } else {
                      console.log('Second Router Image within 60 Secconds');
                      Cache.DiagnosticResultSecondRouterImageUploaded = true;
                      Cache.DiagnosticResult_SecondRouterImage = [...DiagnosticResult_SecondRouterImage, {
                        filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                      }];
                      console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_SecondRouterImage);
                      await SESSION.SetCache(sessionID, Cache);
                      DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.SecondPhoto.PortSerialNo.NoIR.AttachmentCheck', sessionID, msisdn, context);
                    }
                  } else {
                    console.log('Uploading Second Router Image-NO IR');
                    console.log('contentResult', contentResult);
                    Cache.DiagnosticResultSecondRouterImageUploaded = true;
                    Cache.DiagnosticResult_SecondRouterImage = [{
                      filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                    }];
                    console.log('ðŸ˜Š ImageRecognition Body ', Cache.DiagnosticResult_SecondRouterImage);
                    await SESSION.SetCache(sessionID, Cache);
                    DfReply = await DF.Call('IRTR.Network.Fibre.Wifi.UploadRouterPhoto.SecondPhoto.PortSerialNo.NoIR.AttachmentCheck', sessionID, context);
                  }

                }
                break;
              } else {
                console.log('THis is the content resultsss ----- > ', contentResult);
                const currentTime = new Date();
                console.log('This is the current time Ã¢ÂÂ² ', currentTime);
                const lastLocatePayment = Cache.LocatePayment;
                console.log('This is the cached Locate payment ', lastLocatePayment);
                console.log('Ã°Å¸â€œÂ· This is the enterred image url -> ', contentResult.attachments[0].url);
                if (lastLocatePayment) {
                  console.log('Locate Payment exists Ã°Å¸Ââ€ºÃ°Å¸â€™Â°');
                  const lastFileTimeStamp = lastLocatePayment[lastLocatePayment.length - 1].timestamp;
                  const lastTime = new Date(lastFileTimeStamp);
                  const diff = Math.abs(currentTime - lastTime);
                  console.log('The cached timestamp ', lastFileTimeStamp);
                  console.log('The converted time ', lastTime);
                  console.log('The time difference is ', diff);
                  // 60000 = 1 Minute in Milliseconds
                  if (diff > 60000) {
                    console.log('Ã°Å¸Ââ€º Last Image Attachment Was More Than 60 Seconds ', diff);
                    Cache.LocatePayment = [{
                      filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                    }];
                    console.log('LocatePaymnent Body Ã°Å¸Ââ€º', Cache.LocatePayment);
                    await SESSION.SetCache(sessionID, Cache);
                    DfReply = await DF.Call('Attachment.Check', sessionID, context);
                  } else {
                    console.log('Ã°Å¸Ââ€º Image attached within 60 seconds', diff);
                    Cache.LocatePayment = [...lastLocatePayment, {
                      filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                    }];
                    console.log('LocatePaymnent Body Ã°Å¸Ââ€º', Cache.LocatePayment);
                    await SESSION.SetCache(sessionID, Cache);
                    DfReply = await DF.Call('Attachment.Check', sessionID, msisdn, context);
                  }
                } else {
                  console.log('Creating new Locate Payment Ã°Å¸Ââ€ºÃ°Å¸â€™Â°');
                  Cache.LocatePayment = [{
                    filename: contentResult.attachments[0].filename, size: contentResult.attachments[0].size, url: contentResult.attachments[0].url, timestamp: currentTime.toString(), caseCreated: false,
                  }];
                  console.log('LocatePaymnent Body Ã°Å¸Ââ€º', Cache.LocatePayment);
                  await SESSION.SetCache(sessionID, Cache);
                  DfReply = await DF.Call('Attachment.Check', sessionID, msisdn, context);
                }
                break;
              }
            } else if (body.events[0].resource.metadata.body == null && body.events[0].resource.metadata.location) {
              console.log('location--->');
              console.log('coordinates are : ', JSON.stringify(body.events[0].resource.metadata.location));
              Cache.Coordinates = { latitude: body.events[0].resource.metadata.location.latitude, longitude: body.events[0].resource.metadata.location.longitude };
              await SESSION.SetCache(sessionID, Cache);
              console.log('saving it in the RC', Cache.Coordinates);
              DfReply = await DF.Call('Coordinates.Check', sessionID, msisdn, context);
              break;
            } else if (body.events[0].resource.metadata.body != null && body.events[0].resource.metadata.body != 'Hi' && body.events[0].resource.metadata.body != '*' && body.events[0].resource.metadata.body != 'hello' && body.events[0].resource.metadata.has_attachment == false && body.events[0].resource.metadata.location == undefined && body.events[0].resource.metadata.body_input_format == 'text' && (IRLastEvent == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights'
              || IRLastEvent == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_InvalidImage'
              || IRLastEvent == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo'
              || IRLastEvent == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_NoIR'
              || IRLastEvent == 'IRTR_Network_Fibre_Wifi_UploadRouterPhoto_SecondPhoto_PortSerialNo_NoIR')) {
              console.log('âœ”ï¸âœ”ï¸Test IR text >> 1st if loop');

              // if (body.events[0].resource.metadata.body != null && body.events[0].resource.metadata.has_attachment == false && body.events[0].resource.metadata.location==undefined && body.events[0].resource.metadata.body_input_format == "text")
              // {
              console.log('ðŸ¤žðŸ˜’ðŸ˜’ Df Reply after giving invalid input text for ImageRecgniton');
              DfReply = await DF.Call('Shared.Invalid.Input.IR', sessionID, msisdn, context);

              // }
              console.log('âœ”ï¸âœ”ï¸Test IR text >> 2st if loop');
            } else {
              console.log('ðŸ¤ž Df Reply before');
              await SESSION.SetCache(sessionID, Cache);
              console.log('ðŸ› This is the query text in the else scope -> ', queryText);
              if (queryText == null) {
                queryText = 'rondomNumber';
              }
              DfReply = await DF.Call(queryText, sessionID, msisdn, context);
              console.log('ðŸ¤ž Df Reply after');
            }
            console.log(`ðŸ”´ RES ðŸ¤ž Attempt ${i + 1}: [${sessionID}] [${queryText}]`);

            // Ã¢Å“â€¹ TIMEOUT: check if dialog flow reply contains timeout reply
            if (DfReply.webhookStatus != null && (DfReply.webhookStatus.message.includes('DEADLINE_EXCEEDED') || DfReply.webhookStatus.message.includes('UNAVAILABLE'))) {
              console.log(`ðŸš« CALLING TIMEOUT: [${sessionID}] [${queryText}]`);

              if (i == TIMEOUT_RETRY_COUNT - 1) {
                // when max try is up, called shared.webhook.timeout intent
                DfReply = await DF.Call('Shared.Webhook.Timeout', sessionID, msisdn, context);
                break;
              }
            } else if (DfReply.webhookStatus != null && DfReply.webhookStatus.message.includes('INVALID_ARGUMENT')) {
              // sad face will invoke main menu.
              DfReply = await DF.Call(':-(', sessionID, msisdn, context);
              break;
            } else {
              break;
            }
          }

          // new latest changes for sentiment

          console.log('DfReply added in sentiment response', DfReply);
          console.log('sentimentAnalysisResult  ', DfReply.queryResult.sentimentAnalysisResult);

          if (DfReply.queryResult.sentimentAnalysisResult !== null) {
            score = DfReply.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
            magnitude = DfReply.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;

            const valueSentiment = await sentimentCheck.SentimentCheck(DfReply, sessionID);
            if (valueSentiment) {
              console.log('i am in if of RC valueSentiment : ', valueSentiment);
              DfReply = await DF.Call('AgentHandover.Sentiment.AgentAssist.Offer', sessionID, msisdn, context);
            } else {
              console.log('i am in else of RC valueSentiment');
            }
          } else if (DfReply.queryResult.action && DfReply.queryResult.action != 'input.unknown'
            && !DfReply.queryResult.action.includes('fallback')) {
            console.log('agent action name in Rc : ', DfReply.queryResult.action);
            const cacheIntent = await SESSION.GetCache(sessionID);
            cacheIntent.agentAssistIntent = DfReply.queryResult.action;
            await SESSION.SetCache(sessionID, cacheIntent);
          } else {
            score = '';
            magnitude = '';
          }

          // all other methods are referencing DfReply as queryResult
          DfReply = DfReply.queryResult;

          B = performance.now();
          MS_DF_REPLY = B - A;
          //-----------------------------------------------------------------------------------
          // ðŸ‘† DIALOG FLOW:
          // âœ‹ some dialogflow response contains null intent
          if (DfReply.intent != undefined) {
            intentName = DfReply.intent.displayName;
          }
          console.log(`This is the intentname currently -> ${intentName}`);
          await SESSION.SetCurrentIntent(sessionID, intentName)
          const lastIntentSaved = await SESSION.GetLastIntent(sessionID);
          console.log(`This was the last intent saved -> ${lastIntentSaved}`);

          // âœ‹ CONTEXT: not all response contains "outputContexts"
          if ('outputContexts' in DfReply) {
            await SESSION.SetContext(sessionID, DfReply.outputContexts);
          }

          // âœ‹ VALIDATION: Looking for Action to perform validation operation,
          // this is implemented at OC because, not all intents are calling WH
          const actionName = UTIL.GetAction(DfReply);

          if (actionName != undefined) {
            console.log('âš¡ Action found, saving:', actionName);
            await SESSION.SetLastEvent(sessionID, { event: actionName, param: UTIL.GetActionParameters(DfReply) });
          }

          // ðŸ‘‡ RING CENTRAL: pass response fullfillment text to RingCentral
          //------------------------------------------------------------------------------------------------
          A = performance.now();

          // if (DfReply.fulfillmentMessages.length > 0 && DfReply.intent.isFallback == false) {
          // made changes to get 2 responses from fallback intents
          if (DfReply.fulfillmentMessages.length > 0) {
            const messages = DfReply.fulfillmentMessages.filter((e) => e.text.text[0] != '');
            const msgCount = messages.length;
            const isRetryIntent = UTIL.IsContainFallbackMessage(DfReply);

            // for Logging
            botMessage = messages.map((e) => e.text.text[0]).join('|');

            for (let i = 0; i < msgCount; i++) {
              const ignoreIntent = RC.GetIgnoreTranslateResponseList();
              const ignoreTranslate = intentName in ignoreIntent ? RC.IgnoreTranslateResponse(ignoreIntent[intentName], msgCount, i) : false;
              const text = await RC.translateToEng(messages[i].text.text[0], msisdn, sessionID, true, intentName, ignoreTranslate);
              const Cache = await SESSION.GetCache(sessionID);
              let intentNameEnOrBm = '';
              if (intentName == 'Shared.Closure.Entry.Webhook') {
                intentNameEnOrBm = lastIntentSaved;
                console.log(`This is the updated banner intent -> ${intentNameEnOrBm}`);
              } 
              else {
                intentNameEnOrBm = Cache.Language == 1 ? `${intentName}.Bm` : intentName;
              }
              if (intentNameEnOrBm in BANNER && RC.IsShowBanner(intentNameEnOrBm, isRetryIntent)) {
                let attachmentId;
                if ('attachmentId' in DfReply.parameters.fields) {
                  const imgUrl = RC.ShowBanner(BANNER[intentNameEnOrBm], msgCount, i);
                  if (imgUrl != undefined) attachmentId = DfReply.parameters.fields.attachmentId.stringValue;
                }
                else {
                    const bannerOutput = RC.ShowBanner(BANNER[intentNameEnOrBm], msgCount, i);
                    attachmentId = await RC.Attachment(event, bannerOutput);  
                }
                // PDF: check if BANNER[intentNameEnOrBm] ends with pdf, if true call pdf
                if (BANNER[intentNameEnOrBm].toLowerCase().endsWith('.pdf')) {
                  console.log(`ðŸ“ž ðŸ“Ž RingCentral Upload Pdf: [${sessionID}] [${queryText}] [${BANNER[intentNameEnOrBm]}]`);
                  await RC.CallPdf(replyId, attachmentId);
                  await RC.Call(replyId, text);
                } 
                else { // JPG,PNG:
                  if (attachmentId != undefined) console.log(`ðŸ“ž ðŸ“Ž RingCentral Upload Image: [${sessionID}] [${queryText}] [${BANNER[intentNameEnOrBm]}]`);
                  await RC.Call(replyId, text, attachmentId);
                  console.log(`ðŸ“ž RingCentral: [${sessionID}][${queryText}]`);
                }
              } else {
                await RC.Call(replyId, text);
                console.log(`ðŸ“ž RingCentral: [${sessionID}] [${queryText}]`);
              }
            }
          } else {
            console.log('ðŸ¤žTranlsation!!!');
            const text = await RC.translateToEng(DfReply.fulfillmentText, msisdn, sessionID, true);

            // for Logging
            botMessage = text;

            if (text != '' && text != undefined) {
              // await RC.SendText(replyId, text);
              await RC.Call(replyId, text);
              console.log(`ðŸ“ž RingCentral: [${sessionID}] [${queryText}]`);
            }
          }

          // ðŸ‘‡ close the thread when isclosed
          const isClosed = await SESSION.GetClose(sessionID);

          if (isClosed) {
            await RC.Close(threadId);
            await SESSION.SetClose(sessionID, false);
          }

          // ðŸ‘‡ check for handover
          const HandOver = await SESSION.GetHandOver(sessionID);

          if (HandOver != null && HandOver.IsHandOver) {
            console.log('ðŸ‘‰Handover AgentId', HandOver.AgentId);
            const myThreadId = body.events[0].resource.metadata.thread_id;
            const myCategoryIds = body.events[0].resource.metadata.category_ids;
            await RC.HandOver(myThreadId, myCategoryIds, HandOver.AgentId);
            isAgentTransfer = true;
            console.log(`ðŸ¤ HAND-HOVER: [${sessionID}] [${HandOver.AgentId}]`);

            if ('OriginalIntent' in HandOver && HandOver.OriginalIntent != undefined) {
              intentName = HandOver.OriginalIntent;
            }
          } else {
            isAgentTransfer = false;
          }

          B = performance.now();
          MS_RC_REPLY = B - A;

          console.log(`ðŸŸ¥: [${sessionID}] [${queryText}] [${threadId}]`);
        } else {
          console.log(`ðŸ™ˆ IGNORE: Non-Bot Category: [${sessionID}][${queryText}][${threadId}]`);
        }
      }
    }
  } catch (err) {
    console.error(`ðŸ”» Orchestrator Error: [${sessionID}]`, JSON.stringify(err));
  } finally {
    const EndTime = new Date().addHours(8).toUTCString();
    const EndClock = performance.now();
    const Elapsed = `${EndClock - StartClock}ms`;

    if (isLog) {
      queryText = (queryText == null || queryText == undefined) ? 'Image.Recording.Location' : queryText;
      // await LOGGER.WriteReport(messageId, msisdn, queryText, intentName, StartTime, EndTime, isAgentTransfer, threadId, channelName, botMessage);
      const lastIntentSaved = await SESSION.GetLastIntent(sessionID);
      console.log(`This is the last intent saved before logging -> ${lastIntentSaved}`);
      if (intentName == 'Shared.Closure.Entry.Webhook') {
        console.log('Writing to logger in RC', `${channelName}|${messageId}|${queryText}|${lastIntentSaved}|${StartTime}|${EndTime}|${threadId}|${botMessage}|${score}|${magnitude}|${msisdn}`);
        await LOGGER.WriteReport(messageId, channelName, msisdn, queryText, lastIntentSaved, StartTime, EndTime, isAgentTransfer, threadId, botMessage, score, magnitude);
      } else {
        console.log('Writing to logger in RC', `${channelName}|${messageId}|${queryText}|${intentName}|${StartTime}|${EndTime}|${threadId}|${botMessage}|${score}|${magnitude}|${msisdn}`);
        await LOGGER.WriteReport(messageId, channelName, msisdn, queryText, intentName, StartTime, EndTime, isAgentTransfer, threadId, botMessage, score, magnitude);
      }
    }

    // always turn off log flag. this will be turned on at isContainBot above ðŸ‘†
    isLog = false;
  }
};
