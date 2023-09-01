//Custom Record --> NetSuite and Qlik Sense Configuration

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Scheduled Script
 * Script Name: MHL YIL SS All Sec Integration
 * File Name: MHL YIL SS All Sec Integration.js
 * Created On: 18/11/2021
 * Modified On: 
 * Created By: Sunil(Yantra Inc.)
 * Modified By: 
 * Description: SS All Sec Integration
 *********************************************************** */

define(['N/record', 'N/search', 'N/runtime', 'N/email','N/format','N/file','N/task','N/sftp','N/encode'],

function(record, search, runtime, email,format,file,task,sftp,encode) {
   
    function execute(scriptContext) {
    	log.debug("scriptContext.type", scriptContext.type); 
    	var errorFlag = false;
    	
    	try {
		var arrTemp = [];
			var MODULE_FOLDER = 1105040;
			var message_txt = "";			
			var sucessString="";			
			var s_success_flag = "";
          // ================= Connection to SFTP ==================== //
		  var o_contextOBJ = runtime.getCurrentScript();
          CONTEXT_OBJ = o_contextOBJ ;
		  log.debug('schedulerFunction',' Context OBJ --> '+o_contextOBJ);	
		  //var file_name = o_contextOBJ.getParameter({name: 'custscript_zupee_file_name'});
		  // log.debug('schedulerFunction',' file_name --> '+file_name);	
		
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
		             passwordGuid : i_password_guid_GP,//"3f4f3af03e62461080d1f4f4f19ac629",
		             url          : i_SFTP_server_URL_GP,
		             hostKey      : i_SFTP_host_key_GP,
		             hostKeyType  : i_SFTP_host_key_type_GP
					 // port  : 
		         });
		      log.debug('schedulerFunction', 'Connection  -->'+o_connectionOBJ); 	  
		      s_success_flag = 1;
			  var successFileContent = "successfully Create File"+ '\n';
			  //sucessString = i_SFTP_user_name_GP+',' + i_password_guid_GP+','+message_txt;
			 //successFileContent += sucessString + '\n';
		  }
		  catch(exytr)
		  {		
		     //successFileContent += '\n';
					
			  log.debug('ERROR', 'Exception Caught While SFTP Connection -->'+exytr); 
			  var successFileContent = "fail-->"+exytr.message+ '\n';		  
			 // sucessString = i_SFTP_user_name_GP+',' + i_password_guid_GP+','+message_txt;
			  //successFileContent += sucessString + '\n';
			 s_success_flag = 2;
		  }			  
			var  fileList = o_connectionOBJ.list({path: i_SFTP_directory});//'/usr/local/hdfcreverse/rev1'});
			log.debug('fileList',fileList);
          log.debug('fileList.length',fileList.length);
			if(fileList.length<=2)
				return 
			
			for(var i=0;i<fileList.length;i++)
			{
				
				//i_SFTP_directory='/usr/local/hdfcreverse/rev1',
				var file_directory = fileList[i].directory
				log.debug("file_directory",file_directory);
				if(file_directory == false){
				var f_name = fileList[i].name
				log.debug('f_name',f_name)
				
				var fileSearchObj = search.create({
                   type: "file",
                   filters:
                   [
                      ["folder","anyof","1105040"], 
                      "AND", 
                      ["name","is",f_name]
                   ],
                   columns:
                   [
                      search.createColumn({
                         name: "name",
                         sort: search.Sort.ASC,
                         label: "Name"
                      }),
                      search.createColumn({name: "folder", label: "Folder"}),
                      search.createColumn({name: "documentsize", label: "Size (KB)"})
                   ]
                });
                var searchResult = fileSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });

                if (searchResult.length == 0) {
			
					var downloadFile = o_connectionOBJ.download({
						directory : i_SFTP_directory,
						filename:f_name
					})
					log.debug('downloadFile',downloadFile);
					log.debug('downloadFile.getContents()',downloadFile.getContents().split(/\n|\n\r/));
					/* var hexEncodedString = encode.convert({
								string: downloadFile.getContents()
								inputEncoding: encode.Encoding.BASE_64,
								outputEncoding: encode.Encoding.UTF_8
							});
							log.debug('hexEncodedString',hexEncodedString) */
					var fileObj = file.create({name:f_name, fileType: file.Type.CSV, contents: downloadFile.getContents()});//.getContents()
					fileObj.folder = 1105043;
					var fileId = fileObj.save();
					log.debug({ title: 'fileId: ', details: fileId});
				}	
			  }
			}
			
    	
		}catch (e) {			   		
			log.debug( 'Catch unexpected error', e.message ) ; 			
    	}
	} //  function execute(scriptContext) 
	
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
		var a_result = new Array();
		
		var a_filters_GP = new Array();	
		//a_filters_GP.push(search.createFilter({name: 'name',operator: search.Operator.IS,values :"All Sec Details"}));					
		a_filters_GP.push(search.createFilter({name: 'name',operator: search.Operator.IS,values :"All Sec Details"}));					
				
	    var a_columns_GP = new Array();	
	    a_columns_GP.push(search.createColumn({name: 'internalid'}));	  	    
	    a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_id'}));
	    a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_password_guid'}));
		a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_url'}));
	    a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_host_key'}));
	   	a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_host_key_type'}));  
	    a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_directory_path'}));  	
		 a_columns_GP.push(search.createColumn({name: 'custrecord_mhl_sftp_port'}));  
		
		var a_search_results_GP_OBJ = search.create({type: 'customrecord_mhl_netsuite_qlik_config',filters: ["name","is","All Sec Details"],columns: a_columns_GP});
		var a_search_results_GP    = a_search_results_GP_OBJ.run().getRange({start: 0, end: 1000});

		if(_logValidation(a_search_results_GP))
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
		}//Search Results		
		return a_result;
	}//Global Parameters

    return {
        execute: execute
    };
    
});