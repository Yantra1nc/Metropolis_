/**
 * Module Description
 * 
 * Version    Date            Author           File
 * 1.00       18-09-2021      Ganesh      SCH Udate GRN.js
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function schedule_update_grn_record()
{
	var o_context = nlapiGetContext();
	try
	{

		
		var i_index = o_context.getSetting('SCRIPT', 'custscript_index_start');
		var fileID = o_context.getSetting('SCRIPT', 'custscript_file_id');
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
			
			
			var runScript = o_context.getSetting('SCRIPT', 'custscript_znt_sch_last_index');
			if(runScript == "Stop")
			{
				nlapiLogExecution('DEBUG', 'runScript', runScript);
				break;
			}
			var rowsLine = dataLine[i].split(",");
			var internalId = rowsLine[0];
			var transactionTpye = rowsLine[1];
			//var invoiceNumber= rowsLine[2];
			
			if(transactionTpye)
			{
				transactionTpye = transactionTpye.trim();
				var i_usage_end = o_context.getRemainingUsage();
				if (i_usage_end <= 20) 
				{
					nlapiLogExecution("audit","Reschedule","Script Reschedule at point "+i)
					//o_context.setSetting("SCRIPT", "customscript_sch_mhl_delete_crr_records", i);
					var params = new Array();
					params['custscript_index_start'] = i;
					var status = nlapiScheduleScript('customscript_update_grn', 'customdeploy_update_grn',params);
					nlapiLogExecution("debug","status",status)
					
					if ( status == 'QUEUED' )
						break;
				}
				
				try
				{
					if(internalId)
					{  var o_vp_rec = nlapiLoadRecord(transactionTpye,internalId);
					   //o_vp_rec.setFieldValue('custbody_mhl_venbill_created', 'T');
					   o_vp_rec.setFieldValue('custrecord_mhl_approval_status', 2);
					   var i_saved_vp = nlapiSubmitRecord(o_vp_rec, true, true);


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

}//
