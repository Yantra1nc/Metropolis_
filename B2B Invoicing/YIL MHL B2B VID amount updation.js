/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: YIL MHL B2B VID amount updation
 * File Name: YIL MHL B2B VID amount updation.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: B2B VID amount updation
 *********************************************************** */

define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', 'N/task','N/email'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function(file, format, record, search, runtime, task, email) {

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
		 
		var orderIds=[];
        function getInputData() {

            try {

                var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;
				
				var customerSearchObj = search.load({
					id: 'customsearch1642131'
				});
					
				return customerSearchObj;
			}
			catch(e)
			{
				log.error("getInputData |  error ",e)
			}

        }

        function map(context) {
            try {
                var a_usage_data = JSON.parse(context.value);
				//log.debug("JSON",JSON.stringify(a_usage_data));
				
				var fileInternalId = a_usage_data.values.custrecord_b2b_vid_json_file.value;
               
                /* context.write({
                    key: a_usage_data.id,
                    value: a_usage_data.values['GROUP(internalid.CUSTRECORD_SALESORDER)']
                }); */

               // log.debug("MAP", "a_usage_data " + JSON.stringify(Jsonarr))
                context.write({
                    key: a_usage_data.id,
                    value: fileInternalId
                });
					
            } catch (ex) {
                log.error({
                    title: 'map: error in creating records',
                    details: ex
                });

            }
        }
//key: a_usage_data.id,
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function reduce(context) {

           
            try {
			var tempArr = [];
            var ErrorArr = [];
            var n_externalID = 0;
			
			var i_customer_id = context.key;
             
			var value = context.values;
			
			log.debug("value",value)
			var fileInternalId =value[0];
			
			 var jsonFile = file.load({
	                    id: fileInternalId
	                });
			var content = jsonFile.getContents();
			content = content.replace('Ã¯Â»Â¿', '');
			content = JSON.parse(content);		
			var amountReceived = content.Billinfo.AmountReceived;
			
			log.debug("amountReceived",amountReceived)
			log.audit("i_customer_id",i_customer_id+" amountReceived "+amountReceived+" fileInternalId "+fileInternalId );
			var RecordId = record.submitFields({
				type: 'customrecord_b2b_vid_details',
				id: i_customer_id,
				values: {
					custrecord_amountreceived: amountReceived
				},
				options: {
					enableSourcing: true,
					ignoreMandatoryFields: true
				}
			});
			
            } catch (e) {
				log.error("reduce | error",e)
            }		
			
			
			
			//log.debug("Reduce tempArr ",JSON.stringify(ErrorArr))
           // context.write(o_context_frst_occurance, ErrorArr);

        }

        ///////////////////////////////////////////////////////////

        function summarize(summary) {
            try {

            } catch (error) {
                log.error('Catch', 'Msg- ' + error);
            }
        }


        /////////////////////////////////////////////////////////
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
		
			function convert_date(d_date)
	{
	  var d_date_convert = "" ;	
	  if(_logValidation(d_date))
		{
			var currentTime = new Date(d_date);
			var currentOffset = currentTime.getTimezoneOffset();
			var ISTOffset = 330;   // IST offset UTC +5:30 
			d_date_convert = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
		}	
		return d_date_convert; 
	}
	
	function addDays(date, days) {
	        var result = new Date(date);
	        result.setDate(result.getDate() + days);
	        return result;
	    }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });