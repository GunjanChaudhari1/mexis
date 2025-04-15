const FormData = require('form-data');
const imageToBase64 = require('image-to-base64');

const FETCH = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const moment = require('moment-timezone');
const fs = require('fs');
const https = require('https');
const JIMP = require('jimp');
const PATH = require('path');
const { Util } = require('@google-cloud/storage/build/src/nodejs-common/util');
const { flowRight } = require('lodash');
const request = require('request'); // Roshani TODO: remove library
const tt = require("./translate_txt");

const UTIL = require('./Util');
const HOST = require('./Handler_Host');
const SESSION = require('./Handler_Session');
const DF = require('./Handler_DialogFlow');
const RC = require('./Handler_RingCentral');

const CALLBACKCONTEXT = require('./CallbackContext');


async function predictImageClassification(image, sessionID) {
  console.log('CALL predictImageClassification >> ', sessionID);
  try {
    let Cache = await SESSION.GetCache(sessionID);
    const endpointId = HOST.TARGET == 0 ? '2643934038661791744' : '4034613937658920960';
    const project = HOST.TARGET == 0 ? '246024115590' : '674035654871';
    const location = 'us-central1';
    console.log('project >> ', project);
    console.log('location >> ', location);
    console.log('endpointId >> ', endpointId);

    const aiplatform = require('@google-cloud/aiplatform');
    const { instance, params, prediction } = aiplatform.protos.google.cloud.aiplatform.v1.schema.predict;
    const clientOptions = {
      apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    };
    const { PredictionServiceClient } = aiplatform.v1;

    const endpoint = `projects/${project}/locations/${location}/endpoints/${endpointId}`;
    const parametersObj = new params.ImageClassificationPredictionParams({
      confidenceThreshold: 0.5,
      maxPredictions: 5,
    });

    const parameters = parametersObj.toValue();

    const instanceObj = new instance.ImageClassificationPredictionInstance({
      content: image,
    });
    const instanceValue = instanceObj.toValue();

    const instances = [instanceValue];
    const requests = {
      endpoint,
      instances,
      parameters,
    };

    console.log('Done Vertex AI initialization, Predicting now...', instances);
    console.log('befor PredictionServiceClient >> ');
    const predictionServiceClient = new PredictionServiceClient(clientOptions);
    const [response] = await predictionServiceClient.predict(requests);
    // const predictions = response.predictions;
    const { predictions } = response;
    // Cache['Predictions'] = predictions
    console.log('after PredictionServiceClient >> ');
    console.log('Response >> ', response);
    console.log('Predictions >> ', predictions);
    var predictedArray = [];
    var predictedLabel = [];
    var predictedScore = [];
    for (const predictionValue of predictions) {
      const predictionResultObj = prediction.ClassificationPredictionResult.fromValue(predictionValue);
      for (const [i, label] of predictionResultObj.displayNames.entries()) {
        console.log(`Display name: ${label}`);
        console.log(`Confidences: ${predictionResultObj.confidences[i]}`);
        console.log(`IDs: ${predictionResultObj.ids[i]}\n\n`);
        predictedArray.push([label, predictionResultObj.confidences[i]]);
        predictedLabel.push(label);
        predictedScore.push(predictionResultObj.confidences[i]);
      }
    }
    Cache = await SESSION.GetCache(sessionID);
    Cache.predictionLabel = predictedLabel;
    Cache.predictionData = predictedArray;

    const predictionArrayData = predictedLabel;
    await SESSION.SetCache(sessionID, Cache);
    console.log('Prediction Label >> ', Cache);
    return predictionArrayData;
  }
  catch (err) {
    console.log(err);
    return err;
  }
}

async function base64convert(url) {
  console.log('befor base64image');
  const base64image = await imageToBase64(url);
  console.log(' after base64image >> ', base64image.length);
  return base64image;
}

