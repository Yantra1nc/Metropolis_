/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL UE Update TOD PDF on Inv
 * File Name: MHL YIL UE Update TOD on INV.js
 * Created On: 19/12/2022
 * Modified On: 
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By: 
 * Description: It was used for the creates/updates the PDF and TOD calculations..
 *************************************************************/


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

               

                // var invNumber = recordContext.getValue({fieldId: 'custbody_invoice_no'});


                /* var fSalesOrderId = objParsedValue.SalesOrderId;
				log.debug('fSalesOrderId ',fSalesOrderId);
			
					*/

					 

                if (runtime.executionContext == runtime.ContextType.CSV_IMPORT)
					{
						var todUpdate = false;
						log.debug("Rec id -->", recordId);
						//log.debug("Rec Type -->", recordType);
						var o_inv_Obj = record.load({
							type: record.Type.INVOICE,
							id: recordId,
							isDynamic: true
						});
                    var vidNumber = o_inv_Obj.getValue("custbody_mhl_invoice_vid_number");
                    log.debug("vidNumber", vidNumber);
                    if (!vidNumber) 
					{
                        var orgId = o_inv_Obj.getValue("location");
                        var documentNumber = o_inv_Obj.getValue("custbody_mhl_b2b_doc_number");
                      //  var postingDate = o_inv_Obj.getValue("enddate");
                     //   log.debug("postingDate", postingDate);
                        var custId = o_inv_Obj.getValue("entity");
                        log.debug("custId", custId);
                        var n_soTotal = o_inv_Obj.getValue("total");
                        log.debug("n_soTotal", n_soTotal);

                        //var custObj = record.lookupField({})
                        var customerType = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: custId,
                            columns: ['custentitycustrecord_tod']
                        });
                        var percentage = 0;

                        if (customerType.custentitycustrecord_tod[0]) {
                            var todId = customerType.custentitycustrecord_tod[0].value;
                            var toDiscAmount = 0;
                            //return false;
                            var customrecord_todrange_perSearchObj = search.create({
                                type: "customrecord_todrange_per",
                                filters: [
                                    ["custrecord_attch_tod", "anyof", todId],
                                    "AND",
                                    ["custrecord_tod_org", "anyof", orgId]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "scriptid",
                                        sort: search.Sort.ASC,
                                        label: "Script ID"
                                    }),
                                    search.createColumn({
                                        name: "custrecord_range_from",
                                        label: "Range From"
                                    }),
                                    search.createColumn({
                                        name: "custrecord_range_to",
                                        label: "Range to"
                                    }),
                                    search.createColumn({
                                        name: "custrecordtod_percentage",
                                        label: "Percentage"
                                    })
                                ]
                            });
                            var searchResultCount = customrecord_todrange_perSearchObj.runPaged().count;
                            log.debug("customrecord_todrange_perSearchObj result count", searchResultCount);

                            var result = customrecord_todrange_perSearchObj.run().getRange({
                                start: 0,
                                end: 100
                            });
                            var percentage = 0,
                                toDiscAmount = 0;
                            for (var r = 0; r < result.length; r++) {
                                var n_fromRange = result[r].getValue("custrecord_range_from");
                                var n_toRange = result[r].getValue("custrecord_range_to");

                                //log.debug("percentage "+percentage,"n_toRange "+n_toRange+" n_fromRange "+n_fromRange )
                                if (n_toRange && (n_fromRange < n_soTotal && n_soTotal < n_toRange)) {
                                    var percentage = parseFloat(result[r].getValue("custrecordtod_percentage"));

                                    log.debug("percentage matched", percentage);

                                    var toDiscAmount = (percentage * parseFloat(n_soTotal)) / 100;
                                    log.debug("In side toDiscAmount", toDiscAmount + " percentage " + percentage)
                                    break;;
                                }
                            }

                            log.debug("toDiscAmount", toDiscAmount + " percentage " + percentage)
                            //return false;

                            o_inv_Obj.setValue("custbody_tod_discount_percentage", percentage);
                            o_inv_Obj.setValue("custbody_tod_discount_amount", toDiscAmount);

							 var O_Inv_Id = o_inv_Obj.save();
							log.audit('TOD Updated O_Inv_Id ', O_Inv_Id);
							
							todUpdate = true;

                        }
                       log.debug("todUpdate",todUpdate)
					   
						var updateRec = false;
						// need to load same Invoice as this have updated TOD fields and thats fields are use in PDF library 
						
						if(todUpdate)
						{
							var o_inv_Obj = record.load({
								type: record.Type.INVOICE,
								id: recordId,
								isDynamic: true
							});
						}
                        
                        var isPDF = o_inv_Obj.getValue("custbody_mhl_b2b_pdf_created");
                        if (isPDF == false) {
                            var i_pdfFileID = invoicepdf.invpdf(recordId);
                            log.audit("i_pdfFileID", i_pdfFileID);
                            o_inv_Obj.setValue("custbody_mhl_b2b_pdf_created", true);
                            var pdfDescription = o_inv_Obj.getValue("custbody_mhl_b2b_pdf_created");
							updateRec = true;
                        }
                        var pdfDescription = o_inv_Obj.getValue("custbody_mhl_pdfdescription");
						log.debug("pdfDescription",pdfDescription);
                        if (pdfDescription == "Only PDF Missing") {
                            var pdfID = o_inv_Obj.getValue("custbody_b2b_conso_pdf");

                            var myFileToUpload = file.load({
                                id: pdfID
                            });
                            myFileToUpload.description = '';
                            var fileId = myFileToUpload.save();
                            log.debug("fileId", fileId);
							o_inv_Obj.setValue("custbody_mhl_pdfdescription", "Updated");
							updateRec =true;
                        }
						
						//log.audit("updateRec",updateRec)
						if(updateRec)
						{
							var O_Inv_Id = o_inv_Obj.save();
							log.audit('Final Updated O_Inv_Id ', O_Inv_Id);
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