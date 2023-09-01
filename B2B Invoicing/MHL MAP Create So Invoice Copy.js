/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL MAP Create So Invoice Copy
 * File Name: MHL MAP Create So Invoice Copy.js
 * Created On: 15/12/2022
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: MHL MAP Create So Invoice Copy
 *********************************************************** */

define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', 'N/task', 'N/email'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function(file, format, record, search, runtime, task, email) {

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */

        var file_id;
        var s_file_data = '';
        var n_totalSO_count = 0;

        function getInputData() {

            try {

                var o_context = runtime.getCurrentScript();
                var start_date = o_context.getParameter({
                    name: 'custscript_start_date_inv'
                });
                log.debug('start_date Map reduce-->', start_date);

                var end_date = o_context.getParameter({
                    name: 'custscript_end_date_inv'
                });
                log.debug('end_date map reduce-->', end_date)

                /* var fileSearchObj = search.load({id: 'customsearch_so_invoice_create'}); */

                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["status", "anyof", "SalesOrd:F"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["amount", "greaterthan", "0.00"],
                        "AND",
                        ["startdate", "onorafter", start_date],
                        "AND",
                        ["enddate", "onorbefore", end_date]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
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
                            name: "statusref",
                            label: "Status"
                        }),
                        search.createColumn({
                            name: "tranid",
                            label: "Document Number"
                        }),
                        search.createColumn({
                            name: "enddate",
                            label: "End Date"
                        }),
                        search.createColumn({
                            name: "startdate",
                            label: "Start Date"
                        })
                    ]
                });
                var searchResultCount = salesorderSearchObj.runPaged().count;
                log.debug("salesorderSearchObj result count", searchResultCount);

                var resultSet = salesorderSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                if (resultSet != null && resultSet != '' && resultSet != ' ') {
                    var completeResultSet = resultSet;
                    var start = 1000;
                    var last = 2000;

                     while (resultSet.length == 1000) {
                         resultSet = salesorderSearchObj.run().getRange(start, last);
                         completeResultSet = completeResultSet.concat(resultSet);
                         start = parseFloat(start) + 1000;
                         last = parseFloat(last) + 1000;
                     }
                    resultSet = completeResultSet;
                    if (resultSet) {
                        log.debug('In getInputData_savedSearch: resultSet: ' + resultSet.length);
                    }
                }

                n_totalSO_count = resultSet.length
                var transdetails = [];
                if (_logValidation(resultSet)) {
                    for (var i = 0; i < resultSet.length; i++) {
                        // .run().each has a limit of 4,000 results

                        var i_SalesordId = resultSet[i].getValue({
                            name: "internalid"
                        });
                        //  log.debug('i_SalesordId ',i_SalesordId);
                        var i_Amount = resultSet[i].getValue({
                            name: "amount"
                        });

                        transdetails.push({
                            'SalesOrderId': i_SalesordId,
                            'Amount': i_Amount
                        });

                    }

                    //return true;
                }

                return transdetails;
            } catch (e) {
                log.error("getInputData |  error ", e)
            }

        }

        function map(context) {
            var tempArr = [];
            try {

                var key = context.key;
                //log.debug('key ',key);
                var value = context.value;
                //log.debug('value ',value);
                //kk;
                var objParsedValue = JSON.parse(value);

                var fSalesOrderId = objParsedValue.SalesOrderId;
                log.debug('fSalesOrderId ', fSalesOrderId);
                var amount = objParsedValue.Amount;
                log.debug('Amount ', amount);
                if (amount != 0.00) {
                    var o_inv_Obj = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: fSalesOrderId,
                        toType: record.Type.INVOICE,
                    });

                    o_inv_Obj.setValue({
                        fieldId: 'customform',
                        value: 242
                    });

                    var orgId = o_inv_Obj.getValue("location");
                    var documentNumber = o_inv_Obj.getValue("custbody_mhl_b2b_doc_number");
                    var postingDate = o_inv_Obj.getValue("enddate");
                    var custId = o_inv_Obj.getValue("entity");
                    //  log.debug("custId", custId);
                    var n_soTotal = o_inv_Obj.getValue("total");
                    //  log.debug("n_soTotal", n_soTotal);

                    var Unit = search.lookupFields({
                        type: 'location',
                        id: orgId,
                        columns: ['cseg_mhl_custseg_un']
                    });
                    // log.debug('Unit', Unit.cseg_mhl_custseg_un[0].value);
                    o_inv_Obj.setValue({
                        fieldId: 'cseg_mhl_custseg_un',
                        value: Unit.cseg_mhl_custseg_un[0].value
                    });

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
                            end: 1000
                        });
                        var percentage = 0,
                            toDiscAmount = 0;
                        for (var r = 0; r < result.length; r++) {
                            var n_fromRange = result[r].getValue("custrecord_range_from");
                            var n_toRange = result[r].getValue("custrecord_range_to");

                            log.debug("percentage "+percentage,"n_toRange "+n_toRange+" n_fromRange "+n_fromRange )
                            if (n_toRange && (n_fromRange < n_soTotal && n_soTotal < n_toRange)) {
                                var percentage = parseFloat(result[r].getValue("custrecordtod_percentage"));

                                // log.debug("percentage matched", percentage);

                                var toDiscAmount = (percentage * parseFloat(n_soTotal)) / 100;
                                // log.debug("In side toDiscAmount", toDiscAmount + " percentage " + percentage)
                                break;;
                            }
                        }

                        log.debug("toDiscAmount", toDiscAmount + " percentage " + percentage)
                        //return false;

                        //	o_inv_Obj.setValue("tranid","CI-"+documentNumber);
                        o_inv_Obj.setValue("custbody_tod_discount_percentage", percentage);
                        o_inv_Obj.setValue("custbody_tod_discount_amount", toDiscAmount);
                       // o_inv_Obj.setValue("trandate", postingDate);

                    }
					o_inv_Obj.setValue("custbody_mhl_b2b_document_number","CI-"+documentNumber);
					o_inv_Obj.setValue("trandate",postingDate);

                    //return false;
                    /*********************************************************************************************/
                    var O_Inv_Id = o_inv_Obj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.audit('O_Inv_Id ', O_Inv_Id);
                    /*********************************************************************************************/
                        var id = record.submitFields({
                    	type: record.Type.INVOICE,
                    	id: O_Inv_Id,
                    	values: {
                    		tranid: O_Inv_Id
                    	},
                    	options: {
                    		enableSourcing: true,
                    		ignoreMandatoryFields: true
                    	}
                    });

                    //*********************************************************************************************/
                    var objSoRecord = record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: fSalesOrderId,
                        values: {
                            custbody_invoice_no: O_Inv_Id
                        }
                    });
                    /*********************************************************************************************/
                    /* var objSoRecord = record.load({
						type: record.Type.SALES_ORDER,
						id: fSalesOrderId,
						isDynamic: true,
					});
					objSoRecord.setValue({fieldId: 'custbody_invoice_no', value:O_Inv_Id});
						objSoRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }); */
                    var jsonArray2 = {
                        'isProcessed': 'YES'
                    };
                    //context.write(context.key, context.values);
                } else {
                    log.debug(fSalesOrderId, "Sales order is not transform due to Amount Zero");

                    var jsonArray2 = {
                        'isProcessed': 'NO'
                    };
                    //return false;
                }
            } catch (ex) {
                log.error({
                    title: 'map: error in creating records',
                    details: ex
                });
                context.write(context.key, ex);
                //return false;
                var jsonArray2 = {
                    'isProcessed': 'NO'
                };

            }
            if (jsonArray2) {
                tempArr.push(jsonArray2);
                //log.debug("tempArr ",JSON.stringify(tempArr))
                context.write(key, tempArr);
            }
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function reduce(context) {

            try {
                var tempArr = [];
                var ErrorArr = [];
                var n_externalID = 0;

                var i_internal_id = context.key;
                // log.debug("i_internal_id",i_internal_id);
                var i_record = context.values[0];
                //log.debug("i_record",i_record);
                //hello

                context.write(context.key, context.values[0]);

            } catch (e) {
                log.error("reduce | error", e)
            }
            //log.debug("Reduce tempArr ",JSON.stringify(ErrorArr))
            // context.write(context.key, context.values);

        }

        ///////////////////////////////////////////////////////////

        function summarize(summary) {
            try {

                log.debug("summarize", "summarize");
                var errorFileContent = "Details, Transaction No\n";
                var createErrorFile = false;
                var mapKeys = [];

                summary.mapSummary.keys.iterator().each(function(key) {
                    mapKeys.push(key);
                    return true;
                });
                var errorObject = " ";

                var errorarray = [];
                var csvColumns = new Array();
                var lineOne = '';
                var errorString = '';

                var processed = 0;
                var eprocessed = 0;
                //log.debug("eprocessed", eprocessed)
                //Iterate success operation here
                var total_lines = 0;
                summary.output.iterator().each(function(key, value) {

                    var tempSucessString = "";
                    var tempErrorString = "";

                    var s_value = JSON.parse(value);
                    //var s_value = s_value[0];
                    total_lines++;
                    //log.debug("rowsData  <--->  ",s_value)
                    //log.debug("value",s_value.length)
                    var errMessage = '';

                    var nsDetails = "";
                    var errorMessage = "";
                    var bProcessed = "";

                    for (var x = 0; x < s_value.length; x++) {

                        bProcessed = s_value[x].isProcessed;
                        //  log.debug("summarize()", 'bProcessed==> '+bProcessed);	

                        if (bProcessed == 'YES') {
                            processed = processed + 1;
                        }
                        if (bProcessed == 'NO') {
                            eprocessed = eprocessed + 1;
                        }
                        nsDetails = s_value[x].message;
                    }

                    errorString = nsDetails;
                    errorFileContent += errorString + ',' + key + '\n';
                    createErrorFile = true;

                    return true;
                });

                log.debug("Summarize", "processed " + processed + " | eprocessed " + eprocessed)
                /*  var mapKeysProcessed = 0;
                summary.mapSummary.keys.iterator().each(function (key, executionCount, completionState) {
					log.debug("completionState ",completionState);
					log.debug("key ",key);
					log.debug("executionCount ",executionCount);
                    if (completionState === 'COMPLETE') {
                        mapKeysProcessed++;
                    }
					else
					{
						
					}
                    return true;
                }); */

                var o_context = runtime.getCurrentScript();
                var start_date = o_context.getParameter({
                    name: 'custscript_start_date_inv'
                });
                // log.debug('start_date Map reduce-->', start_date);

                var end_date = o_context.getParameter({
                    name: 'custscript_end_date_inv'
                });
                var i_record_id_inv = o_context.getParameter({
                    name: 'custscript_record_id_inv'
                });

                var email_content = "Hello User,";
                email_content += "<br>";
                email_content += "<br>";
                email_content += " Sales Order Conversion between <b>" + start_date + "</b> to <b>" + end_date + "</b> has been completed. Please find below details on the same.<br>";
                email_content += " <b>Total Sales Orders: </b> " + total_lines + "<br>";
                email_content += " <b>Converted: </b> " + processed + "<br>";
                email_content += " <b>Failed: </b> " + eprocessed + "<br>";
				
				
				
				
				var o_invObj = record.load({type: 'customrecord_mhl_b2b_inv_execution',
                    id: i_record_id_inv})
				var currentTotalSucessSO = 	o_invObj.getValue('custrecord_hml_total_sucess_so');
				
				
				log.audit("currentTotalSucessSO",currentTotalSucessSO);
				
				
				var e_employee_b2b_created_by = o_invObj.getValue('custrecord_mhl_b2b_created_by');
				var emailID = search.lookupFields({type:'employee',id:e_employee_b2b_created_by, columns: ['email']})
				log.debug("emailID",emailID.email)
				
				var e_emaiArray = new Array();
				e_emaiArray.push(emailID.email);
				e_emaiArray.push('dayanand.lot@metropolisindia.com');
				e_emaiArray.push('navneet.modi@metropolisindia.com');
				
                var record_id = record.submitFields({
                    type: 'customrecord_mhl_b2b_inv_execution',
                    id: i_record_id_inv,
                    values: {
                        custrecord_hml_total_sucess_so: parseInt(processed)+parseInt(currentTotalSucessSO),
                        custrecord_mhl_failed_so: eprocessed
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });

                var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;

                email.send({
                    author: 118,
                    recipients: e_emaiArray,
                    subject: 'Consolidated Invoice Process completed',
                    body: email_content,
                    bcc: ['metropolis@yantrainc.com']
                });

                /*  log.audit({
                     title: 'Map key statistics',
                     details: 'Total number of map keys processed successfully: ' + mapKeysProcessed
                 }); */

            } catch (error) {
                log.error('Catch', 'Msg- ' + error);
            }
        }

        /////////////////////////////////////////////////////////
        function _logValidation(value) {
            if (value != null && value != undefined && value != '' && value != 'undefined') {
                return true;
            } else {
                return false;
            }

        }

        function _nullValidation(val) {
            if (val == null || val == undefined || val == '') {
                return true;
            } else {
                return false;
            }

        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });