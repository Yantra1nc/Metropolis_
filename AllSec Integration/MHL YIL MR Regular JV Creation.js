//MHL YIL MR JV Creation

/**
 * Script Name: 
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL YIL MR Regular JV Creation
 * File Name: MHL YIL MR Regular JV Creation.js
 * Created On: 19/04/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Regular JV Creation
 *********************************************************** */

define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib', "./callrestdata", "N/url", 'N/https'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function(file, format, record, search, runtime, mhllib, datellib, callrestdata, url, https) {

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

                var allSecFile = search.load({
                    id: 'customsearch_all_sec_folder_search'
                });
                //log.debug("All Sec Files-->", allSecFile);


                var resultSet = allSecFile.run().getRange({
                    start: 0,
                    end: 1000
                });
                //log.audit("Result Set ->", resultSet);

                if (resultSet != null && resultSet != '' && resultSet != ' ') {
                    var completeResultSet = resultSet;
                    var start = 1000;
                    var last = 2000;

                    while (resultSet.length == 1000) {
                        resultSet = allSecFile.run().getRange(start, last);
                        completeResultSet = completeResultSet.concat(resultSet);
                        start = parseFloat(start) + 1000;
                        last = parseFloat(last) + 1000;

                        //log.debug("Input Call","start "+start)
                    }
                    resultSet = completeResultSet;
                    if (resultSet) {
                        log.debug('In getInputData_savedSearch: resultSet: ' + resultSet.length);
                    }
                }

                if (allSecFile) {
                    var jv_data_array = [];

                    for (var i = 0; i < resultSet.length; i++) {
                        var int_id = resultSet[i].getValue({
                            name: "internalid",
                            label: "Internal ID"
                        });

                        var fil_name = resultSet[i].getValue({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        });
                    
                    log.debug("Internal Id---->", int_id);
					
					var resultFile = fil_name.substring(0, 7);
					log.audit("File Name ---->", resultFile);


                    var loadFile = file.load({
                        id: int_id
                    });
                    log.debug("Load Files-->", loadFile);

                    if (resultFile == 'Regular') {

                        var fileContents = loadFile.getContents();
                        var rowData = fileContents.split("\r\n");
                        var rowDataLen = rowData.length;
                        log.debug("no of rows", rowDataLen);

                        for (var k = 1; k < rowData.length; k++) {

                            var lineValues = rowData[k].split(',');
                            //log.debug("LOad Result-->", lineValues);
                            if (lineValues) {
                                jv_data_array.push({
                                    'i_jv_externalid': lineValues[0],
                                    pushdata: {
                                        'jv_externalid': lineValues[0],
                                        'jv_subsidiary': lineValues[1],
                                        'jv_subintid': lineValues[2],
                                        'jv_currency': lineValues[3],
                                        'jv_date': lineValues[4],
                                        'jv_account': lineValues[5],
                                        'jv_debit': lineValues[6],
                                        'jv_credit': lineValues[7],
                                        'jv_memo': lineValues[8],
                                        'jv_revenue': lineValues[9],
                                        'jv_orgintidlab': lineValues[10],
                                        'jv_orglab': lineValues[11],
                                        'jv_unit': lineValues[12],
                                        'jv_sbu': lineValues[13],
                                        'jv_department': lineValues[14],
                                        'jv_collecenter': lineValues[15],
                                        'jv_journaltype': lineValues[16],
                                        'jv_tdsperiod': lineValues[17],
										'fileInternalId': int_id
                                    }
                                });
                            }
                        }
                        //log.debug("All File Data", jv_data_array);
                    }else{
						log.debug("File Not matched!!!!");
					}
                  }
				}
                log.debug("All File Data -->", jv_data_array);
                return jv_data_array;

            } catch (e) {
                log.debug({
                    title: 'Error Occured while collecting JSON',
                    details: e
                });
            }
        }

        function map(context) {
            try {
                //  log.debug("-----------------------------------MAP-------------------------------------");

                var a_usage_data = JSON.parse(context.value);
                log.debug("a_usage_data", a_usage_data);

                var extId = a_usage_data.i_jv_externalid;
                log.debug("extId", extId);

                var curr = a_usage_data.pushdata.jv_currency;
                log.debug("curr", curr);

                if (extId) {
                    context.write({
                        key: a_usage_data.i_jv_externalid,
                        value: a_usage_data.pushdata
                    });
                }

                /*  var mappingResult = context.value;
                 log.debug("mappingResult : ", mappingResult);
                 var key = context.key
                 log.debug("key : ", key);
                 context.write(key, mappingResult); */
            } catch (ex) {
                log.debug("map ex", ex.message);
            }
        }


        function reduce(context) {
			
			var finalJV = context.key;
			log.debug("finalJV", finalJV);


            log.debug("reduce KEY", context.key);
            log.debug("reduce Data", context.values);
            log.debug("reduce Length", context.values.length);

            /*  context.write({
                 key: context.key,
                 value: context.values.length
             }); */
			 
			//get todays date to generate req id using current timestamp
    		var o_today_date_obj = new Date();
    		var s_current_timestamp = o_today_date_obj.getTime();
    		var s_req_payload_id = s_current_timestamp.toString();
			 
			var o_audit_log_record_obj = record.create({
    						type: "customrecord1353",
    						isDynamic: true
    					});
    		if(!o_audit_log_record_obj)
    		{
    			return {
    				"request_id": s_req_payload_id,
    				"error":"Integration Audit log record cannot be initiated at this moment. Please contact administrator."
    				};
    		}
			
		var s_error_Contents = 'Expence Report External ID , Error \n';
			

            try {
                var o_JournalEntry = record.create({
                    type: 'journalentry',
                    isDynamic: true
                });

                var a;

                var o_index = context.values[0];
                var JVdetail = JSON.parse(o_index);
                log.debug("JVdetail", JVdetail);

                var jvSubsidiaryId = JVdetail.jv_subintid;
                log.debug("jvSubsidiaryId outside -->", jvSubsidiaryId);
				
				var jv_ext_id = JVdetail.jv_subintid;
                log.debug("jv_ext_id -->", jv_ext_id);
				
				var jv_external_id = JVdetail.jv_externalid;
                log.debug("jv_external_id -->", jv_external_id);
				
				var jv_ext_date = JVdetail.jv_date;
                log.debug("jv_ext_date -->", jv_ext_date);
				
				jv_ext_date = jv_ext_date.replace(/-/g,"/");
                

                var jvMemo = JVdetail.jv_memo;
                log.debug("jvMemo-->", jvMemo);

                var jvJournalType = JVdetail.jv_journaltype;
                log.debug("jvJournalType-->", jvJournalType);
				
				var jvCurrency = JVdetail.jv_currency;
                log.debug("jvCurrency-->", jvCurrency);
				
				var jvTdsPeriod = JVdetail.jv_tdsperiod;
                log.debug("jvTdsPeriod-->", jvTdsPeriod);
				
				
				var fiel_int_id = JVdetail.fileInternalId;
                log.debug("fiel_int_id-->", fiel_int_id);
				
				if(fiel_int_id)
				{
						o_audit_log_record_obj.setValue({
    					fieldId: "custrecord_allsec_request_files", 
    					value: fiel_int_id});
						
						o_audit_log_record_obj.setValue({
    					fieldId: "custrecord_allsec_date", 
    					value: o_today_date_obj});
						
    			}
				/* var s_String = jv_ext_id;
    			s_error_Contents += s_String + '\n';
				
				Create_Error_Logs(o_audit_log_record_obj,fiel_int_id,s_error_Contents,s_req_payload_id); */
				
				var loadFileReduce = file.load({
                    id: fiel_int_id
                });
                log.debug("Load Files Reduce-->", loadFileReduce);
				
				
				/* var accIntId = resultSetOne.getValue({
                    name: "internalid", label: "Internal ID"
                }); */
				//log.debug("Account Int Id-->",accIntId);
				
				try{
					for (a = 0; a < 1; a++) {
                    var result = context.values[a];
                    var PRdetail = JSON.parse(result);
                    log.debug("PRdetail", PRdetail);
					
					var jvOrgIntId1 = PRdetail.jv_orgintidlab;
                    log.debug("jvOrgIntId1-->", jvOrgIntId1);
					}
					
					var o_Org_rec = record.load({
                    type: 'location',
                    id: jvOrgIntId1,
                    isDynamic: true
					});
				var subID = o_Org_rec.getValue("subsidiary");
				log.debug("subID",subID);
					

                o_JournalEntry.setValue({
                    fieldId: "subsidiary",
                    value: subID
                });
                o_JournalEntry.setText({
                    fieldId: "currency",
                    text: jvCurrency
                });
                //o_JournalEntry.setValue({fieldId:"trandate", value: 31/10/2022}); //DD/MM/YYYY
                o_JournalEntry.setValue({
                    fieldId: "memo",
                    value: jv_external_id
                });
                o_JournalEntry.setValue({
                    fieldId: "custbody_mhl_jv_type_field",
                    value: jvJournalType
                }); 
				
				o_JournalEntry.setText({
					fieldId:"trandate", 
					text: jv_ext_date
				});
				
				o_JournalEntry.setValue({
					fieldId:"custbody_mhl_jv_ref_number", 
					value: "Salary JV"
				});
				
				/* o_JournalEntry.setText({
					fieldId:"custbody_mhl_tds_period", 
					text:jvTdsPeriod
				});  */
                //o_JournalEntry.setValue({fieldId:"approvalstatus", value:2});
                //o_JournalEntry.setValue({fieldId:"custbody_mhl_jv_type_field", value:1});
                log.debug("End BOdy Level");
				}catch(exe){
					var s_String = finalJV + ','  + exe.message;
					
					log.audit("JV Record Not Created Line Level!!!!-->",s_String);
					
					s_error_Contents += s_String + '\n';
				
					s_error_Contents += s_String + '\n';
					Create_Error_Logs(o_audit_log_record_obj,fiel_int_id,s_error_Contents,s_req_payload_id);
					
				}


                //return false;
                for (a = 0; a < context.values.length; a++) {
                    var result = context.values[a];
                    var PRdetail = JSON.parse(result);
                    log.debug("PRdetail", PRdetail);

                    /*  var jvSubsidiary = PRdetail.i_jv_subsidiary;
					log.debug("jvSubsidiary",jvSubsidiary); */

                    var jvExternalId = PRdetail.jv_externalid;
                    log.debug("jvExternalId-->", jvExternalId);

                    var jvSubInObj = PRdetail.jv_subsidiary;
                    log.debug("jvSubInObj-->", jvSubInObj);

                    var jv_SubsidiaryId = PRdetail.jv_subintid;
                    log.debug("jv_SubsidiaryId-->", jv_SubsidiaryId);

                    var jv_Currency = PRdetail.jv_currency;
                    log.debug("jv_Currency-->", jv_Currency);

                    var jvDate = PRdetail.jv_date;
                    log.debug("jvDate-->", jvDate);

                    //Line level
					
                    var jv_Account = PRdetail.jv_account;
                    log.debug("jv_Account-->", jv_Account);

                    //Line level
                    var jvDebit = PRdetail.jv_debit;
                    log.debug("jvDebit-->", jvDebit);

                    //Line level
                    var jvCredit = PRdetail.jv_credit;
                    log.debug("jvCredit-->", jvCredit);

                    //Line level
                    var jvMemo = PRdetail.jv_memo;
                    log.debug("jvMemo-->", jvMemo);

                    //Line level
                    var jvRevenue = PRdetail.jv_revenue;
                    log.debug("jvRevenue-->", jvRevenue);

                    //Line level
                    var jvOrgIntId = PRdetail.jv_orgintidlab;
                    log.debug("jvOrgIntId-->", jvOrgIntId);

                    //Line level
                    var jvOrgLab = PRdetail.jv_orglab;
                    log.debug("jvOrgLab-->", jvOrgLab);

                    //Line level
                    var jvUnit = PRdetail.jv_unit;
                    log.debug("jvUnit-->", jvUnit);

                    //Line level
                    var jvSbu = PRdetail.jv_sbu;
                    log.debug("jvSbu-->", jvSbu);
					
					var jv_cust_name = PRdetail.jv_custname;
                    log.debug("jv_cust_name-->", jv_cust_name);
					
					if(jv_cust_name){
						var final_cust_id = jv_cust_name.substring(0, 6);
						log.debug("Customer Id ---->", final_cust_id);
						
						var vendorSearchObj = search.create({
						   type: "vendor",
						   filters:
						   [
							  [["custentity_mhl_vendor_sapreferencecode","is",final_cust_id],"OR",["entityid","is",final_cust_id]]
						   ],
						   columns:
						   [
							  search.createColumn({name: "internalid", label: "Internal ID"}),
							  search.createColumn({name: "altname", label: "Name"})
						   ]
						});
						
						var resultSet = vendorSearchObj.run().getRange({
							start: 0,
							end: 1000
						});
						
						if (resultSet != null && resultSet != '' && resultSet != ' ') {
							var completeResultSet = resultSet;
							var start = 1000;
							var last = 2000;

							while (resultSet.length == 1000) {
								resultSet = vendorSearchObj.run().getRange(start, last);
								completeResultSet = completeResultSet.concat(resultSet);
								start = parseFloat(start) + 1000;
								last = parseFloat(last) + 1000;

								//log.debug("Input Call","start "+start)
							}
							resultSet = completeResultSet;
							if (resultSet) {
								log.debug('In getInputData_savedSearch: resultSet: ' + resultSet.length);
							}
						}
						
						for (var i = 0; i < resultSet.length; i++) {
							var vendorId = resultSet[i].getValue({
								name: "internalid",
								label: "Internal ID"
						   });
						}
						log.debug("vendorId-->", vendorId);
						
					}
					

                    //Line level
                    var jvDepartment = PRdetail.jv_department;
                    log.debug("jvDepartment-->", jvDepartment);

                    //Not Find
                    var jvColleCenter = PRdetail.jv_collecenter;
                    log.debug("jvColleCenter-->", jvColleCenter);

                    var jv_JournalType = PRdetail.jv_journaltype;
                    log.debug("jv_JournalType-->", jv_JournalType);

                    var jv_TdsPeriod = PRdetail.jv_tdsperiod;
                    log.debug("jv_TdsPeriod-->", jv_TdsPeriod);

                    //log.debug("o_JournalEntry",o_JournalEntry);
					
					var jvAccount = PRdetail.jv_account;
					log.debug("jvAccount-->", jvAccount);
				
					var accountSearchObj = search.create({
					   type: "account",
					   filters:
					   [
						  ["number","is",jvAccount]
					   ],
					   columns:
					   [
						  search.createColumn({name: "internalid", label: "Internal ID"})
					   ]
					});
					
					var resultSet = accountSearchObj.run().getRange({
						start: 0,
						end: 1000
					});
					
					if (resultSet != null && resultSet != '' && resultSet != ' ') {
						var completeResultSet = resultSet;
						var start = 1000;
						var last = 2000;

						while (resultSet.length == 1000) {
							resultSet = accountSearchObj.run().getRange(start, last);
							completeResultSet = completeResultSet.concat(resultSet);
							start = parseFloat(start) + 1000;
							last = parseFloat(last) + 1000;

							//log.debug("Input Call","start "+start)
						}
						resultSet = completeResultSet;
						if (resultSet) {
							log.debug('In getInputData_savedSearch: resultSet: ' + resultSet.length);
						}
					}
					
					for (var i = 0; i < resultSet.length; i++) {
						var accIntId = resultSet[i].getValue({
							name: "internalid",
							label: "Internal ID"
					   });
					}
					log.debug("accIntId-->", accIntId);
						

                    log.debug("Testing", jvDebit);
					try{
                    if (jvDebit > 0) {
                        log.debug("Testing2", jvDebit);
						
                        o_JournalEntry.selectNewLine({
                            sublistId: 'line'
                        });
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "account",
                            value: accIntId
                        });
						//1217
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "debit",
                            value: jvDebit
                        });
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "memo",
                            value: jvMemo
                        });
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "custcol_mhl_revenue_segment_cust_jv",
                            value: jvRevenue
                        });
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "location",
                            value: jvOrgIntId
                        });
						
						/* o_JournalEntry.setCurrentSublistText({
							sublistId: 'line',
							fieldId:"cseg_mhl_custseg_un", 
							text:jvUnit
						});
                        o_JournalEntry.setCurrentSublistText({
							sublistId: 'line',
							fieldId:"class", 
							text:jvSbu
						}); */
                        //o_JournalEntry.setCurrentSublistValue({sublistId: 'line',fieldId:"cseg_mhl_custseg_un",line: 0, value:jvUnit});
                        //o_JournalEntry.setCurrentSublistValue({sublistId: 'line',fieldId:"class",line: 0, value:jvSbu});
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "department",
                            value: jvDepartment
                        });
                        o_JournalEntry.commitLine({
                            sublistId: 'line'
                        });
                    }

                    if (jvCredit > 0) {
                        log.debug("Testing3", jvCredit);
                        o_JournalEntry.selectNewLine({
                            sublistId: 'line'
                        });
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "account",
                            value: accIntId
                        });
						//1209
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "credit",
                            value: jvCredit
                        });
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "memo",
                            value: jvMemo
                        });
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "custcol_mhl_revenue_segment_cust_jv",
                            value: jvRevenue
                        });
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "location",
                            value: jvOrgIntId
                        });
                        /* o_JournalEntry.setCurrentSublistText({
							sublistId: 'line',
							fieldId:"cseg_mhl_custseg_un", 
							text:jvUnit
						});
                        o_JournalEntry.setCurrentSublistText({
							sublistId: 'line',
							fieldId:"class", 
							text:jvSbu
						}); */
                        o_JournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: "department",
                            value: jvDepartment
                        });
                        o_JournalEntry.commitLine({
                            sublistId: 'line'
                        });
                    }
				}catch(ex){
					var s_String = finalJV + ','  + ex.message;
					s_error_Contents += s_String + '\n';
					
					log.audit("JV Record Not Created Line Level!!!!-->",s_String);
					
				
				s_error_Contents += s_String + '\n';
				Create_Error_Logs(o_audit_log_record_obj,fiel_int_id,s_error_Contents,s_req_payload_id);
					
				}
                }

                log.debug("jvTdsPeriod 287-->", jvTdsPeriod);

                //return false;

                /* var itemLine = o_JournalEntry.getLineCount({
                        sublistId: 'line'
                    }); */

                //for (var i = 0; i < itemLine-1; i++) {

                //}

                log.debug("End BOdy Level");

                var i_JournalEnteryID = o_JournalEntry.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
				
				//File Move to processed folder
				loadFileReduce.folder = '1105045';
                loadFileReduce.save();
				
				log.debug("End File Id-->",fiel_int_id);

                log.audit("Journal Entry Record creatrd Successfully!!!-->", i_JournalEnteryID);
            } catch (e) {
				
				var s_String = finalJV + ' , '  + e.message;
                log.audit("JV Record Not Created Final!!!!-->",s_String);

				/* var s_String = jv_ext_id + ','  + e.message;
    			s_error_Contents += s_String + '\n'; */
				
				s_error_Contents += s_String + '\n';
				Create_Error_Logs(o_audit_log_record_obj,fiel_int_id,s_error_Contents,s_req_payload_id);
	
            }
				var i_submitted_integration_audit_rcrd_id = o_audit_log_record_obj.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				log.debug("Status Record-->", i_submitted_integration_audit_rcrd_id);
        }
	
        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {}
		
		function Create_Error_Logs(o_audit_log_record_obj,fiel_int_id,s_file_contents,s_req_payload_id)
		{
			var o_file_headers = { name: fiel_int_id, fileType: file.Type.CSV, contents: s_file_contents, folder: 1105041 }; //Generic Integration Solution Error Files
			try
			{
				var o_file_obj = file.create(o_file_headers);
				var i_error_file_id = o_file_obj.save();
				if(i_error_file_id)
				{
					o_audit_log_record_obj.setValue({
						fieldId: "custrecord_allsec_failure_files", 
						value: i_error_file_id});
				}
				
				
			}
			catch(err_file)
			{
				log.error('ERR IN CREATING ERROR FILE:- ',err_file);
				return {
					"request_id": s_req_payload_id,
					"error": err_file
					};
			}
		}

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });