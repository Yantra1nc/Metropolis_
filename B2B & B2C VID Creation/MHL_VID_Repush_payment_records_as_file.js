/**
 * Script Name: MHL_VID_Repush_payment_records_as_file
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL MR Clearing Pending Payments
 * File Name: MHL_VID_Repush_payment_records_as_file.js
 * Created On: 29/09/2021
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: MHL MR Clearing Pending Payments
 *********************************************************** */

define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './restcall'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function (file, format, record, search, runtime, restcall) {

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
        var folderIds = {
            "VidProcessedPayment": "346686"
        }
        var paymentAccount = ""; // '4530';

        function getInputData() {

            try {

                var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;
                return search.load({
                    id: 'customsearch_mhl_clearing_pending_paymen'
                });
            } catch (e) {
                createRnIRecord(e, 'search Issue');
                log.debug({
                    title: 'Error Occured while collecting JSON for VID',
                    details: e
                });
            }
        }

        function map(context) {
            var jsonFile;
            try {
                //log.debug("map context", context.value)
                var data = JSON.parse(context.value); //read the data

                var getData = data.values;
                //log.debug("map getData", JSON.stringify(getData));

                var getinvoiceid = getData.name;
                // getinvoiceid=getinvoiceid.value;
                var getfileid = getData.internalid;
                getfileid = getfileid.value;
                //log.debug("getfileid",getfileid)
                //  log.debug("getinvoiceid",getinvoiceid)
                var invId = getinvoiceid;
                context.write({
                    key: getinvoiceid,
                    value: getfileid
                });

            } catch (er) {
                log.error("map | err", err)
            }
        }

        function reduce(context) {
            try {

                //log.debug({title: "Reduce",details: context});

                var InvId = context.key;
                var fileInternalId = JSON.parse(context.values[0]);

                //log.debug({title: "reduce | "+InvId,details: fileInternalId});

                jsonFile = file.load({
                    id: fileInternalId
                });
                var fileName = jsonFile.name;
                var content = jsonFile.getContents();
                content = content.replace('Ã¯Â»Â¿', '');
                content = JSON.parse(content);
                // log.deubg("content",JSON.stringify(content))
                var i_vid = content.VisitInfo.VisitNumber;

                // it search only open invoices.
                var s_invData = searchInvoice(i_vid)

                if (s_invData) {

                    var invoiceData = search.lookupFields({
                        type: 'invoice',
                        id: s_invData,
                        columns: ["entity", "custbody_mhl_invoice_vid_number", "location", "department", "class", "cseg_mhl_custseg_un", "custbody_rni_date", "subsidiary", 'status', "trandate"]
                    });

                    if (invoiceData) {
                        //log.debug("reduce | status " + s_invData, invoiceData.status[0].value)
                        log.audit("i_vid", i_vid + " s_invData " + invoiceData.status[0].value)
                        if (invoiceData.status[0].value == 'open') {
                            var getInvObj = {
                                customer: invoiceData.entity[0].value,
                                custbody_mhl_invoice_vid_number: invoiceData.custbody_mhl_invoice_vid_number || "",
                                custbody_rni_date: invoiceData.custbody_rni_date || "",
                                location: "",
                                department: "",
                                class: "",
                                cseg_mhl_custseg_un: "",
                                subsidiary: "",
                                trandate: invoiceData.trandate

                            }

                            if (invoiceData.location && invoiceData.location.length > 0) {
                                getInvObj.location = invoiceData.location[0].value;
                            }

                            if (invoiceData.department && invoiceData.department.length > 0) {
                                getInvObj.department = invoiceData.department[0].value;
                            }

                            if (invoiceData.class && invoiceData.class.length > 0) {
                                getInvObj.class = invoiceData.class[0].value;
                            }

                            if (invoiceData.cseg_mhl_custseg_un && invoiceData.cseg_mhl_custseg_un.length > 0) {
                                getInvObj.cseg_mhl_custseg_un = invoiceData.cseg_mhl_custseg_un[0].value;
                            }

                            if (invoiceData.subsidiary && invoiceData.subsidiary.length > 0) {
                                getInvObj.subsidiary = invoiceData.subsidiary[0].value;
                            }

                            log.debug({
                                title: 'getInvObj',
                                details: getInvObj
                            });

                            var customer = search.lookupFields({
                                type: 'customer',
                                id: getInvObj.customer,
                                columns: ["custentity_mhl_customer_payment_mode"]
                            });

                            log.debug({
                                title: 'customer',
                                details: customer
                            });
                            var customerObj = {
                                "custentity_mhl_customer_payment_mode": ""
                            };
                            if (customer.custentity_mhl_customer_payment_mode && customer.custentity_mhl_customer_payment_mode.length > 0) {
                                customerObj.custentity_mhl_customer_payment_mode = customer.custentity_mhl_customer_payment_mode[0].text;
                            }

                            //log.debug("Customer mode", customer.custentity_mhl_customer_payment_mode)
                            if (customer.custentity_mhl_customer_payment_mode[0].text == 'Cash' || customer.custentity_mhl_customer_payment_mode[0].text == 'Co-payment') {

                                var i_paymentRecordId = paymentRecordFunction(content, customerObj, s_invData, getInvObj, jsonFile, fileName, getInvObj.customer);

                                if (i_paymentRecordId == '-383569') {
                                    jsonFile.folder = 383569; //VID Payment mode is not match
                                    var fileID = jsonFile.save();
                                } if (i_paymentRecordId == '-341975') {
                                    jsonFile.folder = 341975; //
                                    var fileID = jsonFile.save();
                                } else if (i_paymentRecordId) {
                                    jsonFile.folder = folderIds.VidProcessedPayment;
                                    var fileID = jsonFile.save();
                                }
                            } else {
                                //log.error("")
                                jsonFile.folder = 383570; // VID Non Cash Customer
                                var fileID = jsonFile.save();
                            }

                        } else {
                            jsonFile.folder = folderIds.VidProcessedPayment;
                            var fileID = jsonFile.save();
                            log.error("VID Already Paid", i_vid)
                        }
                    }
                } else {
                    jsonFile.folder = 4311; //VID Reprocess Error
                    var fileID = jsonFile.save();
                    log.error("VID Moved in Reprocess", i_vid)
                }

            } catch (er) {
                log.error({
                    title: 'reduce: error in creating records',
                    details: er
                });

            }
        }

        function paymentRecordFunction(filecontent, customer, InvId, invoiceRecord, jsonFile, fileName, custId) {
            try {
                var paymentInfo = GetObjVal(filecontent.PaymentInfo);
                //log.debug("paymentInfo",JSON.stringify(paymentInfo))
                if (paymentInfo.length > 0) {
                    for (var pay in paymentInfo) {
                        var tranRefObj = paymentInfo[pay];
                        if (tranRefObj) {

                            log.debug("invoiceRecord", JSON.stringify(invoiceRecord))
                            var AmountReceived = Number(tranRefObj.AmountReceived)
							log.debug("tranRefObj.",tranRefObj.PaymentMode)
                            if (tranRefObj.PaymentMode && tranRefObj.PaymentMode != '0' && tranRefObj.PaymentMode != '1') {

                                var payJSON = {
                                    "restlet": 1234,
                                    "payDate": invoiceRecord.trandate,
                                    "subsidiary": invoiceRecord.subsidiary,
                                    "invoiceId": InvId,
                                    "customerId": custId,
                                    "AmountReceived": Number(paymentInfo[pay].AmountReceived),
                                    "vidDate": invoiceRecord.trandate,
                                    "payMode": tranRefObj.PaymentMode,
                                    "vidNumber": invoiceRecord.custbody_mhl_invoice_vid_number,
                                    "orgVal": invoiceRecord.location,
                                    "departmentVal": invoiceRecord.department,
                                    "classmentVal": invoiceRecord.class,
                                    "unitVal": invoiceRecord.cseg_mhl_custseg_un,
                                    "paymentInfo": paymentInfo[pay],
                                    "custPayMode": customer.custentity_mhl_customer_payment_mode
                                }

                                
								log.debug("Customer Payment Mode",customer.custentity_mhl_customer_payment_mode)
                                if ((customer.custentity_mhl_customer_payment_mode == 'Cash' || customer.custentity_mhl_customer_payment_mode == 'Co-payment') && AmountReceived > 0) {
									//log.debug(" tranRefObj.custentity_mhl_customer_payment_mode ",customer.custentity_mhl_customer_payment_mode+" | AmountReceived "+AmountReceived);
                                    var paymentRecord = record.transform({
                                        fromType: record.Type.INVOICE,
                                        fromId: InvId,
                                        toType: record.Type.CUSTOMER_PAYMENT,
                                        isDynamic: false,
                                    });

                                    var searchId = paymentRecord.findSublistLineWithValue({
                                        sublistId: 'apply',
                                        fieldId: 'internalid',
                                        value: InvId
                                    });
									
									//log.debug("searchId ",searchId)
                                    if (searchId >= 0) {
                                        paymentRecord.setValue({
                                            fieldId: 'custbody_mhl_invoice_vid_number',
                                            value: invoiceRecord.custbody_mhl_invoice_vid_number
                                        });
                                     

                                        paymentRecord.setValue({
                                            fieldId: 'location',
                                            value: invoiceRecord.location
                                        });

                                       
                                        paymentRecord.setValue({
                                            fieldId: 'department',
                                            value: invoiceRecord.department
                                        });
                                        paymentRecord.setValue({
                                            fieldId: 'class',
                                            value: invoiceRecord.class
                                        });
                                        paymentRecord.setValue({
                                            fieldId: 'cseg_mhl_custseg_un',
                                            value: invoiceRecord.cseg_mhl_custseg_un
                                        });
                                        var accountInfo = FinedPaymentAccount(invoiceRecord, tranRefObj.PaymentMode);

                                        if (accountInfo) {

                                            paymentRecord.setValue({
                                                fieldId: 'undepfunds',
                                                value: 'F'
                                            });
                                            paymentRecord.setValue({
                                                fieldId: 'account',
                                                value: accountInfo
                                            });
                                            paymentRecord.setValue({
                                                fieldId: 'ccapproved',
                                                value: true
                                            });

                                        }

                                        var ObjPaymentMode = SetPaymentMode(tranRefObj);
										
										//log.debug("ObjPaymentMode ",ObjPaymentMode)
                                        if (ObjPaymentMode) {

                                            if (ObjPaymentMode.account) {
                                                paymentRecord.setValue({
                                                    fieldId: 'account',
                                                    value: ObjPaymentMode.account
                                                });
                                            }
                                            paymentRecord.setValue({
                                                fieldId: 'paymentmethod',
                                                value: ObjPaymentMode.paymentmethod || ""
                                            });
                                            paymentRecord.setValue({
                                                fieldId: 'memo',
                                                value: ObjPaymentMode.memo || ""
                                            });
                                        }

                                        var count = paymentRecord.getLineCount({
                                            sublistId: 'apply'
                                        });
                                        var lineNumber = paymentRecord.findSublistLineWithValue({
                                            sublistId: 'apply',
                                            fieldId: 'internalid',
                                            value: InvId
                                        });

                                        //log.audit('lineNumber', lineNumber);
                                        if (lineNumber >= 0) {
                                            paymentRecord.setSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'apply',
                                                line: lineNumber,
                                                value: true
                                            });
                                            paymentRecord.setSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'amount',
                                                line: lineNumber,
                                                value: Number(AmountReceived)
                                            });
										log.debug("Payment Record","Before Try")
											try
											{
												log.debug("Payment Record 1","Creation")
												var paymentId = paymentRecord.save();
												log.audit('paymentId', paymentId);
												return paymentId;
											}
											catch(err)
											{
												//log.audit("Payment Record","Rest Call")
												var s_response = restcall.restfun(payJSON);

												log.audit("MAP SCript s_response 1", s_response.body)

												//var resp = s_response.body;
												var resp = JSON.parse(s_response.body);
												log.debug("resp.RequestStatus 1",resp.RequestStatus)
												if (resp.RequestStatus == "Success") {
													log.audit("resp.paymentId",resp.paymentId)
													return resp.paymentId;
												} else {
													log.error("resp 1",resp)
													return "-341975";
												}
											}
                                        }
                                    }
									else
									{
										//log.audit("Payment Record 2","Rest Call")
										var s_response = restcall.restfun(payJSON);

										log.audit("MAP Script s_response 2", s_response.body)

										var resp = JSON.parse(s_response.body);
										
										log.debug("resp.RequestStatus 2",resp.RequestStatus)

										if (resp.RequestStatus == "Success") {
											log.audit("resp.paymentId",resp.paymentId)
											return resp.paymentId;
										} else {
											log.error("resp 2",resp)
											return "-341975";
										}
									}
                                } 
                            } else {
								log.debug("Payment Mode",tranRefObj.PaymentMode)
                                return "-383569";
                            }
                        }
                    }
                }
            } catch (e) {
                log.error({
                    title: 'reduce: error in creating Payment records',
                    details: e
                });
                createRnIRecord(e, fileName, jsonFile)
            }
        }

        function SetPaymentMode(tranRefObj) {
            var ObjPaymentMemo = {
                "memo": tranRefObj.ChequeorCardNumber || tranRefObj.transactionId
            };
            if (tranRefObj.PaymentMode == '3') // Card payment
            {
                ObjPaymentMemo.account = paymentAccount;
                ObjPaymentMemo.paymentmethod = "2";
                ObjPaymentMemo.memo = tranRefObj.transactionId;
            } else if (tranRefObj.PaymentMode == '2') // Cheque
            {
                ObjPaymentMemo.paymentmethod = "3";
            } else if (tranRefObj.PaymentMode == '13' || tranRefObj.PaymentMode == '32' || tranRefObj.PaymentMode == '34') // NEFT/RTGS
            {
                ObjPaymentMemo.paymentmethod = "7";
                ObjPaymentMemo.memo = tranRefObj.transactionId;
            } else if (tranRefObj.PaymentMode == '12') // M swipe
            {
                ObjPaymentMemo.paymentmethod = "9";
                ObjPaymentMemo.memo = tranRefObj.transactionId;
            } else if (tranRefObj.PaymentMode == '10') // Coupne
            {
                ObjPaymentMemo.paymentmethod = "10";
                ObjPaymentMemo.memo = tranRefObj.transactionId;
            } else if (tranRefObj.PaymentMode == '4') // DD
            {
                ObjPaymentMemo.paymentmethod = "12";
            } else if (tranRefObj.PaymentMode == '5') // UPI
            {
                ObjPaymentMemo.paymentmethod = "13";

            } else if (tranRefObj.PaymentMode == '6') // CNP
            {
                ObjPaymentMemo.paymentmethod = "14";

            } else if (tranRefObj.PaymentMode == '7') // wallet
            {
                ObjPaymentMemo.paymentmethod = "15";

            } else if (tranRefObj.PaymentMode == '8') // Amex
            {
                ObjPaymentMemo.paymentmethod = "16";
            } else if (tranRefObj.PaymentMode == '9') // DINERS
            {
                ObjPaymentMemo.paymentmethod = "17";
            } else if (tranRefObj.PaymentMode == '11') // Credit Note
            {
                ObjPaymentMemo.paymentmethod = "18";
            } else if (tranRefObj.PaymentMode == '28') // Credit Note
            {
                ObjPaymentMemo.paymentmethod = "19";
            }
            return ObjPaymentMemo;

        }

        function FinedPaymentAccount(invoiceRecord, paymentMode) {

            log.debug({
                title: 'FinedPaymentAccount',
                details: paymentMode
            });

            //, 'AND',["custrecord_mhl_payment_mode", "anyof", paymentMode]

            var accountSearch = search.create({
                type: 'customrecord_payment_account_mapping',
                columns: ['custrecord_payment_account'],
                filters: [
                    ['custrecord_payment_subsidiary', 'is', invoiceRecord.subsidiary], 'AND', ['custrecord_payment_org', 'is', invoiceRecord.location]
                ]
            });

            var searchResult = accountSearch.run().getRange({
                start: 0,
                end: 1
            });

            if (searchResult && searchResult.length > 0) {
                return searchResult[0].getValue({
                    name: 'custrecord_payment_account'
                });
            }
        }

        function GetObjVal(ObjV) {
            var ObjList = [];
            if (ObjV) {
                if (Array.isArray(ObjV)) {
                    ObjList = ObjV;
                } else {
                    ObjList.push(ObjV);
                }
            }
            return ObjList;
        }

        function summarize(summary) {

            try {
                var mapKeysProcessed = 0;
                summary.mapSummary.keys.iterator().each(function (key, executionCount, completionState) {

                    if (completionState === 'COMPLETE') {
                        mapKeysProcessed++;
                    }
                    return true;
                });
                log.audit({
                    title: 'Map key statistics',
                    details: 'Total number of map keys processed successfully: ' + mapKeysProcessed
                });
            } catch (e) {
                log.error({
                    title: 'Error Occured in Summary function',
                    details: e
                });
            }

        }

        ///////////////////////////////////////////////////////////

        function searchInvoice(vid) {
            ////log.debug({title:'vid ',details:vid});
            var invDetFilter = [];
            // code updated for Filter of Search on 1 Sept As CMS is getting error custbody_mhl_invoice_vid_number/externalid for invalid operator
            invDetFilter.push(search.createFilter({
                name: 'mainline',
                operator: search.Operator.IS,
                values: 'T'
            }));

            if (vid) {
                invDetFilter.push(search.createFilter({
                    name: 'custbody_mhl_invoice_vid_number',
                    operator: search.Operator.IS,
                    values: vid
                }));

                /*  invDetFilter.push(search.createFilter({
                     name: 'status',
                     operator: search.Operator.ANYOF,
                     values: 'CustInvc:A'
                 })); */

                invDetFilter.push(search.createFilter({
                    name: 'type',
                    operator: search.Operator.ANYOF,
                    values: 'CustInvc'
                }));

                invDetFilter.push(search.createFilter({
                    name: 'externalid',
                    operator: search.Operator.IS,
                    values: "inv_" + vid
                }));
            } else {
                log.error('VID not found for VID number and External ID Search criteria');
            }

            var vidSearch = search.create({
                type: search.Type.INVOICE,
                columns: ['internalid', 'custbody_mhl_inv_payment_mode', 'entity', 'location', 'department'],
                filters: invDetFilter
            });

            //			[				['custbody_mhl_invoice_vid_number', 'is', vid], 'AND',['externalid', 'is', vid], 'AND', ['mainline', 'is', 'T'] 			]
            var invResultSet = vidSearch.run();

            var invResultRange = invResultSet.getRange({
                start: 0,
                end: 1
            });
            ////log.debug({title:'invResultRange ',details:invResultRange});

            if (invResultRange.length > 0) {
                ////log.debug({title:'Tranid found ',details:invResultRange[0]});
                return invResultRange[0].getValue({
                    name: 'internalid'
                });
            } else {
                return '';
            }
        }
        ///////////////////////////////////////////////////////////

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

        function createRnIRecord(e, fileName, fileObj, folderId) {
            var rnIRec = record.create({
                type: 'customrecord_rni_integration_status'
            });

            rnIRec.setValue({
                fieldId: 'custrecord_json_type',
                value: '1'
            });
            rnIRec.setValue({
                fieldId: 'custrecord_error_description',
                value: e.toString()
            });
            rnIRec.setValue({
                fieldId: 'custrecord_json_file',
                value: fileName
            });
            rnIRec.setValue({
                fieldId: 'custrecord_processed',
                value: '2'
            });
            rnIRec.save();
            if (folderId && fileObj) {
                fileObj.folder = folderId;
                fileObj.save();
            }

        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });