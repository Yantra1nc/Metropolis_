/*

Script Name: SU_MHL_GL_Extraction_report.js
Script Type: Suitelet Script
Created Date: 15/02/2022
Created By: Avinash Lahane.
Company : Yantra Inc.
Description: 
*************************************************************/
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 **/
 define(['N/ui/serverWidget', 'N/log', 'N/currentRecord', 'N/format', 'N/record', 'N/search', 'N/redirect', 'N/url', 'N/runtime','N/task','N/file','N/email'], function(serverWidget, log, currentRecord, format, record, search, redirect, url, runtime,task,file,email) {
    function onRequest(context) {
        if (context.request.method == 'GET') {
            var o_contextOBJ = runtime.getCurrentScript();
            log.debug('suiteletFunction', ' Context OBJ --> ' + o_contextOBJ);

            var custFromDate = context.request.parameters.custFromDate;
            if (_logValidation(custFromDate)) {
                log.debug('suiteletFunction', 'Project PARAM --> ' + custFromDate);
                custFromDate = format.parse({
                    value: custFromDate,
                    type: format.Type.DATE
                })
                custFromDate = format.format({
                    value: custFromDate,
                    type: format.Type.DATE
                })
                log.debug('schedulerFunction', ' from Date   -->' + custFromDate)
            }
            var custToDate = context.request.parameters.custToDate;
            if (_logValidation(custToDate)) {
                log.debug('suiteletFunction', 'Project PARAM --> ' + custToDate);
                custToDate = format.parse({
                    value: custToDate,
                    type: format.Type.DATE
                })
                custToDate = format.format({
                    value: custToDate,
                    type: format.Type.DATE
                })
                log.debug('schedulerFunction', ' to Date   -->' + custToDate)
            }
			
			
            var custSubsidaryName = context.request.parameters.custSubsidaryName;
            log.debug("custSubsidaryName", custSubsidaryName);
            
           						
            var form = serverWidget.createForm({
                title: 'GL Extraction report'
            });
            //this is field container it is just like row or container in bootstrap
            var fieldContainer = form.addFieldGroup({
                id: 'fieldContainer',
                label: 'Field Container',
            });

			
            var from_date = form.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'From Date'    
            });
			from_date.isMandatory = true;
				
			var to_date = form.addField({
			id: 'custpage_todate',
			type: serverWidget.FieldType.DATE,
			label: 'To Date',    
		   });
			to_date.isMandatory = true;
			

            form.updateDefaultValues({
                custpage_form_submit: 'showSublist'
            });

            var subsidary = form.addField({
                id: 'custpage_subsidary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Subsidary',
                source: 'subsidiary'

            });
					
			custSubsidaryName = split_data(custSubsidaryName)
			if(_logValidation(custSubsidaryName))
			{
				subsidary.defaultValue = custSubsidaryName;
			}
		
			 if(_logValidation(custFromDate))
			{
				from_date.defaultValue = custFromDate;
			} 
			if(_logValidation(custToDate))
			{
				to_date.defaultValue = custToDate;
			}
							
           
			// form.clientScriptFileId = 7824205;
				
          
			
			/* var vendorbillSearchObj = search.load({
                id: 'customsearchcustom_gl_extraction'
            });
			
			if (_logValidation(a_filters)) {
                for (var idx = 0; idx < a_filters.length; idx++) {
                    vendorbillSearchObj.filters.push(a_filters[idx]);
                }
            }
            var a_search_results = vendorbillSearchObj.run().getRange({
                start: 0,
                end: 1000
            });
            log.debug('schedulerFunction', ' HSBC to NS Search Results  -->' + a_search_results);

            var counter = 0;
            //vendorbillSearchObj.run().each(function(result)

            if (_logValidation(a_search_results)) {
                for (var i = 0; i < a_search_results.length; i++) {
                    // .run().each has a limit of 4,000 results
					
                    var i_postingDate = a_search_results[i].getValue({name: "trandate"});
                    log.debug('i_postingDate ',i_postingDate);
					
					var i_postingPeriod = a_search_results[i].getValue({name: "postingperiod"});
                    log.debug('i_postingPeriod',i_postingPeriod);
					
                    var i_creationDate = a_search_results[i].getValue({name: "datecreated"});
                    log.debug('i_creationDate ',i_creationDate);
					
                    var i_creadedBy = a_search_results[i].getValue({name: "name",join: "systemNotes"});
                     log.debug('i_creadedBy ',i_creadedBy);
					
                    var i_documentNumber = a_search_results[i].getValue({name: "tranid"});
                    log.debug('i_documentNumber ',i_documentNumber);
					
                    var i_documentType = a_search_results[i].getValue({name: "type"});
                    log.debug('i_documentType ',i_documentType);
					
                    var i_documentDate = a_search_results[i].getValue({name: "datecreated"});
                    log.debug('i_documentDate ',i_documentDate);
					
                    var i_memoHeader = a_search_results[i].getValue({name: "custbody_mhl_memo"});
                    log.debug('i_memoHeader ',i_memoHeader);
					
                    var i_subsidiary = a_search_results[i].getValue({name: "subsidiarynohierarchy"});
                    log.debug('i_subsidiary ', i_subsidiary);
					
                    var i_memoLine = a_search_results[i].getValue({name: "memo"});
					log.debug('i_memoLine ',i_memoLine);
					
					var i_account = a_search_results[i].getValue({name: "account"});
					log.debug('i_account ',i_account);
					
					var i_currency = a_search_results[i].getValue({name: "currency"});
                    log.debug('i_currency ',i_currency);
					
					var i_debitAmtInForeigncurrency = a_search_results[i].getValue({name: "debitfxamount"});
                    log.debug('i_debitAmtInForeigncurrency ',i_debitAmtInForeigncurrency);
					
					var i_creditAmtInForeigncurrency = a_search_results[i].getValue({name: "creditfxamount"});
                    log.debug('i_creditAmtInForeigncurrency ',i_creditAmtInForeigncurrency);
					
					var i_exchangeRate = a_search_results[i].getValue({name: "exchangerate"});
                    log.debug('i_exchangeRate ',i_exchangeRate);
					
					var i_debitAmount = a_search_results[i].getValue({name: "debitamount"});
                    log.debug('i_debitAmount ',i_debitAmount);
					
					var i_creditAmount = a_search_results[i].getValue({name: "creditamount"});
                    log.debug('i_creditAmount ',i_creditAmount);
					
					//var i_indicator = a_search_results[i].getValue({name: "creditfxamount"});
                    //log.debug('i_indicator ',i_indicator);



                }

                //return true;
            } */
            

            form.addSubmitButton({
                id: 'generate_report ',
                label: 'Generate report'
            });
			
			
			
            context.response.writePage(form);
        } //else if (context.request.method == 'POST') {
        else {
			
			
			
			var scriptObj = runtime.getCurrentScript();
			
			/* var searchId = scriptObj.getParameter({
				name: 'custscript_last_search_id'
			}); */
			
			var deploymentId = scriptObj.deploymentId;
			
			log.debug("deploymentId",deploymentId)
			var searchId = scriptObj.getParameter({
				name: 'custscript_mhl_gl_extraction_searchid'
			});

			if (searchId) {
				try {
					// Deleting the search
					search.delete({
						id: searchId
					});
				} catch (e) {

				}
			}
			
            var request = context.request;
            var a_selected_items = new Array();
            var arr_t = new Array();
            log.debug('suiteletFunction', 'Post Function ...');
			
				var subsidiaryArr = [];
				var fromDateArr   = [];
				var toDateArr     = [];
				
			var userObj = runtime.getCurrentUser();
			log.debug('Current user email: ' + userObj.email);
			var toDay = new Date();
			var e_email = userObj.email;
			
			var userFromDate = context.request.parameters.custpage_fromdate;
            log.debug('post method from date', userFromDate);
			fromDateArr.push(userFromDate);
			
            var userToDate = context.request.parameters.custpage_todate;
            log.debug('post method to date', userToDate);
			toDateArr.push(userToDate);
			
            var userSubsidary = context.request.parameters.custpage_subsidary;
            log.debug('post method user subsidary ', userSubsidary);
			subsidiaryArr.push(userSubsidary);

			//var objparam = JSON.stringify({'userSubsidary': subsidiaryArr,'userFromDate':fromDateArr,'userToDate':toDateArr});
			var objparam = JSON.stringify({'userSubsidary': subsidiaryArr,'userFromDate':fromDateArr,'userToDate':toDateArr,"e_email":e_email});
			log.debug('objparam ', objparam);
			params  = {'custscript_cb_filter_parameter': objparam};
			
			
			// This code is added by Ganesh. TnE
			var dateRange = [userFromDate,userToDate]
			
			if(userSubsidary)
			{
				var transactionSearchObj = search.create({
				   type: "transaction",
					title: 'GL Extraction '+toDay,
				   filters:
				   [
					  ["trandate","within",dateRange], 
					  "AND", 
					  ["posting","is","T"],
					  "AND", 
					  ["subsidiary","ANYOF",userSubsidary], 
					  "AND", 
					  ["systemnotes.type","is","T"]
				   ],
				   columns:
				   [
					   search.createColumn({
						 name: "trandate",
						 sort: search.Sort.ASC,
						 label: "Date"
					  }),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "postingperiod", label: "Period"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "datecreated", label: "Date Created"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({
						 name: "name",
						 join: "systemNotes",
						 label: "Created By"
					  }),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "tranid", label: "Document Number"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({
						 name: "type",
						 sort: search.Sort.ASC,
						 label: "Type"
					  }),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "custbody_mhl_memo", label: "Header memo"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "subsidiarynohierarchy", label: "Subsidiary (no hierarchy)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "memo", label: "Line Memo"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "account", label: "Account"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "currency", label: "Currency"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "debitfxamount", label: "Amount (Debit) (Foreign Currency)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "creditfxamount", label: "Amount (Credit) (Foreign Currency)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "exchangerate", label: "Exchange Rate"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "debitamount", label: "Amount (Debit)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "creditamount", label: "Amount (Credit)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({
						 name: "formulatext",
						 formula: "CASE WHEN ({systemnotes.name}) IS \"-System-\" THEN 1 ELSE 0 END",
						 label: "Manual/Auto Flag"
					  })
				   ]
				});
			}else
			{
				var transactionSearchObj = search.create({
				   type: "transaction",
					title: 'GL Extraction '+toDay,
				   filters:
				   [
					  ["trandate","within",dateRange], 
					  "AND", 
					  ["posting","is","T"],					 
					  "AND", 
					  ["systemnotes.type","is","T"]
				   ],
				   columns:
				   [
					  search.createColumn({
						 name: "trandate",
						 sort: search.Sort.ASC,
						 label: "Date"
					  }),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "postingperiod", label: "Period"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "datecreated", label: "Date Created"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({
						 name: "name",
						 join: "systemNotes",
						 label: "Created By"
					  }),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "tranid", label: "Document Number"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({
						 name: "type",
						 sort: search.Sort.ASC,
						 label: "Type"
					  }),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "custbody_mhl_memo", label: "Header memo"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "subsidiarynohierarchy", label: "Subsidiary (no hierarchy)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "memo", label: "Line Memo"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "account", label: "Account"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "currency", label: "Currency"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "debitfxamount", label: "Amount (Debit) (Foreign Currency)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "creditfxamount", label: "Amount (Credit) (Foreign Currency)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "exchangerate", label: "Exchange Rate"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "debitamount", label: "Amount (Debit)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({name: "creditamount", label: "Amount (Credit)"}),
					  search.createColumn({
						 name: "formulanumeric",
						 formula: "101",
						 label: "|"
					  }),
					  search.createColumn({
						 name: "formulatext",
						 formula: "CASE WHEN ({systemnotes.name}) IS \"-System-\" THEN 1 ELSE 0 END",
						 label: "Manual/Auto Flag"
					  })
				   ]
				});
			}
			
				var searchResultCount = transactionSearchObj.runPaged().count;
				log.debug("transactionSearchObj result count",searchResultCount);
				
				var searchId = transactionSearchObj.save()
				
				
			
			
			/* var fileSearchObj = search.load({id: 'customsearch_mhl_gl_extraction_dnd'});
			if(userSubsidary)
			{
				fileSearchObj.filters.push(search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: userSubsidary}));
			}
			
			if(userFromDate && userToDate)
			{
				fileSearchObj.filters.push(search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: dateRange}));
			}
			
			var searchId = fileSearchObj.save(); */
			//log.debug("searchIdsearchId",searchId)
			
			
			var File_Name = 'Gl_Extraction_Report_'+toDay+'.csv';
			var File_NameTxt = 'Gl_Extraction_Report_'+toDay+'.txt';
			
			var fileObj = file.create({
				name: File_Name,
				fileType: file.Type.CSV,
				contents: null
			});
			fileObj.isOnline = true;
			fileObj.folder = 445702; 

		//	var i_cm_file_id = fileObj.save();
			
			var fileObj = file.create({
				name: File_NameTxt,
				fileType: file.Type.PLAINTEXT,
				contents: null
			});
			fileObj.isOnline = true;
			fileObj.folder = 445702; 

			var i_cm_file_idtx = fileObj.save();
			
			var myTask = task.create({
				taskType: task.TaskType.SEARCH
			});						
			
			//log.audit('i_searchOd', i_searchOd);
			myTask.savedSearchId = searchId; // 1349855;
			myTask.fileId = i_cm_file_idtx;
			var map_resp = myTask.submit();
			
			log.debug("myTaskId",map_resp);
			
		/* 	var deploymentRec = record.load({
					type: 'scriptdeployment',
					id: deploymentId
				});

				deploymentRec.setValue({
					fieldId: 'custscript_last_search_id',
					value: i_searchOd
				});
				deploymentRec.save(); */
			
			//var map_resp = callMRfromScript(params);
			
			
				
		
			
			 var fileObj = file.load({
					id: i_cm_file_idtx
				});
				
			var fileUrl = fileObj.url;
			
			  var form = serverWidget.createForm('GL Extraction report',false);
			  var from_date = form.addField({
                id: 'custpage_msg',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'From Date'    
            }).defaultValue = '<p style=\'font-size:20px\'><b style="color: red;">Please Do Not Refresh this Page.</b> <br>System will generate the file and will store it in File Cabinet. Please wait for a while and you will get the email notification for the same.<br> Status: '+map_resp+'</p><br><br>';
			
			//context.response.write('<h2>System will generate the file and will store it in File Cabinet. Please wait for a while and check.</h2>');
			context.response.writePage(form);
			
			/*var fileSearchObj = search.load({id: 'customsearch_mhl_gl_extraction_dnd'});
			var resultSet = fileSearchObj.run().getRange({start : 0,end : 1000});
			
			for(var r in  resultSet)
			{
				var i_tranid = resultSet[r].getValue("tranid");
			}*/
			//if (searchId) 
			{
				log.debug("delete searchId",searchId)
				try {
					// Deleting the search
				/*	search.delete({
						id: searchId
					});*/
				} catch (e) {

				}
			} 
			
			if(e_email)
			{				
				
				email.send({
					author: 118,
					recipients: e_email,
					subject: 'GL - Extraction Data '+toDay,
					body: 'Hello User, \n Please click on the below link to download the GL Extraction <br> <a href="'+fileUrl+'">Donwload File</a>',
					attachments: [fileObj]
				});
			}
			
				/* redirect.toSuitelet({
					scriptId: 'customscript_mhl_gl_extraction_report',
					deploymentId: 'customdeploy_mhl_gl_extraction_report',
				}); */
				
		// redirect.toSuitelet({scriptId: 'customscript_mhl_gl_extraction_report' , deploymentId:'customdeploy_mhl_gl_extraction_report',parameters : null});
        }
    }
	
	function callMRfromScript(params){
		try{
			var mapReduceScriptId = 'customscript_mr_mhl_gl_extraction_report';
			var mrTask = task.create({taskType: task.TaskType.MAP_REDUCE,scriptId: mapReduceScriptId,deploymentId: 'customdeploy_mr_mhl_gl_extraction_report',params:params});
			var mrTaskId = mrTask.submit();
			return mrTaskId;
			log.debug("params",params)
		}catch(e){log.error("Error In callMRfromScript ",e)}
    }

function split_data(data_q)
{
   var a_data_ARR = new Array();	
  if(_logValidation(data_q))
  {	 
	  var i_data_TT = new Array();
	  i_data_TT =  data_q.toString();

		 if(_logValidation(i_data_TT))
		 {
			for(var dt=0;dt<i_data_TT.length;dt++)
			{
				a_data_ARR = i_data_TT.split(',');
				break;				
			}	
		}//Data TT   
  }	  
  return a_data_ARR ;
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

function _logValidation(value) {
    if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
        return true;
    } else {
        return false;
    }
}
return {
    onRequest: onRequest
};
});