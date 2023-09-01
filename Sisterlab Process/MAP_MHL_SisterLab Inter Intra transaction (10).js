/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 *  Script Name: MAP_MHL_SisterLab Inter Intra transaction.js
	* Author:Sakharam Kolekar	/ Produciton
	* Date: 05 - Nov - 2020
	* Description:1] This script will create the inter intra transactions.              
	* Script Modification Log:
	-- Date --	-- Modified By --	--Requested By--	-- Description --
 */
define(['N/file', 'N/format', 'N/record', 'N/search','N/runtime'],
		/**
		 * @param {file} file
		 * @param {format} format
		 * @param {record} record
		 * @param {search} search
		 * @param {transaction} transaction
		 */
		function(file, format, record, search,runtime) {

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
	function getInputData() {

		try
		{
			log.debug('Get input Data Stage');
			return search.load({
				id:'customsearch_test_wise_detail_sislab_2'
			});

		}
		catch(e)
		{			
			log.debug({title:'Error Occured while collecting transaction',details:e});
		}
	}//End Input stage


	function map(context) {
		try 
		{
			
			log.debug('Map Stage');
			//return '';
			var scriptObj = runtime.getCurrentScript();
			
			var sisterLabItem= scriptObj.getParameter({name: 'custscript_map_sister_lab_itemt'}); //scriptObj.getSetting('SCRIPT','custscript_sister_lab_item'); 
			log.debug('sisterLabItem',sisterLabItem);
			
			var sisterLabSegInter=scriptObj.getParameter({name: 'custscript_map_sister_lab_seg_intert'}); //scriptObj.getSetting('SCRIPT','custscript_sister_lab_seg_inter');
			//log.debug('sisterLabSegInter',sisterLabSegInter);
			
			var sisterLabSegIntra=scriptObj.getParameter({name: 'custscript_map_sister_lab_seg_intrat'}); //scriptObj.getSetting('SCRIPT','custscript_sister_lab_seg_intra');
			//log.debug('sisterLabSegIntra',sisterLabSegIntra);
			
			var debitAcc=scriptObj.getParameter({name: 'custscript_map_debit_acct'}); //scriptObj.getSetting('SCRIPT','custscript_debit_acc'); 
			//log.debug('debitAcc',debitAcc);
			var creditAcc=scriptObj.getParameter({name: 'custscript_map_credit_acct'}); //scriptObj.getSetting('SCRIPT', 'custscript_credit_acc'); 
			//log.debug('creditAcc',creditAcc);
			
			var revenueAcc=scriptObj.getParameter({name: 'custscript_map_revenue_acct'}); //scriptObj.getSetting('SCRIPT','custscript_revenue_acc');
			//log.debug('revenueAcc',revenueAcc);
			
			var arDebitAcc=scriptObj.getParameter({name: 'custscript_map_debit_ar_tdst'}); //scriptObj.getSetting('SCRIPT','custscript_debit_ar_tds');
			//log.debug('arDebitAcc',arDebitAcc);
			
			var apDebitAcc=scriptObj.getParameter({name: 'custscript_map_debit_ap_tdst'}); //scriptObj.getSetting('SCRIPT','custscript_debit_ap_tds');
			//log.debug('apDebitAcc',apDebitAcc);
			
			var arCreditAcc=scriptObj.getParameter({name: 'custscript_map_credit_ar_tdst'}); //scriptObj.getSetting('SCRIPT','custscript_credit_ar_tds');
			//log.debug('arCreditAcc',arCreditAcc);
			
			var apCreditAcc=scriptObj.getParameter({name: 'custscript_map_credit_ap_tdst'}); //scriptObj.getSetting('SCRIPT','custscript_credit_ap_tds');
			//log.debug('apCreditAcc',apCreditAcc);
			
			var vendorAcc=scriptObj.getParameter({name: 'custscript_map_vendor_invoice_acct'}); //scriptObj.getSetting('SCRIPT','custscript_vendor_invoice_acc');		
			//log.debug('vendorAcc',vendorAcc);
			
			var tdsCode=scriptObj.getParameter({name: 'custscript_map_tds_section_codet'}); //scriptObj.getSetting('SCRIPT','custscript_tds_section_code');
			//scriptObj.getSetting('SCRIPT','custscript_tds_section_code');
			
			log.debug('tdsCode',tdsCode);
			
			
			var tdsRec= record.load({type:'customrecord_in_tds_setup',id:tdsCode});				
			var i_tds_section_code = tdsRec.getValue({fieldId:'custrecord_in_tds_setup_section_code'});
			var tempSplit=((tdsRec.getValue({fieldId:'custrecord_in_tds_setup_rate'})).toString()).split('%');
			var tdsPercentage=Number(tempSplit[0]);
			//log.debug('tdsPercentage',tdsPercentage);
			
			//log.debug('context.value',context.value);
			var s_data = context.value;
			var s_final_data = s_data.replace(/.CUSTRECORD_MHL_ITD_VID/g,'CUSTRECORD_MHL_ITD_VID');
			s_final_data = s_final_data.replace(/.CUSTRECORD_PROCESSING_CENTER_ORG/g,'CUSTRECORD_PROCESSING_CENTER_ORG');
			
			log.debug('s_final_data',s_final_data);	
			var data = JSON.parse(s_final_data); //read the data
			//log.debug('data',data);	
			
			
			var sisterLabVidId='';
			var costBookingId='';
			var eliminationId='';
			
			var registerOrg = data.values.custbody_mhl_sl_mainvidorgCUSTRECORD_MHL_ITD_VID.value;
			log.debug('registerOrg',registerOrg);	

			var registeredSubsidiary=data.values.custbody_mhl_sl_mainvidsubsyCUSTRECORD_MHL_ITD_VID.value;//(record.load({type:record.Type.LOCATION,id:registerOrg})).getValue({fieldId:'subsidiary'});
			
			var processingOrg= data.values.locationCUSTRECORD_MHL_ITD_VID.value;//data.values.custrecord_processing_center_org.value;
			log.debug('processingOrg',processingOrg);	

			var processingSubsidiary= data.values.subsidiaryCUSTRECORD_MHL_ITD_VID.value;//(record.load({type:record.Type.LOCATION,id:processingOrg})).getValue({fieldId:'subsidiary'});
			
			//log.debug('processingSubsidiary',processingSubsidiary);
			var testCode = data.values.custrecord_mhl_itd_test_code.value;
			//log.debug('testCode',testCode);
			//var processingLoc = data.values.custrecord_processing_center.value;
			//log.debug('processingLoc',processingLoc);
			var currentVidId = data.values.internalidCUSTRECORD_MHL_ITD_VID.value;
			//log.debug('currentVidId',currentVidId);
			var i_sis_labVidId = data.values.internalidCUSTRECORD_MHL_ITD_VID.value;
			var i_MainVidId = data.values.custbody_mhl_sl_mainvidnumberCUSTRECORD_MHL_ITD_VID.value;
			var i_customer_Id = data.values.entityCUSTRECORD_MHL_ITD_VID.value;
			var testWiseInvRecId = data.values.internalid.value;
			//log.debug('testWiseInvRecId',testWiseInvRecId);
			var s_inv_tran_date = data.values.trandateCUSTRECORD_MHL_ITD_VID;
			log.debug('s_inv_tran_date',s_inv_tran_date);
			/*s_inv_tran_date = format.format({
				value: s_inv_tran_date,
				type: format.Type.DATE
			});*/
			 s_inv_tran_date = format.parse({
					value: s_inv_tran_date,
					type: format.Type.DATE
				});
			
			//log.debug('s_inv_tran_date',s_inv_tran_date);
			var i_inv_posting_period = data.values.postingperiodCUSTRECORD_MHL_ITD_VID.value;
			//log.debug('i_inv_posting_period',i_inv_posting_period);
			var i_vid_unit = data.values.custbody_mhl_sl_mainvidunitCUSTRECORD_MHL_ITD_VID.value;
			log.debug('i_vid_unit',i_vid_unit);
			var i_process_cent_unit = data.values.cseg_mhl_custseg_unCUSTRECORD_MHL_ITD_VID.value;
			log.debug('i_process_cent_unit',i_process_cent_unit);
			var i_elmination_unit = '';
			if(i_vid_unit == i_process_cent_unit)
			{
				i_elmination_unit = i_vid_unit;
			}
			var i_elmination_SBU = '';
			var i_vid_SBU = data.values.custbody_mhl_sl_mainvidsbuCUSTRECORD_MHL_ITD_VID.value;
			log.debug('i_vid_SBU',i_vid_SBU);
			var i_process_SBU = data.values.classCUSTRECORD_MHL_ITD_VID.value;
			log.debug('i_process_SBU',i_process_SBU);
			if(i_vid_SBU == i_process_SBU)
			{
				i_elmination_SBU = i_process_SBU;
			}
			else{
				i_elmination_SBU = 3; //Elimination SBU
			}
			//log.debug('i_elmination_unit',i_elmination_unit);
			log.debug('i_elmination_SBU',i_elmination_SBU);	
			var f_net_amount = data.values.custrecord_mhl_itd_net_amt
			
			
			//Search customer details
			//var customerDetails = searchCustomer(registerOrg,processingOrg);
			//log.debug('customerDetails',customerDetails);			
			
			//if(registerOrg!=processingOrg)
			{
				if(i_customer_Id)
				{
					//var customerId=customerDetails[0].getValue({name:'custrecord_mhl_im_processing_customer'});
					//var interIntra=customerDetails[0].getValue({name:'custrecord_inter_intra_type'});
					//var eliminationLocation=customerDetails[0].getValue({name:'custrecord_mhl_elimination_location'});
					//var vendorId=customerDetails[0].getValue({name:'custrecord_interco_vendor'});
					//log.debug('customerId',customerId);
					
					//var amount=searchItemRate(customerId,testCode,processingOrg);
					
					var customerId=  i_customer_Id;//customerDetails[0].getValue('custrecord_mhl_im_processing_customer');
					//var interIntra=customerDetails[0].getValue('custrecord_inter_intra_type');
					//var eliminationLocation=customerDetails[0].getValue('custrecord_mhl_elimination_location');
					//var vendorId=customerDetails[0].getValue('custrecord_interco_vendor');

					var amount=f_net_amount;//searchItemRate(customerId,testCode,processingOrg);
					log.debug('amount',amount);
					if(amount)
					{
						//1: Inter, 2: Intra
						if(processingSubsidiary==registeredSubsidiary)  // Intra company Transactions
						{							
							/// Sister Lab VID
							var interIntra= 2;
							sisterLabVidId= i_sis_labVidId;//createVIDforSisterLab(testWiseInvRecId,customerId,processingLoc,sisterLabItem,amount,'2',sisterLabSegIntra,processingOrg,currentVidId,s_inv_tran_date,i_inv_posting_period,i_process_cent_unit,i_process_SBU)
							log.debug('sisterLab VidId',sisterLabVidId);
							
							//Search Elimination Location
							var o_search_location = searchElimination_loc(registeredSubsidiary,processingSubsidiary,interIntra);
							if(o_search_location)
							{
								var eliminationLocation=o_search_location[0].getValue('custrecord_mhl_elimination_location');
								
								if(eliminationLocation)
								{
									// Cost Booking entry
									costBookingId=costBooking(testWiseInvRecId,registeredSubsidiary,customerId,registerOrg,debitAcc,creditAcc,amount,currentVidId,processingOrg,sisterLabSegIntra,s_inv_tran_date,i_inv_posting_period,i_vid_unit,i_process_cent_unit,i_vid_SBU,i_process_SBU);
									log.debug('cost Booking Id',costBookingId);
									if(sisterLabVidId)
									{
										var paymentId=paymentApply(testWiseInvRecId,sisterLabVidId,costBookingId,processingOrg,s_inv_tran_date,i_inv_posting_period);
										log.debug('payment Id',paymentId);
									}
									// Elimination Entry

									eliminationId=eliminationBooking(testWiseInvRecId,registeredSubsidiary,sisterLabSegIntra,eliminationLocation,revenueAcc,debitAcc,amount,currentVidId,registerOrg,processingOrg,s_inv_tran_date,i_inv_posting_period,i_elmination_unit,i_elmination_SBU);
									log.debug('Elimination Booking Id',eliminationId);


									//if(sisterLabVidId && costBookingId && eliminationId && (paymentId==0))
									if(sisterLabVidId && costBookingId && eliminationId)
									{
										//nlapiSubmitField('customrecord_mhl_invoice_testwise_detail',testWiseInvRecId,['custrecord_processed_inter_intra','custrecord_sister_lab_vid','custrecord_cost_boking_entry','custrecord_elimination_entry'],['T',sisterLabVidId,costBookingId,eliminationId]);
									
											var id = record.submitFields({
													type : 'customrecord_mhl_invoice_testwise_detail',
													id : testWiseInvRecId,
													values : {
														custrecord_processed_inter_intra : 'T',
														custrecord_sister_lab_vid : sisterLabVidId, 
														custrecord_cost_boking_entry:costBookingId, 
														custrecord_elimination_entry:eliminationId,
														custrecord_mhl_error_detail : ''
													},
													options: {
													enableSourcing: true,
													ignoreMandatoryFields : true
													}
												});   
									}
									else
									{
										log.debug('intra company transaction','Deleting record');
										if(costBookingId)
										{
											//nlapiDeleteRecord('customtransaction_mhl_intra_costbkg',vendorBillId);
											record.delete({
											   type: 'customtransaction_mhl_intra_costbkg',
											   id: costBookingId,
											  });
										}
										if(sisterLabVidId)
										{
											//nlapiDeleteRecord('invoice',sisterLabVidId);
											
										}
										if(eliminationId)
										{
											//nlapiDeleteRecord('customtransaction_mhl_interintra_elimina',eliminationId);
											record.delete({
											   type: 'customtransaction_mhl_interintra_elimina',
											   id: eliminationId,
											  });
										}

									}
								}// End if eliminationLocation
								else{
									var id = record.submitFields({
										type : 'customrecord_mhl_invoice_testwise_detail',
										id : testWiseInvRecId,
										values : {
											custrecord_mhl_error_detail : 'Elimination Location Not Found for Register Subsidiary:'+registeredSubsidiary+' Processing Subsidiary:'+registeredSubsidiary											
										},
										options: {
										enableSourcing: true,
										ignoreMandatoryFields : true
										}
									}); 
								}
							}//End o_search_location
							else{
									var id = record.submitFields({
										type : 'customrecord_mhl_invoice_testwise_detail',
										id : testWiseInvRecId,
										values : {
											custrecord_mhl_error_detail : 'Elimination Location Not Found for Register Subsidiary:'+registeredSubsidiary+' Processing Subsidiary:'+registeredSubsidiary											
										},
										options: {
										enableSourcing: true,
										ignoreMandatoryFields : true
										}
									}); 
								}

						}
						else  /// inter company transaction
						{
							var interIntra= 1;
							sisterLabVidId= i_sis_labVidId;//createVIDforSisterLab(testWiseInvRecId,customerId,processingLoc,23424,amount,'3',sisterLabSegInter,processingOrg,currentVidId,s_inv_tran_date,i_inv_posting_period,i_process_cent_unit,i_process_SBU);
							log.debug('sisterLabVidId Entry',sisterLabVidId);
							
							var customerDetails = searchCustomer(registerOrg,processingOrg,interIntra,customerId);
							if(customerDetails)
							{
								var vendorId=customerDetails[0].getValue('custrecord_interco_vendor');
								if(vendorId)
								{
									var tdsAmount=Number(amount);
									tdsAmount=(tdsPercentage/100) * tdsAmount;
									arTDS=tdsEntryBook(testWiseInvRecId,tdsAmount,processingSubsidiary,customerId,arDebitAcc,arCreditAcc,processingOrg,sisterLabSegInter,currentVidId,s_inv_tran_date,i_inv_posting_period,i_tds_section_code,i_process_cent_unit,i_process_SBU);
									log.debug('arTDS Booking Id',arTDS);

									vendorBillId=createVendorInv(testWiseInvRecId,vendorId,vendorAcc,amount,registerOrg,sisterLabSegInter,currentVidId,s_inv_tran_date,i_inv_posting_period,i_vid_unit,i_vid_SBU);
									log.debug('vendor Bill Booking Id',vendorBillId);

									var tdsAmount=Number(amount);
									tdsAmount=(tdsPercentage/100)*tdsAmount;
									apTDS=tdsEntryBook(testWiseInvRecId,tdsAmount,registeredSubsidiary,vendorId,apDebitAcc,apCreditAcc,registerOrg,sisterLabSegInter,currentVidId,s_inv_tran_date,i_inv_posting_period,i_tds_section_code,i_vid_unit,i_vid_SBU);
									log.debug('apTDS Booking Id',apTDS);

									if(sisterLabVidId && arTDS && vendorBillId && apTDS)
									{
										//nlapiSubmitField('customrecord_mhl_invoice_testwise_detail',testWiseInvRecId,['custrecord_processed_inter_intra','custrecord_sister_lab_vid','custrecord_ar_tds','custrecord_ap_tds','custrecord_vendor_bill'],['T',sisterLabVidId,arTDS,apTDS,vendorBillId]);
										var id = record.submitFields({
													type : 'customrecord_mhl_invoice_testwise_detail',
													id : testWiseInvRecId,
													values : {
														custrecord_processed_inter_intra : 'T',
														custrecord_sister_lab_vid : sisterLabVidId, 
														custrecord_ar_tds:arTDS, 
														custrecord_ap_tds:apTDS,
														custrecord_vendor_bill:vendorBillId,
														custrecord_mhl_error_detail : ''
													},
													options: {
													enableSourcing: true,
													ignoreMandatoryFields : true
													}
												});   
									
									}
									else
									{
										log.debug('inter company transaction','Deleting record');

										
										if(vendorBillId)
										{											
											record.delete({
												   type: record.Type.VENDOR_BILL,
												   id: vendorBillId,
												});
										}
										if(arTDS)
										{											
											record.delete({
												   type: 'customtransaction_mhl_intercotdsentry',
												   id: arTDS,
												});
										}
										if(apTDS)
										{											
											record.delete({
												   type: 'customtransaction_mhl_intercotdsentry',
												   id: apTDS,
												});
										}
									}
								}//End vendorId
								else
								{
									var id = record.submitFields({
										type : 'customrecord_mhl_invoice_testwise_detail',
										id : testWiseInvRecId,
										values : {
											custrecord_mhl_error_detail : 'Vendor not found for Customer Id:'+customerId											
										},
										options: {
										enableSourcing: true,
										ignoreMandatoryFields : true
										}
									});
								}
							}//End customerDetails
							else{
								var id = record.submitFields({
										type : 'customrecord_mhl_invoice_testwise_detail',
										id : testWiseInvRecId,
										values : {
											custrecord_mhl_error_detail : 'Vendor not found for Customer Id:'+customerId											
										},
										options: {
										enableSourcing: true,
										ignoreMandatoryFields : true
										}
									});
							}
						}
					}
					
				}//End if(customerDetails)
				
			}// End if(registerOrg!=processingOrg)
			
		}//End Try
		catch (ex) 
		{
		    log.error({ title: 'map: error in creating records', details: ex }); 
					
		}
	}//End MAP Stage

	function searchCustomer(registerLoc,processingLoc,interIntra,customerId) {		
		

		var customerSearch = search.create({
			type: 'customrecord_mhl_inter_intra_co_mapping',
			columns: ['custrecord_inter_intra_type','custrecord_interco_vendor','custrecord_mhl_im_processing_customer',
			'custrecord_registered_subsidiary','custrecord_processing_subsidiary','custrecord_mhl_elimination_location'],
			filters: [['custrecord_mhl_im_registration_location', 'anyOf', registerLoc],'AND',['custrecord_mhl_im_processing_location','anyOf',processingLoc],'AND',['custrecord_inter_intra_type','anyOf',interIntra],'AND',['custrecord_mhl_im_processing_customer','anyOf',customerId]]
		
		});

		var searchResult = customerSearch.run().getRange({
			start: 0,
			end: 1
		});
		//log.debug({title:'searchResult 124',details:searchResult});

		if(searchResult.length>0)
		{
			
			return searchResult;
		}
		return '';
		
	}
	
	function searchElimination_loc(registeredSubsidiary,processingSubsidiary,interIntra)
	{
		var customerSearch = search.create({
			type: 'customrecord_mhl_inter_intra_co_mapping',
			columns: ['custrecord_inter_intra_type','custrecord_interco_vendor','custrecord_mhl_im_processing_customer',
			'custrecord_registered_subsidiary','custrecord_processing_subsidiary','custrecord_mhl_elimination_location'],
			filters: [['custrecord_registered_subsidiary', 'anyOf', registeredSubsidiary],'AND',['custrecord_processing_subsidiary','anyOf',processingSubsidiary],'AND',['custrecord_inter_intra_type','anyOf',interIntra]]
		
		});

		var searchResult = customerSearch.run().getRange({
			start: 0,
			end: 1
		});
		//log.debug({title:'searchResult 124',details:searchResult});

		if(searchResult.length>0)
		{
			
			return searchResult;
		}
		return '';
	}
	
	///////////////////////////// Rate Master for Co-pay ///////////////////////////////////////////////////////////////////////////////////

	function searchItemRate(customerId,item,processingLoc)
	{		
		try
		{	
			
			if(customerId && item && processingLoc)
			{
				var customerArray=[];
				var itemArray=[];
				var procLocArray=[];

				customerArray.push(customerId);
				itemArray.push(item);
				procLocArray.push(processingLoc);
				var rateSearch = search.create({
					type: 'customrecord_mhl_rate_master',
					columns: ['custrecord_mhl_rm_net_rate'],
					filters: [['custrecord_mhl_rm_test_code', 'is', item],'AND',
					['custrecord_mhl_rm_customer','anyOf',customerArray],'AND',
					['custrecord_mhl_rm_org_name','is',processingLoc]]
				});

				var searchResult = rateSearch.run().getRange({
					start: 0,
					end: 1
				});

				if(searchResult.length>0)
				{
					return searchResult[0].getValue({name:'custrecord_mhl_rm_net_rate'});				
				}
			}
			return '';
			

		}
		catch(e)
		{
			log.debug({title:'error in price search',details:e});
		}
		
	} //End item rate search

	
function createVIDforSisterLab(testWiseInvRecId,intraCoCustomer,processingLoc,sisterLabItem,amount,interIntra,revenuSegment,processingLocOrg,vidId,s_inv_tran_date,i_inv_posting_period,i_process_cent_unit,i_process_SBU)
{
	try
	{
		
		log.debug('sister lab VID amount',amount);
		var vidRecord = record.create({
									type: record.Type.INVOICE,
									isDynamic: true
								});
			vidRecord.setValue({
				fieldId: 'entity',
				value: intraCoCustomer
			});
			log.debug('intraCoCustomer',intraCoCustomer);
		//var orgDetailsArray=nlapiLookupField('location',processingLocOrg,['custrecord_mhl_ref_sbu','cseg_mhl_custseg_un'],false);
		
		//var sbu=orgDetailsArray['custrecord_mhl_ref_sbu'];
		//var unit=orgDetailsArray['cseg_mhl_custseg_un'];
		//,i_process_cent_unit,i_process_SBU
		vidRecord.setValue({fieldId:'trandate',value:s_inv_tran_date});
		vidRecord.setValue({fieldId:'postingperiod',value:i_inv_posting_period});
		
		vidRecord.setValue({fieldId:'location',value:processingLocOrg});
		vidRecord.setValue({fieldId:'class',value:i_process_SBU});
		vidRecord.setValue({fieldId:'custbody_mhl_invoice_type',value:interIntra}); // Intra company
		vidRecord.setValue({fieldId:'department',value:revenuSegment}); // Sister Lab segment company
		vidRecord.setValue({fieldId:'cseg_mhl_custseg_un',value:i_process_cent_unit}); // Sister Lab segment company

		vidRecord.selectNewLine({sublistId:'item'});
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'item' , value:sisterLabItem});//, value: itemArray[i].TestCode });
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'price', value: -1 }); // Setting Custom price level
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'quantity', value: '1' });
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'rate',value: amount});
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'custcol_mhl_inv_processing_location', value:processingLoc});
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'location', value:processingLocOrg});
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'class', value:i_process_SBU});
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'department', value:revenuSegment});
		vidRecord.setCurrentSublistValue({sublistId:'item', fieldId:'cseg_mhl_custseg_un', value:i_process_cent_unit});


		vidRecord.commitLine({sublistId:'item'});

		vidRecord.setValue({fieldId:'custbody_mhl_vid_ref_inter_intra_sale',value:vidId});
		//CR@ 3 Nov 2020
		vidRecord.setValue({fieldId:'custbody_mhl_inter_co_auto_transaction',value:true});
		
		var i_sis_lab_vidId = vidRecord.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});
		
		return i_sis_lab_vidId;
	}
	catch(e)
	{
		log.debug('Error in createVIDforSisterLab',e);
		record.submitFields({
							type : 'customrecord_mhl_invoice_testwise_detail',
							id : testWiseInvRecId,
							values : {
								custrecord_mhl_error_detail : 'Error in createVIDforSisterLab: '+e											
							},
							options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
							}
						});  
	}
}// End createVIDforSisterLab function



function costBooking(testWiseInvRecId,subsidiary,intraCoCustomer,registeredLoc,debitAcc,creditAcc,amount,vidId,processingLoc,segment,s_inv_tran_date,i_inv_posting_period,i_vid_unit,i_process_cent_unit,i_vid_SBU,i_process_SBU)
{
	try
	{
		var costRecord = record.create({
									type: 'customtransaction_mhl_intra_costbkg',
									isDynamic: true
								});
								
		costRecord.setValue({fieldId: 'subsidiary',	value: subsidiary});		
		costRecord.setValue({fieldId:'custbody_mhl_vid_ref_inter_intra_sale',value: vidId});
		costRecord.setValue({fieldId:'trandate',value: s_inv_tran_date});
		costRecord.setValue({fieldId:'postingperiod',value: i_inv_posting_period});
		
		//var regSbu=nlapiLookupField('location',registeredLoc,'custrecord_mhl_ref_sbu',false);		
		//var processSbu=nlapiLookupField('location',processingLoc,'custrecord_mhl_ref_sbu',false);

		//var regorgDetailsArray=nlapiLookupField('location',registeredLoc,['custrecord_mhl_ref_sbu','cseg_mhl_custseg_un'],false);
		//var procorgDetailsArray=nlapiLookupField('location',processingLoc,['custrecord_mhl_ref_sbu','cseg_mhl_custseg_un'],false);

		//var regSbu=regorgDetailsArray['custrecord_mhl_ref_sbu'];
		//var processSbu=procorgDetailsArray['custrecord_mhl_ref_sbu'];

		//var unitReg=regorgDetailsArray['cseg_mhl_custseg_un'];
		//var unitProc=procorgDetailsArray['cseg_mhl_custseg_un'];

		//i_vid_unit,i_process_cent_unit,i_vid_SBU,i_process_SBU
		log.debug('costBooking amount', amount);
		// Debit entry		
		costRecord.selectNewLine({sublistId:'line'});
		costRecord.setCurrentSublistValue({sublistId:'line',  fieldId:'account' , value:debitAcc});
		costRecord.setCurrentSublistValue({sublistId:'line',  fieldId:'debit',  value:amount });
		costRecord.setCurrentSublistValue({sublistId:'line',  fieldId:'entity', value:intraCoCustomer});
		costRecord.setCurrentSublistValue({sublistId:'line',  fieldId:'location',  value:registeredLoc});
		costRecord.setCurrentSublistValue({sublistId:'line',  fieldId:'department',  value:segment});
		costRecord.setCurrentSublistValue({sublistId:'line',  fieldId:'class',  value:i_vid_SBU});
		costRecord.setCurrentSublistValue({sublistId:'line', fieldId:'cseg_mhl_custseg_un', value:i_vid_unit }); 


		costRecord.commitLine({sublistId:'line'});


		// Credit Entry

		costRecord.selectNewLine({sublistId:'line'});
		costRecord.setCurrentSublistValue({sublistId:'line',  fieldId:'account' ,value: creditAcc});
		costRecord.setCurrentSublistValue({sublistId: 'line', fieldId: 'credit', value: amount });
		costRecord.setCurrentSublistValue({sublistId:'line', fieldId:'entity', value:intraCoCustomer});
		costRecord.setCurrentSublistValue({sublistId: 'line', fieldId: 'location', value: processingLoc});
		costRecord.setCurrentSublistValue({sublistId: 'line',  fieldId:'department', value: segment});
		costRecord.setCurrentSublistValue({sublistId: 'line', fieldId: 'class', value: i_process_SBU});
		costRecord.setCurrentSublistValue({sublistId:'line', fieldId:'cseg_mhl_custseg_un',value: i_process_cent_unit }); 

		costRecord.commitLine({sublistId:'line'});
		//CR@ 3 Nov 2020
		costRecord.setValue({fieldId:'custbody_mhl_inter_co_auto_transaction',value:true});		
		
		var costBookId = costRecord.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});
		return costBookId;
	}catch(e)
	{
		log.debug('Error in Cost Booking',e);
		record.submitFields({
							type : 'customrecord_mhl_invoice_testwise_detail',
							id : testWiseInvRecId,
							values : {
								custrecord_mhl_error_detail : 'Error in Cost Booking: '+e											
							},
							options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
							}
						}); 
	}
}//End costBooking


