/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL Vendor Invoice Validation
 * File Name: MHL YIL Vendor Invoice Validation.js
 * Created On: 27/06/2022 
 * Modified On: 
 * Created By: Sunil K (Yantra Inc.)
 * Modified By: 
 * Description: In Vendor invoice validation for duplicate document number.
 *************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/runtime'],
    function(record, search, format, serverWidget, runtime) {

        function beforeSubmit(scriptContext) {

            log.debug("Script Context1 ---->", scriptContext.type);
            var executionContext = runtime.executionContext;
            log.debug("Script executionContext ---->", executionContext);
            if (scriptContext.type == scriptContext.UserEventType.CREATE) {
                // log.debug("Script Context2 ---->", scriptContext.type);
                var recObj = scriptContext.newRecord;
                var venBillNumber = recObj.getValue({
                    fieldId: 'tranid'
                });
                log.debug("Vendor Bill Number = ", venBillNumber);

                if (venBillNumber) {
                    var venEntity = recObj.getValue({
                        fieldId: 'entity'
                    });
                    log.debug("Vendor Entity = ", venEntity);

                    var vendorbillSearchObj = search.create({
                        type: "vendorbill",
                        filters: [
                            ["type", "anyof", "VendBill"],
                            "AND",
                            ["name", "anyof", venEntity],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["postingperiod", "rel", "TFY"],
                            "AND",
                            ["tranid", "is", venBillNumber]
                        ],
                        columns: [
                            search.createColumn({
                                name: "internalid",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "custbody_mhl_vb_vendorbillnumber",
                                label: "Vendor Bill Number"
                            }),
                            search.createColumn({
                                name: "entity",
                                label: "Vendor"
                            }),
                            search.createColumn({
                                name: "postingperiod",
                                label: "Posting Period"
                            })
                        ]
                    });
                    var searchResultCount = vendorbillSearchObj.runPaged().count;
                    log.debug("vendorbillSearchObj result count", searchResultCount);
                    if (searchResultCount > 0) {
                        log.debug("In Condition")
                        throw 'Vendor Bill Number ' + venBillNumber + ' is a duplicate for Vendor';
                        return false;
                    }
                }
            }
        }
        return {
            beforeSubmit: beforeSubmit
        }
    });