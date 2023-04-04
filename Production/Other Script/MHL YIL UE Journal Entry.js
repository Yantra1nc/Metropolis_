/*************************************************************
 * File Header
 * Script Type: User Event
 * Script Name: MHL YIL UE Journal Entry (Production)
 * File Name: 
 * Created On: 05/12/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Cretate Journal entry after void expense report 
 *********************************************************** */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */  
define(['N/record', 'N/format', 'N/error', 'N/ui/dialog', "N/file", 'N/ui/serverWidget', 'N/runtime', 'N/search','N/url', 'N/https'],

    function (record, format, error, dialog, file, ui, runtime, search, url, https) {

        function beforeLoad(scriptContext) {
            try {
                /*  var baseURL = window.location.href;
				 log.debug("Base Url -->", baseURL); */
				 //var refSub = getParameterFromURL()["id"];
				 
				var record = scriptContext.newRecord
                var recordId = record.id
                var recordType = record.type
				 
				//log.debug("Url =>", refSub);
				
				var paraObj = scriptContext.request.parameters;
				log.debug("Paramater Obj -->", paraObj);
				
				var transRecName = scriptContext.request.parameters.transform;
				log.debug("Transform Rec name =>", transRecName);
				
				if(transRecName){
					var expRecId = scriptContext.request.parameters.id;
					log.debug("expRecId =>", expRecId);
				}
				
				var totalLineCount = record.getLineCount({ sublistId: 'line' });
                log.debug("totalLineCount:- ", totalLineCount);
				
				if(expRecId && transRecName == "expensereport"){
				//for (var t = 0; t < totalLineCount; t++) {
                        var credit = record.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: 0 });
                        log.debug("credit:- ", credit);
						
						var debit = record.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: 1 });
                        log.debug("debit:- ", debit);
						
						record.setSublistValue({ sublistId: 'line', fieldId: 'credit', value: credit, line: 1 });
						
						record.setSublistValue({ sublistId: 'line', fieldId: 'debit',value: debit, line: 0 });
						
						record.setSublistValue({ sublistId: 'line', fieldId: 'debit', value: "", line: 1 });
						
						record.setSublistValue({ sublistId: 'line', fieldId: 'credit',value: "", line: 0 });
						
						record.setValue({
						fieldId: 'custbody_expense_report_ref',
						value: expRecId
						});
				}	
						
                //}
				
				/* var url = "https://5688780-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=956&deploy=1&compid=5688780_SB1&h=e6a53c16c404ea8f2faa&refsub=" + refSub; */
				
				/* var url = 'https://4120343-sb1.app.netsuite.com/app/accounting/transactions/journal.nl?e=T&void=F&memdoc=0&transform=exprept&custbody_ref_exp_report='+ refSub +'&whence='
			   */	
			   
				/*  var url = 'https://4120343-sb1.app.netsuite.com/app/accounting/transactions/journal.nl?e=T&memdoc=0&transform=exprept&id='+ refUrl +'&whence=&void=F'
				*/
				
				//window.location = url;

				//var rec = currentRecord.get();

				/* if (expRecId) {
					
				} */  
            } catch (e) {
                log.debug("Error FC =", e);
            }

        }
		
		/* function getUrlVars() {
            var vars = [],
                hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        } */
		
		
		/* function getParameterFromURL(param) {
			var query = window.location.search.substring(1);
			var vars = query.split("&");
			for (var i = 0; i < vars.length; i++) {
				var pair = vars[i].split("=");
				if (pair[0] == param) {
					return decodeURIComponent(pair[1]);
				}
			}
			return (false);
		}
		 */
		


       return {
            beforeLoad: beforeLoad
        };
    });