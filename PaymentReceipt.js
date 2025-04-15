const fs = require('fs');
const chromium = require('chrome-aws-lambda');
const SESSION = require("./Handler_Session");
const RC = require("./Handler_RingCentral");
const UTIL = require("./Util");

let browser = null;

async function GeneratePaymentReceipt(paymentList, accountNo, cusName) {
    var html;
    try {
        let imageBaseBg = await fs.readFileSync(`${process.env.LAMBDA_TASK_ROOT}/images/path@3x.png`,
            "base64")
        let imageBaseHeader = await fs.readFileSync(`${process.env.LAMBDA_TASK_ROOT}/images/header.png`,
            "base64")
        var htmlx = '';
        for (let i in paymentList) {
            htmlx += `<tr>
                <td><span>
                ${UTIL.String_ToDD_MM_YYYY(paymentList[i].paymentdate)}
                    </span></td>
                <td><span>${accountNo}</span></td>
                <td><span class="Successful">
                        Successful
                    </span></td>
                <td><span class="RM-500">
                RM ${UTIL.ToCurrency(paymentList[i].paymentamount)}
                    </span></td>
            </tr>`
        }

        html = `<html>
    
        <head>
            <title>Maxis</title>
            <style>
                .bg-image {
                    /* background-image: url("img/path@3x.png"); */
                    background: url(data:image/png;base64,${imageBaseBg});
                    background-repeat: no-repeat;
                    -webkit-background-size: cover;
                    -moz-background-size: cover;
                    -o-background-size: cover;
                    background-size: cover;
                }
                .bottom-bg {
                    background: #e6e6e6;
                    background: #e6e6e6;
                    padding: 90px 0 0 10px;
                }
                .DCC_Payment-Receipt {
                    width: 600px;
                    height: 398px;
                    padding: 30px 0 40px;
                }
                img.header {
                    float: right;
                    position: absolute;
                    right: 35px;
                }
                img.Path {
                    width: 600px;
                    height: 242px;
                    margin: 20px 0 26px;
                    padding: 30px 173px 73px 40px;
                    object-fit: contain;
                }
                .Dear-Customer-Name {
                    width: 387px;
                    height: 23px;
                    margin: 30px 0 8px;
                    font-family: Maxis;
                    font-size: 20px;
                    font-weight: bold;
                    font-stretch: normal;
                    font-style: normal;
                    line-height: normal;
                    letter-spacing: normal;
                    color: #c4dad5;
                }
                .Thank-you-for-your-p {
                    width: 387px;
                    height: 36px;
                    margin: 8px 0 0;
                    font-family: Maxis;
                    font-size: 15px;
                    font-weight: normal;
                    font-stretch: normal;
                    font-style: normal;
                    line-height: normal;
                    letter-spacing: normal;
                    color: #fff;
                }
                .Rectangle-Copy {
                    border-radius: 2px;
                    background-color: #fff;
                    border-radius: 14px;
                }
                .Rectangle {
                    border-radius: 14px;
                    box-shadow: 0 6px 12px 0 rgb(0 0 0 / 17%);
                    background-color: #fff;
                    z-index: 1;
                    position: relative;
                    height: auto;
                    top: 6em;
        
                }
                .Date,
                .Maxis-Account-No,
                .Status,
                .Amount-Paid {
                    font-family: Maxis;
                    font-size: 18px;
                    font-weight: 900;
                    font-stretch: normal;
                    font-style: normal;
                    line-height: normal;
                    letter-spacing: normal;
                    color: var(--blue-grey);
                }
                span,
                .Successful,
                .RM-500 {
                    width: 90px;
                    height: 17px;
                    font-family: Maxis;
                    font-size: 18px;
                    font-weight: normal;
                    font-stretch: normal;
                    font-style: normal;
                    line-height: normal;
                    letter-spacing: normal;
                    color: #3e4a56;
                }
                .p1 {
                    padding: 25px;
                    width: auto;
                    height: auto;
                }
                .c2 {
                    margin: 37px 0 0 0;
                }
                .c3 {
                    margin: 10px 0 0 0;
                }
                td {
                    padding: 0 0 0 25px;
                }
                td span {
                    margin: 0 0 0 10px;
                }
                th {
                    padding: 10px 0 25px 25px;
                }
                table,
                td,
                th {
                    text-align: left;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-top: 10px;
                }
                th,
                td {
                    padding: 12px;
                }
                .headingTr {
                    background: #e6e6e6;
                }
                .headerBg {
                    background: #e6e6e6;
                    width: 100%;
                    width: 100%;
                    padding: 15px 0 60px 0;
                }
                .headerImageChild {
                    width: 100%;
                    display: block;
                    position: relative;
                }
            </style>
        </head>
        <header>
        </header>
        
        <body>
            <div class="container">
                <div class="row bg-color">
                    <div class="col-sm-12 headerBg">
                        <div class="headerImageChild"><img src="data:image/gif;base64,${imageBaseHeader}" class="header"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-12">
                        <div class="bg-image">
                            <div class="p1">
                                <div class="c1">
                                    <h1 style="font-size: xx-large" class="Dear-Customer-Name">
                                        Payment Summary
                                    </h1>
                                </div>
                                <div class="c2">
                                    <span class="Dear-Customer-Name">
                                        Dear ${cusName},
                                    </span>
                                </div>
                                <div class="c3">
                                    <span class="Thank-you-for-your-p">
                                        Thank you for your payment. The details are as follows:
                                    </span>
                                </div>
                                <div class="Rectangle">
                                    <div class="Rectangle-Copy">
                                        <table>
                                            <tr class="headingTr">
                                                <th><span class="Date">
                                                        Date
                                                    </span>
                                                </th>
                                                <th><span class="Maxis-Account-No">
                                                        Maxis Account No.
                                                    </span></th>
                                                <th><span class="Status">
                                                        Status
                                                    </span></th>
                                                <th>
                                                    <span class="Amount-Paid">
                                                        Amount Paid
                                                    </span>
                                                </th>
                                            </tr>
                                            ${htmlx}
                                            
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row bg-color">
                    <div class="bottom-bg"></div>
                </div>
            </div>
        </body>
        </html>`
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: false,
            ignoreHTTPSErrors: true,
        });
        let page = await browser.newPage();
        if (paymentList.length <= 1) {
            await page.setViewport({ width: 1200, height: 500 });
        } else if (paymentList.length >= 2 && paymentList.length <= 4) {
            await page.setViewport({ width: 1200, height: 600 });
        } else if (paymentList.length >= 5 && paymentList.length <= 7) {
            await page.setViewport({ width: 1200, height: 767 });
        } else {
            await page.setViewport({ width: 1200, height: 800 });
        }

        await page.setContent(html)

        let imageName = `maxis`;
        let extensionImage = `.png`;
        await page.screenshot({ path: `/tmp/${imageName + extensionImage}` })
        
        await browser.close();
        var imageAsBase64 = await fs.readFileSync(`/tmp/${imageName + extensionImage}`);
        return imageAsBase64;
    } catch (err) {
        console.log("Error while Generating  payment receipt", err);
    }
}


