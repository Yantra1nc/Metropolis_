/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL UE Stamp Inv in VID
 * File Name: MHL YIL UE Stamp Inv in VID.js
 * Created On: 15/12/2022
 * Modified On: 
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By: 
 * Description: Stamping Invoice in VID
 *********************************************************** */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/format', 'N/error', 'N/ui/dialog', "N/file", 'N/ui/serverWidget', 'N/runtime', 'N/search', 'N/url', 'N/task'],

    function(record, format, error, dialog, file, ui, runtime, search, url, task) {

        function afterSubmit(scriptContext) {
            try {
                var recordContext = scriptContext.newRecord
                var recordId = recordContext.id
                var recordType = recordContext.type

                //log.debug("Rec id -->", recordId);
                //log.debug("Rec Type -->", recordType);

                var invNumber = recordContext.getValue({
                    fieldId: 'custbody_invoice_no'
                });
                

                if (invNumber) 
				{
					log.audit("Invoice Number -->", invNumber);
                    var invoiceSearchObj = search.create({
                        type: "customrecord_b2b_vid_details",
                        filters: [
                            ["custrecord_salesorder.mainline", "is", "T"],
                            "AND",
                            ["custrecord_salesorder", "anyof", recordId]
                        ],
                        columns: [
                            search.createColumn({
                                name: "internalid",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "custrecord_salesorder",
                                label: "Sales Order"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "CUSTRECORD_SALESORDER",
                                sort: search.Sort.ASC,
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "custrecord_invoice_number",
                                label: "Consolidated Invoices No"
                            })
                        ]
                    });

                    var resultSet = invoiceSearchObj.run().getRange({
                        start: 0,
                        end: 1000
                    });
                    //log.audit("Result Set ->", resultSet);

                    if (resultSet != null && resultSet != '' && resultSet != ' ') {
                        var completeResultSet = resultSet;
                        var start = 1000;
                        var last = 2000;

                        while (resultSet.length == 1000) {
                            resultSet = invoiceSearchObj.run().getRange(start, last);
                            completeResultSet = completeResultSet.concat(resultSet);
                            start = parseFloat(start) + 1000;
                            last = parseFloat(last) + 1000;

                            //log.debug("Input Call","start "+start)
                        }
                        resultSet = completeResultSet;
                       /*  if (resultSet) {
                            log.debug('In getInputData_savedSearch: resultSet: ' + resultSet.length);
                        } */
                    }

                    if (invoiceSearchObj) {
						log.debug('Total VIDs on SO and INV: ' , resultSet.length);
                        for (var i = 0; i < resultSet.length; i++) {
                            
							
							 var i_b2bVID_Id = resultSet[i].getValue({
                                name: "internalid",
                                label: "Internal ID"
                            });
                           // log.debug("i_b2bVID_Id ---->", i_b2bVID_Id);
							/* var record_id = record.submitFields({
								type: 'customrecord_b2b_vid_details',
								id: i_b2bVID_Id,
								values: {
									custrecord_invoice_number: invNumber
								},
								options: {
									enableSourcing: true,
									ignoreMandatoryFields: true
								}
							}); */
							var o_vidObj = record.load({type:"customrecord_b2b_vid_details",id:i_b2bVID_Id});
							o_vidObj.setValue('custrecord_invoice_number',invNumber)
							
							var testCount = o_vidObj.getLineCount("recmachcustrecord_reference_b2b")
							
							log.debug("Test Counts "+i_b2bVID_Id,testCount)
							
							for(var t =0; t<testCount;t++)
							{
								o_vidObj.setSublistValue({sublistId:'recmachcustrecord_reference_b2b',fieldId:'custrecord_mhl_testdet_invoice_no',line:t,value:invNumber});								
							}
							o_vidObj.save();
                        }
                    }
                }
            } catch (e) {
                log.error("Error FC =", e);
            }
        }
        return {
            afterSubmit
        }
    });