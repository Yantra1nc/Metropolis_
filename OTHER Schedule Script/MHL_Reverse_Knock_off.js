/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */

/*************************************************************
 * File Header
 * Script Type  : Schedule Script
 * Script Name  : MHL_Reverse_Knock_off
 * File Name    : MHL_Reverse_Knock_off.js
 * Created On   : 20/01/2022
 * Modified On  :
 * Created By   : Avinash Lahane(Yantra Inc.)
 * Modified By  :
 * Description  : Reverse_Knock_off
 *************************************************************/
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/redirect', 'N/render', 'N/url', 'N/https', 'N/task', 'N/format', 'N/runtime', 'N/file'],
    function(serverWidget, record, search, redirect, render, url, https, task, format, runtime, file) {
 
	  function execute(context) {
		try{

				var journalentrySearchObj = search.create({
		   type: "journalentry",
		   filters:
		   [
			  ["customer.internalid","anyof","65959"], 
			  "AND", 
			  ["trandate","within","1/12/2021","31/12/2021"], 
			  "AND", 
			  ["type","anyof","Journal"], 
			  "AND", 
			  ["mainline","is","T"], 
			  "AND", 
			  ["applyingtransaction.type","anyof","CustPymt"]
		   ],
		   columns:
		   [
			  search.createColumn({name: "trandate", label: "Date"}),
			  search.createColumn({name: "tranid", label: "Document Number"}),
			  search.createColumn({
				 name: "tranid",
				 join: "applyingTransaction",
				 label: "Document Number"
			  }),
			  search.createColumn({
				 name: "internalid",
				 join: "applyingTransaction",
				 label: "Internal ID"
			  }),
			  search.createColumn({
				 name: "type",
				 join: "applyingTransaction",
				 label: "Type"
			  })
		   ]
		});
		var searchResultCount = journalentrySearchObj.runPaged().count;
		log.debug("journalentrySearchObj result count",searchResultCount);
		journalentrySearchObj.run().each(function(result){
			
		var i_InternalId = result.getValue({name: "internalid",join: "applyingTransaction",label: "Internal ID"});
		log.debug("i_InternalId",i_InternalId);
		   // .run().each has a limit of 4,000 results
		  
		
		if(_validateData(i_InternalId)){
		var VB = record.load({
				type:'customerpayment',
				id:i_InternalId
				});
			var apply_count = VB.getLineCount("apply");
			for (var i = 0; i < apply_count; i++) 
			{
			VB.setSublistValue({
                        sublistId: 'apply',
						fieldId: 'apply',
                        line: i,
                        value: false
                    });
            
			}
			VB.save();			
		}
		 return true;
		});
		}				
			
			catch (ex) {
			log.debug("Error" +ex.message);
			}
	}	
	
	function _validateData(val) {
		if (val != null && val != 'undefined' && val != 'NaN' && val != '') {
		return true;
		}
		return false;
	}
		return {
	execute: execute
        };
    });
