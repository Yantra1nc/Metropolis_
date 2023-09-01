//proper Working script  //METRCUS11182
//customer , Invoice  , Account 

//Prod

/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name:MHL Transaction Freepay payment integrat
 * File Name: MHL Transaction Freepay payment integration (25).js
 * Created On: 03/02/2023 
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Freepay to NS integration
 *********************************************************** */

/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

/*
 * sample JSON format for reference
 * 
 */
define(['N/search', 'N/record', 'N/file', 'N/runtime'],

    function(search, record, file, runtime) {
        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {

            var responseArray = new Array();
            var TransactionId;

            var scriptObj = runtime.getCurrentScript();
            log.audit({
                title: "Started  usage units: ",
                details: scriptObj.getRemainingUsage()
            });
			
			var dateTime = (new Date()).toString();
                dateTime = dateTime + '.json';
                var fileObj = file.create({
                    name: 'Freepay_'+ dateTime,
                    fileType: file.Type.JSON,
                    contents: JSON.stringify(requestBody)
				});
                fileObj.folder = '1036490';
                var id = fileObj.save();

            try {

                var scriptObj = runtime.getCurrentScript();

				var tdsDebitAcc = scriptObj.getParameter({
                    name: 'custscript_tds_accountt'
                });
				
				/* var tdsDebitAcc = scriptObj.getParameter({
                    name: 'custscript_ar_tds_account'
                }); */
				
                var otherDeductionDebitAcc = scriptObj.getParameter({
                    name: 'custscript_other_deduction_acc'
                });

                var otherDeductionRdIITPDebitAcc = scriptObj.getParameter({
                    name: 'custscript_billing_correction'
                });
                log.debug("Rd & IITP Parameter Account-->", otherDeductionRdIITPDebitAcc);

                var otherDeductionOcDebitAcc = scriptObj.getParameter({
                    name: 'custscript_courier_charges'
                });
                log.debug("OC Parameter Account-->", otherDeductionOcDebitAcc);

                var otherDeductionTodDebitAcc = scriptObj.getParameter({
                    name: 'custscript_turnover_discount'
                });
                log.debug("TOD Parameter Account-->", otherDeductionTodDebitAcc);



                i_freepay_account = 1499; //122;//1409//1499; //24001550

                //var freepayJson = requestBody;

                //var customerCode = freepayJson.custCode;
                //log.debug("Direct Requsest Body requestBody-->", requestBody);

                var paymentJson = [];
                if (Array.isArray(requestBody)) {
                    paymentJson = requestBody;
                } else {
                    paymentJson.push(requestBody);
                }

                log.debug({
                    title: 'Json',
                    details: paymentJson
                });



                for (var pj in paymentJson) {
						var paymentIntId;
                    try {


                        log.debug("In loop paymnt Json" + pj, paymentJson[pj]);

                        var customerCode = paymentJson[pj].custCode;
                        var customerDetails = searchCustomer(customerCode);

                        /*  log.audit({
                             title: "Customer Search usage units: " + pj,
                             details: scriptObj.getRemainingUsage()
                         }); */

                       var TransactionId = paymentJson[pj].payId;

                        if (_logValidation(customerDetails)) {
                            log.debug({
                                title: 'customerDetails',
                                details: customerDetails.length
                            });

                            var customerInternalId = customerDetails.id;
                            log.debug({
                                title: 'customerInternalId',
                                details: customerInternalId
                            });

                            var paymentRecTemp = record.create({
                                type: record.Type.CUSTOMER_PAYMENT,
                                isDynamic: true,
                                defaultValues: {
                                    entity: customerInternalId
                                }
                            });

                            /*  log.audit({
                            title: "Payment record creation usage units: " + pj,
                            details: scriptObj.getRemainingUsage()
                        });
 */
                            //paymentRecTemp = clearApplyLine(paymentRecTemp);

                            /* var objRecord =  record.transform({ 
                            fromType: 'invoice', 
                            fromId: 60179966, 
                            toType: record.Type.CUSTOMER_PAYMENT, 
                            defaultValues: {
                            		entity: customerInternalId
                            	}
                            }) */

                            //CR@ 20 Nov 2020
                            //paymentRecTemp.setValue({fieldId:'custbody_mhl_freepay_transaction',value:true});	

                            var arAccount = paymentRecTemp.getValue({
                                fieldId: 'aracct'
                            });

                            var tdsEntryId = '';
                            var otherDeductionEntryId = '';
                            var totalPayAmt = Number(paymentJson[pj].bankAmt);
                            log.debug("totalPayAmt-->", totalPayAmt);

                            var payModeFromFreepay = paymentJson[pj].payMode;
                            var bankUmrn = paymentJson[pj].bankUmrn;
                            var pay_id_freepay = paymentJson[pj].payId;
                            var bankUtr = paymentJson[pj].bankUtr;
							
							//New code added 25-04-2023 - Set date for check payment
							var paymentDate = paymentJson[pj].payDate;
							log.debug("paymentDate",paymentDate);
                            var day = paymentDate.substring(0, 2);
                            var month = paymentDate.substring(2, 4);
                            var year = paymentDate.substring(4, 8);
							var finalPaymentDate = day + '/' + month + '/' + year;
							log.debug("finalPaymentDate",finalPaymentDate);


                            //New Coad added 20/12/2022
                            var pay_amount = paymentJson[pj].payAmount;
                            log.debug("Pay Amount -->", pay_amount);

                            /* if(pay_amount == 0){
                            	paymentRecTemp = clearApplyLine(paymentRecTemp);
                            } */


                            var totalDeductionAmt = 0;
                            var totalTdsDeductionAmt = 0;
                            var deductionEntryFlag = 'F';

                            /////////////////////////// Get Deduction details ///////////////////////////////////////////////////////////
                            var otherDeductionEntry = {
                                subsidiary: customerDetails.getValue({
                                    name: 'subsidiary'
                                }),
                                location: customerDetails.getValue({
                                    name: 'custentity_mhl_cus_org'
                                }),
                                department: customerDetails.getValue({
                                    name: 'custentity_mhl_cus_revenue_segment'
                                }),
                                sbu: customerDetails.getValue({
                                    name: 'custentity_mhl_cust_sbu'
                                }),
                                creditAcc: arAccount,
                                debitRdIITPAcc: otherDeductionRdIITPDebitAcc,
                                debitOcAcc: otherDeductionOcDebitAcc,
                                debitTodAcc: otherDeductionTodDebitAcc,
								finalPaymentDate:finalPaymentDate,
                                deductionType: [],
                                deductionAmount: 0,
                                vidArray: []
                            }
                            log.debug("Customer Details :", otherDeductionEntry);

                            var jsonDetails = paymentJson[pj].details;

                            log.debug("Details Length :", jsonDetails.lenght);
                            log.debug("Details Object :", jsonDetails);


                            /* var paymentRec = record.create({
                                type: record.Type.CUSTOMER_PAYMENT,
                                isDynamic: true,
                                defaultValues: {
                                    entity: customerInternalId
                                }
                            }); */

                            //var payFinalAmount;

                            var payIdInv;

                            for (var t in jsonDetails) {
                                var deductionAmt;
                                var otherDeductAmt;


                                log.debug("T-->", jsonDetails[t]);

                                var consolidatedInvoiceId = jsonDetails[t].docNo;
                                log.debug("Invoice Id ---->", consolidatedInvoiceId);

                                var deductionRdType;
                                var deductionRdAmt;
                                var deductionOcAmt;
                                var deductionOcType;
                                var deductionTodAmt;
                                var deductionTodType;
                                var deductionIITPAmt;
                                var deductionIITPType;

                                payIdInv = pay_id_freepay + "_" + consolidatedInvoiceId;
                                log.debug("payIdInv", payIdInv);
								
								var customerpaymentSearchObj = search.create({
								   type: "customerpayment",
								   filters:
								   [
									  ["type","anyof","CustPymt"], 
									  "AND", 
									  ["externalid","anyof",payIdInv], 
									  "AND", 
									  ["mainline","is","T"]
								   ],
								   columns:
								   [
									  search.createColumn({name: "internalid", label: "Internal ID"})
								   ]
								});
								
								var resultSetSecond = customerpaymentSearchObj.run().getRange({ start: 0, end: 1000 });
								//log.audit("Result Set Second ->", resultSetSecond);
					   
								if (resultSetSecond != null && resultSetSecond != '' && resultSetSecond != ' ') {
									var completeResultSet = resultSetSecond;
									var start = 1000;
									var last = 2000;

									while (resultSetSecond.length == 1000) {
										resultSetSecond = customerpaymentSearchObj.run().getRange(start, last);
										completeResultSet = completeResultSet.concat(resultSetSecond);
										start = parseFloat(start) + 1000;
										last = parseFloat(last) + 1000;

										//log.debug("Input Call","start "+start)
									}
									resultSetSecond = completeResultSet;
									if (resultSetSecond) {
										log.debug('In getInputData_savedSearch: resultSetSecond: ' + resultSetSecond.length);
									}
								}
								
								var paymentIntId;
								if(resultSetSecond){
									for (var j = 0; j < resultSetSecond.length; j++)
									{
										var paymentIntId = resultSetSecond[j].getValue({
											name: "internalid", label: "Internal ID"
										});
										log.debug("paymentIntId",paymentIntId);
									}
								}
								log.debug("paymentIntId Second 287",paymentIntId);
								
                                var payAmount = jsonDetails[t].payAmt;
                                log.debug("payAmount", payAmount);

                                var doc_type = jsonDetails[t].docType;
                                log.debug("docType -->", doc_type);

                                //payFinalAmount += payAmount;
                                //total += parseInt(netAmount);
                                //payFinalAmount = payFinalAmount + payAmount;

                                var invoiceObject = searchConsolidatedInvoice(consolidatedInvoiceId);
                                log.debug("Invoice Object ---->", invoiceObject);


                                /* log.audit({
                                    title: "Payment record creation usage units: " + pj,
                                    details: scriptObj.getRemainingUsage()
                                }); */

                                //Updated 19/12/2022

                                var deductDetails = jsonDetails[t].deductionDetails;
                                log.debug("Deduction Details -->", deductDetails);
                                //log.debug("Deduction Details -->", deductDetails);

                                var deductionJson = [];
                                if (Array.isArray(deductDetails)) {
                                    deductionJson = deductDetails;
                                } else {
                                    deductionJson.push(deductDetails);
                                }


                                var deductApprovalFlag = deductionJson[0].deductionApprovalFlag;
                                log.debug("deductApprovalFlag-->", deductApprovalFlag);

                                var docRefNumber = deductionJson[0].docRefNo;
                                log.debug("docRefNumber-->", docRefNumber);

                                var invRecId = invoiceObject.recId;
                                log.debug("Invoice rec ID -->", invRecId);



                                //For Cn Details TDS & Other deduction record create
                                var cnDetails = jsonDetails[t].cnDetails;

                                if (cnDetails) {
                                    for (var cn in cnDetails) {
                                        if (cnDetails[cn].cnCreateFlag == 'Y') {
                                            deductionEntryFlag = 'T';
                                            var cnBrekupDetails = cnDetails[cn].cnSubBreakup;
                                            for (var cb in cnBrekupDetails) {
                                                var deductionType = cnBrekupDetails[cb].deductionType;
                                                var deductionAmt = cnBrekupDetails[cb].deductionAmt;
                                                totalDeductionAmt = totalDeductionAmt + Number(deductionAmt);
                                                log.debug({
                                                    title: 'deductionAmt',
                                                    details: deductionAmt
                                                });

                                                if (deductionType == 'TDS') {
                                                    // Create separate TDS entry
                                                    tdsEntryId = createTDSEntry(customerInternalId, otherDeductionEntry.subsidiary, otherDeductionEntry.location,
                                                        otherDeductionEntry.department, otherDeductionEntry.sbu, arAccount, tdsDebitAcc, deductionAmt, consolidatedInvoiceId);
                                                    log.debug({
                                                        title: 'tdsEntryId',
                                                        details: tdsEntryId
                                                    });
                                                } else {
                                                    otherDeductionEntry.deductionType.push(deductionType);
                                                    otherDeductionEntry.deductionAmount = otherDeductionEntry.deductionAmount + Number(deductionAmt);
                                                    for (var l in cnBrekupDetails[cb].visitingNumber) {
                                                        otherDeductionEntry.vidArray.push(cnBrekupDetails[cb].visitingNumber[l]);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                /*  log.audit({
                                     title: "TDS entry record in Cn details creation usage units: " + pj,
                                     details: scriptObj.getRemainingUsage()
                                 }); */

                                /* var deductBreakupDetails = deductionJson[0].deductionBreakup;
                                log.debug("deductBreakupDetails-->",deductBreakupDetails); */

                                //For Deduction Details TDS & Other deduction record create

                                if (deductionJson) {
                                    for (var dd in deductionJson) {
                                        if (deductionJson[dd].deductionApprovalFlag == 'Y') {
                                            deductionEntryFlag = 'T';

                                            var dbBrekupDetails = deductionJson[dd].deductionBreakup;

                                            log.debug("Inside loop deductBreakupDetails-->", dbBrekupDetails);

                                            for (var db in dbBrekupDetails) {

                                                var deductionType = dbBrekupDetails[db].deductionType;
                                                log.debug("Deduditon Type ****", deductionType);

                                                deductionAmt = parseFloat(dbBrekupDetails[db].deductionAmt);

                                                totalDeductionAmt = totalDeductionAmt + parseFloat(
                                                    deductionAmt);
                                                log.debug({
                                                    title: 'New deductionAmt',
                                                    details: deductionAmt
                                                });

                                                if (deductionType == 'TDS') {

                                                    log.debug("Inside TDS type consolidatedInvoiceId", consolidatedInvoiceId);

                                                    var deductionTdsAmt = dbBrekupDetails[db].deductionAmt;

                                                    // Create separate TDS entry
                                                    tdsEntryId = createTDSEntry(customerInternalId, otherDeductionEntry.subsidiary, otherDeductionEntry.location,
                                                        otherDeductionEntry.department, otherDeductionEntry.sbu, arAccount, tdsDebitAcc, deductionTdsAmt, consolidatedInvoiceId, finalPaymentDate);

                                                    log.debug({
                                                        title: 'New tdsEntryId',
                                                        details: tdsEntryId
                                                    });
                                                } else if (deductionType == "RD") {

                                                    deductionRdAmt = dbBrekupDetails[db].deductionAmt;
                                                    //log.debug("RD deduction Amt-->", deductionRdAmt);

                                                    deductionRdType = dbBrekupDetails[db].deductionType;
                                                    //log.debug("deductionRdType Type ****", deductionRdType);

                                                } else if (deductionType == "OC") {

                                                    deductionOcAmt = dbBrekupDetails[db].deductionAmt;
                                                    //log.debug("OC deduction Amt-->", deductionOcAmt);

                                                    deductionOcType = dbBrekupDetails[db].deductionType;
                                                    //log.debug("deductionOcType Type ****", deductionOcType);

                                                } else if (deductionType == "TOD") {

                                                    deductionTodAmt = dbBrekupDetails[db].deductionAmt;
                                                    //log.debug("TOD deduction Amt-->", deductionTodAmt);

                                                    deductionTodType = dbBrekupDetails[db].deductionType;
                                                    //log.debug("deductionTodType Type ****", deductionTodType);

                                                } else if (deductionType == "IITP") {

                                                    deductionIITPAmt = dbBrekupDetails[db].deductionAmt;
                                                    //log.debug("IITP deduction Amt-->", deductionIITPAmt);

                                                    deductionIITPType = dbBrekupDetails[db].deductionType;
                                                    //log.debug("deductionIITPType Type ****", deductionIITPType);

                                                } else {
                                                    otherDeductionEntry.deductionType.push(deductionType);
                                                    otherDeductionEntry.deductionAmount = parseFloat(otherDeductionEntry.deductionAmount) + parseFloat(deductionAmt);
                                                    /*for (var l in cnBrekupDetails[db].visitingNumber) {	otherDeductionEntry.vidArray.push(cnBrekupDetails[db].visitingNumber[l]);
												}*/
                                                }
                                            }
                                        }
                                    }
                                }

                                /*  log.audit({
                                     title: "TDS entry record in Deduction details creation usage units: " + pj,
                                     details: scriptObj.getRemainingUsage()
                                 }); */

                                /* if (otherDeductionEntry.deductionType.length > 0) {
                                					otherDeductionEntryId = createOtherDeductionEntry(customerInternalId, otherDeductionEntry,consolidatedInvoiceId, deductionRdAmt, deductionOcAmt, deductionTodAmt, deductionIITPAmt,deductionRdType, deductionOcType, deductionTodType, deductionIITPType);
                                				} 
                                 */


                                otherDeductAmt = parseFloat(deductionRdAmt) + parseFloat(deductionOcAmt) + parseFloat(deductionTodAmt) + parseFloat(deductionIITPAmt);

                                log.debug("Deduct Amount Invoice Total-->", otherDeductAmt);

                                /* otherDeductAmt = otherDeductionEntry.deductionAmount;
                            log.debug("Deduct Amount Invoice Total-->", otherDeductAmt); */

                                log.debug("deductionTdsAmt******", deductionTdsAmt);
								
								if(otherDeductAmt > 0 && deductionTdsAmt >= 0){
									var totatOtherTdsAmount = parseFloat(otherDeductAmt) + parseFloat(deductionTdsAmt);
									log.debug("totatOtherTdsAmount******", totatOtherTdsAmount);
								}else{
									var totatOtherTdsAmount = parseFloat(deductionTdsAmt);
									log.debug("totatOtherTdsAmount 2nd******", parseFloat(totatOtherTdsAmount));
								}
								
							



                                //=====

                                if (invRecId) {
                                    if (payAmount > 0 || totatOtherTdsAmount > 0) {
                                        var invRec = record.load({
                                            type: 'invoice',
                                            id: invRecId
                                        });

                                        if (deductApprovalFlag == 'Y') {
                                            invRec.setValue({
                                                fieldId: 'custbody_payment_deduction_flag',
                                                value: false
                                            });
                                        } else {
                                            invRec.setValue({
                                                fieldId: 'custbody_payment_deduction_flag',
                                                value: true
                                            });
                                        }

                                        var invRecord = invRec.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                    } else {
                                        var invRec = record.load({
                                            type: 'invoice',
                                            id: invRecId
                                        });

                                        if (deductApprovalFlag == 'Y') {
                                            invRec.setValue({
                                                fieldId: 'custbody_payment_deduction_flag',
                                                value: false
                                            });
                                        } else {
                                            invRec.setValue({
                                                fieldId: 'custbody_payment_deduction_flag',
                                                value: true
                                            });
                                        }

                                        var invRecord = invRec.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });

                                        //return TransactionId;
                                       responseArray.push({
                                            payexPayId: TransactionId,
                                            RequestStatus: 'Request Success',
                                            RecordStatus: 'Payment Record Cancellation Successfull!'
                                        }) 

                                        //return responseArray;
                                    }
                                }


                                log.debug({
                                    title: 'otherDeductionEntry',
                                    details: otherDeductionEntry
                                });

                                //log.debug("deductionRdType length",deductionRdType.length);

                              log.debug("Deductions ", "deductionRdAmt "+deductionRdAmt+" | deductionRdType "+deductionRdType+" | deductionOcAmt "+deductionOcAmt+" | deductionOcType "+deductionOcType+" | deductionTodAmt "+deductionTodAmt+" | deductionTodType "+deductionTodType+" | deductionIITPAmt "+deductionIITPAmt+" | deductionIITPType "+deductionIITPType);


                                if (deductionRdType || deductionOcType || deductionTodType || deductionIITPType) {

                                    log.debug('otherDeductionEntry 509');

                                    otherDeductionEntryId = createOtherDeductionEntry(customerInternalId, otherDeductionEntry, consolidatedInvoiceId, deductionRdAmt, deductionOcAmt, deductionTodAmt, deductionIITPAmt, deductionRdType, deductionOcType, deductionTodType, deductionIITPType, otherDeductionRdIITPDebitAcc, otherDeductionOcDebitAcc, otherDeductionTodDebitAcc,finalPaymentDate);
                                }

                                log.debug("Testing 518", totatOtherTdsAmount);

                                /* if (otherDeductionEntry.deductionType.length > 0) {
                                otherDeductionEntryId = createOtherDeductionEntry(customerInternalId, otherDeductionEntry.subsidiary, otherDeductionEntry.location,
                                otherDeductionEntry.department, otherDeductionEntry.sbu, arAccount, tdsDebitAcc, deductionTdsAmt,consolidatedInvoiceId,deductionRdAmt,deductionOcAmt, deductionTodAmt, deductionIITPAmt);
                            } */

                                /*  log.audit({
                                     title: "Other Deduction record creation usage units: " + pj,
                                     details: scriptObj.getRemainingUsage()
                                 }); */


                                //if(pay_amount != 0)
                                //{	 

                                var paymentRec = record.create({
                                    type: record.Type.CUSTOMER_PAYMENT,
                                    isDynamic: true,
                                    defaultValues: {
                                        entity: customerInternalId
                                    }
                                });

                                /* log.audit({
                                    title: "Payment actual record creation usage units: " + pj,
                                    details: scriptObj.getRemainingUsage()
                                }); */

                                /* 	var objRecord =  record.transform({ 
                                	fromType: 'invoice', 
                                	fromId: 60179966, 
                                	toType: record.Type.CUSTOMER_PAYMENT, 
                                	defaultValues: {
                                			entity: customerInternalId
                                		}
                                	})  */

                                //CR@ 20 Nov 2020
                                paymentRec.setValue({
                                    fieldId: 'custbody_mhl_freepay_transaction',
                                    value: true
                                });

								paymentRec.setText({
                                    fieldId: 'trandate',
                                    text: finalPaymentDate
                                });
                                //New updated
                                //var totalPayAmt = 0;

                               

                                //paymentRec.setValue({fieldId:'payment',value:amountToSet});


                                //--------------------------------------- Apply TDS Credit ------------------------------------------------

                                if (_logValidation(tdsEntryId)) {
                                    var creditLine = paymentRec.getLineCount({
                                        sublistId: 'credit'
                                    });
                                    log.debug('creditLine In Tds -->', creditLine);
                                    for (var cr = 0; cr < creditLine; cr++) {
                                        var currentId = paymentRec.getSublistValue({
                                            sublistId: 'credit',
                                            fieldId: 'internalid',
                                            line: cr
                                        });
                                        //log.debug("Current Id In Tds ---->", currentId);

                                        //tdsEntryId = 60192589

                                        if (currentId == tdsEntryId) {
                                            log.debug('currentId 149', currentId);
                                            paymentRec.selectLine({
                                                sublistId: 'credit',
                                                line: cr
                                            });
                                            paymentRec.setCurrentSublistValue({
                                                sublistId: 'credit',
                                                fieldId: 'apply',
                                                value: true
                                            });
                                            paymentRec.commitLine({
                                                sublistId: 'credit'
                                            });
                                            log.debug('TDS Deduction Applied', 'At Line ' + cr);
                                        }
                                    }
                                }

                                //--------------------------------------- Apply Other deduction Credit -------------------------------------

                                if (_logValidation(otherDeductionEntryId)) {
                                    var creditLine = paymentRec.getLineCount({
                                        sublistId: 'credit'
                                    });
                                    log.debug('creditLine', creditLine);
                                    for (var cr = 0; cr < creditLine; cr++) {
                                        var currentId = paymentRec.getSublistValue({
                                            sublistId: 'credit',
                                            fieldId: 'internalid',
                                            line: cr
                                        });

                                        if (Number(currentId) == Number(otherDeductionEntryId)) {
                                            paymentRec.selectLine({
                                                sublistId: 'credit',
                                                line: cr
                                            });
                                            paymentRec.setCurrentSublistValue({
                                                sublistId: 'credit',
                                                fieldId: 'apply',
                                                value: true
                                            });
                                            paymentRec.commitLine({
                                                sublistId: 'credit'
                                            });
                                            log.debug('Other Deduction Applied', 'At Line ' + cr);

                                        }
                                    }
                                }

                                log.debug('Payment Amount After Deduction Applied', paymentRec.getValue({
                                    fieldId: 'payment'
                                }));

                                paymentRec.setValue({
                                    fieldId: 'externalid',
                                    value: payIdInv
                                });
								
								if(doc_type == 'IN'){
									paymentRec.setValue({
										fieldId: 'custbody_freepay_payment_type',
										value: 'B2B'
									});
								}else{
									paymentRec.setValue({
										fieldId: 'custbody_freepay_payment_type',
										value: 'RA'
									});
								}

                                /* paymentRec.setValue({
                                fieldId: 'externalid',
                                value: payIdFreepay
                            }); */

                                /*if (deductionEntryFlag == 'T') {
                                	paymentRec.setValue({
                                		fieldId: 'autoapply',
                                		value: true
                                	});

                                } else {
                                	log.error('enter for auto apply', 'totalPayAmt--' + totalPayAmt)
                                	paymentRec.setValue({
                                		fieldId: 'payment',
                                		value: totalPayAmt
                                	});
                                	paymentRec.setValue({
                                		fieldId: 'autoapply',
                                		value: true
                                	});
                                	
                                }*/

                                //New Code added 28/12/2022 ========================
                                log.debug("675 ******", totatOtherTdsAmount);

                                if (invoiceObject.lenght > 0 || totatOtherTdsAmount > 0) {
                                    log.debug("Line 523");
                                    paymentRec = clearApplyLine(paymentRec);

                                } else {
                                    log.debug('Enter for auto apply', 'totalPayAmt--' + payAmount)
                                    if (doc_type == "A") {
                                        paymentRec.setValue({
                                            fieldId: 'payment',
                                            value: payAmount
                                        });
                                        paymentRec.setValue({
                                            fieldId: 'autoapply',
                                            value: true
                                        });
                                    }
                                }

                                //==================================================

                                // paymentRec = clearApplyLine(paymentRec);

                                /* log.audit({
                                title: "Clear Apply Line Function execution usage units: " + pj,
                                details: scriptObj.getRemainingUsage()
                            });
 */
                                var applyLineCnt = paymentRec.getLineCount({
                                    sublistId: 'apply'
                                });
                                log.debug('Total Invoice on payment Line', applyLineCnt);
                                //log.debug('Invoice TO Be Applied',invoiceObject.invoiceId.length);
                                var vidString = '';
                                //for (var iv in invoiceObject.invoiceId) {

                                //log.debug("Invoice Id -->", invoiceObject.invoiceId);
                                var i_flag = false
                                for (var applyLine = 0; applyLine < applyLineCnt; applyLine++) {
                                    var currentVID = paymentRec.getSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'internalid',
                                        line: applyLine
                                    });

                                    var currentB2bInv = paymentRec.getSublistText({
                                        sublistId: 'apply',
                                        fieldId: 'refnum',
                                        line: applyLine
                                    });
                                    var i_tr_type = paymentRec.getSublistText({
                                        sublistId: 'apply',
                                        fieldId: 'type',
                                        line: applyLine
                                    });

                                    if ((consolidatedInvoiceId == currentB2bInv) && i_tr_type == 'Invoice') {
                                        i_flag = true
                                        log.audit('details of paymt', 'i_tr_type--' + i_tr_type + ':consolidatedInvoiceId--' + consolidatedInvoiceId +
                                            ':currentB2bInv--' + currentB2bInv)
                                        log.debug("Current VID -->" + applyLine, currentB2bInv);

                                        paymentRec.selectLine({
                                            sublistId: 'apply',
                                            line: applyLine
                                        });
                                        paymentRec.setCurrentSublistValue({
                                            sublistId: 'apply',
                                            fieldId: 'apply',
                                            value: true

                                        });

                                        //totatOtherTdsAmount
                                        //if(pay_amount != 0)
                                        if (payAmount != 0) {
                                            paymentRec.setCurrentSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'amount',
                                                value: Number(payAmount)
                                            });
                                        } else {
                                            paymentRec.setCurrentSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'amount',
                                                value: Number(totatOtherTdsAmount)
                                            });
                                        }

                                        paymentRec.commitLine({
                                            sublistId: 'apply'
                                        });
                                    }
                                }

                                log.audit('i_flag', i_flag)
                                //}

                                var payModeFromFreepay = paymentJson[pj].payMode;
                                var bankUmrn = paymentJson[pj].bankUmrn;
                                var payIdFreepay = paymentJson[pj].payId;
                                var bankUtr = paymentJson[pj].bankUtr;

                                // added code for virtualAccount // 22012022  // CUS09791 //LMHC57
                                var s_gl_prefix = paymentJson[pj].virtualAccount;
                                if (s_gl_prefix) {
                                    s_gl_prefix = s_gl_prefix.substring(0, 6);
                                    log.audit('s_gl_prefix- ' + s_gl_prefix + '#' + otherDeductionEntry.subsidiary);
                                } else {
                                    responseArray.push({
                                        PayId: TransactionId,
                                        RequestStatus: 'Request Failed',
                                        RecordStatus: 'Kindly Enter valid Virtual Account.',
                                        paymentId: '',
                                        tdsDeductionId: '',
                                        otherDeductionId: '',
                                        errorDescription: ''
                                    })
                                }

                                paymentRec.setValue({
                                    fieldId: 'custbody_pay_mode',
                                    value: payModeFromFreepay
                                });
                                paymentRec.setValue({
                                    fieldId: 'custbody_bank_umrn',
                                    value: bankUmrn
                                });
                                paymentRec.setValue({
                                    fieldId: 'custbody_mhl_pay_id',
                                    value: payIdFreepay
                                });
                                //paymentRec.setValue({fieldId:'custbody_mhl_utr_number',value:bankUtr});
                                paymentRec.setValue({
                                    fieldId: 'memo',
                                    value: bankUtr
                                });
                                paymentRec.setValue({
                                    fieldId: 'location',
                                    value: customerDetails.getValue({
                                        name: 'custentity_mhl_cus_org'
                                    })
                                });
                                paymentRec.setValue({
                                    fieldId: 'cseg_mhl_custseg_un',
                                    value: customerDetails.getValue({
                                        name: 'custentity_mhl_cus_unit'
                                    })
                                });
                                paymentRec.setValue({
                                    fieldId: 'class',
                                    value: customerDetails.getValue({
                                        name: 'custentity_mhl_cust_sbu'
                                    })
                                });

                                if (payModeFromFreepay == 'NACH') {
                                    paymentRec.setValue({
                                        fieldId: 'paymentmethod',
                                        value: 11
                                    });
                                } else {
                                    paymentRec.setValue({
                                        fieldId: 'paymentmethod',
                                        value: 7
                                    });
                                }

                                if ((i_freepay_account)) {
                                    paymentRec.setValue({
                                        fieldId: 'ccapproved',
                                        value: true
                                    });
                                    paymentRec.setValue({
                                        fieldId: 'undepfunds',
                                        value: 'F'
                                    });
                                    //paymentRec.setValue({ fieldId: 'account', value: i_freepay_account });

                                    //START === Freepay GL code Logic on 27/10/2021
                                    var accountSearchObj = search.create({
                                        type: "account",
                                        filters: [
                                            ["custrecord_prefix_for_freepay", "contains", s_gl_prefix], "AND", ["subsidiary", "anyof", otherDeductionEntry.subsidiary], "AND", ["isinactive", "is",
                                                "F"
                                            ]
                                        ],
                                        columns: [
                                            search.createColumn({
                                                name: "internalid",
                                                sort: search.Sort.ASC,
                                                label: "Internal ID"
                                            }),
                                            search.createColumn({
                                                name: "name",
                                                label: "Name"
                                            })
                                        ]
                                    });

                                    var searchResult = accountSearchObj.run().getRange({
                                        start: 0,
                                        end: 1
                                    })
                                    log.debug('searchResult- ' + searchResult);

                                    if (searchResult) {
                                        if (searchResult.length > 0) {
                                            var i_bank_internalId = searchResult[0].getValue({
                                                name: 'internalid'
                                            })
                                            paymentRec.setValue({
                                                fieldId: 'account',
                                                value: i_bank_internalId
                                            });
                                            log.audit('IF', 'i_bank_internalId- ' + i_bank_internalId);
                                        } else {
                                            paymentRec.setValue({
                                                fieldId: 'account',
                                                value: i_freepay_account
                                            });
                                            log.audit('ELSE', 'i_freepay_account- ' + i_freepay_account);
                                        }
                                    } else {
                                        paymentRec.setValue({
                                            fieldId: 'account',
                                            value: i_freepay_account
                                        });
                                        log.audit('ELSE', 'i_freepay_account- ' + i_freepay_account);
                                    }

                                    //END === Freepay GL code Logic on 27/10/2021

                                }

                                /*  log.audit({
                                     title: "Account Search usage units: " + pj,
                                     details: scriptObj.getRemainingUsage()
                                 }); */

                                var consolidatedDue = Number(invoiceObject.dueAmt); //Consolidated invoice 

                                var consolidatedRecId = invoiceObject.recId;
                                log.debug("Consolidate rec ID -->", consolidatedRecId);

                                if (totalDeductionAmt > 0) {
                                    consolidatedDue = consolidatedDue - totalDeductionAmt;

                                } else {
                                    consolidatedDue = consolidatedDue - totalPayAmt;

                                }

                                log.debug("Consolidated Due -->", consolidatedDue);

                                var payId = paymentRec.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                                //}	

                                /* log.audit({
                                    title: "Save Payment record creation usage units: " + pj,
                                    details: scriptObj.getRemainingUsage()
                                }); */

                                if (_logValidation(consolidatedRecId)) {
                                    if (_logValidation(tdsEntryId) || _logValidation(otherDeductionEntryId)) {

                                        var id = record.submitFields({
                                            type: 'invoice',
                                            id: consolidatedRecId,
                                            values: {
                                                amountremainingtotalbox: consolidatedDue,
                                                custbody_integration_status: '1'
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
                                    } else {
                                        var id = record.submitFields({
                                            type: 'invoice',
                                            id: consolidatedRecId,
                                            values: {
                                                amountremainingtotalbox: consolidatedDue
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
                                    }
                                }

                                /*   log.audit({
                                      title: "Submit Fields in invoice usage units: " + pj,
                                      details: scriptObj.getRemainingUsage()
                                  }); */

                                if (_logValidation(tdsEntryId)) {
                                    var id = record.submitFields({
                                        type: 'customtransaction_mhl_tdsentryforcustpay',
                                        id: tdsEntryId,
                                        values: {
                                            custbody_mhl_invoice_vid_number: vidString

                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                }

                                if (_logValidation(otherDeductionEntryId)) {
                                    var id = record.submitFields({
                                        type: 'customtransaction_mhl_otherdeductions',
                                        id: otherDeductionEntryId,
                                        values: {
                                            custbody_mhl_invoice_vid_number: vidString
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                }

                                /*  log.audit({
                                     title: "Submit Fields in TDS & Other deduction usage units: " + pj,
                                     details: scriptObj.getRemainingUsage()
                                 }); */


                                /* log.debug({
                                	title: 'Payment Created',
                                	details: payId
                                });*/

                                log.debug('Success Response', 'Request Success-> ' + payId + '#' + tdsEntryId + '#' + otherDeductionEntryId);
                                responseArray.push({
                                    //PayId: TransactionId,
                                    payexPayId: TransactionId,
                                    RequestStatus: 'Request Success',
                                    RecordStatus: 'Payment/Deduction Record Created',
                                    paymentId: payId,
                                    tdsDeductionId: tdsEntryId,
                                    otherDeductionId: otherDeductionEntryId,
                                    errorDescription: ''
                                })

                                /* return {
                                	RequestStatus: 'Request Success',
                                	RecordStatus: 'Payment/Deduction Record Created',
                                	paymentId: payId,
                                	tdsDeductionId: tdsEntryId,
                                	otherDeductionId: otherDeductionEntryId,
                                	errorDescription: ''
                                }; */
                            }

                            /*   var payId = paymentRec.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }); */


                        } else {
                            log.debug({
                                title: 'Customer Not Found',
                                details: 'Entity Id ' + customerCode
                            });

                            responseArray.push({
                                //PayId: TransactionId,
                                payexPayId: TransactionId,
                                RequestStatus: 'Request Success',
                                RecordStatus: 'Payment Record Not Created',
                                paymentId: '',
                                tdsDeductionId: '',
                                otherDeductionId: '',
                                errorDescription: 'Customer Not Found ' + customerCode
                            })

                        }



                    } catch (er) {
                        log.error("Loop Error " + pj, er)

                        responseArray.push({
                            //PayId: TransactionId, payId
                            payexPayId: TransactionId,
                            RequestStatus: 'Bulk Request Failed',
                            RecordStatus: 'Record Not Created',
                            paymentId: paymentIntId,
                            tdsDeductionId: '',
                            otherDeductionId: '',
                            errorDescription: er.message
                        })
						
						log.debug("Response Array Bulk Request Failed-->",responseArray);
                    }
                }



                //End for loop
                log.audit({
                    title: "Final usage units: ",
                    details: scriptObj.getRemainingUsage()
                });


            } catch (e) {

                log.error({
                    title: 'Error Occured',
                    details: e
                });

                var tdsEntryId = '';
                var otherDeductionEntryId = '';

                if (_logValidation(tdsEntryId)) {
                    var recDelete = record.delete({
                        type: 'customtransaction_mhl_tdsentryforcustpay',
                        id: tdsEntryId,
                    });
                }

                if (_logValidation(otherDeductionEntryId)) {
                    var recDelete = record.delete({
                        type: 'customtransaction_mhl_otherdeductions',
                        id: otherDeductionEntryId,
                    });
                }
                var dateTime = (new Date()).toString();
                dateTime = dateTime + '.json';
                var fileObj = file.create({
                    name: dateTime,
                    fileType: file.Type.JSON,
                    contents: JSON.stringify(requestBody)
                });
                fileObj.folder = '740';
                var id = fileObj.save();

                responseArray.push({
                    //PayId: TransactionId,
                    payexPayId: TransactionId,
                    RequestStatus: 'Request Failed',
                    RecordStatus: 'Payment Record Not Created',
                    paymentId: '',
                    tdsDeductionId: '',
                    otherDeductionId: '',
                    errorDescription: e.message
                })
            }
            return responseArray;
        }

        // Search Customer ///////////////////////////

        function searchCustomer(customerCode) {
            customerCode = customerCode.toString();
            log.debug({
                title: 'Client ID',
                title: customerCode
            });

            var internalIdSearch = search.create({
                type: search.Type.CUSTOMER,
                columns: ['internalid', 'subsidiary', 'custentity_mhl_cus_org', 'custentity_mhl_cus_revenue_segment', 'custentity_mhl_cust_sbu',
                    'custentity_mhl_cus_unit'
                ],
                filters: [
                    ['entityid', 'is', customerCode]
                ]
            });

            var searchResult = internalIdSearch.run().getRange({
                start: 0,
                end: 1
            });

            if (searchResult.length > 0) {
                log.debug({
                    title: 'searchResult',
                    details: searchResult
                });
                return searchResult[0];
            }
            return null;
        }

        /////////////// ENd of search customer//////////////////////////////////////////

        function searchConsolidatedInvoice(consolidatedInvoiceId) {
            log.debug({
                title: 'consolidatedInvoiceId ',
                details: consolidatedInvoiceId
            });

            var returnObject = {
                invoiceId: [],
                vidNumber: [],
                recId: '',
                dueAmt: ''
            }
            var invoiceSearchObj = search.create({
                type: "invoice",
                filters: [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["numbertext", "is", consolidatedInvoiceId]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_vidno",
                        join: "CUSTRECORD_INVOICE_NUMBER",
                        label: "VID No"
                    }),
                    search.createColumn({
                        name: "internalid",
                        join: "CUSTRECORD_INVOICE_NUMBER",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "amountremaining",
                        label: "Amount Remaining"
                    }),
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    })
                ]
            });

            var invResultSet = invoiceSearchObj.run();

            var invResultRange = invResultSet.getRange({
                start: 0,
                end: 1000
            });
            log.debug({
                title: 'invResultRange ',
                details: invResultRange
            });

            for (var t in invResultRange) {
                returnObject.invoiceId.push(invResultRange[t].getValue({
                    name: 'internalid'
                }));

                returnObject.vidNumber.push(invResultRange[t].getValue({
                    name: "internalid",
                    join: "CUSTRECORD_INVOICE_NUMBER",
                    label: "Internal ID"
                }));

                returnObject.recId = invResultRange[t].getValue({
                    name: 'internalid'
                });

                returnObject.dueAmt = invResultRange[t].getValue({
                    name: 'amountremaining'
                });

            }
            log.debug({
                title: 'returnObject -->',
                details: returnObject
            });

            if (returnObject.invoiceId.length > 0) {
                return returnObject;

            } else {
                log.debug({
                    title: 'Few VID are missing in NetSuite'
                });
                return '';
            }
        }

        //////////////////////////////// TDS Entry //////////////////////////////////////////////////////////////////

        function createTDSEntry(entity, subsidiary, location, department, sbu, arAccount, tdsAccount, tdsAmt, consolidatedInvoiceId,finalPaymentDate) {
            if (tdsAmt > 0) {
                var tdsJV = record.create({
                    type: 'customtransaction_mhl_tdsentryforcustpay',
                    isDynamic: true
                });

                //CR@ 20 Nov 2020
                tdsJV.setValue({
                    fieldId: 'custbody_mhl_freepay_transaction',
                    value: true
                });
				
				log.debug("finalPaymentDate 1423-->", finalPaymentDate);
				tdsJV.setText({
                    fieldId: 'trandate',
                    text: finalPaymentDate
                });


                log.debug("In TDS record consolidatedInvoiceId", consolidatedInvoiceId);

                //Set Document Number ===============1/1/2023=======
                tdsJV.setValue({
                    fieldId: 'custbody_invoice_number_freepay',
                    value: consolidatedInvoiceId
                });

                //=============================================

                tdsJV.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiary
                });
                tdsJV.setValue({
                    fieldId: 'location',
                    value: location
                });
                tdsJV.setValue({
                    fieldId: 'department',
                    value: department
                });
                tdsJV.setValue({
                    fieldId: 'class',
                    value: sbu
                });

                tdsJV.selectNewLine({
                    sublistId: 'line'
                });
                tdsJV.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: arAccount
                });
                tdsJV.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: tdsAmt
                });
                tdsJV.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: entity
                });
                tdsJV.commitLine({
                    sublistId: 'line'
                });

                tdsJV.selectNewLine({
                    sublistId: 'line'
                });
                tdsJV.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: tdsAccount
                });
                tdsJV.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: tdsAmt
                });
                tdsJV.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: entity
                });
                tdsJV.commitLine({
                    sublistId: 'line'
                });

                var jvId = tdsJV.save();
                log.debug('jvId', jvId);
                return jvId;
            }
            return '';
        }

        //////////////////////////////////////////// Other Deduction entry ///////////////////////////////////////////////////////////////

        function createOtherDeductionEntry(entity, otherDeductionEntry, consolidatedInvoiceId, deductionRdAmt, deductionOcAmt, deductionTodAmt, deductionIITPAmt, deductionRdType, deductionOcType, deductionTodType, deductionIITPType, otherDeductionRdIITPDebitAcc, otherDeductionOcDebitAcc, otherDeductionTodDebitAcc,finalPaymentDate) {

            log.debug("deductionRdAmt 1362 -->", deductionRdAmt);
            log.debug("deductionOcAmt 1363 -->", deductionOcAmt);
            log.debug("deductionTodAmt 1364 -->", deductionTodAmt);
            log.debug("deductionIITPAmt 1364 -->", deductionIITPAmt);
            log.debug("deductionRdType 1366 -->", deductionRdType);
            log.debug("deductionOcType 1367 -->", deductionOcType);
            log.debug("deductionTodType 1368 -->", deductionTodType);
            log.debug("deductionIITPType 1369 -->", deductionIITPType);

            log.debug("otherDeductionRdIITPDebitAcc 1371 -->", otherDeductionRdIITPDebitAcc);
            log.debug("otherDeductionOcDebitAcc 1372 -->", otherDeductionOcDebitAcc);
            log.debug("otherDeductionTodDebitAcc 1373 -->", otherDeductionTodDebitAcc);
			
			log.debug("finalPaymentDate 1525 -->", finalPaymentDate);


            if (Number(deductionRdAmt) > 0 || Number(deductionOcAmt) > 0 || Number(deductionTodAmt) > 0 || Number(deductionIITPAmt) > 0) {
                var otherDeduction = record.create({
                    type: 'customtransaction_mhl_otherdeductions',
                    isDynamic: true
                });
                //CR@ 20 Nov 2020
                otherDeduction.setValue({
                    fieldId: 'custbody_mhl_freepay_transaction',
                    value: true
                });
				
				otherDeduction.setText({
                    fieldId: 'trandate',
                    text: finalPaymentDate
                });

                //Set Document Number ===============1/1/2023=======
                otherDeduction.setValue({
                    fieldId: 'custbody_invoice_number_freepay',
                    value: consolidatedInvoiceId
                });

                //=============================================

                otherDeduction.setValue({
                    fieldId: 'subsidiary',
                    value: otherDeductionEntry.subsidiary
                });
                otherDeduction.setValue({
                    fieldId: 'location',
                    value: otherDeductionEntry.location
                });
                otherDeduction.setValue({
                    fieldId: 'department',
                    value: otherDeductionEntry.department
                });
                otherDeduction.setValue({
                    fieldId: 'class',
                    value: otherDeductionEntry.sbu
                });

                otherDeduction.setValue({
                    fieldId: 'memo',
                    value: (otherDeductionEntry.deductionType).toString()
                });

                //deductionRdAmt, deductionOcAmt, deductionTodAmt, deductionIITPAmt
                //deductionRdType, deductionOcType, deductionTodType, deductionIITPType
                //debitRdIITPAcc	: otherDeductionRdIITPDebitAcc,
                //debitOcAcc		: otherDeductionOcDebitAcc,
                //debitTodAcc		: otherDeductionTodDebitAcc,


                if (deductionRdType == 'RD') {
                    otherDeduction.selectNewLine({
                        sublistId: 'line'
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: otherDeductionEntry.creditAcc
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: deductionRdAmt
                    });
					
					otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'memo',
                        value: consolidatedInvoiceId
                    });
					
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'entity',
                        value: entity
                    });

                    otherDeduction.commitLine({
                        sublistId: 'line'
                    });

                    otherDeduction.selectNewLine({
                        sublistId: 'line'
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: otherDeductionRdIITPDebitAcc
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: deductionRdAmt
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'entity',
                        value: entity
                    });
                    otherDeduction.commitLine({
                        sublistId: 'line'
                    });
                }


                if (deductionOcType == 'OC') {

                    //New Code added for Credit Amount Addition

                    var itemLine = otherDeduction.getLineCount({
                        sublistId: 'line'
                    });
                    log.debug('itemLine -->', itemLine);
                    for (var i = 0; i < itemLine; i++) {
                        var currRecAcc = otherDeduction.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            line: i
                        });
                        var currRecAmt = otherDeduction.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            line: i
                        });
                        log.debug("currRecAcc---->", currRecAcc);
                        log.debug("otherDeductionEntry creditAcc---->", otherDeductionEntry.creditAcc);

                        if (currRecAcc == otherDeductionEntry.creditAcc) {

                            var totAmt = parseFloat(currRecAmt) + parseFloat(deductionOcAmt);
                            log.debug("Tot Amt =>", totAmt);

                            otherDeduction.selectLine({
                                sublistId: 'line',
                                line: i
                            });
                            otherDeduction.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: currRecAcc
                            });

                            otherDeduction.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: parseFloat(totAmt)
                            });
                            otherDeduction.commitLine({
                                sublistId: "line"
                            });
                        }
                    }

                    //For Debit Line

                    otherDeduction.selectNewLine({
                        sublistId: 'line'
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: otherDeductionOcDebitAcc
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: deductionOcAmt
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'entity',
                        value: entity
                    });
                    otherDeduction.commitLine({
                        sublistId: 'line'
                    });
                }

                //deductionRdAmt, deductionOcAmt, deductionTodAmt, deductionIITPAmt
                //deductionRdType, deductionOcType, deductionTodType, deductionIITPType
                //debitRdIITPAcc	: otherDeductionRdIITPDebitAcc,
                //debitOcAcc		: otherDeductionOcDebitAcc,
                //debitTodAcc		: otherDeductionTodDebitAcc,


                if (deductionTodType == 'TOD') {
                    //New Code added for Credit Amount Addition

                    var itemLine = otherDeduction.getLineCount({
                        sublistId: 'line'
                    });
                    log.debug('itemLine -->', itemLine);
                    for (var i = 0; i < itemLine; i++) {
                        var currRecAcc = otherDeduction.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            line: i
                        });
                        var currRecAmt = otherDeduction.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            line: i
                        });
                        log.debug("currRecAcc---->", currRecAcc);
                        log.debug("otherDeductionEntry creditAcc---->", otherDeductionEntry.creditAcc);

                        if (currRecAcc == otherDeductionEntry.creditAcc) {

                            var totAmt = parseFloat(currRecAmt) + parseFloat(deductionTodAmt);
                            log.debug("Tot Amt =>", totAmt);

                            otherDeduction.selectLine({
                                sublistId: 'line',
                                line: i
                            });
                            otherDeduction.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: currRecAcc
                            });

                            otherDeduction.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: parseFloat(totAmt)
                            });
                            otherDeduction.commitLine({
                                sublistId: "line"
                            });
                        }
                    }

                    //For Debit Line

                    otherDeduction.selectNewLine({
                        sublistId: 'line'
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: otherDeductionTodDebitAcc
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: deductionTodAmt
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'entity',
                        value: entity
                    });
                    otherDeduction.commitLine({
                        sublistId: 'line'
                    });
                }

                //deductionRdAmt, deductionOcAmt, deductionTodAmt, deductionIITPAmt
                //deductionRdType, deductionOcType, deductionTodType, deductionIITPType
                //debitRdIITPAcc	: otherDeductionRdIITPDebitAcc,
                //debitOcAcc		: otherDeductionOcDebitAcc,
                //debitTodAcc		: otherDeductionTodDebitAcc,


                if (deductionIITPType == 'IITP') {
                    //New Code added for Credit Amount Addition

                    var itemLine = otherDeduction.getLineCount({
                        sublistId: 'line'
                    });
                    log.debug('itemLine -->', itemLine);
                    for (var i = 0; i < itemLine; i++) {
                        var currRecAcc = otherDeduction.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            line: i
                        });
                        var currRecAmt = otherDeduction.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            line: i
                        });
                        log.debug("currRecAcc---->", currRecAcc);
                        log.debug("otherDeductionEntry creditAcc---->", otherDeductionEntry.creditAcc);

                        if (currRecAcc == otherDeductionEntry.creditAcc) {

                            var totAmt = parseFloat(currRecAmt) + parseFloat(deductionIITPAmt);
                            log.debug("Tot Amt =>", totAmt);

                            otherDeduction.selectLine({
                                sublistId: 'line',
                                line: i
                            });
                            otherDeduction.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: currRecAcc
                            });

                            otherDeduction.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: parseFloat(totAmt)
                            });
                            otherDeduction.commitLine({
                                sublistId: "line"
                            });
                        }
                    }

                    //For Debit Line
                    otherDeduction.selectNewLine({
                        sublistId: 'line'
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: otherDeductionRdIITPDebitAcc
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: deductionIITPAmt
                    });
                    otherDeduction.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'entity',
                        value: entity
                    });
                    otherDeduction.commitLine({
                        sublistId: 'line'
                    });
                }

                var otherDeductionId = otherDeduction.save();
                log.debug('otherDeductionId', otherDeductionId);

                return otherDeductionId;
            }
            return '';
        }

        function _logValidation(value) {
            if (value != 'null' && value != '' && value != undefined && value != 'NaN' && value != 'undefined' && value != '- None -') {
                return true;
            } else {
                return false;
            }
        }

        function clearApplyLine(paymentRec) {
            var applyLineCnt = paymentRec.getLineCount({
                sublistId: 'apply'
            });
            log.debug('in function', applyLineCnt)
            for (var i = 0; i < applyLineCnt; i++) {
                paymentRec.selectLine({
                    sublistId: 'apply',
                    line: i
                });
                paymentRec.setCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply',
                    value: false
                });
                paymentRec.commitLine({
                    sublistId: 'apply'
                });
            }
            return paymentRec;
        }

        return {
            'post': doPost
        };

    });