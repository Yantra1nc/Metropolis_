/*

Script Name: MHL YIL AR Knockoff Payment Normal Batch
Script Type: Schedule Script
Created Date: 23-Feb-2021
Created By: Ganesh Sapakale
Company : Yantra Inc.
Description: 
*************************************************************/
function createPaymentRec() {
    try {

        var customerpaymentSearch = nlapiSearchRecord("customerpayment", null,
            [
                ["type", "anyof", "CustPymt"],
                "AND",
                ["custbody_mhl_app_conso_inv", "noneof", "@NONE@"],
                "AND",
                ["custbody_mhl_pay_proce_status", "anyof", "1"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["custbody_mhl_app_conso_inv.mainline", "is", "T"]
            ],
            [
                new nlobjSearchColumn("custbody_mhl_consinv_customer", "CUSTBODY_MHL_APP_CONSO_INV", null),
                new nlobjSearchColumn("tranid"),
				 new nlobjSearchColumn("custbody_due_amount","CUSTBODY_MHL_APP_CONSO_INV"),
                new nlobjSearchColumn("custbody_mhl_amt_tb_on_inv"),
               // new nlobjSearchColumn("payment"),
                new nlobjSearchColumn("custbody_mhl_app_conso_inv"),
                new nlobjSearchColumn("internalid").setSort(false)
            ]
        );

        if (customerpaymentSearch) {
            for (var p in customerpaymentSearch) {
                var i_paymentId = customerpaymentSearch[p].getValue("internalid");
                var i_consolodateInv_id = customerpaymentSearch[p].getValue("custbody_mhl_app_conso_inv");
                var c_consolidate_amount = customerpaymentSearch[p].getValue("custbody_mhl_amt_tb_on_inv");
                //var c_consolidate_amount_unapplied = customerpaymentSearch[p].getValue("payment");
				var i_consolodate_Due_amount = customerpaymentSearch[p].getValue("custbody_due_amount","CUSTBODY_MHL_APP_CONSO_INV");
                var i_conso_inv_custId = customerpaymentSearch[p].getValue("custbody_mhl_consinv_customer", "CUSTBODY_MHL_APP_CONSO_INV");
                
                nlapiLogExecution("debug", "createPaymentRec | i_conso_inv_custId", i_conso_inv_custId)
                nlapiLogExecution("debug", "createPaymentRec | i_paymentId", i_paymentId)
                nlapiLogExecution("debug", "createPaymentRec | i_consolodateInv_id", i_consolodateInv_id)
				
				/* if(c_consolidate_amount_unapplied)
					var c_consolidate_amount = customerpaymentSearch[p].getValue("payment");
				else */
					var c_consolidate_amount = customerpaymentSearch[p].getValue("custbody_mhl_amt_tb_on_inv");
				
				nlapiLogExecution("debug", "createPaymentRec | c_consolidate_amount", c_consolidate_amount)
			
                if (i_conso_inv_custId) {
                    var b_found_JE = false;
                    var b_apply_tran = false;
					var f_credit_amount = 0.00;
                    var paymentRec = nlapiTransformRecord('customer', i_conso_inv_custId, 'customerpayment');

                    paymentRec.setFieldValue('memo', 'Knockoff Payment');

                    var invId = searchInvoiceFromConsolidatedInvoice(i_consolodateInv_id);
					nlapiLogExecution("debug","createPaymentRec","invId "+invId.length)

                    var creditLine = parseInt(paymentRec.findLineItemValue('credit', 'doc', i_paymentId));

					nlapiLogExecution("debug","createPaymentRec","creditLine ")

                    if (creditLine > -1) {
						 nlapiLogExecution("debug", "createPaymentRec | creditLine", creditLine)
                        paymentRec.setLineItemValue('credit', 'apply', creditLine, 'T');
                        paymentRec.setLineItemValue('credit', 'amount', creditLine, c_consolidate_amount);
                        b_found_JE = true;
                        var f_credit_due = paymentRec.getLineItemValue('credit', 'due', creditLine);
                        // log.debug('f_credit_due',f_credit_due);	
						nlapiLogExecution("debug", "createPaymentRec | f_credit_due", f_credit_due)
                        f_credit_amount = Number(f_credit_amount) + Number(c_consolidate_amount)
                    }
					var n_due_amount = i_consolodate_Due_amount;
                    for (var y = 0; y < invId.length; y++) {
						//nlapiLogExecution("debug","invId[y] <> ",invId[y])
                        var invLine = paymentRec.findLineItemValue('apply', 'doc', invId[y]);
						
                        if (invLine > -1) {
							nlapiLogExecution("debug","invLine "+y,invLine)
                            //paymentRec.setLineItemValue('apply', 'amount', invLine, docAmt);
                            b_apply_tran = true;

                            var f_inv_due = paymentRec.getLineItemValue('apply', 'due', invLine);
							
							nlapiLogExecution('debug',"f_inv_due",f_inv_due)
							

                            if (Number(f_credit_amount) >= f_inv_due) {
                                paymentRec.setLineItemValue('apply', 'apply', invLine, 'T');
                                b_apply_tran = true;

                            } else if (Number(f_credit_amount) > 0) {

                                paymentRec.setLineItemValue('apply', 'amount', invLine, Number(f_credit_amount));
                                paymentRec.setLineItemValue('apply', 'apply', invLine, 'T');
                                b_apply_tran = true;
                            }

                            f_credit_amount = Number(f_credit_amount) - Number(f_inv_due);
							n_due_amount = parseFloat(n_due_amount) - parseFloat(f_inv_due);
                            nlapiLogExecution('debug',"f_credit_amount",f_credit_amount)
                            if (Number(f_credit_amount) < 0.00) {
                                break;
                            }
                        }
                    }
					nlapiLogExecution("debug", "createPaymentRec | ", "b_found_JE "+b_found_JE+" | b_apply_tran "+b_apply_tran+" n_due_amount "+n_due_amount)
                    if (b_found_JE == true && b_apply_tran == true) {
                        var paymentId = nlapiSubmitRecord(paymentRec, true, true);
                        nlapiLogExecution('debug', 'createPaymentRec', 'Payment create id ==> '+paymentId );
						if(i_consolodateInv_id)
							nlapiSubmitField("customtransaction_mhl_consolidatedinvoic",i_consolodateInv_id,'custbody_due_amount',n_due_amount)
                    }
                  nlapiSubmitField("customerpayment",i_paymentId,'custbody_mhl_pay_proce_status',"4")
				}
            }// end for(var p in customerpaymentSearch)
        }// 

    } catch (e) {
        nlapiLogExecution('error', 'createPaymentRec ', e)

    }
}

function searchInvoiceFromConsolidatedInvoice(conInvId) {
    var a_invoice_data = new Array();
    /*var filters = [];
    var columns = [];

    filters.push(new nlobjSearchFilter('custbody_consolidated_invoice_number', null, 'anyof', conInvId));
    filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
    filters.push(new nlobjSearchFilter('status', null, 'anyof', 'CustInvc:A'));
    columns.push(new nlobjSearchColumn('internalid').setSort());

    var invSearch = nlapiSearchRecord('invoice', null, filters, columns);

    if (_logValidation(invSearch))
    	return invSearch[0].getValue('internalid');
    */

    var searchResults = new Array();
    var lastId = 0;
    var searchRecords = '';
    var searchRecordsLength = 0;
    do {
        var cols = new Array();
        cols[cols.length] = new nlobjSearchColumn('internalid').setSort();
        var filters = new Array();
        filters[filters.length] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastId);
        filters[filters.length] = new nlobjSearchFilter('custbody_consolidated_invoice_number', null, 'anyof', conInvId);
       // filters[filters.length] = new nlobjSearchFilter('custbody_mhl_conso_invoice_no_pilotrun', null, 'anyof', conInvId);
        filters[filters.length] = new nlobjSearchFilter('mainline', null, 'is', 'T');
        filters[filters.length] = new nlobjSearchFilter('status', null, 'anyof', 'CustInvc:A');

        try {
            searchRecords = nlapiSearchRecord('invoice', null, filters, cols);
        } catch (e) {

        }
        if (searchRecords) {
            searchRecordsLength = searchRecords.length;
            lastId = searchRecords[searchRecords.length - 1].getValue('internalid');
            searchResults = searchResults.concat(searchRecords);
        } else {
            searchRecordsLength = 0;
        }
    } while (searchRecordsLength == 1000);

    if (_logValidation(searchResults)) {
        for (var s = 0; s < searchResults.length; s++) {
            var i_internal_inv = searchResults[s].getId();
            //nlapiLogExecution('DEBUG', 'createPaymentRec', 'i_internal_inv ==> ' + i_internal_inv);
            a_invoice_data.push(i_internal_inv);
        }
    }
    return a_invoice_data;
}



function reScheduleScript() {
	//Check in governance of script 
	if (nlapiGetContext().getRemainingUsage() < 500) {
		//Rescheduled the script
		var stateMain = nlapiYieldScript();
		if (stateMain.status == 'FAILURE') {
			nlapiLogExecution("Debug", "Failed to yield script, exiting: Reason = " + stateMain.reason + " / Size = " + stateMain.size);
			throw "Failed to yield script";
		} else if (stateMain.status == 'RESUME') {
			nlapiLogExecution("Debug", "Resuming script because of " + stateMain.reason + ". Size = " + stateMain.size);
		}
	}
}

function _logValidation(value) {
	if (value != 'null' && value != '' && value != undefined && value != 'NaN' && value != 'undefined') {
		return true;
	} else {
		return false;
	}
}
function checkNullValue(value) 
{
	if (value != null && value != '' && value != 'undefined' && value != undefined) {
		return true;
	} else {
		return false;
	}

}