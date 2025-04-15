const UTIL = require("./Util");
const SESSION = require("./Handler_Session");

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: DEFAULT / TESTING
//-----------------------------------------------------------
exports.Default = function(msisdn) {
  return {
    Text: `Completed: Hello ${msisdn}`,
    FollowUpEvent: "Welcome - Greeting"
  };
}

exports.Shared_Menu_Start_1 = async function (event) {
  let util = require("./Util");
  return util.ComposeResult("", "Greeting_Start1");
}

exports.Shared_MainMenuStart = async function(event){
  let util =require('./Util');
  return util.ComposeResult("","Greeting_Start1");
}

exports.Shared_FollowUpEvent = async function (event) {
  let util = require("./Util");
  let eventName = util.GetParameterValue(event,"eventName");

  console.log("event name ðŸ‘‰" + eventName);
  console.log("response with context ðŸ‘‡");
  console.log(util.ComposeResult("",eventName,{},{"name":"select_discovery_menu"}));

  return util.ComposeResult("",eventName,{},{"name":"select_discovery_menu"});
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: CHANGE BILL CYCLE
//-----------------------------------------------------------

exports.Billing_ChangeBillCycle_CurrentBC = async function(event) {
  let app = require('./UserStory_ChangeBillCycle');
  return await app.CurrentBillCycle(event);
}

exports.Billing_ChangeBillCycle_QueryBC = async function(event) {
  let app = require('./UserStory_ChangeBillCycle');
  return await app.QueryBillCycle(event);
}

exports.Billing_ChangeBillCycle_ConfirmChange = async function(event) {
  let app = require('./UserStory_ChangeBillCycle');
  return await app.ConfirmChange(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: GREETING
//-----------------------------------------------------------

exports.Greeting_Start1 = async function(event) {
  let app = require('./UserStory_Greeting');
  return await app.Greeting_Start1(event);
}

exports.Greeting_Start = async function(event) {
  let app = require('./UserStory_Greeting');
  return await app.Greet(event);
}

exports.Shared_Profile_DisplayName = async function(event) {
  let app = require('./UserStory_Greeting');
  return await app.SetProfile(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: CLOSURE
//-----------------------------------------------------------

exports.Shared_Closure = async function(event) {
  let app = require('./UserStory_Closure');
  return await app.Closure(event);
}

exports.Shared_Closure_HelpfulYes = async function(event) {
  let app = require('./UserStory_Closure');
  return await app.HelpfulYesNo(event);
}

exports.Shared_Closure_HelpfulNo = async function(event) {
  let app = require('./UserStory_Closure');
  return await app.HelpfulYesNo(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: AUTHENTICATION
//-----------------------------------------------------------
exports.Auth_EnterTAC = async function(event) {
  let app = require('./UserStory_TAC');
  return await app.CheckTAC(event);
}

exports.Auth_InvalidTAC = async function(event) {
  let app = require('./UserStory_TAC');
  return await app.CheckTAC(event);
}

exports.Shared_Auth_ResendTAC = async function(event) {
  let app = require('./UserStory_TAC');
  return await app.ReSendTAC(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: E BILLING
//-----------------------------------------------------------
exports.Billing_eBill = async function(msisdn) {
  let app = require('./UserStory_EBilling');
  return await app.eBill(msisdn);
}

exports.Biling_eBill_NotRegistered_EmailQuery = async function(msisdn) {
  let app = require('./UserStory_EBilling');
  return await app.NotRegistered_EmailQuery(msisdn);
}

exports.Billing_eBill_Verification_Resend = async function(msisdn) {
  let app = require('./UserStory_EBilling');
  return await app.Verification_Resend(msisdn);
}

exports.Biling_eBill_Registered_NewEmail = async function(msisdn) {
  let app = require('./UserStory_EBilling');
  return await app.Registered_NewEmail(msisdn);
}

// exports.Biilling_AccountStatus_SeekClarifircation = async function(msisdn) {
//   let app = require('./UserStory_BillingClarification');
//   return await app.Billing_Handover(msisdn);
// }

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: CHECK ACCOUNT DETAILS
//-----------------------------------------------------------
// exports.Billing_CheckBillingInfo_StoreCustomerInfo=async function(event){
//   let app = require('./UserStory_CheckAccountDetail');
//   return await app.StoreCustomerInfo(event)
// }

// exports.Billing_AccountStatus = async function(event) {
//     let app = require('./UserStory_CheckAccountDetail');
//     return await app.AccountStatus(event);
// }

// exports.Billing_ContractInfo = async function(event) {
//   let app = require('./UserStory_CheckAccountDetail');
//   return await app.StoreContractInfo(event);
// }

// exports.Billing_CheckBillingInfo_RetrieveContractInformation =async function(event){
//   let app = require('./UserStory_CheckAccountDetail');
//   return await app.ContractInfo(event)
// }
exports.Billing_CheckBillingInfo_StoreCustomerInfo = async function(msisdn) {
  let app = require('./UserStory_CheckAccountDetail');
  // return await app.Billing_CheckBillingInfo_StoreCustomerInfo_Promises(msisdn);
  return await app.AccountStatus(msisdn);
}
exports.Greeting_ManageMyAccount_Start = async function(event) {
  let app = require('./UserStory_CheckAccountDetail');
  return await app.ManageMyAccountMenu(event);
}

exports.Billing_AccountStatus = async function(msisdn) {
  let app = require('./UserStory_CheckAccountDetail');
  return await app.AccountStatus(msisdn);
}

// exports.Contract_Info_Naked_Fibre = async function(msisdn) {
//   let app = require('./UserStory_CheckAccountDetail');
//   return await app.ContractInfoNakedFibre(msisdn);
//   }

exports.Billing_ContractInfo = async function(msisdn) {
let app = require('./UserStory_CheckAccountDetail');
return await app.ContractInfo(msisdn);
}
//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: PAY BILL
//-----------------------------------------------------------
exports.Billing_MakePayment = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.MakePayment(event);
}

exports.Billing_OtherAccount = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.OtherAccount(event);
}

exports.Billing_TerminatedAccount = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.verifyLast4DigitNric(event);
}

exports.Billing_AgentHandover = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.Billing_AgentHandover(event);
}

exports.Billing_AgentHandover_Yes = async function(event){
  console.log("Handler Webhook | Billing_AgentHandover_Yes | START");
  return UTIL.ComposeResult("", 'Billing_Payment_TerminatedAcc_Verified_AgentAssistOffer_Common');
}
exports.Billing_SelectOtherPayment = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.SelectOtherPayment(event);
}

exports.Billing_RetryCheckNric = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.RetryCheckNric(event);
}

exports.Paybilss_Topup_Menu_Query = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.Paybilss_Topup_Menu(event);
}

exports.Billing_PayBill_SelectAccount_Tac = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.SelectAccount_Tac(event);
}

exports.Billing_PayBill_Olo_Tac = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.Olo_Tac(event);
}

exports.Billing_MakePayment_DirectDebitOffer = async function(event){
  let app = require('./UserStory_PayBill');
  return await app.Billing_MakePayment_DirectDebitOffer_Yes(event, "Billing_MakePayment_DirectDebitOffer_Yes");
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: PAY BILL E2E
//-----------------------------------------------------------

exports.Billing_RetrievePaymentReceipts = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.Billing_RetrievePaymentReceipts(event);
}

exports.Billing_RetrievePaymentReceipts_MonthYear = async function(event) {
  let app = require('./UserStory_PayBill');
  return await app.Billing_RetrievePaymentReceipts_Duration(event);
}

exports.RetrievePaymentReceipts_AnotherReceipt_Retry_Yes = async function(event) {
  let app = require("./UserStory_PayBill");
  return await app.Billing_RetrievePaymentReceipts(event, true);

}

