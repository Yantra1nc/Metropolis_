/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL UE Name Account Validation
 * File Name: MHL YIL UE Name Account Validation.js
 * Created On: 10/03/2023
 * Modified On: 
 * Created By: Sunil K (Yantra Inc.)
 * Modified By: 
 * Description: Selected AR control account should match with Customer Revenue segment AR control account.
 *************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format', 'N/runtime'],
    function(record, search, format, runtime) {

        function beforeSubmit(scriptContext) {

            if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT) {
                var o_recordObj = scriptContext.newRecord;
                var recordId = scriptContext.newRecord.id;
                var recordType = scriptContext.newRecord.type;


                var jourType = o_recordObj.getValue({
                    fieldId: 'custbody_mhl_jv_type_field'
                });
                log.debug("Journal Type-->", jourType);

                var itemLine = o_recordObj.getLineCount({
                    sublistId: 'line'
                });
                log.debug('itemLine -->', itemLine);

                if (jourType == 9) {

                    for (var i = 0; i < itemLine; i++) {

                        var currRecName = o_recordObj.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            line: i
                        });

                        var currAccounts = o_recordObj.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            line: i
                        });

                        log.debug('currRecName-->', currRecName);
                        log.debug('currAccounts-->', currAccounts);

                        var customerSearchObj = search.create({
                            type: "customer",
                            filters: [
                                ["internalidnumber", "equalto", currRecName]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "internalid",
                                    label: "Internal ID"
                                })
                            ]
                        });

                        var searchResultCount = customerSearchObj.runPaged().count;
						log.debug("customerSearchObj result count",searchResultCount);		
                        if (searchResultCount > 0) {
                            log.debug('currRecName Second-->', currRecName);
                            if (currRecName) {

                                var o_custObj = record.load({
                                    type: record.Type.CUSTOMER,
                                    id: currRecName,
                                    isDynamic: true
                                })

                                var revSegment = o_custObj.getValue({
                                    fieldId: 'custentity_mhl_cus_revenue_segment'
                                });
                                log.debug("Revenue Segment-->", revSegment);

                                if (revSegment) {
                                    var o_revSegObj = record.load({
                                        type: record.Type.DEPARTMENT,
                                        id: revSegment,
                                        isDynamic: true
                                    })

                                    var revSegAccount = o_revSegObj.getValue({
                                        fieldId: 'custrecord_mhl_defaultaraccount'
                                    });
                                    log.debug("Revenue Segment Account-->", revSegAccount);
                                }

                                //2!=3
                                if (currAccounts != revSegAccount) {
                                    log.debug("in if error ")
                                    throw 'Selected AR control account should match with Customer Revenue segment AR control account.';
                                    return false;
                                } else {
                                    log.debug("Record Saved Successfully!!!!");
                                    //return true;
                                }
                            }
                        }
                    }
                }
            }
        }

        return {
            beforeSubmit: beforeSubmit
        }
    });