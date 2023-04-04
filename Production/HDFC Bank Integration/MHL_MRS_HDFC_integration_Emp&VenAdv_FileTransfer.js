/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * Script Name: MHL_MRS_HDFC_integration_Emp&VenAdv_FileTransfer.js
 * Author: Avinash Lahane
 * Date: May 2022
 * Description: This script will transder EMP & Vendor payment file to bank server.
 */
// GetInputData : 10000 Units
// Map : 1000 Units
// Reduce : 5000 Units
// Summary : 10000 Units

define(['N/record', 'N/search', 'N/runtime', 'N/email','N/format','N/file','N/task','N/sftp'],

function(record, search, runtime, email,format,file,task,sftp) {
   
    function getInputData(context) {
    	try
		{
        var arrTemp = [];
		//var MODULE_FOLDER = 784;
		var message_txt = ""; 	
		var sucessString="";		
		var s_success_flag = "";
        // ================= Connection to SFTP ==================== //
		var o_contextOBJ = runtime.getCurrentScript();
        CONTEXT_OBJ = o_contextOBJ ;
		log.debug('schedulerFunction',' Context OBJ --> '+o_contextOBJ);	
			   
		var search_folder = folder_search();
		log.debug("search_folder",search_folder);
		log.debug("search_folder.length",search_folder.length);
		return search_folder;  	   		
    	}
    	catch(ex){
    		log.debug("ERROR",'Exception '+ex.message);	
    	}
		
		return arrTemp;
		 
    }
	
    function map(context) 
	{
    	
    	   log.debug("---Map-----");
		   
		
		   var key = context.key
		   log.debug("map", 'key -->'+key);
			
		   var value = context.value;
	       log.debug("map", 'Value -->'+value);
		   log.debug("map", 'Value.length -->'+value.length);
		   var a_result_GP = get_global_parameters();
		   log.debug('schedulerFunction',' Results GP --> '+a_result_GP);
		 
		  var i_SFTP_user_name_GP        = a_result_GP['sftp_user_name_gp'];	
		  var i_password_guid_GP         = a_result_GP['password_guid_gp'];					
		  var i_SFTP_server_URL_GP       = a_result_GP['sftp_server_url_gp'];
		  var i_SFTP_host_key_GP         = a_result_GP['sftp_host_key_gp']; 		 		  			 		   
		  var i_SFTP_host_key_type_GP    = a_result_GP['sftp_host_key_type_gp'];
		  var i_SFTP_directory 		     = a_result_GP['i_SFTP_directory_GP'];
		  var i_SFTP_port 				 = a_result_GP['i_SFTP_port_GP'];
		  log.debug('schedulerFunction',' SFTP Host-Key --> '+i_SFTP_host_key_GP);	
		  log.debug('schedulerFunction',' SFTP URL --> '+i_SFTP_server_URL_GP);	
		  log.debug('schedulerFunction',' SFTP User Name --> '+i_SFTP_user_name_GP);	
		  log.debug('schedulerFunction',' SFTP Password Guid --> '+i_password_guid_GP);	
		  log.debug('schedulerFunction',' SFTP i_SFTP_host_key_type_GP  --> '+i_SFTP_host_key_type_GP);	
		  log.debug('schedulerFunction',' SFTP i_SFTP_directory  --> '+i_SFTP_directory);	
		  log.debug('schedulerFunction',' SFTP i_SFTP_port  --> '+i_SFTP_port);  
		 

		  try
		  {
			  var o_connectionOBJ = sftp.createConnection({
		             username     : i_SFTP_user_name_GP,
		             passwordGuid : i_password_guid_GP,
		             url          : i_SFTP_server_URL_GP,
		             hostKey      : i_SFTP_host_key_GP,
		             hostKeyType  : i_SFTP_host_key_type_GP,
					  port  : 9222
		         });
		      log.debug('schedulerFunction', 'Connection  -->'+JSON.stringify(o_connectionOBJ)); 	  
		      		
		  }
		  catch(exytr)
		  {				
			  log.debug('ERROR', 'Exception Caught While SFTP Connection -->'+exytr); 			 
		  }			  
			
			if(value){
				
				var myFileToUpload = file.load({
					id: value
				});
				log.debug('myFileToUpload', myFileToUpload);
				var date = new Date();
				 myFileToUpload.description = 'File moved to SFTP';
				
				 date.setHours(date.getHours() + 13);
				date.setMinutes(date.getMinutes() + 30);
				 var dd = date.getDate();
				 var mm = date.getMonth()+1;
				 var yy = date.getFullYear();
				 log.debug('increase date ',date);
				var time = date.getHours() +":"+date.getMinutes()+":"+date.getSeconds();
				 log.debug('time ',time)
				var file_name = dd+""+mm+""+yy+""+time;
				try{
				var upload_file = o_connectionOBJ.upload({
					directory: '/GenericEncryption_Client_1/datafiles/clearfiles',
					filename: myFileToUpload.name,
					file: myFileToUpload,
					replaceExisting: true
				});
				log.debug("upload_file",upload_file);
				log.debug("File Uploaded successfully");
				var fileId = myFileToUpload.save();
				log.debug("fileId",fileId);
				/* var objTradeProcess = record.create({type: 'customrecord_zp_integration_logs',isDynamic: true,});
				objTradeProcess.setValue("name",myFileToUpload.name);
				objTradeProcess.setValue("custrecord_il_time",time);
				objTradeProcess.setValue("custrecord_il_date",date);
				objTradeProcess.setValue("custrecord_il_file_status",1);
				objTradeProcess.setValue("custrecord_il_zupee_file",fileId);	 */			
				}
				catch(ex)
				{
					//objTradeProcess.setValue("custrecord_il_file_status",3);
					log.error('map error: ', ex.message);	
				}
			/* 	var iTradeProcessID = objTradeProcess.save({ enableSourcing: true, ignoreMandatoryFields: true });
				log.debug("map()"," Save Record iTradeProcessID=="+iTradeProcessID); */
			
				
			} 
			
				
		   context.write(key,value); 
    	
    }

    function reduce(context) {
    
    	try{    		
     
    		log.debug("----------");
			context.write({ key: context.key , value: context.values.length }); 
			
    
    	}
    	catch(ex){
    		log.error('reduce error: ', ex.message);	
    	}
    	
    }

    function summarize(summary) {
    			 
    	var type = summary.toString();
    	    log.debug(type + ' Usage Consumed', summary.usage);
    	    log.debug(type + ' Concurrency Number ', summary.concurrency);
    	    log.debug(type + ' Number of Yields', summary.yields);
			/* var scriptTaskInvoice = task.create({taskType: task.TaskType.MAP_REDUCE});
			scriptTaskInvoice.scriptId = 'customscript_zupee_mrs_cretatejv';
			scriptTaskInvoice.deploymentId = 'customdeploy_zupee_mrs_cretatejv';					
			var scriptTaskIdInv = scriptTaskInvoice.submit();
			log.debug("scriptTaskIdInv", scriptTaskIdInv);	 */      	
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
		function get_global_parameters()
	{
		
		try
		{
			
		
		var a_result = new Array();
		
		log.debug("In Global ")
		
					
				
	    var a_columns_GP = new Array();	
	    a_columns_GP.push(search.createColumn({name: 'internalid'}));	  	    
	    a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_id'}));
	    a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_password_guid'}));
		a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_url'}));
	    a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_host_key'}));
	   	a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_host_key_type'}));  
	    a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_directory_path'}));  	
		 a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_port'}));  
		log.debug("In Global a_columns_GP")
		
		var customrecord_mhl_netsuite_qlik_configSearchObj = search.create({
		   type: "customrecord_mhl_netsuite_qlik_config",
		   filters:
		   [
			  ["name","is","SFTP Details Emp and Ven"]
		   ],
		   columns:a_columns_GP
		});
		
		var searchResultCount = customrecord_mhl_netsuite_qlik_configSearchObj.runPaged().count;
		log.debug("customrecord_mhl_netsuite_qlik_configSearchObj result count",searchResultCount);
		customrecord_mhl_netsuite_qlik_configSearchObj.run().each(function(a_search_results_GP){
		   // .run().each has a limit of 4,000 results
		    var i_SFTP_user_name_GP = a_search_results_GP.getValue({name: 'custrecord_mhl_sftp_id'});
		  var i_password_guid_GP = a_search_results_GP.getValue({name: 'custrecord_mhl_password_guid'});
		  var i_SFTP_server_URL_GP = a_search_results_GP.getValue({name: 'custrecord_mhl_sftp_url'});
		  var i_SFTP_host_key_GP = a_search_results_GP.getValue({name: 'custrecord_mhl_sftp_host_key'});		
		  var i_SFTP_host_key_type_GP = a_search_results_GP.getValue({name: 'custrecord_mhl_sftp_host_key_type'});
		  var i_SFTP_directory_GP = a_search_results_GP.getValue({name: 'custrecord_mhl_sftp_directory_path'});
		  var i_SFTP_port_GP = a_search_results_GP.getValue({name: 'custrecord_mhl_sftp_port'});		 		 		 
		    a_result['sftp_user_name_gp'] = i_SFTP_user_name_GP;
		    a_result['password_guid_gp'] = i_password_guid_GP;
		    a_result['sftp_server_url_gp'] = i_SFTP_server_URL_GP;		 
			a_result['sftp_host_key_gp'] = i_SFTP_host_key_GP;
		 	a_result['sftp_host_key_type_gp'] = i_SFTP_host_key_type_GP;	
			a_result['i_SFTP_directory_GP'] = i_SFTP_directory_GP;	
			a_result['i_SFTP_port_GP'] = i_SFTP_port_GP;	
		   
		   return true;
		});
		
		//var a_search_results_GP    = a_search_results_GP_OBJ.run().getRange({start: 0, end: 1000});

		//log.debug("a_search_results_GP",a_search_results_GP)
		/* if(_logValidation(a_search_results_GP))
		{
		
		  var i_SFTP_user_name_GP = a_search_results_GP[0].getValue({name: 'custrecord_mhl_sftp_id'});
		  var i_password_guid_GP = a_search_results_GP[0].getValue({name: 'custrecord_mhl_password_guid'});
		  var i_SFTP_server_URL_GP = a_search_results_GP[0].getValue({name: 'custrecord_mhl_sftp_url'});
		  var i_SFTP_host_key_GP = a_search_results_GP[0].getValue({name: 'custrecord_mhl_sftp_host_key'});		
		  var i_SFTP_host_key_type_GP = a_search_results_GP[0].getValue({name: 'custrecord_mhl_sftp_host_key_type'});
		  var i_SFTP_directory_GP = a_search_results_GP[0].getValue({name: 'custrecord_mhl_sftp_directory_path'});
		  var i_SFTP_port_GP = a_search_results_GP[0].getValue({name: 'custrecord_mhl_sftp_port'});		 		 		 
		    a_result['sftp_user_name_gp'] = i_SFTP_user_name_GP;
		    a_result['password_guid_gp'] = i_password_guid_GP;
		    a_result['sftp_server_url_gp'] = i_SFTP_server_URL_GP;		 
			a_result['sftp_host_key_gp'] = i_SFTP_host_key_GP;
		 	a_result['sftp_host_key_type_gp'] = i_SFTP_host_key_type_GP;	
			a_result['i_SFTP_directory_GP'] = i_SFTP_directory_GP;	
			a_result['i_SFTP_port_GP'] = i_SFTP_port_GP;				
		} *///Search Results		
		return a_result;
		}
		catch(er)
		{
			log.error("Global",er)
		}
	}//Global Parameters	
	
	function folder_search(){
		var array_name=[];
		/*  ["file.folder","anyof","724"], 
		  "AND", 
		  ["name","is","23/10/2020"],
		  "AND", 
		["file.description","isempty",""]
		["file.description","isnot","File moved to SFTP"]*/
		var folderSearchObj = search.create({
			   type: "folder",
			   filters:
			   [
			   ["file.folder","is","725609"],
			   "AND",
			   ["file.created","within","today"],
			   "AND",
			   ["file.description","isnot","File moved to SFTP"]
			   ],
			   columns:
			   [
				  search.createColumn({
					 name: "name",
					 sort: search.Sort.ASC,
					 label: "Name"
				  }),
				  search.createColumn({name: "parent", label: "Sub of"}),
				  search.createColumn({name: "internalid", label: "Internal ID"}),
				  search.createColumn({
					 name: "name",
					 join: "file",
					 label: "Name"
				  }),
				  search.createColumn({
					 name: "internalid",
					 join: "file",
					 label: "Internal ID"
				  })
			   ]
			});
		var searchResultCount = folderSearchObj.runPaged().count;
		log.debug("folderSearchObj result count",searchResultCount);
			var resultIndex = 0; 
			var resultStep = 1000;
			do	{
				var searchResult = folderSearchObj.run().getRange({
					 start: resultIndex,
					 end: resultIndex + resultStep
					 });
				log.debug("searchResult",searchResult.length);
				log.debug("searchResult",JSON.stringify(searchResult));
				
				if(searchResult.length > 0){
					for(i in searchResult){	
						var int_id = searchResult[i].getValue({
							 name: "internalid",
							 join: "file",
							 label: "Internal ID"      
						});
						array_name.push(int_id);
						}
				}
				resultIndex = resultIndex + resultStep;
			} while (searchResult.length !== 0);
			return array_name;
	}


    return {
        getInputData: getInputData,
        map: map,
      //  reduce: reduce,
        summarize: summarize
    };
    
});