exports.RetrievePaymentReceipts_CreateReceipt = async function(event) {
  let app = require("./UserStory_PayBill");
  return await app.Billing_RetrievePaymentReceipts_CreateReceipt(event);

}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: DIRECT DEBIT
//-----------------------------------------------------------
exports.Billing_DirectDebit = async function(event) {
  let app = require('./UserStory_DirectDebit');
  return await app.DirectDebit(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: HANDOVER
//-----------------------------------------------------------
exports.Shared_CS_BusinessHour = async function(event) {
  let app = require('./UserStory_CsHandover');
  return await app.BusinessHour(event);
}

exports.Shared_Agent_Servicing_Handover = async function(event) {
  let app = require('./UserStory_Handover');
  return await app.HandOver(event);
}

exports.Shared_Agent_Servicing_Handover_BM = async function(event) {
  let app = require('./UserStory_Handover');
  return await app.HandOver(event,true);
}


exports.Shared_Agent_Network_Handover = async function(event) {
  let app = require('./UserStory_Handover');
  return await app.NetworkHandOver(event);
}


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: CHECK CASE
//-----------------------------------------------------------
exports.CaseStatus_Start = async function(event) {
  let app = require('./UserStory_CheckCase');
  return await app.Start(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: PROACTIVE CASE
//-----------------------------------------------------------
exports.ProactiveCaseUpdate_Start = async function(event) {
  let app = require('./UserStory_ProactiveCase');
  return await app.Start(event);
}

exports.ProactiveCaseUpdate_Present_CSHandover = async function(event) {
  let app = require('./UserStory_ProactiveCase');
  return await app.CsHandOver(event);
}

exports.ProactiveCaseUpdate_AgentHandover_CustomerServiceQuery = async function(event) {
  let app = require('./UserStory_ProactiveCase');
  return await app.CustomerServiceQuery(event);
}


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: CHANGE CREDIT LIMIT
//-----------------------------------------------------------
exports.Billing_ChangeCreditLimit_CurrentCreditLimit_Confirmation = async function(event) {
  let app = require('./UserStory_ChangeCreditLimit');
  return await app.Confirmation(event);
}

exports.Greeting_ManageMyAccount = async function(event) {
  let app = require('./UserStory_ChangeCreditLimit');
  return await app.ManageMyAccount(event);
}



exports.Billing_ChangeCreditLimit_IncreaseCreditLimit_Confirmation_Yes = async function (event) {
  let app = require('./UserStory_ChangeCreditLimit');
  return app.Confirmation(event);
}

exports.Billing_ChangeCreditLimit_DecreaseCreditLimit_Confirmation_Yes = async function (event) {
  let app = require('./UserStory_ChangeCreditLimit');
  return app.Confirmation(event);
}


exports.Billing_ChangeCreditLimit = async function (event) {
  let app = require('./UserStory_ChangeCreditLimit');
  return app.ChangeCreditLimit(event);
}


// exports.Billing_ChangeCreditLimit_CurrentCreditLimit_QueryNew_Increase = async function (event) {
//   let app = require('./UserStory_ChangeCreditLimit');
//   return await app.Increase(event);
// }

// exports.Billing_ChangeCreditLimit_CurrentCreditLimit_QueryNew_Decrease = async function (event) {
//   let app = require('./UserStory_ChangeCreditLimit');
//   return await app.Decrease(event);
// }

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: DISCOVERY & PURCHASE
//-----------------------------------------------------------
// exports.Greeting_DeviceDiscoverAndPurchase = async function (msisdn) {
//   let app = require('./UserStory_DiscoveryPurchase');
//   return await app.DoDiscovery(msisdn);
// }

exports.MaxBotIdle_Sales_PurchaseDevice_LatestPromo = async function (event) {
  let app = require('./UserStory_DeviceDiscovery');
  return await app.LatestPromo(event);
}

exports.Sales_PurchaseDevice_LatestPromo_Selection = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.LatestPromoSelection(event);
}

exports.MaxBotIdle_Sales_PurchaseDevice_LatestDevice = async function (event) {
  let app = require('./UserStory_DeviceDiscovery');
  return await app.LatestDevice(event);
}

// Sales_PurchaseDevice_DiscoveryBrand
exports.Sales_PurchaseDevice_DiscoveryBrand = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.DiscoveryBrand(event);
}

exports.Sales_PurchaseDevice_DiscoveryBrand_DeviceList = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.DeviceList(event);
}

exports.Sales_PurchaseDevice_DiscoveryBrand_Capacity = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.Capacity(event);
}


exports.Sales_PurchaseDevice_DiscoveryBrand_Color = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.Color(event);
}

exports.Sales_PurchaseDevice_DiscoveryBrand_Contract = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.Contract(event);
}

exports.Sales_PurchaseDevice_DiscoveryBrand_RatePlan = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.RatePlan(event);
}

exports.Sales_PurchaseDevice_DiscoveryBrand_SKUSummary = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.SkuSummary(event);
}

exports.Sales_PurchaseDevice_DiscoveryBrand_SKUSummary_Proceed = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.SkuSummaryProceed(event);
}

exports.Sales_PurchaseDevice_DiscoveryOffer_SKUSummary_Proceed_Options = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.SkuSummaryProceedOptions(event);
}

exports.Sales_PurchaseDevice_DiscoveryOffer_SKUSummary_Proceed_Telesales = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.SkuSummaryProceedTeleSales(event);
}

exports.Sales_PurchaseDevice_DiscoveryOffer_SKUSummary_Proceed_Checkout = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.SkuSummaryProceedCheckout(event);
}

exports.Sales_DiscoverAndPurchase_TechIssue_End = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.TechIssueEnd(event);
}
// ----------------------------------------------//
//        MaxisBroadband & Postpaid           //
// --------------------------------------------//
//
// let aselection = UTIL.GetParameterValue(event, "aselection");
exports.Maxis_Postpaid_ExploreAllDevices_Query_new = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  // let UTIL = require("./Util");
  let aselection = UTIL.GetParameterValue(event, "aselection");
  console.log("aselection>>>>>>>>>>>",aselection);
  if (aselection==1) {
    console.log("1aselection>>>>>>>>>>>",aselection);
    return await app.MaxisBrand_Explore_Device_Brand(event);
  } else if(aselection==2) {
    console.log("2aselection>>>>>>>>>>>",aselection);
    return await app.MaxisContract_Explore_Device_Contract(event);
  } else if(aselection==3) {
    console.log("3aselection>>>>>>>>>>>",aselection);
    return await app.MaxisContract_Explore_Device_Promo(event);
  // }
  } else if(aselection==4) {
    console.log("4aselection>>>>>>>>>>>",aselection);
    return await app.MaxisBrand_Explore_Device_Brand(event);
  }
}
// ////

exports.Maxis_Postpaid_ExploreAllDevices_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisBrand_Explore_Device_Brand(event);
}

exports.Maxis_Postpaid_ExploreAllDevices_Query_Tablet = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisContract_Explore_Device_Contract(event);
}
//
exports.Maxis_Postpaid_ExploreAllDevices_Query_Wear = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisContract_Explore_Device_Promo(event);
}

//
exports.Maxis_Postpaid_SelectionByContract_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisContract_Explore_Device_Contract_Menu(event);
}

exports.Maxis_Postpaid_SelectionByPromo_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisContract_Explore_Device_Promo_Menu(event);
}

exports.Maxis_Postpaid_SelectionByBrand_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.Maxis_Explore_Device_Brand_SelectModel(event);
}

exports.Maxis_Postpaid_SelectionByContract_Brands_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.Maxis_Explore_Device_Contract_SelectModel(event);
}

exports.Maxis_Postpaid_SelectionByPromo_Brands_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.Maxis_Explore_Device_Promo_SelectModel(event);
}

exports.Maxis_Postpaid_SelectionByContract_Models_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostExploreDeviceBrandSelectCapacity(event,false,"MaxisPostpaidContract");
}

exports.Maxis_Postpaid_SelectionByPromo_Models_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostExploreDeviceBrandSelectCapacity(event,false,"MaxisPostpaidPromo");
}

exports.Maxis_Postpaid_ModelSelectionByBrand_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostExploreDeviceBrandSelectCapacity(event,false,"MaxisPostpaidNormal");
}

exports.Maxis_Postpaid_CapacitySelectionByBrand_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostpaidExploreDevcieGetColors(event);
}
exports.Maxis_Postpaid_ColorSelectionByBrand_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostpaidStockavailability(event);
}
exports.Maxis_Postpaid_ContractSelectionByBrand_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostpaidRetrieverRatePlan(event);
}

exports.Maxis_Postpaid_RatePlanSelectionByBrand_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostPaidSkuSummary(event);
}
exports.DeviceDiscovery_Closure_Query =async function(event) {
  let app = require("./UserStory_DeviceDiscovery");
  return await app.DeviceDiscoveryClosure(event);
}
// bot sales flow

exports.Sales_PurchaseDevice_LatestPromo = async function(event){
  let app =require('./UserStory_DiscoveryPurchase');
  return await app.LatestPromo(event);
}
exports.Sales_PurchaseDevice_LatestDevice = async function (event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.LatestDevice(event);
}

exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_Principal_PlanSelection_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostPaidMobileRatePlanPrincipal(event);
}

exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_Supplementary_PlanSelection_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostPaidMobileRatePlanSupplementary(event);
}

exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_Family_PlanSelection_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostPaidMobileRatePlanFamily(event);
}

exports.DiscoverMaxisProductServices_Postpaid_HomeFibre_PlanType_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostPaidBroadbandPlanHomeFiber(event);
}

exports.DiscoverMaxisProductServices_Postpaid_Broadband_PlanType_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostPaidBroadbandPlan4GWifi(event);
}

exports.DiscoverMaxisProductServices_Postpaid_BroadbandHome_Family_PlanType_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostPaidBroadbandPlanFamily(event);
}

exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_DTS_Callback_END_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostpaidPlansLeadCreation(event);
}

exports.DiscoverMaxisProductServices_Postpaid_BroadbandHome_DTS_Callback_END_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostpaidBroadbandLeadCreation(event);
}

exports.DiscoverMaxisProductServices_Device_CheckOutLink_Query2 = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxispostpaidURL(event);
}

exports.DiscoverMaxisProductServices_Postpaid_Device_DTS_Callback_END_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostpaidDevicesLeadCreation(event);
}

exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_CheckOut_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxispostpaidURL(event);
}

exports.DiscoverMaxisProductServices_Device_CheckOutLink_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostPaidDeviceURL(event);
}

exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_Principal_RegisterType_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostpaidStoreMobileRatePlanPrincipalRegisterType(event);
}

exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_Supplementary_RegisterType_Query = async function(event){
  let app = require("./UserStory_DeviceDiscovery");
  return await app.MaxisPostpaidStoreMobileRatePlanSupplementaryRegisterType(event);
}

exports.Greeting_DeviceDiscoverAndPurchase_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.DeviceDiscovery(event,false,"MaxisPostpaid");
}

exports.DiscoverMaxisProductServices_Device_MainMenu_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MenuTriggering(event);
}

exports.MaxbotIdle_DiscoverMaxisProductServices_PostpaidBroadband_Menu_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  console.log("String here***************8");
  return await app.MainMenuMaxis(event);
}
exports.MaxbotIdle_Devices_Telesales_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.DeviceTelesales(event);
}

exports.DeviceDiscovery_RatePlanMenu_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.RatePlanMenu(event);
}
exports.DeviceDiscovery_RatePlan_Checkout_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.RatePlanCheckOutMenu(event);
}
exports.DeviceDiscovery_RatePlan_Telesales1_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.RatePlanTelesales1(event);
}

exports.DeviceDiscovery_RatePlan_Telesales2_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.RatePlanTelesales2(event);
}
exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_Family_DTS_PreferredContact_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.RatePlanFamilyTelesales(event);
}
exports.DiscoverMaxisProductServices_Postpaid_BroadbandHome_DTS_PreferredContact_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.BroadbandPlanFiberTelesales(event,false);
}
exports.DiscoverMaxisProductServices_Postpaid_MobilePlan_FamilyPlan_DTS_PreferredContact_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.BroadbandPlanFamilyTelesales(event);
}

exports.DiscoverMaxisProductServices_Postpaid_BroadbandHomeFibre_PlanSelection_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.FiberMenu(event);

}
exports.DeviceDiscovery_Wifi_CheckOut_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.BroadbandPlanWifiCheckout(event);
}
exports.DeviceDiscovery_Wifi_PreferredContact_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.BroadbandPlanWifiTelesales(event);
}
exports.DeviceDiscovery_Family_LMS_Query = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.RateplanFamilyLMS(event);
}

// -------------------------------------------//
//        HotlinkPostpaid                   //
// -----------------------------------------//

exports.Idle_AgentAssist_verify = async function (event) {
  let app = require('./UserStory_DeviceDiscovery');
  return await app.Idle_AgentAssist_verify_Wh(event);
}
exports.Shared_Idle_AgentAssit_Telesales =async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.Shared_Idle_AgentAssist(event);
}
exports.DiscoverMaxisProductServices_Menu_Input =async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.DiscoverMaxisProductServices_Menu_Output(event);
}

exports.Sales_DiscoverMaxisProductServices_HotlinkPostpaid_Menu_Input=async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.Sales_DiscoverMaxisProductServices_HotlinkPostpaid_Menu_Output(event);
}
exports.DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery= async function (event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.DeviceDiscovery(event,false,"HotlinkPostpaid");
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery_DTS_PhoneCall = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.DeviceDiscoveryPhoneCallLeadsCreation(event,false);
}

exports.DiscoverMaxisProductServices_Device_ProceedCheckOut = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidDeviceDiscoveryCheckout(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_OutofStock_NotifyMe_ExploreDevice = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidNotifymeExploreDeivce(event);
}

