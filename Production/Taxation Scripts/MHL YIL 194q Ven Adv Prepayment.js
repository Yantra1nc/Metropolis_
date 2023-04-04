/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL 194q Ven Adv Prepayment
 * File Name: MHL YIL 194q Ven Adv Prepayment.js
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
			
			 var itemLine = o_recordObj.getLineCount({
                        sublistId: 'line'
                    });
                    log.debug('itemLine -->', itemLine);

                    var currTotAmt = 0;

                    for (var i = 0; i < itemLine; i++) {
                        var currRecAmt = o_recordObj.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'amount',
                            line: i
                        });
						
						currTotAmt += parseInt(currRecAmt);
					}	
					log.debug('currTotAmt',currTotAmt);
					
					o_recordObj.setValue({"fieldId":'custbody_194q_base_amount', value: parseInt(currTotAmt)});
			
		}

        function afterSubmit(scriptContext) {

            var o_recordObj = scriptContext.newRecord;
            var recordId = scriptContext.newRecord.id;
			var recordType = scriptContext.newRecord.type;

            if (scriptContext.type == scriptContext.UserEventType.DELETE)
                return;

            var scriptObj = runtime.getCurrentScript();
            var tdsLibItem = scriptObj.getParameter({
                name: 'custscript_tds_acc'
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
                    fieldId: 'custbody_vendor'
                });
                log.debug("Ven ID-->", vendorId);

                var baseAmt = recObj.getValue({
                    fieldId: 'custbody_194q_base_amount'
                });
                log.debug("Base Amount-->", baseAmt);
				
				var lineCount = recObj.getLineCount({sublistId:'line'});
				log.debug("Line Count-->", lineCount);
				
				for(var i = 0; i < lineCount; i++)
				{
					var taxSectionCodeOld = recObj.getSublistValue({sublistId:'line',fieldId:'custcol_in_scode_tds',line:i});
					log.debug("taxSectionCodeOld",taxSectionCodeOld);
					
					var taxSectionCodeNew = recObj.getSublistValue({sublistId:'line',fieldId:'custcol_tax_section_code',line:i});
					log.debug("taxSectionCodeNew",taxSectionCodeNew);
				}

                if (baseAmt && taxSectionCodeOld || taxSectionCodeNew) {
					
					log.debug("taxSectionCodeNew 58",taxSectionCodeNew);
					log.debug("taxSectionCodeOld 59",taxSectionCodeOld);
					log.debug("baseAmt 60",baseAmt);
					
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
                        sublistId: 'line'
                    });
                    log.debug('itemLine -->', itemLine);

                    
                    var currItemRecord;

                    for (var i = 0; i < itemLine; i++) {
                        var currRecItem = recObj.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            line: i
                        });
                        log.debug("currRecItem---->", currRecItem);
                        log.debug("tdsLibItem---->", tdsLibItem);

                        if (currRecItem == tdsLibItem) {

                            currItemRecord = currRecItem;

                            recObj.selectLine({
                                sublistId: 'line',
                                line: i
                            });
                            recObj.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: tdsLibItem
                            });
                            recObj.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'amount',
                                value: parseFloat(wht_fin_per_amt)
                            });
                            recObj.commitLine({
                                sublistId: "line"
                            });
                        }
                    }
					
					if (currItemRecord != tdsLibItem) {
                        if (tdsLibItem && wht_fin_per_amt) 
                        {	
							recObj.selectNewLine({sublistId: 'line'});
							recObj.setCurrentSublistValue({sublistId:'line',fieldId:'account',value:tdsLibItem});
							recObj.setCurrentSublistValue({sublistId:'line',fieldId:'amount',value: parseFloat(wht_fin_per_amt)});
							recObj.commitLine({sublistId:"line"});
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