/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: MHL REST Sister lab payment knockoff
 * File Name: MHL_RESTLet_Sisterlab_Knockoff_payment.js
 * Created On: 04/02/2022
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: Sister lab payment knockoff
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
                log.audit("payJSON", " payJSON Stringify " + JSON.stringify(payJSON))
				
				//return true;

                var testWiseInvRecId = payJSON.testWiseInvRecId;
                var invoiceId = payJSON.invoiceId;
                var costBookingId = payJSON.costBookingId;
                var processingOrg = payJSON.processingOrg;
                var s_inv_tran_date = payJSON.s_inv_tran_date;
                var i_inv_posting_period = payJSON.i_inv_posting_period;
                var amount = payJSON.amount;

                //function paymentApply(testWiseInvRecId, invoiceId, costBookingId, processingOrg, s_inv_tran_date, i_inv_posting_period, amount) 

                var paymentObj = record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: Number(invoiceId),
                    toType: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });

                var flag = 0;
				
				
				 var visitDate = new Date(s_inv_tran_date)
                    var payDate = visitDate.getDate();
                    var month = Number(visitDate.getMonth());
                    var year = visitDate.getFullYear();
                    var tempDate = new Date();
                    tempDate.setDate(payDate);
                    tempDate.setMonth(month);
                    tempDate.setFullYear(year);

                    paymentObj.setValue({
                        fieldId: 'trandate',
                        value: tempDate
                    });
               
             /*   paymentObj.setValue({
                    fieldId: 'postingperiod',
                    value: i_inv_posting_period
                });*/
                paymentObj.setValue({
                    fieldId: 'location',
                    value: processingOrg
                });

                var i_line_inv = paymentObj.findSublistLineWithValue({
                    sublistId: 'apply',
                    fieldId: 'internalid',
                    value: Number(invoiceId)
                });
                log.debug('payment i_line_inv', i_line_inv);
                // paymentObj.setValue({fieldId:'apply_Transaction_TRANDATE',value:s_inv_tran_date});
                var i_applyCount = paymentObj.getLineCount({
                    sublistId: 'apply'
                });
                for (var inv = 0; inv < i_applyCount; inv++) {
                    paymentObj.selectLine({
                        sublistId: 'apply',
                        line: inv
                    });
                    var i_applyInvId = paymentObj.getCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid'
                    });
                    //log.debug('payment i_applyInvId',);
                    if (i_applyInvId == invoiceId) {
                        log.debug('payment match', 'match ' + i_applyInvId);
                        paymentObj.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            value: true
                        });
                        paymentObj.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'amount',
                            value: Number(amount)
                        });

                        paymentObj.commitLine({
                            sublistId: 'apply'
                        });
                        break;
                    }
                }

                var creditCount = paymentObj.getLineCount({
                    sublistId: 'credit'
                });
				log.debug("creditCount",creditCount)
				
				
				 var i_line_costBookingId = paymentObj.findSublistLineWithValue({
                    sublistId: 'credit',
                    fieldId: 'internalid',
                    value: Number(costBookingId)
                });
                log.debug('payment i_line_costBookingId', i_line_costBookingId);
                for (var t = 0; t < creditCount; t++) {
                    paymentObj.selectLine({
                        sublistId: 'credit',
                        line: t
                    });
                    var costId = paymentObj.getCurrentSublistValue({
                        sublistId: 'credit',
                        fieldId: 'internalid'
                    });
                    //log.debug('payment-->costId',costId);
                    //log.debug('payment-->costBookingId',costBookingId);
                    if (costId == costBookingId) {
                        log.debug('payment-->costId',costId);
                        //log.debug('payment-->costBookingId',costBookingId);

                        paymentObj.setCurrentSublistValue({
                            sublistId: 'credit',
                            fieldId: 'apply',
                            value: true
                        });

                        paymentObj.commitLine({
                            sublistId: 'credit'
                        });
                        flag = 1;
                    }
                }
                if (flag == 1) {
                    //CR@ 3 Nov 2020
                    paymentObj.setValue({
                        fieldId: 'custbody_mhl_inter_co_auto_transaction',
                        value: true
                    });
                    var f_payment_amount = paymentObj.getValue({
                        fieldId: 'payment'
                    });
                    //log.debug('2 f_payment_amount',f_payment_amount)
                    var paymentId = paymentObj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.audit('Credit Applied to Payment', paymentId);
                   return {
						RequestStatus: 'Success',
						fileStoredInNS: 'Yes',
						Details: 'File Processed in NetSuite ID :' + paymentId,
						"paymentId": paymentId
					};
                } else {
                    log.debug('apply payment', 'Credit Not found');
                    record.submitFields({
                        type: 'customrecord_mhl_invoice_testwise_detail',
                        id: testWiseInvRecId,
                        values: {
                            custrecord_mhl_error_detail: 'Applying payment Credit Not found. Apply Count is ' + creditCount
                        },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        }
                    });
					 return {
						RequestStatus: 'Failed',
						fileStoredInNS: 'No',
						Details: 'Credit Not found:'
					};
                    //return 'Credit Not found';
                }

               
            } catch (e) {
                log.error('On Payment creation Error occured ' + testWiseInvRecId, e);
                record.submitFields({
                    type: 'customrecord_mhl_invoice_testwise_detail',
                    id: testWiseInvRecId,
                    values: {
                        custrecord_mhl_error_detail: 'On Payment creation Error occured: ' + e.message
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });
                //return e.message;
                return {
                    RequestStatus: 'Error',
                    fileStoredInNS: 'No',
                    Details: e.message
                };
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