exports.DiscoverMaxisProductServices_DeviceDiscovery_DeviceURL = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostPaidDeviceURL(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_BrandSelection = async function (event) {
  let app = require('./UserStory_DeviceDiscovery');
  return await app.Hotlink_Explore_Device_Brand(event, false);


}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoSelection= async function (event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.Hotlink_Explore_Device_Promo(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoBrandSelection = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.Hotllink_Explore_Device_Promo_Brand(event,false);
}
exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_PromoBrandSelected = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaid_Promo_Model(event,false);
}

exports.DiscoverMaxisProductServices_Postpaid_Broadband_Device_BrandSelection = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.Hotlink_Explore_Device_Brand_SelectDevice(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_ExploreInput = async function (event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostPaidMainMenuOutput(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_LatestPromoExploreDeviceYesInput = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.LatestPromotinsExploreDeviceMenu(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_CapacitySelection=async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostExploreDeviceBrandSelectCapacity(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_ColourSelection =async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidExploreDevcieGetColors(event ,false)
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_ColorSelected =async function(event){
  let app =require('./UserStory_DeviceDiscovery');
  return await app.HotlikPostpaidStockavailability(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlans = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostPaidMobileRatePlanOutput(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlan_DTS_PhoneCall = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MobileRatePlanSwitchtoHotlinkPostpaidLeadsCreation(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOutCallbackSignupWA_PhInput =async function(event){
  let app =require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidSignUpWhatsupMenu(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MRP_DTS_Preferred_ContactInput= async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.SwitchToHotlinkPostpaid_WA_Menu(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOutCallbackOptionsInput = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidMoblileRatePlanSighnUp(event,false);
}
exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOutCallbackSignupNewNumber= async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MobileRatePlanSignupForNewNumberPhoneCallLeadsCreation(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlan_UpgradeHotlinkPrepaid_PhoneCall=async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MobileRatePlanUpgradeHotlinkPrepaidLeadsCreation(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlan_UpgradeHotlinkPrepaidInput = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MoblieRatePlanUpgaradeHotlinkPrepaid_WA_Menu(event,false)
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_BradbandPhoneCall= async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostPaidBroadbandLeadsCreation(event);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobilePlan_CheckOut =async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MobilePlanURL(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_MobileRatePlanSelected = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidStoreMobileRatePlan(event,false);
}
exports.DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlanInput=async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidBroanbandPlanMainMenu(event,false);
}
exports.DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan_Broadband = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostPaidRetireveBroadbandPlan(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan_BroadbandSelected = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkStoreBroadbandPlan(event,false)
}
exports.DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan_Bundled = async function(event){
  let app =require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostPadiRetriveBundledPlan(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_BroadbandPlan_BundledSelected = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkStoreBundledPlan(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_BundledPlanPhonecall = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkBundledPlanLeadsCreation(event,false);
}
exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_LatestPromo =async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidLatestPromotionsKey(event,false);
}
exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_LatestDevices= async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidLatestDevicesKey(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_SKUSummary = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostPaidSkuSummary(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_DeviceDiscovery_WA_Ph_Input_Menu = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidDeviceDiscovery_WA_PH_Menu(event,false);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_RatePlantSelection = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.HotlinkPostpaidRetrieverRatePlan(event,false);
}


//-----------------------------------------
// Hotlink Prepaid
//-----------------------------------------

exports.MaxBotIdle_DiscoverMaxisProductServices_HotlinkPrepaid_Menu_Input = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MaxBotIdleDiscoverMaxisProductServices_HotlinkPrepaidMenu_Input(event);

}

exports.MaxBotIdle_HotlinkPrepaid_MobileRatePlanInfo = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MaxBotIdleHotlinkPrepaidMobileRatePlanInfo(event);

}

exports.MaxBotIdle_HotlinkPrepaid_SwitchInfo = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.MaxBotIdleHotlinkPrepaidSwitchInfo(event);

}

exports.DiscoverMaxisProductServices_HotlinkPrepaid_PlanType_wh = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.DiscoverMaxisProductServices_HotlinkPrepaidPlanType_wh(event);

}

exports.DiscoverMaxisProductServices_HotlinkPrepaid__SwitchtoHotlinkPrepaid_wh = async function(event){
  let app = require('./UserStory_DeviceDiscovery');
  return await app.DiscoverMaxisProductServices_HotlinkPrepaidSwitchtoHotlinkPrepaid_wh(event);

}



// ------------------------------------------------------------------//
// -------------************---------------***********---------------//
// ------------------------------------------------------------------//


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: BILLING STATEMENT
//-----------------------------------------------------------
exports.Billing_BillStatementRequest = async function (event) {
  let app = require('./UserStory_BillingStatement');
  return await app.BillStatementRequest(event);
}

exports.Billing_BillStatementRequest_QueryEBill_QueryMonth = async function (event) {
  let app = require('./UserStory_BillingStatement');
  return await app.QueryEBill_QueryMonth(event);
}

exports.Billing_BillStatementRequest_Itemised_QueryMonth = async function (event) {
  let app = require('./UserStory_BillingStatement');
  return await app.Itemised_QueryMonth(event);
}

exports.Billing_BillStatementRequest_Itemised_OtherMonth = async function (event) {
  let app = require('./UserStory_BillingStatement');
  return await app.Itemised_QtherMonth(event);
}

exports.Billing_BillStatementRequest_Summary_QueryMonth = async function (event) {
  let app = require('./UserStory_BillingStatement');
  return await app.Summary_QueryMonth(event);
}

exports.Billing_BillStatementRequest_Summary_OtherMonth = async function (event) {
  let app = require('./UserStory_BillingStatement');
  return await app.Summary_OtherMonth(event);
}

// exports.Billing_BillStatementRequest_Itemised_BillURL = async function (event) {
//   let app = require('./UserStory_BillingStatement');
//   return await app.OtherBill(event);
// }

// exports.Billing_BillStatementRequest_Itemised_BillNA = async function (event) {
//   let app = require('./UserStory_BillingStatement');
//   return await app.OtherBill(event);
// }

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: RECONTRACTING
//-----------------------------------------------------------

exports.Recontracting_Start = async function(event) {
  let app = require('./UserStory_ReContracting');
  return await app.Start(event);
}

exports.Recontracting_DeviceDiscovery = async function(event) {
  let app = require('./UserStory_ReContracting');
  return await app.Device_Discovery(event);
}


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: PUK
//-----------------------------------------------------------

exports.AccMgt_PUK_PresentPUK = async function(event) {
  let app = require('./UserStory_CheckPUK');
  return await app.PresentPUK(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: MANAGE ADDRESS
//-----------------------------------------------------------

exports.Profile_BillingAddress = async function(event) {
  let app = require('./UserStory_ManageAddress');
  return await app.BillingAddress(event);
}

exports.Profile_BillingAddress_ChangeAddress = async function(event) {
  let app = require('./UserStory_ManageAddress');
  return await app.ChangeAddress(event);
}

exports.Profile_BillingAddress_ChangeAddress_Confirmation_Yes = async function(event) {
  let app = require('./UserStory_ManageAddress');
  return await app.Confirmation_Yes(event);
}

exports.Profile_BillingAddress_CurrentAddress = async function(event) {
  let app = require('./UserStory_ManageAddress');
  return await app.CurrentAddress(event);
}

exports.Profile_BillingAddress_ChangeAddress_Invalid = async function(event) {
  let app = require('./UserStory_ManageAddress');
  return await app.ChangeAddress(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: TAX STATEMENT
//-----------------------------------------------------------

exports.Billing_TaxStatementRequest = async function(event) {
  let app = require('./UserStory_TaxStatement');
  return await app.TaxStatementRequest(event);
}

exports.Billing_TaxStatementRequest_NoEbill_Year = async function(event) {
  let app = require('./UserStory_TaxStatement');
  return await app.NoEbill_Year(event);
}

exports.Billing_TaxStatementRequest_EmailQuery_Year = async function(event) {
  let app = require('./UserStory_TaxStatement');
  return await app.EmailQuery_Year(event);
}

exports.Billing_TaxStatementRequest_EmailQuery_Yes = async function(event){
  let app = require('./UserStory_TaxStatement');
  return await app.EmailQuery_Yes(event);
}
exports.Billing_TaxStatementRequest_NoEbill_EmailAddress = async function(event) {
  let app = require('./UserStory_TaxStatement');
  return await app.EmailAddress_Yes(event);
}


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: TROUBLESHOOT WIFI
//-----------------------------------------------------------

exports.Network_Fibre_SlowWifi_DiagnosticCheck_Yes = async function(event) {
  let app = require('./UserStory_TroubleshootWiFi1');
  return await app.DiagnosticCheck_Yes(event);
}

exports.Network_Fibre_SlowWifi_DiagnosticCheck_ModemId = async function(event) {
  let app = require('./UserStory_TroubleshootWiFi1');
  return await app.DiagnosticCheck_ModemId(event);
}

exports.Network_Fibre_SlowWifi_DiagnosticCheck = async function(event) {
  let app = require('./UserStory_TroubleshootWiFi1');
  return await app.DiagnosticCheck(event);
}

exports.TooManyDevices_MeshWifi = async function(event) {
  let app = require('./UserStory_TroubleshootWiFi1');
  return await app.TooManyDevices_MeshWifi(event);
}


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: SHARED VALIDATION FALLBACK
//-----------------------------------------------------------

exports.Shared_Bot_Fallback = async function(event) {
  let app = require('./UserStory_ValidationFallback');
  return await app.Fallback(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: SHARED FOR MAXIS BYPASS AND AGENT
//-----------------------------------------------------------
exports.Shared_ByPass_Agent = async function(event) {
  let app = require('./UserStory_SharedByPassAgent');
  return await app.HandOver(event);
}



//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: DIAGNOSTIC CALLBACKS
//-----------------------------------------------------------
exports.Network_Fibre_SlowWifi_DiagnosticCheck_Result = async function(event){
  console.log("enter XðŸ¤ž");
  let app = require('./UserStory_DiagnosticCallback');
  return await app.Callback(event);
}

exports.Network_Fibre_SlowWifi_DiagnosticCheck_PositiveResult_Assistance_No = async function(event){
  console.log("CALL DiagonsticResultNoErrorCRM 1111111 >>")
  let app = require('./UserStory_DiagnosticCallback');

  return await app.DiagonsticResultNoErrorCRM(event);

}

exports.Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceYes = async function(event){
  let app = require('./UserStory_DiagnosticCallback');
  return await app.AssistanceYes(event);
}

exports.Network_Fibre_SlowWifi_DiagnosticCheck_DiagnosticError_AssistanceNo = async function(event){
  let app = require('./UserStory_DiagnosticCallback');
  return await app.AssistanceNo(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: JARINGAN PRIHATIN
//-----------------------------------------------------------
exports.JaringanPrihatin_English_Eligibility = async function(event){
  let app = require('./UserStory_JaringanPrihatin');
  return await app.Eligibility(event);
}

exports.JaringanPrihatin_NonMaxis_NRIC_Verify = async function(event){
  let app = require('./UserStory_JaringanPrihatin');
  return await app.Verify(event);
}

exports.JaringanPrihatin_Eligible_Yes_DeviceSubsidy = async function(event){
  let app = require('./UserStory_JaringanPrihatin');
  return await app.DeviceSubsidy(event);
}

exports.JaringanPrihatin_Bm_Eligibility = async function(event){
  let app = require('./UserStory_JaringanPrihatin');
  return await app.Eligibility(event, true);
}

exports.JaringanPrihatin_Bm_NonMaxis_NRIC_Verify = async function(event){
  let app = require('./UserStory_JaringanPrihatin');
  return await app.Verify(event, true);
}

exports.JaringanPrihatin_Bm_Eligible_Yes_DeviceSubsidy = async function(event){
  let app = require('./UserStory_JaringanPrihatin');
  return await app.DeviceSubsidy(event, true);
}


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: SME GRANT
//-----------------------------------------------------------
exports.SMEGrant_Q1_Yes = async function(event){
  let app = require('./UserStory_SMEGrant');
  return await app.Q1_Yes(event);
}

exports.SMEGrant_Q1_No = async function(event){
  let app = require('./UserStory_SMEGrant');
  return await app.Q1_No(event);
}

exports.SMEGrant_BM_Q1_Yes = async function(event){
  let app = require('./UserStory_SMEGrant');
  return await app.Q1_Yes(event,true);
}

exports.SMEGrant_BM_Q1_No = async function(event){
  let app = require('./UserStory_SMEGrant');
  return await app.Q1_No(event,true);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: PETRONAS
//-----------------------------------------------------------
exports.Petronas_En_Language_Wh = async function(event){
  
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_Language_Wh(event);
}

exports.Petronas_Bm_Language_Wh = async function(event){  
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_Language_Wh(event,true);
}

exports.Petronas_En_CustomerType_Existing_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_CustomerType_Existing_Wh(event);
}

exports.Petronas_Bm_CustomerType_Existing_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_CustomerType_Existing_Wh(event, true);
}

exports.Petronas_En_CustomerType_New_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_CustomerType_New_Wh(event);
}

exports.Petronas_Bm_CustomerType_New_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_CustomerType_New_Wh(event,true);
}

exports.Petronas_En_Plan_FibreBundle_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_Plan_FibreBundle_Wh(event);
}

exports.Petronas_Bm_Plan_FibreBundle_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_Plan_FibreBundle_Wh(event,true);
}

exports.Petronas_En_Plan_WiFiBundle_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_Plan_WiFiBundle_Wh(event);
}

exports.Petronas_Bm_Plan_WiFiBundle_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_Plan_WiFiBundle_Wh(event,true);
}

exports.Petronas_En_PlanFibre_100_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_PlanFibre_100_Wh(event);
}

exports.Petronas_Bm_PlanFibre_100_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_PlanFibre_100_Wh(event,true);
}

exports.Petronas_En_CustomerDetails_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_CustomerDetails_Wh(event);
}

exports.Petronas_Bm_CustomerDetails_Wh = async function(event){
  let app = require('./UserStory_Petronas');
  return await app.Petronas_En_CustomerDetails_Wh(event, true);
}


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: IPHONE 13
//-----------------------------------------------------------
exports.iPhone13_En_CustomerDetails_Wh = async function(event){
  
  let app = require('./UserStory_iPhone13');
  return await app.iPhone13_En_CustomerDetails_Wh(event);
}

exports.iPhone13_Bm_CustomerDetails_Wh = async function(event){
  
  let app = require('./UserStory_iPhone13');
  return await app.iPhone13_En_CustomerDetails_Wh(event,true);
}


//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: SFDC
//-----------------------------------------------------------
exports.Sfdc_En_CompanyEligibility_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyEligibility_Wh(event);
}

exports.Sfdc_En_CompanyRegion_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegion_Wh(event);
}

exports.Sfdc_En_CompanyRegionCentral_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event);
}

exports.Sfdc_En_CompanyRegionSouthern_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event);
}

exports.Sfdc_En_CompanyRegionNorthern_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event);
}

exports.Sfdc_En_CompanyRegionEastCoast_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event);
}

