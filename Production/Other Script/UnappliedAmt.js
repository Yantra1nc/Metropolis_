/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: UnappliedAmt
 * File Name: UnappliedAmt.js
 * Created On: 20/09/2022
 * Modified On: 
 * Created By: Sunil K (Yantra Inc.)
 * Modified By: 
 * Description: Unapplied amount set in custom field.
 *************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/url', 'N/error'],
    function (record, search, url, error) {

        function beforeSubmit(scriptContext) {
            try {
				
				if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT) {
				
                var recObj = scriptContext.newRecord;
                //log.debug("Rec Obj = ", recObj);

                var unAmt = recObj.getValue({
                    fieldId: 'unapplied'
                });
                log.debug("Unapplied Amount ---> ", unAmt);
                   
                recObj.setValue({fieldId: 'custbodymhl_unapplied_amount',value: unAmt});

                /*  var recCust_obj = record.load({
                    type: record.Type.CUSTOMER_PAYMENT,
                    id: custName,
                    isDynamic: true,
                });

                recCust_obj.setValue({ fieldId: 'custbodyunappliedamount', value: unAmt });
				
                var recId = recCust_obj.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug("Record Id = ", recId); */ 
			}

            } catch (e) {
                log.debug("Error = ", e);
            }
        }

        return {
            beforeSubmit: beforeSubmit
        }
    });