//Backup Script 09-05-2023

/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: [RS]MHL YIL Bill Payment Details
 * File Name:
 * Created On: 09/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Send Vendor Bill payment to Stockone
 *********************************************************** */

//Working script

/* {
   "startDate":"1/9/2022",
   "endDate":"30/9/2022",
   "clientCode":"2105L0063",
   "locationCode":"84"
}
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/format', 'N/record', 'N/runtime', 'N/search', 'N/url', './accenturelib', './searchlib'],

    function(file, format, record, runtime, search, url, accenturelib, searchlib) {

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
                var recordType = "VMS Payment Details";
                var partnerJson = requestBody;

                var Request = JSON.stringify(partnerJson);
                var Status;
                var Response;

                var s_date = partnerJson.startDate;
                var e_date = partnerJson.endDate;
                //rectype = Billpayment
                //rectype = Advance

                log.debug("Start Date -->", s_date);
                log.debug("End Date -->", e_date);

                var formatedSdate = format.format({
                    value: s_date,
                    type: format.Type.DATE
                });
                log.debug("Formated Start Date -->", formatedSdate);

                var formatedEdate = format.format({
                    value: e_date,
                    type: format.Type.DATE
                });
                log.debug("Formated End Date -->", formatedEdate);

                var vendorpaymentSearchObj = search.create({
                    type: "vendorpayment",
                    filters: [
                        ["type", "anyof", "VendPymt"],
                        "AND",
                        ["trandate", "within", formatedSdate, formatedEdate],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["approvalstatus", "anyof", "2"] 
						//,"AND", 
						//["internalidnumber","equalto","86064658"]	//Multiple
						//["internalidnumber","equalto","73707597"] //Single
						
						/* 
                       // ["internalidnumber", "equalto", "60157201"]
						["internalid", "anyof","60157201","60158201"] */
                    ],
                    columns: [
                        search.createColumn({
                            name: "transactionnumber",
                            label: "Transaction ID"
                        }),
                        search.createColumn({
                            name: "trandate",
                            label: "Transaction Date"
                        }),
                        search.createColumn({
                            name: "entityid",
                            join: "vendor",
                            label: "Vendor ID"
                        }),
                        search.createColumn({
                            name: "altname",
                            join: "vendor",
                            label: "Vendor Name"
                        }),
                        search.createColumn({
                            name: "memomain",
                            label: "UTR NO/CHEQUE"
                        }),
                        search.createColumn({
                            name: "amount",
                            label: "Transaction Amount Paid"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            label: "Type of Payment"
                        }),
                        search.createColumn({
                            name: "transactionnumber",
                            join: "appliedToTransaction",
                            label: "Invoice Posting Trans Number"
                        }),
                        search.createColumn({
                            name: "trandate",
                            join: "appliedToTransaction",
                            label: "Invoice Date"
                        }),
                        search.createColumn({
                            name: "tranid",
                            join: "appliedToTransaction",
                            label: "Vendor invoice Number"
                        }),
                        search.createColumn({
                            name: "custbody_mhl_vb_vendorinvoicedate",
                            join: "appliedToTransaction",
                            label: "Vendor Invoice Date"
                        }),
                        search.createColumn({
                            name: "custbody_mhl_grn_srn_no",
                            join: "appliedToTransaction",
                            label: "GRN.SRN NO"
                        }),
                        search.createColumn({
                            name: "amount",
                            join: "appliedToTransaction",
                            label: "Invoice Amount"
                        }),
						search.createColumn({name: "appliedtolinkamount", label: "Payment Amount"})
                    ]
                });

                var resultSet = searchlib.mySearch(vendorpaymentSearchObj);
                //log.audit("Result Set ->", resultSet);

                //var invArray = [];
                var paymentArray = [];
                var tranArray = [];

                if (vendorpaymentSearchObj) {
                    for (var i = 0; i < resultSet.length; i++) {
                        var tran_number = resultSet[i].getValue({
                            name: "transactionnumber",
                            label: "Transaction ID"
                        });
                       // log.debug("Transaction Number ---->", tran_number);

                        var tran_date = resultSet[i].getValue({
                            name: "trandate",
                            label: "Transaction Date"
                        });
                        //log.debug("Transaction Date ---->", tran_date);
						
						var formatedTdate;
						if(tran_date){
							formatedTdate = format.format({
								value: tran_date,
								type: format.Type.DATE
							});
							//log.debug("Formated Tran Date -->", formatedTdate);
						}
                        var ven_id = resultSet[i].getValue({
                            name: "entityid",
                            join: "vendor",
                            label: "Vendor ID"
                        });
                       // log.debug("Vendor Id ---->", ven_id);

                        var ven_name = resultSet[i].getValue({
                            name: "altname",
                            join: "vendor",
                            label: "Vendor Name"
                        });
                        //log.debug("Vendor Name ---->", ven_name);

                        var tran_ref_num = resultSet[i].getValue({
                            name: "memomain",
                            label: "UTR NO/CHEQUE"
                        });
                        //log.debug("Transaction Ref Num ---->", tran_ref_num);

                        var paid_amt = resultSet[i].getValue({
                            name: "amount",
                            label: "Transaction Amount Paid"
                        });
                        //log.debug("Paid Amount ---->", paid_amt * (-1));

                        paid_amt = paid_amt * (-1);

                        var pay_type = resultSet[i].getValue({
                            name: "formulatext",
                            label: "Type of Payment"
                        });
                        //log.debug("Payment Type ---->", pay_type);

                        var inv_tran_number = resultSet[i].getValue({
                            name: "transactionnumber",
                            join: "appliedToTransaction",
                            label: "Transaction Number"
                        });
                        //log.debug("Invoice Derails Tran Number ---->", inv_tran_number);

                        var inv_tran_date = resultSet[i].getValue({
                            name: "trandate",
                            join: "appliedToTransaction",
                            label: "Date"
                        });
                        //log.debug("Invoice Derails Inv Tran Date ---->", inv_tran_date);

						var formatedInvTdate;
						if(tran_date){
							formatedInvTdate = format.format({
								value: tran_date,
								type: format.Type.DATE
							});
							//log.debug("Formated Inv Tran Date -->", formatedInvTdate);
						}
                        var inv_doc_number = resultSet[i].getValue({
                            name: "tranid",
                            join: "appliedToTransaction",
                            label: "Document Number"
                        });
                       // log.debug("Invoice Derails Inv Doc Num ---->", inv_doc_number);
						//var finalDocNum = ''+inv_doc_number.toString()+''
						
                        //log.debug("Invoice Derails Inv Doc Num ---->", inv_doc_number.toString());
						//NOV13\\MANGE FEES
					
                        var inv_date = resultSet[i].getValue({
                            name: "custbody_mhl_vb_vendorinvoicedate",
                            join: "appliedToTransaction",
                            label: "Vendor Invoice date"
                        });
                        //log.debug("Invoice Derails Inv Date ---->", inv_date);
						
						var formatedVenInvTdate;
						if(inv_date){
							formatedVenInvTdate = format.format({
								value: inv_date,
								type: format.Type.DATE
							});
							//log.debug("Formated Ven Inv Date -->", formatedVenInvTdate);
						}

                        var inv_grn_no = resultSet[i].getText({
                            name: "custbody_mhl_grn_srn_no",
                            join: "appliedToTransaction",
                            label: "GRN/SRN No."
                        });
                       // log.debug("Invoice GRN/SRN ---->", inv_grn_no);

                        var inv_amt_parent = resultSet[i].getValue({
                            name: "amount",
                            join: "appliedToTransaction",
                            label: "Amount"
                        });
                       // log.debug("Invoice Amount ---->", inv_amt);

					   var inv_amt = resultSet[i].getValue({
                           name: "appliedtolinkamount", label: "Payment Amount"
                        });
                       //log.debug("Invoice Amount ---->", inv_amt);
						
						//if (paymentArray.indexOf(tran_number))
						//var invArray = [];
						if(tranArray.indexOf(tran_number) == -1){
							var invArray = [];
						}
						var invoicePayJson = {
							"invPostingTranNum": inv_tran_number,
							"invoiceDate": formatedInvTdate,
							"venInvoiceNumber": inv_doc_number,
							"venInvoiceDate": formatedVenInvTdate,
							"grnNumber": inv_grn_no,
							"invoiceAmount": inv_amt,
							"tranNumber": tran_number
						};
						invArray.push(invoicePayJson);
						
						//log.debug("inArray==>",invArray);

						var billPayJson = {
							"tranNumber": tran_number,
							"tranDate": formatedTdate,
							"vendorId": ven_id,
							"vendorName": ven_name,
							"tranRefNoPo": tran_ref_num,
							"tranPaidAmt": paid_amt,
							"paymentType": "Against Invoice",
							"invoiceDetail": invArray
						};
						
						
						if(tranArray.indexOf(tran_number) == -1){
							//var invArray = [];
							tranArray.push(tran_number);
							paymentArray.push(billPayJson);
							
						}else{
							paymentArray[tranArray.indexOf(tran_number)] = billPayJson;
						}
						
						//log.debug("tranArray",tranArray);
						//log.debug("Final Arrray->",paymentArray["tranNumber"])
						//if(paymentArray["tranNumber"])
						//paymentArray.push(billPayJson);
						
                    }

					log.audit("paymentArray-->", paymentArray);
					
                    return paymentArray;
                }
            } catch (e) {
                log.error("Restlet error", JSON.stringify(e));
                return ({
                    RequestStatus: 'Failed',
                    "message": e.message
                });
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