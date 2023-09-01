/*************************************************************
 * File Header
 * Script Type: Suitelet
 * Script Name: MHL SUT | Consolidated Approval Status
 * File Name: MHL_SUT_Approve_Consolidated_inv.js
 * Created On: 23/06/2021
 * Modified On:
 * Created By: (Yantra Inc.)
 * Modified By:
 * Description: Consolidated Approval Status
 *********************************************************** */

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record','N/redirect','N/task'],

function(record,redirect,task) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) 
    {
    	var request  = context.request;
		var response = context.response;
		
		if(request.method == 'GET')
		{
			var flag = '0';
			var i_recordID = request.parameters.recordId;
			log.debug('onRequest','i_recordID :'+i_recordID);
			var s_recordType = request.parameters.recordType;
			log.debug('onRequest','s_recordType :'+s_recordType);
			var s_state = request.parameters.state;
			log.debug('onRequest','s_state :'+s_state);
			
			if(s_state == 'approve')
			{
				var o_conso_inv = record.load({type: s_recordType,id: i_recordID, isDynamic: true});
				o_conso_inv.setValue({fieldId: 'custbody_conso_inv_approval_status',value: 2,ignoreFieldChange: true});
				var i_submit_id = o_conso_inv.save({enableSourcing: true,ignoreMandatoryFields: true});
				
				var mrTask = task.create({
				taskType: task.TaskType.MAP_REDUCE,
				scriptId: "customscript_mhl_mr_cons_inv_status_upd",
				params: {custscript_cons_inv_rec_id: i_recordID,custscript_state:'approve'}
				});
				var mrTaskId = mrTask.submit();
				var taskStatus = task.checkStatus(mrTaskId);
				log.debug("taskStatus", taskStatus);
				
				
			}
			
			if(s_state == 'reject')
			{
				//var o_conso_inv = record.load({type: s_recordType,id: i_recordID, isDynamic: true});
				//o_conso_inv.setValue({fieldId: 'custbody_conso_inv_approval_status',value: 3,ignoreFieldChange: true});
				//var i_submit_id = o_conso_inv.save({enableSourcing: true,ignoreMandatoryFields: true});
				
				var mrTask = task.create({
					taskType: task.TaskType.MAP_REDUCE,
					scriptId: "customscript_mhl_mr_cons_inv_status_upd",
					params: {custscript_cons_inv_rec_id: i_recordID,custscript_state:'reject'}
					});
					var mrTaskId = mrTask.submit();
					var taskStatus = task.checkStatus(mrTaskId);
					log.debug("taskStatus", taskStatus);
				
				 /*var i_linecount = o_conso_inv.getLineCount({sublistId:'line'});
	            log.debug('Line Count- '+i_linecount);
	            
           		if(i_linecount > 0)
	            {
	            	for(var index = 0; index < i_linecount; index++)
	            	{
	            		var i_inv_id = o_conso_inv.getSublistValue({ sublistId: 'line', fieldId: 'custcol_mhl_linked_vid', line: index});
	            		
	            		try
	            		{
	            			log.debug('Try','Inv- '+i_inv_id);
	            			var otherId = record.submitFields({ type: 'invoice', id: i_inv_id, values: { 'custbody_mhl_conso_invoice_no_pilotrun': '','custbody_mhl_conso_invoice_pilot_run':''}});
	            		}
	            		catch(error)
	            		{
	            			log.debug('Catch','CM- '+i_inv_id);
	            			var otherId = record.submitFields({ type: 'creditmemo', id: i_inv_id, values: { 'custbody_mhl_conso_invoice_no_pilotrun': '','custbody_mhl_conso_invoice_pilot_run':''}});
	            		}
	            	}	            	
	            }		*/		
	         	
			}
			
         	
         	redirect.toRecord({
            	 type : s_recordType,
            	 id : i_recordID
            	});
    		
		}
    }

    return {
        onRequest: onRequest
    };
    
});
