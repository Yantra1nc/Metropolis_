/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL UE WHT Non Po Base
 * File Name: MHL YIL UE WHT Non Po Base.js
 * Created On: 23/01/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: WHT Calculation for Overseas in Non Po base 
 *********************************************************** */

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/runtime'],
    function(record, search, format, serverWidget, runtime) {

        function afterSubmit(scriptContext) {

            //if (scriptContext.type == scriptContext.UserEventType.CREATE) {

            //try {

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
                    fieldId: 'entity'
                });
                log.debug("Vendor Id -->", venId);

                var formatedFromDate = recObj.getValue({
                    fieldId: 'trandate'
                });
                log.debug("Vendor Invoice Date -->", formatedFromDate);

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

                    //if (whtVendorType && venInvWhtCode) 
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
                        //log.debug("whtCustFromDate -->", whtCustFromDate);

                        var whtCustFromDate = format.parse({
                            value: wht_cust_from_date,
                            type: format.Type.DATE
                        });
                        log.debug("whtCustFromDate-->", whtCustFromDate);

                        var wht_cust_to_date = whtRecId.getValue({
                            fieldId: "custrecord_wht_to_date"
                        });
                        //log.debug("whtCustToDate",whtCustToDate);

                        var whtCustToDate = format.parse({
                            value: wht_cust_to_date,
                            type: format.Type.DATE
                        });
                        log.debug("whtCustToDate-->", whtCustToDate);


                        var whtDisItemAccId = whtRecId.getValue({
                            fieldId: "custrecord_wht_item_account"
                        });
                        log.debug("whtDisItemAccId -->", whtDisItemAccId);

                        var whtCustExpCat = whtRecId.getValue({
                            fieldId: "custrecord_wht_expense_account"
                        });
                        log.debug("whtCustExpCat -->", whtCustExpCat);
						
						if(whtCustExpCat){
								var whtDisItemId = record.load({
									type: 'expensecategory',
									id: whtCustExpCat
								});
								//log.debug("whtDisItemId",whtDisItemId);
								
								var whtExpAccId = whtDisItemId.getValue({
								fieldId: "expenseacct"
								});
								log.debug("whtExpAccId -->", whtExpAccId);
							}
							
							
						//=================	
							
						var venTotAmt = recObj.getValue({
                            fieldId: 'custbody_wht_base_amount'
                        });
                        log.debug("Vendor Invoice Amount -->", venTotAmt);	
						
                        /* var venTotAmt = 0;

                        //For Expense Line 
                        if (whtCustExpCat) {
                            var expenseLineCount = recObj.getLineCount({
                                sublistId: 'expense'
                            });
                            log.debug('expenseLineCount -->', expenseLineCount);

                            if (expenseLineCount) {
                                for (var ex = 0; ex < expenseLineCount; ex++) {
                                    var currRecExpense = recObj.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'account',
                                        line: ex
                                    });
                                    log.debug("currRecExpense---->", currRecExpense);
                                    log.debug("whtExpAccId---->", whtExpAccId);

                                    if (currRecExpense != whtExpAccId) {
                                        //var rateVenExp = recObj.getSublistValue({
                                        	//sublistId: 'expense',
                                        	//fieldId: 'rate',
                                        	//line: ex
                                        //}); 
                                        var amtVenExp = recObj.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'amount',
                                            line: ex
                                        });
                                        venTotAmt = venTotAmt + amtVenExp;

                                    }
                                }
                                log.debug("venTotAmt For Expense -->", venTotAmt);
                            }
                        } */



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

                            /* var transactionSearchObj = search.create({
                                type: "transaction",
                                filters: [
                                    ["type", "anyof", "VendBill", "CuTrPrch150", "Custom125"],
                                    "AND",
                                    ["name", "anyof", venId],
                                    "AND",
                                    ["custbody_withholding_ven_tax_code", "noneof", "@NONE@"],
                                    "AND",
                                    ["trandate", "within", formatedFromDate, formatedToDate],
                                    "AND",
                                    ["mainline", "is", "T"]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "entity",
                                        //summary: "GROUP",
                                        label: "Name"
                                    }),
                                    search.createColumn({
                                        name: "amount",
                                       // summary: "SUM",
                                        label: "Amount"
                                    }),
                                    search.createColumn({
                                        name: "fxamount",
                                       // summary: "SUM",
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

                            if (searchResultTranAmt.length > 0) {
                                throghoutInvAmt = searchResultTranAmt[0].getValue({
                                    name: "custbody_wht_base_amount",
									summary: "SUM",
									label: "Base Amount"
                                });
								
							   //throghoutInvAmt = parseFloat(throghoutInvAdvAmt) + parseFloat(venTotAmt);
								
                                log.debug("throghoutInvAmt Foreign -->", parseFloat(throghoutInvAmt));
                                log.debug("Current Inv Amt 343-->", venTotAmt);

                                /* var invIndianAmt = searchResultTranAmt[0].getValue({
                                    name: "amount",
                                  //  summary: "SUM",
                                });
                                log.debug("invIndianAmt-->", invIndianAmt); */

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
							
							//||  whtExmToAmt < venTotAmt
                            log.debug("venExmTot Line 348-->", throghoutInvAmt);

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
                                    
									log.debug("Line Number --> 390");
									
									//80000 < 40000
									log.debug("venExmTot Second >",venExmTot + "VEn Inv Amt ",venTotAmt);
									/* if(parseFloat(venExmTot) > parseFloat(venTotAmt)){
										var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venExmTot)) / 100;
									} */
									
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

                                    if (whtDisItemId) {
                                        var itemLine = recObj.getLineCount({
                                            sublistId: 'expense'
                                        });
                                        log.debug('itemLine -->', itemLine);
                                        for (var i = 0; i < itemLine; i++) {
                                            var currRecItem = recObj.getSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'account',
                                                line: i
                                            });
                                            log.debug("currRecItem---->", currRecItem);
                                            //log.debug("whtDisItemId---->", whtDisItemId);
											
											orgExpenseLine = recObj.getSublistValue({
												sublistId: 'expense',
												fieldId: 'location',
												line: i
											});
											log.debug("orgExpenseLine---->", orgExpenseLine);

                                            if (currRecItem == whtExpAccId) {

                                                currItemRecord = currRecItem;

                                                wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
												
                                                recObj.selectLine({
                                                    sublistId: 'expense',
                                                    line: i
                                                });
                                                recObj.setCurrentSublistValue({
                                                    sublistId: 'expense',
                                                    fieldId: 'account',
                                                    value: whtExpAccId
                                                });
												
												recObj.setCurrentSublistValue({
													sublistId: 'expense',
													fieldId: 'location',
													value: orgExpenseLine
												});

                                                recObj.setCurrentSublistValue({
                                                    sublistId: 'expense',
                                                    fieldId: 'amount',
                                                    value: parseFloat(wht_fin_per_amt)
                                                });
                                                recObj.commitLine({
                                                    sublistId: "expense"
                                                });

                                            }
                                        }
                                    }

                                    if (currItemRecord != whtExpAccId) {
                                        if (whtExpAccId && wht_fin_per_amt) {
                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1); 

                                            recObj.selectNewLine({
                                                sublistId: 'expense'
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'account',
                                                value: whtExpAccId
                                            });
											
											recObj.setCurrentSublistValue({
												sublistId: 'expense',
												fieldId: 'location',
												value: orgExpenseLine
											});

                                            recObj.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'amount',
                                                value: parseFloat(wht_fin_per_amt)
                                            });
                                            recObj.commitLine({
                                                sublistId: "expense"
                                            });
                                        }
                                    }
                                }

                            }else if (parseFloat(throghoutInvAmt) >= parseFloat(whtExmToAmt)) {
                            
							
							log.debug("After Slab exemption TO Amount");
							log.debug("966 Ven Inv Amt", venTotAmt);
                            log.debug("967 whtCustRecRate", whtCustRecRate);
							
                            //var wht_fin_per_amt = (whtCustRecRate * parseFloat(venTotAmt)) / 100;
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

                            if (whtDisItemId) {
                                var itemLine = recObj.getLineCount({
                                    sublistId: 'expense'
                                });
                                log.debug('itemLine -->', itemLine);
                                for (var i = 0; i < itemLine; i++) {
                                    var currRecItem = recObj.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'account',
                                        line: i
                                    });
                                    log.debug("currRecItem---->", currRecItem);
                                    log.debug("whtExpAccId---->", whtExpAccId);
									
									orgExpenseLine = recObj.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'location',
                                        line: i
                                    });
                                    log.debug("orgExpenseLine---->", orgExpenseLine);

                                    if (currRecItem == whtExpAccId) {

                                        currItemRecord = currRecItem;

                                        wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                        recObj.selectLine({
                                            sublistId: 'expense',
                                            line: i
                                        });
                                        recObj.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'account',
                                            value: whtExpAccId
                                        });
										
										recObj.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'location',
                                            value: orgExpenseLine
                                        });

                                        recObj.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'amount',
                                            value: parseFloat(wht_fin_per_amt)
                                        });
                                        recObj.commitLine({
                                            sublistId: "expense"
                                        });
                                    }
                                }
                            }

                            if (currItemRecord != whtExpAccId) {
                                if (whtExpAccId && wht_fin_per_amt) {

                                    wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                    recObj.selectNewLine({
                                        sublistId: 'expense'
                                    });
                                    recObj.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'account',
                                        value: whtExpAccId
                                    });

                                    log.debug("wht_fin_per_amt 426---->", wht_fin_per_amt);
									
									recObj.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'location',
                                        value: orgExpenseLine
                                    });

                                    recObj.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        value: wht_fin_per_amt
                                    });
                                    recObj.commitLine({
                                        sublistId: "expense"
                                    });
                                }
                            }
                        }else {
                                log.debug("Not Applicable for WHT tax 613");
                            } //Not exemption vendor code
                        } else if (whtCustFromDate <= venInvDate && whtCustToDate >= venInvDate) {
                            log.debug("Normal wht deduction");
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

                            if (whtDisItemId) {
                                var itemLine = recObj.getLineCount({
                                    sublistId: 'expense'
                                });
                                log.debug('itemLine -->', itemLine);
                                for (var i = 0; i < itemLine; i++) {
                                    var currRecItem = recObj.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'account',
                                        line: i
                                    });
                                    log.debug("currRecItem---->", currRecItem);
                                    log.debug("whtExpAccId---->", whtExpAccId);
									
									orgExpenseLine = recObj.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'location',
                                        line: i
                                    });
                                    log.debug("orgExpenseLine---->", orgExpenseLine);

                                    if (currRecItem == whtExpAccId) {

                                        currItemRecord = currRecItem;

                                        wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                        recObj.selectLine({
                                            sublistId: 'expense',
                                            line: i
                                        });
                                        recObj.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'account',
                                            value: whtExpAccId
                                        });
										
										recObj.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'location',
                                            value: orgExpenseLine
                                        });

                                        recObj.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'amount',
                                            value: parseFloat(wht_fin_per_amt)
                                        });
                                        recObj.commitLine({
                                            sublistId: "expense"
                                        });
                                    }
                                }
                            }

                            if (currItemRecord != whtExpAccId) {
                                if (whtExpAccId && wht_fin_per_amt) {

                                    wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                    recObj.selectNewLine({
                                        sublistId: 'expense'
                                    });
                                    recObj.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'account',
                                        value: whtExpAccId
                                    });

                                    log.debug("wht_fin_per_amt 426---->", wht_fin_per_amt);
									
									recObj.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'location',
                                        value: orgExpenseLine
                                    });

                                    recObj.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        value: wht_fin_per_amt
                                    });
                                    recObj.commitLine({
                                        sublistId: "expense"
                                    });
                                }
                            }
                        } else {
                            log.debug("Not Eligible for WHT 723")
                        }


                        //===========================================


                    }
                }
                var venPrePay = recObj.save();
                log.debug("Vendor Advance Non PO Based", venPrePay);
           /*  } catch (e) {
                log.debug("Error-->", e);
            } */
            // }
        }
        return {
            afterSubmit: afterSubmit
        }
    });