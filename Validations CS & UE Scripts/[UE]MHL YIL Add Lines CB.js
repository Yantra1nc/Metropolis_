/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: [UE]MHL YIL Add Lines CB
 * File Name: [UE]MHL YIL Add Lines CB.js
 * Created On: 11/04/2023
 * Modified On: 
 * Created By: Sunil Khutawad(Yantra Inc.)
 * Modified By: 
 * Description: Add Lines
 *********************************************************** */


/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format','N/ui/serverWidget', 'N/runtime'],
    function(record, search, format,serverWidget,runtime) {

        function beforeLoad(scriptContext) {

            var recid = scriptContext.newRecord.id;
            var currRecObj = scriptContext.newRecord;
			
			if (scriptContext.type == scriptContext.UserEventType.VIEW){
			
			var recObj = record.load({
                type: 'customtransaction_mhl_intra_costbkg',
                id: recid
            });
			
            var tran_id = recObj.getValue({
                fieldId: 'tranid'
            });
            log.debug("tran_id= ", tran_id);

            var invoiceSearchObj = search.create({
                type: "invoice",
                filters: [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["applyingtransaction.number", "equalto", tran_id]
                ],
                columns: [
                    search.createColumn({
                        name: "custbody_mhl_invoice_vid_number",
                        label: "VID Number"
                    }),
                    search.createColumn({
                        name: "tranid",
                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "trandate",
                        label: "Date"
                    }),
                    search.createColumn({
                        name: "amount",
                        label: "Amount"
                    }),
                    search.createColumn({
                        name: "type",
                        join: "applyingTransaction",
                        label: "Related Record Type"
                    }),
                    search.createColumn({
                        name: "amount",
                        join: "applyingTransaction",
                        label: "Related Record Amount"
                    }),
                    search.createColumn({
                        name: "tranid",
                        join: "applyingTransaction",
                        label: "Related Record Document number"
                    }),
                    search.createColumn({
                        name: "custbody_mhl_vid_ref_inter_intra_sale",
                        join: "applyingTransaction",
                        label: "Related Record Invoice Ref"
                    }),
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "transactionnumber",
                        join: "applyingTransaction",
                        label: "Related Record Transaction number"
                    })
                ]
            });
            var resultSet = invoiceSearchObj.run().getRange({
                start: 0,
                end: 1000
            });
			
			log.debug("resultSet",resultSet.length);
			
            for (var i = 0; i < resultSet.length; i++) {
                var accIntId = resultSet[i].getValue({
                    name: "internalid",
                    label: "Internal ID"
                });
				log.debug("accIntId-->", accIntId);

                var docNumber = resultSet[i].getValue({
                    name: "tranid",
                    label: "Document Number"
                });
				log.debug("docNumber-->", docNumber);

                var tranDate = resultSet[i].getValue({
                    name: "trandate",
                    label: "Date"
                });
				log.debug("tranDate-->", tranDate);

                var invAmount = resultSet[i].getValue({
                    name: "amount",
                    label: "Amount"
                });
				log.debug("invAmount-->", invAmount);

                var relRecType = resultSet[i].getValue({
                    name: "type",
                    join: "applyingTransaction",
                    label: "Related Record Type"
                });
				log.debug("relRecType-->", relRecType);

                var relRecDocNum = resultSet[i].getValue({
                    name: "tranid",
                    join: "applyingTransaction",
                    label: "Related Record Document number"
                });
				log.debug("relRecDocNum-->", relRecDocNum);


                var relRecAmount = resultSet[i].getValue({
                    name: "amount",
                    join: "applyingTransaction",
                    label: "Related Record Amount"
                });
				log.debug("relRecAmount-->", relRecAmount);

                var relRecInvRef = resultSet[i].getValue({
                    name: "custbody_mhl_vid_ref_inter_intra_sale",
                    join: "applyingTransaction",
                    label: "Related Record Invoice Ref"
                });
				log.debug("relRecInvRef-->", relRecInvRef);

                var relRecTranNum = resultSet[i].getValue({
                    name: "transactionnumber",
                    join: "applyingTransaction",
                    label: "Related Record Transaction number"
                });
				log.debug("relRecTranNum-->", relRecTranNum);


                //Added Sublist ----Start----
				
				var form = scriptContext.form;

                var sublist = form.addSublist({
                    id: 'custpage_invrecords',
                    type: serverWidget.SublistType.LIST,
                    label: 'Applying Invoice',
					tab: 'custom'
                });

                sublist.addField({
                    id: 'custpage_intid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'INTERNAL ID'
                });

                /* sublist.addField({
                    id: 'custpage_vid_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'VID NUMBER'
                }); */

                sublist.addField({
                    id: 'custpage_doc_num',
                    type: serverWidget.FieldType.TEXT,
                    label: 'DOCUMENT NUMBER'
                });

                sublist.addField({
                    id: 'custpage_date',
                    type: serverWidget.FieldType.TEXT,
                    label: 'DATE'
                });

                sublist.addField({
                    id: 'custpage_amount',
                    type: serverWidget.FieldType.TEXT,
                    label: 'AMOUNT'
                });

                sublist.addField({
                    id: 'custpage_rel_rec_type',
                    type: serverWidget.FieldType.TEXT,
                    label: 'RELATED RECORD TYPE'
                });

                sublist.addField({
                    id: 'custpage_rel_rec_doc_num',
                    type: serverWidget.FieldType.TEXT,
                    label: 'RELATED RECORD DOCUMENT NUMBER'
                });

                sublist.addField({
                    id: 'custpage_rel_rec_amount',
                    type: serverWidget.FieldType.TEXT,
                    label: 'RELATED RECORD AMOUNT'
                });

                sublist.addField({
                    id: 'custpage_rel_rec_inv_ref',
                    type: serverWidget.FieldType.TEXT,
                    label: 'RELATED RECORD INVOICE REF'
                });

                /* sublist.addField({
                    id: 'custpage_rel_rec_tran_num',
                    type: serverWidget.FieldType.TEXT,
                    label: 'RELATED RECORD TRANSACTION NUMBER'
                }); */

                //Set All The Values

                sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_intid',
                    line: i,
                    value: accIntId
                });

                sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_doc_num',
                    line: i,
                    value: docNumber
                });

                sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_date',
                    line: i,
                    value: tranDate
                });

                sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_amount',
                    line: i,
                    value: invAmount
                });

                sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_rel_rec_type',
                    line: i,
                    value: relRecType
                });

                sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_rel_rec_doc_num',
                    line: i,
                    value: relRecDocNum
                });

                sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_rel_rec_amount',
                    line: i,
                    value: relRecAmount
                });

                sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_rel_rec_inv_ref',
                    line: i,
                    value: relRecInvRef
                });

                /* sublist.setSublistValue({
					group:'custpage_invrecords',
                    id: 'custpage_rel_rec_tran_num',
                    line: i,
                    value: relRecTranNum
                });    */
				
				//recObj.save();

                //scriptContext.response.writePage(recObj);
            } //End For loop
		}

        }
        return {
            beforeLoad: beforeLoad
        }
    });