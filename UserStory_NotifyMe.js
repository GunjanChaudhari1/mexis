const UTIL = require("./Util");
const SESSION = require("./Handler_Session");
const HOST = require("./Handler_Host");
const redis = require('redis');
const redisCache = require('./CacheConstants');
const redisData = require('./CacheUtil');
const DF = require("./Handler_DialogFlow");
const RC            = require("./Handler_RingCentral");
const { SES } = require("aws-sdk");
const { MD5 } = require("crypto-js");
const FALLBACK_MESSAGE_SALES = process.env.FALLBACK_MESSAGE_SALES;

async function notifyMeAPI(name,skuId,mobileNumber,email,lowerBrand,modelName,capacity,colour,imagePath,aselection,category) {

  let url = `${HOST.NOTIFY_ME[HOST.TARGET]}`;
  let linkUrl=""
  if (HOST.TARGET == 0) {
    header = {"Accept": "application/json, text/plain, /","content-type":"application/json","channel":"chatbot","x-apigw-api-id":"goiwi3vpib", "x-api-key":"6badd2d9-6fdf-49b2-bc79-d67534feb7e3"};
    if (aselection==4) {
      linkUrl = `http://d1x3lgvt4o8f7h.cloudfront.net/productdetails/category/${category}/${lowerBrand}/${modelName}?Channel=chatbot`
    } else if (aselection==3) {
      //   let lowerModel = await UTIL.convertBrandModeltoModel(lowerBrand,model);
      linkUrl = `http://d3o4kqj8excmsv.cloudfront.net/devicedetails/category/${modelName}/${lowerBrand}/${modelName}?Channel=chatbot`
    }
  } else {
    if (aselection==4) {
      linkUrl = `https://store.maxis.com.m/productdetails/category/${category}/${lowerBrand}/${modelName}?channel=chatbot`
    } else if (aselection==3) {
      //   let lowerModel = await UTIL.convertBrandModeltoModel(lowerBrand,model);
      linkUrl = `https://store.hotlink.com.my/devicedetails/category/${lowerModel}/${lowerBrand}/${modelName}?channel=chatbot`
    }
    header = {"Accept": "application/json, text/plain","content-type":"application/json","channel":"chatbot","x-apigw-api-id":"a8pdjulkwe", "x-api-key":"81a71a2e-86ca-4f9c-a842-4a073e586802"};
  }
  let head = {
    "headers": header,
    "method" : "POST",
    "body": JSON.stringify( {
      "orderType": "NOTIFY-ME",
      "skuId": skuId,
      "name": name,
      "mobileNumber": mobileNumber,
      "email": email,
      "device": lowerBrand,
      "model": modelName,
      "capacity": capacity,
      "colour": colour,
      "imagePath": imagePath,
      "linkUrl": linkUrl
    })
  };

  let data   = await UTIL.GetUrl(url,head);
  return data;
}

exports.DiscoverMaxisProductServices_CheckDeviceStock_NotifyMe = async function (event) {
  try {
    let inputMsisdn  = UTIL.GetParameterValue(event,"mobileNumber");
    let sessionID = UTIL.GetSessionID(event);
    await SESSION.SetMSISDN(sessionID, inputMsisdn)
    let msisdn = UTIL.GetMSISDN(event);
    if (msisdn == process.env.MSISDN) {
      msisdn = await SESSION.GetMSISDN(sessionID)
    }
    let Cache = await SESSION.GetCache(sessionID);
    let name= UTIL.GetParameterValue(event, "name");
    let skuId = Cache["sku_id"];
    let email = UTIL.GetParameterValue(event, "email");
    let device = Cache["SelectedBrand"];
    console.log(device)
    let lowerBrand = device.toLowerCase()
    //   let lowerBrand = lowerbrandStr.replace(/ /g, "-")
    let model = Cache["SelectedModel"];
    console.log(model)
    let modelName = model.toLowerCase()
    modelName =modelName.replace(device,"")
    modelName = modelName.replace("-", " ")
    modelName = modelName.trim()
    modelName =modelName.replace(/ /g,"-")
    let capacity = Cache["SelectedCapacity"];
    let colour = Cache["SelectedColor"];
    let imagePath = Cache["image_path"];
    let aselection = Cache["aselection"];
    let bselection = Cache["bselection"];
    console.log(bselection);
    let category="";
    switch (parseInt(bselection)) {
      case 1:
        category = 'mobiles';
        break;
      case 2:
        category = 'tablets';
        break;
      case 3:
        category = 'wearables';
        break;
      default:
        console.log(bselection);
        break;
    }
    console.log(category)
    let counter=0;
    let returnEvent=""
    for (let i=0; i<3;i++) {
      let notifyMe = await notifyMeAPI(name,skuId,msisdn,email,lowerBrand,modelName,capacity,colour,imagePath,aselection,category);
      counter = counter +1;

      if (notifyMe.message == 'success') { // 4.6
        returnEvent = "CheckDeviceStock_AcceptNotifyMe_UpdateOnlineStoreDB";
        console.log(returnEvent);
        break;
      } else if (notifyMe.status == 'fail') {
        console.log("🔻Error encountered while hitting the API out");
        if (counter==3) {
          console.log("🔻Error encountered while hitting the API");
          returnEvent = "Shared_Tech_IssueServicing";
          break;
        }
      }
    }
    return UTIL.ComposeResult("",returnEvent);
  } catch (err) {
    console.log("error handling flow triggered");
    console.log(err);
    return UTIL.ComposeResult("", "Shared_Tech_IssueServicing");
  }
};
