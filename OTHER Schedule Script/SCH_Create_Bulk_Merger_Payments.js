/*************************************************************
 * File Header
 * Script Type: Scheduled
 * Script Name: [SCH] Bulk Create Merger Payments
 * File Name: SCH_Create_Bulk_Merger_Payments.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Bulk Create Merger Payments
 *********************************************************** */
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
*/   
define(['N/search', 'N/record','N/runtime','N/task'], function (search, record,runtime,task) {
	
    function scheduler_function(context) 
	{
		try 
		{	
         var o_contextOBJ = runtime.getCurrentScript();
          
	 	  try
		  {		  
		     var customrecord_merger_vendor_payment_detSearchObj = search.create({
			   type: "customrecord_merger_vendor_payment_det",
			   filters:
			   [
				  ["custrecord_create_payment","is","T"], 
				  "AND", 
				  ["custrecordrefmergervendorname.custrecord_transaction_completed","is","F"],
				  "AND", 
				  ["custrecord_m_vendor_payment_x","anyof","@NONE@"],
				   "AND", 
				  ["custrecordrefmergervendorname","noneof","@NONE@"]
			   ],
			   columns:
			   [
				  search.createColumn({
					 name: "custrecordrefmergervendorname",
					 summary: "GROUP",
					  sort: search.Sort.DESC,
					 label: "Ref Merger Vendor name"
				  })
			   ]
			});
			var searchResultCount = customrecord_merger_vendor_payment_detSearchObj.runPaged().count;
			log.debug("customrecord_merger_vendor_payment_detSearchObj result count",searchResultCount);
			customrecord_merger_vendor_payment_detSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   
			   var i_P_ID = result.getValue({name: "custrecordrefmergervendorname",summary : "GROUP" });
			   log.debug("is_child_created", ' ********* i_P_ID ******* -->'+i_P_ID);  
			   
			   if(_logValidation(i_P_ID))
			   {
				 try
				 {
					var objScriptTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
					objScriptTask.scriptId = 'customscript_mr_bulk_create_merger_pmts';
					objScriptTask.deploymentId = null;
					objScriptTask.params = {
							'custscript_merger_parent_': i_P_ID				
							
					};
					var taskSubmitId = objScriptTask.submit();
					log.debug('onRequest:Post()','Script Scheduled ........'+taskSubmitId);  
				 }   
				 catch(exsdd)
				 {
					log.debug("is_child_created", ' ********* exsdd ******* -->'+exsdd);  			    
				 }
			   }
			   
			   
			   return true;
			});	 
		  }
     	  catch(easss)
		  {			
				log.debug({title: "Exception Messege easss", details: easss.message});
		  }  
			 
				
		}
		catch(exp)
		{			
			log.debug({title: "Exception Messege", details: exp.message});
		}
		
    }
	
	function _logValidation(value)
	{
	  if(value!=null && value!= 'undefined' && value!=undefined && value!='' && value!='NaN' && value!=' ')
	  {
		  return true;
	  }	 
	  else	  
	  {
		  return false;
	  }
	}	
	 return {       
        execute: scheduler_function
    };
});