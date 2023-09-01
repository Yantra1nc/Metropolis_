/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: VIPL UE Consolidated
 * File Name: UE_Update_Deposit_Rc.js
 * Created On: 25/11/2021
 * Modified On: 
 * Created By: Sanjit yadav (Yantra Inc.)
 * Modified By: 
 * Description: 
 *************************************************************/
define(['N/record', 'N/task', 'N/search', 'N/config', 'N/format', 'N/runtime','N/file'],
    function (record, task, search, config, format, runtime,file) {
        var itemPoArray = []

        function afterSubmit(scriptContext) {
            try {
                log.debug("scriptContext.type", scriptContext.type);
                log.debug('runtime.executionContext', runtime.executionContext)
                //	if(scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT || runtime.executionContext === runtime.ContextType.CSV_IMPORT)
                if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT) {
                    var currRec = scriptContext.newRecord;
                    var recType = currRec.getValue('type');
                    log.debug("rectype", recType);
                    var recId = currRec.getValue('id');
                    log.debug("recId", recId);

                    var objRec = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: false
                    });
                    var vidRef = objRec.getValue({
                        fieldId: 'custbody_mhl_vid_ref_rec'
                    })
                    log.debug('vidRef', vidRef)
                    if (vidRef == null || vidRef == '' || vidRef == 'undefined' || vidRef == undefined)
                        return;
                    var jsonData = serchCustomchilVidRecord(vidRef)
                    log.debug("JOSN DATA", JSON.stringify(jsonData))
                   // log.debug('jsonData', jsonData.length)
                    var classValue = objRec.getValue({
                        fieldId: 'class'
                    })
                    log.debug('classValue', classValue)
                    var location = objRec.getValue({
                        fieldId: 'location'
                    })
                    log.debug('location', location)
					var otherDepCount = 0;
                    if (_logValidation(jsonData)) {
                        // remove exist line
                        var lineCount = objRec.getLineCount({
                            sublistId: 'other'
                        });
                        for (var i = lineCount - 1; i >= 0; i--) {
                            var loss = objRec.getSublistValue({
                                sublistId: 'other',
                                fieldId: 'account',
                                line: i
                            });
                            log.debug('loss', loss)

                        }
                        for (var i = 0; i < jsonData.length; i++) {
							
							log.debug("Customer Id "+i,"jsonData[i].rniCustomer "+jsonData[i].rniCustomer+" | "+jsonData[i].amount)
                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'account',
                                value: jsonData[i].account,
                                line: i
                            })
                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'amount',
                                value: jsonData[i].amount,
                                line: i
                            })
                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'entity',
                                value: jsonData[i].rniCustomer,
                                line: i
                            })
                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'class',
                                value: classValue,
                                line: i
                            })
                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'location',
                                value: location,
                                line: i
                            })
							otherDepCount++;
                        }
                    }
                    // remove all cash back amount

                    var negativeJsonfile = serchChildRecord_with_negativeAmount(vidRef);
                    log.debug('negativeJsonfile', negativeJsonfile)
                    if (_logValidation(negativeJsonfile)) {
                        var cashLineCount = objRec.getLineCount({
                            sublistId: 'cashback'
                        });
						
						log.debug("cashLineCount",cashLineCount)
                       /*  for (var j = cashLineCount - 1; j >= 0; j--) {
                            var lossCashback = objRec.removeLine({
                                sublistId: 'cashback',
                                fieldId: 'account',
                                line: j
                            });
                            log.debug('lossCashback', lossCashback)
                        }
						 */
						 
						 
						 for(var t = cashLineCount - 1; t >= 0; t--)
						 {
							  var lossCashback = objRec.removeLine({
                                sublistId: 'cashback',                                
                                line: t,
								ignoreRecalc: true
                            });
						 }
						var negativeLineIndex = parseInt(negativeJsonfile.length) + parseInt(otherDepCount)
                        for (var c = 0; c < negativeJsonfile.length; c++) {
							//log.debug("Customer Id "+c,"jsonData[i].rniCustomer "+negativeJsonfile[c].rniCustomer+" | "+negativeJsonfile[c].amount)
                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'account',
                                value: negativeJsonfile[c].account,
                                line: otherDepCount
                            })
                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'amount',
                                value: negativeJsonfile[c].amount,
                                line: otherDepCount
                            })
							
							objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'entity',
                                value: negativeJsonfile[c].rniCustomer,
                                line: otherDepCount
                            })
                            var getAmount = objRec.getSublistValue({
                                sublistId: 'other',
                                fieldId: 'amount',
                                line: otherDepCount
                            })
                            log.debug('getAmount', getAmount)

                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'class',
                                value: classValue,
                                line: otherDepCount
                            })
                            objRec.setSublistValue({
                                sublistId: 'other',
                                fieldId: 'location',
                                value: location,
                                line: otherDepCount
                            })
							otherDepCount++;
                        }
                    }
                    var saveId = objRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    log.audit("Deposit Id ", saveId)

                }
              
              if (scriptContext.type == 'delete') {
                    var oldRec = scriptContext.oldRecord;
                    var file_id = oldRec.getValue({
                        fieldId: 'custbody_rni_deposit_file'
                    });
                    log.debug('file_id', file_id);
                    if (file_id) {
                        log.debug('if..file_id', file_id);
                        var o_fileObj = file.load({
                            id: file_id
                        });
                        o_fileObj.folder = '396198';
                        o_fileObj.save();
                    }
                }
              
              
            } catch (ex) {
                log.error({
                    title: ' afterSubmit',
                    details: ex
                });
            }
        }
        // pass the VID REFERENCE RECORD to get all positive value form child record for other deposit line item

        function serchCustomchilVidRecord(recId) {
            var customrecord_mhl_deposited_vid_childSearchObj = search.create({
                type: "customrecord_mhl_deposited_vid_child",
                filters: [
					["custrecord_mhl_parent_rec_id", "anyof", recId],
					"AND",
					["custrecord_mlh_cms_vid_amount", "greaterthan", "0.00"]
				],
                columns: [
					search.createColumn({
                        name: "custrecord_mhl_rni_vid_customer",
                        summary: "GROUP",
                        label: "RnI customer"
                    }),
					search.createColumn({
                        name: "custrecord_mlh_cms_vid_amount",
                        summary: "SUM",
                        label: "VID Amount"
                    }),

					search.createColumn({
                        name: "receivablesaccount",
                        join: "CUSTRECORD_MHL_RNI_VID_CUSTOMER",
                        summary: "GROUP",
                        label: "Default Receivables Account"
                    })
				]
            });

            var searchResultCount = customrecord_mhl_deposited_vid_childSearchObj.runPaged()
                .count;
            log.debug("customrecord_mhl_deposited_vid_childSearchObj result count", searchResultCount);
            var jsonFile = [];
            if (searchResultCount != 0) {
                customrecord_mhl_deposited_vid_childSearchObj.run()
                    .each(function (result) {
                        // .run().each has a limit of 4,000 results

                        jsonFile.push({
                            'rniCustomer': result.getValue({
                                name: "custrecord_mhl_rni_vid_customer",
                                summary: "GROUP",
                                label: "RnI customer"
                            }),
                            'amount': result.getValue({
                                name: "custrecord_mlh_cms_vid_amount",
                                summary: "SUM",
                                label: "VID Amount"
                            }),
                            'account': result.getValue({
                                name: "receivablesaccount",
                                join: "CUSTRECORD_MHL_RNI_VID_CUSTOMER",
                                summary: "GROUP",
                                label: "Default Receivables Account"
                            })
                        })

                        return true;
                    });
                //log.debug('total_qty_in_transit',total_qty_in_transit)
                return jsonFile;
            }
        }
        // pass the vid ref id to get the all negative vid amount for cash back line item
        function serchChildRecord_with_negativeAmount(recId) {
            var negativeJson = [];
            var customrecord_mhl_deposited_vid_childSearchObj = search.create({
                type: "customrecord_mhl_deposited_vid_child",
                filters: [
					["custrecord_mhl_parent_rec_id", "anyof", recId],
					"AND",
					["custrecord_mlh_cms_vid_amount", "lessthan", "0.00"]
				],
                columns: [
					search.createColumn({
                        name: "custrecord_mhl_rni_vid_customer",
                        summary: "GROUP",
                        label: "RnI customer"
                    }),
					search.createColumn({
                        name: "custrecord_mlh_cms_vid_amount",
                        summary: "SUM",
                        label: "VID Amount"
                    }),
					search.createColumn({
                        name: "receivablesaccount",
                        join: "CUSTRECORD_MHL_RNI_VID_CUSTOMER",
                        summary: "GROUP",
                        label: "Default Receivables Account"
                    })
				]
            });
            var searchResultCount = customrecord_mhl_deposited_vid_childSearchObj.runPaged()
                .count;
            log.debug("customrecord_mhl_deposited_vid_childSearchObj result count", searchResultCount);
            var jsonFile = [];
            if (searchResultCount != 0) {
                customrecord_mhl_deposited_vid_childSearchObj.run()
                    .each(function (result) {
                        // .run().each has a limit of 4,000 results

                        negativeJson.push({
                            'rniCustomer': result.getValue({
                                name: "custrecord_mhl_rni_vid_customer",
                                summary: "GROUP",
                                label: "RnI customer"
                            }),
                            'amount': result.getValue({
                                name: "custrecord_mlh_cms_vid_amount",
                                summary: "SUM",
                                label: "VID Amount"
                            }),
                            'account': result.getValue({
                                name: "receivablesaccount",
                                join: "CUSTRECORD_MHL_RNI_VID_CUSTOMER",
                                summary: "GROUP",
                                label: "Default Receivables Account"
                            })
                        })

                        return true;
                    });
                //log.debug('total_qty_in_transit',total_qty_in_transit)
                return negativeJson;
            }
        }

        function _logValidation(value) {
            if (value != 'null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined' && value != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }
        return {
            afterSubmit: afterSubmit
        };
    });