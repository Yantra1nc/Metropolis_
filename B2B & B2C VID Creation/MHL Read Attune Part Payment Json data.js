	/**
	 * Script Name: 
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL YIL MR Send Attune Part Payment JSON
 * File Name: MHL Read Attune Part Payment Json data.js
 * Created On: 22/04/2022 
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description:  Send Attune Part Payment JSON
 *********************************************************** */

	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib', "./callrestdata"],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function(file, format, record, search, runtime, mhllib, datellib, callrestdata) {

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
	                    id: 'customsearch_move_attune_part_pay_file'
	                });

	            } catch (e) {
	                createRnIRecord(e, 'search Issue');
	                log.debug({
	                    title: 'Error Occured while collecting JSON',
	                    details: e
	                });
	            }
	        }

	        function map(context) {
	            try {
	                //log.debug("context",JSON.stringify(context.value.transaction))
	                var data = JSON.parse(context.value); //read the data
	                //log.debug("context data", JSON.stringify(data.transaction))
	                //log.debug('data', data);
	                var fileInternalId = data.id;
	                var jsonFile = file.load({
	                    id: fileInternalId
	                });
	                var content = jsonFile.getContents();
	                content = content.replace('Ã¯Â»Â¿', '');
	                content = JSON.parse(content);
	              //  log.audit('fileInternalId', fileInternalId);
	               // log.audit('Content --->', content);

	                var s_response = callrestdata.getfiledata(content);
	                //log.audit("MAP SCript s_response -->", s_response)
					var s_body = s_response.body;
					
					log.debug("s_bodys_body",s_body)
					s_body = JSON.parse(s_body);
					
					log.audit("s_body",s_body.Details+" | "+s_body.RequestStatus)
					
					if(s_body.RequestStatus == 'Success')
					{
						 jsonFile.description = s_body.Details;
						 jsonFile.save();
					}
					
					//jsonFile.setValue("description",s_body.Details)
					

	            } catch (ex) {
	                log.error({
	                    title: 'Json file doesnt getting',
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
	        function summarize(summary) {}
	        return {
	            getInputData: getInputData,
	            map: map,
	            summarize: summarize
	        };

	    });