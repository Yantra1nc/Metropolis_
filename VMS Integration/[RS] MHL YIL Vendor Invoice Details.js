//Backup Script 09-05-2023

/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: [RS] MHL YIL Vendor Invoice Details
 * File Name:
 * Created On: 09/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Send Vendor Invoice to Stockone
 *********************************************************** */

//Working script

/*{
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
				log.debug("partnerJson",partnerJson);

                var Request = JSON.stringify(partnerJson);
                var Status;
                var Response;

                var s_date = partnerJson.AsofDate;
                //var s_date = partnerJson.startDate;
				//var e_date = partnerJson.endDate;
                //rectype = Billpayment
                //rectype = Advance

               // log.debug("Start Date -->", s_date);
               // log.debug("End Date -->", e_date);

                var formatedSdate = format.format({
                    value: s_date,
                    type: format.Type.DATE
                });
                log.debug("Formated Start Date -->", formatedSdate);

              /*   var formatedEdate = format.format({
                    value: e_date,
                    type: format.Type.DATE
                });
                log.debug("Formated End Date -->", formatedEdate); */

				var vendorbillSearchObj = search.create({
				   type: "vendorbill",
				   /* filters:
				   [
					  ["type","anyof","VendBill"], 
					  //"AND",["trandate","onorbefore",formatedSdate], 
					  "AND", 
					  ["mainline","is","T"], 
					  "AND", 
					  ["status","anyof","VendBill:A"],
					  "AND", 
					  ["datecreated","within",formatedSdate,formatedEdate]
				   ], */
				    filters:
					[
					  ["type","anyof","VendBill"], 
					  "AND", 
					  ["mainline","is","T"], 
					  "AND", 
					  ["status","anyof","VendBill:A"], 
					  "AND", 
					  ["trandate","onorbefore",formatedSdate], 
					  "AND", 
					  ["subsidiary","anyof","5"]
				   ],
				   columns:
				   [
					  search.createColumn({
						 name: "transactionnumber",
						 summary: "GROUP",
						 label: "Invoice Trans_Number"
					  }),
					  search.createColumn({
						 name: "trandate",
						 summary: "GROUP",
						 sort: search.Sort.ASC,
						 label: "Invoice Trans_ Date"
					  }),
					  search.createColumn({
						 name: "tranid",
						 summary: "GROUP",
						 label: "Vendor’s Invoice Number/ID"
					  }),
					  search.createColumn({
						 name: "custbody_mhl_vb_vendorinvoicedate",
						 summary: "GROUP",
						 label: "Vendor Invoice Date"
					  }),
					  search.createColumn({
						 name: "duedate",
						 summary: "GROUP",
						 label: "Invoice Due Date"
					  }),
					  search.createColumn({
						 name: "createdfrom",
						 summary: "GROUP",
						 label: "PO Number"
					  }),
					  search.createColumn({
						 name: "custbody_mhl_grn_srn_no",
						 summary: "MAX",
						 label: "GRN NUMBER"
					  }),
					  search.createColumn({
						 name: "trandate",
						 join: "CUSTBODY_MHL_GRN_SRN_NO",
						 summary: "GROUP",
						 label: "GRN Date"
					  }),
					  search.createColumn({
						 name: "fxamount",
						 summary: "AVG",
						 label: "Amount (Foreign Currency)"
					  }),
					  search.createColumn({
						 name: "fxamountremaining",
						 summary: "AVG",
						 label: "Amount Remaining (Foreign Currency)"
					  })
				   ]
				});
					
					var resultSet = searchlib.mySearch(vendorbillSearchObj);
					//log.audit("Result Set ->", resultSet.length);
					
					var invoiceArray = [];

					if (vendorbillSearchObj) {
						for (var i = 0; i < resultSet.length; i++) {
							var tran_number = resultSet[i].getValue({
								name: "transactionnumber",
								summary: "GROUP",
								label: "Invoice Trans_Number"
							});
							//log.debug("Invoice Trans_Number ---->", tran_number);
							
							var tran_date = resultSet[i].getValue({
								name: "trandate",
								summary: "GROUP",
								sort: search.Sort.ASC,
								label: "Invoice Trans_ Date"
							});
							//log.debug("Transaction Date ---->", tran_date);

							var formatedTdate;
							if(tran_date){
								formatedTdate = format.format({
									value: tran_date,
									type: format.Type.DATE
								});
							}
							//log.debug("Formated Tran Date -->", formatedTdate);
							
							var ven_inv_num_id = resultSet[i].getValue({
								name: "tranid",
								summary: "GROUP",
								label: "Vendor’s Invoice Number/ID"
							});
							//log.debug("Vendor’s Invoice Number/ID ---->", ven_inv_num_id);
							
							var inv_date = resultSet[i].getValue({
								name: "custbody_mhl_vb_vendorinvoicedate",
								summary: "GROUP",
								label: "Vendor Invoice Date"
							});
							//log.debug("Invoice Derails Inv Date ---->", inv_date);
							
							var formatedVenInvTdate;
							if(inv_date){
								formatedVenInvTdate = format.format({
									value: inv_date,
									type: format.Type.DATE
								});
							}
							//log.debug("Formated Ven Inv Date -->", formatedVenInvTdate);
							
							var inv_due_date = resultSet[i].getValue({
								 name: "duedate",
								 summary: "GROUP",
								 label: "Invoice Due Date"
							});
							//log.debug("Invoice Derails Inv Tran Date ---->", inv_due_date);

							var formatedVenInvDueTdate;
							if(inv_due_date){
								formatedVenInvDueTdate = format.format({
									value: inv_due_date,
									type: format.Type.DATE
								});
							}
							//log.debug("Formated Ven Inv Due Date -->", formatedVenInvDueTdate);
							
							var po_number = resultSet[i].getText({
								name: "createdfrom",
								summary: "GROUP",
								label: "PO Number"
							});
							//log.debug("PO Number ---->", po_number);
							
							var grn_number = resultSet[i].getValue({
								name: "custbody_mhl_grn_srn_no",
								summary: "MAX",
								label: "GRN NUMBER"
							});
							//log.debug("GRN Number ---->", grn_number);
							
							var grn_date = resultSet[i].getValue({
								name: "trandate",
								join: "CUSTBODY_MHL_GRN_SRN_NO",
								summary: "GROUP",
								label: "GRN Date"
							});
							//log.debug("GRN Date ---->", grn_date);
							
							var formatedGrnTdate;
							if(grn_date){
								formatedGrnTdate = format.format({
									value: grn_date,
									type: format.Type.DATE
								});
							}
							//log.debug("Formated GRN Date -->", formatedGrnTdate);
							
							var inv_damount = resultSet[i].getValue({
								name: "fxamount",
								summary: "AVG",
								label: "Amount (Foreign Currency)"
							});
							//log.debug("Amount (Foreign Currency) ---->", inv_damount);
							
							var inv_amount_rem = resultSet[i].getValue({
								name: "fxamountremaining",
								summary: "AVG",
								label: "Amount Remaining (Foreign Currency)"
							});
							//log.debug("Amount Remaining (Foreign Currency ---->", inv_amount_rem);  
							
							var venInvoiceJson = {
								"tranNumber": tran_number,
								"tranDate": formatedTdate,
								"vendorInvNumId": ven_inv_num_id,
								"invDate": inv_date,
								"invDueDate": formatedVenInvDueTdate,
								"poNumber": po_number,
								"grnNumber":grn_number,
								"grnDate":formatedGrnTdate,
								"invAmount":inv_damount,
								"remainingAmount":inv_amount_rem
							};
						
							invoiceArray.push(venInvoiceJson);
							//log.audit("Invoice Array-->", invoiceArray);
							
							
						}
						log.audit("Final Invoice Array-->", invoiceArray);
						
						return invoiceArray;
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