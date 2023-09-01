/**
 *@NApiVersion 2.0
 *@NScriptType ScheduledScript
 */
/*
 
Script Name: MHL YIL Create PDF folder.js
Script Type: Scheduled Script
Created Date: 24-jun-2022
Created By: Avinash Lahane.
Company : Yantra Inc.
Description: 
*************************************************************/
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/https', 'N/file'],
function(search, record, email, runtime, https, file) {
	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 *
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 *
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */
	function execute(context) {

		try {
			
			
			var customerSearchObj = search.create({
			   type: "customer",
			   filters:
			   [
				  ["custentity_folderinvoicepdf","isnotempty",""],
				  "AND", 
				  ["custentity_folderinternalid","isempty",""]
				 // ["custentity_folderinvoicepdf","is","Hitech-Vellore Main"]
			   ],
			   columns:
			   [
				  search.createColumn({
					 name: "internalid",
					 summary: "COUNT",
					 label: "Internal ID"
				  }),
				  search.createColumn({
					 name: "custentity_folderinvoicepdf",
					 summary: "GROUP",
					 label: "FOLDER INVOICE PDF"
				  }),
				  search.createColumn({
					 name: "custentity_folderinternalid",
					 summary: "COUNT",
					 label: "Folder Internal ID"
				  })
			   ]
			});
			var searchResultCountCust = customerSearchObj.runPaged().count;
			log.debug("customerSearchObj result count",searchResultCountCust);
			customerSearchObj.run().each(function(result){
			var folderName = result.getValue({name: "custentity_folderinvoicepdf",summary: "GROUP",label: "FOLDER INVOICE PDF"
				  });
			log.debug("folderName",folderName);	  
			
			var f_folder = true;
			var folderSearchObj = search.create({
			   type: "folder",
			   filters:
			   [
				  ["name","is",folderName],  //month name.
				  "AND",
				  ["parent","is",610467]
			   ],
			   columns:
			   [
				  search.createColumn({
					 name: "name",
					 sort: search.Sort.ASC,
					 label: "Name"
				  }),
				  search.createColumn({name: "internalid", label: "Internal Id"})
			   ]
			});
			var searchResultCount = folderSearchObj.runPaged().count;
			//log.debug("fileMonthText result count",searchResultCount);
			folderSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   i_folderId = result.getValue('internalid');
			   f_folder = false;
			   return true;
			});
			
			if(f_folder == true)
			{
				var objRecord = record.create({
					type: record.Type.FOLDER,
					isDynamic: true
				});
				
				objRecord.setValue({
					fieldId: 'name',
					value: folderName
				});
				
				objRecord.setValue({
					fieldId: 'parent',
					value: 610467
				});
			
				var folderId = objRecord.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				
				//log.debug("New Folder Id",i_folderId)
			}
			else{
				var folderId = i_folderId;
			}
			
			var customerSearchObj = search.create({
			   type: "customer",
			   filters:
			   [
				  ["custentity_folderinvoicepdf","is",folderName], 
				  "AND", 
				  ["custentity_folderinternalid","isempty",""]
			   ],
			   columns:
			   [
				  search.createColumn({name: "internalid", label: "Internal ID"}),
				  search.createColumn({name: "custentity_folderinvoicepdf", label: "FOLDER INVOICE PDF"})
			   ]
			});
			var searchResultCountCustomer = customerSearchObj.runPaged().count;
			log.debug("customerSearchObj result count",searchResultCountCustomer);
			customerSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   
			if (searchResultCountCustomer > 0) {
					
					var custInternalID = result.getValue({name: "internalid", label: "Internal ID"});
					log.debug("custInternalID",custInternalID);

						record.submitFields({
						type: "customer",
						id: custInternalID,
						values: {
						custentity_folderinternalid : folderId
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields : true
						}
				});		
						
				}
			
			   return true;
			});

			
			   return true;
			});

	} catch (e) {
		log.debug(e.message);
	}
	
}

return {
	execute: execute
};
});