exports.Sfdc_En_CompanyRegionSabah_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event);
}

exports.Sfdc_En_CompanyDetails = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyDetails(event);
}

// BM

exports.Sfdc_Bm_CompanyEligibility_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyEligibility_Wh(event,true);
}

exports.Sfdc_Bm_CompanyRegion_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegion_Wh(event,true);
}

exports.Sfdc_Bm_CompanyRegionCentral_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event,true);
}

exports.Sfdc_Bm_CompanyRegionSouthern_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event,true);
}

exports.Sfdc_Bm_CompanyRegionNorthern_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event,true);
}

exports.Sfdc_Bm_CompanyRegionEastCoast_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event,true);
}

exports.Sfdc_Bm_CompanyRegionSabah_Wh = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyRegionCentral_Wh(event,true);
}

exports.Sfdc_Bm_CompanyDetails = async function(event){
  
  let app = require('./UserStory_Sfdc');
  return await app.Sfdc_CompanyDetails(event,true);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: MULTI-CAMPAIGN
//-----------------------------------------------------------
exports.MultiCampaign = async function(event){
  
  let app = require('./UserStory_MultiCampaign');
  return await app.General(event);
}

//-----------------------------------------------------------
// âœ¨âœ¨ USER STORY: Manage Router
//-----------------------------------------------------------

exports.ManageRouter_Start_Reboot = async function(event){
  
  let app = require('./UserStory_ManageRouter');
  return await app.ManageRouter_Start_Wh(event,"3");
}

exports.ManageRouter_Start_changeWifi = async function(event){
  
  let app = require('./UserStory_ManageRouter');
  return await app.ManageRouter_Start_Wh(event,"4");
}

exports.Router_reboot_fibreid = async function(event) {
  let app = require('./UserStory_ManageRouter');
  return await app.RouterReboot_fibreId(event);
}


// exports.Router_reboot_freq_selection = async function(event) {
//   let app = require('./UserStory_ManageRouter');
//   return await app.RebootFreqSelection(event);
// }

// exports.ScheduleReboot_now = async function(event) {
//   let app = require('./UserStory_ManageRouter');
//   return await app.ScheduleReboot_now(event);
// }

// exports.Router_reboot_updateACS = async function(event) {
//   let app = require('./UserStory_ManageRouter');
//   return await app.RouterReboot_updateACS(event);
// }

// exports.ManageRouter_Select = async function(event){
  
//   let app = require('./UserStory_ManageRouter');
//   return await app.ManageRouterSelect(event);
// }

// exports.Router_reboot_NRIC_Verify = async function(event){
//   let app = require('./UserStory_ManageRouter');
//   return await app.Verify(event);
// }

//-----------------------------------------------------------
// ðŸ’Š User Story - Change Wifi
//-----------------------------------------------------------


// exports.ManageRouter_Start_ChangeWifi = async function(event){
  
//   let app = require('./UserStory_ChangeWifiSettings');
//   return await app.ManageRouter_Start_Wh(event);
// }

// exports.Change_Wifi_fibreid = async function(event) {
//   let app = require('./UserStory_ChangeWifiSettings');
//   return await app.ChangeWifi_fibreId(event);
// }


// exports.ChangeWifi_Password_NewPassword_Confirm_Wh = async function(event){
//   let app = require('./UserStory_ChangeWifiSettings');
//   return await app.ChangeWifi_Password_NewPassword_Confirm_Wh(event,true);

// }

// exports.ChangeWifi_Name_NewName_Wh = async function(event){
//   let app = require('./UserStory_ChangeWifiSettings');
//   return await app.ChangeWifi_Name_NewName_Wh(event,true);
// }

// exports.ChangeWifi_Name_NewName_Confirm_Wh = async function(event){
//   let app = require('./UserStory_ChangeWifiSettings');
//   return await app.ChangeWifi_Name_NewName_Confirm_Wh(event,true);

// }

// exports.ChangeWifi_Name_Updated_END_Wh = async function(event){
//   let app = require('./UserStory_ChangeWifiSettings');
//   return await app.ChangeWifi_Name_Updated_end_Wh(event,true);
// }

//-----------------------------------------------------------
// ðŸ’Š Payment Arrangement
//-----------------------------------------------------------

exports.Payment_PaymentArrangement_PTP = async function(event) {
  let app = require('./UserStory_PaymentArrangement');
  return await app.Payment_PaymentArrangement_PTP(event);
}

exports.Payment_PaymentArrangement_PTP_SetUp_Yes = async function(event) {
  let app = require('./UserStory_PaymentArrangement');
  return await app.Payment_PaymentArrangement_PTP_SetUp_Yes(event);
}

//-----------------------------------------------------------
// ðŸ’Š SUPPORT FOR VALIDATION CALLBACK - REFER VALIDATION SHEET
//-----------------------------------------------------------
// exports.Greeting_ManageMyAccount_Start = function(event) {
//   let UTIL = require("./Util");
//   return UTIL.ComposeResult("","Greeting_ManageMyAccount");
// }

exports.Greeting_ManageMyProfile_Start = async function(event) {
  let app = require("./UserStory_Greeting");
  console.log("calling first Greeting_ManageMyProfile init********");
  return await app.Greeting_ManageMyProfile(event);
  // return UTIL.ComposeResult("","Greeting_ManageMyProfile");
}

exports.Billing_Content_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Billing_Content");
}

exports.Greeting_ManageMyAccount_BillStatement_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Greeting_ManageMyAccount_BillStatement");
}

exports.Greeting_DeviceDiscoverAndPurchase_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Greeting_DeviceDiscoverAndPurchase1");
}

exports.Greeting_CheckCaseStatus_Start = async function(event) {
  // let UTIL = require("./Util");
  // return UTIL.ComposeResult("","Greeting_CheckCaseStatus_ReportNetworkFault");
  let app = require('./UserStory_CheckDeliveryStatus');
  return await app.Greeting_CheckCaseStatus_Start(event);
}

exports.Greeting_Mobile_BroadbandSubscription_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Greeting_Mobile_BroadbandSubscription");
}

exports.Greeting_ManageFibreService_Start =  async function(event) {
  let TAC = require("./UserStory_TAC");
  return await TAC.Greeting_ManageFibreService(event);
}

exports.Mobile_BroadbandSubscription_Prepaid_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Mobile_BroadbandSubscription_Prepaid");
}

exports.Mobile_BroadbandSubscription_Broadband_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Mobile_BroadbandSubscription_Broadband");
}


exports.Mobile_BroadbandSubscription_GovernmentIndividual_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Mobile_BroadbandSubscription_GovernmentIndividual");
}


exports.Profile_DID_SelfServe_Start = function(event) {
  let app = require("./UserStory_RedirectionURL");
  return app.DID_RedirectionURL(event);
}


exports.MobileAndBroadbandSubscription_Postpaid_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","MobileAndBroadbandSubscription_Postpaid");
}

exports.Billing_ChangeCreditLimit_IncreaseCreditLimit_Confirmation_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Billing_ChangeCreditLimit_IncreaseCreditLimit_Confirmation");
}

exports.Billing_ChangeCreditLimit_DecreaseCreditLimit_Confirmation_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Billing_ChangeCreditLimit_DecreaseCreditLimit_Confirmation");
}

exports.Billing_TaxStatementRequest_NoEbill_RegisterEbill_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Billing_TaxStatementRequest_NoEbill_RegisterEbill");
}

exports.Billing_BillStatementRequest_QueryEBill_No_BillCharged_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Billing_BillStatementRequest_QueryEBill_No_BillCharged");
}

exports.Billing_BillStatementRequest_QueryEBill_Yes_Start = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","Billing_BillStatementRequest_QueryEBill_Yes");
}

exports.Billing_ChangeCreditLimit_IncreaseCreditLimit_Confirmation = async function (event) {
  let app = require('./UserStory_ChangeCreditLimit');
  return app.Confirmation2(event,"Billing_ChangeCreditLimit_IncreaseCreditLimit_Confirmation2");
}

exports.Billing_Manage_App_Store_start = function(event) {
  let app = require("./UserStory_RedirectionURL");
  return app.PresentManageAppStore(event);
}

exports.Billing_ChangeCreditLimit_DecreaseCreditLimit_Confirmation = async function (event) {
  let app = require('./UserStory_ChangeCreditLimit');
  return app.Confirmation2(event,"Billing_ChangeCreditLimit_DecreaseCreditLimit_Confirmation2");
}



exports.MobileBroadbandSubscription_Postpaid_Family = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","MobileBroadbandSubscription_Postpaid_Family_Menu");
}

exports.MobileBroadbandSubscription_Postpaid_Business = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","MobileBroadbandSubscription_Postpaid_Business_Menu");
}

