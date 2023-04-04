/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL 194Q Tds Calculation
 * File Name: MHL YIL 194Q Tds Calculation.js
 * Created On: 16/02/2023
 * Modified On: 
 * Created By: Sunil K (Yantra Inc.)
 * Modified By: 
 * Description: 194q Tds calculation in vendor invoice.
 *************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format','N/runtime'],
    function(record, search, format,runtime) {
		
		function beforeSubmit(scriptContext) {
			
			var o_recordObj = scriptContext.newRecord;
            var recordId = scriptContext.newRecord.id;
			var recordType = scriptContext.newRecord.type;
			
			var tdsCode = o_recordObj.getValue({
                fieldId: 'custbody_generic_section_code'
            });
            log.debug("Tds Code -->", tdsCode);
			
			if(tdsCode == '59'){
			
			 var itemLine = o_recordObj.getLineCount({
                        sublistId: 'item'
                    });
                    log.debug('itemLine -->', itemLine);

                    var currTotAmt = 0;

                    for (var i = 0; i < itemLine; i++) {
                        var currRecAmt = o_recordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        });
						
						currTotAmt += parseInt(currRecAmt);
					}	
					log.debug('currTotAmt',currTotAmt);
					
					o_recordObj.setValue({"fieldId":'custbody_194q_base_amount', value: parseInt(currTotAmt)});
			}
		}
		

        function afterSubmit(scriptContext) {

            var o_recordObj = scriptContext.newRecord;
            var recordId = scriptContext.newRecord.id;
			var recordType = scriptContext.newRecord.type;

            if (scriptContext.type == scriptContext.UserEventType.DELETE)
                return;

            var scriptObj = runtime.getCurrentScript();
            var tdsLibItem = scriptObj.getParameter({
                name: 'custscript_tds_item'
            });
			log.debug("Tds Lib Item-->", tdsLibItem);
		
            try {
                var recObj = record.load({
                    type: recordType,
                    id: recordId,
                    isDynamic: true
                });
                var i_percent = recObj.getValue({
                    fieldId: 'custbody_advance_amount_percent'
                });
                log.debug("i_percent", i_percent);

                var vendorId = recObj.getValue({
                    fieldId: 'entity'
                });
                log.debug("Ven ID-->", vendorId);

                var baseAmt = recObj.getValue({
                    fieldId: 'custbody_194q_base_amount'
                });
                log.debug("Base Amount-->", baseAmt);
				
				var tdsCode = recObj.getValue({
                fieldId: 'custbody_generic_section_code'
				});
				log.debug("Tds Code -->", tdsCode);

                if (baseAmt && tdsCode == '59') {
                    var transactionSearchObj = search.create({
                        type: "transaction",
                        filters: [
                            ["type", "anyof", "VendBill", "Custom125"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["trandate", "within", "thisfiscalyear"],
                            "AND",
                            [
                                ["vendor.internalidnumber", "equalto", vendorId], "OR", ["custbody_vendor.internalid", "anyof", vendorId]
                            ]
                        ],
                        columns: [
                            search.createColumn({
								 name: "internalid",
								 summary: "COUNT",
								 label: "Internal ID"
							}),
                            search.createColumn({
                                name: "custbody_194q_base_amount",
                                summary: "SUM",
                                label: "194Q Base Amount"
                            })
                        ]
                    });

                    var searchResultTranAmt = transactionSearchObj.run().getRange({
                        start: 0,
                        end: 1
                    });

                    log.debug("searchResultTranAmt Length -->", searchResultTranAmt.length);

                    if (searchResultTranAmt.length > 0) {
                        var totBaseAmt = searchResultTranAmt[0].getValue({
                            name: "custbody_194q_base_amount",
                            summary: "SUM",
                            label: "194Q Base Amount"
                        });
                        log.debug("totBaseAmt-->", totBaseAmt);
                    }

					var venCalAmt = 0;
					
                    if (totBaseAmt > 5000000) {
                        
					venCalAmt = parseFloat(totBaseAmt) - 5000000;
					log.debug("venCalAmt",venCalAmt);
				
					//baseAmt -> 90L
					//40L 
                    if (baseAmt <= venCalAmt) {
                        var wht_fin_per_amt = 0.1 * parseFloat(baseAmt) / 100;
						log.debug("wht_fin_per_amt 99-->", wht_fin_per_amt);
                    }

                    if (venCalAmt < baseAmt) {
                        var wht_fin_per_amt = 0.1 * parseFloat(venCalAmt) / 100;
						log.debug("wht_fin_per_amt 103-->", wht_fin_per_amt);
                    }
					
					log.debug("Final Calculated -->", wht_fin_per_amt);

                    var itemLine = recObj.getLineCount({
                        sublistId: 'item'
                    });
                    log.debug('itemLine -->', itemLine);

                    
                    var currItemRecord;

                    for (var i = 0; i < itemLine; i++) {
                        var currRecItem = recObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        log.debug("currRecItem---->", currRecItem);
                        log.debug("tdsLibItem---->", tdsLibItem);

                        if (currRecItem == tdsLibItem) {

                            currItemRecord = currRecItem;

                            recObj.selectLine({
                                sublistId: 'item',
                                line: i
                            });
                            recObj.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: tdsLibItem
                            });
                            recObj.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: parseFloat(wht_fin_per_amt)
                            });
                            recObj.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: parseFloat(wht_fin_per_amt)
                            });
                            recObj.commitLine({
                                sublistId: "item"
                            });
                        }
                    }
					
					if (currItemRecord != tdsLibItem) {
                        if (tdsLibItem && wht_fin_per_amt) 
                        {	
							recObj.selectNewLine({sublistId: 'item'});
							recObj.setCurrentSublistValue({sublistId:'item',fieldId:'item',value:tdsLibItem});
							recObj.setCurrentSublistValue({sublistId:'item',fieldId:'rate',value: parseFloat(wht_fin_per_amt)});	
							recObj.setCurrentSublistValue({sublistId:'item',fieldId:'amount',value: parseFloat(wht_fin_per_amt)});
							recObj.commitLine({sublistId:"item"});
                       }
                    }
					
					
				}
					//baseAmt If loop
                }
				
				var venBill = recObj.save();
				log.debug("venBill Saved",venBill);


            } catch(e) {
                log.debug("Error",e);
            }

        }
        return {
            afterSubmit: afterSubmit,
			beforeSubmit: beforeSubmit
        }
    });
