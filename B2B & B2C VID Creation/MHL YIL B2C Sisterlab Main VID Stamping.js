/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL YIL B2C Sisterlab main vid Stamp
 * File Name: MHL YIL B2C Sisterlab Main VID Stamping.js
 * Created On: 19/05/2023
 * Modified On:
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: B2C Sisterlab Main VID Stamping
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
		 
		var file_id;
		var s_file_data= '';
        function getInputData() {
      
            try { 
				
				var fileSearchObj = search.load({id: 'customsearch_b2c_sisterlab_vid_3'});
			
	        	 		   
				var resultSet = fileSearchObj.run().getRange({start : 0,end : 1000});
				if(resultSet!=null&&resultSet!=''&&resultSet!=' ')
				{
					var completeResultSet = resultSet; 
					var start = 1000;
					var last = 2000;
					
					while(resultSet.length == 1000)
					{
						resultSet = fileSearchObj.run().getRange(start, last);
						completeResultSet = completeResultSet.concat(resultSet);
						start = parseFloat(start)+1000;
						last = parseFloat(last)+1000;
					}
					resultSet = completeResultSet;
					if(resultSet)
					{
						log.debug('In getInputData_savedSearch: resultSet: '+resultSet.length);	
					}
				}
				
				
				var transdetails = [];
				if (_logValidation(resultSet)) {
                for (var i = 0; i < resultSet.length; i++) {
                    // .run().each has a limit of 4,000 results
					
                    var i_invoiceId = resultSet[i].getValue({name: "internalid"});
                  //  log.debug('i_SalesordId ',i_SalesordId);
				   var sisterlabVID = resultSet[i].getValue({name: "custbody_mhl_invoice_vid_number"});

					transdetails.push({'i_invoiceId':i_invoiceId,'sisterlabVID':sisterlabVID});

                }

                //return true;
            }


				
					
				return transdetails;
			}
			catch(e)
			{
				log.error("getInputData |  error ",e)
			}

        }

        function map(context) {
            try {
				
				var key    = context.key;
				//log.debug('key ',key);
				var value  = context.value;
				//log.debug('value ',value);

				var objParsedValue = JSON.parse(value);
				
				var finvoiceId = objParsedValue.i_invoiceId;
				log.debug('finvoiceId ',finvoiceId);
				var sisterlabVID = objParsedValue.sisterlabVID;
				log.debug('sisterlabVID ',sisterlabVID);
				
				var vidNo=sisterlabVID.replace("_S",'');
				log.debug('vidNo ',vidNo);
				
				var customrecord_b2b_vid_detailsSearchObj = search.create({
				   type: "customrecord_b2b_vid_details",
				   filters:
				   [
					  ["name","is",vidNo], 
					  "AND", 
					  ["custrecord_invoice_number.mainline","is","T"]
				   ],
				   columns:
				   [
					  search.createColumn({
						 name: "name",
						 sort: search.Sort.ASC,
						 label: "Name"
					  }),
					  search.createColumn({
						 name: "internalid",
						 join: "CUSTRECORD_INVOICE_NUMBER",
						 label: "Invoice InternalId"
					  })
				   ]
				});
				var resultSet = customrecord_b2b_vid_detailsSearchObj.run().getRange({start : 0,end : 1});
				log.debug("resultSet",resultSet.length);
				if(resultSet.length>0){
				var b2binvoiceID = resultSet[0].getValue({
						 name: "internalid",
						 join: "CUSTRECORD_INVOICE_NUMBER",
						 label: "Invoice InternalId"
					  });
				
				log.debug("b2binvoiceID",b2binvoiceID);
				}else{
					log.debug("Main VID Not Found In B2B Details");
				}
				
				if(b2binvoiceID){
				var objSoRecord = record.submitFields({
				type: "invoice",
				id: finvoiceId,
				values: {
					custbody_mhl_sl_mainvidnumber: b2binvoiceID
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
        function reduce(context) {
			

            try {
			var tempArr = [];
            var ErrorArr = [];
            var n_externalID = 0;
			
			var i_internal_id = context.key;
			//log.debug("i_internal_id",i_internal_id);
			var i_record = context.values;
			//log.debug("i_record",i_record);
			
			

			
					
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
		

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });