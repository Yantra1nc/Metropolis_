/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: MHL YIL RES Send SOA Partner portal
 * File Name: MHL YIL RES Send SOA Partner portal (3)
 * Created On: 14/03/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Send SOA to partner portal
 *********************************************************** */	
	
	
	/**
	 * @NApiVersion 2.x
	 * @NScriptType Restlet
	 * @NModuleScope SameAccount
	 */
	define(['N/file', 'N/format', 'N/record', 'N/runtime', 'N/search','N/url'],

	    function(file, format, record, runtime, search, url) {

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
	         * or parsed into an Object when request Content-Type is 'appldication/json' (in which case the body must be a valid JSON)
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
	         * @since 2015.2d
	         */
	        function doPost(requestBody) {
	            try {


	                /*   var partnerJson = requestBody;
	                  var Request = JSON.stringify(partnerJson); */

	                var partnerSOAJson = [];
	                if (Array.isArray(requestBody)) {
	                    partnerSOAJson = requestBody;
	                } else {
	                    partnerSOAJson.push(requestBody);
	                }

	                log.debug({
	                    title: 'Json',
	                    details: partnerSOAJson
	                });


	                for (var pp in partnerSOAJson) {

	                    var client_code = partnerSOAJson[pp].clientCode;
	                    var soa_quarter = partnerSOAJson[pp].quarter;
	                    log.debug("client_code-->", client_code);
	                    log.debug("soa_quarter-->", soa_quarter);


	                    var soaFolderId;

	                    var customerSearchObj = search.create({
	                        type: "customer",
	                        filters: [
	                            ["entityid", "is", client_code]
	                        ],
	                        columns: [
	                            search.createColumn({
	                                name: "custentity_folderinternalid",
	                                label: "Folder Internal ID"
	                            })
	                        ]
	                    });
	                    var searchResultCount = customerSearchObj.runPaged().count;
	                    log.debug("customerSearchObj result count", searchResultCount);
	                    customerSearchObj.run().each(function(result) {
	                        // .run().each has a limit of 4,000 results

	                        soaFolderId = result.getValue({
	                            name: "custentity_folderinternalid",
	                            label: "Folder Internal ID"
	                        });
							

	                        return true;
	                    });

	                    log.debug("soaFolderId-->", soaFolderId); 

						if(soaFolderId)
						{
							var fileSearchObj = search.create({
								type: "file",
								filters: [
									["folder", "anyof", soaFolderId],
									"AND",
									["name", "startswith", "SOA"],
									"AND",
									["name", "contains", client_code]
								],
								columns: [
								search.createColumn({name: "internalid", label: "Internal ID"}),
									search.createColumn({
										name: "name",
										sort: search.Sort.ASC,
										label: "Name"
									}),
									search.createColumn({
										name: "folder",
										label: "Folder"
									}),
									search.createColumn({
										name: "created",
										label: "Date Created"
									}),
									search.createColumn({
										name: "modified",
										label: "Last Modified"
									}),
									search.createColumn({
										name: "filetype",
										label: "Type"
									})
								]
							});
						
	                    var resultSet = fileSearchObj.run().getRange({
	                        start: 0,
	                        end: 1000
	                    });
	                    //log.audit("Result Set ->", resultSet);

	                    if (resultSet != null && resultSet != '' && resultSet != ' ') {
	                        var completeResultSet = resultSet;
	                        var start = 1000;
	                        var last = 2000;

	                        while (resultSet.length == 1000) {
	                            resultSet = fileSearchObj.run().getRange(start, last);
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

	                    var soaArrayObj = [];

	                    if (resultSet.length > 0) {
	                        for (var i = 0; i < resultSet.length; i++) {
	                            var pdf_url = resultSet[i].getValue({
	                                name: 'internalid'
	                            });
	                            log.audit("Pdf Internal Id ====>", pdf_url);
								
								var pdf_name = resultSet[i].getValue({
	                                name: 'name'
	                            });
	                            log.audit("SOA PDF Name ====>", pdf_name);
								
								var accountLink = url.resolveDomain({
								hostType: url.HostType.APPLICATION
								});	

	                            if (pdf_url) {
	                                var o_fileObj = file.load({
	                                    id: pdf_url
	                                });

	                                var URL = o_fileObj.url;
	                                var finalURL = 'https://' + accountLink + URL
	                                log.debug("Pdf Url ---->", finalURL);
	                            }


	                            if (finalURL) {
	                                var soaJson = {
	                                    "clientCode": client_code,
	                                    "quarter": soa_quarter,
	                                    "reportName": pdf_name,
	                                    "reportUrl": finalURL
	                                };

	                                log.debug("SOA Json ---->", soaJson);

	                                soaArrayObj.push(soaJson);
	                            }
	                        }
						}

	                        log.debug("SOA Json ---->", soaArrayObj);

	                        return soaArrayObj;
	                    }
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