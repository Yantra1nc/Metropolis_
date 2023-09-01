/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: MHL YIL REST Create ORG
 * File Name: MHL_YIL_REST_Create_ORG_Record.js 
 * Created On: 15/05/2023
 * Modified On:
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: Craete Org record
 *********************************************************** */

/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/format', 'N/record', 'N/runtime', 'N/search','./accenturelib'],

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
			var recordType = "Org";
			
			log.debug("In_restlet");
			var attuneJson=requestBody;
          	log.debug("requestBody",requestBody);
			
			var Request = JSON.stringify(attuneJson);
				var Status;
				var Response;
			
			var o_orgObj = record.create({
				type: 'location',
				isDynamic: true
			});
			
			var subsidiary = attuneJson.subsidiary;
			
			var subsidiarySearchObj = search.create({
				type: "subsidiary",
				filters: [
					["name", "contains", subsidiary]
				],
				columns: [
					search.createColumn({ name: "internalid", label: "Internal ID" })
				]
			});
			var searchResult = subsidiarySearchObj.run().getRange({
					start: 0,
					end: 1
				});

				if (searchResult.length > 0) {
					var subsidairyInternalId = searchResult[0].getValue({
						name: 'internalid'
					});
				}
				else {
			  log.error("JSON Issue","Subsidiary not found.");
			  
			  Status = "Failed";
			  Response ='{  RequestStatus: Failed, "message": "Subsidiary not found."}';
			  accenturelib.createRecord('',recordType, Request, Status, Response);
			  
	          return ({ RequestStatus: 'Failed', "message": "Subsidiary not found." });
	          return false;
	        }
			
			o_orgObj.setText("name",attuneJson.name);
			o_orgObj.setText("timezone",attuneJson.timeZone);
			o_orgObj.setText("custrecord_mhl_mds_lims_org_id",attuneJson.mdsLimsOrgId);
			o_orgObj.setText("custrecord_mhl_ref_sbu",attuneJson.sbu);
			o_orgObj.setText("custrecord_plant_code",attuneJson.plantCode);
			o_orgObj.setText("custrecord_mhl_email_salesadmin",attuneJson.emailSalesAdmin);
			o_orgObj.setText("cseg_mhl_custseg_un",attuneJson.unit);
			o_orgObj.setText("mainaddress_text",attuneJson.address);
			o_orgObj.setValue("subsidiary",subsidairyInternalId);
			o_orgObj.setText("custrecordcustrecord_division_address",attuneJson.address);
			o_orgObj.setText("custrecordcustrecord_jurisdiction",attuneJson.juriDiction);
			
			var i_orgId = o_orgObj.save();
			
			log.debug("i_orgId",i_orgId)
			
			Status = "Success";
			Response ='{  RequestStatus: Success, "message": "Record has been created sucessfully." '+ i_orgId + '}';
			accenturelib.createRecord('',recordType, Request, Status, Response);

			return ({RequestStatus:'Success',"message":"Record has been created sucessfully."+i_orgId});
		}catch(e)
		{
			Status = "Failed";
			Response ='{  RequestStatus: Failed, "message": '+ e.message + '}';
			accenturelib.createRecord('',recordType, Request, Status, Response);
			
			log.error("Restlet error",JSON.stringify(e));
			return ({RequestStatus:'Failed',"message":e.message});
			
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
