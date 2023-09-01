//All Pending Approval Record
/*************************************************************
 * File Header
 * Script Type: Suitelet
 * Script Name: [SU] MHL YIL JV knockoff
 * File Name: [SU] MHL YIL JV knockoff.js
 * Created On: 06/06/2023
 * Modified On:
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: JE knockoff
 ************************************************************/

//MHL SU Vendor Invoice approved
//https://4120343-sb1.app.netsuite.com/app/common/search/search.nl?cu=T&e=T&id=1365068

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/ui/serverWidget', 'N/record', 'N/http', 'N/search', 'N/file', 'N/task'],

    function(runtime, serverWidget, record, http, search, file, task) {

        function onRequest(scriptContext) {
            if (scriptContext.request.method === 'GET') {
				
				

                var form = serverWidget.createForm({
                    title: 'Vendor Invoice Approved'
                });

                var fileField = form.addField({
                    id: 'custpage_file',
                    type: serverWidget.FieldType.FILE,
                    label: 'File'
                });
                //var fileField = form.addField('custpage_file', 'file', 'File');
                fileField.isMandatory = true;


                form.addSubmitButton({
                    label: 'Submit'
                });

                scriptContext.response.writePage(form);
            } else {
				
				var current_user=runtime.getCurrentUser();
				log.debug("current_user",current_user);
				
				var email=current_user.email;
				log.debug("email",email);

                var fileObj = scriptContext.request.files.custpage_file;
                // fileObj.folder = 451136; //File Saved this folder // SB folder id
                fileObj.folder = 1198804 // Production folder id
                var id = fileObj.save();
				log.debug("File Internal Id---->", id);
			
					
					var objScriptTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
					objScriptTask.scriptId = 'customscript_mhl_mr_jv_knockoff';
					objScriptTask.deploymentId = 'customdeploy_mhl_mr_jv_knockoff';
					objScriptTask.params = {
						'custscript_jv_test': id,
						'custscript_jv_email': email
					};
					
					log.debug("objScriptTask-->",objScriptTask);
					
					var taskSubmitId = objScriptTask.submit();
					log.debug('onRequest:Post()','Script Scheduled .taskSubmitId =='+taskSubmitId);
					
					
					scriptContext.response.write('JV knockoff file uploaded successfully.');

            }
        }
        return {
            onRequest: onRequest
        };
    });