const UTIL = require("./Util");

exports.BusinessHour = async function (event) {
  let csStartDay = UTIL.GetParameterValue(event, "csStartDay");
  let csEndDay = UTIL.GetParameterValue(event, "csEndDay");
  let csStartTime = UTIL.GetParameterValue(event, "csStartTime");
  let csEndTime = UTIL.GetParameterValue(event, "csEndTime");

  if (UTIL.IsAgentOnline(csStartDay,csEndDay,csStartTime, csEndTime))
    return UTIL.ComposeResult(""," Shared_Agent_Billing_Online");
  else
    return UTIL.ComposeResult(""," Shared_Agent_Billing_Offline");
};
