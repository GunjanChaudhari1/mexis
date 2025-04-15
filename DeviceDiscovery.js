const UTIL = require("./Util");
const HOST = require("./Handler_Host");
const DF = require("./Handler_DialogFlow");
const SESSION = require("./Handler_Session");
const RC = require("./Handler_RingCentral");

exports.lmscreateLeadRatePlans = async function(event) {
  console.log("msisdn", event.msisdn, "LeadCatId", event.LeadCatalogID)
  console.log("Plantype", event.PlanType)
  console.log("Selected Plan", event.SelectedPlan)
  console.log("Registertype", event.RegisterType)
  console.log("IntentName", event.IntentName)
  let url = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;
  let body = {

    "address": null,
    "channelCode": "MAXBOT",
    "concent": false,
    "customerName": null,
    "dealerCode": "MAXBOT",
    "email": "",
    "followUpDate": null,
    "leadCatId": event.LeadCatalogID,
    "msisdn": event.msisdn,
    "product": null,
    "state": null,
    "postcode": null,
    "userId": "MAXBOT",
    "gaClientId": null,
    "sourceId": "MAXBOT",
    "otherComment": `WA Number:${event.msisdn}|Plan Type:${event.PlanType}|PlanSelection:${event.SelectedPlan}|RegisterType:${event.RegisterType}|DF IntentName:${event.IntentName}|Skusummary:${event.SkuSummary}`,
  };

  let head = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Cookie": "visid_incap_2604637=EesEIntfStOnCGe2paj9GDrdjWIAAAAAQUIPAAAAAABPSqfkShWLB0gMblDSPrjX"
    }
  };
  let queryTextValue = ""
  let data = await UTIL.GetUrl(url, head);
  if (data.status == "success") {
    console.log("going in if loop lms true");
    queryTextValue = event.IntentNameTrue;//"MultiCampaign.DiscoverMaxisProductServices.Postpaid.MobilePlan.DTS.Callback.END";
  } else {
    console.log("going in else loop lms", event.IntentNameFalse);

    queryTextValue = event.IntentNameFalse;//"Bypass_Plans_LMS";
  }
  context = await SESSION.GetContext(event.sessionID);
  let replyId = await SESSION.getMessageId(event.sessionID);
  let DfReply = await DF.Call(queryTextValue, event.sessionID, event.msisdn, context);
  let messages = DfReply['queryResult']['fulfillmentMessages'].filter(e => e.text.text[0] != "");
  await SESSION.SetContext(event.sessionID, DfReply['queryResult']['outputContexts']);
  console.log("messages---->", messages, JSON.stringify(messages));
  let msgCount = messages.length;
  for (let i = 0; i < msgCount; i++) {
    let text = messages[i].text.text[0];
    await RC.Call(replyId, text);
    console.log(`📞 RingCentral: [${event.msisdn}]`);
  }
  if (data.status == "success") {
    console.log("going in if loop lms true handover");
  } else {
    let HandOver = await SESSION.GetHandOver(event.sessionID);
    if (HandOver != null && HandOver.IsHandOver) {
      let catgoryIds = null;
      let url2 = `https://maxis.api.engagement.dimelo.com/1.0/content_threads/${event.sessionID}?access_token=${UTIL.RC_ACCESS_TOKEN}`
      let head2 = { method: "GET" };
      let data2 = await UTIL.GetUrl(url2, head2);
      if (data2) {
        catgoryIds = data2.category_ids
      }
      await RC.HandOver(event.sessionID, catgoryIds, HandOver.AgentId);
      isAgentTransfer = true;
      console.log(`🤝 HAND-HOVER: [${event.sessionID}] [${HandOver.AgentId}]`);
    }
  }

}

exports.lmscreateLeadPlans = async function(event) {
  console.log("msisdn", event.msisdn, "LeadCatId", event.LeadCatalogID)
  console.log("Plantype", event.PlanType)
  console.log("Selected Plan", event.SelectedPlan)
  console.log("Registertype", event.RegisterType)
  console.log("IntentName", event.IntentName)
  console.log("IntentNameTrue", event.IntentNameTrue)
  console.log("IntentNameFalse", event.IntentNameFalse)
  let url = `${HOST.LEAD[HOST.TARGET]}/leads/api/v1.0/leads`;

  let body = {

    "address": null,
    "channelCode": "MAXBOT",
    "concent": false,
    "customerName": null,
    "dealerCode": "MAXBOT",
    "email": "",
    "followUpDate": null,
    "leadCatId": event.LeadCatalogID,
    "msisdn": event.msisdn,
    "product": null,
    "state": null,
    "postcode": null,
    "userId": "MAXBOT",
    "gaClientId": null,
    "sourceId": "MAXBOT",
    "otherComment":  `WA Number:${event.msisdn}|Plan Type:${event.PlanType}|PlanSelection:${event.SelectedPlan}|RegisterType:${event.RegisterType}|DF IntentName:${event.IntentName}|SkuSummary:${event.SkuSummary}`,
  };

  let head = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Cookie": "visid_incap_2604637=EesEIntfStOnCGe2paj9GDrdjWIAAAAAQUIPAAAAAABPSqfkShWLB0gMblDSPrjX"
    }
  };

  let data = await UTIL.GetUrl(url, head);
  let queryTextValue =  "";
  // return data.status == "success" ? true : false;
  if  (data.status == "success") {
    console.log("going in if loop lms true");
    queryTextValue = event.IntentNameTrue;//"MultiCampaign.DiscoverMaxisProductServices.Postpaid.MobilePlan.DTS.Callback.END";
  } else {
    console.log("going in else loop lms");
    queryTextValue = event.IntentNameFalse;//"Bypass_Plans_LMS";
  }
  context = await SESSION.GetContext(event.sessionID);
  let replyId = await SESSION.getMessageId(event.sessionID);
  let DfReply = await DF.Call(queryTextValue, event.sessionID, event.msisdn, context);
  console.log("DfReply=====>", JSON.stringify(DfReply));
  let messages = DfReply['queryResult']['fulfillmentMessages'].filter(e => e.text.text[0] != "");
  await SESSION.SetContext(event.sessionID, DfReply['queryResult']['outputContexts']);
  console.log("messages---->", messages, JSON.stringify(messages));
  let msgCount = messages.length;
  for (let i = 0; i < msgCount; i++) {
    let text = messages[i].text.text[0];
    await RC.Call(replyId, text);
    console.log(`📞 RingCentral: [${event.msisdn}]`);
  }
  if  (data.status == "success") {
    console.log("going in if loop lms true handover");
		
  } else {
    let HandOver = await SESSION.GetHandOver(event.sessionID);
    if (HandOver != null && HandOver.IsHandOver) {
      let catgoryIds = null;
      let url2 = `https://maxis.api.engagement.dimelo.com/1.0/content_threads/${event.sessionID}?access_token=${UTIL.RC_ACCESS_TOKEN}`
      let head2 = { method: "GET" };
      let data2 = await UTIL.GetUrl(url2, head2);
      if (data2) {
        catgoryIds = data2.category_ids
      }
      await RC.HandOver(event.sessionID, catgoryIds, HandOver.AgentId);
      isAgentTransfer = true;
      console.log(`🤝 HAND-HOVER: [${event.sessionID}] [${HandOver.AgentId}]`);
    }
  }
	
}