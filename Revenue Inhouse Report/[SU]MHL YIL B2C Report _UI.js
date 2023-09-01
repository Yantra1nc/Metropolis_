/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: [SU]MHL YIL B2C Report _UI
 * File Name: [SU]MHL YIL B2C Report _UI.js
 * Created On: 12/07/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: B2C Revenue Inhouse Report
 *********************************************************** */

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/log', 'N/format', 'N/record', 'N/search', 'N/redirect', 'N/url', 'N/runtime', 'N/file', 'N/config', 'N/encode', './searchlib','N/task'],

    function(serverWidget, log, format, record, search, redirect, url, runtime, file, config, encode, searchlib, task) {

        function onRequest(scriptContext) {
            try {
                if (scriptContext.request.method === 'GET') {
                    var form = serverWidget.createForm({
                        title: 'B2C Revenue Inhouse Report'
                    });

                    /*  var selectEmp = form.addField({
                         id: 'c_customer',
                         type: serverWidget.FieldType.MULTISELECT,
                         label: 'CUSTOMER',
                         source: 'customer'
                     });

                     selectEmp.isMandatory = true; */

                    var fromDate = form.addField({
                        id: 'c_fromdate',
                        type: serverWidget.FieldType.DATE,
                        label: 'FROM DATE'
                    });
					
					fromDate.isMandatory = true;

                    var toDate = form.addField({
                        id: 'c_todate',
                        type: serverWidget.FieldType.DATE,
                        label: 'TO DATE'
                    });
					
					toDate.isMandatory = true;
					
					var sendEmail = form.addField({
                        id: 'c_email',
                        type: serverWidget.FieldType.TEXT,
                        label: 'SEND EMAIL'
                    });

                  sendEmail.isMandatory = true;
					

                    form.addSubmitButton({
                        label: 'Send Email'
                    });

                    scriptContext.response.writePage(form);
                } else {


                    var request = scriptContext.request;

                    /*  var custId = request.parameters.c_customer;

                     //custId = custId.split("\u0005");
                     log.audit("Customer Id ---->", custId); */

                    var from_date = request.parameters.c_fromdate;
                    log.audit("From Date -->", from_date);
                    var to_date = request.parameters.c_todate;
                    log.audit("To Date -->", to_date); 
					
					var user_email = request.parameters.c_email;
                    log.audit("user_email -->", user_email);

                    //CSV Table Header
					
					var objScriptTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
					objScriptTask.scriptId = 'customscript_mhl_yil_b2c_rev_inhs_report';
					objScriptTask.deploymentId = 'customdeploy_mhl_yil_b2c_rev_inhs_report';
					objScriptTask.params = {
						'custscript_b2c_from_date': from_date,
						'custscript_b2c_to_date': to_date,
						'custscript_b2c_revnue_email':user_email
					};
					
					log.debug("objScriptTask-->",objScriptTask);
					
					var taskSubmitId = objScriptTask.submit();
					log.debug('onRequest:Post()','Script Scheduled .taskSubmitId =='+taskSubmitId);
					
					
					scriptContext.response.write('Hello user we have send Revenue Inhouse Report on your email.');


                }
                //End Post method

            } catch (e) {
                log.debug('Error ', e);
            }
        }
        return {
            onRequest: onRequest
        };
    });