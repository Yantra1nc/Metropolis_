/*************************************************************
 * File Header
 * Script Type: Suitelet
 * Script Name: MHL_YIL_SU_Call_Map_Reduce
 * File Name: MHL_YIL_SU_Call_Map_Reduce.js
 * Created On: 15/12/2022
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: Call map reduce script
 *********************************************************** */

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/record','N/task','N/redirect','N/url'],

    function(serverWidget, record,task,redirect,url) {

        function onRequest(scriptContext) {
            try {
				var recId = scriptContext.request.parameters.recordId;
				var recType = scriptContext.request.parameters.recordType;
				var s_date = scriptContext.request.parameters.startDate;
				var e_date = scriptContext.request.parameters.endDate;
				var btn_inv_pdf = scriptContext.request.parameters.buttonName;
				//var cre_pdf = scriptContext.request.parameters.buttonNamePdf;
				
				log.debug("Rec Id Suitelet -->", recId);
				log.debug("Rec Type Suitelet -->", recType);
				log.debug("Rec start date Suitelet -->", s_date);
				log.debug("Rec end date Suitelet -->", e_date);
				log.debug("Rec inv_process Suitelet -->", btn_inv_pdf);
				//log.debug("Rec cre_pdf Suitelet -->", cre_pdf);
				
				
				//Create Invoice script calling
				if(btn_inv_pdf == "INVPROCESS")
				{
					var objScriptTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
					objScriptTask.scriptId = 'customscript_mhl_map_create_so_inv_copy';
					objScriptTask.deploymentId = 'customdeploy_mhl_map_create_so_inv_copy';
					objScriptTask.params = {
						'custscript_record_id_inv': recId,
						'custscript_start_date_inv': s_date,
						'custscript_end_date_inv': e_date
					};
					
					log.debug("objScriptTask-->",objScriptTask);
					
					var taskSubmitId = objScriptTask.submit();
					log.debug('onRequest:Post()','Script Scheduled .taskSubmitId =='+taskSubmitId);
				}
				
				//Generate pdf script calling
				 if(btn_inv_pdf == "CREATEPDF")
				{
					var objScriptTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
					objScriptTask.scriptId = 'customscript_pdf_creation_on_inv_mannual';
					objScriptTask.deploymentId = 'customdeploy_pdf_creation_on_inv_mannual';
					objScriptTask.params = {
						'custscript_record_id_inv_exe': recId,
						'custscript_statrt_date_pdf': s_date,
						'custscript_end_date_pdf': e_date
					};
					
					log.debug("objScriptTask-->",objScriptTask);
					
					var taskSubmitId = objScriptTask.submit();
					log.debug('onRequest:Post()','Script Scheduled .taskSubmitId =='+taskSubmitId);
				} 
				
				
				
				
				
            } catch (e) {
                log.error('Error ', e);
            }
			
			var redirectUrl = url.resolveRecord({
				  recordType: 'customrecord_mhl_b2b_inv_execution',
				  recordId:recId,
				  isEditMode: false
				});
				
				
				 redirect.redirect({
					url: redirectUrl
				});
			
        }
        return {
            onRequest: onRequest
        };
    });