exports.IRTR_Attachment_Check = async function (event) {
  console.log('IRTR_Attachment_Check >> ');
  const sessionID = event.sessionID;
  const msisdn = await SESSION.GetMSISDN(sessionID);
  let Cache = await SESSION.GetCache(sessionID);
  const imageRecognitionFile = event.imageRecognitionFile;
  console.log(' 🤦‍♀️🤦‍♀️IRTR_Attachment_Check is the IR cache -> ', Cache);
  console.log(' 🤦‍♀️🤦‍♀️IRTR_Attachment_Check is the IR -> ', imageRecognitionFile);

  // Read image
  console.log('😶‍🌫️😶‍🌫️ Upload GCP bucket');

  try {
    console.log(' 😶‍🌫️😶‍🌫️ before 1 Call GCP');
    const file = fs.createWriteStream(`/tmp/${imageRecognitionFile['filename']}`);
    const fetchUrl = imageRecognitionFile['url'];
    console.log('😶‍🌫️😶‍🌫️ 🚗 FETCHURL - > ', fetchUrl);
    await FETCH(fetchUrl)
      .then(
        res =>
          new Promise((resolve, reject) => {
            res.body.pipe(file);
            res.body.on('end', () => resolve('it worked'));
            file.on('error', reject);
          })
      );
    console.log(' 😶‍🌫️😶‍🌫️ before 2 Call GCP');

    /// GCP Bucket CALL Start
    const { Storage } = require('@google-cloud/storage');
    // const storage = new Storage({ keyFilename: './google-cloud-key.json' });
    const storage = new Storage();
    const bucketname = HOST.TARGET == 0 ? 'ir_router' : 'ir_router_prd'; // Stage bucket
    // const bucketname = 'ir_router_prd'; // Prod bucket
    const destFileName = imageRecognitionFile['filename'];
    const filePath = '/tmp/' + imageRecognitionFile['filename'];
    const options = {
      destination: destFileName,
    };
    const res = await storage.bucket(bucketname).upload(filePath, options);

    console.log(' 😶‍🌫️😶‍🌫️ GCP Response >>>>> ', res);
    const mediaFileLink = res[0].metadata.mediaLink;
    const mediaFileName = res[0].metadata.name;
    console.log(' 😶‍🌫️😶‍🌫️ after Call GCP');
    Cache['gcpMediaFileLink'] = mediaFileLink;
    Cache['gcpMediaFileName'] = mediaFileName;
    await SESSION.SetCache(sessionID, Cache);
    /// GCP Bucket CALL End

    // Trigger IR start
    console.log('😶‍🌫️😶‍🌫️ IR Trigger start');
    const image = await base64convert(imageRecognitionFile['url']);
    console.log('This is the length of the image in base64 -> ' + image.length);
    const predictImageResult = await predictImageClassification(image, sessionID);
    Cache = await SESSION.GetCache(sessionID);
    console.log('this is the prediction -> ' + predictImageResult);
    Cache['PredictionImageResult'] = predictImageResult;
    await SESSION.SetCache(sessionID, Cache);
    //logging the values which we need to store GCP-cloudstorage
    Cache = await SESSION.GetCache(sessionID);
    const predictionResults = Cache.predictionData;
    const Score = 0;
    const Imagelink = mediaFileLink;
    const ImageType = predictionResults[0][0] ? predictionResults[0][0] : 'Other';
    const ImageScore = predictionResults[0][1] ? predictionResults[0][1] : Score;
    let RouterStatus = '';
    let RouterStatusScore = null;
    console.log('predictionResult',predictionResults[1]);
    if (predictionResults[1]) {
      RouterStatus = predictionResults[1][0] ? predictionResults[1][0] : 'Other';
      RouterStatusScore = predictionResults[1][1] ? predictionResults[1][1] : Score;
    } else {
      RouterStatus = 'Other';
      RouterStatusScore = 0;
    }
    const folderName = 'Database'
    const filename = 'Prediction_result.csv'
    const File = storage.bucket(bucketname).file(`${folderName}/${filename}`);
    const stream = File.createReadStream();
    let data = '';
    stream.on('data', chunk => {
      data += chunk;
    });
    stream.on('end', () => {
      const now = new Date();
      const timezone = 'Asia/Kuala_Lumpur'
      const offset = moment().tz(timezone).utcOffset();
      now.setMinutes(now.getMinutes() - offset)
      const formattedDate = now.toLocaleDateString();
      const formattedTime = now.toLocaleTimeString();
      console.log('Current Date & Time',formattedDate , formattedTime);
      const dataStorage = { 
        col1: Imagelink, 
        col2: ImageType, 
        col3: ImageScore, 
        col4: RouterStatus, 
        col5: RouterStatusScore 
      };
      const csv = `${formattedDate}, ${formattedTime}, ${dataStorage.col1}, ${dataStorage.col2}, ${dataStorage.col3}, ${dataStorage.col4}, ${dataStorage.col5}\n`
      data += csv;
      //Write updated data to file
      const writeStream = File.createWriteStream({
        metadata: {
          contentType: 'text/csv',
        },
        //Set option to append to file instead of overwritting
        append: true,
      });
      writeStream.write(data);
      writeStream.end()
    });
    const queryTextValue = 'IRTR.FristRouterImage.IR.API.Start';
    const context = await SESSION.GetContext(sessionID);
    const replyId = await SESSION.getMessageId(sessionID);
    const DfReply = await DF.Call(queryTextValue, sessionID, msisdn, context);
    console.log('DfReply=====>', JSON.stringify(DfReply));
    const messages = DfReply['queryResult']['fulfillmentMessages'].filter(e => e.text.text[0] != '');
    console.log('messages >> ', messages);
    await SESSION.SetContext(event.sessionID, DfReply['queryResult']['outputContexts']);
    let text = '';
    if (messages[0].text.text[0] !== undefined) {
      // text = messages[0].text.text[0];
      const textTemp = messages[0].text.text[0];
      text = textTemp;
    }
    console.log('message >> ', text);
    console.log('message length >> ', messages.length);
    console.log('messages---->', messages, JSON.stringify(messages));
    console.log('messages.length >> ', messages.length);
    const msgCount = messages.length;
    for (let i = 0; i < msgCount; i++) {
      const texts = messages[i].text.text[0];
      await RC.Call(replyId, texts);
      console.log(`📞 RingCentral: [${event.msisdn}]`);
    }
  } catch (err) {
    console.log('IR error >> ', err);
    return UTIL.ComposeResult('', 'Shared_Tech_IssueServicing');
  }
};

