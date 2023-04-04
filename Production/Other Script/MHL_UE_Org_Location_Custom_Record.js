/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL_UE_Org_Location_Custom_Record
 * File Name: MHL_UE_Org_Location_Custom_Record.js
 * Created On: 19/05/2022
 * Modified On: 
 * Created By: Sunil K (Yantra Inc.)
 * Modified By: 
 * Description: validation for org and location code.
 *************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format'],
    function(record, search, format) {

        function beforeLoad(scriptContext) {
            try {
                var recObj = scriptContext.newRecord;
                //log.debug("Rec Obj  = ", recObj);

                var recordId = scriptContext.newRecord.id;
                log.debug('recordId :- ', recordId);

                var filter_by_org = recObj.getField({
                    fieldId: 'cseg_mhl_locations_filterby_location'
                });
                //log.debug("Filter By Org = ", filter_by_org);

                if (filter_by_org) {
                    filter_by_org.isMandatory = true;
                }
            } catch (e) {
                log.debug("Error = >", e);
            }
        }

        function beforeSubmit(scriptContext) {

            var recObj = scriptContext.newRecord;
            var loc_code = recObj.getValue({
                fieldId: 'custrecord_mhl_loc_code'
            });
            //log.debug("Location Code = ", loc_code);
			
			/* var recordId = scriptContext.newRecord.id;
            log.debug('recordId :- ', recordId); */
		
			if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.COPY){
		
            var customrecord_cseg_mhl_locationsSearchObj = search.create({
                type: "customrecord_cseg_mhl_locations",
                filters: [
                    ["custrecord_mhl_loc_code", "is", loc_code], 
					"AND", 
					["isinactive","is","F"]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_mhl_loc_code", label: "Code" })
                ]
            });
            var searchResultCount = customrecord_cseg_mhl_locationsSearchObj.runPaged().count;
            log.debug("customrecord_cseg_mhl_locationsSearchObj result count", searchResultCount);
            customrecord_cseg_mhl_locationsSearchObj.run().each(function(result) {
                // .run().each has a limit of 4,000 results
                if (searchResultCount > 0) {
                    log.debug("in if error ")
                    throw 'Location code ' + loc_code + ' is a duplicate for this record';
                    return false;
                } else {
                    return true;
                }
            });
		}
        }
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        }
    });