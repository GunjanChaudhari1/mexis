const UTIL = require("./Util");
const SESSION = require("./Handler_Session");

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-southeast-1' });

const S3 = new AWS.S3();
const tt = require("./translate_txt");
const BOT_ID = "5da4698552672234bb57129a";


//👇 method to send back text message to Ring Central

//------------------------------------------------------------------------------------------------
exports.GetContentData = async function (contentId) {
  let data = undefined;
  try {
    let url = `https://maxis.api.engagement.dimelo.com/1.0/contents/${contentId}?access_token=${UTIL.RC_ACCESS_TOKEN}`;
    data = await UTIL.GetUrl(url);

  }
  catch (err) {
    console.error("🔻 ERROR: Ring Central Close", err)
    data = undefined
  }

  return data;
}

exports.GoodBye = async function (replyId, displayName, language) {
  try {
    let text = `I did not get a response from you so I will end this conversation. See you again!`;

    if (language == 1) {
      text = await tt.translateText(text, "en", "ms");
      console.log("Bye bye in malay: ", text);
    }

    //let text = `I haven't heard from you in a while ${displayName == undefined ? "" : displayName} so I’m going to say bye for now.`;
    let url = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&body=${encodeURIComponent(text)}`;
    let head = { "method": "POST" };
    let data = await UTIL.GetUrl(url, head);
  }
  catch (err) {
    console.error("GoodBye Error 🔻", JSON.stringify(err));
  }

  return true;
}

exports.GoodByeWithLink = async function (replyId, displayName, language, link, closureType) {
  try {
    let text1 = `I did not get a response from you so I will end this conversation. See you again!`;
    let text2 = `Please take a minute and let us know how your experience was\n${link}`
    let text3 = ``
    let bannerName = ``
    let attachmentId = ''

    console.log("This is the closureType -> " + closureType)

    if (closureType == "Maxis"){
      bannerName = 'Banner04-3.jpg'
      text3 = "To enjoy all-in-one access to your accounts and exclusive deals login to our Maxis application today.\n\niOS:\nhttps://apps.apple.com/my/app/mymaxis-app/id945986209\n\nAndroid:\nhttps://play.google.com/store/apps/details?id=com.maxis.mymaxis\n\nHuawei:\nhttps://appgallery.huawei.com/#/app/C101132897?appId=C101132897&source=appshare&subsource=C101132897"
    }
    else if (closureType == "Hotlink"){
      bannerName = 'Banner05-3.jpg'
      text3 = "To enjoy all-in-one access to your accounts and exclusive deals login to our Hotlink Postpaid application today.\n\niOS:\nhttps://apps.apple.com/my/app/hotlink/id920042643\n\nAndroid:\nhttps://play.google.com/store/apps/details?id=my.com.maxis.hotlink.production&hl=en&gl=US\n\nHuawei:\nhttps://appgallery.huawei.com/#/app/C100424301"
    }
    else if (closureType == "Prepaid"){
      bannerName = 'Banner06-3.jpg'
      text3 = "To enjoy all-in-one access to your accounts and exclusive deals login to our Hotlink application today.\n\niOS:\nhttps://apps.apple.com/my/app/hotlink/id920042643\n\nAndroid:\nhttps://play.google.com/store/apps/details?id=my.com.maxis.hotlink.production&hl=en&gl=US\n\nHuawei:\nhttps://appgallery.huawei.com/#/app/C100424301"
    }

    if (language == 1) {
      console.log("Translating Closing Message...")
      text1 = await tt.translateText(text1, "en", "ms");
      text2 = await tt.translateText(text2, "en", "ms");
      if (closureType == "Maxis" || closureType == "Hotlink" || closureType == "Prepaid"){
        text3 = await tt.translateText(text3, "en", "ms");
        bannerName = convertBannerToBm(bannerName);
      }
      else{
        console.log("Not translating text 3 for OLO")
      }
      console.log("Bye bye in malay: ", text1 + text2);
    }

    if (closureType == "OLO"){
      console.log("Handler RC | GoodByeWithLik | No attachment for OLO");
    }
    else{
      attachmentId = await customSetAttachmentId(null, bannerName);
      console.log(`Handler RC | GoodByeWithLik | attachmentId: ${attachmentId}`);
    }

    //let text = `I haven't heard from you in a while ${displayName == undefined ? "" : displayName} so I’m going to say bye for now.`;
    let url1 = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&body=${encodeURIComponent(text1)}`;
    let url2 = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&body=${encodeURIComponent(text2)}`;
    let url3Banner = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&attachment_ids[]=${attachmentId}`;
    let url3 = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&body=${encodeURIComponent(text3)}`;
    let head = { "method": "POST" };
    
    if (closureType == "OLO"){
      console.log("OLO Closing Message")
      await UTIL.GetUrl(url1, head);
      await UTIL.GetUrl(url2, head);
    }
    else{
      console.log("Non-OLO Closing Message")
      await UTIL.GetUrl(url1, head);
      await UTIL.GetUrl(url2, head);
      await UTIL.GetUrl(url3Banner, head);
      await UTIL.GetUrl(url3, head);
    }
  }
  catch (err) {
    console.error("GoodBye Error 🔻", JSON.stringify(err));
  }

  return true;
}

