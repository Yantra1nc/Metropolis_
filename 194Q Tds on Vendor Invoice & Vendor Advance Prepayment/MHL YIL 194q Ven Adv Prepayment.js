/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL 194Q Tds Calculation
 * File Name: MHL YIL 194Q Tds Calculation.js
 * Created On: 15/05/2023
 * Modified On: 
 * Created By: Sunil Khutawad(Yantra Inc.)
 * Modified By: 
 * Description: 194Q Tds Calculation on Vendor Advance Prepayment
 *********************************************************** */

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
                        var tax_code = o_recordObj.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_in_scode_tds',
                            line: i
                        });
						log.debug("tax_code",tax_code);
						
						 var tax_code_new = o_recordObj.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_tax_section_code',
                            line: i
                        });
						log.debug("tax_code_new",tax_code_new);
						
						if(tax_code == 59 || tax_code_new == 59){
							var currRecAmt = o_recordObj.getSublistValue({
								sublistId: 'line',
								fieldId: 'amount',
								line: i
							});
							
							currTotAmt += parseInt(currRecAmt);
						}
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
				
				var total_amount = recObj.getValue({
                    fieldId: 'total'
                });
                log.debug("total_amount -->", total_amount);
				
				var lineCount = recObj.getLineCount({sublistId:'line'});
				log.debug("Line Count-->", lineCount);
				
				var oldTdsCode;
				var newTdsCode;
			
				
				for(var i = 0; i < lineCount; i++)
				{
					var taxSectionCodeOld = recObj.getSublistValue({sublistId:'line',fieldId:'custcol_in_scode_tds',line:i});
					log.debug("taxSectionCodeOld",taxSectionCodeOld);
					
					if(taxSectionCodeOld == 59){
						oldTdsCode = taxSectionCodeOld;
					}
					
					var taxSectionCodeNew = recObj.getSublistValue({sublistId:'line',fieldId:'custcol_tax_section_code',line:i});
					log.debug("taxSectionCodeNew",taxSectionCodeNew);
					
					if(taxSectionCodeNew == 59){
						newTdsCode = taxSectionCodeNew;
					}
				}

                if (baseAmt && oldTdsCode == 59 || newTdsCode ==59) {
					
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
				
					
					var final_amount = parseInt(total_amount) - parseInt(wht_fin_per_amt)
					log.debug("Final Tds Amount ==>",final_amount);
					
					if(final_amount){
						recObj.setValue({
							fieldId: 'custbody_mhl_amount_after_tds',
							value: parseInt(final_amount)
						});
					}
					
					if(wht_fin_per_amt){
						recObj.setValue({
						fieldId: 'custbody_mhl_tds_amount',
						value: parseInt(wht_fin_per_amt)
						});
					}

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
						
						var taxSectionCodeTDS = recObj.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_in_scode_tds',
                            line: i
                        });
						
						log.debug("taxSectionCodeTDS",taxSectionCodeTDS);
						
						var taxSectionCodeTdsSecond = recObj.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_tax_section_code',
                            line: i
                        });
						
						log.debug("taxSectionCodeTdsSecond",taxSectionCodeTdsSecond);
					
						if(taxSectionCodeTDS == 59 || taxSectionCodeTdsSecond == 59){
							var lineAmountVap = recObj.getSublistValue({sublistId:'line',fieldId:'amount',line:i});
							log.debug("lineAmountVap",lineAmountVap);
							
							var finalLineAmount = lineAmountVap - wht_fin_per_amt;
							log.debug("finalLineAmount",finalLineAmount);
							
							recObj.selectLine({
                                sublistId: 'line',
                                line: i
                            });
							recObj.setCurrentSublistValue({sublistId:'line',fieldId:'amount',value: parseFloat(finalLineAmount)});
							recObj.commitLine({
                                sublistId: "line"
                            });
						}

                        if (currRecItem == tdsLibItem) {

                            currItemRecord = currRecItem;

							//wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
	
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
							//wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
					
							recObj.selectNewLine({sublistId: 'line'});
							recObj.setCurrentSublistValue({sublistId:'line',fieldId:'account',value:tdsLibItem});
							recObj.setCurrentSublistValue({sublistId:'line',fieldId:'amount',value: parseFloat(wht_fin_per_amt)});
							recObj.commitLine({sublistId:"line"});
                       }
                    }
					
					
				}
					//baseAmt If loop
                }
				
				var venAdvPay = recObj.save();
				log.debug("Vendor advance payment Saved",venAdvPay);


            } catch(e) {
                log.debug("Error",e);
            }

        }
        return {
            afterSubmit: afterSubmit,
			beforeSubmit: beforeSubmit
        }
    });