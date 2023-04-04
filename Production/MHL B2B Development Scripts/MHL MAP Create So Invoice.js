/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 *  Script Name: MHL MAP Create So Invoice.js
	* Author: Avinash Lahane & Ganesh Sapkale
	* Date: May 2022
	* Description:1] This script will Transform B2B Sales order To Invoice.              
	* Script Modification Log:
	-- Date --	-- Modified By --	--Requested By--	-- Description --
 */
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
				
				var fileSearchObj = search.load({id: 'customsearch_so_invoice_create'});
			
	        	 		   
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
					
                    var i_SalesordId = resultSet[i].getValue({name: "internalid"});
                  //  log.debug('i_SalesordId ',i_SalesordId);
				   var i_Amount = resultSet[i].getValue({name: "amount"});

					transdetails.push({'SalesOrderId':i_SalesordId,'Amount':i_Amount});

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
				
				var fSalesOrderId = objParsedValue.SalesOrderId;
				log.debug('fSalesOrderId ',fSalesOrderId);
				var amount = objParsedValue.Amount;
				log.debug('Amount ',amount);
				if(amount != 0.00){
				 var o_inv_Obj = record.transform({
						fromType: record.Type.SALES_ORDER,
						fromId: fSalesOrderId,
						toType: record.Type.INVOICE,
					});
					
					o_inv_Obj.setValue({fieldId: 'customform', value: 242});
					
					var orgId = o_inv_Obj.getValue("location");
					var documentNumber = o_inv_Obj.getValue("custbody_mhl_b2b_doc_number");
					var postingDate = o_inv_Obj.getValue("enddate");
					log.debug("postingDate",postingDate);
					var custId = o_inv_Obj.getValue("entity");
					log.debug("custId",custId);
					var n_soTotal  = o_inv_Obj.getValue("total");
					log.debug("n_soTotal",n_soTotal);
					
					var Unit = search.lookupFields({
					type: 'location',
					id: orgId,
					columns: ['cseg_mhl_custseg_un']
					});
					
					o_inv_Obj.setValue({fieldId: 'cseg_mhl_custseg_un', value: Unit.cseg_mhl_custseg_un[0].value});
					
					//var custObj = record.lookupField({})
					var customerType = search.lookupFields({
						type: search.Type.CUSTOMER,
						id: custId,
						columns: ['custentitycustrecord_tod']
					});
					var percentage = 0;
					
					if(customerType.custentitycustrecord_tod[0])
					{
						var todId = customerType.custentitycustrecord_tod[0].value;
						var toDiscAmount = 0;
						//return false;
						var customrecord_todrange_perSearchObj = search.create({
						   type: "customrecord_todrange_per",
						   filters:
						   [
							  ["custrecord_attch_tod","anyof",todId],
							  "AND",
							  ["custrecord_tod_org","anyof",orgId]
						   ],
						   columns:
						   [
							  search.createColumn({
								 name: "scriptid",
								 sort: search.Sort.ASC,
								 label: "Script ID"
							  }),
							  search.createColumn({name: "custrecord_range_from", label: "Range From"}),
							  search.createColumn({name: "custrecord_range_to", label: "Range to"}),
							  search.createColumn({name: "custrecordtod_percentage", label: "Percentage"})
						   ]
						});
						var searchResultCount = customrecord_todrange_perSearchObj.runPaged().count;
						log.debug("customrecord_todrange_perSearchObj result count",searchResultCount);
						
						
						var result = customrecord_todrange_perSearchObj.run().getRange({
							start: 0,
							end: 100
						});
						var percentage = 0, toDiscAmount = 0;
						for(var r =0; r<result.length;r++)
						{
							   var n_fromRange = result[r].getValue("custrecord_range_from");
							   var n_toRange = result[r].getValue("custrecord_range_to");
							   
							   //log.debug("percentage "+percentage,"n_toRange "+n_toRange+" n_fromRange "+n_fromRange )
							   if( n_toRange && (n_fromRange < n_soTotal &&  n_soTotal < n_toRange)  )
							   {
								   var percentage = parseFloat(result[r].getValue("custrecordtod_percentage"));
								   
								   log.debug("percentage matched",percentage);
								   
								   var toDiscAmount = (percentage * parseFloat(n_soTotal))/100;
								   log.debug("In side toDiscAmount",toDiscAmount+" percentage "+percentage)
								 break;;
							   }
						}
						
						log.debug("toDiscAmount",toDiscAmount+" percentage "+percentage)
						//return false;
						
						
						o_inv_Obj.setValue("custbody_tod_discount_percentage",percentage);
						o_inv_Obj.setValue("custbody_tod_discount_amount",toDiscAmount);
						
					}
					o_inv_Obj.setValue("custbody_mhl_b2b_document_number","CI-"+documentNumber);
					o_inv_Obj.setValue("trandate",postingDate);
					
						//return false;
					
				var O_Inv_Id = o_inv_Obj.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				log.audit('O_Inv_Id ',O_Inv_Id);
				
				 var id = record.submitFields({
					type: record.Type.INVOICE,
					id: O_Inv_Id,
					values: {
						tranid:O_Inv_Id
					},
					options: {
						enableSourcing: true,
						ignoreMandatoryFields: true
					}
				});
					
			
				var objSoRecord = record.submitFields({
				type: record.Type.SALES_ORDER,
				id: fSalesOrderId,
				values: {
					custbody_invoice_no: O_Inv_Id
				}
				});
					
					/* var objSoRecord = record.load({
						type: record.Type.SALES_ORDER,
						id: fSalesOrderId,
						isDynamic: true,
					});
					objSoRecord.setValue({fieldId: 'custbody_invoice_no', value:O_Inv_Id});
						objSoRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }); */
				}
				else{
				log.debug("Sales order is not transform due to Amount Zero");
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