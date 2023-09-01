/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
/*
 
Script Name: SCH_mhl_file_vendor_Update.js
Script Type: Scheduled Script
Created Date: 20-Sep-2021
Created By: Ganesh.
Company : Yantra Inc.
Description: 
*************************************************************/
define(['N/search', 'N/record', 'N/runtime', 'N/file','N/task'],
    function(search, record, runtime, file,task) {
        function execute(context) {
            function rescheduleCurrentScript(fileIndex) {
                //log.debug('call function', s);
                var scheduledScriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                });
                scheduledScriptTask.scriptId = runtime.getCurrentScript().id; // Get the current script id 
                scheduledScriptTask.deploymentId = runtime.getCurrentScript().deploymentId; // Get the current script deploymentId
				scheduledScriptTask.params = {							
							'custscript_file_index': fileIndex
						};
                return scheduledScriptTask.submit(); // rescheduleCurrentScript if the usage is less then 200
            }
            try {
                var scriptObj = runtime.getCurrentScript();
                var fileId = scriptObj.getParameter({
                    name: 'custscript_ven_fileid'
                });

				var fileIndex = scriptObj.getParameter({
                    name: 'custscript_file_index'
                });
                log.audit("fileId", fileId+" fileIndex "+fileIndex);
                //log.debug("fileIndex", fileIndex);
                var o_file = file.load({
                    id: fileId
                });

                var fileContents = o_file.getContents();
                var dataLine = fileContents.split(/\n|\n\r/);

                for (var i = fileIndex; i < dataLine.length; i++) {

                    var rowsLine = dataLine[i].split(",");
                    // var internalId = rowsLine[0];
                    var fileNameId = rowsLine[0];
					if(fileNameId)
					{
						var setFolderId = rowsLine[1];
						log.debug("setFolderId", i+" | "+fileNameId+" | "+setFolderId);
						
						var vendorInvoiceRecord = record.load({
									type: "vendorbill",
									id:fileNameId,
									isDynamic: true
								});
						
						vendorInvoiceRecord.setValue({fieldId: 'approvalstatus',value: 1});
						var fileID = vendorInvoiceRecord.save();

						if (runtime.getCurrentScript().getRemainingUsage() < 20) {
							var taskId = rescheduleCurrentScript(i);
							log.debug('function call for reschedule',i)
							return;
						}
					}
                    

                }

            } catch (e) {
                log.error('Error Details in file fetching', e);
            }
        }

        return {
            execute: execute
        };
    });