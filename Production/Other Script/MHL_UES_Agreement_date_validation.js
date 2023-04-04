/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL UES Agreement Date Validation
 * File Name: MHL_UES_Agreement_date_validation
 * Created On: 22/10/2021
 * Modified On:
 * Created By: Ganesh Sapkale(Yantra Inc.)
 * Modified By:
 * Description: End Date can not be less than Start Date
 
 *********************************************************** */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],

function(record) 
{
   

    function beforeLoad(scriptContext) {

    }

    function beforeSubmit(scriptContext) 
    {
    		//customrecord_mhl_agreement_details
    	if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT)
    	{
            log.debug("entered");
            
            var currRec = scriptContext.newRecord;

            var d_start_Date = currRec.getValue('custrecord_mhl_ad_start_date');
            log.debug('d_start_Date- ', d_start_Date);
            var d_end_Date = currRec.getValue('custrecord_mhl_ad_end_date');
            log.debug('d_end_Date- ', d_end_Date);
            
            if(d_end_Date < d_start_Date)
            {
            	throw 'End Date can not be less than Start Date.'
            }
            
            
    	}
    }

    function afterSubmit(scriptContext) 
    {

    }

 /*   beforeLoad: beforeLoad,
    ,
    afterSubmit: afterSubmit*/
    
    return {
        beforeSubmit: beforeSubmit
    };
    
});
