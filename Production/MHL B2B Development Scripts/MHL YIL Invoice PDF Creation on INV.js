	/**
	 * Script Name:MHL YIL Invoice PDF Creation on INV.js
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 * Author: Avinash Lahane & Ganesh Sapkale
	 * Date: May 2022
	 * Description:1] This script will Create PDF from Invoice.
	 */
	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './invoicepdf', './datellib'],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function (file, format, record, search, runtime, invoicepdf, datellib) {

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
	                log.audit("deployment Id", deploymentId)

	                return search.load({
	                    id: 'customsearch_mhl_creates_inv_pdf'
	                });

	            } catch (e) {
	                createRnIRecord(e, 'search Issue');
	                log.debug({
	                    title: 'Error Occured while collecting JSON for VID',
	                    details: e
	                });
	            }
	        }

	        function map(context) {
	            try {

	                //log.debug("context",JSON.stringify(context.value.transaction))
	                var data = JSON.parse(context.value); //read the data
	                log.debug("context data", JSON.stringify(data))
					var i_invoiceId = data.id;
					var i_pdfFileID = invoicepdf.invpdf(i_invoiceId);					
					log.audit("i_pdfFileID",i_pdfFileID);
					
					if(i_pdfFileID)
					{
						var id = record.submitFields({
							type: 'invoice',
							id: i_invoiceId,
							values: {
								custbody_mhl_b2b_pdf_created: 'T',
								custbody_b2b_conso_pdf: i_pdfFileID
							},
							options: {
								enableSourcing: true,
								ignoreMandatoryFields: true
							}
						});
					}
	            } catch (ex) {
	                log.error({
	                    title: 'map: error in creating records',
	                    details: ex
	                });
	               
	            }
	        }

	        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
	                log.debug({
	                    title: 'Map key statistics',
	                    details: 'Total number of map keys processed successfully: ' + mapKeysProcessed
	                });
	            } catch (e) {
	                log.error({
	                    title: 'Error Occured in Summary function',
	                    details: e
	                });
	            }

	        }

	        
	        function _logValidation(value) {
	            if (value != null && value != undefined && value != '' && value != 'undefined') {
	                return true;
	            } else {
	                return false;
	            }

	        }

	        function _nullValidation(val) {
	            if (val == null || val == undefined || val == '') {
	                return true;
	            } else {
	                return false;
	            }

	        }

	        return {
	            getInputData: getInputData,
	            map: map,
	            summarize: summarize
	        };

	    });