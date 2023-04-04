	/**
	 * Script Name: MHL_YIL_B2B_Attune_VID_Creation.js
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 * Script Name:  Reversal File HDFC integration.js
	* Author:Ganesh Sapakale & Avinash Lahane
	* Date: May 2022
	* Description: This script will create Reversal file reocrd.
	 */
	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib'],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function(file, format, record, search, runtime, mhllib, datellib) {

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
	                    id: 'customsearch_reversal_file_record'
	                });

	            } catch (e) {
	                //createRnIRecord(e, 'search Issue');
	                log.error({
	                    title: 'Error Occured while reading file',
	                    details: e
	                });
	            }
	        }

	        function map(context) {
	            try {

	                //log.debug("context",JSON.stringify(context.value.transaction))
	                 var data = JSON.parse(context.value); //read the data
					 log.debug(" data", data);
	                log.debug("context data", JSON.stringify(data.transaction));
	                ////log.debug('data',data);
	                var fileInternalId = data.id;
	                log.debug('Start', '-------------------------------------');
	                log.debug('fileInternalId', fileInternalId);
	
					var fileObj = file.load({id: fileInternalId})
					
					var fileContent = file.load(fileInternalId).getContents().split("\n");
							log.debug("fileContent", fileContent[0]);
							log.debug("fileContent", fileContent.length);
							log.debug("fileContent.length", fileContent.length);
							for(var k = 0; k < fileContent.length; k++) {
								log.debug("File content ==>", fileContent[k].toString());
								
								var Loadresult = fileContent[k].split("");
								
								var result = fileContent[k].substring(0, 29);
								//log.debug("Result -->", result);
								
								var result2 = fileContent[k].substring(29, 74);
								//log.audit("Result 2  -->", result2);
								
								var result3 = fileContent[k].substring(74, 319);
								//log.debug("Result 3  -->", result3);
								
								var result4 = fileContent[k].substring(310, 413);
								//log.debug("Result 4  -->", result4);
								
								var result5 = fileContent[k].substring(413, 424);
								//log.debug("Result 5  -->", result5);
								
								var result6 = fileContent[k].substring(424, 474);
								//log.debug("Result 6  -->", result6);
								
								var result7 = fileContent[k].substring(474, 484);
								//log.debug("Result 7  -->", result7);
								
								var result9 = fileContent[k].substring(484, 524);
								//log.debug("Result 9  -->", result9);
								
								var result10 = fileContent[k].substring(524, 534);
								//log.debug("Result 10  -->", result10);
								
								var result11 = fileContent[k].substring(534, 549);
								//log.debug("Result 11  -->", result11);
								
								var result12 = fileContent[k].substring(549, 563);
								//log.debug("Result 12  -->", result12);
								
								var result13 = fileContent[k].substring(563, 633);
								//log.debug("Result 13  -->", result13);
								
								var result14 = fileContent[k].substring(633, 658);
								//log.debug("Result 14  -->", result14);
								
								var result15 = fileContent[k].substring(658, 698);
								//log.debug("Result 15  -->", result15);
								
								var result16 = fileContent[k].substring(698, 738);
								//log.debug("Result 16  -->", result16);
								
								var result17 = fileContent[k].substring(738, 780);
								//log.debug("Result 17  -->", result17);
								
								var result18 = fileContent[k].substring(780, 821);
								//log.debug("Result 18  -->", result18);
								
								var result19 = fileContent[k].substring(821, 939);
								//log.debug("Result 19  -->", result19);
								
								if(result2){
									var objRecord = record.create({
										type: 'customrecord_reversal_file',
										isDynamic: true
									});
										
									objRecord.setValue({fieldId:'custrecord_rev_name',value: result2}); 
										
									objRecord.setValue({fieldId:'custrecord_tran_number',value: result9});
										
									objRecord.setValue({fieldId:'custrecord_rev_date',value: result5});
										
									objRecord.setValue({fieldId:'custrecord_utr_number',value: result17});
										
									objRecord.setValue({fieldId:'custrecord_amount',value: result6});
										
									objRecord.setValue({fieldId:'custrecord_email',value: result19});
									
									objRecord.setValue({fieldId:'custrecord_rev_status',value: result18});
										
										
								
									var recordId = objRecord.save({
									enableSourcing: true,
									ignoreMandatoryFields: true
									});
								} 
								
								
								
								log.debug('End', '-------------------------------------'+ recordId);

							}
							
							fileObj.folder = 772742;
							fileObj.save();
							
							
					
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
	                summary.mapSummary.keys.iterator().each(function(key, executionCount, completionState) {

	                    if (completionState === 'COMPLETE') {
	                        mapKeysProcessed++;
	                    }

	                    return true;

	                });
	               /*  log.debug({
	                    title: 'Map key statistics',
	                    details: 'Total number of map keys processed successfully: ' + mapKeysProcessed
	                }); */
	            } catch (e) {
	                log.error({
	                    title: 'Error Occured in Summary function',
	                    details: e
	                });
	            }

	        }

	        //////////////////////////////////////////////////////////
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
