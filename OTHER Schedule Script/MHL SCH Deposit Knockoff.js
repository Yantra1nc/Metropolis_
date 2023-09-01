/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
/*
 
Script Name: SCH_mhl_knockoff_deposit.js
Script Type: Scheduled Script
Created Date: 10-Nov-2021
Created By: Nikita Mugalkhod.
Company : Yantra Inc.
Description: 
*************************************************************/
define(['N/search', 'N/task', 'N/record', 'N/runtime', 'N/https', 'N/url', 'N/file'],
    function (search, task, record, runtime, https, url, file) {
        function execute(context) {
            function rescheduleCurrentScript() {
                //log.debug('call function', s);
                var scheduledScriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                });
                scheduledScriptTask.scriptId = runtime.getCurrentScript()
                    .id; // Get the current script id 
                scheduledScriptTask.deploymentId = runtime.getCurrentScript()
                    .deploymentId; // Get the current script deploymentId
                return scheduledScriptTask.submit(); // rescheduleCurrentScript if the usage is less then 200
            }
            try {
                log.debug("script", "**********started**************");

                //["custrecord_mhl_parent_rec_id.custrecord_mhl_deposit_id", "noneof", "@NONE@"],
                var depositChildSearch = search.load({
					id:'customsearch_mhl_cash_dep_knockoff'
				});
              
				//return false;
                var invResultSet = depositChildSearch.run();

                var resultIndex = 0;
                var resultStep = 999; // Number of records returned in one step (maximum is 1000)
                var resultSet; // temporary variable used to store the result set
                do {
                    // fetch one result set
                    resultSet = invResultSet.getRange(resultIndex, resultIndex + resultStep);
					log.debug("resultSet",resultSet.length)
                    for (var c in resultSet) {

                        if (runtime.getCurrentScript().getRemainingUsage() < 200) {
                            var taskId = rescheduleCurrentScript();
                            return;
                        }

                        var i_vidId = resultSet[c].getValue({
                            name: "custrecord_mhl_deposit_vid"
                        });  

						var n_dep_childRef = resultSet[c].getValue({
                            name: "custrecord_mhl_dep_child_ref"
                        });
						if(!n_dep_childRef)
							n_dep_childRef = 0;
						
						n_dep_childRef = Number(n_dep_childRef) + parseInt(1);
						  var i_customRecId = resultSet[c].getValue({
                                name: "internalid"
                            });
                        if (i_vidId) {

                            //log.debug("VID", i_vidId);
                            var i_depositId = resultSet[c].getValue({
                                name: "custrecord_mhl_deposit_id",
                                join: 'CUSTRECORD_MHL_PARENT_REC_ID',
                                label: "Deposit Id"
                            });
                            //log.debug("i_depositId",i_depositId);
                            var n_vidamount = resultSet[c].getValue({
                                name: "custrecord_mlh_cms_vid_amount"
                            });
                          
                            //deposit id from search.

                            //load deposit record to get the file value
                            var r_depositRecord = record.load({
                                type: record.Type.DEPOSIT,
                                id: i_depositId,
                                isDynamic: true
                            });

                            var f_depositFileValue = r_depositRecord.getValue({
                                fieldId: 'custbody_rni_deposit_file'
                            });

                            var i_depositLocValue = r_depositRecord.getValue({
                                fieldId: 'location'
                            });

                            //getting the values from file.
                            var jsonFile = file.load({
                                id: f_depositFileValue
                            });

                            var fileName = jsonFile.name;
                            var content = jsonFile.getContents();
                            content = JSON.parse(content);

                            var o_value = content.requestObject.bankDepositVO;
                            var i_rec_number = o_value.receiptNumber;

                            var i_bankId = o_value.bankId;

                            //account mapping search
                            var acc_payment;
                            var customrecord_payment_account_mappingSearchObj = search.create({
                                type: "customrecord_payment_account_mapping",
                                filters: [
									["custrecord_mhl_bank_id_rni", "equalto", i_bankId],
									"AND",
									["custrecord_payment_org", "anyof", i_depositLocValue],
									"AND",
									["custrecord_mhl_type_of_bank_mapping", "anyof", "1"],
									"AND",
									["isinactive", "is", "F"]
								],
                                columns: [
									search.createColumn({
                                        name: "custrecord_payment_account",
                                        label: "Payment Account"
                                    })
								]
                            });
                            var searchResultCount = customrecord_payment_account_mappingSearchObj.runPaged().count;
                            log.debug("customrecord_payment_account_mappingSearchObj result count", searchResultCount);
                            customrecord_payment_account_mappingSearchObj.run().each(function (result) {
                                // .run().each has a limit of 4,000 results
                                acc_payment = result.getValue({
                                    name: 'custrecord_payment_account'
                                });
                                return true;
                            });
                            var invArray = searchInvoice(i_vidId);
							
							log.debug("invArray",JSON.stringify(invArray))

                            if (invArray) {                               
                                if (_validateData(invArray.internalid)) {
                                    //  log.debug("in validateData");
                                    if (invArray.status == "open") {
                                        if (n_vidamount > 0) {
                                          //  log.debug("inv status is open");
                                            try {
                                                var payRec = record.transform({
                                                    fromType: record.Type.INVOICE,
                                                    fromId: invArray.internalid,
                                                    toType: record.Type.CUSTOMER_PAYMENT,
                                                    isDynamic: true
                                                });

                                                //  log.debug("Record transformed..", payRec);
                                                payRec.setValue({
                                                    fieldId: 'undepfunds',
                                                    value: 'F'
                                                });
                                                payRec.setValue({
                                                    fieldId: 'account',
                                                    value: acc_payment
                                                });
                                                payRec.setValue({
                                                    fieldId: 'memo',
                                                    value: i_rec_number
                                                });
                                              
                                              payRec.setValue({
                                                    fieldId: 'custbody_mhl_memo',
                                                    value: 'Deposit Entry - Knockoff'
                                                });
                                                //payRec.setValue({fieldId: 'trandate', value: tranDate});
                                                payRec.setValue({
                                                    fieldId: 'autoapply',
                                                    value: false
                                                });
                                                payRec.setValue({
                                                    fieldId: 'custbody_mhl_cms_bank_deposit_entry',
                                                    value: true
                                                });

                                               var i_applyCount = payRec.getLineCount({sublistId:'apply'});	
												for(var inv=0;inv<i_applyCount;inv++)
												{
													payRec.selectLine({sublistId: 'apply',line: inv});
													 var i_applyInvId = payRec.getCurrentSublistValue({sublistId: 'apply',fieldId: 'internalid'});
													 //log.debug('payment i_applyInvId',);
													 if(i_applyInvId == invArray.internalid)
													 {
														log.debug('payment match','match '+i_applyInvId);
														payRec.setCurrentSublistValue({sublistId: 'apply',fieldId: 'apply',value: true});
														payRec.setCurrentSublistValue({sublistId: 'apply',fieldId:'amount',value:Number(n_vidamount)});
													   
														payRec.commitLine({sublistId:'apply'});
														break;
													 }
												}

                                                //  log.debug("Apply line count", lineCnt);

                                                var flg = false;
                                                var creditCount = payRec.getLineCount({
                                                    sublistId: 'credit'
                                                });

                                                //var flag = 0;
                                                var amountToAdjust = Number(n_vidamount);
                                                log.debug("vid amount", n_vidamount); //amount will be - vidAmount.

                                                for (var e = 0; e < creditCount; e++) {
                                                    //log.debug("creditCount",creditCount);
                                                    payRec.selectLine({
                                                        sublistId: 'credit',
                                                        line: e
                                                    });
                                                    var depositIdLine = payRec.getCurrentSublistValue({
                                                        sublistId: 'credit',
                                                        fieldId: 'internalid'
                                                    });
                                                    // log.audit("depositIdLine", depositIdLine + " | " + i_depositId);
                                                    if (depositIdLine == i_depositId) {
                                                       // log.audit("deposits matched..");
                                                        flg = true;
                                                        var depositAmt = payRec.getCurrentSublistValue({
                                                            sublistId: 'credit',
                                                            fieldId: 'due'
                                                        });

                                                        log.debug("depositAmt", depositAmt);
                                                        payRec.setCurrentSublistValue({
                                                            sublistId: 'credit',
                                                            fieldId: 'apply',
                                                            value: true
                                                        });
                                                        payRec.setCurrentSublistValue({
                                                            sublistId: 'credit',
                                                            fieldId: 'amount',
                                                            value: amountToAdjust
                                                        });

                                                        payRec.commitLine({
                                                            sublistId: 'credit'
                                                        });
                                                    }
                                                }
                                                if (flg == true) {
                                                    var payId = payRec.save({
                                                        enableSourcing: true,
                                                        ignoreMandatoryFields: true
                                                    });

                                                    log.audit('Knockoff | Deposit Child Ref ' + i_customRecId, "Payement id "+payId);
                                                }

                                                payRec = null;
                                            } catch (err) {
												createRnIRecord(err.message,fileName);
                                                log.error("Error in payment", err);
                                            }
											record.submitFields({
													type : 'customrecord_mhl_deposited_vid_child',
													id : i_customRecId,
													values : {
														custrecord_mhl_dpst_applied_inv :invArray.internalid,											
														custrecord_mhl_dep_child_ref :n_dep_childRef											
													},
													options: {
													enableSourcing: true,
													ignoreMandatoryFields : true
													}
												}); 
                                            //log.debug("payment id is available custom Record id", customRecId);
                                        }
                                    } else {                                 
										
										record.submitFields({
											type : 'customrecord_mhl_deposited_vid_child',
											id : i_customRecId,
											values : {
												custrecord_mhl_dpst_applied_inv :invArray.internalid,											
												custrecord_mhl_dep_child_ref :n_dep_childRef											
											},
											options: {
											enableSourcing: true,
											ignoreMandatoryFields : true
											}
										}); 
										
										log.audit("Invoice is paid","VID>>> "+i_vidId+" | Deposit Chil Ref>>> "+i_customRecId)
                                    }
                                }
                            }
							else
							{
								log.error("Else","VID is not "+i_vidId)
								
								record.submitFields({
									type : 'customrecord_mhl_deposited_vid_child',
									id : i_customRecId,
									values : {																	
										custrecord_mhl_dep_child_ref :n_dep_childRef											
									},
									options: {
									enableSourcing: true,
									ignoreMandatoryFields : true
									}
								});
							}
                        }
                    }
                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // process or log the results

                    // once no records are returned we already got all of them
                    //log.debug(" before VIDs",vidValue);
                } while (resultSet.length > 0)

                log.debug("script", "--------------------stopped-----------------------");
            } catch (e) {
				createRnIRecord(e.message,fileName);
                log.error('Error Details in payment', e);
            }
        }

        function searchInvoice(vid) {
            var invoiceId = "";
            var vidSearch = search.create({
                type: search.Type.INVOICE,
                columns: ["internalid", "status"],
                filters: [
                    ["custbody_mhl_invoice_vid_number", "IS", vid], "AND", ["mainline", "IS", "T"]
                ]
            });
            var searchResult = vidSearch.run().getRange({
                start: 0,
                end: 1
            });
            //"vidValue" : vidVal
			 var invArr = false;
            if (searchResult.length > 0) {
                invoiceInternalId = searchResult[0].getValue("internalid");
                invoiceStatus = searchResult[0].getValue("status");
                var invArr = {
                    "internalid": invoiceInternalId,
                    "status": invoiceStatus
                };
            };
            return invArr;
        }
		
		function createRnIRecord(e,fileName)
	    {
		var rnIRec=record.create({
			type:'customrecord_rni_integration_status'
		});

		rnIRec.setValue({fieldId:'custrecord_json_type',value:'13'});     //new type - CMS-deposit.
		rnIRec.setValue({fieldId:'custrecord_error_description',value:e.toString()});
		rnIRec.setValue({fieldId:'custrecord_json_file',value:fileName});
		rnIRec.setValue({fieldId:'custrecord_processed',value:'2'});
		rnIRec.save();
	   }

        function _validateData(val) {
            if (val != null && val != 'undefined' && val != 'NaN' && val != '') {
                return true;
            }
        }
        return {
            execute: execute
        };
    });