function paymentApply(testWiseInvRecId,invoiceId,costBookingId,processingOrg,s_inv_tran_date,i_inv_posting_period)
{
	try
	{
		var paymentObj = record.transform({
						 fromType: record.Type.INVOICE,
						 fromId: Number(invoiceId),
						 toType: record.Type.CUSTOMER_PAYMENT,
						 isDynamic: true
					 });
			
		var flag=0;
		paymentObj.setValue({fieldId:'trandate',value:s_inv_tran_date});
		paymentObj.setValue({fieldId:'postingperiod',value:i_inv_posting_period});
		paymentObj.setValue({fieldId:'location',value:processingOrg});
		
		/*paymentObj.setValue({fieldId:'apply_Transaction_TRANDATE',value:s_inv_tran_date});
		
		var i_applyCount=paymentObj.getLineCount({sublistId:'apply'});		
		log.debug('payment i_applyCount',i_applyCount);
		
		
		//search the invoice is applied or not
		var i_line_inv = paymentObj.findSublistLineWithValue({
				sublistId: 'apply',
				fieldId: 'internalid',
				value: Number(invoiceId)
			});
		log.debug('payment i_line_inv',i_line_inv);
		
		for(var inv=0;inv<i_applyCount;inv++)
		{
			paymentObj.selectLine({
							 sublistId: 'apply',
							 line: inv
						 });
			 var i_applyInvId = paymentObj.getCurrentSublistValue({
				 sublistId: 'apply',
				 fieldId: 'internalid'
			 });
			 log.debug('payment i_applyInvId',i_applyInvId);
			 if(i_applyInvId == invoiceId)
			 {
				 log.debug('payment match','match');
				paymentObj.setCurrentSublistValue({
								 sublistId: 'apply',
								 fieldId: 'apply',
								 value: true
							 });
			   
				paymentObj.commitLine({sublistId:'apply'});
				break;
			 }
		}*/
		//log.debug('1 f_payment_amount',f_payment_amount)
		
		var creditCount=paymentObj.getLineCount({sublistId:'credit'});
		
		for(var t=0;t<creditCount;t++)
		{			
			paymentObj.selectLine({
							 sublistId: 'credit',
							 line: t
						 });
			 var costId = paymentObj.getCurrentSublistValue({
				 sublistId: 'credit',
				 fieldId: 'internalid'
			 });
			//log.debug('payment-->costId',costId);
			//log.debug('payment-->costBookingId',costBookingId);
			if(costId==costBookingId)
			{
				//log.debug('payment-->costId',costId);
				//log.debug('payment-->costBookingId',costBookingId);
				
				 paymentObj.setCurrentSublistValue({
								 sublistId: 'credit',
								 fieldId: 'apply',
								 value: true
							 });
			   
				paymentObj.commitLine({sublistId:'credit'});				
				flag=1;
			}
		}
		if(flag==1)
		{
			//CR@ 3 Nov 2020
			paymentObj.setValue({fieldId:'custbody_mhl_inter_co_auto_transaction',value:true});	
			var f_payment_amount = paymentObj.getValue({fieldId:'payment'});
		//log.debug('2 f_payment_amount',f_payment_amount)
			var paymentId = paymentObj.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});
			log.debug('Credit Applied to Payment',paymentId);
			return paymentId;
		}
		else
		{
			log.debug('apply payment','Credit Not found');
			/*record.submitFields({
							type : 'customrecord_mhl_invoice_testwise_detail',
							id : testWiseInvRecId,
							values : {
								custrecord_mhl_error_detail : 'Applying payment Credit Not found'											
							},
							options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
							}
						}); */
			return '';
		}

	}
	catch(e)
	{
		log.debug('On Payment creation Error occured',e);
		record.submitFields({
							type : 'customrecord_mhl_invoice_testwise_detail',
							id : testWiseInvRecId,
							values : {
								custrecord_mhl_error_detail : 'On Payment creation Error occured: '+e											
							},
							options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
							}
						}); 
	}
}// End paymentApply


