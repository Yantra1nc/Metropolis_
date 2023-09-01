/**
 * File Name: MHL_MR_Record_updation_CSV.js
 *
 *		Date				Author						Requirement By				Comments
 *  22 June 2021		Kunal Mahajan													Script Created to Update MHL Credit Card payment setlmnt record.
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
    		var i_request_fileid = o_contextOBJ.getParameter({name: 'custscript_request_fileid_for_line_accnt'});
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
     	    		            		old_account_id: cell[1],
     	    		            		account_id: cell[2],
         	    		            	recordtype:cell[3]
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
    	try
    	{
    		log.debug('Reduce','Record ID - '+JSON.stringify(context.key));    	
    		log.debug('Reduce','Record Data - '+JSON.stringify(context.values));    	
    		log.debug('Reduce','Record Data Length - '+context.values.length); 
    		var i_record_id = context.key;
    		log.debug('Reduce','Record ID - '+i_record_id);   
    		
    		//for(var i_index = 0; i_index< context.values.length; i_index++)
    		{    			
    			var o_context = JSON.parse(context.values[0]);
//    			o_context = JSON.parse(o_context);
    			
    			var s_record_type = (o_context.recordtype).toLowerCase();
    			var i_account_id = o_context.account_id;
    			var i_old_acc_id = o_context.old_account_id
    			log.debug('Reduce JSON Details','Record Type- '+s_record_type+ '#Old Account ID- ' +i_old_acc_id +' #Account ID- ' +i_account_id);
        		
    			if(s_record_type == 'customtransaction_mhl_ccpaysettlement')
    			{
    				var o_record_id = record.load({	type: s_record_type,id: parseInt(i_record_id),isDynamic: true});
        			
        			var i_linecount = o_record_id.getLineCount({sublistId:'line'});
                    log.debug('Line Count- '+i_linecount);
                    
                    if(i_linecount > 0)
                    {
                    	
                    	var accountSearchObj = search.create({
                    		   type: "account",
                    		   filters:
                    		   [
                    		      ["number","contains",i_old_acc_id]
                    		   ],
                    		   columns:
                    		   [
                    		      search.createColumn({name: "internalid", label: "Internal ID"}),
                    		      search.createColumn({
                    		         name: "name",
                    		         sort: search.Sort.ASC,
                    		         label: "Name"
                    		      })
                    		   ]
                    		});
                    	var resultSet = accountSearchObj.run().getRange({start: 0,end: 1});
            	    	log.debug('resultSet - '+resultSet+'#length- '+resultSet.length);
            	    	
            	    	if(resultSet)
            	    	{
            	    		var i_old_acc_int_Id = resultSet[0].getValue({name: "internalid"});
    						log.debug('Search','Old Acc Internal ID - ' +i_old_acc_int_Id);
	                    		
    						var i_line_number = o_record_id.findSublistLineWithValue({sublistId: 'line',fieldId: 'account',value: i_old_acc_int_Id});
	                    	log.debug('Account '+i_old_acc_id+' found on Line - '+i_line_number);
	                    	if(i_line_number > 0)
	                    	{
	                    		log.debug('Inside Line');
	                    		
	                    		try
	                    		{
	                    			
	                    			var accountSearchObj2 = search.create({
	                         		   type: "account",
	                         		   filters:
	                         		   [
	                         		      ["number","contains",i_account_id]
	                         		   ],
	                         		   columns:
	                         		   [
	                         		      search.createColumn({name: "internalid", label: "Internal ID"}),
	                         		      search.createColumn({
	                         		         name: "name",
	                         		         sort: search.Sort.ASC,
	                         		         label: "Name"
	                         		      })
	                         		   ]
	                         		});
		                         	var resultSet2 = accountSearchObj2.run().getRange({start: 0,end: 1});
		                 	    	log.debug('resultSet - '+resultSet2+'#length- '+resultSet2.length);
		                 	    	
		                 	    	if(resultSet2)
		                 	    	{
		                 	    		var i_new_acc_int_Id = resultSet2[0].getValue({name: "internalid"});
		         						log.debug('Search','New Acc Internal ID - ' +i_new_acc_int_Id);
		         						
		                    			var lineNum = o_record_id.selectLine({sublistId: 'line',line: i_line_number});	
		                        		o_record_id.setCurrentSublistValue({sublistId: 'line',fieldId: 'account',value: i_new_acc_int_Id});
		                        		o_record_id.commitLine({sublistId: 'line'});
		                 	    	}
	                    		}
	                    		catch(err)
	                    		{
	                    			log.error('Err','Msg- '+err)
	                    		}
	                    	
	                    		try
	                    		{
	                				var i_submitted_id = o_record_id.save({enableSourcing: true,ignoreMandatoryFields: true});
	                    			log.audit('Updated Record ID- '+i_submitted_id)
	                    		}
	                    		catch(error)
	                    		{
	                    			log.error('ERR in Record Submit - '+i_record_id)
	                    		}   
	                    	
	                    	}//if(i_line_number > 0)
            	    	}
	                    	
	                    }//  if(i_linecount > 0)
        			
        			
        			
    			}
        		
    		}
    		context.write(i_record_id);
    	}
    	catch(error)
    	{
    		log.error('Catch Reduce','Msg- '+error);
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
