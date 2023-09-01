/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: MHL REST Create Payment Record
 * File Name: MHL_RESTLet_Create_Payment_Records.js
 * Created On: 31/01/2022
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: Craete payment records
 *********************************************************** */	

/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/format', 'N/record', 'N/runtime', 'N/search'],

    function (file, format, record, runtime, search) {
        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.1
         */
        function doGet(requestParams) {

        }

        /**
         * Function called upon sending a PUT request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPut(requestBody) {

        }

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            try {
                var payJSON = requestBody;
                log.debug("ReST payJSON", " payJSON Stringify " + JSON.stringify(payJSON))

                //return payJSON;
                var payDate = payJSON.payDate;
                var amountReceived = payJSON.AmountReceived;
                var subsidiary = payJSON.subsidiary;
                var invId = payJSON.invoiceId;
                var customerId = payJSON.customerId;
                var visitDateString = payJSON.vidDate;
                var paymentMode = payJSON.payMode;
                var vidNumber = payJSON.vidNumber;
                var orgVal = payJSON.orgVal;
                var departmentVal = payJSON.departmentVal;
                var classmentVal = payJSON.classmentVal;
                var unitVal = payJSON.unitVal;
                var custPaymode = payJSON.custPayMode;
                var payJSON = payJSON.paymentInfo;

                //log.debug("payJSON",JSON.stringify(payJSON))

                var creditControlAcc = '4530';

                log.debug('AmountReceived', amountReceived);

                //to be added in map/reduce. 
                log.debug("custPaymode", custPaymode);

                if ((custPaymode == 'Cash' || custPaymode == 'Co-payment') && amountReceived > 0) {
                    invId = parseInt(invId);
                    /* var paymentRecord = record.transform({
                    	fromType: record.Type.INVOICE,
                    	fromId: invId,
                    	toType: record.Type.CUSTOMER_PAYMENT,
                    	isDynamic: true,
                    }); */

                    log.debug("	", invId)
                    var paymentRecord = record.transform({
                        fromType: 'invoice',
                        fromId: invId,
                        toType: 'customerpayment',
                        isDynamic: true
                    });

                    var f_invoiceRecFldObj = search.lookupFields({
                        type: search.Type.INVOICE,
                        id: invId,
                        columns: ['tranid']
                    });

                    var location = orgVal;

                    paymentRecord.setValue({
                        fieldId: 'custbody_mhl_invoice_vid_number',
                        value: vidNumber
                    });

                    paymentRecord.setValue({
                        fieldId: 'location',
                        value: orgVal
                    });
                    paymentRecord.setValue({
                        fieldId: 'department',
                        value: departmentVal
                    });
                    paymentRecord.setValue({
                        fieldId: 'class',
                        value: classmentVal
                    });
                    paymentRecord.setValue({
                        fieldId: 'cseg_mhl_custseg_un',
                        value: unitVal
                    });
                    var visitDate = new Date(visitDateString)
                    var payDate = visitDate.getDate();
                    var month = Number(visitDate.getMonth());
                    var year = visitDate.getFullYear();
                    var tempDate = new Date();
                    tempDate.setDate(payDate);
                    tempDate.setMonth(month);
                    tempDate.setFullYear(year);

                 /*   paymentRecord.setValue({
                        fieldId: 'trandate',
                        value: tempDate
                    });*/
					
					
					var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
					var postingPeriod = month[visitDate.getMonth()] + " " + visitDate.getFullYear();
					
                    paymentRecord.setValue({
                        fieldId: 'payment',
                        value: amountReceived
                    });
					log.debug("postingPeriod",postingPeriod)
					/*if (postingPeriod) {
						paymentRecord.setText({
							fieldId: 'postingperiod',
							value: postingPeriod
						});
					}*/

                    log.debug("paymentMode", paymentMode)

                    if (paymentMode) {
                        var accountSearch = search.create({
                            type: 'customrecord_payment_account_mapping',
                            columns: ['custrecord_payment_account'],
                            filters: [
                                ['custrecord_payment_subsidiary', 'is', subsidiary], 'AND', ['custrecord_payment_org', 'is', location], 'AND', ["custrecord_map_paymentmode", "is", paymentMode], 'AND', ["isinactive", "is", "F"]
                            ]
                        });
                    } else {
                        var accountSearch = search.create({
                            type: 'customrecord_payment_account_mapping',
                            columns: ['custrecord_payment_account'],
                            filters: [
                                ['custrecord_payment_subsidiary', 'is', subsidiary], 'AND', ['custrecord_payment_org', 'is', location], 'AND', ["isinactive", "is", "F"]
                            ]
                        });
                    }

                    var searchResult = accountSearch.run().getRange({
                        start: 0,
                        end: 100
                    });
                    log.debug("seanrch ", JSON.stringify(searchResult));
                    if (searchResult) {
                        if (searchResult.length > 0) {
                            account = searchResult[0].getValue({
                                name: 'custrecord_payment_account'
                            });
                        }
                    }

                    if (account) {
                        paymentRecord.setValue({
                            fieldId: 'undepfunds',
                            value: 'F'
                        });
                        paymentRecord.setValue({
                            fieldId: 'account',
                            value: account
                        });
                        paymentRecord.setValue({
                            fieldId: 'ccapproved',
                            value: true
                        });
                    }

                    if (paymentMode == '3') // Card payment
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 2
                        });

                        paymentRecord.setValue({
                            fieldId: 'account',
                            value: account
                        });
                        if (payJSON.transactionId)
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.transactionId
                            });
                    }

                    if (paymentMode == '2') // Cheque
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 3
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } 
                    }

                    if (paymentMode == '13' || paymentMode == '32' || paymentMode == '34') // NEFT/RTGS
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 7
                        });
                        /* if(payJSON.transactionId)
                        paymentRecord.setValue({fieldId:'memo',value:payJSON.transactionId}); */
                    }

                    if (paymentMode == '12') // M swipe
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 9
                        });
                        //paymentRecord.setValue({fieldId:'memo',value:payJSON.transactionId});
                    }
                    if (paymentMode == '10') // Coupne
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 10
                        });
                        if (payJSON.transactionId)
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.transactionId
                            });
                    }

                    if (paymentMode == '4') // DD
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 12
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } else {
                            if (payJSON.transactionId)
                                paymentRecord.setValue({
                                    fieldId: 'memo',
                                    value: payJSON.transactionId
                                });

                        }
                    }

                    if (paymentMode == '5') // UPI
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 13
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } else {
                            if (payJSON.transactionId)
                                paymentRecord.setValue({
                                    fieldId: 'memo',
                                    value: payJSON.transactionId
                                });
                        }
                    }

                    if (paymentMode == '6') // CNP
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 14
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } else {
                            if (payJSON.transactionId)
                                paymentRecord.setValue({
                                    fieldId: 'memo',
                                    value: payJSON.transactionId
                                });
                        }
                    }

                    if (paymentMode == '7') // wallet
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 15
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } else {
                            if (payJSON.transactionId)
                                paymentRecord.setValue({
                                    fieldId: 'memo',
                                    value: payJSON.transactionId
                                });
                        }
                    }

                    if (paymentMode == '8') // Amex
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 16
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } else {
                            if (payJSON.transactionId)
                                paymentRecord.setValue({
                                    fieldId: 'memo',
                                    value: payJSON.transactionId
                                });
                        }
                    }

                    if (paymentMode == '9') // DINERS
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 17
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } else {
                            if (payJSON.transactionId)
                                paymentRecord.setValue({
                                    fieldId: 'memo',
                                    value: payJSON.transactionId
                                });
                        }
                    }

                    if (paymentMode == '11') // Credit Note
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 18
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } else {
                            if (payJSON.transactionId)
                                paymentRecord.setValue({
                                    fieldId: 'memo',
                                    value: payJSON.transactionId
                                });

                        }
                    }

                    if (paymentMode == '28') // Credit Note
                    {
                        paymentRecord.setValue({
                            fieldId: 'paymentmethod',
                            value: 19
                        });
                        if (payJSON.ChequeorCardNumber) {
                            paymentRecord.setValue({
                                fieldId: 'memo',
                                value: payJSON.ChequeorCardNumber
                            });

                        } else {
                            if (payJSON.transactionId)
                                paymentRecord.setValue({
                                    fieldId: 'memo',
                                    value: payJSON.transactionId
                                });
                        }
                    }

                    var n_invDocNo = '';

                    log.debug("f_invoiceRecFldObj", JSON.stringify(f_invoiceRecFldObj))
                    if (f_invoiceRecFldObj) {
                        n_invDocNo = f_invoiceRecFldObj.tranid;
                    }

                    var lineApply = paymentRecord.findSublistLineWithValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        value: true
                    });

                    var lineNo = paymentRecord.findSublistLineWithValue({
                        sublistId: 'apply',
                        fieldId: 'doc',
                        value: invId
                    });

                    var lineinternalidNo = paymentRecord.findSublistLineWithValue({
                        sublistId: 'apply',
                        fieldId: 'internalid',
                        value: invId
                    });

                    log.debug("Invoice Id " + invId, n_invDocNo + " | lineinternalidNo " + lineinternalidNo + " | lineNo " + lineNo + " | lineApply " + lineApply);
                    var paymentLineCnt = paymentRecord.getLineCount({
                        sublistId: 'apply'
                    });

                    log.debug("paymentLineCnt", paymentLineCnt)

                    //return false;
                    for (var t = 0; t < paymentLineCnt; t++) {
                        var applyedInv = paymentRecord.getSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            line: t
                        });

                        paymentRecord.selectLine({
                            sublistId: 'apply',
                            line: t
                        });

                        //****************
                        var item_doc = paymentRecord.getSublistValue({
                            sublistId: 'apply',
                            fieldId: 'doc',
                            line: t
                        });

                        if (invId == item_doc) {
                            log.debug("invoice will stamp", "invId " + invId)
                            paymentRecord.setCurrentSublistValue({
                                sublistId: 'apply',
                                fieldId: 'apply',
                                value: true
                            });
                            paymentRecord.setCurrentSublistValue({
                                sublistId: 'apply',
                                fieldId: 'amount',
                                value: Number(amountReceived)
                            });

                            paymentRecord.commitLine({
                                sublistId: 'apply'
                            });
                            break;
                        }
                    }
                    var paymentId = paymentRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.audit('payment id new ', paymentId+" vidNumber "+vidNumber);

                }

                return {RequestStatus: 'Success',fileStoredInNS: 'Yes',Details: 'VID No :'+vidNumber+" Payment Id " + paymentId,"paymentId": paymentId};
            } catch (e) {
                log.error("Restlet Error", e)
                return {RequestStatus: 'Success',Details:e};
            }
        }

        /**
         * Function called upon sending a DELETE request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doDelete(requestParams) {

        }

        return {

            post: doPost
        };

    });