/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL MR | Update Consolidated Inv Status
 * File Name: MHL_MR_Cons_Inv_status_Update.js
 * Created On: 23/06/2021
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Update Consolidated Inv Status
 *********************************************************** */

define(['N/record', 'N/search', 'N/runtime','N/file','N/task'],

function(record, search, runtime,file,task) 
{
	var arr_record = [];
     function getInputData() 
     {
    	 var o_contextOBJ = runtime.getCurrentScript();
    	 var s_recordType = 'customtransaction_mhl_consolidatedinvoic';
         var i_req_con_inv_id = o_contextOBJ.getParameter({name: 'custscript_cons_inv_rec_id'});
  		log.debug('getInputData',' Consolidated Inv Record ID #  --> '+i_req_con_inv_id);
  		
  		var o_conso_inv = record.load({type: s_recordType,id: i_req_con_inv_id, isDynamic: true});
  		
  		var i_linecount = o_conso_inv.getLineCount({sublistId:'line'});
        log.debug('Line Count- '+i_linecount);
         
    	if(i_linecount > 0)
        {
         	for(var index = 0; index < i_linecount; index++)
         	{
         		var i_inv_id = o_conso_inv.getSublistValue({ sublistId: 'line', fieldId: 'custcol_mhl_linked_vid', line: index});
         		
         		arr_record.push({
         			'invoice_id':i_inv_id,
						'values':{
							'conso_inv_id':i_req_con_inv_id
						}
			});
         	}	            
         	log.debug('arr_record- '+arr_record);
        }	
    	 return arr_record;
    }
     
    function map(context) 
    {
    	try
    	{
			log.debug('Map');
			
    		var a_usage_data = JSON.parse(context.value);
            context.write({
            	key:a_usage_data.invoice_id,
    			value : a_usage_data.values
    		});
    	}
    	catch(error)
    	{
    		log.error('Catch Map','Msg- '+error);
    	}
		 
    }

    function reduce(context)
    {
    	var o_contextOBJ = runtime.getCurrentScript();
		var s_state = o_contextOBJ.getParameter({name: 'custscript_state'});
		log.debug('Reduce','State- '+s_state);
		
		var i_record_id = context.key;
		log.debug('Reduce','Record ID - '+i_record_id);  
    	//for(var index_data = 0; index_data < context.values.length;index_data++)
    	{
    		var o_context = JSON.parse(context.values[0]);
    		var i_conso_invRec_id = o_context.conso_inv_id;
			log.debug('Reduce','i_conso_invRec_id - '+i_conso_invRec_id);
			
			
			if(s_state == 'reject')
			{
				log.debug('reject')
				
				try
	    		{
	    			log.debug('Try Reject','Inv- '+i_record_id);
	    			var otherId = record.submitFields({ type: 'invoice', id: i_record_id, values: { 'custbody_mhl_conso_invoice_no_pilotrun': '','custbody_mhl_conso_invoice_pilot_run':''}});
	    		}
	    		catch(error)
	    		{
	    			log.debug('Catch Reject','CM- '+i_record_id);
	    			var otherId = record.submitFields({ type: 'creditmemo', id: i_record_id, values: { 'custbody_mhl_conso_invoice_no_pilotrun': '','custbody_mhl_conso_invoice_pilot_run':''}});
	    		}
			}
			
			if(s_state == 'approve')
			{
				try
	    		{
	    			log.debug('Try Approve','Inv- '+i_record_id);
	    			var otherId = record.submitFields({ type: 'invoice', id: i_record_id, values: { 'custbody_mhl_conso_invoice_no_pilotrun': i_conso_invRec_id,'custbody_mhl_conso_invoice_pilot_run':true}});
	    		}
	    		catch(error)
	    		{
	    			log.debug('Catch Approve','CM- '+i_record_id);
	    			var otherId = record.submitFields({ type: 'creditmemo', id: i_record_id, values: { 'custbody_mhl_conso_invoice_no_pilotrun': i_conso_invRec_id,'custbody_mhl_conso_invoice_pilot_run':true}});
	    		}
			}
			
    	}
    	context.write(i_record_id);
    }

     function summarize(summary) 
     {
    	 log.debug('## In summarize:- ');
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
