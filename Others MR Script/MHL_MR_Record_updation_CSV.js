/**
 * File Name: MHL_MR_Record_updation_CSV.js
 *
 *		Date				Author						Requirement By				Comments
 *  16 June 2021		Kunal Mahajan													Script Created to Update Deposite record.
 *
 */

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime','N/file','N/format'],

function(record, search, runtime,file,format) 
{
   
    function getInputData() 
    {
    	try
    	{

    		var o_contextOBJ = runtime.getCurrentScript();
    		var i_request_fileid = o_contextOBJ.getParameter({name: 'custscript_request_fileid'});
    		if(i_request_fileid)
    		{
				log.debug('i_request_fileid:- '+i_request_fileid);
    			var fileObj = file.load({id:i_request_fileid});    			
    			var s_FileContents = fileObj.getContents();
    			if(s_FileContents)
    			{
    				var rows_data = s_FileContents.split('\r\n');
    				var a_data_array = [];
    				for(var csv_index = 1; csv_index < rows_data.length-1; csv_index++)
    				{
    					var cell = rows_data[csv_index].toString().split(',');
    					if(cell[2])
     		            {
     		            	 a_data_array.push({
     		            		'record_id': cell[0],
     	    		            	values:{
     	    		            		account_id: cell[1],
         	    		            	recordtype:cell[2]
     	    		            	}    		            	
     	    		            });
     		            }    					
    				}
    			}
    		}    		 
			return a_data_array;
    	
    	}
    	catch(error)
    	{
    		log.error('Catch GetInput','Msg- '+error);
    	}
    }

    function map(context)
    {
    	try
    	{
    		var a_usage_data = JSON.parse(context.value);
            context.write({
            	key:a_usage_data.record_id,
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
		var i_record_id = context.key;
    	log.debug('Reduce','Record ID - '+i_record_id);  
		
    	try
    	{
    		log.debug('Reduce','Record ID - '+JSON.stringify(context.key));    	
    		log.debug('Reduce','Record Data - '+JSON.stringify(context.values));    	
    		log.debug('Reduce','Record Data Length - '+context.values.length); 
    		 
    		
    		//for(var i_index = 0; i_index< context.values.length; i_index++)
    		{    			
    			var o_context = JSON.parse(context.values[0]);
//    			o_context = JSON.parse(o_context);
    			
    			var s_record_type = o_context.recordtype.toLowerCase();//.toLowerCase();
    			var i_account_id = o_context.account_id;
    			log.debug('Reduce JSON Details','Record Type- '+s_record_type+ ' #Account ID- ' +i_account_id);
        		
    			var o_record_id = record.load({type: s_record_type,id: parseInt(i_record_id),isDynamic: true});
    			var i_old_account = o_record_id.getValue({fieldId: 'account'});
        		var i_org = o_record_id.getValue({fieldId: 'location'});
        		var i_unit = o_record_id.getValue({fieldId: 'cseg_mhl_custseg_un'});
        		var i_collection_center = o_record_id.getValue({fieldId: 'cseg_mhl_locations'});
        		var i_sbu = o_record_id.getValue({fieldId: 'class'});
        		var i_department = o_record_id.getValue({fieldId: 'cseg_mhl_custseg_de'});
        		var i_revenue_segment = o_record_id.getValue({fieldId: 'department'});
        		log.debug('Reduce Record Details','Old Account Id- '+i_old_account+' #org- '+i_org+' #i_unit- '+i_unit+' #i_collection_center- '+i_collection_center+' #i_sbu- '+i_sbu+' #i_department- '+i_department+' #i_revenue_segment- '+i_revenue_segment);
        		
        		o_record_id.setValue({fieldId: 'account',value: i_account_id,ignoreFieldChange: false}); 
        		o_record_id.setValue({fieldId: 'location',value: i_org,ignoreFieldChange: false}); 
        		o_record_id.setValue({fieldId: 'cseg_mhl_custseg_un',value: i_unit,ignoreFieldChange: false}); 
        		o_record_id.setValue({fieldId: 'cseg_mhl_locations',value: i_collection_center,ignoreFieldChange: false}); 
        		o_record_id.setValue({fieldId: 'class',value: i_sbu,ignoreFieldChange: false}); 
        		o_record_id.setValue({fieldId: 'cseg_mhl_custseg_de',value: i_department,ignoreFieldChange: false}); 
        		o_record_id.setValue({fieldId: 'department',value: i_revenue_segment,ignoreFieldChange: false}); 
        		
        		//try
        		{
        			var i_submitted_id = o_record_id.save({enableSourcing: true,ignoreMandatoryFields: true});
        			log.audit('Updated Record ID- '+i_submitted_id)
        		}
        		/*catch(error)
        		{
        			log.error('ERR in Record Submit - '+i_record_id)
        		}   */   		
        		
    		}
    		
    		context.write(i_record_id);
    		
    	}
    	catch(error)
    	{
    		log.error('Catch Reduce','Msg- '+error);
    		log.error('Error Record','Record- '+i_record_id);
    	}
    }

    function summarize(summary) 
    {
    	try
    	{
    		 log.debug('## In summarize:- ');
    	     var a_Array = new Array();
    	     
    	     summary.output.iterator().each(function(value) { 
 				a_Array.push(value);          
 				return true;
 			});
    	     
    	     log.debug('Summary','Array:- '+a_Array+'#'+a_Array[0]);
    	}
    	catch(error)
    	{
    		log.error('Catch Summerize','Msg- '+error);
    	}
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});