async function customSetAttachmentId(event, imgUrl = undefined){
  let FormData = require('form-data');
  console.log("Handler RC | customSetAttachmentId | imgUrl: ", imgUrl);
  if (imgUrl != undefined) {
    try {
      let img = await S3.getObject(
        {
          Bucket: process.env.S3_BUCKET,
          Key: imgUrl,
        }).promise();

        console.log(`Handler RC | customSetAttachmentId | img resp: ${JSON.stringify(img)}`)

      let url = `https://maxis.api.engagement.dimelo.com/1.0/attachments?access_token=${UTIL.RC_ACCESS_TOKEN}`;
      let form = new FormData();
      form.append('file', img.Body, { filename: imgUrl });

      let attachment = await UTIL.GetUrl(url, { "method": "POST", "body": form });
      return attachment.id;
    }
    catch (err) {
      console.error("ðŸ”» RingCentral: Attachment Error for " + imgUrl, err);
      return undefined;
    }
  }
  else {
    return undefined;
  }
}

function convertBannerToBm(bannerName){
  let bmBannerName = '';
  try {
    bmBannerName = bannerName.replace("Banner","Banner_Bm");
    console.log(`Handler RC | convertBannerToBm | bmBannerName: ${JSON.stringify(bmBannerName)}`)

    //special case for Maxis BM
    if(bmBannerName == 'Banner_Bm04-3.jpg'){
      bmBannerName = 'Banner_Bm04-3.png'
    } 
    
  } catch (error) {
    console.log(`Handler RC | convertBannerToBm | CATCH: ${JSON.stringify(error)}`)
  }
  return bmBannerName;
}

exports.Close = async function (threadId) {

  try {
    let url = `https://maxis.api.engagement.dimelo.com/1.0/content_threads/${threadId}/close?access_token=${UTIL.RC_ACCESS_TOKEN}`;
    let head = { "method": "PUT" };
    let data = await UTIL.GetUrl(url, head);
    console.log(`✂ Closed [${threadId}]`);

  }
  catch (err) {
    console.error("🔻 ERROR: Ring Central Close", JSON.stringify(err))
  }

  return true;
}
async function Call(replyId, text = undefined, attachment = undefined) {
  try {
    let url = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}`;

    if (text != undefined && text != "") {
      url += `&body=${encodeURIComponent(text)}`;
    }

    if (attachment != undefined && attachment != "") {
      url += `&attachment_ids[]=${attachment}`;
    }

    console.log("RC URL: ", url);
    let head = { "method": "POST" };
    let response = await UTIL.GetUrl(url, head);
    console.log("Ringcentral invocation response: ", response);
  }
  catch (err) {
    console.error("ðŸ”» ERROR: Ring Central Call", JSON.stringify(err))
  }

  return true;
}

exports.SendText = async function (replyId, text) {
  await Call(replyId, text);
}

exports.Call = async function (replyId, text, attachment = undefined) {
  // let replyId = exports.GetReplyId(event);
  console.log(`attachment=>>>${attachment}, replyId>>>>${replyId}`);
  try {
    let url = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&body=${encodeURIComponent(text)}`;

    if (attachment != undefined && attachment != "") {
      console.log(`true attachment**********************`);
      let urlImage = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&body=${encodeURIComponent("")}&attachment_ids[]=${attachment}`;
      let head = { "method": "POST" };
      await UTIL.GetUrl(urlImage, head);
      url = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&body=${encodeURIComponent(text)}`;
    }

    let head = { "method": "POST" };
    await UTIL.GetUrl(url, head);
  } catch (err) {
    console.error("ðŸ”» ERROR: Ring Central Call", err)
  }

  return true;
}

exports.CallPdf = async function (replyId, attachment) {
  try {
    let url = `https://maxis.api.engagement.dimelo.com/1.0/contents?access_token=${UTIL.RC_ACCESS_TOKEN}&in_reply_to_id=${replyId}&attachment_ids[]=${attachment}`;

    let head = { "method": "POST" };
    await UTIL.GetUrl(url, head);
  } catch (err) {
    console.error("🔻 ERROR: Ring Central Call", JSON.stringify(err))
  }

  return true;
}

function GetAuthorId(body) {
  return body.events[0].resource.metadata.author_id;
}

