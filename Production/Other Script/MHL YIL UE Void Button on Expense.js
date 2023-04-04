/*************************************************************
 * File Header
 * Script Type: User Event
 * Script Name: MHL YIL UE Void Button on Expense (Production)
 * File Name: 
 * Created On: 05/12/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Add VOID button in expense report & redirect to Journal
 *********************************************************** */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */  
define(['N/record', 'N/format', 'N/error', 'N/ui/dialog', "N/file", 'N/ui/serverWidget', 'N/runtime', 'N/search','N/url'],

    function (record, format, error, dialog, file, ui, runtime, search, url) {

        function beforeLoad(scriptContext) {
            try {
                var record = scriptContext.newRecord
                var recordId = record.id
                var recordType = record.type

                log.debug("Rec id -->", recordId);
                log.debug("Rec Type -->", recordType);

				//record.setValue({fieldId:'custbody_ref_exp_report', value: recordId});

                if (scriptContext.type == scriptContext.UserEventType.VIEW) {

                   /*  var suitUrl = url.resolveScript({
                        scriptId: 'customscript_mhl_yil_su_void_on_expense',  //suitelet script id
                        deploymentId: 'customdeploy_mhl_yil_su_void_on_expense', //suitelet deploy id 
                        parameters: {
								'recordId': recordId
						},
						returnExternalUrl: false
                    });
					
					
                    suitUrl += '&recordId=' + recordId;
                    suitUrl += '&currentRecordType=' + recordType; */
                    //var script_fam_button = "win = window.open('" + suitUrl + "', 'win');";
					
					var suitUrl = 'https://4120343.app.netsuite.com/app/accounting/transactions/journal.nl?e=T&memdoc=0&transform=exprept&id='+ recordId +'&whence=&void=F'
					
                    var script_fam_button = "win = window.open('" + suitUrl + "', 'win');";
                    scriptContext.form.addButton({
                        id: 'custpage_customer_invoice_pdf',
                        label: 'VOID',
                        functionName: script_fam_button
                    });


                    //client script id
                    /* scriptContext.form.clientScriptFileId = 29626118;
       
                    scriptContext.form.addButton({
                        id: "custpage_popup",
                        label: "Void BTN",
                        functionName: 'handleButtonClick()'
                            //call function written in client script
                    }); */
                }
            } catch (e) {
                log.debug("Error FC =", e);
            }

        }


        return { beforeLoad }
    });