/// ////////////////////////Elimination Booking Entry ///////////////////////////////////

function eliminationBooking(testWiseInvRecId,subsidiary,department,eliminationLoc,debitAcc,creditAcc,amount,vidId,registerLoc,processingLoc,s_inv_tran_date,i_inv_posting_period,i_elmination_unit,i_elmination_SBU)
{
	try
	{
		//var regOrgDetailsArray=nlapiLookupField('location',registerLoc,['custrecord_mhl_ref_sbu','cseg_mhl_custseg_un'],false);
		//var processingOrgDetailsArray=nlapiLookupField('location',processingLoc,['custrecord_mhl_ref_sbu','cseg_mhl_custseg_un'],false);

		//////////////// Case 1 ///////////////////////////////////
		//var sbu='';
		//var unit='';

		//if(processingOrgDetailsArray['cseg_mhl_custseg_un']==regOrgDetailsArray['custrecord_mhl_ref_sbu'])
		//{
		//	unit=processingOrgDetailsArray['cseg_mhl_custseg_un'];
		//}

		//if(regOrgDetailsArray['custrecord_mhl_ref_sbu'] == processingOrgDetailsArray['custrecord_mhl_ref_sbu'])
		//{
		//	sbu=regOrgDetailsArray['custrecord_mhl_ref_sbu'];
		//}


		/////////////// Case 2 ///////////////////////////////////////

		//if(regOrgDetailsArray['custrecord_mhl_ref_sbu'] != processingOrgDetailsArray['custrecord_mhl_ref_sbu'])
		//{
		//	sbu='15'; ///////// Elimination SBU
		//}

		var elimination = record.create({
									type: 'customtransaction_mhl_interintra_elimina',
									isDynamic: true
								});
								
		elimination.setValue({fieldId: 'trandate',	value: s_inv_tran_date});	
		
		elimination.setValue({fieldId:'postingperiod',value:i_inv_posting_period});
		elimination.setValue({fieldId:'subsidiary',value:subsidiary});
		elimination.setValue({fieldId:'location',value:eliminationLoc});
		elimination.setValue({fieldId:'department',value:department}); // Sister Lab revenue segment

		elimination.setValue({fieldId:'custbody_mhl_vid_ref_inter_intra_sale',value:vidId});

		// Debit entry
		elimination.selectNewLine({sublistId:'line'});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'account' , value:debitAcc});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'debit',  value:amount });
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'location' , value:eliminationLoc});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'department' , value:department});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'class' , value:i_elmination_SBU});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'cseg_mhl_custseg_un', value:i_elmination_unit }); 

		elimination.commitLine({sublistId:'line'});

		// Credit Entry

		elimination.selectNewLine({sublistId:'line'});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'account' , value:creditAcc});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'credit',  value:amount });
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'location' , value:eliminationLoc});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'department' , value:department});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'class' , value:i_elmination_SBU});
		elimination.setCurrentSublistValue({sublistId:'line', fieldId:'cseg_mhl_custseg_un', value:i_elmination_unit }); 

		elimination.commitLine({sublistId:'line'});
		//CR@ 3 Nov 2020
		elimination.setValue({fieldId:'custbody_mhl_inter_co_auto_transaction',value:true});
		var eliminationId=elimination.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});
		log.debug('elimination Booking Entry Created',eliminationId);
		return eliminationId;
	}catch(e)
	{
		log.debug('Elimination Booking Entry Error',e);
		record.submitFields({
							type : 'customrecord_mhl_invoice_testwise_detail',
							id : testWiseInvRecId,
							values : {
								custrecord_mhl_error_detail : 'Elimination Booking Entry Error: '+e											
							},
							options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
							}
						}); 
	}
}



