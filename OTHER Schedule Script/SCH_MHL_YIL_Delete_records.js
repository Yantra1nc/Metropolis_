/*

Script Name: SUT_MHL_YIL_Delete_records.js
Script Type: ScheduledScript Script
Created Date: 11-05-2021
Created By: Ganesh Sapakale
Company : Yantra Inc.
Description: 
*************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @Author 
 */
define(['N/file', 'N/https', 'N/record', 'N/format', 'N/ui/serverWidget', 'N/search', 'N/runtime','N/task'],
    /**
     * @param {file} file
     * @param {https} https
     * @param {record} record
     * @param {serverWidget} serverWidget
     */
    function(file, https, record, format, serverWidget, search,runtime,task) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function execute(context) {
            try {
				
				
				var o_InvSearchObj = search.load({
					id: 'customsearch1320931'
				});
				
                var myResultSet = o_InvSearchObj.run();

                var resultIndex = 0;
                var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                var resultSet; // temporary variable used to store the result set
                do {
                    // fetch one result set
                    resultSet = myResultSet.getRange(resultIndex, resultIndex + resultStep);

                    //log.debug("resultSet", JSON.stringify(resultSet))

                    for (var c in resultSet) {
						 var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
						var i_internalID = resultSet[c].getValue('internalid');
						log.debug("Loop "+c,"i_internalID "+i_internalID+" |> resultIndex "+resultIndex+" |> remainingUsage "+remainingUsage);
						var salesOrderRecord = record.delete({
							   type: 'customrecord_rni_integration_status',
							   id: i_internalID,
							}); 
							
							if (remainingUsage < 50) {
                                var scheduledScript = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT
                                });
                                scheduledScript.scriptId = 'customscript_sch_dyn_delete_record';
                                scheduledScript.deploymentId = 'customdeploy_sch_dyn_delete_record';
								var scriptID = scheduledScript.submit();

                                log.audit("Payment scriptID", scriptID)
                            } 
                    }
                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // process or log the results

                    // once no records are returned we already got all of them
                } while (resultSet.length > 0)
					
				

            } catch (e) {
               
				
				if( e.name == 'SSS_USAGE_LIMIT_EXCEEDED')
				{
					var scheduledScript = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT
                                });
                                scheduledScript.scriptId = 'customscript_sch_dyn_delete_record';
                                scheduledScript.deploymentId = 'customdeploy_sch_dyn_delete_record';
								var scriptID = scheduledScript.submit();

                                log.audit("Payment scriptID", scriptID)
				}
				else
				{
					 log.error("execute |  error", e)
				}
               
            }
        }    

       
		
        return {
            execute: execute
        };

    });