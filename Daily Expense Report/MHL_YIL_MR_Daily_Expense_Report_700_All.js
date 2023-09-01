/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL MR Daily Run Expense report ALL 7000
 * File Name: MHL_YIL_MR_Daily_Expense_Report_700_All.js
 * Created On: 20/03/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Daily Expense report
 *********************************************************** */

define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', 'N/task', 'N/email'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function (file, format, record, search, runtime, task, email) {

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
        var s_file_data = '';
        var emailId = '';

        function getInputData() {

            try {

                var fileSearchObj = search.load({
                    id: 'customsearch_mhl_gl_subi_date_report_3_3'
                });

                var resultSet = fileSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                if (resultSet != null && resultSet != '' && resultSet != ' ') {
                    var completeResultSet = resultSet;
                    var start = 1000;
                    var last = 2000;

                    while (resultSet.length == 1000) {
                        resultSet = fileSearchObj.run().getRange(start, last);
                        completeResultSet = completeResultSet.concat(resultSet);
                        start = parseFloat(start) + 1000;
                        last = parseFloat(last) + 1000;

                        log.debug("getInputData Call","start "+start)
                    }
                    resultSet = completeResultSet;
                    if (resultSet) {
                        log.debug('Posting Dates: resultSet: ' , resultSet.length);
                    }
                }
                var transdetails = [];
                if (_logValidation(resultSet)) {
                    for (var i = 0; i < resultSet.length; i++) {

                        var i_postingDate = resultSet[i].getValue({
                            name: "custrecord_mhl_gl_date",                           
                            sort: search.Sort.ASC,
                            label: "Date"
                        });
						
						 var i_postingDateTxt = resultSet[i].getValue({
                            name: "custrecord_mhl_gl_dt_str",                          
                            sort: search.Sort.ASC,
                            label: "Date"
                        });

                        var i_subsidiarynohierarchy = resultSet[i].getValue({
                            name: "namenohierarchy",
                            join: "CUSTRECORD_MHL_GL_SUBSIDIARY",
                            label: "Subsidiary (no hierarchy)"
                        });

                        var i_subsidiaryId = resultSet[i].getValue({
                            name: "internalid",
                            join: "CUSTRECORD_MHL_GL_SUBSIDIARY",
                            label: "Subsidiary"
                        });

                        transdetails.push({
                            'postingDate': i_postingDate,
                            'postingDateTxt': i_postingDateTxt,
                            'subsidiary': i_subsidiarynohierarchy,
                            "subsidiaryId": i_subsidiaryId
                        });
                    }
                }
				
				//log.debug("transdetails",JSON.stringify(transdetails))
                return transdetails;
            } catch (e) {
                log.error("getInputData |  error ", e)
            }

        }

        function map(context) {
            try {
                var tempArr = [];
                var key = context.key;
                //log.debug('key ',key);
                var value = context.value;

                //log.debug('key ',key);
                var value = context.value;
                //log.debug('value ',JSON.stringify(value));

                var objParsedValue = JSON.parse(value);

                var postiong_Date = objParsedValue.postingDate;
                var subsidiaryTxt = objParsedValue.subsidiary;
                var subsidiaryId = objParsedValue.subsidiaryId;

                log.debug("MAP " + key, "subsidiaryId " + subsidiaryId+" subsidiaryTxt "+subsidiaryTxt+" postiong_Date "+postiong_Date);
				
				//return false;
				if(subsidiaryTxt)
				{
					
					var i_folderId = false;
					
					var f_folder = true;
					var folderSearchObj = search.create({
					   type: "folder",
					   filters:
					   [
						  ["name","is",subsidiaryTxt],
						  "AND",
						  ["parent","is",1093344]
					   ],
					   columns:
					   [
						  search.createColumn({
							 name: "name",
							 sort: search.Sort.ASC,
							 label: "Name"
						  }),
						  search.createColumn({name: "internalid", label: "Internal Id"}),
						  search.createColumn({name: "foldersize", label: "Size (KB)"}),
						  search.createColumn({name: "lastmodifieddate", label: "Last Modified"}),
						  search.createColumn({name: "parent", label: "Sub of"}),
						  search.createColumn({name: "numfiles", label: "# of Files"})
					   ]
					});
					var searchResultCount = folderSearchObj.runPaged().count;
					//log.debug("folderSearchObj result count",searchResultCount);
					folderSearchObj.run().each(function(result){
					   // .run().each has a limit of 4,000 results
					   i_folderId = result.getValue('internalid');
					   f_folder = false;
					   return true;
					});
					
					log.debug("Existing FOlder Id",i_folderId+" f_folder "+f_folder)
					if(f_folder == true)
					{
						var objRecord = record.create({
							type: record.Type.FOLDER,
							isDynamic: true
						});
						
						objRecord.setValue({
							fieldId: 'name',
							value: subsidiaryTxt
						});
						
						objRecord.setValue({
							fieldId: 'parent',
							value: 1093344
						});
					
						var i_folderId = objRecord.save({
							enableSourcing: true,
							ignoreMandatoryFields: true
						});
						
						log.debug("New FOlder Id",i_folderId)
					}
					
				}
				
				var dateString = postiong_Date.replace(/\//g,"_")
				
				
				var dstring = new Date();
				var string = dstring.toString();
				string = string.replace(/ /g,"_")
				var transactionSearchObj = search.create({
				   type: "transaction",
					title: 'Gl_Extraction_Report_All_' +subsidiaryTxt+"__"+dateString+"_"+string,
				   filters:
				   [
					  ["datecreated","on",postiong_Date], 
					  "AND", 
					  ["subsidiary","anyof",subsidiaryId], 
					  "AND", 
					  ["systemnotes.type","is","T"],
					  "AND", 
					  ["type","noneof","CustInvc","Custom155"]
					  /* , 
					  "AND", 
					  ["type","noneof","CustInvc","Custom155"] */
				   ],
				   columns:
				   [
					  search.createColumn({name: "trandate",sort: search.Sort.ASC,label: "Date"}),
					  search.createColumn({name: "postingperiod", label: "Period"}),
					  search.createColumn({name: "datecreated", label: "Date Created"}),
					  search.createColumn({name: "name",join: "systemNotes",label: "Created By"}),
					  search.createColumn({name: "tranid", label: "Document Number"}),
					  search.createColumn({name: "type",sort: search.Sort.ASC,label: "Type"}),
					  search.createColumn({name: "custbody_mhl_memo", label: "Header memo"}),
					  search.createColumn({name: "subsidiarynohierarchy", label: "Subsidiary (no hierarchy)"}),
					  search.createColumn({name: "memo", label: "Line Memo"}),
					  search.createColumn({name: "account", label: "Account"}),
					  search.createColumn({name: "currency", label: "Currency"}),
					  search.createColumn({name: "debitfxamount", label: "Amount (Debit) (Foreign Currency)"}),
					  search.createColumn({name: "creditfxamount", label: "Amount (Credit) (Foreign Currency)"}),
					  search.createColumn({name: "exchangerate", label: "Exchange Rate"}),
					  search.createColumn({name: "debitamount", label: "Amount (Debit)"}),
					  search.createColumn({name: "creditamount", label: "Amount (Credit)"}),
					  search.createColumn({name: "formulatext",formula: "CASE WHEN {createdby}='-System-' THEN 'Auto' ELSE 'Manual' END",label: "Manual/Auto Flag"
					  }),
					  search.createColumn({name: "posting", label: "Posting"})
				   ]
				});
				
				var searchResultCount = transactionSearchObj.runPaged().count;
				log.debug("transactionSearchObj result count",searchResultCount);
				
				
				if(searchResultCount > 0)
				{
					var File_Name = 'Gl_Extraction_Report_All_' + subsidiaryTxt + '_' + dateString +  '.csv';
					var fileObj = file.create({
						name: File_Name,
						fileType: file.Type.CSV,
						contents: null,
						description: 'This is a plain text file.',
						folder: i_folderId
					});
					//fileObj.folder = 93281;
					var file_id = fileObj.save();
					//return false;
					var searchId = transactionSearchObj.save();
				   log.debug("Created New Search",searchId)
					var o_vidObj = record.create({
						type: 'customrecord_mhl_saved_search_delete',
						isDynamic: true

					});

					o_vidObj.setValue({
						fieldId: 'custrecord_mhl_ss_del_search_id',
						value: searchId
					}); 
					
					o_vidObj.setValue({
						fieldId: 'custrecord_mhl_rows_count',
						value: searchResultCount
					}); 
					
					o_vidObj.setValue({
						fieldId: 'name',
						value: 'Gl_Extraction_Report_'+subsidiaryTxt+"_"+dateString+"_"
					});
					
					var i_saved_search_delete = o_vidObj.save();
					
					//log.debug("i_saved_search_deleteid ",i_saved_search_delete);
					
					
					var myTask = task.create({
							taskType: task.TaskType.SEARCH
						});						
						
					//log.audit('i_searchOd', i_searchOd);
					myTask.savedSearchId = searchId; // 1349855;
					myTask.fileId = file_id;
					var map_resp = myTask.submit();
					
					log.debug("myTaskId",map_resp);
				}
				
	
			   //context.write(i_postingDate, transactionRows)
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

                var fileID = context.key;

                log.debug("reduce", JSON.stringify(context.values[0]))
                //log.debug("i_internal_id",i_internal_id);
                var rowData = JSON.parse(context.values[0]);
                //log.debug("row Data",JSON.parse(rowData));
                //var rowData = JSON.parse(rowData);

                //log.debug("i_record",JSON.stringify(rowData))

                //rowData = rowData.

               // log.debug("rowData length " + fileID, rowData.length)

                for (var t = 0; t <= rowData.length; t++) {
                    var jsonArray2 = {
                        'isProcessed': 'NO',
						'fileRows':rowData.length,
                        'data': rowData[t]
                    };

                    //log.debug("i_record "+t,JSON.stringify(rowData[t]))	
                    if (rowData[t]) {
                        tempArr.push(jsonArray2);
                    }

                }

            } catch (e) {
                log.error("reduce | error", e)
            }

            //log.debug("Reduce tempArr ",JSON.stringify(ErrorArr))
            context.write({
                key: fileID,
                value: tempArr
            });

        }

        ///////////////////////////////////////////////////////////

        function summarize(summary) {
            try {

                log.debug("summary ", JSON.stringify(summary))
                var scriptObj = runtime.getCurrentScript();
                /* var paramVal = scriptObj.getParameter({name: 'custscript_cb_filter_parameter'});
                	log.debug("paramVal",paramVal);
                	
                	var myObj = JSON.parse(paramVal);
                	var emailId = myObj.e_email.toString(); 
                	log.debug("Summary","emailId "+emailId) */
                var s_FileContent = '';

                s_FileContent = 'Posting_date^^' +
                    'Posting_Period^^' +
                    'Creation_date^^' +
                    'Created_by^^' +
                    'Document_number^^' +
                    'Document_type^^' +
                    'memo_header^^' +
                    'Subsidiary^^' +
                    'memo_line^^' +
                    'Account^^' +
                    'Currency^^' +
                    'Debit_amount_in_Foreign_currency^^' +
                    'Credit_amount_in_Foreign_currency^^' +
                    'exchange_rate^^' +
                    'Debit_amount^^' +
                    'Credit_amount^^' +
                    'Indicator' +
					'Posting' +
                    '\n';
                var s_file_data = '';

                var filePartNo = 0;
                var fileCreateCounter = 0;
				var removeDuplicate = new Array();

               

                log.audit("Summary execution ", "Stop")

                //return false;
                var toDay = new Date();

                /*if(emailId)
                {				
                	
                	email.send({
                		author: 118,
                		recipients: emailId,
                		subject: 'GL - Extraction Data '+toDay,
                		body: 'Hello User, \n Please find the attachment of GL Extraction Reports',
                		attachments: [fileObj]
                	});
                } */

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

        function convert_date(d_date) {
            var d_date_convert = "";
            if (_logValidation(d_date)) {
                var currentTime = new Date(d_date);
                var currentOffset = currentTime.getTimezoneOffset();
                var ISTOffset = 330; // IST offset UTC +5:30 
                d_date_convert = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
            }
            return d_date_convert;
        }

        return {
            getInputData: getInputData,
            map: map,
           
            summarize: summarize
        };

    });