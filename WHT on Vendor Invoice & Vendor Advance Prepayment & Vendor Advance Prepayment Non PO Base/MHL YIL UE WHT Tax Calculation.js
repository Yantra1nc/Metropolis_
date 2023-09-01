/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL UE WHT Tax Calculation
 * File Name: 
 * Created On: 23/01/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: WHT Calculation for Overseas
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
                    fieldId: 'entity'
                });
                log.debug("Vendor Id -->", venId);

                var venInvDate = recObj.getValue({
                    fieldId: 'trandate'
                });
                log.debug("Vendor Invoice Date -->", venInvDate);

               /*  var venInvDate = format.format({
                    value: formatedFromDate,
                    type: format.Type.DATE
                });
                log.debug("venInvDate -->", venInvDate); */

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

                        var whtCustFromDate = whtRecId.getValue({
                            fieldId: "custrecord_wht_from_date"
                        });
                        //log.debug("whtCustFromDate -->", whtCustFromDate);
						
						//var whtCustFromDate;

                        /* if (whtCustFromDate) {
                            var wht_cust_from_date = format.format({
                                value: whtCustFromDate,
                                type: format.Type.DATE
                            });
                           
							
                        } */
						
						log.debug("wht_cust_from_date 105-->", whtCustFromDate);


                        var whtCustToDate = whtRecId.getValue({
                            fieldId: "custrecord_wht_to_date"
                        });
                        //log.debug("whtCustToDate",whtCustToDate);

						/* var whtCustToDate;
                        if (wht_cust_to_date) {
                           var wht_cust_to_date = format.format({
                                value: wht_cust_to_date,
                                type: format.Type.DATE
                            });
                            
                        } */
						log.debug("whtCustToDate 121-->", whtCustToDate);


                        var whtCustItemAcc = whtRecId.getValue({
                            fieldId: "custrecord_wht_item_account"
                        });
                        log.debug("whtCustItemAcc -->", whtCustItemAcc);

                        var whtCustExpCat = whtRecId.getValue({
                            fieldId: "custrecord_wht_expense_account"
                        });
                        log.debug("whtCustExpCat -->", whtCustExpCat);

                        var venTotAmt = recObj.getValue({
                            fieldId: 'custbody_wht_base_amount'
                        });
                        log.debug("Vendor Invoice Amount -->", venTotAmt);

                        //var venTotAmt = 0;
                        var finExmAmount;
                        var finalGrossAmt;



                        //For item Line 

