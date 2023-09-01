/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL Vid Count
 * File Name: MHL YIL Invoice VID Count.js
 * Created On: 09/05/2023
 * Modified On: 
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By: 
 * Description: Vid Count
 *********************************************************** */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/format', 'N/error', 'N/ui/dialog', "N/file", 'N/ui/serverWidget', 'N/runtime', 'N/search', 'N/url', 'N/task','./invoicepdf'],

    function(record, format, error, dialog, file, ui, runtime, search, url, task, invoicepdf) {

        function afterSubmit(context) {
            try {

                var recordContext = context.newRecord
                var recordId = recordContext.id
                var recordType = recordContext.type

						//log.debug("Rec id -->", recordId);
						//log.debug("Rec Type -->", recordType);
						var o_inv_Obj = record.load({
							type: record.Type.INVOICE,
							id: recordId,
							isDynamic: true
						});
                    var SoID = o_inv_Obj.getValue("createdfrom");
                    //log.debug("SoID", SoID);
					if(SoID){
					var customrecord_b2b_vid_detailsSearchObj = search.create({
					   type: "customrecord_b2b_vid_details",
					   filters:
					   [
						  ["custrecord_salesorder.internalidnumber","equalto",SoID], 
						  "AND", 
						  ["custrecord_salesorder.mainline","is","T"], 
						  "AND", 
						  ["custrecord_reference_b2b.custrecord_cancelled","is","F"]
					   ],
					   columns:
					   [
					      search.createColumn({
							 name: "name",
							 summary: "COUNT",
							 sort: search.Sort.ASC,
							 label: "Name"
						  }),
						  search.createColumn({
							 name: "internalid",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "COUNT",
							 label: "Internal ID"
						  })
					   ]
					});
					var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
					log.debug("customrecord_b2b_vid_detailsSearchObj result count",searchResultCount);
					customrecord_b2b_vid_detailsSearchObj.run().each(function(result){
						
						var vidCount=result.getValue({
							 name: "name",
							 summary: "COUNT",
							 sort: search.Sort.ASC,
							 label: "Name"
						  });
						var vidTestCount=result.getValue({
							 name: "internalid",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "COUNT",
							 label: "Internal ID"
						  });
						  log.audit("vidTestCount for INV "+recordId,vidTestCount);
					   // .run().each has a limit of 4,000 results
					   return true;
					});


					}
            } catch (e) {
                log.error("Error FC =", e);
            }
        }
        return {
            afterSubmit
        }
    });