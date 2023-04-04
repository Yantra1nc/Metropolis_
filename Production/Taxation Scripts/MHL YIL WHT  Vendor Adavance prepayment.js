/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL WHT Vendor Adavance prepayment
 * File Name: MHL YIL WHT Vendor Adavance prepayment.js
 * Created On: 23/01/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: WHT Calculation for Overseas in Vendor advance prepayment
 *********************************************************** */


/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/runtime'],
    function(record, search, format, serverWidget, runtime) {

        function afterSubmit(scriptContext) {

            //     if (scriptContext.type == scriptContext.UserEventType.CREATE) {

            try {

                var rec_obj = scriptContext.newRecord;
                //log.debug("Rec Obj-->",recObj);

                var recType = rec_obj.type;
                log.debug("recType", recType);

                var recId = rec_obj.id;
                log.debug("recId", recId);

                if (recId) {
                    var recObj = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true
                    });
                }

                var venId = recObj.getValue({
                    fieldId: 'custbody_vendor'
                });
                log.debug("Vendor Id -->", venId);

                var formatedFromDate = recObj.getValue({
                    fieldId: 'trandate'
                });
                log.debug("formatedFromDate -->", formatedFromDate);

                var venInvDate = format.parse({
                    value: formatedFromDate,
                    type: format.Type.DATE
                });
                log.debug("venInvDate -->", venInvDate);



                if (venId) {
                    var venObj = record.load({
                        type: 'vendor',
                        id: venId
                    });

                    var whtVendorType = venObj.getValue({
                        fieldId: "custentity_wht_vendor_type"
                    });
                    log.debug("whtVendorType -->", whtVendorType);

                    /* var whtVendorCode = venObj.getValue({
						fieldId: "custentity_wht_code"
						});
						log.debug("whtVendorCode -->", whtVendorCode); */

                    var vendorSubsidiary = venObj.getValue({
                        fieldId: "subsidiary"
                    });
                    log.debug("vendorSubsidiary -->", vendorSubsidiary);

                    var venInvWhtCode = recObj.getValue({
                        fieldId: 'custbody_withholding_ven_tax_code'
                    });
                    log.debug("Vendor Invoice Wht Code -->", venInvWhtCode);

                    //if (whtVendorType && venInvWhtCode) {
					if (venInvWhtCode) 
					{
                        var whtRecId = record.load({
                            type: 'customrecord_withholding_tax',
                            id: venInvWhtCode
                        });

                        var whtCustRecType = whtRecId.getValue({
                            fieldId: "custrecord_vendor_type"
                        });
                        //log.debug("whtCustRecType -->", whtCustRecType);

                        var whtCustRecRate = whtRecId.getValue({
                            fieldId: "custrecord_rate"
                        });
                        log.debug("whtCustRecRate -->", whtCustRecRate);

                        var wht_cust_from_date = whtRecId.getValue({
                            fieldId: "custrecord_wht_from_date"
                        });
                        log.debug("wht_cust_from_date -->", wht_cust_from_date);

                        var whtCustFromDate = format.parse({
                            value: wht_cust_from_date,
                            type: format.Type.DATE
                        }); 
                        log.debug("whtCustFromDate-->", whtCustFromDate);

                        var wht_cust_to_date = whtRecId.getValue({
                            fieldId: "custrecord_wht_to_date"
                        });
                        log.debug("wht_cust_to_date",wht_cust_to_date);

                        var whtCustToDate = format.parse({
                            value: wht_cust_to_date,
                            type: format.Type.DATE
                        });
                        log.debug("whtCustToDate-->", whtCustToDate); 


                        var whtDisItemAccId = whtRecId.getValue({
                            fieldId: "custrecord_wht_item_account"
                        });
                        log.debug("whtDisItemAccId -->", whtDisItemAccId);

                        if (whtDisItemAccId) {
                            var whtDisItemId = record.load({
                                type: 'discountitem',
                                id: whtDisItemAccId
                            });
                            //log.debug("whtDisItemId", whtDisItemId);

                            var whtCustItemAcc = whtDisItemId.getValue({
                                fieldId: "account"
                            });
                            log.debug("whtCustItemAcc -->", whtCustItemAcc);
                        }
						
						
						var venTotAmt = recObj.getValue({
                            fieldId: 'custbody_wht_base_amount'
                        });
                        log.debug("Vendor Invoice Amount -->", venTotAmt);


                        /* var venTotAmt = 0;

                        var itemLine = recObj.getLineCount({
                            sublistId: 'line'
                        });
                        log.debug('itemLine -->', itemLine);
                        for (var c = 0; c < itemLine; c++) {
                            var currRecItem = recObj.getSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                line: c
                            });
                            log.debug("currRecItem---->", currRecItem);
                            log.debug("whtCustItemAcc---->", whtCustItemAcc);

                            if (currRecItem != whtCustItemAcc) {

                                var amtVenInv = recObj.getSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'amount',
                                    line: c
                                });
                                venTotAmt = venTotAmt + amtVenInv;

                            }
                        }
                        log.debug("venTotAmt", venTotAmt); */


                        //=====Vendor Exemption ===start=====


                        var customrecord_wht_vendor_exemptionSearchObj = search.create({
                            type: "customrecord_wht_vendor_exemption",
                            filters: [
                                ["custrecord_wht_vendor_name", "anyof", venId]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "scriptid",
                                    sort: search.Sort.ASC,
                                    label: "Script ID"
                                }),
                                search.createColumn({
                                    name: "custrecord_wht_exm_from_amount",
                                    join: "CUSTRECORD_WHT_EXM_PARENT_RECORD",
                                    label: "From Amount"
                                }),
                                search.createColumn({
                                    name: "custrecord_wht_exm_to_amount",
                                    join: "CUSTRECORD_WHT_EXM_PARENT_RECORD",
                                    label: "To Amount"
                                }),
                                search.createColumn({
                                    name: "custrecord_wht_exm_from_date",
                                    label: "From Date"
                                }),
                                search.createColumn({
                                    name: "custrecord_wht_exm_to_date",
                                    label: "To Date"
                                }),
                                search.createColumn({
                                    name: "custrecord_wht_exm_rate",
                                    join: "CUSTRECORD_WHT_EXM_PARENT_RECORD",
                                    label: "Rate"
                                })
                            ]
                        });


                        var searchResult = customrecord_wht_vendor_exemptionSearchObj.run().getRange({
                            start: 0,
                            end: 1
                        });

                        var venExmTot = 0;

                        if (searchResult.length > 0) {
                            var whtExmFromAmt = searchResult[0].getValue({
                                name: "custrecord_wht_exm_from_amount",
                                join: "CUSTRECORD_WHT_EXM_PARENT_RECORD"
                            });
                            log.debug("whtExmFromAmt-->", whtExmFromAmt);

                            var whtExmToAmt = searchResult[0].getValue({
                                name: 'custrecord_wht_exm_to_amount',
                                join: "CUSTRECORD_WHT_EXM_PARENT_RECORD"
                            });
                            log.debug("whtExmToAmt-->", whtExmToAmt);

                            var whtExmFromDate = searchResult[0].getValue({
                                name: 'custrecord_wht_exm_from_date'
                            });
                            log.debug("whtExmFromDate-->", whtExmFromDate);

                            var formatedFromDate = format.parse({
                                value: whtExmFromDate,
                                type: format.Type.DATE
                            });
                            log.debug("formatedFromDate -->", formatedFromDate);

                            var whtExmToDate = searchResult[0].getValue({
                                name: 'custrecord_wht_exm_to_date'
                            });
                            log.debug("whtExmToDate-->", whtExmToDate);

                            var formatedToDate = format.parse({
                                value: whtExmToDate,
                                type: format.Type.DATE
                            });
                            log.debug("formatedToDate-->", formatedToDate);


                            //Thoughout Vendor Invoice Calculation

                            log.debug("venId-->299", venId);
							var throghoutInvAmt;

                           /*  var transactionSearchObj = search.create({
                                type: "transaction",
                                filters: [
                                    ["type", "anyof", "CuTrPrch150", "Custom125", "VendBill"],
                                    "AND",
                                    ["custbody_withholding_ven_tax_code", "noneof", "@NONE@"],
                                    "AND",
                                    ["trandate", "within", formatedFromDate, formatedToDate],
                                    "AND",
                                    ["mainline", "is", "T"],
                                    "AND",
                                    [
                                        ["custbody_vendor", "anyof", venId], "OR", ["name", "anyof", venId]
                                    ],
                                    "AND",
                                    ["status", "anyof", "CuTrPrch150:A", "CuTrPrch150:B", "Custom125:A", "Custom125:B", "VendBill:A", "VendBill:B", "VendBill:D", "VendBill:F"]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "fxamount",
                                        summary: "SUM",
                                        label: "Amount (Foreign Currency)"
                                    })
                                ]
                            }); */
							
							var transactionSearchObj = search.create({
							   type: "transaction",
							   filters:
							   [
								  ["type","anyof","CuTrPrch150","Custom125","VendBill"], 
								  "AND", 
								  ["custbody_withholding_ven_tax_code","noneof","@NONE@"], 
								  "AND", 
								  ["trandate","within",whtExmFromDate,whtExmToDate], 
								  "AND", 
								  ["mainline","is","T"], 
								  "AND", 
								  [["custbody_vendor","anyof",venId],"OR",["name","anyof",venId]]
							   ],
							   columns:
							   [
								  search.createColumn({
									 name: "fxamount",
									 summary: "SUM",
									 label: "Amount (Foreign Currency)"
								  }),
								  search.createColumn({
									 name: "custbody_wht_base_amount",
									 summary: "SUM",
									 label: "Base Amount"
								  })
							   ]
							});



                            var searchResultTranAmt = transactionSearchObj.run().getRange({
                                start: 0,
                                end: 1
                            });

                            log.debug("searchResultTranAmt Length -->", searchResultTranAmt.length);

                            if (searchResultTranAmt.length > 0) {
                                throghoutInvAmt = searchResultTranAmt[0].getValue({
                                    name: "custbody_wht_base_amount",
									summary: "SUM",
									label: "Base Amount"
                                });

                                log.debug("throghoutInvAmt Foreign -->", parseFloat(throghoutInvAmt));
                                log.debug("Current Inv Amt 343-->", venTotAmt);

                                var invIndianAmt = searchResultTranAmt[0].getValue({
                                    name: "fxamount",
                                    summary: "SUM",
                                });
                                log.debug("invIndianAmt-->", invIndianAmt);
                            }
							
							var venInvDateString = recObj.getValue({
								fieldId: 'trandate'
							});
							
							var venInvDate = format.parse({
								value: venInvDateString,
								type: format.Type.DATE
							});
							log.debug("venInvDate -->", venInvDate); 


                            //=========================================

							//if (parseFloat(throghoutInvAmt) > parseFloat(whtExmToAmt))

                            if (parseFloat(throghoutInvAmt) >= parseFloat(whtExmFromAmt) && parseFloat(throghoutInvAmt) <= parseFloat(whtExmToAmt)) {
                                var whtExmRate = searchResult[0].getValue({
                                    name: "custrecord_wht_exm_rate",
                                    join: "CUSTRECORD_WHT_EXM_PARENT_RECORD"
                                });
                                log.debug("whtExmRate Custom record rate LL->", parseFloat(whtExmRate));

                               if(throghoutInvAmt){
									//venExmTot = parseFloat(throghoutInvAmt) - parseFloat(whtExmToAmt);
									venExmTot = parseFloat(throghoutInvAmt) - parseFloat(whtExmFromAmt);
									log.debug("venExmTot IF Loop -->", venExmTot);
								}

                                if (formatedFromDate <= venInvDate && formatedToDate >= venInvDate) {
									
									log.debug("Line Number --> 368");
                                    

									/* if(parseFloat(venTotAmt) < parseFloat(venExmTot)){
										var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venTotAmt)) / 100;
									}  */
									
									//2000 > 1000
									//80000 < 40000
									//log.debug("venExmTot Second >",venExmTot + "VEn Inv Amt ",venTotAmt);
									if (venTotAmt < venExmTot) {
                                        var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venTotAmt)) / 100;
                                    }


                                    //1000 < 2000
                                    if (venExmTot < venTotAmt) {
                                        var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venExmTot)) / 100;
                                    }


                                    log.debug("WHT Final Amount -->", parseFloat(wht_fin_per_amt));

                                    recObj.setValue({
                                        fieldId: 'custbody_wht_amount',
                                        value: parseFloat(wht_fin_per_amt),
                                        ignoreFieldChange: false
                                    });

                                    var currItemRecord;

                                    if (whtCustItemAcc) {
                                        var itemLine = recObj.getLineCount({
                                            sublistId: 'line'
                                        });
                                        log.debug('itemLine -->', itemLine);
                                        for (var i = 0; i < itemLine; i++) {
                                            var currRecItem = recObj.getSublistValue({
                                                sublistId: 'line',
                                                fieldId: 'account',
                                                line: i
                                            });
                                            log.debug("currRecItem---->", currRecItem);
                                            log.debug("whtCustItemAcc---->", whtCustItemAcc);

                                            if (currRecItem == whtCustItemAcc) {

                                                currItemRecord = currRecItem;

                                                /*  wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1); */
                                                recObj.selectLine({
                                                    sublistId: 'line',
                                                    line: i
                                                });
                                                recObj.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: whtCustItemAcc
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
                                    }

                                    if (currItemRecord != whtCustItemAcc) {
                                        if (whtCustItemAcc && wht_fin_per_amt) {
                                            /* wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1); */

                                            recObj.selectNewLine({
                                                sublistId: 'line'
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'line',
                                                fieldId: 'account',
                                                value: whtCustItemAcc
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
                                }

                            }else if (parseFloat(throghoutInvAmt) >= parseFloat(whtExmToAmt)) {
							
                            log.debug("Not Applicable for WHT tax");
								
							//=====After Slab To Amount========
							
							var wht_fin_per_amt = (whtCustRecRate * parseFloat(venTotAmt)) / 100;

                            log.debug("WHT Final Amount -->", parseFloat(wht_fin_per_amt));

                            var total = venTotAmt - wht_fin_per_amt;
                            log.debug("total -->", total);

                            //recObj.setValue('custbody_wht_amount', wht_fin_per_amt);	

                            //existingItem == whtCustItemAcc

                            recObj.setValue({
                                fieldId: 'custbody_wht_amount',
                                value: parseFloat(wht_fin_per_amt),
                                ignoreFieldChange: false
                            });

                            var currItemRecord;

                            if (whtCustItemAcc) {
                                var itemLine = recObj.getLineCount({
                                    sublistId: 'line'
                                });
                                log.debug('itemLine -->', itemLine);
                                for (var i = 0; i < itemLine; i++) {
                                    var currRecItem = recObj.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        line: i
                                    });
                                    log.debug("currRecItem---->", currRecItem);
                                    log.debug("whtCustItemAcc---->", whtCustItemAcc);

                                    if (currRecItem == whtCustItemAcc) {

                                        currItemRecord = currRecItem;

                                        wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                        recObj.selectLine({
                                            sublistId: 'line',
                                            line: i
                                        });
                                        recObj.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'account',
                                            value: whtCustItemAcc
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
                            }

                            if (currItemRecord != whtCustItemAcc) {
                                if (whtCustItemAcc && wht_fin_per_amt) {

                                    //wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                    recObj.selectNewLine({
                                        sublistId: 'line'
                                    });
                                    recObj.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        value: whtCustItemAcc
                                    });

                                    log.debug("wht_fin_per_amt 426---->", wht_fin_per_amt);

                                    recObj.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'amount',
                                        value: wht_fin_per_amt
                                    });
                                    recObj.commitLine({
                                        sublistId: "line"
                                    });
                                }
                            }
								
								
								
								
								
								
								//=====After Slab To Amount========
								
								
								
								
								
								
								
								
                            } //Not exemption vendor code
                        } else if (whtCustFromDate <= venInvDate && whtCustToDate >= venInvDate) {
                            log.debug("Testing");
                            var wht_fin_per_amt = (whtCustRecRate * parseFloat(venTotAmt)) / 100;

                            log.debug("WHT Final Amount -->", parseFloat(wht_fin_per_amt));

                            var total = venTotAmt - wht_fin_per_amt;
                            log.debug("total -->", total);

                            //recObj.setValue('custbody_wht_amount', wht_fin_per_amt);	

                            //existingItem == whtCustItemAcc

                            recObj.setValue({
                                fieldId: 'custbody_wht_amount',
                                value: parseFloat(wht_fin_per_amt),
                                ignoreFieldChange: false
                            });

                            var currItemRecord;

                            if (whtCustItemAcc) {
                                var itemLine = recObj.getLineCount({
                                    sublistId: 'line'
                                });
                                log.debug('itemLine -->', itemLine);
                                for (var i = 0; i < itemLine; i++) {
                                    var currRecItem = recObj.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        line: i
                                    });
                                    log.debug("currRecItem---->", currRecItem);
                                    log.debug("whtCustItemAcc---->", whtCustItemAcc);

                                    if (currRecItem == whtCustItemAcc) {

                                        currItemRecord = currRecItem;

                                        wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                        recObj.selectLine({
                                            sublistId: 'line',
                                            line: i
                                        });
                                        recObj.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'account',
                                            value: whtCustItemAcc
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
                            }

                            if (currItemRecord != whtCustItemAcc) {
                                if (whtCustItemAcc && wht_fin_per_amt) {

                                    //wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                    recObj.selectNewLine({
                                        sublistId: 'line'
                                    });
                                    recObj.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        value: whtCustItemAcc
                                    });

                                    log.debug("wht_fin_per_amt 426---->", wht_fin_per_amt);

                                    recObj.setCurrentSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'amount',
                                        value: wht_fin_per_amt
                                    });
                                    recObj.commitLine({
                                        sublistId: "line"
                                    });
                                }
                            }
                        }  else {
                            log.debug("Not Eligible for WHT")
                        }
 

                        //===========================================
                    }
                }
                var venPrePay = recObj.save();
                log.debug("vendor Prepayment Saved", venPrePay);
            } catch (e) {
                log.debug("Error-->", e);
            }
            // }
        }
        return {
            afterSubmit: afterSubmit
        }
    });