/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 *  Script Name: MAP_MHL_SisterLab CostBooking Errors.js
	* Author:Ganesh Sapkale
	* Date: 08 Feb 2022
	* Description:1] This Script will clear the cost booking knockoff         
	* Script Modification Log:
	-- Date --	-- Modified By --	--Requested By--	-- Description --
 */
define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime','./restcall'],
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
        function getInputData() {

            try {

                var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;
                log.debug('Get input Data Stage', deploymentId);

		   
				return search.load({
					id: 'customsearch_clearing_costbooking_errors'
				});
                

            } catch (e) {
                log.debug({
                    title: 'Error Occured while collecting transaction',
                    details: e
                });
            }
        } //End Input stage

        function map(context) {
            try {
				
				
				var s_data = context.value;
				log.debug("data",s_data)
				var s_final_data = s_data.replace(/.CUSTRECORD_MHL_ITD_VID/g, 'CUSTRECORD_MHL_ITD_VID');
				var data = JSON.parse(s_final_data); 
				
				var processingOrg = data.values.locationCUSTRECORD_MHL_ITD_VID.value;
				
				var s_inv_tran_date = data.values.trandateCUSTRECORD_MHL_ITD_VID;
				
				var i_inv_posting_period = data.values.postingperiodCUSTRECORD_MHL_ITD_VID.value;
				
                log.debug('s_inv_tran_date', s_inv_tran_date);
				
                s_inv_tran_date = format.parse({
                    value: s_inv_tran_date,
                    type: format.Type.DATE
                });/*  */
				
				
				
				var jsonData = new Array();
				jsonData = {
					"invoicetestId":data.id,
					"itd_net_amt":data.values.custrecord_mhl_itd_net_amt,
					"cost_boking_entryId":data.values.custrecord_cost_boking_entry.value,
					"invoiceId":data.values.custrecord_mhl_itd_vid.value,				
					"s_inv_tran_date":s_inv_tran_date,
					"i_inv_posting_period":i_inv_posting_period,
					"processingOrg":processingOrg,
					
				}
				
				context.write({
                    key: data.id,
                    value: jsonData
                });
				
				//var getfileid = getData.internalid;
				
            } //End Try
            catch (ex) {
                log.error({
                    title: 'map: error in creating records',
                    details: ex
                });

            }
        } //End MAP Stage
		
		function reduce(context) {
			try
			{
				var InvId = context.key;
				
				//log.debug("try context",JSON.stringify(context))
                var InvTestData = JSON.parse(context.values[0]);
				
				log.debug("reduce | InvTestData",JSON.stringify(InvTestData));
				var testWiseInvRecId = InvTestData.invoicetestId;
				 var payJSON = {
						"restlet": 1237,
						"testWiseInvRecId": InvTestData.invoicetestId,				
						"invoiceId": InvTestData.invoiceId,
						"costBookingId": InvTestData.cost_boking_entryId,
						"processingOrg": InvTestData.processingOrg,
						"s_inv_tran_date": InvTestData.s_inv_tran_date,
						"i_inv_posting_period": InvTestData.i_inv_posting_period,
						"amount": InvTestData.itd_net_amt
					}		
				log.debug("payJSON",JSON.stringify(payJSON))
					
				var s_response = restcall.restfun(payJSON);

				log.audit("MAP SCript s_response testWiseInvRecId "+testWiseInvRecId, JSON.parse(s_response.body))

				//var resp = s_response.body;
				var resp = JSON.stringify(s_response.body);
				
				
				if(resp.RequestStatus == "Success")
				{		
					
					//log.audit("testWiseInvRecId "+testWiseInvRecId,resp.paymentId)
					
					record.submitFields({
						type: 'customrecord_mhl_invoice_testwise_detail',
						id: testWiseInvRecId,
						values: {
							custrecord_mhl_error_detail: ''
						},
						options: {
							enableSourcing: true,
							ignoreMandatoryFields: true
						}
					});
				}
				else
				{				
					
                  log.debug("S Responese", s_response);
					
					var f_response = JSON.parse(s_response);
					log.debug("Final response from Restlet-->", f_response);
                  
					record.submitFields({
						type: 'customrecord_mhl_invoice_testwise_detail',
						id: testWiseInvRecId,
						values: {
							custrecord_mhl_error_detail:  'Response from Restlet -->: ' + JSON.stringify(f_response.body)
						},
						options: {
							enableSourcing: true,
							ignoreMandatoryFields: true
						}
					});
					
				}
			}
			catch(ex)
			{
				log.error({
                    title: 'reduce: error in creating records',
                    details: ex
                });
			}
			
		}

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
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
            } //End Try
            catch (e) {
                log.error({
                    title: 'Error Occured in Summary function',
                    details: e
                });
            }

        } // End Summary function	

        return {
            getInputData: getInputData,
            map: map,
			reduce: reduce,
            summarize: summarize
        };

    });
	
	// 