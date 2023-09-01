/**
 * Module Description
 * 
 * Version    Date            Author           File
 * 1.00       06 Sep 2021     Nikita     MHL delete JEs.js
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function schedule_delete_record()
{
	var o_context = nlapiGetContext();
	try
	{	
		var i_index = o_context.getSetting('SCRIPT', 'custscript_mhl_je_initiate_index');
		var fileID = o_context.getSetting('SCRIPT', 'custscriptmhl_je_file_id');
		//var i_index = o_context.getParameter('i_last_index');
		nlapiLogExecution("debug","i_index",i_index)
		if(!i_index)
			i_index = 1;
		
		nlapiLogExecution("audit","later i_index",i_index)
		
		var o_fileObj = nlapiLoadFile(fileID);
		var contents = o_fileObj.getValue();
		
		var dataLine = contents.split(/\n|\n\r/);
		nlapiLogExecution("audit","later dataLine.length",dataLine.length)
		//return false;
		for(var i = i_index; i<dataLine.length; i++)
		{
			
			var rowsLine = dataLine[i].split(",");
			var internalId = rowsLine[0];
			var transactionTpye = rowsLine[1];
			
			if(transactionTpye)
			{
				transactionTpye = transactionTpye.trim();
				var i_usage_end = o_context.getRemainingUsage();
				if (i_usage_end <= 20) 
				{
					nlapiLogExecution("audit","Reschedule","Script Reschedule at point "+i)
					//o_context.setSetting("SCRIPT", "custscript_mhl_je_initiate_index", i);
					var params = new Array();
					params['custscript_mhl_je_initiate_index'] = i;
					var status = nlapiScheduleScript('customscriptmhl_delete_je', 'customdeploymhl_delete_je',params);
					nlapiLogExecution("debug","status",status)
					
					if ( status == 'QUEUED' )
						break;
				}
				
				try
				{
                  if(internalId)
                    {
                      if(transactionTpye)
                      {						
                          nlapiDeleteRecord('journalentry',internalId);
                          nlapiLogExecution("debug","i_usage_end "+i,i_usage_end +" transactionTpye "+transactionTpye+" internalId "+internalId);
                      }
					  
                    }
					
					
				}
				catch(er)
				{
					nlapiLogExecution("error"," Record Creations "+i,er+"   internalId "+internalId)
				}				
			} 
		}
		
	nlapiLogExecution("error","Final Execution ","Stop")
	
	}//End try
	catch(e)
	{
		var i_usage_end = o_context.getRemainingUsage();
		nlapiLogExecution('error', 'Function Exception '+i_usage_end, e);
	}

}//End scheduled_delete_record
