/**
 * Module Description
 * 
 * Version    Date            Author           File
 * 1.00       24 Aug 2021     Nikita     MHL_delete_refunds.js
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function schedule_delete_record() {
    var o_context = nlapiGetContext();
    try {

        var i_index = o_context.getSetting('SCRIPT', 'custscript_mhl_initiate_index');
        var fileID = o_context.getSetting('SCRIPT', 'custscript_mhl_delete_file_id');
        //var i_index = o_context.getParameter('i_last_index');
        nlapiLogExecution("debug", "i_index", i_index)
        if (!i_index)
            i_index = 1;

        nlapiLogExecution("audit", "later i_index", i_index)

        //var fileID = '12953058';

        var o_fileObj = nlapiLoadFile(fileID);
        var contents = o_fileObj.getValue();

        var dataLine = contents.split(/\n|\n\r/);
        nlapiLogExecution("audit", "later dataLine.length", dataLine.length)
        //return false;
        for (var i = i_index; i < dataLine.length; i++) {

           /* var runScript = o_context.getSetting('SCRIPT', 'custscript_mhl_last_index');
            if (runScript == "Stop") {
                nlapiLogExecution('DEBUG', 'runScript', runScript);
                break;
            }
			*/
            var rowsLine = dataLine[i].split(",");
            var internalId = rowsLine[0];
            var transactionTpye = rowsLine[1];
            nlapiLogExecution('Debug', 'transactionTpye', transactionTpye);

            if (transactionTpye) {
                transactionTpye = transactionTpye.trim();
                var i_usage_end = o_context.getRemainingUsage();
                if (i_usage_end <= 20) {
                    nlapiLogExecution("audit", "Reschedule", "Script Reschedule at point " + i)
                    //o_context.setSetting("SCRIPT", "custscript_sch_initiate_index", i);
                    var params = new Array();
                    params['custscript_mhl_initiate_index'] = i;
                    var status = nlapiScheduleScript('customscriptmhl_delete_cust_refunds', 'customdeploymhl_delete_cust_refunds', params);
                    nlapiLogExecution("debug", "status", status)

                    if (status == 'QUEUED')
                        break;
                }

                try {
                    if (internalId) {
                     

                        var custRefundObj = nlapiLoadRecord('customerrefund', internalId);

                        var c_cr_lineCount = custRefundObj.getLineItemCount('apply');
                       // nlapiLogExecution('Debug', 'c_cr_lineCount : ', c_cr_lineCount);
						
                      //  nlapiLogExecution('Debug', 'internalid : ', internalId);

                        for (var j = 1; j <= c_cr_lineCount; j++) {

                            //log.debug("cust refund line count");

                            //Select line
                            custRefundObj.selectLineItem('apply', j);
                           

                            var applyTrantype = custRefundObj.getCurrentLineItemValue('apply', 'trantype');

                           // nlapiLogExecution('Debug', 'applyTrantype', applyTrantype);

                            var creditMemoId = custRefundObj.getCurrentLineItemValue('apply', 'internalid');

                            nlapiLogExecution('Debug', 'creditMemoId', creditMemoId);

                            if (applyTrantype == 'CustCred') {

                              //  nlapiLogExecution('Debug', ' in condition applyTrantype', applyTrantype);

                                var creditMemoObj = nlapiLoadRecord('creditmemo', creditMemoId);

                               // creditMemoObj.setFieldValue('custbody_in_nature_of_document', 3);

                                var CMlineCount = creditMemoObj.getLineItemCount('apply');
                               // nlapiLogExecution('Debug', 'CMlineCount : ', CMlineCount);

                                for (var h = 1; h <= CMlineCount; h++) {

                                    //log.debug("cust refund line count");

                                    //Select line
                                    creditMemoObj.selectLineItem('apply', h);

                                    var i_custRefundId = creditMemoObj.getCurrentLineItemValue('apply', 'doc');

                                   // 

                                    var applyCMTrantype = creditMemoObj.getCurrentLineItemValue('apply', 'trantype');

                                   // nlapiLogExecution('Debug', 'applyCMTrantype', applyCMTrantype);

                                    if (applyCMTrantype == 'CustRfnd') 
									{
										nlapiLogExecution('Debug', 'i_custRefundId', i_custRefundId);
										
										if(internalId == i_custRefundId)
										{
											 creditMemoObj.setCurrentLineItemValue('apply', 'apply', 'F');

											creditMemoObj.commitLineItem('apply');

											//nlapiLogExecution('Debug', ' after commit..');
										}
									}
								}
								
								var CreditMemoRecId = nlapiSubmitRecord(creditMemoObj, true, true);
								nlapiLogExecution('Debug', 'Changed CreditMemoRecId : ', CreditMemoRecId);
								//custRefundObj.setCurrentLineItemValue('apply', 'apply', 'F');
								//custRefundObj.commitLineItem('apply');
                            }
                        }
						
						//var CustReFundId = nlapiSubmitRecord(custRefundObj, true, true);
						//nlapiLogExecution('Debug', 'Changed Customer Refund id is : ', CustReFundId);
						
                        if (transactionTpye) {
                            nlapiDeleteRecord('customerrefund', internalId);
                            nlapiLogExecution("debug", "i_usage_end " + i, i_usage_end + " transactionTpye " + transactionTpye + " internalId " + internalId);
                        }
						
						

                    }

                } catch (er) {
                    nlapiLogExecution("error", " Record Creations " + i, er + "   internalId " + internalId)
                }
            }
        }

        nlapiLogExecution("error", "Final Execution ", "Stop")

    } //End try
    catch (e) {
        var i_usage_end = o_context.getRemainingUsage();
        nlapiLogExecution('error', 'Function Exception ' + i_usage_end, e);
    }

} //End schedule_delete_record