exports.MobileBroadbandSubscription_Postpaid_Personal = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","MobileBroadbandSubscription_Postpaid_Personal_Menu");
}

exports.MobileBroadbandSubscription_Broadband_Home = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","MobileBroadbandSubscription_Broadband_Home_Menu");
}

exports.MobileBroadbandSubscription_Broadband_Business = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","MobileBroadbandSubscription_Broadband_Business_Menu");
}

exports.MobileBroadbandSubscription_Broadband_OnTheGo = function(event) {
  // let UTIL = require("./Util");
  return UTIL.ComposeResult("","MobileBroadbandSubscription_Broadband_OnTheGo_Menu");
}

//-----------------------------------------------------------
// Top Up Use Case
//-----------------------------------------------------------
exports.PrepaidTopup_TopupMenu = async function(event){
  let app = require('./UserStory_TopUp');
  return await app.PrepaidTopup_TopupMenu_Wh(event);
}

exports.PrepaidTopup_TopupHistory = async function(event){
  let app = require('./UserStory_TopUp');
  return await app.PrepaidTopup_TopupHistory_Wh(event, "PrepaidTopup_TopupHistory_Wh");
}

exports.PrepaidTopup_AcceptTopUp_Yes = async function(event){
  let app = require('./UserStory_TopUp');
  return await app.PrepaidTopup_TopupHistory_Wh(event, "PrepaidTopup_AcceptTopup_Yes_Wh");
}

exports.PrepaidTopup_AcceptTopUp_No_yes = async function(event){
  let app = require('./UserStory_TopUp');
  return await app.PrepaidTopup_TopupHistory_Wh(event, "PrepaidTopup_AcceptTopup_No_yes_Wh");
}

// exports.PrepaidTopup_PerformTopup = async function(event){
//   let app = require('./UserStory_TopUp');
//   return await app.PrepaidTopup_PerformTopup_Wh(event); 
// }

exports.PrepaidTopup_iShare = async function(event){
  let app = require('./UserStory_TopUp');
  return await app.PrepaidTopup_iShare_Wh(event); 
}
// exports.Sales_PurchaseDevice_DiscoveryBrand_Start = function(event) {
//   let UTIL = require("./Util");
//   return UTIL.ComposeResult("","Sales_PurchaseDevice_DiscoveryBrand");
// }

exports.HybridBot_DeviceDiscovery = async function(event) {
  console.log("Inside Handler DEvice discovery WH!!!");
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.hybrid(event);
}

exports.HybridBot_LanguageSelection = async function(event) {
  let app = require('./UserStory_DiscoveryPurchase');
  return await app.languageSelect(event);
}

// exports.HybridBot_LanguageSelection_En = async function(event) {
//   let app = require('./UserStory_DiscoveryPurchase.js');
//   return await app.languageSelect(event, 0);
// }

// exports.HybridBot_LanguageSelection_Bm = async function(event) {
//   let app = require('./UserStory_DiscoveryPurchase.js');
//   return await app.languageSelect(event, 1);
// }
//-----------------------------------------------------------
// PortIn Use Case
//-----------------------------------------------------------
exports.PortIn_MaxisPostpaid_LMSCRMLeadCreation = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Leads_Wh_yes (event);
}
exports.PortIn_MaxisPostpaid_ContactNumber_OtherMSISDN_Verify = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Leads_Wh_no (event);
}
exports.PortIn_MaxisHomeFibre_LMSCRMLeadCreation = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Leads_Wh_yes (event);
}
exports.PortIn_MaxisHomeFibre_ContactNumber_OtherMSISDN_Verify = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Leads_Wh_no (event);
}
exports.PortIn_HotlinkPostpaid_LMSCRMLeadCreation = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Leads_Wh_yes (event);
}
exports.PortIn_HotlinkPostpaid_ContactNumber_OtherMSISDN_Verify = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Leads_Wh_no (event);
}
exports.PortIn_HotlinkPrepaid_LMSCRMLeadCreation = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Leads_Wh_yes (event);
}
exports.PortIn_HotlinkPrepaid_ContactNumber_OtherMSISDN_Verify = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Leads_Wh_no (event);
}


exports.DiscoverMaxisProductsServices_SwitchtoMaxisPostpaidMaxisHomeFibre_SubMenu_Input = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Name_Wh(event, "MaxisPostpaid");
}
exports.DiscoverMaxisProductsServices_SwitchtoMaxisPostpaidMaxisHomeFibre_SubMenu_Input1 = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Name_Wh(event, "MaxisHomeFibre");
}
exports.DiscoverMaxisProductsServices_SwitchtoHotlinkPostpaid_SubMenu_Input = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Name_Wh(event, "HotlinkPostpaid");
}
exports.DiscoverMaxisProductsServices_SwitchtoHotlinkPrepaid_SubMenu_Input = async function(event) {
  let app = require("./UserStory_PortInOut");
  return await app.PortIn_Initiation_Name_Wh(event, "HotlinkPrepaid");
}
//-----------------------------------------------------------
// PortOut Use Case
//-----------------------------------------------------------
exports.DiscoverMaxisProductsServices_SwitchtoMaxisPostpaidMaxisHomeFibre_SubMenu_Input2 = async function(event) {
  
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}
exports.DiscoverMaxisProductsServices_SwitchtoHotlinkPostpaid_SubMenu_Input1 = async function(event) {
  
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}
exports.DiscoverMaxisProductsServices_SwitchtoHotlinkPrepaid_SubMenu_Input1 = async function(event) {
  
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}
exports.DiscoverMaxisProductsServices_SwitchtoMaxisPostpaidMaxisHomeFibre_SubMenu_Input1_PostPaid = async function(event) {
  
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}
exports.DiscoverMaxisProductsServices_SwitchtoHotlinkPostpaid_SubMenu_Input1_PostPaid = async function(event) {
  
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}
exports.DiscoverMaxisProductsServices_SwitchtoHotlinkPrepaid_SubMenu_Input1_PostPaid = async function(event) {
  
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}

exports.PortIn_StatusMSISDN_Query_RetrieveInfo = async function(event) {
  
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_WA_Wh(event);
}
exports.PortIn_StatusMSISDN_Query_OtherMSISDN_Verify = async function(event) {
  
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Other_Wh(event);
}
exports.PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_RequestNRIC_Verify = async function(event) {
  let app = require("./UserStory_PortInOutStatus");
  return await app.VerifyNRIC(event);
}
exports.PortIn_Status_InProcess_Maxis_CaseEscalation_ActivationMoreThan2Hours_RequestNRIC_Verify = async function(event) {
  let app = require("./UserStory_PortInOutStatus");
  return await app.VerifyNRIC(event);
}
exports.PortIn_Status_Rejected_7DayTimedOut = async function(event){
  let app = require("./UserStory_PortInOutStatus");
  return await app.RejectedFlow(event);
}

exports.PortIn_Status_Rejected_7DayTimedOut_PortIn_Yes = async function(event){
  let app = require("./UserStory_PortInOutStatus");
  return await app.RejectedFlow_CaseCreation(event);
}

exports.PortIn_Status_InProcess_Maxis_CaseEscalation_MoreThan12Hours_RequestNRIC_VerifyNric = async function(event) {

  let app = require("./UserStory_PortInOutStatus");

  return await app.VerifyNRICNumber(event);

}
exports.DiscoverMaxisProductsServices_SwitchtoMaxisPostpaidMaxisHomeFibre_SubMenu_Input1_PrePaid = async function(event) {
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}

exports.DiscoverMaxisProductsServices_SwitchtoHotlinkPostpaid_SubMenu_Input1_PrePaid = async function(event) {
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}

exports.DiscoverMaxisProductsServices_SwitchtoHotlinkPrepaid_SubMenu_Input1_PrePaid = async function(event) {
  let app = require("./UserStory_PortInOutStatus");
  return await app.PortOut_Initiation_Name_Wh(event);
}


// ðŸ’Š Locate Payment
//-----------------------------------------------------------

exports.Billing_AccountStatus_LocatePayment = async function(event) {
  let app = require('./UserStory_LocatePayment');
  return await app.Payment_LocatePayment(event);
}


exports.Billing_AccountStatus_LocatePayment_OpenCase_No_WithAttachment = async function(event) {
  let app = require('./UserStory_LocatePayment');
  return await app.Billing_AccountStatus_OpenCase_No_WithAttachment(event);
}

exports.Attachment_Check = async function(event) {
  let app = require('./UserStory_LocatePayment');
  return await app.Attachment_Check(event);
}

exports.LocatePayment_AddAttachment = async function (event) {
  let app = require('./UserStory_LocatePayment');
  return await app.Addattachment(event);
}
//-----------------------------------------------------------
// OLO Auth Use Case
//-----------------------------------------------------------
exports.OLO_authentication= async function(event){
  let app = require('./UserStory_OLOAuthentication');
   return await app.OLO_authentication(event);
}

exports.olo_authentication_yes_input = async function(event){
   let app = require('./UserStory_OLOAuthentication');
    return await app.OLOAuthentication_yes_input(event);
}

