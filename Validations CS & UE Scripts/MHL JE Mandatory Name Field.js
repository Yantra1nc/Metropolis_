/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Client Script
 * Script Name: MHL JE Mandatory Name Field
 * File Name: MHL JE Mandatory Name Field.js
 * Created On: 28/08/2022
 * Modified On: 
 * Created By: Avinash (Yantra Inc.)
 * Modified By: 
 * Description: Code for Mandatory Name field.
 *********************************************************** */
define(['N/record', 'N/currentRecord', 'N/search', 'N/format','N/log','N/error'],
    function(record, currentRecord, search, format,log, error) {

			function validateLine(context) {
				try{
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
			var JournalType = currentRecord.getValue({fieldId: 'custbody_mhl_jv_type_field'});
                   	log.debug("JournalType ==>",JournalType);
			
            if (sublistName === 'line'){
            var AccountID = currentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'account'  //Enter Field Id of field which will change
                    });
                   	log.debug("AccountID ==>",AccountID);
			
				if (_logValidation(AccountID)){
					var accountSearchObj = search.create({
					   type: "account",
					   filters:
					   [
						  ["internalid","anyof",AccountID]
					   ],
					   columns:
					   [
						  search.createColumn({
							 name: "name",
							 sort: search.Sort.ASC,
							 label: "Name"
						  }),
						  search.createColumn({name: "displayname", label: "Display Name"}),
						  search.createColumn({name: "type", label: "Account Type"})
					   ]
					});
					
					var searchResultCount = accountSearchObj.run().getRange({start:0,end:1});
					//log.debug("accountSearchObj result count",searchResultCount);

					if(searchResultCount)
					{
						if(searchResultCount.length > 0)
						{
							var Account_Type = searchResultCount[0].getValue({name: "type"});
							//	alert('data Account_Type: '+Account_Type+'#JournalType: '+JournalType)
							log.debug("AccountIDcondition ==>",AccountID);
							if(JournalType == 7 && (Account_Type == "AcctPay" || AccountID == 4531) )
							{
								try
								{
									var custcolumn = currentRecord.getCurrentSublistValue({
			                        	sublistId: sublistName,
			                        	fieldId: 'entity'  //Enter Field Id which need to be set mandatory
	                   			 	});
									//alert('data: '+custcolumn)
									if(custcolumn == '')
									{
			                            alert('Enter a value name');
			                            return false;
			                        }
			                        else
			                            return true;
								}
								catch(e)
								{
									log.error('e',e);
								}
								
							}
							else
								return true;
						}
					}

					}
				}
          
        }
		catch(e){
			log.error(e.message)
		}
		
			}
		function _logValidation(value){
		    if (value != null && value != undefined && value != '' && value != 'undefined') {
		        return true;
		    }
		    else {
		        return false;
		    }
		    
		}
         return {
            validateLine: validateLine
        }
    });