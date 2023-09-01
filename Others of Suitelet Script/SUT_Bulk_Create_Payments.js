/*************************************************************
 * File Header
 * Script Type: Suitelet
 * Script Name: [SUT] Merger Bulk Create Payments
 * File Name: SUT_Bulk_Create_Payments.js
 * Created On: 10/10/2022
 * Modified On:
 * Created By: Yantra Inc.)
 * Modified By:
 * Description: Merger Bulk Create Payments
 ************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

/**
 * Script Modification Log:
 * 
    -- Date -- -- Modified By -- --Requested By-- -- Description --

 *
 */
var URL_NS = 'https://4120343.app.netsuite.com/'
var flag_filters = false;
var PAYMENTS_CREDIT_APPLIED_ARR = {};
var VEND_AMT_ARR = {};
var ENTRYCOUNT="";
define(['N/ui/serverWidget', 'N/log', 'N/currentRecord', 'N/format', 'N/record', 'N/search', 'N/redirect', 'N/url', 'N/runtime','N/task' , "N/ui/serverWidget"], 
		function(serverWidget, log, currentRecord, format, record, search, redirect, url, runtime,task,ui) {
	function onRequest(context) {

		if (context.request.method == 'GET') {

			try{
				log.debug('onRequest:Get()','----------------------------------------- execution Starts here ------------------------------------------------------');

				var o_contextOBJ = runtime.getCurrentScript();
				log.debug('execute',' Context OBJ --> '+o_contextOBJ);	
				
				var ALL_SAVED_SEARCHES = o_contextOBJ.getParameter({name: 'custscript_merger_search_'});
				log.debug('execute',' ALL_SAVED_SEARCHES --> '+ALL_SAVED_SEARCHES);
					
                var userName ="";
				var userId ="";

				var objUser = runtime.getCurrentUser() ;

				if(_logValidation(objUser)){
					userId = objUser.id;									
					userName = objUser.name;
				}
				
                var AP_Account = context.request.parameters.ap_account;				
					
					
				var dStartDateParamValue = context.request.parameters.paramStartDate;
				if (_logValidation(dStartDateParamValue)) {
					//log.debug('onRequest:Get()', 'dStartDateParamValue --> ' + dStartDateParamValue);
					dStartDateParamValue = format.parse({ value: dStartDateParamValue, type: format.Type.DATE })
					dStartDateParamValue = format.format({ value: dStartDateParamValue, type: format.Type.DATE })
					//log.debug('onRequest:Get()', ' after format dStartDateParamValue   -->' + dStartDateParamValue)
				}
				var dEndDateParamValue = context.request.parameters.paramEndDate;
				if (_logValidation(dEndDateParamValue)) {
					//log.debug('onRequest:Get()', 'dEndDateParamValue --> ' + dEndDateParamValue);
					dEndDateParamValue = format.parse({ value: dEndDateParamValue, type: format.Type.DATE })
					dEndDateParamValue = format.format({ value: dEndDateParamValue, type: format.Type.DATE })
					//log.debug('onRequest:Get()', ' after format dEndDateParamValue   -->' + dEndDateParamValue)
				}
				
				
				var dStartDueDateParamValue = context.request.parameters.paramDueStartDate;
				log.debug('onRequest:Get()', 'dStartDueDateParamValue --> ' + dStartDueDateParamValue);
				if (_logValidation(dStartDueDateParamValue)) {
					//log.debug('onRequest:Get()', 'dStartDateParamValue --> ' + dStartDateParamValue);
					dStartDueDateParamValue = format.parse({ value: dStartDueDateParamValue, type: format.Type.DATE })
					dStartDueDateParamValue = format.format({ value: dStartDueDateParamValue, type: format.Type.DATE })
					//log.debug('onRequest:Get()', ' after format dStartDateParamValue   -->' + dStartDateParamValue)
				}
				var dEndDueDateParamValue = context.request.parameters.paramDueEndDate;
				if (_logValidation(dEndDueDateParamValue)) {
					//log.debug('onRequest:Get()', 'dEndDateParamValue --> ' + dEndDateParamValue);
					dEndDueDateParamValue = format.parse({ value: dEndDueDateParamValue, type: format.Type.DATE })
					dEndDueDateParamValue = format.format({ value: dEndDueDateParamValue, type: format.Type.DATE })
					//log.debug('onRequest:Get()', ' after format dEndDateParamValue   -->' + dEndDateParamValue)
				}
				
				
				var vendorIdParamValue = context.request.parameters.paramVendorID;
				//log.debug('onRequest:Get()',"vendorIdParamValue=="+vendorIdParamValue);
				
				if(_logValidation(vendorIdParamValue))
				{
					vendorIdParamValue = split_data(vendorIdParamValue);
				}

				var subsidaryIdParamValue = context.request.parameters.paramSubsidaryID;
				//log.debug('onRequest:Get()',"subsidaryIdParamValue=="+subsidaryIdParamValue);

				var locationIdParamValue = context.request.parameters.paramLocationID;
				//log.debug('onRequest:Get()',"locationIdParamValue=="+locationIdParamValue);
				
				var iPaymentMethodParamValue = context.request.parameters.parampayment_method;
				
				var iPaymentTransactionTypeParamValue = context.request.parameters.parampayment_transactiontype;
				
				var flag_filters_GLOBAL = false;
				
				if(_logValidation(dStartDateParamValue) && _logValidation(dEndDateParamValue))
				{
					flag_filters_GLOBAL = true ;
				}
				if(_logValidation(dEndDueDateParamValue) && _logValidation(dStartDueDateParamValue))
				{
					flag_filters_GLOBAL = true ;
				}	
				  
				
				if(_logValidation(subsidaryIdParamValue))
				{
					flag_filters_GLOBAL = true ;
				}
				if(_logValidation(vendorIdParamValue))
				{
					flag_filters_GLOBAL = true ;
				}
				if(_logValidation(iPaymentTransactionTypeParamValue))
				{
					flag_filters_GLOBAL = true ;
				}	

                var future_date_param = context.request.parameters.futuredateparam;
				if (_logValidation(future_date_param)) {
					//log.debug('onRequest:Get()', 'dEndDateParamValue --> ' + dEndDateParamValue);
					future_date_param = format.parse({ value: future_date_param, type: format.Type.DATE })
					future_date_param = format.format({ value: future_date_param, type: format.Type.DATE })
					//log.debug('onRequest:Get()', ' after format dEndDateParamValue   -->' + dEndDateParamValue)
				}

				

				//-------------------------------------- End - Get values of Parameters from URL ---------------------------------------------------------//

				//----------------------------------------- Start - Create UI form and add Field on the form ------------------------------------------------//
				var objForm = serverWidget.createForm({ title: 'Metropolis | Merger Bulk Vendor Payment Form' });

				//set the client script on the suitelet form
				objForm.clientScriptModulePath = '/SuiteScripts/CLI_Bulk_Create_Payments.js' //this is field container it is just like row or container in bootstrap
				objForm.addFieldGroup({id: 'custpage_bank_file_info',label: 'Primary Information'});
				objForm.addFieldGroup({id: 'custpage_date_filters',label: 'Date Criteria'});
				objForm.addFieldGroup({id: 'custpage_other_filters',label: 'Other Criteria'});

                var o_batch_fld = objForm.addField({ id: 'custpage_batch_no', type: serverWidget.FieldType.TEXT, label: 'Batch#', container: 'custpage_bank_file_info' });
			
				var objFldUserId = objForm.addField({ id: 'custpage_userid', type: serverWidget.FieldType.TEXT, label: 'User#', container: 'custpage_bank_file_info'});			
				objFldUserId.defaultValue = userId + " " + userName;
				objFldUserId.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

				//for ( YYYY-MM-DD HH24-MI-SS) date format 
				var objCurrentDate = new Date();
				objCurrentDate = convert_date(objCurrentDate);

				// adjust 0 before single digit date
				var date = ("0" + objCurrentDate.getDate()).slice(-2);
				// current month
				var month = ("0" + (objCurrentDate.getMonth() + 1)).slice(-2);
				// current year
				var year = objCurrentDate.getFullYear();
				// current hours
				var hours = objCurrentDate.getHours();
				// current minutes
				var minutes = objCurrentDate.getMinutes();
				// current seconds
				var seconds = objCurrentDate.getSeconds();

				if(hours < 10){hours = '0'+hours ;}
				if(minutes < 10){minutes = '0'+minutes ;}
				if(seconds < 10){seconds = '0'+seconds ;}
			
				var dateCreated = year + "-" + month + "-" + date;
			
				var objFldTransmissionDate = objForm.addField({ id: 'custpage_transmissiondate', type: serverWidget.FieldType.TEXT, label: 'Current Date', container: 'custpage_bank_file_info' });
				objFldTransmissionDate.defaultValue = dateCreated;			
				objFldTransmissionDate.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

                 var o_total_amt_fld = objForm.addField({ id: 'custpage_total_amount_selected', type: serverWidget.FieldType.CURRENCY, label: 'Total Amount', container: 'custpage_bank_file_info' });
		         o_total_amt_fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			

                var obj_future_date = objForm.addField({ id: 'custpage_futuredate', type: serverWidget.FieldType.DATE, label: 'Future Date', container: 'custpage_bank_file_info' });
               // obj_future_date.isMandatory = true;

               if(_logValidation(future_date_param))
			   {
				 obj_future_date.defaultValue = future_date_param;		  
			   }

               var objFld_payment_record_type = objForm.addField({ id: 'custpage_payment_record_type', type: serverWidget.FieldType.SELECT, label: 'Payment Transaction Type#', container: 'custpage_bank_file_info' });
				objFld_payment_record_type.isMandatory = true;
				objFld_payment_record_type.addSelectOption({ value: '-All-', text: '-All-' });
				objFld_payment_record_type.addSelectOption({ value: 'journalentry', text: 'Journal Entry' });
				objFld_payment_record_type.addSelectOption({ value: 'vendorbill', text: 'Vendor Bill' });
				objFld_payment_record_type.addSelectOption({ value: 'vendorprepayment', text: 'Vendor Prepayment' });
				objFld_payment_record_type.addSelectOption({ value: 'vendorcredit', text: 'Vendor Credit' });

                var SUB_JSON_ = get_subsidiary_details();
				log.debug('onRequest:Get()', 'SUB_JSON_ --> ' + JSON.stringify(SUB_JSON_));
				
				var SUB_JSON_KEYS = Object.keys(SUB_JSON_) ;  
							
				var objFldSubsidary = objForm.addField({ id: 'custpage_subsidary', type: serverWidget.FieldType.MULTISELECT, label: 'Subsidary', container: 'custpage_bank_file_info' });
				//  objFldSubsidary.defaultValue = defaultSubsidiary;
				//	objFldSubsidary.isMandatory = true;
				//	objFldSubsidary.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				
			  	if(_logValidation(SUB_JSON_KEYS))
				{
				  for(var t_s = 0 ; t_s<SUB_JSON_KEYS.length ; t_s++)
				  {
					 try
					 {
						 var sub_name_x = SUB_JSON_[SUB_JSON_KEYS[t_s]].sub_name;   
					 } 
					 catch(excs)
					 {
						var sub_name_x = ""; 
					 }
					 
					 if(_logValidation(sub_name_x))
					 {
						 objFldSubsidary.addSelectOption({value : SUB_JSON_KEYS[t_s] , text :sub_name_x });
					 }
				  }					  
				}		
			
			  var i_batch_no_x = get_batch_details()
			  o_batch_fld.defaultValue = parseFloat(i_batch_no_x).toFixed(0);
			  o_batch_fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
				
				
				
				if(_logValidation(iPaymentTransactionTypeParamValue))
				{
				  objFld_payment_record_type.defaultValue = iPaymentTransactionTypeParamValue;	
				}	

	          
 				
				
	/*			var objFldBankPaymentMethod = objForm.addField({ id: 'custpage_bank_payment_method', type: serverWidget.FieldType.SELECT, label: 'Bank Payment Type#', source: 'paymentmethod' , container: 'custpage_bank_file_info' });
			//	objFldBankPaymentMethod.isMandatory = true;
							
				if(_logValidation(iPaymentMethodParamValue))
				{
					objFldBankPaymentMethod.defaultValue = iPaymentMethodParamValue;
				}		
 */
			/*	if(dStartDateParamValue && dEndDateParamValue){

					var objFldBankAccount = objForm.addField({ id: 'custpage_bank_account', type: serverWidget.FieldType.SELECT, label: 'Bank Account#', source: 'account',container: 'custpage_bank_file_info' });
					objFldBankAccount.defaultValue = bankAccountId;
					objFldBankAccount.isMandatory = true;
					objFldBankAccount.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

					if(_logValidation(bankAccountId))	{
						var resultIndexSN	= 0; 
						var resultStepSN	= 1000;
						var objSearchAccount = search.create({type: "account",
							filters:
								[
									["type","anyof","Bank"], "AND", ["internalid","anyof",bankAccountId], "AND", ["isinactive","is","F"]
									],
									columns:
										[
											search.createColumn({name: "internalid"}),
											search.createColumn({name: "custrecord_account_number"}),
											search.createColumn({name: "name",sort: search.Sort.ASC})
											]
						});
						do{
							var objSearchResultAccount = objSearchAccount.run().getRange({start: resultIndexSN, end: resultIndexSN + resultStepSN});

							if(objSearchResultAccount.length > 0){
								for(var s in objSearchResultAccount) {
									bankAccountNo = objSearchResultAccount[s].getValue({name: "custrecord_account_number"});
								}
								// increase pointer
								resultIndexSN = resultIndexSN + resultStepSN;
							}
						} while (objSearchResultAccount.length > 0); 
					}

					var objFldBankAccountNo = objForm.addField({ id: 'custpage_bank_account_no', type: serverWidget.FieldType.TEXT, label: 'Bank Account No.', container: 'custpage_bank_file_info' });
					objFldBankAccountNo.defaultValue = bankAccountNo;
					objFldBankAccountNo.isMandatory = true;  
					objFldBankAccountNo.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
				
				} */

				//var objFldStartDate = objForm.addField({ id: 'custpage_startdate', type: serverWidget.FieldType.DATE, label: 'Start Date', container: 'custpage_date_filters' });
			//	objFldStartDate.isMandatory = true;
				//var objFldEndDate = objForm.addField({ id: 'custpage_enddate', type: serverWidget.FieldType.DATE, label: 'End Date', container: 'custpage_date_filters' });
			//	objFldEndDate.isMandatory = true;
					

                var objFldDueStartDate = objForm.addField({ id: 'custpage_duestartdate', type: serverWidget.FieldType.DATE, label: 'Due Date', container: 'custpage_date_filters' });
			//	objFldStartDate.isMandatory = true;
			//	var objFldDueEndDate = objForm.addField({ id: 'custpage_dueenddate', type: serverWidget.FieldType.DATE, label: 'Due End Date', container: 'custpage_date_filters' });
			//	objFldEndDate.isMandatory = true;
			
			    if((iPaymentTransactionTypeParamValue != 'vendorbill') && _logValidation(iPaymentTransactionTypeParamValue) && (iPaymentTransactionTypeParamValue != '-All-'))
				{
				   objFldDueStartDate.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});	
				}
				
				if(_logValidation(dStartDueDateParamValue))
				{
					objFldDueStartDate.defaultValue = dStartDueDateParamValue;
					flag_filters = true;
				} 
			    /*	
			    if(_logValidation(dEndDueDateParamValue))
				{
					objFldDueEndDate.defaultValue = dEndDueDateParamValue;
					flag_filters = true;
				} 
				*/		
				var objFldVendorName = objForm.addField({id: 'custpage_vendorname', type: serverWidget.FieldType.MULTISELECT, label: 'Vendor', source: 'vendor',container: 'custpage_other_filters'});
				objFldVendorName.isMandatory = true;
				
			//	var objFldLocation = objForm.addField({ id: 'custpage_location', type: serverWidget.FieldType.SELECT, label: 'Location', source: 'location',container: 'custpage_other_filters' });
			
				if(_logValidation(dStartDateParamValue))
				{
					objFldStartDate.defaultValue = dStartDateParamValue;
					flag_filters = true;
				} 
				if(_logValidation(dEndDateParamValue))
				{
					objFldEndDate.defaultValue = dEndDateParamValue;
					flag_filters = true;
				}
				
				var o_AP_Account = objForm.addField({ id: 'custpage_ap_account', type: serverWidget.FieldType.SELECT, label: 'AP Account', source: 'account',container: 'custpage_other_filters' });
			    o_AP_Account.isMandatory = true;
               if(_logValidation(AP_Account))
				{
					o_AP_Account.defaultValue = AP_Account;
					flag_filters = true;
				}

          /*    var arr_f_ = new Array();

				var arr_c_ = new Array();
				arr_c_.push(search.createColumn({ name: 'internalid' }));
				arr_c_.push(search.createColumn({ name: 'recordtype' }));
			
				
				var ALL_SAVED_SEARCHES_OBJ = search.load({ id: ALL_SAVED_SEARCHES });

				var o_SV_SRCH = ALL_SAVED_SEARCHES_OBJ.run().getRange({ start: 0, end: 100 });
						
				if(_logValidation(o_SV_SRCH)) 
				{					
					for(var i_x = 0; i_x < o_SV_SRCH.length; i_x++) {
						
						var i_SAVED_SEARCH_IDs = o_SV_SRCH[i_x].getValue({name: "internalid"});
						  log.debug('debug','i_SAVED_SEARCH_IDs --> ' + i_SAVED_SEARCH_IDs);
					}
				} */
				
				var SEARCH_ID_BILL = "";
				var SEARCH_ID_VENDOR_PREP = "";
				var SEARCH_ID_VENDOR_CREDIT = "";
				var SEARCH_ID_JOURNAL = "";
				var DEFAULT_HIGH_LIMIT = 1000 ;
							
				SEARCH_ID_BILL = "customsearch_merger_vendor_invoice";             					
				SEARCH_ID_VENDOR_PREP = "customsearch_merger_advance_application";
				SEARCH_ID_VENDOR_CREDIT = "customsearch_merger_bill_credit";             					
				SEARCH_ID_JOURNAL = "customsearch_merger_journal";
				                
                if(iPaymentTransactionTypeParamValue == 'vendorbill')
				{					
					 SEARCH_ID_BILL = "customsearch_merger_vendor_invoice";					
					 SEARCH_ID_VENDOR_PREP = "";
					 SEARCH_ID_VENDOR_CREDIT = "";
					 SEARCH_ID_JOURNAL = "";
                     DEFAULT_HIGH_LIMIT = 1000 ; 					 
				}
                if(iPaymentTransactionTypeParamValue == 'vendorprepayment')
				{					
					 SEARCH_ID_VENDOR_PREP = "customsearch_merger_advance_application";
					 SEARCH_ID_BILL = "";								 
					 SEARCH_ID_VENDOR_CREDIT = "";
					 SEARCH_ID_JOURNAL = "";
					  DEFAULT_HIGH_LIMIT = 1000 ;
				}
                if(iPaymentTransactionTypeParamValue == 'vendorcredit')
				{					
					SEARCH_ID_VENDOR_CREDIT = "customsearch_merger_bill_credit";
					SEARCH_ID_BILL = "";
					SEARCH_ID_VENDOR_PREP = "";
					SEARCH_ID_JOURNAL = "";
					 DEFAULT_HIGH_LIMIT = 1000 ;
				}
                if(iPaymentTransactionTypeParamValue == 'journalentry')
				{					
					SEARCH_ID_JOURNAL = "customsearch_merger_journal";
					SEARCH_ID_BILL = "";
					SEARCH_ID_VENDOR_PREP = "";
					SEARCH_ID_VENDOR_CREDIT = "";
					 DEFAULT_HIGH_LIMIT = 1000 ;
				}	  


				
				
				if(_logValidation(vendorIdParamValue))
				{
					objFldVendorName.defaultValue = vendorIdParamValue;
					flag_filters = true;
				}
				subsidaryIdParamValue = split_data(subsidaryIdParamValue)
				if(_logValidation(subsidaryIdParamValue))
				{
					objFldSubsidary.defaultValue = subsidaryIdParamValue;
					flag_filters = true;
				}
			/*	locationIdParamValue = split_data(locationIdParamValue)
				if(_logValidation(locationIdParamValue))
				{
					objFldLocation.defaultValue = locationIdParamValue;
					flag_filters = true;
				}
            */
				//--------------------------------------------------------- End - Create UI form and add Field on the form --------------------------------------------------------------------------//

				var objSublist = objForm.addSublist({ id: 'custpage_sublist', type: serverWidget.SublistType.LIST, label: 'Merger | Payment Entries'});

				objSublist.addMarkAllButtons();
                objSublist.addField({ id: 'custpage_sublist_serial_no', type: serverWidget.FieldType.TEXT, label: 'S.No' });
				objSublist.addField({ id: 'custpage_sublist_select', type: serverWidget.FieldType.CHECKBOX, label: 'Select' });
				var objFldInternalIdText =  objSublist.addField({ id: 'custpage_sublist_internalidtext', type: serverWidget.FieldType.TEXT, label: 'Internal Id '});
				objFldInternalIdText.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				var objFldInternalId = objSublist.addField({ id: 'custpage_sublist_internalid', type: serverWidget.FieldType.SELECT, label: 'Transaction', source: 'transaction' });
				objFldInternalId.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});				
				objSublist.addField({ id: 'custpage_sublist_date', type: serverWidget.FieldType.TEXT, label: 'Date' });	

         //    	if(_logValidation(SEARCH_ID_BILL))
				{
					var  obj_due_date = objSublist.addField({ id: 'custpage_due_startdate', type: serverWidget.FieldType.TEXT, label: 'Due Date' });		
				}					
				if((iPaymentTransactionTypeParamValue != 'vendorbill') && _logValidation(iPaymentTransactionTypeParamValue) && (iPaymentTransactionTypeParamValue!='-All-'))
				{
				   obj_due_date.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});	
				}
				
				var objFldType = objSublist.addField({ id: 'custpage_sublist_transtype', type: serverWidget.FieldType.TEXT, label: 'Type' });
			//	objFldType.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				var objFldDocummentNo = objSublist.addField({ id: 'custpage_sublist_documentno', type: serverWidget.FieldType.TEXTAREA, label: 'Document Number' });
			//	objFldDocummentNo.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				objSublist.addField({ id: 'custpage_sublist_transactionno', type: serverWidget.FieldType.TEXTAREA, label: 'Transaction Number' });
				var vend_obj = objSublist.addField({ id: 'custpage_sublist_vendorname', type: serverWidget.FieldType.SELECT,source : 'vendor', label:' Vendor Name' });
					vend_obj.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
					
					var vend_obj_str = objSublist.addField({ id: 'custpage_sublist_vendorname_str', type: serverWidget.FieldType.TEXT, label:' Vendor Name' });
					vend_obj_str.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				
				
				
			
			/*	var objFldAmountDue = objSublist.addField({ id: 'custpage_sublist_amtdue', type: serverWidget.FieldType.CURRENCY, label: 'Amount Due' });
				objFldAmountDue.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
				objFldAmountDue.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});*/
					
					var objFldorig_amount =objSublist.addField({ id: 'custpage_original_amount', type: serverWidget.FieldType.CURRENCY, label: 'Original Amount' });
				objFldorig_amount.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			
					
					var objFldAmountDue=objSublist.addField({ id: 'custpage_sublist_amtdue', type: serverWidget.FieldType.CURRENCY, label: 'Amount Due' });
				objFldAmountDue.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
				
					var objFldAmtTobePaid=objSublist.addField({ id: 'custpage_sublist_amttobepaid', type: serverWidget.FieldType.CURRENCY, label: 'Amount To Be Paid' });
				objFldAmtTobePaid.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
				
				var tot_amt_v = objSublist.addField({ id: 'custpage_sublist_totalamt', type: serverWidget.FieldType.CURRENCY, label: 'Total Amount' });
					tot_amt_v.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				
																
				var loc_obj_x = objSublist.addField({ id: 'custpage_sublist_location', type: serverWidget.FieldType.SELECT,source: 'location', label: 'Location' });
					loc_obj_x.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
				
				
				var bnk_accc_x = objSublist.addField({ id: 'custpage_sublist_bank_acc_no', type: serverWidget.FieldType.SELECT,source : 'account' , label: 'Bank Account#' });
					bnk_accc_x.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				
				var ap_acc_x = objSublist.addField({ id: 'custpage_sublist_ap_acc_no', type: serverWidget.FieldType.SELECT,source : 'account' , label: 'AP Account#' });
					ap_acc_x.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				
				
				var  sub_x = objSublist.addField({ id: 'custpage_sublist_subsidiary', type: serverWidget.FieldType.SELECT,label: 'Subsidiary' });
					sub_x.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
										
					if(_logValidation(SUB_JSON_KEYS))
					{
					  for(var t_s = 0 ; t_s<SUB_JSON_KEYS.length ; t_s++)
					  {
						 try
						 {
							 var sub_name_x = SUB_JSON_[SUB_JSON_KEYS[t_s]].sub_name;   
						 } 
						 catch(excs)
						 {
							var sub_name_x = ""; 
						 }
												 
						 if(_logValidation(sub_name_x))
						 {
							 sub_x.addSelectOption({value : SUB_JSON_KEYS[t_s] , text :sub_name_x });
						 }
					  }					  
					}	
					
				
				var  sub_x_str = objSublist.addField({ id: 'custpage_sublist_subsidiary_str', type: serverWidget.FieldType.TEXT, label: 'Subsidiary' });
					sub_x_str.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			
				 
				var counter = 0;
								
				if(flag_filters_GLOBAL == true)
				{	
				
				 //////////////////// VENDOR BILL ////////////////////////	


				
				if(_logValidation(SEARCH_ID_BILL))
				{
					
				
				 
				var arrFilters = new Array();

				var arrColumns = new Array();
				arrColumns.push(search.createColumn({ name: 'internalid' }));

				if(_logValidation(dStartDateParamValue) && _logValidation(dEndDateParamValue))
				{
			//		arrFilters.push( search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [dStartDateParamValue, dEndDateParamValue] }) );
				}
				if(_logValidation(dStartDueDateParamValue))
				{				
				    var end_due_date = new Date('01/01/1900');
					var end_due_date = format.parse({ value: end_due_date, type: format.Type.DATE })
					end_due_date = format.format({ value: end_due_date, type: format.Type.DATE })
					
					dStartDueDateParamValue = format.parse({ value: dStartDueDateParamValue, type: format.Type.DATE })
					dStartDueDateParamValue = format.format({ value: dStartDueDateParamValue, type: format.Type.DATE })
					
					log.debug('schedulerFunction', ' --------- end_due_date --------- -->'+end_due_date);
					log.debug('schedulerFunction', ' --------- dStartDueDateParamValue --------- -->'+dStartDueDateParamValue);
					
					
				   // arrFilters.push( search.createFilter({ name: 'duedate', operator: search.Operator.ONORBEFORE, values: dStartDueDateParamValue}));
				   arrFilters.push( search.createFilter({ name: 'duedate', operator: search.Operator.WITHIN, values: [end_due_date, dStartDueDateParamValue] }) );
								   
				}
				if(_logValidation(vendorIdParamValue)) 
				{
					arrFilters.push( search.createFilter({ name: 'entity', operator: search.Operator.ANYOF, values: vendorIdParamValue }) );
				}
				if(_logValidation(AP_Account)) 
				{
					arrFilters.push( search.createFilter({ name: 'account', operator: search.Operator.ANYOF, values: AP_Account }) );
				}						      
				if(_logValidation(subsidaryIdParamValue)) 
				{
					arrFilters.push( search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidaryIdParamValue }) );
				}
				var vendorbillSearchObj = search.load({ id: SEARCH_ID_BILL });

				if(_logValidation(arrFilters)) {
					for (var flt = 0; flt < arrFilters.length; flt++) {
						vendorbillSearchObj.filters.push(arrFilters[flt]);
					}
				}

				var objSearchResult = vendorbillSearchObj.run().getRange({ start: 0, end: DEFAULT_HIGH_LIMIT });
				
				 log.debug('debug','objSearchResult L --> ' + objSearchResult.length);

				if(_logValidation(objSearchResult)) 
				{
					
					for(var i = 0; i < objSearchResult.length; i++) 
					{
						// .run().each has a limit of 4,000 results

						var recordType = objSearchResult[i].getValue({name: "type"});
						var recordID = objSearchResult[i].getValue({ name: "internalid"});
						var locationName = objSearchResult[i].getValue({ name: "custrecord_billpaymentorg", join : "subsidiary"});
						var recordDate = objSearchResult[i].getValue({ name: "trandate"});
						var recordDueDate = objSearchResult[i].getValue({ name: "duedate"});
						var recordDocNo = objSearchResult[i].getValue({ name: "tranid"});
						var recordTransNo=objSearchResult[i].getValue({ name: "transactionnumber"});
						//var vendorName = objSearchResult[i].getValue({ name: "altname", join: "vendor"});
						//var vendorCode = objSearchResult[i].getValue({name: "formulatext",formula: "{vendor.entityid}"});
						var vendorName = objSearchResult[i].getValue({ name: "entity"});
						var recordAmount = objSearchResult[i].getValue({ name: "total"});	
                        var bank_acc_no =  objSearchResult[i].getValue({ name: "custrecord_mhl_subsidiarybankaccount" , join : "subsidiary"});
						var subsidiary_id =  objSearchResult[i].getValue({ name: "subsidiarynohierarchy"});
						var AP_Account =  objSearchResult[i].getValue({ name: "account"});
						 var subsidiary_id_str =  objSearchResult[i].getText({ name: "subsidiarynohierarchy"});
						var vendorName_str = objSearchResult[i].getText({ name: "entity"});
						
						var AMOUNT = objSearchResult[i].getValue({ name: "amount"});
																	
						var AMT_PAID = objSearchResult[i].getValue({name: "amountpaid"});
						
						if(!_logValidation(AMOUNT))
						{
							AMOUNT = 0 ;
						}
						if(!_logValidation(AMT_PAID))
						{
							AMT_PAID = 0 ;
						}
						
						var AMOUNT_DUE = objSearchResult[i].getValue({name: "amountremaining"});
						
					//	var AMOUNT_DUE = parseFloat(AMOUNT) - parseFloat(AMT_PAID) ;
						
						log.debug('debug','AMT_PAID ['+i+'] --> ' + AMT_PAID + ' AMOUNT_DUE ['+i+'] -->'+AMOUNT_DUE);						
					
											
						var amountToBePaid = parseFloat(recordAmount);	

                    //   log.debug('debug','recordID ['+i+'] --> ' + recordID + ' subsidiary_id ['+i+'] -->'+subsidiary_id);						
					
					
						  var line_no = parseInt(counter)+1 ;
                          line_no = line_no.toFixed(0);						  
							
						 objSublist.setSublistValue({ id: 'custpage_sublist_serial_no', line: counter, value: line_no });	
						 
						 
						 if(_logValidation(recordDueDate)){
							objSublist.setSublistValue({ id: 'custpage_due_startdate', line: counter, value: recordDueDate });
						}
							
							
						if(_logValidation(recordID))	{
							objSublist.setSublistValue({ id: 'custpage_sublist_internalidtext', line: counter, value: recordID });
							objSublist.setSublistValue({ id: 'custpage_sublist_internalid', line: counter, value: recordID });
						}
						if(_logValidation(recordType)){
							objSublist.setSublistValue({ id: 'custpage_sublist_transtype', line: counter, value: recordType });
						}
						if(_logValidation(subsidiary_id)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary', line: counter, value: subsidiary_id });
						}
						if(_logValidation(subsidiary_id_str)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary_str', line: counter, value: subsidiary_id_str });
						}
						if(_logValidation(vendorName_str)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname_str', line: counter, value: vendorName_str });
						}
						if(_logValidation(locationName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_location', line: counter, value: locationName });
						}
						if(_logValidation(recordDate)){
							objSublist.setSublistValue({ id: 'custpage_sublist_date', line: counter, value: recordDate });
						}
						
												
						
						var REC_TYPE = '';
						if(recordType == 'Journal')
						{
							REC_TYPE  = 'journalentry' ;
						}
						else if( recordType == 'VendBill')
						{
							REC_TYPE  = 'vendorbill' ;
						}
						else if(recordType == "Custom")
						{
							REC_TYPE = "customtransaction_prepayment_application";
						}
						else if(recordType == 'VendCred')
					    {
							REC_TYPE  = 'vendorcredit' ;
						}
							
						
						try{
												
						var url_p = url.resolveRecord({recordType: REC_TYPE,recordId: recordID,isEditMode: false});
						
						var po_URL  = URL_NS+url_p						
					
						var po_URL_X = "<p><a href="+url_p+">"+recordDocNo+"</a></p>"
						}
						catch(exs)
						{
							var url_p = recordDocNo ;
							var po_URL_X =url_p;
						}
						
						
						
						if (_logValidation(recordDocNo)){
							objSublist.setSublistValue({ id: 'custpage_sublist_documentno', line: counter, value: po_URL_X });
						}
						if(_logValidation(recordTransNo)){
							objSublist.setSublistValue({ id: 'custpage_sublist_transactionno', line: counter, value: recordTransNo });
						}
						if(_logValidation(vendorName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname', line: counter, value: vendorName });
						}				
						if(_logValidation(AMOUNT_DUE)){
							objSublist.setSublistValue({ id: 'custpage_sublist_amttobepaid', line: counter, value: AMOUNT_DUE });
							
						}
						if(_logValidation(amountToBePaid)){  
						
							objSublist.setSublistValue({ id: 'custpage_original_amount', line: counter, value: amountToBePaid });
						}						
						if(_logValidation(AMOUNT_DUE)){
						
							objSublist.setSublistValue({ id: 'custpage_sublist_amtdue', line: counter, value: AMOUNT_DUE });
						}
						if(recordAmount){
							objSublist.setSublistValue({ id: 'custpage_sublist_totalamt', line: counter, value: recordAmount });
						}
					
								if(bank_acc_no){
							objSublist.setSublistValue({ id: 'custpage_sublist_bank_acc_no', line: counter, value: bank_acc_no });
								}  
                 

							if(AP_Account){
							objSublist.setSublistValue({ id: 'custpage_sublist_ap_acc_no', line: counter, value: AP_Account });
								}  		
								
						counter++;										
						
					}
				}
				}
                //////////////////// VENDOR BILL ////////////////////////
				
				
				 //////////////////// VENDOR CREDIT ////////////////////////

				

                if(_logValidation(SEARCH_ID_VENDOR_CREDIT))
				{				 
				var arrFilters = new Array();

				var arrColumns = new Array();
				arrColumns.push(search.createColumn({ name: 'internalid' }));

				if(_logValidation(dStartDateParamValue) && _logValidation(dEndDateParamValue))
				{
					arrFilters.push( search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [dStartDateParamValue, dEndDateParamValue] }) );
				}
				
				if(_logValidation(vendorIdParamValue)) 
				{
					arrFilters.push( search.createFilter({ name: 'entity', operator: search.Operator.ANYOF, values: vendorIdParamValue }) );
				}
				if(_logValidation(AP_Account)) 
				{
					arrFilters.push( search.createFilter({ name: 'account', operator: search.Operator.ANYOF, values: AP_Account }) );
				}			      
				if(_logValidation(subsidaryIdParamValue)) 
				{
					arrFilters.push( search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidaryIdParamValue }) );
				}
				var vendorbillSearchObj = search.load({ id: SEARCH_ID_VENDOR_CREDIT });

				if (_logValidation(arrFilters)) {
					for (var flt = 0; flt < arrFilters.length; flt++) {
						vendorbillSearchObj.filters.push(arrFilters[flt]);
					}
				}

				var objSearchResult = vendorbillSearchObj.run().getRange({ start: 0, end: DEFAULT_HIGH_LIMIT });
				
				 log.debug('debug','objSearchResult L --> ' + objSearchResult.length);

				if(_logValidation(objSearchResult)) 
				{
					
					for(var i = 0; i < objSearchResult.length; i++) 
					{
						// .run().each has a limit of 4,000 results

						var recordType = objSearchResult[i].getValue({name: "type"});
						var recordID = objSearchResult[i].getValue({ name: "internalid"});
						var locationName = objSearchResult[i].getValue({ name: "custrecord_billpaymentorg", join : "subsidiary"});
						var recordDate = objSearchResult[i].getValue({ name: "trandate"});
						var recordDueDate = objSearchResult[i].getValue({ name: "duedate"});
						var recordDocNo = objSearchResult[i].getValue({ name: "tranid"});
						var recordTransNo=objSearchResult[i].getValue({ name: "transactionnumber"});
						//var vendorName = objSearchResult[i].getValue({ name: "altname", join: "vendor"});
						//var vendorCode = objSearchResult[i].getValue({name: "formulatext",formula: "{vendor.entityid}"});
						var vendorName = objSearchResult[i].getValue({ name: "entity"});
						var recordAmount = objSearchResult[i].getValue({ name: "total"});	
                        var bank_acc_no =  objSearchResult[i].getValue({ name: "custrecord_mhl_subsidiarybankaccount" , join : "subsidiary"});
						var subsidiary_id =  objSearchResult[i].getValue({ name: "subsidiarynohierarchy"});
						var AP_Account =  objSearchResult[i].getValue({ name: "account"});
							
                        var subsidiary_id_str =  objSearchResult[i].getText({ name: "subsidiarynohierarchy"});
						var vendorName_str = objSearchResult[i].getText({ name: "entity"});
						
						var AMOUNT = objSearchResult[i].getValue({ name: "amount"});
																	
						var AMT_PAID = objSearchResult[i].getValue({name: "amountpaid"});
						
						if(!_logValidation(AMOUNT))
						{
							AMOUNT = 0 ;
						}
						if(!_logValidation(AMT_PAID))
						{
							AMT_PAID = 0 ;
						}
						
						var AMOUNT_DUE = objSearchResult[i].getValue({name: "amountremaining"});	
						var amountToBePaid = parseFloat(recordAmount);	

                   //    log.debug('debug','recordID ['+i+'] --> ' + recordID);						
						
					
						  var line_no = parseInt(counter)+1 ;
                          line_no = line_no.toFixed(0);						  
							
						 objSublist.setSublistValue({ id: 'custpage_sublist_serial_no', line: counter, value: line_no });	
							
							
						if(_logValidation(recordID))	{
							objSublist.setSublistValue({ id: 'custpage_sublist_internalidtext', line: counter, value: recordID });
							objSublist.setSublistValue({ id: 'custpage_sublist_internalid', line: counter, value: recordID });
						}
						if(_logValidation(recordType)){
							objSublist.setSublistValue({ id: 'custpage_sublist_transtype', line: counter, value: recordType });
						}
						if(_logValidation(subsidiary_id)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary', line: counter, value: subsidiary_id });
						}
						if(_logValidation(locationName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_location', line: counter, value: locationName });
						}
						if(_logValidation(recordDate)){
							objSublist.setSublistValue({ id: 'custpage_sublist_date', line: counter, value: recordDate });
						}
							var REC_TYPE = '';
						if(recordType == 'Journal')
						{
							REC_TYPE  = 'journalentry' ;
						}
						else if( recordType == 'VendBill')
						{
							REC_TYPE  = 'vendorbill' ;
						}
						else if(recordType == "Custom")
						{
							REC_TYPE = "customtransaction_prepayment_application";
						}
						else if(recordType == 'VendCred')
					    {
							REC_TYPE  = 'vendorcredit' ;
						}
							
						
						try{
												
						var url_p = url.resolveRecord({recordType: REC_TYPE,recordId: recordID,isEditMode: false});
						
						var po_URL  = URL_NS+url_p						
					
						var po_URL_X = "<p><a href="+url_p+">"+recordDocNo+"</a></p>"
						}
						catch(exs)
						{
							var url_p = recordDocNo ;
							var po_URL_X =url_p;
						}
						
						
						
						if (_logValidation(recordDocNo)){
							objSublist.setSublistValue({ id: 'custpage_sublist_documentno', line: counter, value: po_URL_X });
						}
						if(_logValidation(recordTransNo)){
							objSublist.setSublistValue({ id: 'custpage_sublist_transactionno', line: counter, value: recordTransNo });
						}
						if(_logValidation(vendorName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname', line: counter, value: vendorName });
						}				
						if(_logValidation(AMOUNT_DUE)){
							objSublist.setSublistValue({ id: 'custpage_sublist_amttobepaid', line: counter, value: AMOUNT_DUE });
							
						}
						if(_logValidation(amountToBePaid)){  
						
							objSublist.setSublistValue({ id: 'custpage_original_amount', line: counter, value: amountToBePaid });
						}						
						if(_logValidation(AMOUNT_DUE)){
						
							objSublist.setSublistValue({ id: 'custpage_sublist_amtdue', line: counter, value: AMOUNT_DUE });
						}
						if(_logValidation(subsidiary_id_str)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary_str', line: counter, value: subsidiary_id_str });
						}
						if(_logValidation(vendorName_str)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname_str', line: counter, value: vendorName_str });
						}
						if(recordAmount){
							objSublist.setSublistValue({ id: 'custpage_sublist_totalamt', line: counter, value: recordAmount });
						}
					
								if(bank_acc_no){
							objSublist.setSublistValue({ id: 'custpage_sublist_bank_acc_no', line: counter, value: bank_acc_no });
								}  
                 

							if(AP_Account){
							objSublist.setSublistValue({ id: 'custpage_sublist_ap_acc_no', line: counter, value: AP_Account });
								}  		
								
						counter++;										
						
					}
				}
				}
                //////////////////// VENDOR CREDIT ////////////////////////
				
					 //////////////////// VENDOR APPLICATION ////////////////////////
			
					 
                if(_logValidation(SEARCH_ID_VENDOR_PREP))
				{					
					 
				var arrFilters = new Array();

				var arrColumns = new Array();
				arrColumns.push(search.createColumn({ name: 'internalid' }));

				if(_logValidation(dStartDateParamValue) && _logValidation(dEndDateParamValue))
				{
					arrFilters.push( search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [dStartDateParamValue, dEndDateParamValue] }) );
				}
				
				if(_logValidation(vendorIdParamValue)) 
				{
					arrFilters.push( search.createFilter({ name: 'custbody_vendor', operator: search.Operator.ANYOF, values: vendorIdParamValue }) );
				}
				if(_logValidation(AP_Account)) 
				{
					arrFilters.push( search.createFilter({ name: 'account', operator: search.Operator.ANYOF, values: AP_Account }) );
				}			      
				if(_logValidation(subsidaryIdParamValue)) 
				{
					arrFilters.push( search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidaryIdParamValue }) );
				}
				var vendorbillSearchObj = search.load({ id: SEARCH_ID_VENDOR_PREP });

				if (_logValidation(arrFilters)) {
					for (var flt = 0; flt < arrFilters.length; flt++) {
						vendorbillSearchObj.filters.push(arrFilters[flt]);
					}
				}

				var objSearchResult = vendorbillSearchObj.run().getRange({ start: 0, end: DEFAULT_HIGH_LIMIT });
				
				 log.debug('debug','objSearchResult L --> ' + objSearchResult.length);

				if(_logValidation(objSearchResult)) 
				{
					
					for(var i = 0; i < objSearchResult.length; i++) 
					{
						// .run().each has a limit of 4,000 results

						var recordType = objSearchResult[i].getValue({name: "type"});
						var recordID = objSearchResult[i].getValue({ name: "internalid"});
						var locationName = objSearchResult[i].getValue({ name: "custrecord_billpaymentorg", join : "subsidiary"});
						var recordDate = objSearchResult[i].getValue({ name: "trandate"});
						var recordDueDate = objSearchResult[i].getValue({ name: "duedate"});
						var recordDocNo = objSearchResult[i].getValue({ name: "tranid"});
						var recordTransNo=objSearchResult[i].getValue({ name: "transactionnumber"});
						//var vendorName = objSearchResult[i].getValue({ name: "altname", join: "vendor"});
						//var vendorCode = objSearchResult[i].getValue({name: "formulatext",formula: "{vendor.entityid}"});
						var vendorName = objSearchResult[i].getValue({ name: "custbody_vendor"});
						var recordAmount = objSearchResult[i].getValue({ name: "total"});	
                        var bank_acc_no =  objSearchResult[i].getValue({ name: "custrecord_mhl_subsidiarybankaccount" , join : "subsidiary"});
						var subsidiary_id =  objSearchResult[i].getValue({ name: "subsidiarynohierarchy"});
						var AP_Account =  objSearchResult[i].getValue({ name: "account"});
						var amount_total = objSearchResult[i].getValue({ name: "amount"});
						
						var subsidiary_id_str =  objSearchResult[i].getText({ name: "subsidiarynohierarchy"});
							var vendorName_str = objSearchResult[i].getText({ name: "custbody_vendor"});
						
						var AMOUNT = objSearchResult[i].getValue({ name: "amount"});
																	
						var AMT_PAID = objSearchResult[i].getValue({name: "amountpaid"});
						
						if(!_logValidation(AMOUNT))
						{
							AMOUNT = 0 ;
						}
						if(!_logValidation(AMT_PAID))
						{
							AMT_PAID = 0 ;
						}
						
						var AMOUNT_DUE = objSearchResult[i].getValue({name: "amountremaining"});
                        if(recordType == "Custom")
						{
							var amountToBePaid = parseFloat(amount_total);
						}							
						else{								
						var amountToBePaid = parseFloat(recordAmount);	
                        }								
					//	var amountToBePaid = parseFloat(recordAmount);	

                    //   log.debug('debug','recordID ['+i+'] --> ' + recordID);						
						
					
						  var line_no = parseInt(counter)+1 ;
                          line_no = line_no.toFixed(0);						  
							
						 objSublist.setSublistValue({ id: 'custpage_sublist_serial_no', line: counter, value: line_no });	
							
							
						if(_logValidation(recordID))	{
							objSublist.setSublistValue({ id: 'custpage_sublist_internalidtext', line: counter, value: recordID });
							objSublist.setSublistValue({ id: 'custpage_sublist_internalid', line: counter, value: recordID });
						}
						if(_logValidation(recordType)){
							objSublist.setSublistValue({ id: 'custpage_sublist_transtype', line: counter, value: recordType });
						}
						if(_logValidation(subsidiary_id)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary', line: counter, value: subsidiary_id });
						}
						if(_logValidation(locationName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_location', line: counter, value: locationName });
						}
						if(_logValidation(recordDate)){
							objSublist.setSublistValue({ id: 'custpage_sublist_date', line: counter, value: recordDate });
						}
						
								var REC_TYPE = '';
						if(recordType == 'Journal')
						{
							REC_TYPE  = 'journalentry' ;
						}
						else if( recordType == 'VendBill')
						{
							REC_TYPE  = 'vendorbill' ;
						}
						else if(recordType == "Custom")
						{
							REC_TYPE = "customtransaction_prepayment_application";
						}
						else if(recordType == 'VendCred')
					    {
							REC_TYPE  = 'vendorcredit' ;
						}
							
						
						try{
												
						var url_p = url.resolveRecord({recordType: REC_TYPE,recordId: recordID,isEditMode: false});
						
						var po_URL  = URL_NS+url_p						
					
						var po_URL_X = "<p><a href="+url_p+">"+recordDocNo+"</a></p>"
						}
						catch(exs)
						{
							var url_p = recordDocNo ;
							var po_URL_X =url_p;
						}
						
						
						
						if (_logValidation(recordDocNo)){
							objSublist.setSublistValue({ id: 'custpage_sublist_documentno', line: counter, value: po_URL_X });
						}
						if(_logValidation(recordTransNo)){
							objSublist.setSublistValue({ id: 'custpage_sublist_transactionno', line: counter, value: recordTransNo });
						}
						if(_logValidation(vendorName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname', line: counter, value: vendorName });
						}				
						if(_logValidation(AMOUNT_DUE)){
							objSublist.setSublistValue({ id: 'custpage_sublist_amttobepaid', line: counter, value: AMOUNT_DUE });
							
						}
						if(_logValidation(amountToBePaid)){  
						
							objSublist.setSublistValue({ id: 'custpage_original_amount', line: counter, value: amountToBePaid });
						}						
						if(_logValidation(AMOUNT_DUE)){
						
							objSublist.setSublistValue({ id: 'custpage_sublist_amtdue', line: counter, value: AMOUNT_DUE });
						}
						if(_logValidation(subsidiary_id_str)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary_str', line: counter, value: subsidiary_id_str });
						}
						if(_logValidation(vendorName_str)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname_str', line: counter, value: vendorName_str });
						}						
						
						if(recordAmount){
							objSublist.setSublistValue({ id: 'custpage_sublist_totalamt', line: counter, value: recordAmount });
						}
					
								if(bank_acc_no){
							objSublist.setSublistValue({ id: 'custpage_sublist_bank_acc_no', line: counter, value: bank_acc_no });
								}  
                 

							if(AP_Account){
							objSublist.setSublistValue({ id: 'custpage_sublist_ap_acc_no', line: counter, value: AP_Account });
								}  		
								
						counter++;										
						
					}
				}
				}
                //////////////////// VENDOR APPLICATION ////////////////////////
				
				
				//////////////////// JOURNAL ////////////////////////	

                try{
				if(_logValidation(SEARCH_ID_JOURNAL)){
				var arrFilters = new Array();

				var arrColumns = new Array();
				arrColumns.push(search.createColumn({ name: 'internalid' }));

				if(_logValidation(dStartDateParamValue) && _logValidation(dEndDateParamValue))
				{
					arrFilters.push( search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [dStartDateParamValue, dEndDateParamValue] }) );
				}
				
				if(_logValidation(vendorIdParamValue)) 
				{
					arrFilters.push( search.createFilter({ name: 'entity', operator: search.Operator.ANYOF, values: vendorIdParamValue }) );
				}
				if(_logValidation(AP_Account)) 
				{
					arrFilters.push( search.createFilter({ name: 'account', operator: search.Operator.ANYOF, values: AP_Account }) );
				}			      
				if(_logValidation(subsidaryIdParamValue)) 
				{
					arrFilters.push( search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidaryIdParamValue }) );
				}
				var vendorbillSearchObj = search.load({ id: SEARCH_ID_JOURNAL });

				if(_logValidation(arrFilters)) {
					for (var flt = 0; flt < arrFilters.length; flt++) {
						vendorbillSearchObj.filters.push(arrFilters[flt]);
					}
				}

				var objSearchResult = vendorbillSearchObj.run().getRange({ start: 0, end: DEFAULT_HIGH_LIMIT });
				
				 log.debug('debug','objSearchResult L --> ' + objSearchResult.length);

				if(_logValidation(objSearchResult)) 
				{
					
					for(var i = 0; i < objSearchResult.length; i++) 
					{
						// .run().each has a limit of 4,000 results

						var recordType = objSearchResult[i].getValue({name: "type",summary: "GROUP",});
						var recordID = objSearchResult[i].getValue({ name: "internalid",summary: "GROUP",});
						var locationName = objSearchResult[i].getValue({ name: "custrecord_billpaymentorg", join : "subsidiary" , summary: "GROUP",});
						var recordDate = objSearchResult[i].getValue({ name: "trandate", summary: "GROUP",});
						var recordDueDate = objSearchResult[i].getValue({ name: "duedate", summary: "GROUP",});
						var recordDocNo = objSearchResult[i].getValue({ name: "tranid", summary: "GROUP",});
						var recordTransNo=objSearchResult[i].getValue({ name: "transactionnumber", summary: "GROUP",});
						//var vendorName = objSearchResult[i].getValue({ name: "altname", join: "vendor"});
						//var vendorCode = objSearchResult[i].getValue({name: "formulatext",formula: "{vendor.entityid}"});
						//var vendorName = objSearchResult[i].getValue({ name: "entity", summary: "GROUP",});
						var vendorName = objSearchResult[i].getValue({name: "internalid",join: "vendorLine", summary: "GROUP"});
						
						
						 var subsidiary_id_str =  objSearchResult[i].getText({ name: "subsidiarynohierarchy"});
						 var vendorName_str = objSearchResult[i].getValue({name: "internalid",join: "vendorLine", summary: "GROUP"});
					
						
						var recordAmount = objSearchResult[i].getValue({ name: "total", summary: "SUM",});	
                        var bank_acc_no =  objSearchResult[i].getValue({ name: "custrecord_mhl_subsidiarybankaccount" , join : "subsidiary", summary: "GROUP",});
					//	var subsidiary_id =  objSearchResult[i].getValue({ name: "subsidiarynohierarchy", summary: "GROUP",});
						var subsidiary_id =  objSearchResult[i].getValue({ name: "subsidiary", summary: "GROUP",});
						var AP_Account =  objSearchResult[i].getValue({ name: "account", summary: "GROUP",});
						var amount_total = objSearchResult[i].getValue({ name: "amount", summary: "SUM",});
						
						var AMOUNT = objSearchResult[i].getValue({ name: "amount", summary: "SUM",});
																	
						var AMT_PAID = objSearchResult[i].getValue({name: "amountpaid", summary: "SUM",});
						
						if(!_logValidation(AMOUNT))
						{
							AMOUNT = 0 ;
						}
						if(!_logValidation(AMT_PAID))
						{
							AMT_PAID = 0 ;
						}
						
						var AMOUNT_DUE = objSearchResult[i].getValue({name: "amountremaining", summary: "SUM",});
						

                        if(recordType == "Journal")
						{
							var amountToBePaid = parseFloat(amount_total);
						}							
						else{								
						var amountToBePaid = parseFloat(recordAmount);	
                        }
                 //      log.debug('debug','recordID ['+i+'] --> ' + recordID + ' vendorName ['+i+'] -->'+vendorName);						
						
					
						  var line_no = parseInt(counter)+1 ;
                          line_no = line_no.toFixed(0);						  
							
						 objSublist.setSublistValue({ id: 'custpage_sublist_serial_no', line: counter, value: line_no });	
							
							
						if(_logValidation(recordID))	{
							objSublist.setSublistValue({ id: 'custpage_sublist_internalidtext', line: counter, value: recordID });
							objSublist.setSublistValue({ id: 'custpage_sublist_internalid', line: counter, value: recordID });
						}
						if(_logValidation(recordType)){
							objSublist.setSublistValue({ id: 'custpage_sublist_transtype', line: counter, value: recordType });
						}
						if(_logValidation(subsidiary_id)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary', line: counter, value: subsidiary_id });
						}
						if(_logValidation(locationName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_location', line: counter, value: locationName });
						}
						if(_logValidation(recordDate)){
							objSublist.setSublistValue({ id: 'custpage_sublist_date', line: counter, value: recordDate });
						}
						log.debug('schedulerFunction',' recordType  -->'+recordType);		
						
				         	var REC_TYPE = '';
						if(recordType == 'Journal')
						{
							REC_TYPE  = 'journalentry' ;
						}
						else if( recordType == 'VendBill')
						{
							REC_TYPE  = 'vendorbill' ;
						}
						else if(recordType == "Custom")
						{
							REC_TYPE = "customtransaction_prepayment_application";
						}
						else if(recordType == 'VendCred')
					    {
							REC_TYPE  = 'vendorcredit' ;
						}
							
						
						try{
												
						var url_p = url.resolveRecord({recordType: REC_TYPE,recordId: recordID,isEditMode: false});
						
						var po_URL  = URL_NS+url_p						
					
						var po_URL_X = "<p><a href="+url_p+">"+recordDocNo+"</a></p>"
						}
						catch(exs)
						{
							var url_p = recordDocNo ;
							var po_URL_X =url_p;
						}
						   		
						
						
						
						
						if (_logValidation(recordDocNo)){
							objSublist.setSublistValue({ id: 'custpage_sublist_documentno', line: counter, value: po_URL_X });
						}
						if(_logValidation(recordTransNo)){
							objSublist.setSublistValue({ id: 'custpage_sublist_transactionno', line: counter, value: recordTransNo });
						}
						if(_logValidation(vendorName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname', line: counter, value: vendorName });
						}				
						if(_logValidation(AMOUNT_DUE)){
							objSublist.setSublistValue({ id: 'custpage_sublist_amttobepaid', line: counter, value: AMOUNT_DUE });
							
						}
						if(_logValidation(amountToBePaid)){  
						
							objSublist.setSublistValue({ id: 'custpage_original_amount', line: counter, value: amountToBePaid });
						}						
						if(_logValidation(AMOUNT_DUE)){
						
							objSublist.setSublistValue({ id: 'custpage_sublist_amtdue', line: counter, value: AMOUNT_DUE });
						}
						if(_logValidation(subsidiary_id)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary', line: counter, value: subsidiary_id });
						}
						if(_logValidation(vendorName)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname', line: counter, value: vendorName });
						}						
						if(_logValidation(subsidiary_id_str)){
							objSublist.setSublistValue({ id: 'custpage_sublist_subsidiary_str', line: counter, value: subsidiary_id_str });
						}
						if(_logValidation(vendorName_str)){
							objSublist.setSublistValue({ id: 'custpage_sublist_vendorname_str', line: counter, value: vendorName_str });
						}
						if(recordAmount){
							objSublist.setSublistValue({ id: 'custpage_sublist_totalamt', line: counter, value: recordAmount });
						}					
						if(bank_acc_no){
							objSublist.setSublistValue({ id: 'custpage_sublist_bank_acc_no', line: counter, value: bank_acc_no });
						}  
                 

							if(AP_Account){
							objSublist.setSublistValue({ id: 'custpage_sublist_ap_acc_no', line: counter, value: AP_Account });
								}  		
								
						counter++;										
						
					} 
				}
				}} catch(err){
					
				log.debug({title: "Exception Message err", details: err.message});	
					
				}
                //////////////////// JOURNAL ////////////////////////
                } //TRUE
					
					objForm.addSubmitButton({ id: 'process', label: 'Create Merger Payments', functionName: 'process()' });
				//}
				
				
				
				objForm.addButton({ id: 'search', label: 'Apply Criteria', functionName: 'searchlist()' });
				objForm.addButton({ id: 'refresh', label: 'Reset', functionName: 'refresh()' });
			//	objForm.addButton({ id: 'export_file', label: 'Download Report', functionName: 'download_report()' });
                objForm.addButton({ id: 'vendor_payment_link', label: 'Open Vendor Payment List', functionName: 'vendor_payment_link()' });
				objForm.addButton({ id: 'calculate_total', label: 'Calculate Total', functionName: 'calculate_total()' });
				context.response.writePage(objForm);

				log.debug('onRequest:Get()','----------------------------------------- execution Ends here ------------------------------------------------------');
			}
			catch(e){
				var errString =  'Error :' + e.name + ' : ' + e.type + ' : ' + e.message;
				log.error({ title: 'onRequest:GET()', details: errString });
			}

		} //else if (context.request.method == 'POST') {
		else {

			try{
				log.debug('onRequest:Post()','----------------------------------------- Execution Starts Here ------------------------------------------------------');

				var arr_vendor = new Array();
				var AMOUNT_ID_ARR = {};

				var getUserId = context.request.parameters.custpage_userid;
				log.debug('onRequest:Post()','getUserId=='+getUserId);

				var getTransmissionDate = context.request.parameters.custpage_transmissiondate;
				log.debug('onRequest:Post()','getTransmissionDate=='+getTransmissionDate);

				var getBankAccount = context.request.parameters.custpage_bank_account;
				log.debug('onRequest:Post()','getBankAccount=='+getBankAccount);

				var getBankAccountNo = context.request.parameters.custpage_bank_account_no;
				log.debug('onRequest:Post()','getBankAccountNo=='+getBankAccountNo);

				var getBankPaymentMethod = context.request.parameters.custpage_bank_payment_method;
				log.debug('onRequest:Post()','getBankPaymentMethod=='+getBankPaymentMethod);
				
				var batch_no = context.request.parameters.custpage_batch_no;
				log.debug('onRequest:Post()','batch_no =='+batch_no);
				
				var future_date = context.request.parameters.custpage_futuredate;
				log.debug('onRequest:Post()','future_date =='+future_date);				

				var sublistLineCount = context.request.getLineCount({ group: 'custpage_sublist' });
				log.debug('onRequest:Post()','sublistLineCount=='+sublistLineCount);
							

				if (_logValidation(sublistLineCount)) {

					for(var k = 0; k < sublistLineCount; k++) { 

						var bCheckboxValue = context.request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_sublist_select', line: k });
						
						var getBillId = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_internalidtext',line: k});  
																
						var getAmountToBePaid = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_amttobepaid',line: k}); 
						
						var location_TTT = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_location',line: k}); 
						
						var ACCOUNT_TTT = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_bank_acc_no',line: k}); 
						
						var AP_ACCOUNT_TTT = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_ap_acc_no',line: k}); 
						
                        var VENDOR_TTT = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_vendorname',line: k}); 
						
						var SUBSIDIARY_TTT = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_subsidiary',line: k}); 
						
						var TRAN_TXT_TTT = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_internalid',line: k}); 
						
						var TRAN_TYPE_R = context.request.getSublistValue({group: 'custpage_sublist',name: 'custpage_sublist_transtype',line: k}); 
						
                        var TRAN_TYPE_TTT = get_rec_type(TRAN_TYPE_R)						
						log.debug('onRequest:Post()','TRAN_TYPE_TTT=='+TRAN_TYPE_TTT);
				
						if(bCheckboxValue == 'T') 
						{
							arr_vendor.push(VENDOR_TTT);
							AMOUNT_ID_ARR[getBillId] = {"trans_type": TRAN_TYPE_TTT, "tran_txt" : TRAN_TXT_TTT , "subsidiary_tt": SUBSIDIARY_TTT, "vendor_tt" :VENDOR_TTT ,"amount_to_be_paid" :getAmountToBePaid , "get_bill_id" :getBillId , "location_tt" :location_TTT ,"account_tt" :ACCOUNT_TTT , "ap_account_tt" : AP_ACCOUNT_TTT};							
						}
					}
				}
				log.debug('onRequest:Post()','arr_vendor =='+arr_vendor);
				log.debug('onRequest:Post()','AMOUNT_ID_ARR =='+JSON.stringify(AMOUNT_ID_ARR));
            
			    arr_vendor = remove_duplicates(arr_vendor);

				//----------------------------------------------------------- Start - Call the Map/Reduce Script to create Bank details Custom record and bank payment file ------------------------------------------//
				var objScriptTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
				objScriptTask.scriptId = 'customscript_mr_bulk_create_merger_rds';
				objScriptTask.deploymentId = null;
				objScriptTask.params = {
						'custscript_vendor_array_zx': arr_vendor.toString(),
						'custscript_json_array': AMOUNT_ID_ARR	,
						'custscript_batch_no' : batch_no ,
						'custscript_future_date' : future_date
						
				};
				var taskSubmitId = objScriptTask.submit();
				log.debug('onRequest:Post()','Script Scheduled ...taskSubmitId =='+taskSubmitId); 
				//----------------------------------------------------------- End - Call the Map/Reduce Script to create Bank details Custom record and bank payment file ------------------------------------------//

				//Redirect to main suitelet criteria UI Page
				redirect.toSuitelet({scriptId: 'customscript_sut_merger_bulk_create_pay_' , deploymentId:'customdeploy1',parameters : null});
			}
			catch(e){
				var errString =  'Error :' + e.name + ' : ' + e.type + ' : ' + e.message;
				log.error({ title: 'onRequest:POST()', details: errString });
			}
			log.debug('onRequest:Post()','----------------------------------------- Execution Ends Here ------------------------------------------------------');
		}

	}
	
	function get_batch_details()
	{
	   var i_BATCH_NO = "";	
	  
	   //if(_logValidation(TODAYS_DATE))
	   {  // log.debug("get_batch_details d_payment_date XXX ",TODAYS_DATE);
		   try
		   {
			   var customrecord_yil_bank_detailsSearchObj = search.create({
			   type: "customrecord_merger_vendor_payment",
			   filters:
			   [
				  ["custrecord_batch_no","isnotempty",""]/*,
				  "AND",
				  ["custrecord_payment_date","on","today"]*/
			   ],
			   columns:
			   [
				  search.createColumn({name: "custrecord_batch_no",summary: "GROUP"}),
				  search.createColumn({name: "custrecord_payment_date", summary: "GROUP" }),
				  search.createColumn({name: "internalid", summary: "GROUP",sort: search.Sort.DESC })
			   ]
			});
			var searchResultCount = customrecord_yil_bank_detailsSearchObj.runPaged().count;
			
			customrecord_yil_bank_detailsSearchObj.run().each(function(result){
			   i_BATCH_NO = result.getValue({name: "custrecord_batch_no",summary: "GROUP" });
			   log.debug('i_BATCH_NO','i_BATCH_NO=='+i_BATCH_NO);
				
						   
			 //  return true;
			});
		   }	
		   catch(xqw)
		   {
			log.debug("ERROR","xqw Exception Caught -->"+xqw);   
		   }  		   
	   }	
       if(!_logValidation(i_BATCH_NO))
	   {
		 i_BATCH_NO = 0 ;  
	   }	   
	  i_BATCH_NO = parseInt(i_BATCH_NO)+1 ;
	   
				
	   
	  return i_BATCH_NO ;
	}

	function split_data(data_q)
	{
		var a_data_ARR = new Array();	
		if(_logValidation(data_q))
		{	 
			var i_data_TT = new Array();
			i_data_TT =  data_q.toString();

			if(_logValidation(i_data_TT))
			{
				for(var dt=0;dt<i_data_TT.length;dt++)
				{
					a_data_ARR = i_data_TT.split(',');
					break;				
				}	
			}//Data TT   
		}	  
		return a_data_ARR ;
	}
	function convert_date(d_date)
	{
		var d_date_convert = "" ;	

		if(_logValidation(d_date))
		{
			var currentTime = new Date(d_date);
			var currentOffset = currentTime.getTimezoneOffset();
			var ISTOffset = 330;   // IST offset UTC +5:30 
			d_date_convert = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);

		}	
		return d_date_convert; 
	}

	function _logValidation(value) {
		if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
			return true;
		} else {
			return false;
		}
	}
    function get_rec_type(REC_TYPE)
	{
		var return_x = "";
		
		if(REC_TYPE == "VendBill")
		{
			return_x = "vendorbill";
		}
		else if(REC_TYPE == "VendCred")
		{
			return_x = "vendorcredit";
		}
		else if(REC_TYPE == "Journal")
		{
			return_x = "journalentry";
		}
		else if(REC_TYPE == "Custom")
		{
			return_x = "customtransaction_prepayment_application";
		}
		return return_x;		
	}
    function remove_duplicates(arr) 
	{
		var seen = {};
		var ret_arr = [];
		for(var i = 0; i < arr.length; i++) 
		{
			if(!(arr[i] in seen))
			{
				ret_arr.push(arr[i]);
				seen[arr[i]] = true; 		   
			}
		}
		return ret_arr;
	}
	function get_subsidiary_details()
	{
	 var SUB_JSON = {};	
	  try
	  {
		  var subsidiarySearchObj = search.create({
			   type: "subsidiary",
			   filters:
			   [
			   ],
			   columns:
			   [
				  search.createColumn({name: "internalid"}),
				  search.createColumn({name: "name"}),
				  search.createColumn({name: "parent"})
			   ]
			});
			var searchResultCount = subsidiarySearchObj.runPaged().count;
			
			subsidiarySearchObj.run().each(function(result){
			var i_SUB_ID = result.getValue({name :"internalid"});	
			var s_SUB_NAME = result.getValue({name :"name"});
			
			if(_logValidation(s_SUB_NAME))
			{
				var split_sub_name_x = s_SUB_NAME.split(':');				
				
				if(_logValidation(split_sub_name_x))
				{
					var sub_name_LEN = parseInt(split_sub_name_x.length)-parseInt(1);
					var SUB_NAME_SPL = split_sub_name_x[sub_name_LEN];
					
					if(_logValidation(SUB_NAME_SPL))
					{
						SUB_JSON[i_SUB_ID] = {"sub_name" : SUB_NAME_SPL};
					}			
				}					
			}    			   
			   return true;
			});

	  }	  
	  catch(excdd)
	  {
		log.debug("ERROR","Exception Caught -->"+excdd);  
	  }
		
	 return SUB_JSON ;	
	}

	return {
		onRequest: onRequest
	};
});