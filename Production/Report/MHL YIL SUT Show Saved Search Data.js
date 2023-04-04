//Backup // Production

//Show the customer record & Create Sublist for Pending Customer Record List
// Customer Record List
// Testing - 11100001 Harpreet S Singh
// Testing - 4870018 Eagy Loyid
/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL SUT Show Saved Search Data
 * File Name: MHL YIL SUT Show Saved Search Data.js
 * Created On: 16/09/2022
 * Modified On: 
 * Created By: Sunil Khutwad (Yantra Inc.)
 * Modified By: 
 * Description: Show employee ladger report
 *************************************************************/
 
 
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/log', 'N/format', 'N/record', 'N/search', 'N/redirect', 'N/url', 'N/runtime', 'N/file'],

    function(serverWidget, log, format, record, search, redirect, url, runtime, file) {

        function onRequest(scriptContext) {
            try {
                if (scriptContext.request.method === 'GET') {
                    var form = serverWidget.createForm({
                        title: 'Employee Record'
                    });

                    var selectEmp = form.addField({
                        id: 'e_employee',
                        type: serverWidget.FieldType.MULTISELECT,
                        label: 'Employee',
                        source: 'employee'
                    });

                    selectEmp.isMandatory = true;

                    var fromDate = form.addField({
                        id: 'e_fromdate',
                        type: serverWidget.FieldType.DATE,
                        label: 'From Date'
                    });

                    var toDate = form.addField({
                        id: 'e_todate',
                        type: serverWidget.FieldType.DATE,
                        label: 'To Date'
                    });

                    form.addSubmitButton({
                        label: 'Submit'
                    });

                    scriptContext.response.writePage(form);
                } else {

                    var cntt = 0;

                    //var a_filters = new Array();

                    var request = scriptContext.request;
                    var empId = request.parameters.e_employee;
                    empId = empId.split("\u0005");
                    log.debug("Employee Name ---->", empId);

                    var from_date = request.parameters.e_fromdate;
                    log.audit("From Date -->", from_date);
                    var to_date = request.parameters.e_todate;
                    log.audit("To Date -->", to_date);



                    // var e_filter = a_filters.push(
                    //     search.createFilter({
                    //         name: 'subsidiary',
                    //         operator: search.Operator.ANYOF,
                    //         values: empId
                    //     })
                    // );
                    // log.debug("Emp Filter ---->", e_filter);

                    var form = serverWidget.createForm({
                        title: 'Employee Ledger Transaction'
                    });


                    var sublist = form.addSublist({
                        id: 'custsublistid',
                        type: serverWidget.SublistType.LIST,
                        label: 'Employee Ledger Transaction List'
                    });

                    sublist.addField({
                        id: 'e_id',
                        type: serverWidget.FieldType.TEXT,
                        label: 'ID'
                    });

                    sublist.addField({
                        id: 'e_name',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Name'
                    });

                    // sublist.addField({ id: 'e_fname', type: serverWidget.FieldType.TEXT, label: 'First Name' });

                    sublist.addField({
                        id: 'e_trandate',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Transaction Date'
                    });

                    sublist.addField({
                        id: 'e_trantype',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Transaction Type'
                    });

                    sublist.addField({
                        id: 'e_trannumer',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Transaction Number'
                    });

                    sublist.addField({
                        id: 'e_docnumber',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Document Number'
                    });

                    sublist.addField({
                        id: 'e_transumamt',
                        type: serverWidget.FieldType.TEXT,
                        label: 'SUM OF AMOUNT'
                    });

                    sublist.addField({
                        id: 'e_amtrem',
                        type: serverWidget.FieldType.TEXT,
                        label: 'SUM OF AMOUNT Remaining'
                    });

                    sublist.addField({
                        id: 'e_tranamtforcur',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Transaction Amount(Foreign currency)'
                    });
                    sublist.addField({
                        id: 'e_tranamtforcurrem',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Transaction Amount(Foreign currency) Remaining'
                    });

                    sublist.addField({
                        id: 'e_transtatus',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Status'
                    });

                    //sublist.addField({ id: 'e_traamtremforcurr', type: serverWidget.FieldType.TEXT, label: 'Transaction Amount Remaining (Foreign Currency)' });

                    sublist.addField({
                        id: 'e_trandaysopen',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Days Open'
                    });

                    sublist.addField({
                        id: 'e_tranorg',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Org'
                    });

                    sublist.addField({
                        id: 'e_transbu',
                        type: serverWidget.FieldType.TEXT,
                        label: 'SBU'
                    });

                    sublist.addField({
                        id: 'e_totalsumofammount',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Total Sumof ammount'
                    });


                    //sublist.addField({ id: 'e_tranamount', type: serverWidget.FieldType.TEXT, label: 'Sum oF Amount Remaining' });
                    var total = 0;
                    var amtRem = 0;
                    log.debug("empId.length", empId.length);

                    if (from_date && to_date) {
                        var transactionSearchObj = search.create({
                            type: "transaction",
                            filters: [
                                ["type", "anyof", "VendPymt", "Custom154", "ExpRept", "Custom153"],
                                "AND",
                                ["employee", "anyof", empId],
                                "AND",
                                ["mainline", "is", "T"],
                                "AND",
                                ["trandate", "within", from_date, to_date]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "entityid",
                                    join: "employee",
                                    summary: "GROUP",
                                    label: "ID"
                                }),
                                search.createColumn({
                                    name: "entity",
                                    summary: "GROUP",
                                    label: "Name"
                                }),
                                search.createColumn({
                                    name: "trandate",
                                    summary: "GROUP",
                                    label: "Date"
                                }),
                                search.createColumn({
                                    name: "type",
                                    summary: "GROUP",
                                    label: "Type"
                                }),
                                search.createColumn({
                                    name: "transactionnumber",
                                    summary: "GROUP",
                                    label: "Transaction Number"
                                }),
                                search.createColumn({
                                    name: "tranid",
                                    summary: "GROUP",
                                    label: "Document Number"
                                }),
                                search.createColumn({
                                    name: "amount",
                                    summary: "SUM",
                                    label: "Amount"
                                }),
                                search.createColumn({
                                    name: "fxamount",
                                    summary: "MAX",
                                    label: "Amount (Foreign Currency)"
                                }),
                                search.createColumn({
                                    name: "statusref",
                                    summary: "GROUP",
                                    label: "Status"
                                }),
                                search.createColumn({
                                    name: "fxamountremaining",
                                    summary: "MAX",
                                    label: "Amount Remaining (Foreign Currency)"
                                }),
                                search.createColumn({
                                    name: "location",
                                    summary: "GROUP",
                                    label: "Org"
                                }),
                                search.createColumn({
                                    name: "class",
                                    summary: "GROUP",
                                    label: "SBU"
                                }),
                                search.createColumn({
                                    name: "daysopen",
                                    summary: "GROUP",
                                    label: "Days Open"
                                }),
                                search.createColumn({
                                    name: "location",
                                    summary: "GROUP",
                                    label: "Org"
                                }),
                                search.createColumn({
                                    name: "class",
                                    summary: "GROUP",
                                    label: "SBU"
                                }),
                                search.createColumn({
                                    name: "amountremaining",
                                    summary: "SUM",
                                    label: "Amount Remaining"
                                }),
                                search.createColumn({
                                    name: "fxamountremaining",
                                    summary: "MAX",
                                    label: "Amount Remaining (Foreign Currency)"
                                })
                            ]
                        });
                    } else {
                        var transactionSearchObj = search.create({
                            type: "transaction",
                            filters: [
                                ["type", "anyof", "VendPymt", "Custom154", "ExpRept", "Custom153"],
                                "AND",
                                ["employee", "anyof", empId],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "entityid",
                                    join: "employee",
                                    summary: "GROUP",
                                    label: "ID"
                                }),
                                search.createColumn({
                                    name: "entity",
                                    summary: "GROUP",
                                    label: "Name"
                                }),
                                search.createColumn({
                                    name: "trandate",
                                    summary: "GROUP",
                                    label: "Date"
                                }),
                                search.createColumn({
                                    name: "type",
                                    summary: "GROUP",
                                    label: "Type"
                                }),
                                search.createColumn({
                                    name: "transactionnumber",
                                    summary: "GROUP",
                                    label: "Transaction Number"
                                }),
                                search.createColumn({
                                    name: "tranid",
                                    summary: "GROUP",
                                    label: "Document Number"
                                }),
                                search.createColumn({
                                    name: "amount",
                                    summary: "SUM",
                                    label: "Amount"
                                }),
                                search.createColumn({
                                    name: "fxamount",
                                    summary: "MAX",
                                    label: "Amount (Foreign Currency)"
                                }),
                                search.createColumn({
                                    name: "statusref",
                                    summary: "GROUP",
                                    label: "Status"
                                }),
                                search.createColumn({
                                    name: "fxamountremaining",
                                    summary: "MAX",
                                    label: "Amount Remaining (Foreign Currency)"
                                }),
                                search.createColumn({
                                    name: "location",
                                    summary: "GROUP",
                                    label: "Org"
                                }),
                                search.createColumn({
                                    name: "class",
                                    summary: "GROUP",
                                    label: "SBU"
                                }),
                                search.createColumn({
                                    name: "daysopen",
                                    summary: "GROUP",
                                    label: "Days Open"
                                }),
                                search.createColumn({
                                    name: "location",
                                    summary: "GROUP",
                                    label: "Org"
                                }),
                                search.createColumn({
                                    name: "class",
                                    summary: "GROUP",
                                    label: "SBU"
                                }),
                                search.createColumn({
                                    name: "amountremaining",
                                    summary: "SUM",
                                    label: "Amount Remaining"
                                }),
                                search.createColumn({
                                    name: "fxamountremaining",
                                    summary: "MAX",
                                    label: "Amount Remaining (Foreign Currency)"
                                })
                            ]
                        });
                    }
                    var searchResultCount = transactionSearchObj.runPaged().count;
                    log.debug("transactionSearchObj result count 1st -->", searchResultCount);
                    transactionSearchObj.run().each(function(result) {
                        // .run().each has a limit of 4,000 results

                        var entity_id = result.getValue({
                            name: "entityid",
                            join: "employee",
                            summary: "GROUP",
                            label: "ID"
                        });
                        log.debug("Entity ID 1st -->", entity_id);

                        var eName = result.getText({
                            name: "entity",
                            summary: "GROUP",
                            label: "Name"
                        });
                        //  log.debug("Entity Name -->", eName);

                        var transactionDate = result.getValue({
                            name: "trandate",
                            summary: "GROUP",
                            label: "Date"
                        });
                        // log.debug("Date -->", transactionDate);

                        var eType = result.getText({
                            name: "type",
                            summary: "GROUP",
                            label: "Type"
                        });
                        //  log.debug("Type -->", eType);

                        var tranNumber = result.getValue({
                            name: "transactionnumber",
                            summary: "GROUP",
                            label: "Transaction Number"
                        });
                        //  log.debug("Transaction Number -->", tranNumber);

                        var docNumber = result.getValue({
                            name: "tranid",
                            summary: "GROUP",
                            label: "Document Number"
                        });
                        //  log.debug("Document Number -->", docNumber);

                        var sumAmount = result.getValue({
                            name: "amount",
                            summary: "SUM",
                            label: "Amount"
                        });
                        //   log.debug("Sum of Amount -->", sumAmount);

                        total += parseInt(sumAmount);


                        var sumAmountRemaining = result.getValue({
                            name: "amountremaining",
                            summary: "SUM",
                            label: "Amount Remaining"
                        });
                        log.debug("sumAmountRemaining -->", sumAmountRemaining);

                        if (sumAmountRemaining > 0) {
                            amtRem += parseInt(sumAmountRemaining);
                        }

                        log.audit("Amt Remaining inside loop  -->", amtRem);

                        var amountForCurr = result.getValue({
                            name: "fxamount",
                            summary: "MAX",
                            label: "Amount (Foreign Currency)"
                        });
                        // log.debug("Foreign Currency Amount -->", amountForCurr);

                        var amountForCurrRemaining = result.getValue({
                            name: "fxamountremaining",
                            summary: "MAX",
                            label: "Amount Remaining (Foreign Currency)"
                        });
                        //  log.debug("amountForCurrRemaining -->", amountForCurrRemaining);



                        var tranStatus = result.getText({
                            name: "statusref",
                            summary: "GROUP",
                            label: "Status"
                        });
                        // log.debug("Status -->", tranStatus);

                        // var tranAmtRemForCurr = result.getValue({ name: "fxamountremaining", summary: "MAX", label: "Amount Remaining (Foreign Currency)" });
                        // log.debug("Amount Remaining (Foreign Currency) -->", tranAmtRemForCurr);

                        var orgLocation = result.getText({
                            name: "location",
                            summary: "GROUP",
                            label: "Org"
                        });
                        //  log.debug("Org -->", orgLocation);

                        var empSbu = result.getText({
                            name: "class",
                            summary: "GROUP",
                            label: "SBU"
                        });
                        //  log.debug("SBU -->", empSbu);

                        var daysOpen = result.getValue({
                            name: "daysopen",
                            summary: "GROUP",
                            label: "Days Open"
                        });
                        // log.debug("Days Open -->", daysOpen);

                        // var sumOfAmtRem = result.getValue({ name: "amountremaining", summary: "SUM", label: "Amount Remaining" });
                        // log.debug("Amount Remaining -->", sumOfAmtRem);

                        //Set Sublist Id

                        sublist.setSublistValue({
                            id: 'e_id',
                            line: cntt,
                            value: entity_id
                        });

                        sublist.setSublistValue({
                            id: 'e_name',
                            line: cntt,
                            value: eName
                        });

                        sublist.setSublistValue({
                            id: 'e_trandate',
                            line: cntt,
                            value: transactionDate
                        });

                        sublist.setSublistValue({
                            id: 'e_trantype',
                            line: cntt,
                            value: eType
                        });

                        sublist.setSublistValue({
                            id: 'e_trannumer',
                            line: cntt,
                            value: tranNumber
                        });

                        sublist.setSublistValue({
                            id: 'e_docnumber',
                            line: cntt,
                            value: docNumber
                        });

                        sublist.setSublistValue({
                            id: 'e_transumamt',
                            line: cntt,
                            value: sumAmount
                        });

                        sublist.setSublistValue({
                            id: 'e_tranamtforcur',
                            line: cntt,
                            value: amountForCurr
                        });

                        sublist.setSublistValue({
                            id: 'e_transtatus',
                            line: cntt,
                            value: tranStatus
                        });

                        // sublist.setSublistValue({ id: 'e_traamtremforcurr', line: cntt, value: tranAmtRemForCurr });

                        sublist.setSublistValue({
                            id: 'e_tranorg',
                            line: cntt,
                            value: orgLocation
                        });

                        sublist.setSublistValue({
                            id: 'e_transbu',
                            line: cntt,
                            value: empSbu
                        });

                        sublist.setSublistValue({
                            id: 'e_trandaysopen',
                            line: cntt,
                            value: daysOpen
                        });
                        if (amountForCurrRemaining > 0) {
                            sublist.setSublistValue({
                                id: 'e_amtrem',
                                line: cntt,
                                value: sumAmountRemaining
                            });
                        }
                        if (amountForCurrRemaining > 0) {
                            sublist.setSublistValue({
                                id: 'e_tranamtforcurrem',
                                line: cntt,
                                value: amountForCurrRemaining
                            });
                        }

                        //sublist.setSublistValue({ id: 'e_tranamount', line: cntt, value: sumOfAmtRem });




                        cntt++;

                        return true;
                    });

                    log.debug("total -->", total);
                    log.debug("Amt Remaining outside loop  -->", amtRem);
                    log.debug("empId 2nd -->", empId);

                    if (from_date && to_date) {

                        var transactionSearchObj = search.create({
                            type: "transaction",
                            filters: [
                                ["type", "anyof", "Custom154", "Journal", "Custom153"],
                                "AND",
                                ["name", "anyof", empId],
                                "AND",
                                ["mainline", "is", "T"],
                                "AND",
                                ["trandate", "within", from_date, to_date]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "entityid",
                                    join: "employee",
                                    summary: "GROUP",
                                    label: "ID"
                                }),
                                search.createColumn({
                                    name: "entity",
                                    summary: "GROUP",
                                    label: "Name"
                                }),
                                search.createColumn({
                                    name: "trandate",
                                    summary: "GROUP",
                                    label: "Date"
                                }),
                                search.createColumn({
                                    name: "type",
                                    summary: "GROUP",
                                    label: "Type"
                                }),
                                search.createColumn({
                                    name: "transactionnumber",
                                    summary: "GROUP",
                                    label: "Transaction Number"
                                }),
                                search.createColumn({
                                    name: "tranid",
                                    summary: "GROUP",
                                    label: "Document Number"
                                }),
                                search.createColumn({
                                    name: "amount",
                                    summary: "SUM",
                                    label: "Amount"
                                }),
                                search.createColumn({
                                    name: "amountremaining",
                                    summary: "SUM",
                                    label: "Amount Remaining"
                                }),
                                search.createColumn({
                                    name: "fxamount",
                                    summary: "MAX",
                                    label: "Amount (Foreign Currency)"
                                }),
                                search.createColumn({
                                    name: "fxamountremaining",
                                    summary: "MAX",
                                    label: "Amount Remaining (Foreign Currency)"
                                }),
                                search.createColumn({
                                    name: "statusref",
                                    summary: "GROUP",
                                    label: "Status"
                                }),
                                search.createColumn({
                                    name: "location",
                                    summary: "GROUP",
                                    label: "Org"
                                }),
                                search.createColumn({
                                    name: "class",
                                    summary: "GROUP",
                                    label: "SBU"
                                }),
                                search.createColumn({
                                    name: "daysopen",
                                    summary: "GROUP",
                                    label: "Days Open"
                                })
                            ]
                        });
                    } else {

                        var transactionSearchObj = search.create({
                            type: "transaction",
                            filters: [
                                ["type", "anyof", "Custom154", "Journal", "Custom153"],
                                "AND",
                                ["name", "anyof", empId]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "entityid",
                                    join: "employee",
                                    summary: "GROUP",
                                    label: "ID"
                                }),
                                search.createColumn({
                                    name: "entity",
                                    summary: "GROUP",
                                    label: "Name"
                                }),
                                search.createColumn({
                                    name: "trandate",
                                    summary: "GROUP",
                                    label: "Date"
                                }),
                                search.createColumn({
                                    name: "type",
                                    summary: "GROUP",
                                    label: "Type"
                                }),
                                search.createColumn({
                                    name: "transactionnumber",
                                    summary: "GROUP",
                                    label: "Transaction Number"
                                }),
                                search.createColumn({
                                    name: "tranid",
                                    summary: "GROUP",
                                    label: "Document Number"
                                }),
                                search.createColumn({
                                    name: "amount",
                                    summary: "SUM",
                                    label: "Amount"
                                }),
                                search.createColumn({
                                    name: "amountremaining",
                                    summary: "SUM",
                                    label: "Amount Remaining"
                                }),
                                search.createColumn({
                                    name: "fxamount",
                                    summary: "MAX",
                                    label: "Amount (Foreign Currency)"
                                }),
                                search.createColumn({
                                    name: "fxamountremaining",
                                    summary: "MAX",
                                    label: "Amount Remaining (Foreign Currency)"
                                }),
                                search.createColumn({
                                    name: "statusref",
                                    summary: "GROUP",
                                    label: "Status"
                                }),
                                search.createColumn({
                                    name: "location",
                                    summary: "GROUP",
                                    label: "Org"
                                }),
                                search.createColumn({
                                    name: "class",
                                    summary: "GROUP",
                                    label: "SBU"
                                }),
                                search.createColumn({
                                    name: "daysopen",
                                    summary: "GROUP",
                                    label: "Days Open"
                                })
                            ]
                        });
                    }
                    var searchResultCount = transactionSearchObj.runPaged().count;
                    log.debug("transactionSearchObj result count 2nd -->", searchResultCount);
                    transactionSearchObj.run().each(function(result) {
                        // .run().each has a limit of 4,000 results

                        var entity_id = result.getValue({
                            name: "entityid",
                            join: "employee",
                            summary: "GROUP",
                            label: "ID"
                        });
                        log.debug("Entity ID 2nd -->", entity_id);

                        var eName = result.getText({
                            name: "entity",
                            summary: "GROUP",
                            label: "Name"
                        });
                        log.debug("Entity Name 2nd -->", eName);

                        var transactionDate = result.getValue({
                            name: "trandate",
                            summary: "GROUP",
                            label: "Date"
                        });
                        log.debug("Date 2nd -->", transactionDate);

                        var eType = result.getText({
                            name: "type",
                            summary: "GROUP",
                            label: "Type"
                        });
                        log.debug("Type 2nd -->", eType);

                        var tranNumber = result.getValue({
                            name: "transactionnumber",
                            summary: "GROUP",
                            label: "Transaction Number"
                        });
                        log.debug("Transaction Number 2nd -->", tranNumber);

                        var docNumber = result.getValue({
                            name: "tranid",
                            summary: "GROUP",
                            label: "Document Number"
                        });
                        log.debug("Document Number 2nd -->", docNumber);

                        var sumAmount = result.getValue({
                            name: "amount",
                            summary: "SUM",
                            label: "Amount"
                        });
                        // log.debug("Sum of Amount -->", sumAmount);

                        total += parseInt(sumAmount);

						log.debug("total 841",total);

                        var sumAmountRemaining = result.getValue({
                            name: "amountremaining",
                            summary: "SUM",
                            label: "Amount Remaining"
                        });
                        //log.debug("sumAmountRemaining -->", sumAmountRemaining);

                        if (sumAmountRemaining > 0) {
                            amtRem += parseInt(sumAmountRemaining);
                        }


                        var amountForCurr = result.getValue({
                            name: "fxamount",
                            summary: "MAX",
                            label: "Amount (Foreign Currency)"
                        });
                        // log.debug("Foreign Currency Amount -->", amountForCurr);

                        var amountForCurrRemaining = result.getValue({
                            name: "fxamountremaining",
                            summary: "MAX",
                            label: "Amount Remaining (Foreign Currency)"
                        });
                        // log.debug("amountForCurrRemaining -->", amountForCurrRemaining);



                        var tranStatus = result.getText({
                            name: "statusref",
                            summary: "GROUP",
                            label: "Status"
                        });
                        log.debug("Status -->", tranStatus);

                        // var tranAmtRemForCurr = result.getValue({ name: "fxamountremaining", summary: "MAX", label: "Amount Remaining (Foreign Currency)" });
                        // log.debug("Amount Remaining (Foreign Currency) -->", tranAmtRemForCurr);

                        var orgLocation = result.getText({
                            name: "location",
                            summary: "GROUP",
                            label: "Org"
                        });
                        // log.debug("Org -->", orgLocation);

                        var empSbu = result.getText({
                            name: "class",
                            summary: "GROUP",
                            label: "SBU"
                        });
                        // log.debug("SBU -->", empSbu);

                        var daysOpen = result.getValue({
                            name: "daysopen",
                            summary: "GROUP",
                            label: "Days Open"
                        });
                        // log.debug("Days Open -->", daysOpen);


                        sublist.setSublistValue({
                            id: 'e_id',
                            line: cntt,
                            value: eName
                        });

                        sublist.setSublistValue({
                            id: 'e_name',
                            line: cntt,
                            value: eName
                        });

                        sublist.setSublistValue({
                            id: 'e_trandate',
                            line: cntt,
                            value: transactionDate
                        });

                        sublist.setSublistValue({
                            id: 'e_trantype',
                            line: cntt,
                            value: eType
                        });

                        sublist.setSublistValue({
                            id: 'e_trannumer',
                            line: cntt,
                            value: tranNumber
                        });

                        sublist.setSublistValue({
                            id: 'e_docnumber',
                            line: cntt,
                            value: docNumber
                        });

                        sublist.setSublistValue({
                            id: 'e_transumamt',
                            line: cntt,
                            value: sumAmount
                        });

                        sublist.setSublistValue({
                            id: 'e_tranamtforcur',
                            line: cntt,
                            value: amountForCurr
                        });

                        sublist.setSublistValue({
                            id: 'e_transtatus',
                            line: cntt,
                            value: tranStatus
                        });

                        // sublist.setSublistValue({ id: 'e_traamtremforcurr', line: cntt, value: tranAmtRemForCurr });

                        sublist.setSublistValue({
                            id: 'e_tranorg',
                            line: cntt,
                            value: orgLocation
                        });

                        sublist.setSublistValue({
                            id: 'e_transbu',
                            line: cntt,
                            value: empSbu
                        });

                        //sublist.setSublistValue({ id: 'e_trandaysopen', line: cntt, value: daysOpen });
                        if (sumAmountRemaining > 0) {
                            sublist.setSublistValue({
                                id: 'e_amtrem',
                                line: cntt,
                                value: sumAmountRemaining
                            });
                        }
                        if (amountForCurrRemaining > 0) {
                            sublist.setSublistValue({
                                id: 'e_tranamtforcurrem',
                                line: cntt,
                                value: amountForCurrRemaining
                            });
                        }
                        cntt++;
                        return true;
                    });

                    log.debug("total 2nd -->", amtRem);
                    sublist.setSublistValue({
                        id: 'e_id',
                        line: cntt,
                        value: 'Total'
                    });

					if(total){
						sublist.setSublistValue({
							id: 'e_transumamt',
							line: cntt,
							value: total
						});
					}

                    if (amtRem) {
                        sublist.setSublistValue({
                            id: 'e_amtrem',
                            line: cntt,
                            value: amtRem
                        });
                    }


                    scriptContext.response.writePage(form);
                }

            } catch (e) {
                log.debug('Error ', e);
            }
        }
        return {
            onRequest: onRequest
        };
    });
