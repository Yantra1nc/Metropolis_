/*************************************************************
 * File Header
 * Script Type: Suitelet
 * Script Name: [SU] MHL YIL BRS Development
 * File Name: [SU] MHL YIL BRS Development.js
 * Created On: 16/03/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: BRS Development
 ************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/runtime', 'N/ui/serverWidget', 'N/record', 'N/http'],

    function(email, runtime, serverWidget, record, http) {

        function onRequest(scriptContext) {
            var form = serverWidget.createForm({
                title: 'Welcome to Production'
            });

            //add text field
            var custName = form.addField({
                id: 'customer',
                type: serverWidget.FieldType.TEXT,
                label: 'Customer'
            });
			
			var custName = form.addField({
                id: 'custpage_firtname',
                type: serverWidget.FieldType.TEXT,
                label: 'First Name'
            });
			
			var custName = form.addField({
                id: 'custpage_lastname',
                type: serverWidget.FieldType.TEXT,
                label: 'Last Name'
            });

            var email = form.addField({
                id: 'email',
                type: serverWidget.FieldType.EMAIL,
                label: 'Email'
            });

            var address = form.addField({
                id: 'address',
                type: serverWidget.FieldType.TEXT,
                label: 'Address'
            });

            form.addSubmitButton({
                label: 'SUBMIT'
            });

            
            scriptContext.response.writePage(form);
        }
        return {
            onRequest: onRequest
        };
    });