/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL_YIL_UE_Add_Button
 * File Name: MHL_YIL_UE_Add_Button.js
 * Created On: 15/12/2022
 * Modified On: 
 * Created By: Ganesh Sapakale (Yantra Inc.)
 * Modified By: 
 * Description: .
 *************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */  
define(['N/record', 'N/format', 'N/error', 'N/ui/dialog', "N/file", 'N/ui/serverWidget', 'N/runtime', 'N/search','N/url','N/task'],

    function (record, format, error, dialog, file, ui, runtime, search, url,task) {

        function beforeLoad(scriptContext) {
            try {
                var record = scriptContext.newRecord
                var recordId = record.id
                var recordType = record.type

                log.debug("Rec id -->", recordId);
                log.debug("Rec Type -->", recordType);
				
				var startDate = record.getValue({fieldId:'custrecord_mhl_b2b_start_date'});
				log.debug("Start Date -->", startDate);
						
				var endDate = record.getValue({fieldId:'custrecord_mhl_b2b_end_date'});
				var total_sucess_so = record.getValue({fieldId:'custrecord_hml_total_sucess_so'});
				log.debug("End Date -->", endDate);
				
				var d_b2b_start_date = format.format({
						value: new Date(startDate),
						type: format.Type.DATE
					});
				var d_b2b_end_date =  format.format({
						value: new Date(endDate),
						type: format.Type.DATE
					})	
				
				log.debug("d_b2b_start_date",d_b2b_start_date);
				log.debug("d_b2b_end_date",d_b2b_end_date);
						
                if (scriptContext.type == scriptContext.UserEventType.VIEW) {
					
				/* var form = scriptContext.form	
				form.clientScriptFileId = 29723603  */
			
					//For Invoice Creation -------------
					
					var suiteletURL = url.resolveScript({
					scriptId: "customscript_mhl_yil_su_call_map_reduce",
					deploymentId: "customdeploy_mhl_yil_su_call_map_reduce",
					params: { 
						recordId: recordId, 
						recordType: recordType,
						startDate: d_b2b_start_date,
						endDate: d_b2b_end_date,
						buttonName: "INVPROCESS" 
						},
					})  
					
					var script_fam_button = "win =alert('Screen Will refresh, but process will execute in backend. You will receive the notification once process is completed'); window.open('" + suiteletURL + "', '_self');";
				
					scriptContext.form.addButton({
						id: 'custpage_process',
						label: 'Generate Invoices',
						functionName: script_fam_button
						//functionName: "onclick_callmapreduce"
					});
				
					//For pdf generattion --------------
					
					var suiteletPdfURL = url.resolveScript({
					scriptId: "customscript_mhl_yil_su_call_map_reduce",
					deploymentId: "customdeploy_mhl_yil_su_call_map_reduce",
					params: { 
						recordId: recordId, 
						recordType: recordType,
						startDate: d_b2b_start_date,
						endDate: d_b2b_end_date,
						buttonName: "CREATEPDF"
						},
					})  
					
					
					if(total_sucess_so > 0)
					{
						var script_pdf_button = "win =alert('Screen Will refresh, but process will execute in backend. You will receive the notification once process is completed'); window.open('" + suiteletPdfURL + "', '_self');";
				
						scriptContext.form.addButton({
							id: 'custpage_pdfgeneration',
							label: 'Create PDFs',
							functionName: script_pdf_button
							//functionName: "onclick_callmapreduce"
						});
					}
					
				}
            } catch (e) {
                log.debug("Error FC =", e);
            }
        }
        return { beforeLoad }
    });