async function createCase(body) {
  const url = `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case`;

  const head = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'channel': 'MAXBOT', 'uuid': '123123' }
  };

  const data = await UTIL.GetUrl(url, head);
  return data.responseData;
}

async function CaseAttachment(caseId, imageName) {
  console.log('Case ID >> ', caseId, ' Image Name >> ', imageName);
  const formdata = new FormData();
  formdata.append('attachmentTitle', 'MyTitle');
  formdata.append('attachmentDescription', 'MyDescription');
  formdata.append('file', fs.createReadStream(`/tmp/${imageName}`));

  const requestOptions = {
    method: 'POST',
    headers: { channel: 'MAXBOT', languageid: 'en-US' },
    body: formdata,
    redirect: 'follow',
  };

  const fetchData = await FETCH(
    `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/${caseId}/attachment`,
    requestOptions
  );
  const getResponse = await fetchData.text();
  console.log('getResponse', getResponse);
  return getResponse;
}

// Roshani: 15/12/2022 -> 8. Case create for perform a diagnostic test = NO
async function caseCreateAddAttachment(caseId, image, Cache) {
  console.log('Image >> ', image);
  console.log('Cache >> ', Cache);

  //   let filename = image[0].filename
  const { filename } = image[0];
  const file = fs.createWriteStream(`/tmp/${filename}`);

  if (image[0]) {
    const fetchUrl = image[0].url;
    console.log('🚗 FETCHURL - > ', fetchUrl);
    await FETCH(fetchUrl)
      .then(
        res =>
          new Promise((resolve, reject) => {
            res.body.pipe(file);
            res.body.on('end', () => resolve('it worked'));
            file.on('error', reject);
          })
      );
    // console.log('CaseID >> ', caseId, " FileName >> ", filename)
    const Result = await CaseAttachment(caseId, filename);
    return Result;
  } else {
    console.log('success else');
    followupevent = 'Shared_Tech_IssueServicing';
    return UTIL.ComposeResult('', followupevent);
  }
}

