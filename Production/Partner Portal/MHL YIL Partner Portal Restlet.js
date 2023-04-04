/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: MHL YIL Partner Portal Restlet (Production)
 * File Name: MHL YIL Partner Portal Restlet.js
 * Created On: 17/10/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Send Invoice details & pdf url to partner portal
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
define(['N/file', 'N/format', 'N/record', 'N/runtime', 'N/search','N/url', './accenturelib'],

    function (file, format, record, runtime, search, url, accenturelib) {

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
                var recordType = "PartnerPortal";
                var partnerJson = requestBody;
                
                var Request = JSON.stringify(partnerJson);
                var Status;
                var Response;
				
				
                var s_date = partnerJson.startDate;
                var e_date = partnerJson.endDate;
				var client_code   = partnerJson.clientCode;
                var location_code = partnerJson.locationCode; //213
                //var loc_name = partnerJson.locationCode; //213
				
				var orgIntId;
				
				var locationSearchObj = search.create({
				   type: "location",
				   filters:
				   [
					  ["custrecord_mhl_mds_lims_org_id","is",location_code]
					  //["name","is", loc_name]
				   ],
				   columns:
				   [
					  search.createColumn({name: "internalid", label: "Internal ID"})
				   ]
				});
				
				var searchResultCount = locationSearchObj.runPaged().count;
				log.debug("locationSearchObj result count",searchResultCount);
				locationSearchObj.run().each(function(result){
				   // .run().each has a limit of 4,000 results
				   
				orgIntId = result.getValue({
				   name: "internalid", label: "Internal ID"
				});
				   
				   return true;
				});
				
				log.audit("orgIntId-->", orgIntId);

			
				/* var o_vp_rec = record.load({
                    type: 'location',
                    id: orgIntId,
                    isDynamic: true
                });
				
				var org_id = o_vp_rec.getValue({
					fieldId: 'custrecord_mhl_mds_lims_org_id'
				});
				log.debug("org_id -->", org_id); //213 */
				
				
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
				
				
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["trandate", "within", formatedSdate, formatedEdate],
                            "AND",
                            ["customer.entityid", "is", client_code],
                            "AND",
                            ["location", "anyof", orgIntId], 
							"AND", 
							["mainline","is","T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "tranid", label: "DOC.NO." }),
                            search.createColumn({ name: "startdate", label: "START DATE" }),
                            search.createColumn({ name: "enddate", label: "END DATE" }),
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "custbody_b2b_conso_pdf", label: "Consolidate PDF" }),
                            search.createColumn({ name: "postingperiod", label: "Period" }),
							search.createColumn({name: "internalid", label: "Internal ID"}),
							search.createColumn({name: "custbody_mhl_b2b_doc_number", label: "DOCUMENT NUMBER"}),
                        ]
                });
               
			   var resultSet = invoiceSearchObj.run().getRange({ start: 0, end: 1000 });
			   //log.audit("Result Set ->", resultSet);
			   
			   if (resultSet != null && resultSet != '' && resultSet != ' ') {
                    var completeResultSet = resultSet;
                    var start = 1000;
                    var last = 2000;

                    while (resultSet.length == 1000) {
                        resultSet = invoiceSearchObj.run().getRange(start, last);
                        completeResultSet = completeResultSet.concat(resultSet);
                        start = parseFloat(start) + 1000;
                        last = parseFloat(last) + 1000;

                        //log.debug("Input Call","start "+start)
                    }
                    resultSet = completeResultSet;
                    if (resultSet) {
                        log.debug('In getInputData_savedSearch: resultSet: ' + resultSet.length);
                    }
                }
				
				var invArray = [];
				
                if (invoiceSearchObj) 
				{
					for (var i = 0; i < resultSet.length; i++)
					{
						var tran_number = resultSet[i].getValue({
							name: 'tranid'
						});
						log.debug("Transaction Number ---->", tran_number);
						
						var internalId = resultSet[i].getValue({
							name: 'internalid'
						});
						log.debug("Internal Id ---->", internalId);
						
						var start_date = resultSet[i].getValue({
							name: 'startdate'
						});
						log.debug("start_date --->", start_date);
						
						if(start_date){
							var formatedSdate = format.format({
								value: start_date,
								type: format.Type.DATE
							});
							log.debug("formated Start date -->", formatedSdate);		
						}
						
						var end_date = resultSet[i].getValue({
							name: 'enddate'
						});
						log.debug("end_date --->", end_date);
						
						if(end_date){
							var formatedEdate = format.format({
								value: end_date,
								type: format.Type.DATE
							});
							log.debug("formated End date -->", formatedEdate);		
						}
						var tran_date = resultSet[i].getValue({
							name: 'trandate'
						});
						var formatedTdate = format.format({
							value: tran_date,
							type: format.Type.DATE
						});
						log.debug("Formated Tran Date -->", formatedTdate);					
						
						var accountLink = url.resolveDomain({
						hostType: url.HostType.APPLICATION
						});
						
						var pdf_url = resultSet[i].getValue({
							name: 'custbody_b2b_conso_pdf'
						});
						//log.audit("PDF URl ====>", pdf_url);
						
						if(pdf_url)
						{
							var o_fileObj = file.load({
							id: pdf_url
							});
							
							var URL = o_fileObj.url;
							var finalURL = 'https://'+accountLink+URL  
							log.debug("Pdf Url ---->", finalURL);
						}
						
						/* var posting_period = resultSet[i].getText({
							name: 'postingperiod'
						});
						log.debug("Posting period ---->", posting_period); */
						
						
						if(finalURL){
						
							var invoiceJson={
							"tranNumber": tran_number,
							"tranDate": formatedTdate,
							"pdfUrl": finalURL,
							"postingPeriod": formatedSdate + ' To ' + formatedEdate 
							};
							
							log.debug("Invoice Json ---->",invoiceJson);
							
							invArray.push(invoiceJson);
						
						}
						
					}//end for loop
					log.audit("Response -->", invArray);
					
					
					Status = "Success";
					Response ='{  RequestStatus: Success, "message": "Record has been Sent sucessfully."}';
					log.debug("Response 2nd-->", Response);
					accenturelib.createRecord('',recordType, Request, Status, Response);
					
					log.debug("Response 3nd-->", Response);

					return invArray;
					
					/* return ({ RequestStatus: 'Success', "message": "Record has been sent sucessfully." + invArray }); */
					
					
                } else {
                    log.error("JSON Issue", "Invoice Details not found.");
                    Status = "Failed";
                    Response = '{ "RequestStatus": "Failed", "message": "Invoice Deyails not found." }';

                    return ({
                        RequestStatus: 'Failed',
                        "message": "Invoice Details not found."
                    });
                    return false;
                }
				
                return ({
                    RequestStatus: 'Success',
                    "message": "Record has been sent sucessfully."
                });
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
