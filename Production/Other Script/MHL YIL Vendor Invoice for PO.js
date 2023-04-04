/*************************************************************
 * File Header
 * Script Type: Client Script
 * Script Name: MHL YIL Vendor Invoice for PO (Production)
 * File Name: MHL YIL Vendor Invoice for PO.js
 * Created On: 02/12/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: There is a advance associated with the linked PO for which you are creating the vendor invoice
 *********************************************************** */


/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 
 
define(['N/record', 'N/currentRecord', 'N/search', 'N/log', 'N/runtime', 'N/format', 'N/ui/dialog'],
    function(record, currentRecord, search, log, runtime, format, dialog) {

        function pageInit(scriptContext) {
			log.debug("Inside PageInit");
            var cRecord = scriptContext.currentRecord;
            var sublistId = scriptContext.sublistId;
            var fieldId = scriptContext.fieldId;
            var recordId = scriptContext.currentRecord.id;

			log.debug("PageInit rec id -->", recordId);
					
			var poInvId = cRecord.getValue("custbody_mhl_grn_srn_no");
			log.debug("poRecId-->",poInvId);
					
			var poGrnId;
				
			if(poInvId)
			{
				var poRecObj =record.load({
				type:'itemreceipt',
				id:poInvId
				});
			
				poGrnId = poRecObj.getValue("createdfrom");
				
				if(poGrnId){
					cRecord.setValue({ fieldId: 'custbody_purchaseorder_internalid',value:poGrnId});
				}
			}
			log.debug("poGrnId -->",poGrnId);
			
			try {
                    var currentUser = runtime.getCurrentUser();
                    log.debug('postsourcing currentUser ', currentUser.roleId);
                    
                    var appliedTran = cRecord.getValue("custbody_purchaseorder_internalid");
					log.debug("appliedTran",appliedTran);

                        var purOrderId;
						
						if(appliedTran){

                        var transactionSearchObj = search.create({
                            type: "transaction",
                            filters: [
                                ["type", "anyof", "Custom125"],
                                "AND",
                                ["custbody_purchase_order", "anyof", appliedTran]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "tranid",
                                    label: "Document Number"
                                }),
                                search.createColumn({
                                    name: "transactionnumber",
                                    label: "Transaction Number"
                                }),
                                search.createColumn({
                                    name: "trandate",
                                    label: "Date"
                                }),
                                search.createColumn({
                                    name: "custbody_vendor",
                                    label: "Vendor 2"
                                }),
                                search.createColumn({
                                    name: "custbody_purchase_order",
                                    label: "Purchase Order"
                                })
                            ]
                        });
                        var searchResultCount = transactionSearchObj.runPaged().count;
                        log.debug("transactionSearchObj result count", searchResultCount);
                        transactionSearchObj.run().each(function(result) {
                            // .run().each has a limit of 4,000 results
                            
                            purOrderId = result.getValue({
                                name: "custbody_purchase_order",
                                label: "Purchase Order"
                            });

                            //log.debug("purOrder In loop -->", purOrder);

                            return true;
                            //return calTax;

                        });

                        log.debug("purOrder Out loop -->", purOrderId);
                        //log.debug("calTax -->", calTax);

                        if (poGrnId == purOrderId) {
							alert('There is a advance associated with the linked PO for which you are creating the vendor invoice!');
							}
							
						return true;
					}	
							
                } catch (e) {
                    log.error({
                        title: e.name,
                        details: e.message
                    });
                }
            //}
        }
		
		//For 194 Development
		function fieldChanged(context) {
			
			log.debug("fieldChanged");
			
			// if (context.mode == 'create') {

                try {
                    var estimateObj = context.currentRecord;
                    var currentUser = runtime.getCurrentUser();
                    log.debug('line init currentUser ', currentUser.roleId);
                    var recordId = context.currentRecord.id;
					log.debug("LineInit rec id -->", recordId);

                    var baseAmount = estimateObj.getValue("custbody_194q_base_amount");
					log.debug("baseAmount",baseAmount);
					
					var sectionCode = estimateObj.getValue("custbody_generic_section_code");
					log.debug("sectionCode",sectionCode);


					var lineCount = estimateObj.getLineCount('item');

                    if (lineCount && baseAmount > 0 && sectionCode == '59') {
							log.debug("Testing Field Changed 133");
                            estimateObj.getSublistField({
                                sublistId: 'item',
                                fieldId: 'custcol_india_section_code_tax',
                                line: 0
                            }).isDisabled = true;
					}else{
						log.debug("Testing Field Changed 140");
                            estimateObj.getSublistField({
                                sublistId: 'item',
                                fieldId: 'custcol_india_section_code_tax',
                                line: 0
                            }).isDisabled = false;
					} 
                } catch (e) {
                    log.error("Error", e);
                }
            //}
        }

        return {
            pageInit: pageInit
			//fieldChanged: fieldChanged
        }
    });