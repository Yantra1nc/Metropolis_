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
 define(['N/ui/serverWidget', 'N/log', 'N/currentRecord', 'N/format', 'N/record', 'N/search', 'N/redirect', 'N/url', 'N/runtime','N/task','./datellib'], 
 function(serverWidget, log, currentRecord, format, record, search, redirect, url, runtime,task,datellib) {
    function onRequest(context) {
        if (context.request.method == 'GET') {
            var o_contextOBJ = runtime.getCurrentScript();
            log.debug('suiteletFunction', ' Context OBJ --> ' + o_contextOBJ);
			 var form = serverWidget.createForm({
                title: 'Create Save Search'
            });
			
									var objSoRecord = record.load({
                                    type: record.Type.SALES_ORDER,
                                    id: 71509558,
                                    isDynamic: true,
                                });
								
								var billingDate = objSoRecord.getValue({fieldId: 'enddate'});
								log.debug("billingDate", billingDate);
								var today = new Date(billingDate);
								var yyyy = today.getFullYear();
								var mm = today.getMonth() + 1; // Months start at 0!
								var dd = today.getDate();

							var bill_date = mm + '/' + dd + '/' + yyyy;
								//var bill_date=new Date(billingDate);
								log.debug("bill_date",new Date(bill_date));
								var subsidiary_gmt = objSoRecord.getValue('subsidiary');
								//log.debug("subsidiary_gmt", subsidiary_gmt);
								
								var subsidiaryTimezone_gmt = search.lookupFields({
								type: 'subsidiary',
								id: subsidiary_gmt,
								columns: ['custrecord_mhl_timezone_gmt']
								});
								//log.debug('subsidiaryTimezone_gmt',subsidiaryTimezone_gmt.custrecord_mhl_timezone_gmt);
								
								var CancellationDate=1664043581;
								var CanDate = datellib.findDateRnI(CancellationDate, null, subsidiaryTimezone_gmt.custrecord_mhl_timezone_gmt);
								log.debug("CanDate",CanDate);
								var today = new Date(CanDate);
								var yyyy = today.getFullYear();
								var mm = today.getMonth() + 1; // Months start at 0!
								var dd = today.getDate();

							var can_date = mm + '/' + dd + '/' + yyyy;
								//var can_date=new Date(CanDate);
								log.debug("can_date",new Date(can_date));
							
								
								
								
/* var o_billPayment = record.load({
				type: 'customrecord_b2b_vid_details',
                id: 5700314
          }); */
/* 		  var billDate = o_billPayment.getValue('custrecord_mhl_bill_end_date');
		  log.debug("billDate",billDate);
		  var CancellationDate=jsonObj.CancellationDate; */
		//if(billDate < new Date())
		if(new Date(bill_date) < new Date(can_date))
		{
			log.debug("IF condition","True");
		}
		else{
			log.debug("Else condition","false");
		}
			



            form.addSubmitButton({
                id: 'generate_report ',
                label: 'Create Search'
            });
						
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