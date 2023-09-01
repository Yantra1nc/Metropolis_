//Backup Script 09-05-2023

/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: [RS] MHL YIL Ven Adv PO and Non PO Details
 * File Name:
 * Created On: 15/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Send Ven Adv PO and Non PO Details to Stockone
 *********************************************************** */

//Working script
//Vendor Advance Non PO Based - working

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
				
				var transactionSearchObj = search.create({
				   type: "transaction",
				   filters:
				    [
					  ["type","anyof","CuTrPrch150","Custom125"], 
					  "AND", 
					  ["mainline","is","T"], 
					  "AND", 
					  ["status","anyof","CuTrPrch150:D","Custom125:E"], 
					  "AND", 
					  ["trandate","within","01/01/2023","31/01/2023"], 
					  //["trandate","within",formatedSdate,formatedEdate]
					  //,"AND", 
					  //["internalidnumber","equalto","122552"]
					  //["internalidnumber","equalto","1959864"]
					  //["internalid","anyof","119646","1959864"]
				   ],
				   columns:
				   [
					  search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
					  search.createColumn({name: "trandate", label: "Date"}),
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
					  search.createColumn({name: "tranid", label: "Document Number"}),
					  search.createColumn({name: "amount", label: "Amount"}),
					  search.createColumn({name: "type", label: "Type"})
				   ]
				});

			
                var resultSet = searchlib.mySearch(transactionSearchObj);
                //log.audit("Result Set 173->", resultSet);

                //var invArray = [];
                var paymentArray = [];

                if (transactionSearchObj) {
                    for (var i = 0; i < resultSet.length; i++) {
                        var tran_number = resultSet[i].getValue({
                            name: "transactionnumber",
                            label: "Transaction ID"
                        });
                        //log.debug("Transaction Number ---->", tran_number);

                        var tran_date = resultSet[i].getValue({
                            name: "trandate",
                            label: "Transaction Date"
                        });
                        //log.debug("Transaction Date ---->", tran_date);

                        var formatedTdate = format.format({
                            value: tran_date,
                            type: format.Type.DATE
                        });
                        //log.debug("Formated Tran Date -->", formatedTdate);

                        var ven_id = resultSet[i].getValue({
                            name: "entityid",
                            join: "vendor",
                            label: "Vendor ID"
                        });
                        //log.debug("Vendor Id ---->", ven_id);

                        var ven_name = resultSet[i].getValue({
                            name: "altname",
                            join: "vendor",
                            label: "Vendor Name"
                        });
                        //log.debug("Vendor Name ---->", ven_name);
						
						var document_number = resultSet[i].getValue({
                           name: "tranid", label: "Document Number"
                        });
                        //log.debug("Document Number ---->", document_number);
						
						 var pay_type = resultSet[i].getText({
                            name: "type", label: "Type"
                        });
                        //log.debug("Payment Type ---->", pay_type);

                        var paid_amt = resultSet[i].getValue({
                            name: "amount",
                            label: "Transaction Amount Paid"
                        });
                        //log.debug("Paid Amount ---->", paid_amt * (-1));
						
						if(pay_type == "Vendor Advance Non PO Based"){
							paid_amt = paid_amt * (-1);
						}else{
							paid_amt = paid_amt;
						}

						var billPayJson = {
							"tranNumber": tran_number,
							"tranDate": formatedTdate,
							"vendorId": ven_id,
							"vendorName": ven_name,
							"docNumber": document_number,
							"tranPaidAmt": paid_amt,
							"paymentType":pay_type
						};
						
						paymentArray.push(billPayJson);
						
					
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