async function CaseAttachmentNoIR(caseId, imageName) {
  console.log('Case ID >> ', caseId, ' Image Name >> ', imageName);
  const formdata = new FormData();
  formdata.append('attachmentTitle', 'MyTitle');
  formdata.append('attachmentDescription', 'MyDescription');
  formdata.append('file', fs.createReadStream(`/tmp/${imageName}`));

  const requestOptions = {
    method: 'POST',
    headers: { channel: 'MAXBOT', languageid: 'en-US' },
    body: formdata,
    redirect: 'follow',
  };
  const fetchData = await FETCH(
    `${HOST.CASE[HOST.TARGET]}/case/api/v4.0/case/${caseId}/attachment`,
    requestOptions,
  );
  const getResponse = await fetchData.text();
  console.log('getResponse', getResponse);
  return getResponse;
}

// Roshani: 15/12/2022 -> 6

// Roshani: 15/12/2022 -> 7. Attaching file to Case ID
exports.IRTR_AddAttachment_ToCaseID = async function (event) {
  console.log('🤙🤙 CALL IRTR_AddAttachment_ToCaseID >> ');

  const casebody = event.casebody;
  const msisdn = event.msisdn;
  const trueIntent = event.trueIntent;
  const falseIntent = event.falseIntent;
  const sessionID = event.sessionID;
  console.log('casebody, msisdn, trueIntent, falseIntent, sessionID', casebody, msisdn, trueIntent, falseIntent, sessionID);

  const Cache = await SESSION.GetCache(sessionID);

  console.log('🖨️🖨️ Cache >> ', Cache);

  let imageRecognitionFile = '';
  let SecondRouterImageFile = '';

  if (Cache.ImageRecognition && Cache.DiagnosticResult_SecondRouterImage_IR) {
    console.log('If block..........');
    // imageRecognitionFile = Cache.ImageRecognition[0];
    const imageRecognitionFileTemp = Cache.ImageRecognition[0];
    imageRecognitionFile = imageRecognitionFileTemp;
    console.log('imageRecognitionFile >> ', imageRecognitionFile);
    // SecondRouterImageFile = Cache.DiagnosticResult_SecondRouterImage_IR[0]
    const SecondRouterImageFileTemp = Cache.DiagnosticResult_SecondRouterImage_IR[0];
    SecondRouterImageFile = SecondRouterImageFileTemp;
    console.log('SecondRouterImageFile >> ', SecondRouterImageFile);
  } else {
    console.log('else block....................');
    // imageRecognitionFile = Cache.DiagnosticResult_FirstRouterImage[0]
    const imageRecognitionFileTemp = Cache.DiagnosticResult_FirstRouterImage[0];
    imageRecognitionFile = imageRecognitionFileTemp;
    console.log('imageRecognitionFile >> ', imageRecognitionFile);
    // SecondRouterImageFile = Cache.DiagnosticResult_SecondRouterImage[0]
    const SecondRouterImageFileTemp = Cache.DiagnosticResult_SecondRouterImage[0];
    SecondRouterImageFile = SecondRouterImageFileTemp;
    console.log('SecondRouterImageFile >> ', SecondRouterImageFile);
  }

  console.log('🖨️🖨️ imageRecognitionFile >> ', imageRecognitionFile);
  console.log('SecondRouterImageFile >> ', imageRecognitionFile);

  const caseResult = await createCase(casebody);

  console.log('🖨️ caseResult >>> ', caseResult);

  let queryTextValue = '';

  let finalResult = '';

  if ('caseId' in caseResult) {
    Cache['caseCreated'] = true;
    Cache['imageArray'] = [imageRecognitionFile, SecondRouterImageFile];
    if (Cache['imageArray']) {
      Cache['routerImageUploaded'] = true;
    } else {
      Cache['routerImageUploaded'] = false;
    }

    await SESSION.SetCache(sessionID, Cache);
    console.log('Before Cache >> ', Cache);

    let ResultFirstImage = '';
    let ResultSecondImage = '';

    if (Cache.ImageRecognition && Cache.DiagnosticResult_SecondRouterImage_IR) {
      console.log('If block..........');
      ResultFirstImage = await caseCreateAddAttachment(caseResult.caseId, Cache.ImageRecognition, Cache);
      console.log('JSON RESULT 11 >> ', JSON.parse(ResultFirstImage));

      ResultSecondImage = await caseCreateAddAttachment(caseResult.caseId, Cache.DiagnosticResult_SecondRouterImage_IR, Cache);
      console.log('JSON RESULT 22 >> ', JSON.parse(ResultSecondImage));
    } else if (Cache.No_IR_FirstImageUp_Invalid === true) {
      console.log('Second Image is not uploaded with Diagnostic Results');
      ResultFirstImage = await caseCreateAddAttachment(caseResult.caseId, Cache.DiagnosticResult_FirstRouterImage, Cache);
      console.log('JSON RESULT 11 >> ', JSON.parse(ResultFirstImage));
    } else {
      console.log('else block....................');
      ResultFirstImage = await caseCreateAddAttachment(caseResult.caseId, Cache.DiagnosticResult_FirstRouterImage, Cache);
      console.log('JSON RESULT 11 >> ', JSON.parse(ResultFirstImage));

      ResultSecondImage = await caseCreateAddAttachment(caseResult.caseId, Cache.DiagnosticResult_SecondRouterImage, Cache);
      console.log('JSON RESULT 22 >> ', JSON.parse(ResultSecondImage));
    }

    if (JSON.parse(ResultFirstImage).status == 'success' && JSON.parse(ResultSecondImage).status == 'success') {
      console.log('success if caseCreateAddAttachment >> ');
      finalResult = 'success';
      queryTextValue = event.trueIntent;
    } else {
      console.log('fail else caseCreateAddAttachment >> ');
      finalResult = 'fail';
      queryTextValue = event.falseIntent;
    }
  } else {
    console.log('Case note created >> ');
    finalResult = 'fail';
    queryTextValue = event.falseIntent;
  }


  console.log('queryTextValue >> ', queryTextValue);
  console.log('caseResult.caseId >> ', caseResult.caseId);
  const replyId = await SESSION.getMessageId(event.sessionID);
  if (queryTextValue === 'IRTR.Network.Fibre.Wifi.DiagnosticCheck.Result.UploadRouterPhoto.AgentAssist') {

    followupevent = 'IRTR_Network_Fibre_Wifi_DiagnosticCheck_Result_UploadRouterPhoto_AgentAssist';

    let text1 = `Got it! I've notified our team and you will be contacted within our ops hours from 8.00am to 10.00pm to assist you further. Please look out for their call.\n\nHere's your case number ${caseResult.caseId} \nYou can also view the case progress from our Maxis Care portal https://care.maxis.com.my. \nThanks.`;

    let text2 = 'Would you like to explore the other products and services we have to offer?\n\n1️⃣ Continue exploring\n2️⃣ Not right now. Thanks \n*️⃣ Go back to the main menu\n\nTo continue, just select a number from the list';
    const { caseId } =caseResult;
    await SESSION.SetLastEvent(event.sessionID, {
      event: followupevent,
      param: { caseId },
    });
    await SESSION.SetContext(
      event.sessionID,
      CALLBACKCONTEXT.EXPLORE_OTHER_SERVICES[CALLBACKCONTEXT.TARGET]

    );

    // Hanlde BM language response
    if (Cache["Language"] === 1) {
      text1 = await tt.translateText(text1, "en", "ms")
      text2 = await tt.translateText(text2, "en", "ms")
    }

    await RC.Call(replyId, text1);
    await RC.Call(replyId, text2);
    console.log(`📞 RingCentral: [${event.msisdn}]`);
  } else {
    context = await SESSION.GetContext(event.sessionID);

    const DfReply = await DF.Call(queryTextValue, event.sessionID, event.msisdn, context);
    console.log('DfReply=====>', JSON.stringify(DfReply));
    const messages = DfReply['queryResult']['fulfillmentMessages'].filter(e => e.text.text[0] != '');
    await SESSION.SetContext(event.sessionID, DfReply['queryResult']['outputContexts']);
    let text = '';
    if (messages[0].text.text[0] !== undefined) {
      // text = messages[0].text.text[0];
      const textTemp = messages[0].text.text[0];
      text = textTemp;
    }
    console.log('message >> ', text);
    console.log('message length >> ', messages.length);
    console.log('messages---->', messages, JSON.stringify(messages));
    console.log('messages.length >> ', messages.length);
    // let text = messages[0].text.text[0];
    await RC.Call(replyId, text);
    console.log(`📞 RingCentral: [${event.msisdn}]`);
  }

  if (finalResult == 'success') {
    console.log('going in if loop IR true handover');
  } else {
    const HandOver = await SESSION.GetHandOver(event.sessionID);
    if (HandOver != null && HandOver.IsHandOver) {
      let catgoryIds = null;
      const url = `https://maxis.api.engagement.dimelo.com/1.0/content_threads/${event.sessionID}?access_token=${UTIL.RC_ACCESS_TOKEN}`;
      const head = { method: 'GET' };
      const data = await UTIL.GetUrl(url, head);
      if (data) {
        catgoryIds = data.category_ids;
      }
      await RC.HandOver(event.sessionID, catgoryIds, HandOver.AgentId);
      isAgentTransfer = true;
      console.log(`🤝 HAND-HOVER: [${event.sessionID}] [${HandOver.AgentId}]`);
    }
  }
};



exports.noIR_addAttachement = async function (event) {
  const { sessionID } = event;
  const { caseId } = event;
  const { msisdn } = event;
  const Cache = await SESSION.GetCache(sessionID);
  const FirstRouterImageFile = Cache.DiagnosticResult_FirstRouterImage[0];
  const { filename } = FirstRouterImageFile;
  if (FirstRouterImageFile) {
    const file = fs.createWriteStream(`/tmp/${filename}`);
    console.log('👓filename>>>', file);
    const fetchUrl = FirstRouterImageFile.url;
    console.log('🚗 FETCHURL - > ', fetchUrl);
    await FETCH(fetchUrl)
      .then(
        res =>
          new Promise((resolve, reject) => {
            res.body.pipe(file);
            res.body.on('end', () => resolve('it worked'));
            file.on('error', reject);
          }),
      );
    const Result = await CaseAttachmentNoIR(caseId, filename);
    const context = await SESSION.GetContext(sessionID);
    const lastIntent = await SESSION.GetLastIntent(sessionID);
    console.log('lastIntent>>>>>>>>>', lastIntent);
    const queryTextValue = lastIntent;
    const DfReply = await DF.Call(queryTextValue, sessionID, msisdn, context);
    console.log('DfReply=====>', JSON.stringify(DfReply));
    console.log('Output context============>', JSON.stringify(DfReply['queryResult']['outputContexts']));
    // const messages = DfReply['queryResult']['fulfillmentMessages'].filter(e => e.text.text[0] != '');
    await SESSION.SetContext(sessionID, DfReply['queryResult']['outputContexts']);

    return Result;
  } else {
    console.log('🔻file not found');
    return false;
  }


};
