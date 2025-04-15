const SESSION   = require("./Handler_Session")
const UTIL      = require("./Util")
const HOST      = require("./Handler_Host");


exports.Q1_Yes =  async function (event, isBM=false) {
        let param = {
                "contactName"           : UTIL.GetParameterValue(event, "contactName"),
                "contactCompanyName"    : UTIL.GetParameterValue(event, "contactCompanyName"),
                "contactState"          : UTIL.GetParameterValue(event, "contactState"),
                "contactPostcode"       : UTIL.GetParameterValue(event, "contactPostcode")
        };

        let evt     = isBM ? "SMEGrant_Bm_EligibleYes" : "SMEGrant_EligibleYes";
        return UTIL.ComposeResult("", evt, param);
       
}

exports.Q1_No = async function(event, isBM=false){        
        let param = {
                "contactName"           : UTIL.GetParameterValue(event, "contactName"),
                "contactCompanyName"    : UTIL.GetParameterValue(event, "contactCompanyName"),
                "contactState"          : UTIL.GetParameterValue(event, "contactState"),
                "contactPostcode"       : UTIL.GetParameterValue(event, "contactPostcode")
        };

        let evt     = isBM ? "SMEGrant_EligibleNo" : "SMEGrant_Bm_EligibleNo";
        return UTIL.ComposeResult("", evt, param);
}


