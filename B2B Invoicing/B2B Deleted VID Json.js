 /**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: VIPL UE Consolidated
 * File Name: UE_Update_Deposit_Rc.js
 * Created On: 25/11/2021
 * Modified On: 
 * Created By: Sanjit yadav (Yantra Inc.)
 * Modified By: 
 * Description: 
 *************************************************************/
define(['N/record', 'N/task', 'N/search', 'N/config', 'N/format', 'N/runtime','N/file'],
    function (record, task, search, config, format, runtime,file) {

        function afterSubmit(scriptContext) {
			if (scriptContext.type == 'delete') {
                    var oldRec = scriptContext.oldRecord;
                    var file_id = oldRec.getValue({
                        fieldId: 'custrecord_b2b_vid_json_file'
                    });
                    log.debug('file_id', file_id);
                    if (file_id) {
                        log.debug('if..file_id', file_id);
                        var o_fileObj = file.load({
                            id: file_id
                        });
                        o_fileObj.folder = '634844';
                        o_fileObj.save();
                    }
                }
		}
 return {
            afterSubmit: afterSubmit
        };
    });