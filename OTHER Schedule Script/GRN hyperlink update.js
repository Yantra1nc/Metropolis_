/**
 *@NApiVersion 2.0
 *@NScriptType ScheduledScript
 */
/*
 
Script Name: GRNhyperlink update.js
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
			
			
			var transactionSearchObj = search.create({
			   type: "transaction",
			   filters:
			    [
				  ["type","anyof","ItemRcpt"], 
				  "AND", 
				  ["trandate","within","1/1/2022","30/6/2022"], 
				  "AND", 
				  ["mainline","is","T"],
				  "AND", 
				["custbody_mhl_upload_copy_vendorbill","startswith","https://mi.stockone.in"]
			   ],
			   columns:
			   [
				  search.createColumn({ name: "internalid", label: "Internal ID" }),
				  search.createColumn({name: "custbody_mhl_upload_copy_vendorbill", label: "Upload Scanned Copy of Vendor bill"})
			   ]
			   
			});
			var searchResultCount = transactionSearchObj.runPaged().count;
			log.debug("transactionSearchObj result count",searchResultCount);
			transactionSearchObj.run().each(function(result){
			   if (searchResultCount > 0) {
					
					var InternalId = result.getValue({name: 'internalid'});
					//log.debug("InternalId",InternalId);
					var urlString = result.getValue({name: 'custbody_mhl_upload_copy_vendorbill'});
					//log.debug("urlString",urlString);
					urlString=urlString.replace("mi.stockone.in","scm.metropolisindia.com");
					var id = record.submitFields({
						type: "itemreceipt",
						id: InternalId,
						values: {
							custbody_mhl_upload_copy_vendorbill: urlString
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields : true
						}
				});		
							log.debug("id",id);
				}
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