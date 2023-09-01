/**
 * Module Description
 * 
 * Version    Date            Author           File
 * 1.00       12 Nov 2020     ONKARS4      MHL Update Invoice with Consolidated Number v2.0.js
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	try {
		var context = nlapiGetContext();
		var fileId = context.getSetting('SCRIPT', 'custscript_file_internal_id_v2');
		var fileObj = nlapiLoadFile(fileId);

		var fileContent = JSON.parse(fileObj.getValue());
        var lastIndex = 0;
		if (fileContent) {
			for (var t in fileContent) {
                lastIndex = t;
				var consolidatedInvoice = fileContent[t].consolidatedInvoice;
				var dueDate = fileContent[t].dueDate;
				var invoiceInternalIdArray = fileContent[t].invoiceArray;
				markInvoiceAsConsolidated(consolidatedInvoice, dueDate, invoiceInternalIdArray)
				checkGovernance();
				nlapiLogExecution('DEBUG', 'consolidatedInvoice', consolidatedInvoice);

			}
		}
	} catch (e) {
		nlapiLogExecution('ERROR', 'Error Occured in Script', e);
      /* var createError = nlapiCreateRecord('customrecord_mhl_cons_invc_error_status');
              createError.setFieldValue('custrecord_file_ref',fileId);
              createError.setFieldValue('custrecord_index',lastIndex);
              createError.setFieldValue('custrecord_script_stageortype','3');
              createError.setFieldValue('custrecord_error_details',e.toString());
                nlapiSubmitRecord(createError);*/
	}
}

function markInvoiceAsConsolidated(consolidatedInv, dueDate, invoiceArray) {
	//try {
		var temp = dueDate.split('T');
		temp = temp[0].split('-');

		dueDate = temp[2] + '/' + temp[1] + '/' + temp[0];
		nlapiLogExecution('DEBUG', 'dueDate', dueDate);

		for (var g in invoiceArray) {
			/*var rec = nlapiLoadRecord('invoice', invoiceArray[g]);
			//rec.setFieldValue('custbody_consolidated_invoice_number', consolidatedInv);
			rec.setFieldValue('custbody_mhl_conso_invoice_no_pilotrun', consolidatedInv);
			rec.setFieldValue('duedate', dueDate);
			//rec.setFieldValue('custbody_mhl_invoice_consolidated', 'T');
			rec.setFieldValue('custbody_mhl_conso_invoice_pilot_run', 'T');
			nlapiSubmitRecord(rec, {
				disabletriggers: true,
				enablesourcing: true
			});
			*/
			 var a_field_data = ['duedate']
				var a_values = [dueDate];
			
			try
			{
				nlapiSubmitField('invoice',invoiceArray[g],a_field_data,a_values);
			}
			catch(err)
			{
				nlapiSubmitField('creditmemo',invoiceArray[g],a_field_data,a_values);
			}
          
			/*var a_field_data = ['custbody_mhl_conso_invoice_no_pilotrun','duedate','custbody_mhl_conso_invoice_pilot_run']
			var a_values = [consolidatedInv,dueDate,'T'];
			try
			{
				nlapiSubmitField('invoice',invoiceArray[g],a_field_data,a_values);
			}
			catch(err)
			{
				nlapiSubmitField('creditmemo',invoiceArray[g],a_field_data,a_values);
			}						*/
			nlapiLogExecution('DEBUG', 'Invoice/CM Updated', invoiceArray[g]);
			checkGovernance();
		}
	/*} catch (e) {
		nlapiLogExecution('ERROR', 'Error in Clearing Invoice', e);
	}*/
}

function checkGovernance() {
	//nlapiLogExecution('debug','checkGovernance','checking governance');

	if (nlapiGetContext().getRemainingUsage() < 500) {

		var state = nlapiYieldScript();

		if (state.status == 'FAILURE') {
			nlapiLogExecution("ERROR", "Failed to yield script, exiting: Reason = " + state.reason + " / Size = " + state.size);
			throw "Failed to yield script";
		} else if (state.status == 'RESUME') {
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason + ".  Size = " + state.size);
		}

	}
}