/*                         if (whtCustItemAcc) {
                            var itemLine = recObj.getLineCount({
                                sublistId: 'item'
                            });
                            log.debug('itemLine -->', itemLine);

                            if (itemLine) {
                                for (var c = 0; c < itemLine; c++) {
                                    var currRecItem = recObj.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        line: c
                                    });
                                    log.debug("currRecItem---->", currRecItem);
                                    log.debug("whtCustItemAcc---->", whtCustItemAcc);

                                   

                                    if (currRecItem != whtCustItemAcc) {
                                        var rateVenInv = recObj.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'rate',
                                            line: c
                                        });
                                        var amtVenInv = recObj.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'amount',
                                            line: c
                                        });
                                        venTotAmt = venTotAmt + amtVenInv;

                                    }



                                }
                                log.debug("venTotAmt For Item -->", venTotAmt);
                            }
                        }



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
                                        fieldId: 'category',
                                        line: ex
                                    });
                                    log.debug("currRecExpense---->", currRecExpense);
                                    log.debug("whtCustExpCat---->", whtCustExpCat);

                                    if (currRecExpense != whtCustExpCat) {
                                       
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

                        var venExmTot;

                        log.debug("Search result count --> ", searchResult.length)

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

                            var whtExmRate = searchResult[0].getValue({
                                name: "custrecord_wht_exm_rate",
                                join: "CUSTRECORD_WHT_EXM_PARENT_RECORD"
                            });
                            log.debug("whtExmRate Custom record rate LL->", parseFloat(whtExmRate));




                            //Thoughout Vendor Invoice Calculation

                            log.debug("venId-->299", venId);

                            var throghoutInvAmt;
							
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
                                        summary: "GROUP",
                                        label: "Name"
                                    }),
                                    search.createColumn({
                                        name: "amount",
                                        summary: "SUM",
                                        label: "Amount"
                                    }),
                                    search.createColumn({
                                        name: "fxamount",
                                        summary: "SUM",
                                        label: "Amount (Foreign Currency)"
                                    })
                                ]
                            }); */

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

                                log.debug("throghoutInvAmt Foreign -->", parseFloat(throghoutInvAmt));
                                log.debug("Current Inv Amt 343-->", venTotAmt);

                                var invIndianAmt = searchResultTranAmt[0].getValue({
                                    name: "fxamount",
                                    summary: "SUM",
                                });
                               // log.debug("invIndianAmt-->", invIndianAmt);


                            }
							
							var venInvDateString = recObj.getValue({
								fieldId: 'trandate'
							});
							
							 var venInvDate = format.parse({
								value: venInvDateString,
								type: format.Type.DATE
							});
							log.debug("venInvDate -->", venInvDate); 
                           // log.debug("finExmAmount -->", finExmAmount);


                            //=========================================




                            //||  whtExmToAmt < venTotAmt
                            log.debug("venExmTot Line 348-->", throghoutInvAmt);

                            //40000 > 100000
                            //1000 < 2000
                            //100 < 150 > 200
                            //tot > frAmt && tot < toAmt

                            //150 > 100 && 150 < 200

                            //if (parseFloat(throghoutInvAmt) > parseFloat(whtExmToAmt))
								
							// 115000>5000 && 115000 < 200000
                            if (parseFloat(throghoutInvAmt) >= parseFloat(whtExmFromAmt) && parseFloat(throghoutInvAmt) <= parseFloat(whtExmToAmt)) {



                                if (throghoutInvAmt) {
                                    //venExmTot = parseFloat(throghoutInvAmt) - parseFloat(whtExmToAmt);
                                    venExmTot = parseFloat(throghoutInvAmt) - parseFloat(whtExmFromAmt);
                                    log.debug("venExmTot IF Loop -->", venExmTot);
                                }

                                //venTotAmt



                                //50000 - 150000 = 5000
                                /* log.debug("	wwwwwww-->", formatedFromDate+" "+ venInvDate+" "+ formatedToDate +" "+  venInvDate);
								var today = new Date(venInvDateString);
								var yyyy = today.getFullYear();
								log.debug("yyyy",yyyy);
								var dd = today.getMonth() + 1; // Months start at 0!
								log.debug("dd",dd);
								var mm = today.getDate();
								log.debug("mm",mm);
								var can_date = dd + '/' + mm + '/' + yyyy;
								log.debug("tttttttt",can_date)
								log.debug("Avinash",new Date(can_date));
								
								var today = new Date(formatedFromDate);
								var yyyy = today.getFullYear();
								log.debug("yyyy111",yyyy);
								var dd = today.getMonth() + 1; // Months start at 0!
								log.debug("dd111",dd);
								var mm = today.getDate();
								log.debug("mm111",mm);
								var can_date = dd + '/' + mm + '/' + yyyy;
								log.debug("tttttttt11",can_date)
								log.debug("Avinash1111",new Date(can_date)); */
								
								log.debug("	wwwwwww-->", formatedFromDate+" "+ venInvDate+" "+ formatedToDate +" "+  venInvDate);

                                if (formatedFromDate <= venInvDate && formatedToDate >= venInvDate) 
								{
                                    log.debug("venExmTot Second-->", venExmTot);

                                    //1000 < 2000

                                    if (venTotAmt < venExmTot) {
                                        var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venTotAmt)) / 100;
                                    }


                                    //1000 < 2000
                                    if (venExmTot < venTotAmt) {
                                        var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venExmTot)) / 100;
                                    }




                                    /* if (parseFloat(venTotAmt) < parseFloat(venExmTot)) {
                                        var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venTotAmt)) / 100;
                                    } */

                                    //var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venExmTot)) / 100;


                                    //2000 > 1000
                                    /*  if (parseFloat(venExmTot) < parseFloat(venTotAmt)) {
                                        var wht_fin_per_amt = (parseFloat(whtExmRate) * parseFloat(venExmTot)) / 100;
                                    }
 */
                                    log.debug("WHT Final Amount -->", parseFloat(wht_fin_per_amt));

                                    /*   var total = venTotAmt - wht_fin_per_amt;
                                      log.debug("total -->", total); */

                                    //recObj.setValue('custbody_wht_amount', wht_fin_per_amt);	

                                    //existingItem == whtCustItemAcc

                                    recObj.setValue({
                                        fieldId: 'custbody_wht_amount',
                                        value: parseFloat(wht_fin_per_amt),
                                        ignoreFieldChange: false
                                    });

                                    var currItemRecord;
                                    var currExpenseRecord;

                                    if (whtCustItemAcc) {
                                        var itemLine = recObj.getLineCount({
                                            sublistId: 'item'
                                        });
                                        log.debug('itemLine -->', itemLine);


                                        //For item Line Calculation
                                        if (itemLine) {
                                            for (var i = 0; i < itemLine; i++) {
                                                var currRecItem = recObj.getSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'item',
                                                    line: i
                                                });
                                                log.debug("currRecItem---->", currRecItem);
                                                log.debug("whtCustItemAcc---->", whtCustItemAcc);

                                                if (currRecItem == whtCustItemAcc) {

                                                    currItemRecord = currRecItem;

                                                    wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                                    recObj.selectLine({
                                                        sublistId: 'item',
                                                        line: i
                                                    });
                                                    recObj.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'item',
                                                        value: whtCustItemAcc
                                                    });
                                                    recObj.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'quantity',
                                                        value: 1
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


                                            if (currItemRecord != whtCustItemAcc) {
                                                if (whtCustItemAcc && wht_fin_per_amt) {
                                                    wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                                    recObj.selectNewLine({
                                                        sublistId: 'item'
                                                    });
                                                    recObj.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'item',
                                                        value: whtCustItemAcc
                                                    });
                                                    recObj.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'quantity',
                                                        value: 1
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

                                        }
                                    }
                                    //=========================================

                                    //For expense Line Calculation
                                    if (whtCustExpCat) {
                                        var expenseLine = recObj.getLineCount({
                                            sublistId: 'expense'
                                        });
                                        log.debug('expenseLine -->', expenseLine);

                                        var currRecExp;
                                        var orgExpenseLine;

                                        if (expenseLine) {
                                            for (var e = 0; e < expenseLine; e++) {
                                                currRecExp = recObj.getSublistValue({
                                                    sublistId: 'expense',
                                                    fieldId: 'category',
                                                    line: e
                                                });
                                                log.debug("currRecExp---->", currRecExp);
                                                log.debug("whtCustExpCat---->", whtCustExpCat);

                                                orgExpenseLine = recObj.getSublistValue({
                                                    sublistId: 'expense',
                                                    fieldId: 'location',
                                                    line: e
                                                });
                                                log.debug("orgExpenseLine---->", orgExpenseLine);

                                                if (currRecExp == whtCustExpCat) {

                                                    currExpenseRecord = currRecExp;

                                                    wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                                    recObj.selectLine({
                                                        sublistId: 'expense',
                                                        line: e
                                                    });
                                                    /*   recObj.setCurrentSublistValue({
                                                          sublistId: 'expense',
                                                          fieldId: 'account',
                                                          value: whtCustItemAcc
                                                      }); */

                                                    recObj.setCurrentSublistValue({
                                                        sublistId: 'expense',
                                                        fieldId: 'category',
                                                        value: whtCustExpCat
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


                                            if (currExpenseRecord != whtCustExpCat) {
                                                if (whtCustExpCat && wht_fin_per_amt) {
                                                    wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                                    recObj.selectNewLine({
                                                        sublistId: 'expense'
                                                    });
                                                    /* recObj.setCurrentSublistValue({
                                                        sublistId: 'expense',
                                                        fieldId: 'account',
                                                        value: whtCustItemAcc
                                                    }); */

                                                    recObj.setCurrentSublistValue({
                                                        sublistId: 'expense',
                                                        fieldId: 'category',
                                                        value: whtCustExpCat
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
                                            //}
                                        }
                                    }
                                    //==============================================



                                    // }

                                }

                            } else if (parseFloat(throghoutInvAmt) >= parseFloat(whtExmToAmt)){

                            //=========Start After Slab exemption Amount=========
								
							log.debug("After Slab exemption TO Amount");
							log.debug("966 Ven Inv Amt", venTotAmt);
                            log.debug("967 whtCustRecRate", whtCustRecRate);
                            var wht_fin_per_amt = (whtCustRecRate * parseFloat(venTotAmt)) / 100;

                            log.debug("970 WHT Final Amount -->", parseFloat(wht_fin_per_amt));

                            var total = parseFloat(venTotAmt) - parseFloat(wht_fin_per_amt);
                            log.debug("total -->total -->", total);

                            //recObj.setValue('custbody_wht_amount', wht_fin_per_amt);	

                            //existingItem == whtCustItemAcc

                            recObj.setValue({
                                fieldId: 'custbody_wht_amount',
                                value: parseFloat(wht_fin_per_amt),
                                ignoreFieldChange: false
                            });

                            var currItemRecord;
                            var currExpenseRecord;

                            if (whtCustItemAcc) {

                                var itemLine = recObj.getLineCount({
                                    sublistId: 'item'
                                });
                                log.debug('itemLine -->', itemLine);


                                //For item Line

                                if (itemLine) {

                                    for (var i = 0; i < itemLine; i++) {
                                        var currRecItem = recObj.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'item',
                                            line: i
                                        });
                                        log.debug("currRecItem---->", currRecItem);
                                        log.debug("whtCustItemAcc---->", whtCustItemAcc);

                                        if (currRecItem == whtCustItemAcc) {

                                            currItemRecord = currRecItem;

                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                            recObj.selectLine({
                                                sublistId: 'item',
                                                line: i
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: whtCustItemAcc
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                value: 1
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

                                        /* log.debug("line 1022 finalGrossAmt-->", finalGrossAmt);
                                        if(finalGrossAmt){
                                        		recObj.setCurrentSublistValue({
                                        		sublistId: 'item',
                                        		fieldId: 'amount',
                                        		value: parseFloat(finalGrossAmt),
                                        		ignoreFieldChange: true,
                                        		forceSyncSourcing: true
                                        		});
                                        	} */

                                    }


                                    if (currItemRecord != whtCustItemAcc) {
                                        if (whtCustItemAcc && wht_fin_per_amt) {
                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                            recObj.selectNewLine({
                                                sublistId: 'item'
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: whtCustItemAcc
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                value: 1
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

                                    /* log.debug("Line 1069 finalGrossAmt-->",finalGrossAmt);
                                    if(finalGrossAmt){
                                    			recObj.setCurrentSublistValue({
                                    			sublistId: 'item',
                                    			fieldId: 'amount',
                                    			value: parseFloat(finalGrossAmt),
                                    			ignoreFieldChange: true,
                                    			forceSyncSourcing: true
                                    			});
                                    		} */
                                }
                            }

                            //For Expense Line

                            if (whtCustExpCat) {
                                var expenseLineInvCal = recObj.getLineCount({
                                    sublistId: 'expense'
                                });
                                log.debug('expenseLineInvCal -->', expenseLineInvCal);

                                var currRecExp;
                                var orgExpenseLine;


                                if (expenseLineInvCal) {

                                    for (var el = 0; el < expenseLineInvCal; el++) {
                                        currRecExp = recObj.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'category',
                                            line: el
                                        });
                                        log.debug("currRecExp---->", currRecExp);
                                        log.debug("whtCustExpCat---->", whtCustExpCat);

                                        orgExpenseLine = recObj.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'location',
                                            line: el
                                        });
                                        log.debug("orgExpenseLine---->", orgExpenseLine);

                                        if (currRecExp == whtCustExpCat) {

                                            currExpenseRecord = currRecExp;

                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                            recObj.selectLine({
                                                sublistId: 'expense',
                                                line: el
                                            });
                                            /*   recObj.setCurrentSublistValue({
                                                  sublistId: 'expense',
                                                  fieldId: 'account',
                                                  value: whtCustItemAcc
                                              }); */

                                            recObj.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'category',
                                                value: whtCustExpCat
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


                                    if (currExpenseRecord != whtCustExpCat) {
                                        if (whtCustExpCat && wht_fin_per_amt) {
                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                            recObj.selectNewLine({
                                                sublistId: 'expense'
                                            });
                                            /* recObj.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'account',
                                                value: whtCustItemAcc
                                            }); */

                                            recObj.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'category',
                                                value: whtCustExpCat
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
                                    // }	
                                }
                            }
						
                                //=========End After Slab exemption Amount===========




                            }else{
								log.debug("Not Applicable for WHT");
							} //Not exemption vendor code
							
							//	Inv Date - > 17/01/2023
							//  whtCustFromDate - 01/01/2023 <= 17/01/2023 && 01/01/2099 >= 17/01/2023
							
                        }else if (whtCustFromDate <= venInvDate && whtCustToDate >= venInvDate) {
							//{
							
							
							
							
							
                            log.debug("Normal WHT");
                            var wht_fin_per_amt = (whtCustRecRate * parseFloat(venTotAmt)) / 100;

                            log.debug("WHT Final Amount -->", parseFloat(wht_fin_per_amt));

                            var total = parseFloat(venTotAmt) - parseFloat(wht_fin_per_amt);
                            log.debug("total -->total -->", total);

                            //recObj.setValue('custbody_wht_amount', wht_fin_per_amt);	

                            //existingItem == whtCustItemAcc

                            recObj.setValue({
                                fieldId: 'custbody_wht_amount',
                                value: parseFloat(wht_fin_per_amt),
                                ignoreFieldChange: false
                            });

                            var currItemRecord;
                            var currExpenseRecord;

                            if (whtCustItemAcc) {

                                var itemLine = recObj.getLineCount({
                                    sublistId: 'item'
                                });
                                log.debug('itemLine -->', itemLine);


                                //For item Line

                                if (itemLine) {

                                    for (var i = 0; i < itemLine; i++) {
                                        var currRecItem = recObj.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'item',
                                            line: i
                                        });
                                        log.debug("currRecItem---->", currRecItem);
                                        log.debug("whtCustItemAcc---->", whtCustItemAcc);

                                        if (currRecItem == whtCustItemAcc) {

                                            currItemRecord = currRecItem;

                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                            recObj.selectLine({
                                                sublistId: 'item',
                                                line: i
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: whtCustItemAcc
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                value: 1
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

                                        /* log.debug("line 1022 finalGrossAmt-->", finalGrossAmt);
                                        if(finalGrossAmt){
                                        		recObj.setCurrentSublistValue({
                                        		sublistId: 'item',
                                        		fieldId: 'amount',
                                        		value: parseFloat(finalGrossAmt),
                                        		ignoreFieldChange: true,
                                        		forceSyncSourcing: true
                                        		});
                                        	} */

                                    }


                                    if (currItemRecord != whtCustItemAcc) {
                                        if (whtCustItemAcc && wht_fin_per_amt) {
                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                            recObj.selectNewLine({
                                                sublistId: 'item'
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: whtCustItemAcc
                                            });
                                            recObj.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                value: 1
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

                                    /* log.debug("Line 1069 finalGrossAmt-->",finalGrossAmt);
                                    if(finalGrossAmt){
                                    			recObj.setCurrentSublistValue({
                                    			sublistId: 'item',
                                    			fieldId: 'amount',
                                    			value: parseFloat(finalGrossAmt),
                                    			ignoreFieldChange: true,
                                    			forceSyncSourcing: true
                                    			});
                                    		} */
                                }
                            }

                            //For Expense Line

                            if (whtCustExpCat) {
                                var expenseLineInvCal = recObj.getLineCount({
                                    sublistId: 'expense'
                                });
                                log.debug('expenseLineInvCal -->', expenseLineInvCal);

                                var currRecExp;
                                var orgExpenseLine;


                                if (expenseLineInvCal) {

                                    for (var el = 0; el < expenseLineInvCal; el++) {
                                        currRecExp = recObj.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'category',
                                            line: el
                                        });
                                        log.debug("currRecExp---->", currRecExp);
                                        log.debug("whtCustExpCat---->", whtCustExpCat);

                                        orgExpenseLine = recObj.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'location',
                                            line: el
                                        });
                                        log.debug("orgExpenseLine---->", orgExpenseLine);

                                        if (currRecExp == whtCustExpCat) {

                                            currExpenseRecord = currRecExp;

                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);
                                            recObj.selectLine({
                                                sublistId: 'expense',
                                                line: el
                                            });
                                            /*   recObj.setCurrentSublistValue({
                                                  sublistId: 'expense',
                                                  fieldId: 'account',
                                                  value: whtCustItemAcc
                                              }); */

                                            recObj.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'category',
                                                value: whtCustExpCat
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


                                    if (currExpenseRecord != whtCustExpCat) {
                                        if (whtCustExpCat && wht_fin_per_amt) {
                                            wht_fin_per_amt = parseFloat(wht_fin_per_amt) * parseFloat(-1);

                                            recObj.selectNewLine({
                                                sublistId: 'expense'
                                            });
                                            /* recObj.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'account',
                                                value: whtCustItemAcc
                                            }); */

                                            recObj.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'category',
                                                value: whtCustExpCat
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
                                    // }	
                                }
                            }



                        } else {
							
							log.debug("whtCustFromDate 1207-->", whtCustFromDate);
							log.debug("whtCustToDate 1208-->", whtCustToDate);
							
							log.debug("venInvDate 1210-->", venInvDate);
							
                            log.debug("Not Eligible for WHT")
                        } 


                        //===========================================


                    }
                }
                var venBill = recObj.save();
                log.debug("venBill Saved", venBill);
            } catch (e) {
                log.debug("Error-->", e);
            }
            // }
        }
        return {
            afterSubmit: afterSubmit
        }
    });