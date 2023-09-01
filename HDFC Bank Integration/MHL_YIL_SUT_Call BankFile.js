/**
 *@NApiVersion 2.0
 *@NScriptType ScheduledScript
 */
/*
 
Script Name: MHL_YIL_SUT_Call BankFile.js
Script Type: Scheduled Script
Created Date: 24-jun-2022
Created By: Avinash Lahane.
Company : Yantra Inc.
Description: 
*************************************************************/
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/https', 'N/file', 'N/task'],
function(search, record, email, runtime, https, file, task) {
	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 *
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 *
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */
	function execute(context) {

	
			var o_context = runtime.getCurrentScript();
                var param_user_id = o_context.getParameter({
                    name: 'custscript_user_id'
                });
				log.debug('param_user_id=='+param_user_id); 
                var param_randomn = o_context.getParameter({
                    name: 'custscript_random_value'
                });
				log.debug('param_randomn=='+param_randomn); 
		//----------------------------------------------------------- Start - Call the Map/Reduce Script to create Bank details Custom record and bank payment file ------------------------------------------//
                var objScriptTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
                objScriptTask.scriptId = 'customscript_bill_payments_bank_file';
                objScriptTask.deploymentId = 'customdeploy_bill_payments_bank_file';
                 objScriptTask.params = {
                        'custscript__mhl_current_user': param_user_id,
                        'custscript_mhl_bank_files_random': param_randomn                   
                };
                var taskSubmitId = objScriptTask.submit();
                log.debug('onRequest:Post()','Script Scheduled ...taskSubmitId =='+taskSubmitId); 
                //----------------------------------------------------------- End - Call the Map/Reduce Script to create Bank details Custom record and bank payment file ------------------------------------------//
	
}

return {
	execute: execute
};
});