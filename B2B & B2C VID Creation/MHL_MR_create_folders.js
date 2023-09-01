/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Map Reduce Script
 * Script Name: MHL_MR_create_folders.js
 * File Name: MHL_MR_create_folders.js
 * Created On: 1/04/2022
 * Modified On: 
 * Created By: Nikita Mugalkhod. (Yantra Inc.)
 *********************************************************** */
// GetInputData : 10000 Units
// Map : 1000 Units
// Reduce : 5000 Units
// Summary : 10000 Units

define(['N/record', 'N/search', 'N/runtime', 'N/email','N/format','N/file','N/task'],

function(record, search, runtime, email,format,file,task){
	
    function getInputData(context){
    	try
		{
			return search.load({
				id: 'customsearch_mhl_rni_processed_file_move'
			})
		}	
		catch(excsw)
		{
		  log.error("ERROR EXCEPTION", 'excsw -->'+excsw);				
		}
		//return return_val;
    }	
    function map(context) 
	{
    	try
		{
    	   var a_usage_data = JSON.parse(context.value);

                log.debug("MAP", "a_usage_data" + JSON.stringify(a_usage_data))
                context.write({
                    key: a_usage_data.id,
                    value: a_usage_data.values
                }); 
    	}
    	catch(ex)
		{
    		log.error('map error: ', ex.message);	
    	}
    }

    function reduce(context)
	{
    
    	try
		{		
			//context.write({ key: context.key , value: context.values}); 
			
			//log.debug("Value",JSON.stringify(context.values))
			
			
			log.debug("context.key",context.key)
			var redData = JSON.parse(context.values[0]);
			log.debug("redData -->",redData)
			var fileInternalId = context.key;
			
			var folderMonthName = redData.created;
			var fileDate = redData.formulatext;
			log.debug("fileDate -->",fileDate)
			
			
			var fileDateArray = fileDate.split('/')
			log.debug(folderMonthName,fileDate)
			var dayFolderDate = new Date(fileDate);
			//log.debug("dayFolderDate",dayFolderDate)
			
			log.debug("fileDateArray -->",fileDateArray)
			
			var fileDate = fileDateArray[0];
			var fileMonth = fileDateArray[1];
			log.debug("fileMonth 1-->",fileMonth)
			fileMonth = fileMonth - 1;
			//fileMonth = parseInt(fileMonth) - parseInt(1);
			log.debug("fileDate",fileDate)
			log.debug("fileMonth 2-->",fileMonth)
			
			fileDate = parseInt(fileDate);
			
			var d_todays_date = new Date();
			var s_timestamp       = d_todays_date.getTime();			
			var d_date_DAY        = d_todays_date.getDate(); 
			var d_date_MONTH      = d_todays_date.getMonth()+ 1;
			var d_date_YEAR       = d_todays_date.getFullYear();
			//log.debug("d_date_DAY ", d_date_DAY + " d_date_MONTH " + d_date_MONTH + " d_date_YEAR "+ d_date_YEAR);
			var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			var monthText = month[d_todays_date.getMonth()]
			var fileMonthText = month[fileMonth]
			log.debug("fileMonth",fileMonth+" fileMonthText "+fileMonthText)
			var i_folderId = 0;
			var f_folder = true;
			var folderSearchObj = search.create({
			   type: "folder",
			   filters:
			   [
				  ["name","is",fileMonthText],  //month name.
				  "AND",
				  ["parent","is",1028374]
			   ],
			   columns:
			   [
				  search.createColumn({
					 name: "name",
					 sort: search.Sort.ASC,
					 label: "Name"
				  }),
				  search.createColumn({name: "internalid", label: "Internal Id"}),
				  search.createColumn({name: "foldersize", label: "Size (KB)"}),
				  search.createColumn({name: "lastmodifieddate", label: "Last Modified"}),
				  search.createColumn({name: "parent", label: "Sub of"}),
				  search.createColumn({name: "numfiles", label: "# of Files"})
			   ]
			});
			var searchResultCount = folderSearchObj.runPaged().count;
			log.debug("fileMonthText result count",searchResultCount);
			folderSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   i_folderId = result.getValue('internalid');
			   f_folder = false;
			   return true;
			});
			
			log.debug("Existing Folder Id",i_folderId+" f_folder "+f_folder)
			if(f_folder == true)
			{
				var objRecord = record.create({
					type: record.Type.FOLDER,
					isDynamic: true
				});
				
				objRecord.setValue({
					fieldId: 'name',
					value: fileMonthText   //month name
				});
				
				objRecord.setValue({
					fieldId: 'parent',
					value: 1028374
				});
			
				var i_folderId = objRecord.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				
				log.debug("New Folder Id",i_folderId)
			}
			
			var fileDateFolder = true;
			var folderSearchObj = search.create({
			   type: "folder",
			   filters:
			   [
				  ["name","is",fileDate],  //month name.
				  "AND",
				  ["parent","is",i_folderId]
			   ],
			   columns:
			   [
				  search.createColumn({
					 name: "name",
					 sort: search.Sort.ASC,
					 label: "Name"
				  }),
				  search.createColumn({name: "internalid", label: "Internal Id"}),
				  search.createColumn({name: "foldersize", label: "Size (KB)"}),
				  search.createColumn({name: "lastmodifieddate", label: "Last Modified"}),
				  search.createColumn({name: "parent", label: "Sub of"}),
				  search.createColumn({name: "numfiles", label: "# of Files"})
			   ]
			});
			var searchResultCount = folderSearchObj.runPaged().count;
			log.debug("fileDate result count "+fileDate,searchResultCount);
			folderSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   i_folderFileId = result.getValue('internalid');
			  fileDateFolder = false;
			   return true;
			});
			
			
			if(fileDateFolder)
			{
				var objRecord = record.create({
					type: record.Type.FOLDER,
					isDynamic: true
				});
				
				objRecord.setValue({
					fieldId: 'name',
					value: fileDate   //day
				});
				
				objRecord.setValue({
					fieldId: 'parent',
					value: i_folderId
				});
			
				var i_folderFileId = objRecord.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				
				log.debug("New Date Folder ",i_folderFileId)
			}
			else
			{
				log.debug("Exsting Date Folder ",i_folderFileId)
			}
			
			if(i_folderFileId && fileInternalId)
			{
				 var jsonFile = file.load({
					id: fileInternalId
				});
				jsonFile.folder = i_folderFileId;
				jsonFile.save();
				log.audit("File Moved Into Date Folder id",i_folderFileId+" <> File Id "+fileInternalId)
			}
			
			
			log.debug("Reduce","Stop")
    	}
    	catch(ex)
		{
    		//log.error('reduce error: ', ex.message);	
    		log.error('reduce error: ', ex);	
    	}  
		context.write(i_folderDayId);
    }
    function summarize(summary) {    	 
    	var type = summary.toString();
    	log.debug(type + ' Usage Consumed', summary.usage);
    	log.debug(type + ' Concurrency Number ', summary.concurrency);
    	log.debug(type + ' Number of Yields', summary.yields);
			
		summary.output.iterator().each(function(key, value)
		{			  	
		 return true;
        });     	
    }
	function _logValidation(value)
	{
	  if(value!=null && value!= 'undefined' && value!=undefined && value!='' && value!='NaN' && value!=' '&& value!="0000-00-00")
	  {
		  return true;
	  }	 
	  else	  
	  {
		  return false;
	  }
	}
	
	return {
        getInputData: getInputData,
        map: map,
		reduce: reduce,
        summarize: summarize
    };
    
});