exports.GetAuthorId = function (body) {
  return body.events[0].resource.metadata.author_id;
}

exports.GetIdentity = async function (body) {
  let author_id = GetAuthorId(body);
  try {
    let url = `https://maxis.api.engagement.dimelo.com/1.0/identities/${author_id}?access_token=${UTIL.RC_ACCESS_TOKEN}`;
    data = await UTIL.GetUrl(url);
    data = "mobile_phone" in data ? data : undefined;
  } catch (err) {
    console.error("🔻 ERROR: Ring Central GetIdentity", JSON.stringify(err))
    data = undefined;
  }
  return data;
}

// 👇 helper method to get Intent object from fullfillment request
//------------------------------------------------------------------------------------------------
exports.GetReplyId = function (body) {
  return body.events[0].resource.id;
}

exports.GetThreadId = function (body) {
  return body.events[0].resource.metadata.thread_id;
}

exports.GetSourceId = function (body) {
  return body.events[0].resource.metadata.source_id;
}

exports.IsContainBOT = function (body) {
  let categories = body.events[0].resource.metadata.category_ids;
  console.log("IsContainBOT ringcentral categories :", categories)
  // 👇 check if categories contain BOT Id
  return categories.includes(BOT_ID); // update catID
  // return categories.some( i => BOT_ID.includes(i) )
  // return true;
}

function GetIgnoreTranslateInputList() {
  return ["MultiCampaign.SmeGrant.En.Q1.Yes.Wh", "MultiCampaign.SmeGrant.En.Q1.No.Wh",
    "MultiCampaign.SMEGrant.Q1.No", "MultiCampaign.SMEGrant.Q1.Yes",
    "Billing.BillStatementRequest.QueryEBill.No.BillCharged.Start",
    "ProactiveCaseUpdate.AgentHandover.CustomerServiceQuery",
    "Billing.BillStatementRequest.QueryEBill.QueryMonth"];
  // }
}

exports.translateToEng = async function (rawText, msisdn, sessionID, response, intent, ignoreTranslate = false) {
  let Cache = await SESSION.GetCache(sessionID);
  let isTranslate = Cache.Language; // language can be 0 for eng or 1 for bm
  console.log("Language Selected: 0 for ENG and 1 BM: ", isTranslate);
  if (isTranslate) {
    if (isNaN(rawText)) {
      if (response) {
        console.log("Translated to BM", rawText);
        if (ignoreTranslate) {
          console.log("This is the current intent detected if its in ignore do not translate response!!", intent);
          return rawText;
        }
        else {
          let translatedText = await tt.translateText(rawText, "en", "ms");
          return translatedText;
        }
      }
      else {
        console.log("Translated to EN", rawText);
        var ignoreList = GetIgnoreTranslateInputList()
        if (ignoreList.includes(intent)) {
          console.log("This is the last intent executed if its in ignore then do not translate input!!", intent);
          return rawText;
        }
        else {
          let translatedText = await tt.translateText(rawText, "ms", "en");
          return translatedText;
        }
      }
    }
    else {
      console.log("No Translation", rawText);
      return rawText;
    }
  }
  else {
    // set default value as 0
    // Don't set if session is new else it wont give bye bye message
    console.log(Cache);
    console.log("Dont set default langyuage here!!!")
    return rawText;

  }
}

exports.GetQueryText = async function (body) {
  if (body.events[0].resource.metadata.body !== null) {
    return body.events[0].resource.metadata.body.substr(0, 255);    //👈 truncate to 255 characters
  } else {
    return body.events[0].resource.metadata.body;    //👈 truncate to 255 characters
  }

}

exports.HandOver = async function (threadId, existingCatIds, agentId) {
  console.log(`🙋‍♂️ HAND OVER: Thread ID [${threadId}]`);
  //get existing NON-BOT category ids and append to handover category ids
  existingCatIds = existingCatIds.filter(e=>e != BOT_ID);  
  
  console.log("IsContainBOT ringcentral agentId :", agentId)
  console.log("IsContainBOT ringcentral existingCatIds :", existingCatIds)

  let catId = agentId.split(",")
  catId = catId.concat(existingCatIds);
  catId = [...new Set(catId)];
  catId = catId.map(e => "&thread_category_ids[]=" + e).join("");

  console.log("IsContainBOT ringcentral catId :", catId)

  let url = `https://maxis.api.engagement.dimelo.com/1.0/content_threads/${threadId}/update_categories?access_token=${UTIL.RC_ACCESS_TOKEN}${catId}`;
  let head = { method: "PUT" };

  try {
    await UTIL.GetUrl(url, head);
    console.log(`🧺 Session deleted due to handover: [${threadId}]`);
    await SESSION.DeleteSession(threadId);
    await SESSION.DeleteProfile(threadId);
    console.log(`🧺 Profile and Session after deleted due to handover: [${threadId}]`);
  }
  catch (err) {
    console.error("ðŸ”» ERROR: Handover RingCentral Call or Session", err);
  }
}