exports.olo_authentication_no_Passportinput = async function(event){
  let app = require('./UserStory_OLOAuthentication');
  return await app.OLOAuthentication_no_Passportinput(event);

}

exports.olo_authentication_VerifyCBR = async function(event){
  let app = require('./UserStory_OLOAuthentication');
  return await app.OLOAuthentication_VerifyCBR(event);

}

exports.OLO_VerifyCBRFailed_FibreAccInput = async function(event){
  let app = require('./UserStory_OLOAuthentication');
  return await app.OLO_VerifyCBRFailed_FibreAccInput(event);

}

// exports.OLO_VerifyFibreAccPassed_UpdateCBR_yes = async function(event){
//   let app = require('./UserStory_OLOAuthentication');
//   return await app.OLO_VerifyFibreAccPassed_UpdateCBR_yes(event);

// }

// exports.OLO_VerifyFibreAccPassed_UpdateCBR_no = async function(event){
//   let app = require('./UserStory_OLOAuthentication');
//   return await app.OLO_VerifyFibreAccPassed_UpdateCBR_no(event);

// }

// exports.Greeting_Authentication_OLO_VerifyTAC = async function(event){
//   let app = require('./UserStory_OLOAuthentication');
//   return await app.Greeting_Authentication_OLO_VerifyTAC(event);

// }

// //--------------------------------------CHECK DEVICE STOCK------------------------------

exports.DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_Channel_Store = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.DiscoverMaxisProductServices_CheckDeviceStock_Channel_Store(event);

}

exports.DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_Channel_Online = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.DiscoverMaxisProductServices_CheckDeviceStock_Channel_Online(event);

}

exports.DiscoverMaxisProductServices_PostpaidBroadband_Device_CheckDeviceStock_PreferredAddress_Billing = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.DiscoverMaxisProductServices_CheckDeviceStock_Channel_Store_PreferredAddress_Billing(event);

}

exports.CheckDeviceStockClosingNotRightNow =async function(event){
  // let UTIL= require('./Util');
  return UTIL.ComposeResult("","CheckDeviceStock_Closure")
}

exports.Coordinates_Check = async function(event) {
  let app = require('./UserStory_CheckDeviceStock');
  return await app.Coordinates_Check(event);
}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreSelection_Input = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_MaxisCentreSelection_Input(event);

}

exports.DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_OfferProceedStore = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.DiscoverMaxisProductServices_HotlinkPostpaid_Device_CheckDeviceStock_OfferProceedStore(event);

}

exports.DiscoverMaxisProductServices_PostpaidBroadban_Device_CheckDeviceStock_Address_ManualInput_Wh = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.DiscoverMaxisProductServices_PostpaidBroadban_Device_CheckDeviceStock_Address_ManualInput_Wh(event);

}

exports.DiscoverMaxisProductServices_Postpaid_MaxBotIdle_DTS_WA = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.DiscoverMaxisProductServices_Postpaid_MaxBotIdle_DTS_WA(event);

}

exports.DiscoverMaxisProductServices_Postpaid_Device_CheckDeviceStock_DropPIN_NoStores_AnotherAddress_WH = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.DiscoverMaxisProductServices_CheckDeviceStock_Channel_Store(event);

}

exports.MaxbotIdle_Postpaid_CheckDeviceStock_ContractSelection = async function(event){
  let app = require('./UserStory_CheckDeviceStock');
  return await app.MaxbotIdle_Postpaid_CheckDeviceStock_ContractSelection(event);
}

// exports.DiscoverMaxisProductServices_MaxisPostpaid_OnlineStock = async function(event){
//   let app = require("./UserStory_DeviceDiscovery");
//   return await app.MaxisPostpaidOnlineStock(event);
// }


// }
exports.Manage_MyVas_Query = async function(event){
  let app = require('./UserStory_ManageVas');
  return await app.Manage_Vas_Wh(event);
  }

exports.Manage_DigitalSpendLimit_Query = async function(event){
  let app = require('./UserStory_ManageDigitalSpendLimit');
  return await app.Manage_Digital_Spend_Limit(event);
  }

//----------------------------------------NOTIFY ME-----------------------------------------

exports.DiscoverMaxisProduct_PostpaidBroadband_CheckDeviceStock_AcceptNotifyMe_ContactNo_Wh = async function(event){
  let app = require('./UserStory_NotifyMe');
  return await app.DiscoverMaxisProductServices_CheckDeviceStock_NotifyMe(event);
}

// ------------- Check Device Delivery Status -------------------
exports.Maxis_CheckMyDeliveryStatus_Start =async function(event){
  let app = require("./UserStory_CheckDeliveryStatus");
  return await app.Maxis_CheckMyDeliveryStatus_Start(event);
  // return UTIL.ComposeResult("","Maxis_CheckMyDeliveryStatus_Start_Display");
}

exports.HotlinkPostPaid_CheckMyDeliveryStatus_Start =async function(event){
  let app = require("./UserStory_CheckDeliveryStatus");
  return await app.HotlinkPostPaid_CheckMyDeliveryStatus_Start(event);
  // return UTIL.ComposeResult("","HotlinkPostPaid_CheckMyDeliveryStatus_Start_Display");
}

exports.HotlinkPrePaid_CheckMyDeliveryStatus_Start =async function(event){
  let app = require("./UserStory_CheckDeliveryStatus");
  return await app.HotlinkPrePaid_CheckMyDeliveryStatus_Start(event);
  // return UTIL.ComposeResult("","HotlinkPrePaid_CheckMyDeliveryStatus_Start_Display");
}

exports.Manage_Billing_Tac =async function(event){
  let app = require("./UserStory_CheckDeliveryStatus");
  return await app.Manage_Billing_Tac(event);
}

// Prepaid Unblock TopUp Access

exports.TopUp_Unblock_NumberQuery1_Auth = async function(event){
  let app = require("./UserStory_Unblock_TopUp");
  return await app.Prepaid_TopUp_Unblock_Auth(event);
}

exports.Prepaid_Unblock_Topup_Own_Number_Confirm = async function(event){
  let app = require("./UserStory_Unblock_TopUp");
  return await app.Prepaid_Unblock_Topup_Own_Number_Confirm_process(event);
}

exports.Prepaid_Unblock_Topup_Own_Number = async function(event){
  let app = require("./UserStory_Unblock_TopUp");
  return await app.Prepaid_Unblock_Topup_Own_Number_process(event);
}

exports.Prepaid_Unblock_Topup_Other_Number = async function(event){
  let app = require("./UserStory_Unblock_TopUp");
  return await app.Prepaid_Unblock_Topup_Other_Number_process(event);
}

exports.Prepaid_Unblock_TopUp_Own_number_Offer_Link = async function(event){
  let app = require("./UserStory_Unblock_TopUp");
  return await app.Prepaid_Unblock_TopUp_Own_number_Offer_Link_process(event);
}

exports.Prepaid_Unblock_TopUp_Other_Number_Offer_Link = async function(event){
  let app = require("./UserStory_Unblock_TopUp");
  return await app.Prepaid_Unblock_TopUp_Other_Number_Offer_Link_process(event);
}

//-----------------------------------------------------------
// Hybrid Bot Use Case
//-----------------------------------------------------------
exports.Hybrid_DiscoveryAndPurchase_ExploreALLDevices = async function(event) {
  console.log("inside Hybrid_DiscoveryAndPurchase_ExploreALLDevices");
  let app = require("./UserStory_Hybrid_DisAndPur");
  return await app.hybrid(event);
}

//-----------------------------------------------------------
// Sentiment Analysis Use Case
//-----------------------------------------------------------
exports.AgentHandover_Sentiment_AgentAssist_Offer_No = async function(event){
  console.log(" inside AgentHandover_Sentiment_AgentAssist_Offer_No");
  let sessionID   = UTIL.GetSessionID(event);
  let cacheIntent   = await SESSION.GetCache(sessionID);
  let agentAssistIntent = cacheIntent["agentAssistIntent"]
  console.log("agentAssistIntent : ",agentAssistIntent)
  if(agentAssistIntent) return UTIL.ComposeResult("", agentAssistIntent)
  else return UTIL.ComposeResult("", 'greetings_commonMenu_displayName');
  // else return UTIL.ComposeResult("", 'main_menu_olo');
  // return UTIL.ComposeResult("", 'Greeting_Start');
}

exports.AgentHandover_Sentiment_AgentAssist_Offer_Yes = async function(event){
  console.log(" inside AgentHandover_Sentiment_AgentAssist_Offer_Yes");
  return UTIL.ComposeResult("", 'AgentHandover_Sentiment_AgentAssist_Common');
  // let sessionID   = UTIL.GetSessionID(event);
  // let customerType = await SESSION.GetCustomerType(sessionID);
  // console.log("CustomerType : ",customerType)
  // if(customerType){
  //   if(customerType.planName.toLowerCase().includes('maxis postpaid')){
  //     return UTIL.ComposeResult("", 'AgentHandover_Sentiment_AgentAssist_MaxisPostpaid');
  //   }else if(customerType.planName.toLowerCase().includes('hotlink postpaid')){
  //     return UTIL.ComposeResult("", 'AgentHandover_Sentiment_AgentAssist_HotlinkPostpaid');
  //   }else if(customerType.planName.toLowerCase().includes('hotlink prepaid')){
  //     return UTIL.ComposeResult("", 'AgentHandover_Sentiment_AgentAssist_HotlinkPrepaid');
  //   }else{
  //     return UTIL.ComposeResult("", 'AgentHandover_Sentiment_AgentAssist_Common');
  //   }
  // }else{
  //   return UTIL.ComposeResult("", 'AgentHandover_Sentiment_AgentAssist_Common');
  // }

}

// Knowledge Crawler

exports.KnowledgeCrawler_Restart = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Restart(event);
}

exports.KnowledgeCrawler_Maxis_Start = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Maxis_Start(event);
}

exports.KnowledgeCrawler_Hotlink_Start = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Hotlink_Start(event);
}

exports.KnowledgeCrawler_Selected = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Selected(event);
}

exports.KnowledgeCrawler_Maxis_Yes = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Maxis_Yes(event);
}

exports.KnowledgeCrawler_Hotlink_Yes = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Hotlink_Yes(event);
}

exports.KnowledgeCrawler_NoAnswer_Maxis = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_NoAnswer_Maxis(event);
}

exports.KnowledgeCrawler_NoAnswer_Hotlink = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_NoAnswer_Hotlink(event);
}

exports.KnowledgeCrawler_No = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_No(event);
}

exports.KnowledgeCrawler_Continue_Maxis = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Continue_Maxis(event);
}

exports.KnowledgeCrawler_Continue_Hotlink = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Continue_Hotlink(event);
}

exports.KnowledgeCrawler_Attachment_Check = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Attachment_Check(event);
}

exports.KnowledgeCrawler_Webhook = async function(event){
  let app = require('./UserStory_KnowledgeCrawler');
  return await app.KnowledgeCrawler_Webhook(event);
}

exports.Greeting_Authentication_MobileNo_Input_Query = async function(event) {
  let app = require('./UserStory_TAC');
  return await app.Greeting_Authentication_MobileNo_Input_Query(event);
}

exports.Authentication_OLO_Multichannel_Query = async function(event) {
  let app = require("./UserStory_TAC");
  return await app.Authentication_OLO_Multichannel_Query(event);
}
exports.PrepaidTopup_iShare_FAQ_Query = async function(event) {
  let app = require("./UserStory_TopUp");
  return await app.PrepaidTopup_iShare_FAQ_Query(event);
}


exports.Authentication_OLO_Multichannel_NRIC_Query = async function(event) {
  let app = require("./UserStory_TAC");
  return await app.Authentication_OLO_Multichannel_NRIC_Query(event);
}

exports.Authentication_OLO_Multichannel_Passport_Query = async function(event) {
  let app = require("./UserStory_TAC");
  return await app.Authentication_OLO_Multichannel_Passport_Query(event);
}

exports.Authentication_OLO_Multichannel_VerifyCBRFailed_FibreAccInput = async function(event) {
  let app = require("./UserStory_TAC");
  return await app.Authentication_OLO_Multichannel_VerifyCBRFailed_FibreAccInput(event);
}

exports.Shared_Closure_Entry = async function(event) {
  let app = require('./UserStory_Closure');
  return await app.ClosureEntry(event);
}

exports.CheckCaseStatus_TroubleshootMobile_Query = async function(event) {
  let app = require('./UserStory_Closure');
  return await app.CheckCaseStatus_TroubleshootMobile_Query(event);
}

exports.Shared_Closure_Entry_BM = async function(event) {
  let app = require('./UserStory_Closure');
  return await app.ClosureEntryBM(event);
}

exports.Paybill_Perform_Topup_Query = async function(event) {
  let app = require('./UserStory_TopUp');
  return await app.PrepaidTopup_TopupHistory_Wh(event, "Paybill_Perform_Topup");
}

//-----------------------------------------------------------
//  Image Recognition Call
//-----------------------------------------------------------

exports.IRTR_RouterImageUploadYes_Check = async function (event) {
  let app = require('./UserStory_ImageRecognition');
  return await app.IRTR_RouterImageUploadYes_Check_Attempts(event);
}

exports.IRTR_Network_Fibre_Wifi_UploadRouterPhoto_Confirmation_Input = async function(event){
  let app = require('./UserStory_ImageRecognition');
  return await app.IRTR_RouterImageGuideline(event);
}

exports.IRTR_FristRouterImage_AttachmentCheck = async function (event) {
  let app = require('./UserStory_ImageRecognition');
  return await app.IRTR_trigger(event);
}

// exports.IRTR_ResizeImage_UploadImage_GCP_Bucket = async function (event) {
//   let app = require('./UserStory_ImageRecognition');
//   return await app.IRTR_Upload_GCP_Bucket(event)
// }

exports.IRTR_IR_API_Initiate = async function (event) {
  console.log("CALL IRTR_IR_API_Initiate >>");
  let app = require('./UserStory_ImageRecognition');
  return await app.IRTR_Trigger_Result(event)
}

exports.IRTR_Network_Fibre_SlowWifi_IR_Only_CreateCase_Start = async function(event) {
  let app = require('./UserStory_ImageRecognition')
  return await app.IRTR_Perform_DiagnosticTest_No(event)
}

exports.IRTR_Network_Fibre_Wifi_AttachSecondImagetoCase_WH = async function(event) {
  let app = require('./UserStory_ImageRecognition')
  return await app.IRTR_AddAttachment_ToCaseID(event)
}

// DiagnosticResultsWithout Image

exports.Shared_Invalid_Input_IR = async function(event){
  let app = require('./UserStory_ImageRecognition');
  return await app.Shared_Invalid_IR_lastEvent(event)
}

exports.Shared_Image_Attachment_virus = async function(event){
  let app = require('./UserStory_ImageRecognition');
  return await app.Shared_Image_with_Virus(event)
}

exports.IRTR_Network_Fibre_Wifi_UploadRouterPhoto_FirstPhoto_IndicatorLights_NoIR_Input=async function(event){
  let app = require('./UserStory_ImageRecognition');
  return await app.IRTR_UploadFirstPhoto_WithoutIR_API_Call(event)
}

exports.IRTR_NoIR_FirstPhoto_AttachementCheck=async function(event){
  let app = require('./UserStory_ImageRecognition')
  return await app.IRTR_NoIR_FirstPhoto_AttachementCheck_Start(event)
}

exports.IRTR_NoIR_SecondPhoto_AttachmentCheck =async function(event){
  let app = require('./UserStory_ImageRecognition')
  return await app.IRTR_NoIR_SecondPhoto_AttachementCheck_Start(event)
}

exports.IRTR_Network_Fibre_Wifi_RouterSwitchedOn_Connection_Not_Restored = async function(event){
  let app = require('./UserStory_ImageRecognition')
  return await app.IRTR_RouterSwitchedon_Connection_Not_Restored(event)
}

exports.IRTR_UploadSecondImage_DicagnotsticResults_AttachementCheck=async function(event){
  let app = require('./UserStory_ImageRecognition')
  return await app.IRTR_UploadSecondImage_IR_AttachementCheck(event)
}

exports.IRTR_Case_Creation_NoIR_Start=async function(event){
  let app = require('./UserStory_ImageRecognition')
  return await app.IRTR_No_IR_Case_Addattachment(event)
}

exports.IRTR_Network_Fibre_Wifi_DiagnosticCheckResults_NoIR_CaseCreation=async function(event){
  let app = require('./UserStory_DiagnosticCallback')
  return await app.IRTR_DiagnosticCheck_NoIR_CaseCreation(event)
}

exports.IRTR_DiagnosticResult_NoIR_NoFirstImage_CaseCreation_Start =async function(event){
  let app =require('./UserStory_DiagnosticCallback')
  return await app.IRTR_DiagnosticCheck_NoIR_CaseCreation(event)
}

exports.IRTR_DiagnosticResult_FristImage_NoSecondImage_CaseCreation_Strat = async function(event){
  let app = require('./UserStory_DiagnosticCallback')
  return await app.DiagonsticResultNoErrorCRM(event)
}

exports.IRTR_NegativeDiagnotsticResult_NoIR_InvalidImageCaseCreation = async function(event){
  let app = require('./UserStory_DiagnosticCallback')
  return await app.AssistanceYes(event)
}

exports.Manage_OtherLine_Start=async function(event){
  let app = require('./UserStory_ManageOtherLine')
  return await app.Manage_OtherLine_Start(event)
}

exports.Manage_OtherLine_Principal_Yes=async function(event){
  let app = require('./UserStory_ManageOtherLine')
  return await app.Manage_OtherLine_Principal_Yes(event)
}

exports.Manage_OtherLine_Check_Last6Digit_NRIC=async function(event){
  let app = require('./UserStory_ManageOtherLine')
  return await app.Manage_OtherLine_Check_Last6Digit_NRIC(event)
}

exports.Manage_OtherLine_Switch_MSISDN=async function(event){
  let app = require('./UserStory_ManageOtherLine')
  return await app.Manage_OtherLine_Switch_MSISDN(event)
}