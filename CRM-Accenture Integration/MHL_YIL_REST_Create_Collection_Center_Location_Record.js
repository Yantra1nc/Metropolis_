/*************************************************************
 * File Header
 * Script Type: Restlet
 * Script Name: MHL YIL REST Create Collection Center
 * File Name:MHL_YIL_REST_Create_Collection_Center_Location_Record (1)
 * Created On: 15/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Create collection record
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
            try {
				
				var recordType = "OrgCollectionCenter";
				
                var attuneJson = requestBody;

                log.debug("requestBody", requestBody);
				
				var Request = JSON.stringify(attuneJson);
				var Status;
				var Response;

                var o_orgColObj = record.create({
                    type: 'customrecord_cseg_mhl_locations',
                    isDynamic: true
                });

                var orgName = attuneJson.Org;
                log.debug("Org -----> ", orgName);

                var locationSearchObj = search.create({
                    type: "location",
                    filters: [
                        ["name", "is", orgName]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
                });
				
				var searchResult = locationSearchObj.run().getRange({
					start: 0,
					end: 1
				});
				if (searchResult.length > 0) {
				var orgs_id = searchResult[0].getValue({
						name: 'internalid'
					});
				}
				else {
						log.error("JSON Issue.","Org not found." );
						
						Status = "Failed";
						Response ='{  RequestStatus: Failed, "message": "Org not found."}';
						accenturelib.createRecord('',recordType, Request, Status, Response);
						
                        return ({ RequestStatus: 'Failed', "message": "Org not found." });
                        return false;
                    }

                    //o_orgColObj.setValue("cseg_mhl_locations_filterby_location", attuneJson.filterByOrg);
					o_orgColObj.setValue({fieldId: 'cseg_mhl_locations_filterby_location',value: orgs_id});
                    o_orgColObj.setValue("name", attuneJson.name);
                    o_orgColObj.setValue("custrecord_mhl_org_id", attuneJson.orgId);
                    o_orgColObj.setValue("custrecord_mhl_location_id", attuneJson.locationId);
                    o_orgColObj.setValue("custrecord_mhl_loc_code", attuneJson.code);
					if(attuneJson.locationType){
                    o_orgColObj.setText("custrecord_mhl_location_type", attuneJson.locationType);
					}
					o_orgColObj.setValue({fieldId: 'custrecord_mhl_loc_org',value: orgs_id});

                    var i_collectionId = o_orgColObj.save();

                    log.debug("i_collectionId", i_collectionId);
					
					Status = "Success";
					Response ='{  RequestStatus: Success, "message": "Record has been created sucessfully." '+ i_collectionId + '}';
					accenturelib.createRecord('',recordType, Request, Status, Response);
							

                    return ({ RequestStatus: 'Success', "message": "Record has been created sucessfully." + i_collectionId });
                    return true;
            } catch (e) {
				log.error("Restlet error", JSON.stringify(e))
				
					Status = "Failed";
					Response ='{  RequestStatus: Failed, "message": '+ e.message + '}';
					accenturelib.createRecord('',recordType, Request, Status, Response);
				
                return ({ RequestStatus: 'Failed', fileStoredInNS: 'No', Details: e.message });
                
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