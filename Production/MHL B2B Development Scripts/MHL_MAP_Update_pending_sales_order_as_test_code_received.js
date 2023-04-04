/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * Script Name:  MHL_MAP_Update_pending_sales_order_as_test_code_received.js
 * Author: Avinash Lahane & Ganesh Sapakale
 * Date: May 2022
 * Description: This script will Update the Sales order Based on VID Test details.

 */
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
        function getInputData() {

            try {

                var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;

                return search.load({
                    id: 'customsearch_mhl_vid_nt_billed_so'
                });

            } catch (e) {
                log.error("getInputData |  error ", e)
            }

        }

        function map(context) {
            try {

                var a_usage_data = JSON.parse(context.value);

                log.debug("MAP", "a_usage_data" + JSON.stringify(a_usage_data))
                context.write({
                    key: a_usage_data.id,
                    value: a_usage_data.values['GROUP(internalid.CUSTRECORD_SALESORDER)']
                });

            } catch (ex) {
                log.error({
                    title: 'map: error in creating records',
                    details: ex
                });
            }
        }

        Date.prototype.addHours = function(h) {
            this.setHours(this.getHours() + h);
            return this;
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function reduce(context) {

            var tempArr = [];
            var ErrorArr = [];
            var n_externalID = 0;

            var soDetails = context.values;
            var soDetails = JSON.parse(soDetails[0]);

            try {
                var i_salesOrderId = soDetails.value;
                var d = new Date();
                //log.audit(i_salesOrderId+" Convertions started",d.toString())

                log.debug("Sales Order ", i_salesOrderId)
                var o_soObj = record.load({
                    type: record.Type.SALES_ORDER,
                    id: i_salesOrderId,
                    isDynamic: true
                });

                var docuNo = o_soObj.getValue("tranid")

                // Remove temprory line
                var numLines = o_soObj.getLineCount({
                    sublistId: 'item'
                });

                var i_revenueItemID = 0;

                o_soObj.selectLine({
                    sublistId: 'item',
                    line: 0
                })
                i_revenueItemID = o_soObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });
                for (var z = 0; z < numLines; z++) {
                    o_soObj.removeLine({
                        sublistId: 'item',
                        line: 0
                    });
                }

                var totalCopayAmount = 0;
                var totalBalanceAmount = 0;

                var customrecord_b2b_vid_detailsSearchObj = search.create({
                    type: "customrecord_b2b_vid_details",
                    filters: [
                        ["custrecord_salesorder", "anyof", i_salesOrderId],
                        "AND",
                        ["custrecord_salesorder.mainline", "is", "T"],
                        "AND",
                        ["custrecord_reference_b2b.custrecord_cancelled", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({
                            name: "tranid",
                            join: "CUSTRECORD_SALESORDER",
                            label: "Document Number"
                        }),
                        search.createColumn({
                            name: "custrecord_b2b_vid_amount",
                            label: "Amount "
                        }),
                        search.createColumn({
                            name: "custrecord_amountbalance",
                            label: "Amount Balance"
                        }),
                        search.createColumn({
                            name: "custrecord_amountreceived",
                            label: "AmountReceived"
                        }),
                        search.createColumn({
                            name: "custrecordcustrecord_copayclientamount",
                            label: "CopayClientAmount"
                        })
                    ]
                });
                var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
                var f = 0;
                log.audit("customrecord_b2b_vid_detailsSearchObj result count", searchResultCount);
                customrecord_b2b_vid_detailsSearchObj.run().each(function(result) {
                    // .run().each has a limit of 4,000 results

                    totalBalanceAmount = parseFloat(totalBalanceAmount) + parseFloat(result.getValue('custrecord_amountbalance'));
                    totalCopayAmount = parseFloat(totalCopayAmount) + parseFloat(result.getValue('custrecordcustrecord_copayclientamount'))
                    f++;
                    //log.audit(f+ " totalBalanceAmount "+docuNo,totalBalanceAmount)
                    return true;
                });

                //log.audit("totalCopayAmount "+docuNo,totalCopayAmount)
                //log.audit("totalBalanceAmount "+docuNo,totalBalanceAmount)

                var customrecord_b2b_vid_detailsSearchObj = search.create({
                    type: "customrecord_b2b_vid_details",
                    filters: [
                        ["custrecord_salesorder", "anyof", i_salesOrderId],
                        "AND",
                        ["custrecord_reference_b2b.custrecord_cancelled", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({
                            name: "custrecord_mhl_vid_org",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "VID ORG"
                        }),
                        search.createColumn({
                            name: "custrecord_b2b_vid_amount",
                            summary: "SUM",
                            label: "Amount "
                        }),
                        search.createColumn({
                            name: "custrecord_netamount",
                            join: "CUSTRECORD_REFERENCE_B2B",
                            summary: "SUM",
                            label: "Net Amount"
                        })
                    ]
                });

                var totalAmount = 0;
                var t = 0;
                var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
                log.debug("customrecord_b2b_vid_detailsSearchObj result count", searchResultCount);
                customrecord_b2b_vid_detailsSearchObj.run().each(function(result) {
                    // .run().each has a limit of 4,000 results
                    totalAmount = result.getValue({
                        name: "custrecord_netamount",
                        join: "CUSTRECORD_REFERENCE_B2B",
                        summary: "SUM",
                        label: "Net Amount"
                    })

                    var orgId = result.getValue({
                        name: "custrecord_mhl_vid_org",
                        summary: "GROUP"
                    })
                    log.debug("totalAmount", totalAmount);
                    o_soObj.selectLine({
                        sublistId: 'item',
                        line: t
                    })
                    o_soObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: i_revenueItemID
                    });
                    o_soObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: orgId
                    });
                    o_soObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: totalAmount
                    });

                    o_soObj.commitLine({
                        sublistId: 'item'
                    });
                    t++;
                    return true;
                });

                o_soObj.setValue("custbody_mhl_b2b_balance_amt", totalBalanceAmount)
                o_soObj.setValue("custbody_mhl_b2b_copay_amt", totalCopayAmount)
                var i_soId = o_soObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                var d = new Date();
                log.audit(" Convertions Ended " + d.toString(), docuNo + " totalAmount " + totalAmount)
            } catch (e) {
                log.error("reduce | error", e)
            }

            //log.debug("Reduce tempArr ",JSON.stringify(ErrorArr))
            context.write(o_context_frst_occurance, ErrorArr);

        }

        ///////////////////////////////////////////////////////////

        function summarize(summary) {
            try {
                log.emergency("summarize", JSON.stringify(summarize))
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

        function dateFormatChange(date) {
            //log.debug('dateFormatChange',"date "+JSON.stringify(format))

            var format_date = '';
            if (date.indexOf("-") > 0) {
                var format_date = date.split("-");
            } else if (date.indexOf("/") > 0) {
                var format_date = date.split("/");
            } else if (date.indexOf(".") > 0) {
                var format_date = date.split(".");
            }

            //log.debug("dateFormatChange | format_date",JSON.stringify(format_date))

            if (format_date) {
                var newDate = Number(format_date[0]) + "/" + Number(format_date[1]) + "/" + format_date[2];

                var newUpdateDate = format.parse({
                    value: newDate,
                    type: format.Type.DATE
                });
                return newUpdateDate;
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