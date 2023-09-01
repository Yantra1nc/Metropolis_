/*************************************************************
 * File Header
 * Script Type: Client Script
 * Script Name: MHL YIL Journal Entry Validation
 * File Name: MHL YIL Journal Entry Validation.js
 * Created On: 14/12/2022 
 * Modified On: 
 * Created By: Sunil (Yantra Inc.)
 * Modified By: 
 * Description: Journal Entry Validation
 *********************************************************** */

/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/currentRecord', 'N/search', 'N/format', 'N/error', 'N/ui/dialog'],

    function(record, currentRecord, search, format, error, dialog) {
		
         function validateLine(scriptContext) {
            var recCurrent = scriptContext.currentRecord;
			var subField = scriptContext.sublistId;
			var field = scriptContext.fieldId;

            try {
                var journalType = recCurrent.getValue({
                    fieldId: "custbody_mhl_jv_type_field"
                });
                log.debug("Journal Type = ", journalType);

                if (journalType == 9) {
					   if(subField=='line'||field=='entity'){
						  var entityName = recCurrent.getCurrentSublistValue({sublistId:subField, fieldId:'entity'});
						  if(entityName == ''){
							  alert("Please Enter Name at a line Level!");
							  return false;
						  }else{
						  return true;
						  }
						}
				}
				return true;
            } catch (e) {
                log.debug("Error FC =", e);
            }
        } 
        return {
            validateLine: validateLine
        }
    });