function tdsEntryBook(testWiseInvRecId,amount,subsidiary,entityId,debitAcc,creditAcc,org,segment,vidId,s_inv_tran_date,i_inv_posting_period,i_tds_section_code,i_process_cent_unit,i_process_SBU)
{
	try
	{
		//nlapiLogExecution('DEBUG','tdsEntryBook amount',amount);
		//var orgDetailsArray=nlapiLookupField('location',org,['custrecord_mhl_ref_sbu','cseg_mhl_custseg_un'],false);
		//var sbu=orgDetailsArray['custrecord_mhl_ref_sbu'];
		//var unit=orgDetailsArray['cseg_mhl_custseg_un'];
		
		//,i_process_cent_unit,i_process_SBU
		//var tdsEntry=nlapiCreateRecord('customtransaction_mhl_intercotdsentry');
		
		var tdsEntry = record.create({
									type: 'customtransaction_mhl_intercotdsentry',
									isDynamic: true
								});
								
		tdsEntry.setValue({fieldId: 'trandate',	value: s_inv_tran_date});
		
		tdsEntry.setValue({fieldId: 'postingperiod',value:i_inv_posting_period});
		//tdsEntry.setValue({fieldId: 'custbody_mhl_tds_period',value:112});			
		
				
		tdsEntry.setValue({fieldId: 'subsidiary',value:subsidiary});
		
		// Debit entry
		tdsEntry.selectNewLine({sublistId:'line'});
		tdsEntry.setCurrentSublistValue({sublistId:'line',fieldId:'account',value:debitAcc});
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'debit', value:parseFloat(amount).toFixed(2)});
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'entity', value:entityId });
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'location',value: org });
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'department', value:segment }); 
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'class', value:i_process_SBU }); 
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'cseg_mhl_custseg_un',value: i_process_cent_unit }); 
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'custcol_in_scode_tds',value: i_tds_section_code }); 


		tdsEntry.commitLine({sublistId:'line'});

		// Credit Entry

		tdsEntry.selectNewLine({sublistId:'line'});
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'account' ,value: creditAcc});
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'credit', value:parseFloat(amount).toFixed(2) });
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'entity', value:entityId});
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'location', value:org }); 
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'department', value:segment }); 
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'class', value:i_process_SBU }); 
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'cseg_mhl_custseg_un', value:i_process_cent_unit }); 
		tdsEntry.setCurrentSublistValue({sublistId:'line', fieldId:'custcol_in_scode_tds', value:i_tds_section_code }); 

		tdsEntry.commitLine({sublistId:'line'});

		tdsEntry.setValue({fieldId:'custbody_mhl_vid_ref_inter_intra_sale',value:vidId});
		//CR@ 3 Nov 2020
		tdsEntry.setValue({fieldId:'custbody_mhl_inter_co_auto_transaction',value:true});	
		
		var tdsEntryId=tdsEntry.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});
		log.debug('TDS Entry',tdsEntryId);
		return tdsEntryId;


	}catch(e)
	{
		log.debug('Error in TDS Entry',e);
		record.submitFields({
							type : 'customrecord_mhl_invoice_testwise_detail',
							id : testWiseInvRecId,
							values : {
								custrecord_mhl_error_detail : 'Error in TDS Entry: '+e											
							},
							options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
							}
						}); 
	}
}

