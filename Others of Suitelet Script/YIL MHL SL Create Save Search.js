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
 define(['N/ui/serverWidget', 'N/log', 'N/currentRecord', 'N/format', 'N/record', 'N/search', 'N/redirect', 'N/url', 'N/runtime','N/task', 'N/email'], function(serverWidget, log, currentRecord, format, record, search, redirect, url, runtime,task,email) {
    function onRequest(context) {
		
/* 		log.debug("date",new Date());
		
		return false; */
        if (context.request.method == 'GET') {
            var o_contextOBJ = runtime.getCurrentScript();
            log.debug('suiteletFunction', ' Context OBJ --> ' + o_contextOBJ);
			 var form = serverWidget.createForm({
                title: 'Create Save Search'
            });
			
			 var o_subsibObj = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: 5
                });
				
				/* var subsidiaryDetails = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: i_subsidiaryId,
                    columns: ['mainaddress_text']
               });
			   
			   var mainaddress_text = subsidiaryDetails.mainaddress_text; */
				
                var mainaddress_text = o_subsibObj.getValue({
                    fieldId: "mainaddress_text"
                });
				log.debug("mainaddress_text",mainaddress_text);
			
			/* email.send({
				author: 118,
				recipients: 'avinash.lahane@yantrainc.com',
				subject: 'Test',
				body: 'Hello User'            
			}); 
			
			
			
			var transactionSearchObj = search.create({
			   type: "transaction",
			   filters:
			   [
				  ["type","anyof","VendPymt","Deposit","CuTrPrch150","Custom125","CustPymt","Journal","Custom153"], 
				  "AND", 
				  ["datecreated","within","01/02/2023 12:00 am"], 
				  "AND", 
				  ["mainline","is","T"],
				  //"AND", 
				  //["custbody_yil_brs_gl_list","anyof","@NONE@"], 
				  "AND", 
				  ["account.type","anyof","Bank"]
			   ],
			   columns:
			   [
				  search.createColumn({name: "internalid", label: "Internal ID"}),
				  search.createColumn({name: "tranid", label: "Document Number"}),
				 // search.createColumn({name: "custbody_yil_gl_reco", label: "GL - Reco"}),
				  search.createColumn({name: "custbody_mhl_utr_number", label: "UTR Number"}),
				  search.createColumn({name: "custbody_mhl_utrnumber", label: "UTR no. "}),
				  search.createColumn({name: "memo", label: "Memo"}),
				  search.createColumn({name: "custbody_mhl_memo", label: "Memo"}),
				  search.createColumn({
					 name: "trandate",
					 sort: search.Sort.ASC,
					 label: "Date"
				  }),
				  search.createColumn({name: "amount", label: "Amount"}),
				  search.createColumn({name: "creditamount", label: "Amount (Credit)"}),
				  search.createColumn({name: "debitamount", label: "Amount (Debit)"}),
				  search.createColumn({name: "account", label: "Account"}),
				  search.createColumn({name: "location", label: "Org"})
				  //,search.createColumn({name: "custbody_bank_reference_key", label: "Bank Reference Key"})
			   ]
			});
			var searchResultCount = transactionSearchObj.runPaged().count;
						
			transactionSearchObj.id="customsearch_yil_brs_non_reco_transactio";
			transactionSearchObj.title="DONOTDELET - YIL - BRS Non-Reco Transaction";
			var newSearchId = transactionSearchObj.save();
			

            form.addSubmitButton({
                id: 'generate_report ',
                label: 'Create Search'
            }); */
						
            context.response.writePage(form);
        } //else if (context.request.method == 'POST') {
        else {
            var request = context.request;

			context.response.write('System will generate the Saved Search and will store it. Please wait for a while and check.');
	
        }
    }
	

return {
    onRequest: onRequest
};
});