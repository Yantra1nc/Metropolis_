/*

Script Name: MHL_SUT_RnI_Payment_Clearing.js
Script Type: Suitelet Script
Created Date: 12-01-2022
Created By: Ganesh Sapakale
Company : Yantra Inc.
Description: 
*************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @Author 
 */
define(['N/file', 'N/https', 'N/record', 'N/format', 'N/ui/serverWidget', 'N/search', 'N/task', 'N/runtime', 'N/render'],
    /**
     * @param {file} file
     * @param {https} https
     * @param {record} record
     * @param {serverWidget} serverWidget
     */
    function(file, https, record, format, serverWidget, search, task, runtime,render) {

        /**
         * Definition of the Suitelet script trigger point.
         * 
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
			try
			{
				var scheduledScript = task.create({
					taskType: task.TaskType.MAP_REDUCE
				});
				scheduledScript.scriptId = 'customscript_mhl_vid_clearing_payment';
				scheduledScript.deploymentId = 'customdeploy_mhl_clear_payment_manual';
			

				var scriptID = scheduledScript.submit();
				
				log.debug(" scriptID",scriptID);
				
				 var formassist = serverWidget.createForm({
                        title: 'Manual Payment Creation'
                    });
                    var htmlField = formassist.addField({
                        id: 'custpage_abc_html',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: ' '
                    }).defaultValue = '<p style=\'font-size:14px\'>'+scriptID+'<br> Please do not refresh this pages.</p>';
				
				context.response.writePage(formassist);
			}
			catch(e)
			{
				log.error("onRequest | error 		",e)
				 var formassist = serverWidget.createForm({
                        title: 'Manual Payment Creation'
                    });
                    var htmlField = formassist.addField({
                        id: 'custpage_abc_html',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: ' '
                    }).defaultValue = '<p style=\'font-size:14px\'>'+JSON.stringify(e)+'.</p>';
				context.response.writePage(formassist);
			}
		}
		
		return {
            onRequest: onRequest
        };
		
	});