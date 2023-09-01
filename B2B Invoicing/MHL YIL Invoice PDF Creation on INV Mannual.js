	/**
	 * Script Name:MHL YIL Invoice PDF Creation on INV.js
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL YIL Invoice PDF Creation on INV Mnal
 * File Name: MHL YIL Invoice PDF Creation on INV Mannual.js
 * Created On: 15/12/2022
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: Invoice PDF Creation on INV Mannual
 *********************************************************** */

	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './invoicepdf', './datellib','N/email'],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function (file, format, record, search, runtime, invoicepdf, datellib, email) {

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
					
					//"startdate", "onorafter", start_date
					
				var o_context = runtime.getCurrentScript();
                var start_date = o_context.getParameter({
                    name: 'custscript_statrt_date_pdf'
                });
                log.debug('start_date Map reduce-->', start_date);

                var end_date = o_context.getParameter({
                    name: 'custscript_end_date_pdf'
                });
                log.debug('end_date map reduce-->', end_date)
				
				var recordIdInvExe = o_context.getParameter({
                    name: 'custscript_record_id_inv_exe'
                });
                log.debug('recordIdInvExe -->', recordIdInvExe)
				
				
				//------Added New Code
					 
			if(start_date && end_date){
					var tr_filter = [];
                        tr_filter.push(
                            search.createFilter({
								name: 'startdate',
                                operator: search.Operator.ONORAFTER,
                                values: start_date
							}));
						
						tr_filter.push(
                            search.createFilter({
								name: 'enddate',
                                operator: search.Operator.ONORBEFORE,
                                values: end_date
							}));						
					
					var fileSearchObj = search.load({
	                    id: 'customsearch_mhl_creates_inv_pdf'
	                });

				}
				
				if ((tr_filter)) {
                        for (var i = 0; i < tr_filter.length; i++) {
                            fileSearchObj.filters.push(tr_filter[i]);
                            //log.debug('tr_filter', tr_filter[i]);
                        }
                    } 
				
				return fileSearchObj; 
				
				//------------------END---------------------------
					
					
				/* return search.load({
	                id: 'customsearch_mhl_creates_inv_pdf'
	            });  */


	            } catch (e) {
	                createRnIRecord(e, 'search Issue');
	                log.debug({
	                    title: 'Error Occured while collecting JSON for VID',
	                    details: e
	                });
	            }
	        }

	        function map(context) {
				var tempArr = [];
	            try {
					var key = context.key;
	                //log.debug("context",JSON.stringify(context.value.transaction))
	                var data = JSON.parse(context.value); //read the data
	                //log.debug("context data", JSON.stringify(data))
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
						var jsonArray2 = {
							'isProcessed': 'YES'
						};
					}
					else
					{
						var jsonArray2 = {
							'isProcessed': 'NO'
						};
					}	
	            } catch (ex) {
	                log.error({
	                    title: 'map: error in creating records',
	                    details: ex
	                });
					
				 var jsonArray2 = {
							'isProcessed': 'NO'
						};
	               
	            }
				 if (jsonArray2) {
					tempArr.push(jsonArray2);
					//log.debug("tempArr ",JSON.stringify(tempArr))
					context.write(key, tempArr);
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
					var o_context = runtime.getCurrentScript();
                var start_date = o_context.getParameter({
                    name: 'custscript_statrt_date_pdf'
                });
                log.debug('start_date Map reduce-->', start_date);

                var end_date = o_context.getParameter({
                    name: 'custscript_end_date_pdf'
                });
                log.debug('end_date map reduce-->', end_date)
				
				var recordIdInvExe = o_context.getParameter({
                    name: 'custscript_record_id_inv_exe'
                });
			  log.debug("summarize", "summarize");
                var errorFileContent = "Details, Transaction No\n";
                var createErrorFile = false;
                var mapKeys = [];

                summary.mapSummary.keys.iterator().each(function(key) {
                    mapKeys.push(key);
                    return true;
                });
                var errorObject = " ";

                var errorarray = [];
                var csvColumns = new Array();
                var lineOne = '';
                var errorString = '';

                var processed = 0;
                var eprocessed = 0;
                //log.debug("eprocessed", eprocessed)
                //Iterate success operation here
                var total_lines = 0;
                summary.output.iterator().each(function(key, value) {

                    var tempSucessString = "";
                    var tempErrorString = "";

                    var s_value = JSON.parse(value);
                    //var s_value = s_value[0];
                    total_lines++;
                    //log.debug("rowsData  <--->  ",s_value)
                    //log.debug("value",s_value.length)
                    var errMessage = '';

                    var nsDetails = "";
                    var errorMessage = "";
                    var bProcessed = "";

                    for (var x = 0; x < s_value.length; x++) {

                        bProcessed = s_value[x].isProcessed;
                        //  log.debug("summarize()", 'bProcessed==> '+bProcessed);	

                        if (bProcessed == 'YES') {
                            processed = processed + 1;
                        }
                        if (bProcessed == 'NO') {
                            eprocessed = eprocessed + 1;
                        }
                        nsDetails = s_value[x].message;
                    }

                    errorString = nsDetails;
                    errorFileContent += errorString + ',' + key + '\n';
                    createErrorFile = true;

                    return true;
                });
				 var email_content = "Hello User,";
                email_content += "<br>";
                email_content += "<br>";
                email_content += " Invoice PDF Creation between <b>" + start_date + "</b> to <b>" + end_date + "</b> has been completed. Please find below details on the same.<br>";
                email_content += " <b>Total Invoices: </b> " + total_lines + "<br>";
                email_content += " <b>No of PDF Created: </b> " + processed + "<br>";
                email_content += " <b>No of PDFFailed: </b> " + eprocessed + "<br>";
				
				var o_invObj = record.load({type: 'customrecord_mhl_b2b_inv_execution',
                    id: i_record_id_inv})
				var currentTotalSucessSO = 	o_invObj.getValue('custrecord_mhl_total_created');
				
				var e_employee_b2b_created_by = o_invObj.getValue('custrecord_mhl_b2b_created_by');
				var emailID = search.lookupFields({type:'employee',id:e_employee_b2b_created_by, columns: ['email']})
				log.debug("emailID",emailID.email)
				
				var e_emaiArray = new Array();
				e_emaiArray.push(emailID.email);
				e_emaiArray.push('dayanand.lot@metropolisindia.com');
				e_emaiArray.push('navneet.modi@metropolisindia.com');

                var record_id = record.submitFields({
                    type: 'customrecord_mhl_b2b_inv_execution',
                    id: recordIdInvExe,
                    values: {
                        custrecord_mhl_total_created: parseInt(processed)+parseInt(currentTotalSucessSO),
                        custrecord_mhl_failed_pdf: eprocessed
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });

                var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;

                email.send({
                    author: 118,
                    recipients: e_emaiArray,
                    subject: 'Consolidated Invoice PDF Creation Completed',
                    body: email_content,
                    bcc: ['metropolis@yantrainc.com']
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