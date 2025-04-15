const SESSION   = require("./Handler_Session")
const UTIL      = require("./Util")
const HOST      = require("./Handler_Host");

async function getBillMethod(msisdn, sessionID) {
        let result = false;
      
        let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/methods`;
        let head = {
          "headers": {"content-type":"application/json","msisdn":msisdn,"maxis_channel_type":"MAXBOT","languageid" : "en-US"}     
        };
      
        let data   = await UTIL.GetUrl(url,head,msisdn,sessionID);
        return data.responseData;
      
}

async function getAccounts(msisdn,sessionID)
{
    let url  = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/accounts?checkfssp=true&checkroaming=true`;
    let head = {"headers": {"Content-Type" : "application/json", "msisdn" : msisdn, "maxis_channel_type" : "MAXBOT"}};
    
    let data = await UTIL.GetUrl(url,head,msisdn, sessionID);
        data = data.responseData;
    return data;
}

async function sendStatement(msisdn, accountNo, customerName, address, emailAddress, sessionID) {
      
        let url = `${HOST.BILLING[HOST.TARGET]}/billing/api/v4.0/bills/statements/summary/email`;
        let head = {
          "headers": {"content-type": "application/json", "msisdn": msisdn, "maxis_channel_type": "MAXBOT", "languageid": "en-US"}, 
          "method" : "POST",
          "body": JSON.stringify( {  
                "year": (new Date().getFullYear() - 1).toString(), 
                "accountNo": accountNo, 
                "email": emailAddress, 
                "addressLine1": address.addressLine1 == null ? "" : address.addressLine1,
                "addressLine2": address.addressLine2 == null ? "" : address.addressLine2, 
                "postcode": address.postcode,
                "city": address.city,
                "state": address.state,
                "customerName": customerName
        })
        };
        let data   = await UTIL.GetUrl(url,head,msisdn, sessionID);
        return data;
          
}

exports.TaxStatementRequest =  async function (event) {
        let sessionID = UTIL.GetSessionID(event);
        let msisdn = await SESSION.GetMSISDN(sessionID);
        //------------------------------------------------------------------------------
        //🔐EXECUTE AUTHENTICATION
        //------------------------------------------------------------------------------
        let redirectToEvent = await UTIL.Authenticate(event,msisdn,sessionID);
        if (redirectToEvent != undefined) return UTIL.ComposeResult("",redirectToEvent);
        //-------------------------------------------------------------------------------
        let Cache = await SESSION.GetCache(sessionID)
        let accData = '';
        if (Cache.customerData.responseData == null) {
                console.log('***Cache.getCustomerforNRICPassport****');
                accData = Cache.getCustomerforNRICPassport.responseData;
               // msisdn = accData.accounts[0].msisdns[0].serviceId;
               const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
               if (serviceId.length !== 0) {
                 console.log("if for get nirc and passport", accData.accounts[0].msisdns[0].serviceId);
                 msisdn = serviceId[0].serviceId;
               } else {
                 console.log("else for get nirc and passport", accData.accounts[0].msisdns[0].serviceId);
                 msisdn = accData.accounts[0].msisdns[0].serviceId;
               }
               console.log('New MSISDN >> ', msisdn);
             }
           console.log("final msisdn>>>>>", msisdn);
        let bilData = await getBillMethod(msisdn,sessionID);

        if (bilData.preferMethod == "postalAddress"){
                if (bilData.pendingEmailAddress) {
                        return UTIL.ComposeResult("","Billing_TaxStatementRequest_PendingEbill", {"ebillEmailAddress": bilData.pendingEmailAddress});
                }
                else {
                        return UTIL.ComposeResult("","Billing_TaxStatementRequest_NoEbill");
                }
        }
        else { 
                return UTIL.ComposeResult("","Billing_TaxStatementRequest_EmailQuery", {"ebillEmailAddress": bilData.emailAddress});       
        } 
}

exports.EmailQuery_Yes = async function(event){
        let sessionID = UTIL.GetSessionID(event);
        let Cache = await SESSION.GetCache(sessionID)
        let msisdn;
        let accData = '';
        if (Cache.customerData.responseData == null) {
                console.log('***Cache.getCustomerforNRICPassport****', Cache.getCustomerforNRICPassport);
               accData = Cache.getCustomerforNRICPassport.responseData;
               const serviceId = accData.accounts[0].msisdns.filter((x) => x.serviceType === 'FTTH');
               if (serviceId.length !== 0) {
                 console.log("if for get nirc and passport", accData.accounts[0].msisdns[0].serviceId);
                 msisdn = serviceId[0].serviceId;
               } else {
                 console.log("else for get nirc and passport", accData.accounts[0].msisdns[0].serviceId);
                 msisdn = accData.accounts[0].msisdns[0].serviceId;
               }
               console.log('New MSISDN >> ', msisdn);
             } else {
             // else get
             console.log("default msisdn");
             msisdn = await SESSION.GetMSISDN(sessionID);
             console.log("default msisdn",msisdn);
             }
        
        let accountData     = await getAccounts(msisdn,sessionID);
        let bilData = await getBillMethod(msisdn, sessionID);

        // Add email API here
        let emailResponse = await sendStatement(msisdn, accountData.accountNo, accountData.contact.customerName, bilData.address, bilData.emailAddress,sessionID);

        
        if (emailResponse.responseData == true){
                console.log(`Annual bill sent successfully`);
                return UTIL.ComposeResult("","Billing_TaxStatementRequest_EmailQuery_CaseCreated", {"ebillEmailAddress": bilData.emailAddress});
        }
        else{
                console.log(`Annual bill sent within 24 hours`);
                return UTIL.ComposeResult("","Billing_TaxStatementRequest_ExistingCase", {"ebillEmailAddress": bilData.emailAddress});
        }     
}

exports.EmailAddress_Yes = async function(event){
        
        let sessionID = UTIL.GetSessionID(event);
        let msisdn = await SESSION.GetMSISDN(sessionID);
        let EmailAddress = UTIL.GetParameterValue(event,"TaxStatmentEmailAddress")
        console.log("EmailAddress")
        let accountData     = await getAccounts(msisdn, sessionID);
        let bilData = await getBillMethod(msisdn,sessionID);

        // Add email API here
        let emailResponse = await sendStatement(msisdn, accountData.accountNo, accountData.contact.customerName, bilData.address, EmailAddress,sessionID);

        
        if (emailResponse.responseData == true){
                console.log(`Annual bill sent successfully`);
                return UTIL.ComposeResult("","Billing_TaxStatement_NoEbill_EmailAddress_Submited", {"TaxStatmentEmailAddress": EmailAddress});
               
        }
        else{
                console.log(`Annual bill sent within 24 hours`);
                return UTIL.ComposeResult("","Billing_TaxStatment_NoEbill_EmailAddress_Duplicate", {"TaxStatmentEmailAddress": EmailAddress});
        }     
}