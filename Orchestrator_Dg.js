
//------------------------------------------------------------------------------------------------------------------------------------------
//âœ¨ Program: Maxis Diagnostic Callback To Orchestrator
//------------------------------------------------------------------------------------------------------------------------------------------
//X-Dimelo-Secret = r#uJ!MEyD7D7buVs74m4UazncUQh?#
const UTIL = require('./Util');

//ðŸ‘‡primary entry point.
//----------------------------------------------------------------------------------------------------
exports.handler = async (event, context, callback) => {
  // Populate GCP credentials and RC access token in the entry point itself
  UTIL.populateEnvironmentKeys();
  await UTIL.populateRCAccessTokenSecret();
  await UTIL.populateGCPCredentialsSecret();

  UTIL.Dump(event, 'Incoming RAW request');
  try {
    if (('requestID' in event) && ('actionType' in event) && ('status' in event)) {
      console.log('**********First flow**********************');
      const FiberDiagnostic = require('./FiberDiagnostic');
      await FiberDiagnostic.WIFiDiagnose(event, context);

    } else if (('PaymentReceipt' in event)) {
      console.log('**********Payment Receipt**********************');
      const RetrievePayment = require('./PaymentReceipt');
      await RetrievePayment.RetrievePayment(event, context);

    } else if (('MaxisPostpaidPlansLeadCreation' in event)) {
      console.log('**********Maxis Postpaid Plans Lead Creation**********************');
      const DeviceDiscoveryApi = require('./DeviceDiscovery');
      await DeviceDiscoveryApi.lmscreateLeadRatePlans(event, context);

    } else if (('HotLinkLeadCreation' in event)) {
      console.log('**********lms create Lead Plans**********************');
      const DeviceDiscoveryApi = require('./DeviceDiscovery');
      await DeviceDiscoveryApi.lmscreateLeadPlans(event, context);

    }  else if (('customerAccountDetailsAPI' in event)) {
      console.log('**********customer Account Details API**********************');
      const customerAccountDetails = require('./CheckAccountDetails');
      await customerAccountDetails.customerAccountDetailsAPIData(event, context);

    }
    else if (('customerAccountDetailsAPIAccount' in event)) {
      console.log('**********customer Account Details API Account**********************');
      const customerAccountDetails = require('./CheckAccountDetails');
      await customerAccountDetails.customerAccountDetailsAPIDataAccount(event, context);

    }
    else if (('voiceAttachmentCheck' in event)) {
      console.log('***********Voice attachment begins from call back***********');
      const knowledgeCrawler = require('./KnowledgeCrawler');
      await knowledgeCrawler.KnowledgeCrawlerAttachmentCheck(event, context);

    } else if (('addAttachmentLocatePayment' in event)) {
      console.log('***********Add Attachment begins from call back***********');
      const AddCaseAttachment = require('./AddCaseAttachment');
      await AddCaseAttachment.AddAttachmentLocatePayment(event, context);
    } else if (('getBilling' in event)) {
      console.log('***********get billing ***********');
      let customerAccountDetails = require('./CheckAccountDetails');
      await customerAccountDetails.getBills(event, context);
    } else if (('TriggerIRAPI' in event)) {
      console.log('**********Image Recognition Call**********************');
      const IRTRAttachmentCheck = require('./ImageRecognitionAPI');
      await IRTRAttachmentCheck.IRTR_Attachment_Check(event, context);
      console.log('**********After Image Recognition Call**********************');
    }
    else if (('irCaseCreateAttachmentAsync' in event)) {
      console.log('**********IR CaseCreateAttachmentAsync Call**********************');
      const IRTRAttachmentCheck = require('./ImageRecognitionAPI');
      await IRTRAttachmentCheck.IRTR_AddAttachment_ToCaseID(event, context);
      console.log('**********After IR CaseCreateAttachmentAsync Call**********************');
    }
    else if (('addAttacmentNoIRInvalidSecondRouterImage' in event)) {
      console.log('**********NoIRCAddAttachmentAsync Call**********************');
      const IRTRAttachmentCheck = require('./ImageRecognitionAPI');
      await IRTRAttachmentCheck.noIR_addAttachement(event, context);
      console.log('**********After IR CaseCreateAttachmentAsync Call**********************');
    }
    else if (('customerGetBillsAPIData' in event)) {
      console.log('**********CustomerGetBillsAPIData Call**********************');
      const getCustomerBillingData = require('./CheckAccountDetails');
      await getCustomerBillingData.Get_Customer_Billing_Data(event, context);
      console.log('**********After CustomerGetBillsAPIData Call**********************');
    }
    else if (('NakedFibreCustomerGetContractContext' in event)) {
      console.log('**********CustomerGetBillsAPIData Call**********************');
      const getCustomerContractContext = require('./CheckAccountDetails');
      await getCustomerContractContext.Get_Customer_ContractContext_Data(event, context);
      console.log('**********After CustomerGetBillsAPIData Call**********************');
    }
    else {
      console.log('🔻 Unrecognized callback event name.');
    } 
  } catch (err) {
    console.log(`ðŸ”» Error: ${err.toString()}`);
  };
};