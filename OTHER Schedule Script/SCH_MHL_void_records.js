/**
 * Module Description
 * 
 * Version    Date            Author           File
 * 1.00       08 Nov 2020     Ganesh      SCH_MHL_void_records.js
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function schedule_void_record()
{
	var o_context = nlapiGetContext();
	try
	{
		var i_limit = o_context.getSetting('SCRIPT', 'custscript_mhl_sch_void_ast_index');//request.getParameter('custscript_last_index');
		nlapiLogExecution('DEBUG', 'i_limit', i_limit);
		
		var i_index = o_context.getSetting('SCRIPT', 'custscript_mhl_sch_void_initiate_index');
		var fileID = o_context.getSetting('SCRIPT', 'custscript_mhl_sch_void_file_id');
		//var i_index = o_context.getParameter('i_last_index');
		nlapiLogExecution("debug","i_index",i_index)
		if(!i_index)
			i_index = 1;
		
		nlapiLogExecution("audit","later i_index",i_index)
		
		//var fileID = '12953058';
		
		var o_fileObj = nlapiLoadFile(fileID);
		var contents = o_fileObj.getValue();
		
		var dataLine = contents.split(/\n|\n\r/);
		nlapiLogExecution("audit","later dataLine.length",dataLine.length)
		//return false;
		for(var i = i_index; i<dataLine.length; i++)
		{
			
			
			var runScript = o_context.getSetting('SCRIPT', 'custscript_mhl_sch_void_ast_index');
			if(runScript == "Stop")
			{
				nlapiLogExecution('DEBUG', 'runScript', runScript);
				break;
			}
			var rowsLine = dataLine[i].split(",");
			var internalId = rowsLine[0];
			var transactionTpye = rowsLine[1];
			//var transactionTpye1 = 'customerpayment';
			
			if(transactionTpye)
			{
				transactionTpye = transactionTpye.trim();
				//transactionTpye1 = transactionTpye1.trim();
				var i_usage_end = o_context.getRemainingUsage();
				if (i_usage_end <= 20) 
				{
					nlapiLogExecution("audit","Reschedule","Script Reschedule at point "+i)
					//o_context.setSetting("SCRIPT", "custscript_sch_initiate_index", i);
					var params = new Array();
					params['custscript_sch_initiate_index'] = i;
					var status = nlapiScheduleScript('customscript_sch_mhl_void_record', 'customdeploy_sch_mhl_void_record',params);
					nlapiLogExecution("debug","status",status)
					
					if ( status == 'QUEUED' )
						break;
				}
				
				try
				{
                  if(internalId)
                    {
                      if(transactionTpye == 'Bill Payment')
                      {						
                          nlapiVoidTransaction('vendorpayment',internalId);
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

}//End suitelet_void_record