function createVendorInv(testWiseInvRecId,vendorId,account,amount,org,sisterLabSegInter,vidId,s_inv_tran_date,i_inv_posting_period,i_vid_unit,i_vid_SBU)
{
	try
	{
		//var orgDetailsArray=nlapiLookupField('location',org,['custrecord_mhl_ref_sbu','cseg_mhl_custseg_un'],false);
		//var sbu=orgDetailsArray['custrecord_mhl_ref_sbu'];
		//var unit=orgDetailsArray['cseg_mhl_custseg_un'];
		//i_vid_unit,i_vid_SBU
		var vendorBill = record.create({
									type: record.Type.VENDOR_BILL,
									isDynamic: true
								});
			vendorBill.setValue({
				fieldId: 'entity',
				value: vendorId
			});
			
			vendorBill.setValue({
				fieldId: 'customform',
				value: 203
			});
		
		vendorBill.setValue({fieldId:'trandate',value:s_inv_tran_date});
		vendorBill.setValue({fieldId:'postingperiod',value:i_inv_posting_period});
		vendorBill.setValue({fieldId:'location',value:org});
		vendorBill.setValue({fieldId:'department',value:sisterLabSegInter});
		vendorBill.setValue({fieldId:'class',value:i_vid_SBU});
		vendorBill.setValue({fieldId:'cseg_mhl_custseg_un',value:i_vid_unit});
		vendorBill.setValue({fieldId:'approvalstatus',value:2});
		
		vendorBill.selectNewLine({sublistId:'expense'});
		vendorBill.setCurrentSublistValue({sublistId:'expense',fieldId:'account',value:account});
		vendorBill.setCurrentSublistValue({sublistId:'expense', fieldId:'amount',value:amount});
		vendorBill.setCurrentSublistValue({sublistId:'expense', fieldId:'department', value:sisterLabSegInter }); // revenue segment
		vendorBill.setCurrentSublistValue({sublistId:'expense', fieldId:'location', value:org }); // Org
		vendorBill.setCurrentSublistValue({sublistId:'expense', fieldId:'class', value:i_vid_SBU }); // Org
		vendorBill.setCurrentSublistValue({sublistId:'expense', fieldId:'cseg_mhl_custseg_un', value:i_vid_unit }); // Org
		vendorBill.commitLine({sublistId:'expense'});
		
		vendorBill.setValue({fieldId:'custbody_mhl_vid_ref_inter_intra_sale',value:vidId});
		
		//CR@ 3 Nov 2020
		vendorBill.setValue({fieldId:'custbody_mhl_inter_co_auto_transaction',value:true});
		
		//var vendorBillId=nlapiSubmitRecord(vendorBill);
		
		var vendorBillId=vendorBill.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});
			
		log.debug('Vendor Bill Booking Entry Created',vendorBillId);
		return vendorBillId;
	}
	catch(e)
	{
		log.debug('Vendor Bill Booking Entry Error',e);
		record.submitFields({
							type : 'customrecord_mhl_invoice_testwise_detail',
							id : testWiseInvRecId,
							values : {
								custrecord_mhl_error_detail : 'Vendor Bill Booking Entry Error: '+e											
							},
							options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
							}
						}); 
	}
}

	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) 
	{
		try
		{
			var mapKeysProcessed = 0;
			summary.mapSummary.keys.iterator().each(function (key, executionCount, completionState){

				if (completionState === 'COMPLETE'){                              
					mapKeysProcessed++;
				}
				return true;
			});
			log.debug({
				title: 'Map key statistics', 
				details: 'Total number of map keys processed successfully: ' + mapKeysProcessed
			}); 	
		}//End Try
		catch(e)
		{
			log.debug({title:'Error Occured in Summary function',details:e});
		}	

	}// End Summary function	

	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize
	};

});