async function createAttachment(msisdn, img) {
    let FormData = require('form-data');
    var imgUrl = `${msisdn}-payment-receipt-stage.png`;
    let url = `https://maxis.api.engagement.dimelo.com/1.0/attachments?access_token=${UTIL.RC_ACCESS_TOKEN}`;
    let Form = new FormData();
    Form.append('file', img, imgUrl);
    try {
        let attachment = await UTIL.GetUrl(url, { "method": "POST", "body": Form });
        return attachment.id;
    }
    catch (err) {
        console.log("🔻 RingCentral: Attachment Error", JSON.stringify(err));
        return undefined;
    }
}

exports.RetrievePayment = async function (event, context) {
    isValid = true;  //👈 needed for returing status of api (200 or 400)
    let queryText = "";
    let cusName = event.cusName;
    let accountNo = event.accountNo;
    let paymentDetails = event.paymentDetails;
    let msisdn = event.msisdn;
    let sessionID = event.sessionID;
    let generatingImage = await GeneratePaymentReceipt(paymentDetails, accountNo, cusName);
    let createAT = await createAttachment(msisdn, generatingImage);
    context = await SESSION.GetContext(sessionID);
    let replyId = await SESSION.getMessageId(sessionID);
    await RC.Call(replyId, "", createAT);
    console.log(`📞 RingCentral: [${sessionID}][${queryText}]`);
}