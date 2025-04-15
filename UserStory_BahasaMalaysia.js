const SESSION = require("./Handler_Session");
const UTIL = require("./Util")


exports.GeneralBM =  async function (event) {
  let agentCategoryId = UTIL.GetParameterValue(event,"agentCategoryId");
  let details   = UTIL.GetParameterValue(event,"details");

  await SESSION.SetHandOver(sessionID,{"IsHandOver":true, "AgentId": agentCategoryId} )

}

