/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: MHL_YIL_REST_Create_ServiceItem_Record
 * File Name:	MHL_YIL_REST_Create_ServiceItem_Record.js
 * Created On: 21/09/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Create Service Item
 *********************************************************** */
	
	/**
	 * @NApiVersion 2.x
	 * @NScriptType Restlet
	 * @NModuleScope SameAccount
	 */
	define(['N/file', 'N/format', 'N/record', 'N/runtime', 'N/search', './accenturelib'],

	    function(file, format, record, runtime, search, accenturelib) {

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
	            try

	            {
					var recordType = "ServiceItem";
					
					
					
	                log.debug("In_restlet");
	                
					var attuneJson = requestBody;
					
					log.debug("Attune Json ->", attuneJson);
					
					var Request = JSON.stringify(attuneJson);
					var Status;
					var Response;

	                log.debug("requestBody", requestBody);

	                var o_serviceitemObj = record.create({
	                    type: 'serviceitem',
	                    isDynamic: true
	                });

	               
	                o_serviceitemObj.setText("itemid", attuneJson.testCode);
	                o_serviceitemObj.setText("displayname", attuneJson.testName);
	                o_serviceitemObj.setText("custitem_mhl_serviceitem_test_category", attuneJson.testType);
	                o_serviceitemObj.setText("incomeaccount", attuneJson.incomeAcount);
	                o_serviceitemObj.setValue({
	                    fieldId: 'subtype',
	                    value: "Sale"
	                });
					o_serviceitemObj.setValue({
	                        fieldId: 'subsidiary',
	                        value: 1
	                    });
					o_serviceitemObj.setValue({
	                    fieldId: 'includechildren',
	                    value: true
	                });
					 
	                var i_serviceitemId = o_serviceitemObj.save({
	                    enableSourcing: true,
	                    ignoreMandatoryFields: true
	                });
	                log.debug("i_serviceitemId", i_serviceitemId)
					
					Status = "Success";
					Response ='{  RequestStatus: Success, "message": "Record has been created sucessfully." '+ i_serviceitemId + '}';
					accenturelib.createRecord('',recordType, Request, Status, Response);
						
					return ({ RequestStatus: 'Success', "message": "Record has been created sucessfully." + i_serviceitemId });
					
					/* return true;
	                }); */

	               
	            } catch (e) {
	                log.error("Restlet error", JSON.stringify(e));
					
					Status = "Failed";
					Response ='{  RequestStatus: Failed, "message": '+ e.message + '}';
					accenturelib.createRecord('',recordType, Request, Status, Response);
					
	                return ({ RequestStatus: 'Failed', "message": e.message });
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