exports.Attachment = async function (event, imgUrl = undefined) {
  let FormData = require('form-data');
  console.log("imgUrl: ", imgUrl);
  if (imgUrl != undefined) {
    try {
      let img = await S3.getObject(
        {
          Bucket: process.env.S3_BUCKET,
          Key: imgUrl,
        }).promise();

      let url = `https://maxis.api.engagement.dimelo.com/1.0/attachments?access_token=${UTIL.RC_ACCESS_TOKEN}`;
      let form = new FormData();
      form.append('file', img.Body, { filename: imgUrl });

      let attachment = await UTIL.GetUrl(url, { "method": "POST", "body": form });
      return attachment.id;
    }
    catch (err) {
      console.error("ðŸ”» RingCentral: Attachment Error for " + imgUrl, err);
      return undefined;
    }
  }
  else {
    return undefined;
  }
}

exports.GetBanner = async function () {
  try {
    let content = await S3.getObject(
      {
        Bucket: process.env.S3_BUCKET,
        Key: "BannerConfig.json",
      }).promise();

    return JSON.parse(content.Body);
  }
  catch (err) {
    console.error("🔻 ERROR: Reading BannerConfig.json in S3:" + process.env.S3_BUCKET, JSON.stringify(err));

    return {
      "Greeting.DeviceDiscoverAndPurchase": "Banner02.jpg",
      "Greeting.DiscoverAndPurchase.OLO.Supplementary": "Banner02.jpg",
      "Shared.Closure.MaxisApp": "Banner04.jpg",
      "Shared.Closure.HotlinkApp": "Banner05.jpg",
      "Shared.Closure.PrepaidApp": "Banner06.jpg",
      "Greeting.DeviceDiscoverAndPurchase.Event": "Banner02.jpg",
      "Greeting.Mobile&BroadbandSubscription": "Banner01.jpg",
      // "Greeting.ManageFibreService": "Banner03.jpg"
    };
  }

}

exports.ShowBanner = function (Img, Total, Current) {
  if (Img.includes("-")) {
    let pos = Img.split("-")[1].charAt(0);
    if (pos == 0) {
      if (Current == Total - 1)
        return Img
      else
        return undefined;
    }
    else {
      if (Current == pos - 1)
        return Img;
      else
        return undefined;
    }
  }
  else {
    if (Current == (Total - (Total == 1 ? 1 : 2)))
      return Img;
    else
      return undefined;
  }
}

exports.IsShowBanner = function (intentName, isRetry) {
  let ExceptionList = [
    "Greeting.MainMenu.DisplayName",
    "Greeting.MainMenu",
    "Greeting.MainMenu.Revisit",
    "Greeting.MainMenu.Supplementary.DisplayName",
    "Greeting.MainMenu.Supplementary.Revisit",
    "Greeting.MainMenu.Supplementary",
    "Greeting.MainMenu.OLO.DisplayName",
    "Greeting.MainMenu.OLO",
    "Greeting.MainMenu.OLO.Revisit"
  ];

  let result = !(isRetry && !ExceptionList.includes(intentName));
  return result;
}

exports.GetIgnoreTranslateResponseList = function () {
  return {
    "Profile.BillingAddress.ChangeAddress.Confirmation": "Profile.BillingAddress.ChangeAddress.Confirmation-2",
    "Profile.BillingAddress.ChangeAddress.Invalid": "Profile.BillingAddress.ChangeAddress.Invalid-2",
    "Profile.BillingAddress.CurrentAddress.ChangeQuery": "Profile.BillingAddress.CurrentAddress.ChangeQuery-2",
    "Sales.PurchaseDevice.LatestDevice2": "Sales.PurchaseDevice.LatestDevice2-2",
    "Sales.PurchaseDevice.LatestPromo2": "Sales.PurchaseDevice.LatestPromo2-2"
  };
}

exports.IgnoreTranslateResponse = function (Intent, Total, Current) {
  if (Intent.includes("-")) {
    let pos = Intent.split("-")[1].charAt(0);
    // For messgae position at 0 Ignore last message for translation in the particular intent
    if (pos == 0) {
      if (Current == Total - 1)
        return true
      else
        return undefined;
    }
    // for message at postion > 0 ignore the specified index message for translation in the particular intent 
    else {
      if (Current == pos - 1)
        return true;
      else
        return undefined;
    }
  }
  // If no index is specified ignore all the text in the response list for translation in the particular intent
  else {
    return true;
  }
};