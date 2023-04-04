/**
 * Script Name:  MHL_YIL_MAP_B2B_Sister_Lab_VID_Test_Addition.js
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
   	* Author:Ganesh Sapakale & Avinash Lahane
	* Date: May 2022
	* Description: This script will Add test code on Sisterlab VID record.
 */
define(['N/file', 'N/format', 'N/record', 'N/search','N/runtime','./mhllib'],
		/**
		 * @param {file} file
		 * @param {format} format
		 * @param {record} record
		 * @param {search} search
		 * @param {transaction} transaction
		 */
		function(file, format, record, search,runtime,mhllib) {

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
			return search.load({
				id:'customsearch_mhl_b2b_sister_test_additio'
			});

		}catch(e)
		{
			createRnIRecord(e,'search Issue');
			log.debug({title:'Error Occured while collecting JSON for VID',details:e});
		}
	}


	function map(context) {
		try {

			var data = JSON.parse(context.value); //read the data
			//log.debug('data',data);
			var fileInternalId = data.id;
			var TranDate = data.values.created;

			var jsonFile=file.load({id:fileInternalId});
			var content=jsonFile.getContents();
			content=JSON.parse(content);
			//log.debug('Start','-------------------------------------');

			var invId=createVIDForJson(content,jsonFile.name,TranDate);
			log.audit('Invoice Created',invId);

			//log.debug('End','-------------------------------------');

			if(invId>0)
			{
				jsonFile.folder='168934';
				jsonFile.save();
			}
			else if(invId == '-168935')
			{
				jsonFile.folder='168935';
				jsonFile.save();
			}
		}
		catch (ex) {
			log.error({ title: 'map: error in creating records', details: ex }); 
			createRnIRecord(ex,jsonFile.name);	
			jsonFile.folder='168935';
			jsonFile.save();
		}
	}



	/////////////////////////////////////////////////////// Create Invoice /////////////////////////////////////////////////////////////

	function createVIDForJson(JSONfromRnI,fileName,TranDate)
	{
		try
		{
			var flag=0;
			if(JSONfromRnI.OrderInfo)
			{
				var tempArray=[];
				if(Array.isArray(JSONfromRnI.OrderInfo))
				{
					tempArray=JSONfromRnI.OrderInfo;
				}else
				{
					tempArray.push(JSONfromRnI.OrderInfo);
				}

				if(tempArray.length>0)
				{
					flag=0;
				}else
				{
					flag=1;
				}
			}else
			{
				flag=1;
			}

			var visitNumberToBeFound = JSONfromRnI.VisitInfo.VisitNumber;
			var invoiceRecId=searchInvoice(JSONfromRnI.DoFromVisitNumber);
			if(invoiceRecId)
			{
				var locationCenterDetails=mhllib.findCustomerLocation(JSONfromRnI.VisitInfo.locationCode);
				//log.debug('locationCenterDetails',locationCenterDetails);
				if(!locationCenterDetails.orgInternalId)
				{
					locationCenterDetails=mhllib.findLocation(JSONfromRnI.VisitInfo.LocationID);
				}
				
					var registeredOrg=locationCenterDetails.orgInternalId;//locationCenterDetails[0].getValue({name:'custrecord_mhl_loc_org'});
					var custSubsidiary='';
					var locationOrgId=locationCenterDetails.locationInternalId;//locationCenterDetails[0].getValue({name:'internalid'});

					//log.debug('Registered Org',registeredOrg);
					var locationDetails='';
					var custSubsidiary='';
					var vidUnit=locationCenterDetails.unit;
					var vidSbu=locationCenterDetails.sbu;


					/////////////// Search customer by cleint code and org id
					//log.debug('custSubsidiary',custSubsidiary);
					
					var customerDetails=searchCustomer(JSONfromRnI.VisitInfo.ClientCode,registeredOrg,custSubsidiary,JSONfromRnI.OrgID);
					
						var customerInternalId=customerDetails[0].id;
						var customerSegment=customerDetails[0].getText({name:'custentity_mhl_cus_revenue_segment'});
						var customerType=customerDetails[0].getText({name:'custentity_mhl_customer_payment_mode'});
						//log.debug('Client Internal Id',customerInternalId);
						//log.debug('Client Segment',customerSegment);

						if(customerSegment && customerSegment!='' && customerSegment!=' ')
						{

							var consolidatedItem='';
							var homeVisitItem=[];
							var homeVisitCharge=[];
							var totalVIDNet=0;
							/////////////////////// Search Consolidated Item by Org Name ////////////////////////////////
							consolidatedItem=searchItem(customerSegment);

							var tempArray=[];
							if(Array.isArray(JSONfromRnI.GeneralBillingInfo))
							{
								tempArray=JSONfromRnI.GeneralBillingInfo;
							}else
							{
								tempArray.push(JSONfromRnI.GeneralBillingInfo);
							}

							for(var gg in tempArray)
							{
								if(tempArray[gg].Code!='0' && tempArray[gg].Code)
								{
									homeVisitItem.push(searchItem(tempArray[gg].Code));
									homeVisitCharge.push(tempArray[gg].Amount);
									totalVIDNet=totalVIDNet+Number(tempArray[gg].Amount);
								}
							}
							//log.debug('homeVisitItem Item',homeVisitItem);

							if(consolidatedItem)
							{
								//log.debug('Consolidated Item',consolidatedItem);
								var vidNetAmount=Number(JSONfromRnI.Billinfo.NetAmount);

								var invoiceRecord = record.load({
									type: record.Type.INVOICE,
									id:invoiceRecId,
									isDynamic: true
								});

								// Setting Body field Values in below sections


								if(homeVisitItem.length>0)
								{
									for(var tt in homeVisitItem)
									{
										invoiceRecord.selectNewLine({sublistId: 'item'});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item' , value:homeVisitItem[tt]});//, value: itemArray[i].TestCode });
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: '-1' }); // Setting Custom price level
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: '1' });
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: homeVisitCharge[tt]});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: registeredOrg});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'cseg_mhl_custseg_un', value: vidUnit});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: vidSbu});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'cseg_mhl_locations', value: locationOrgId});

										//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: vidNetAmount});

										//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_mhl_inv_processing_location', value: collectionCenter});
										//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_processing_location_org', value: regLocationInternalId});

										invoiceRecord.commitLine({ sublistId: 'item'});
										
										//log.debug('Home Visit','Line saved '+homeVisitItem[tt]);

									}


									if(Number(vidNetAmount)>Number(totalVIDNet))
									{
										var tempDiff=Number(vidNetAmount)-Number(totalVIDNet);
										invoiceRecord.selectNewLine({sublistId: 'item'});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item' , value:consolidatedItem});//, value: itemArray[i].TestCode });
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: '-1' }); // Setting Custom price level
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: '1' });
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: tempDiff});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: registeredOrg});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'cseg_mhl_custseg_un', value: vidUnit});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: vidSbu});
										invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'cseg_mhl_locations', value: locationOrgId});

										//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: vidNetAmount});

										//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_mhl_inv_processing_location', value: collectionCenter});
										//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_processing_location_org', value: regLocationInternalId});

										invoiceRecord.commitLine({ sublistId: 'item'});
										//log.debug('Home Visit + consolidated','Line saved ');

									}

								}else
								{
									invoiceRecord.selectNewLine({sublistId: 'item'});
									invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item' , value:consolidatedItem});//, value: itemArray[i].TestCode });
									invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: '-1' }); // Setting Custom price level
									invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: '1' });
									invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: vidNetAmount});
									invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: registeredOrg});
									invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'cseg_mhl_custseg_un', value: vidUnit});
									invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: vidSbu});
									invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'cseg_mhl_locations', value: locationOrgId});

									//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: vidNetAmount});

									//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_mhl_inv_processing_location', value: collectionCenter});
									//invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_processing_location_org', value: regLocationInternalId});

									invoiceRecord.commitLine({ sublistId: 'item'});
									//log.debug('consolidated','Line saved ');

								}



								if (flag == 0) 
								{
									////////////////////////////// Individual test Add in custom record ////////////////////////////////////
									var testObject = {
										testCode: [],
										testInternalId: [],
										processingCenter: [],
										processingCenterId: [],
										processingCenterOrg: []
									}
									var testArray = [];
									if (Array.isArray(JSONfromRnI.SampleInfo)) {
										testArray = JSONfromRnI.SampleInfo;
									} else {
										testArray.push(JSONfromRnI.SampleInfo);
									}
									var a_item_line_data = []
									for (var te in testArray) {
										a_item_line_data[(testArray[te].TestCode).toString()]='';
										testObject.testCode.push((testArray[te].TestCode));
										testObject.processingCenter.push((testArray[te].ProcessingLocationID).toString());
									}
									//log.debug('testArray 417', JSON.stringify(testArray))
										// Added log validation 4 th Dec 2020 
									if (_logValidation(testArray)) {
										//testObject = updateInternalId(testObject,a_item_line_data);
										/////////////////////////////////// Create Custom record for each individual test //////////////////////////////////
										for (var testLine in testObject.testCode) {
											
											var i_item_internal_id = a_item_line_data[testObject.testCode[testLine]];
											invoiceRecord.selectNewLine({
												sublistId: 'recmachcustrecord_mhl_itd_vid'
											});
											//invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_ref_customer_rm',value:customerInternalId});
											/*invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_mhl_itd_test_code',
												value: testObject.testInternalId[testLine]
											});*/
											/* invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_code',value:i_item_internal_id}); */
											
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_code_string',value:testObject.testCode[testLine]});
											
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_name',value:testObject.testCode[testLine]});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_processing_center',
												value: testObject.processingCenterId[testLine]
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_processing_center_org',
												value: testObject.processingCenterOrg[testLine]
											});
											invoiceRecord.commitLine({
												sublistId: 'recmachcustrecord_mhl_itd_vid'
											});
											//log.debug('Test Code line ','Line saved ');
										}
									}
									// End
									//////////////// Add line for display item from order info  ////////////////////////////////////////////////////////////////////////
									var testObject = {
										testCode: [],
										testName: [],
										testInternalId: [],
										testNetAmt: [],
										testGross: [],
										testDiscount: [],
										processingCenter: [],
										processingCenterId: [],
										processingCenterOrg: []
									}
									var testArray = [];
									if (Array.isArray(JSONfromRnI.OrderInfo)) {
										testArray = JSONfromRnI.OrderInfo;
									} else {
										testArray.push(JSONfromRnI.OrderInfo);
									}
									var a_item_line_data = []
									for (var te in testArray) {
										
										a_item_line_data[(testArray[te].TestCode).toString()]='';
										
										testObject.testCode.push((testArray[te].TestCode).toString());
										testObject.testName.push((testArray[te].TestName).toString());
									if(testArray[te].NSNetAmount){
										testObject.testNetAmt.push(testArray[te].NSNetAmount);
									}
									else{
										testObject.testNetAmt.push(testArray[te].Amount);
									}
										testObject.testGross.push(testArray[te].MRP);
										testObject.testDiscount.push(testArray[te].DiscountAmount);
									}
									// Added log validatoin on 4th dec 2020 by Kailas
									if (_logValidation(testArray)) {
										//testObject = updateInternalId(testObject,a_item_line_data);
										/*for (var testLine in testObject.testCode) 
										{													
											var i_item_internal_id = a_item_line_data[testObject.testCode[testLine]]
											var tempObj = '';
											tempObj = searchItemRate(customerInternalId, i_item_internal_id, registeredOrg);
											invoiceRecord.selectNewLine({
												sublistId: 'recmachcustrecord_mhl_itd_vid'
											});
											
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_code',value:i_item_internal_id});
									
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_mhl_itd_test_name',
												value: testObject.testName[testLine]
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_mhl_itd_net_amt',
												value: testObject.testNetAmt[testLine]
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_mhl_itd_gross_amt',
												value: testObject.testGross[testLine]
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_mhl_itd_discount_amt',
												value: testObject.testDiscount[testLine]
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_for_print',
												value: true
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_mhl_copay_client_amount',
												value: tempObj.clientAmt
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_mhl_copay_patient_amount',
												value: tempObj.patientAmt
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_amount_in_customer_currency',
												value: tempObj.netRateInCurrecny
											});
											invoiceRecord.setCurrentSublistValue({
												sublistId: 'recmachcustrecord_mhl_itd_vid',
												fieldId: 'custrecord_customer_currency',
												value: tempObj.customerCurrency
											});
											invoiceRecord.commitLine({
												sublistId: 'recmachcustrecord_mhl_itd_vid'
											});
										}*/
										for(var testLine in testObject.testCode)
										{
											var s_gross_error = '';
											var tempObj='';
											 var i_item_internal_id = a_item_line_data[testObject.testCode[testLine]]
											/*if(_nullValidation(i_item_internal_id))
											{
												log.debug('Can Not Create VID','Item Not found for Test Code');
												createRnIRecord('Item Not found for Test Code '+testObject.testCode[testLine],fileName);
												return '-168935';
											} */
											//Search Rate Card Customers
											/*var i_rate_card = search_custmer_Rate_Card(customerInternalId,registeredOrg);	
											log.debug('i_rate_card',i_rate_card);
											var o_rate_card_data = '';											
											if(i_rate_card)
											{
												//Search Rate Card Test Details
												o_rate_card_data = search_rate_card_details(i_rate_card,i_item_internal_id)
												log.debug('o_rate_card_data.f_gross_Amt',o_rate_card_data.f_gross_Amt);
												if(_nullValidation(o_rate_card_data.f_gross_Amt))
												{
													//log.debug('Can Not Create VID','Rate Card Not Found');
													//createRnIRecord('Gross Rate Not Found For Customer '+JSONfromRnI.VisitInfo.ClientCode+' For Registered ORG Internal ID '+registeredOrg+' & Test Code '+testObject.testCode[testLine],fileName);
													//return '';
													var f_cluster_price = search_cluster_price(i_item_internal_id,registeredOrg);
													if(_nullValidation(f_cluster_price))
													{
														s_gross_error = 'Gross Rate Not Found For Customer '+JSONfromRnI.VisitInfo.ClientCode+' For Registered ORG Internal ID '+registeredOrg+' & Test Code '+testObject.testCode[testLine];
													}
													else{
														o_rate_card_data.f_gross_Amt = f_cluster_price;
													}	
												}
											}
											else
											{
												log.error('Can Not Create VID','Rate Card Not Found');
												createRnIRecord('Rate Card Not Found For Customer '+JSONfromRnI.VisitInfo.ClientCode+' For Registered ORG Internal ID '+registeredOrg+' & For VID '+JSONfromRnI.VisitInfo.VisitNumber,fileName);
												return '-168935';
												//var f_cluster_price = search_cluster_price(i_item_internal_id,registeredOrg);
												//if(_nullValidation(f_cluster_price))
												{
												//	s_gross_error = 'Rate Card Not Found For Customer '+JSONfromRnI.VisitInfo.ClientCode+' For Registered ORG Internal ID '+registeredOrg+' & For VID '+JSONfromRnI.VisitInfo.VisitNumber;
												}
												//else
												{
												//	o_rate_card_data.f_gross_Amt = f_cluster_price;
												}
											}*/
											
											tempObj=searchItemRate(customerInternalId,i_item_internal_id,registeredOrg);

											invoiceRecord.selectNewLine({sublistId:'recmachcustrecord_mhl_itd_vid'});
											//invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_ref_customer_rm',value:customerInternalId});
											//invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_code',value:testObject.testInternalId[testLine]});
											/* invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_code',value:i_item_internal_id}); */
											
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_code_string',value:testObject.testCode[testLine]});
											
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_name',value:testObject.testName[testLine]});
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_net_amt',value:testObject.testNetAmt[testLine]});

											
											//DiscountAmount calculation											
											var f_discount = 0.00;
											/*if(testObject.testNetAmt[testLine] && o_rate_card_data.f_gross_Amt)
											{
												if(Number(testObject.testNetAmt[testLine])< Number(o_rate_card_data.f_gross_Amt))
												{
													f_discount = Number(o_rate_card_data.f_gross_Amt) - Number(testObject.testNetAmt[testLine])
												}
												else
												{
													o_rate_card_data.f_gross_Amt = Number(testObject.testNetAmt[testLine]);	
												}
											}*/
											
											//invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_gross_amt',value:o_rate_card_data.f_gross_Amt});
											
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_discount_amt',value:f_discount});

											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_for_print',value:true});
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_copay_client_amount',value:tempObj.clientAmt});
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_copay_patient_amount',value:tempObj.patientAmt});

											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_amount_in_customer_currency',value:tempObj.netRateInCurrecny});
											invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_customer_currency',value:tempObj.customerCurrency});
											
											if(_logValidation(s_gross_error))
											{
												invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_error_detail_for_conso_in',value:s_gross_error});
											}
											else
											{
												invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_gross_amount_updated',value:true});
											}

											invoiceRecord.commitLine({sublistId:'recmachcustrecord_mhl_itd_vid'});
										}
									}
									// END
								}

								//////////////////////////////////////////// Payment Info from JSON ///////////////////////////////////////////////

								var paymentInfo=[];
								if(Array.isArray(JSONfromRnI.PaymentInfo))
								{
									paymentInfo=JSONfromRnI.PaymentInfo;
								}else
								{
									paymentInfo.push(JSONfromRnI.PaymentInfo);
								}

								var refNo='';
								var amountReceived=0;

								var subsidiary=invoiceRecord.getValue({fieldId:'subsidiary'});
								var customerId=invoiceRecord.getValue({fieldId:'entity'});
								var vidDate=invoiceRecord.getValue({fieldId:'trandate'});
								var vidNumber=invoiceRecord.getValue({fieldId:'custbody_mhl_invoice_vid_number'});
								var orgVal=invoiceRecord.getValue({fieldId:'location'});
								var departmentVal=invoiceRecord.getValue({fieldId:'department'});
								var classmentVal=invoiceRecord.getValue({fieldId:'class'});
								var unitVal=invoiceRecord.getValue({fieldId:'cseg_mhl_custseg_un'});
								//invoiceRecord.setValue({fieldId:'custbody_attune_vid',value:true});
								var invoiceId=invoiceRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
								var s_subsidiary=invoiceRecord.getText({fieldId:'subsidiary'});

								log.debug('Invoice Created',invoiceId);
								
								for(var pay in paymentInfo)
								{
									var payMode=paymentInfo[pay].PaymentMode;


									if(payMode!='0' && payMode!='1')
									{
										if(subsidiary == 'IN' || s_subsidiary == 'India')
										{
											paymentRecord(subsidiary,invoiceId,customerId,Number(paymentInfo[pay].AmountReceived),vidDate,paymentInfo[pay],payMode,vidNumber,orgVal,departmentVal,classmentVal,unitVal);								
										}
									}
								}


								return invoiceId;

							}else
							{
								log.debug('Can Not Create VID','Revenue Item not found for segment '+customerSegment);
								createRnIRecord('Revenue Item not found for segment '+customerSegment+' For VID '+JSONfromRnI.VisitInfo.VisitNumber,fileName);
								return '-168935';

							}	
						}else
						{
							log.error('Revenue Segment missing For Client '+JSONfromRnI.VisitInfo.ClientCode,'Revenue Segment Missing on client master for VID '+visitNumberToBeFound);
							createRnIRecord('Test Missing in VID JSON '+JSONfromRnI.VisitInfo.VisitNumber,fileName);
							return '-168935';
						}

					
				
			}else
			{
				var i_B2B_VID = checkBvid(JSONfromRnI.DoFromVisitNumber)
				if(i_B2B_VID){
					var o_vidObj = record.load({
							type: 'customrecord_b2b_vid_details',
							id: i_B2B_VID,
							isDynamic: true

							});
							log.debug('o_vidObj',o_vidObj);
							var customerID = o_vidObj.getValue({fieldId: "custrecord_clientname"});
							log.debug("customerID",customerID);
							var soStatus = o_vidObj.getValue({fieldId: "custrecord_mhl_b2b_so_status"});
							log.debug("soStatus",soStatus);
							
							if(soStatus == 'Sales Order:Billed'){
								log.error("SO billing cycle Is closed");
                                return "-168935";
							}
						else
						{
							var custObj = record.load({
                            type: record.Type.CUSTOMER,
                            id: customerID,
                            isDynamic: true,
                        });

                        var custType = custObj.getValue('custentity_mhl_cust_client_type');
                        log.debug("custType", custType);
						var PaymentMode = custObj.getValue('custentity_mhl_customer_payment_mode');
						//if (PaymentMode != 1) 
						{  ////B2B nd 

										var a_item_line_data = []
										var a_testCode_rate = [];
										var testObject = {
											testCode: [],
											testName: [],
											testInternalId: [],
											testNetAmt: [],
											testGross: [],
											testDiscount: [],
											processingCenter: [],
											processingCenterId: [],
											processingCenterCode: [],
											processingCenterOrg: []
										}

										var testArray = [];
										if (Array.isArray(JSONfromRnI.OrderInfo)) {
											testArray = JSONfromRnI.OrderInfo;
										} else {
											testArray.push(JSONfromRnI.OrderInfo);
										}

										for (var te in testArray) {
											a_item_line_data[(testArray[te].TestCode).toString()] = '';

											a_testCode_rate[(testArray[te].TestCode).toString()] = '';

											testObject.testCode.push((testArray[te].TestCode));
											testObject.testName.push((testArray[te].TestName).toString());
										if(testArray[te].NSNetAmount){
											testObject.testNetAmt.push(testArray[te].NSNetAmount);
										}
										else{
											testObject.testNetAmt.push(testArray[te].Amount);
										}
											testObject.testGross.push(testArray[te].MRP);
											testObject.testDiscount.push(testArray[te].DiscountAmount);
										}
										//var testArray = [];
										if (Array.isArray(JSONfromRnI.SampleInfo)) {
											testArray = JSONfromRnI.SampleInfo;
										} else {
											testArray.push(JSONfromRnI.SampleInfo);
										}

										for (var te in testArray) {
											a_item_line_data[(testArray[te].TestCode).toString()] = '';
											//testObject.testCode.push((testArray[te].TestCode));
											testObject.processingCenter.push((testArray[te].ProcessingLocationID).toString());

											if (testArray[te].ProcessingLocationCode) {
												// This code is added by Ganesh, get new Process Location code from JSON file . : 25-08-2021
												testObject.processingCenterCode.push((testArray[te].ProcessingLocationCode).toString());
											} else {
												log.error("Processing Location Code", "ProcessingLocationCode not found for " + JSONfromRnI.VisitInfo.VisitNumber);
												createRnIRecord("Processing Location Code not found for " + JSONfromRnI.VisitInfo.VisitNumber, fileName);
												//return '-356151';
											}

										}

										//testObject = updateInternalId(testObject, a_item_line_data);

										


										for (var testLine in testObject.testCode) {
											var i_item_internal_id = a_item_line_data[testObject.testCode[testLine]];

											if (testObject.testCode[testLine] && testObject.testNetAmt[testLine]) {
												
												var n_qty = 1;
												var n_price = testObject.testNetAmt[testLine];
												
	
												/* o_vidObj.selectNewLine({
													sublistId: 'recmachcustrecord_reference_b2b'
												}); */
												
												var o_testCodeObj=record.create({
												type: 'customrecord_b2b_vid_test_details'
												}); //customrecord_b2b_vid_test_details
											 
												
												
												/* o_testCodeObj.setValue({
													fieldId: 'custrecord_test_code',
													value: testObject.testInternalId[testLine]
												}); */
												
												o_testCodeObj.setValue({
													fieldId: 'custrecord_test_code_json',
													value: testObject.testCode[testLine]
												});
												
												o_testCodeObj.setValue({
													fieldId: 'custrecord_reference_b2b',
													value: i_B2B_VID
												});
												
												o_testCodeObj.setValue({
													fieldId: 'externalid',
													value: "test_code_"+visitNumberToBeFound+"_"+testObject.testCode[testLine]
												});
												

												o_testCodeObj.setValue({
													fieldId: 'custrecord_testname',
													value: testObject.testName[testLine]
												});
												o_testCodeObj.setValue({
													fieldId: 'custrecord_netamount',
													value: testObject.testNetAmt[testLine]
												});
												
												o_testCodeObj.setValue({
													fieldId: 'custrecord_grossamount',
													value: testObject.testGross[testLine]
												});
												
												o_testCodeObj.setValue({
													fieldId: 'custrecord_addition',
													value: true
												});
												
												var discountAmount=parseFloat(testObject.testGross[testLine]) - parseFloat(testObject.testNetAmt[testLine]);
												o_testCodeObj.setValue({
													fieldId: 'custrecord_discount',
													value: discountAmount
												});
												
												//invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_reference_b2b',fieldId:'custrecord_mhl_itd_net_amt',value:f_net_amt});
												o_testCodeObj.setValue({
													fieldId: 'custrecord_mhl_processing_center',
													value: testObject.processingCenterId[testLine]
												});
												o_testCodeObj.setValue({
													fieldId: 'custrecord_mhl_processing_center_org',
													value: testObject.processingCenterOrg[testLine]
												});
												/*  o_vidObj.commitLine({
													sublistId: 'recmachcustrecord_reference_b2b'
												}); */
												
										 var o_patientId = o_testCodeObj.save({
											enableSourcing: true,
											ignoreMandatoryFields: true
										}); 
										
											}
										}
										
										var o_RecUpdate = record.load({
											type: 'customrecord_b2b_vid_details',
											id: i_B2B_VID,
											isDynamic: true
										});
										 var count = o_RecUpdate.getLineCount({sublistId:'recmachcustrecord_reference_b2b'});
										 log.debug("count",count);
										 var total =0;
										 for(var i = 0; i < count; i++ ){
											var netAmount=o_RecUpdate.getSublistValue({
												sublistId: 'recmachcustrecord_reference_b2b',
												fieldId: 'custrecord_netamount',
												line:i
											});
											log.debug("netAmount",netAmount);
											var isCancelled=o_RecUpdate.getSublistValue({
												sublistId: 'recmachcustrecord_reference_b2b',
												fieldId: 'custrecord_cancelled',
												line:i
											});	
											log.debug("isCancelled",isCancelled);
											if(isCancelled == false){
												total+=parseInt(netAmount);
											}
											log.debug("total",total);
										 }
											var totalAmt = o_RecUpdate.setValue({fieldId:'custrecord_b2b_vid_amount',value:total});
											
											var RecUpdateAmount = o_RecUpdate.save({
												enableSourcing: true,
												ignoreMandatoryFields: true
											});
							
										return i_B2B_VID;
				}
						}
			}else
			{
				log.error('VID number Not Found','Not present in NetSuite');
				createRnIRecord('VID Number Not found '+JSONfromRnI.VisitInfo.VisitNumber,fileName);
				return '-168935';
			}	
			}			
		}catch(inve)
		{
			log.error({title:'Error Occured while creating Invoice',details:inve});
			createRnIRecord('Error Occured for For VID '+JSONfromRnI.VisitInfo.VisitNumber+' details '+JSON.stringify(inve),fileName);
			return '-168935';
		}
	}

	function checkBvid(vid)
			{
				try
				{
					var vidPresent;
					var customrecord_b2b_vid_detailsSearchObj = search.create({
					   type: "customrecord_b2b_vid_details",
					   filters:
					   [
						  ["name","is",vid+"_S"],
						  "AND", 
						  ["custrecord_mhl_b2b_is_sis_lab","is","T"]
					   ],
					   columns:
					   [
						  search.createColumn({
							 name: "name",
							 sort: search.Sort.ASC,
							 label: "Name"
						  }),
						  search.createColumn({name: "scriptid", label: "Script ID"}),
						  search.createColumn({name: "internalid", label: "Internal ID"})
					   ]
					});
					var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
					//log.debug("customrecord_b2b_vid_detailsSearchObj result count",searchResultCount);
					customrecord_b2b_vid_detailsSearchObj.run().each(function(result){
					   // .run().each has a limit of 4,000 results
					   vidPresent = result.getValue('internalid');
					   log.debug('vidPresent',vidPresent);
					   return true;
					});
					
					return vidPresent;
				}
				catch(e)
				{
					log.error("checkBvid | errror",e)
				}
			}
	
	
	function searchInvoice(vid)
	{
		//log.debug({title:'vid ',details:vid});
		var vidSearch = search.create({
			type: search.Type.INVOICE,
			columns: ['internalid','custbody_mhl_inv_payment_mode','entity','location','department'],
			filters: [['custbody_mhl_invoice_vid_number','is',vid+"_S"],'AND',['mainline','is','T']]
		});

		var invResultSet = vidSearch.run();

		var invResultRange = invResultSet.getRange({
			start: 0,
			end: 1
		});
		//log.debug({title:'invResultRange ',details:invResultRange});

		if(invResultRange.length>0)
		{
			//log.debug({title:'Tranid found ',details:invResultRange[0]});
			return invResultRange[0].getValue({name:'internalid'});
		}else
		{
			return '';
		}
	}

	
	function search_cluster_price(itemInternalId,registeredOrg)
	{
		
		var rateSearch = search.create({
				type: 'customrecord_mhl_test_master_cluster_pri',
				columns: ['custrecord_mhl_cluster_price'],
				filters: [['isinactive', 'is', 'F'],'AND',['custrecord_mhl_test_code_cluster','is',itemInternalId],'AND',['custrecord_mhl_org_name_cluster1','is',registeredOrg]]
			});

			var searchResult = rateSearch.run().getRange({
				start: 0,
				end: 1
			});
			var i_cluster_price = '';
			if(searchResult.length>0)
			{
				log.debug({title:'cluster rec id',details:searchResult[0].id});
				i_cluster_price =searchResult[0].getValue({name:'custrecord_mhl_cluster_price'});
			}
			
			return i_cluster_price;
	}
	
//////////////////////////////////////////////Update Internal Id //////////////////////////////////////////////////////////
	function updateInternalId(testObject,a_item_line_data) 
	{
		///////////////////// Item Search ////////////////////////////////////////////
		//log.debug({title:'Item ID',details:testObject.testCode });
		var filterString = [];
		var testArray = [];
		var filterArray = [];
		for (var t in testObject.testCode) {
			var temp = testObject.testCode[t];
			if (t == 0) {
				filterArray.push('itemid');
				filterArray.push('is');
				filterArray.push(temp);
				testArray.push(filterArray);
				filterArray = [];
			} else {
				testArray.push('OR');
				filterArray.push('itemid');
				filterArray.push('is');
				filterArray.push(temp);
				testArray.push(filterArray);
				filterArray = [];
			}
		}
		filterString.push(testArray);
		log.debug({
			title: 'filterString',
			details: filterString
		});
		var itemSearch = search.create({
			type: search.Type.ITEM,
			columns: ['internalid','itemid'],
			filters: filterString
		});
		//log.debug({title:'itemSearch',details:itemSearch});
		if (CheckValidOrNot(itemSearch)) {
			var itemSearchResult = itemSearch.run().getRange({
				start: 0,
				end: 100
			});
			//log.debug({title:'itemSearchResult',details:itemSearchResult});
			if (itemSearchResult.length > 0) {
				var tempArray = [];
				for (var k in itemSearchResult) {
					tempArray.push(itemSearchResult[k].id);
					a_item_line_data[itemSearchResult[k].getValue({name:'itemid'})]= itemSearchResult[k].id;
				}
				testObject.testInternalId = tempArray;
			}
			///////////////////////////////// Processing Collection center search //////////////////////////////////////
			if (testObject.processingCenter.length > 0) {
				for (var t in testObject.processingCenter) {
					var locationObj = mhllib.findLocation(testObject.processingCenter[t]);
					if (locationObj.locationInternalId) {
						testObject.processingCenterId.push(locationObj.locationInternalId);
						testObject.processingCenterOrg.push(locationObj.orgInternalId);
					}
				}
			}
			return testObject;
		}
	}
//////////////////////////////////Search Collection Center //////////////////////////////////////////////////

	function searchLocationCenter(locationCenterId)
	{

		locationCenterId=locationCenterId.toString();
		/*var valArray=[];
		valArray.push(locationCenterId);*/
		//log.debug({title:'Location Center Id',details:locationCenterId});

		var internalIdSearch = search.create({
			type: 'customrecord_cseg_mhl_locations',
			columns: ['internalid','custrecord_mhl_loc_org','custrecord_mhl_location_id'],
			filters: [['custrecord_mhl_location_id', 'is', locationCenterId]]
		});

		var searchResult = internalIdSearch.run().getRange({
			start: 0,
			end: 1
		});

		if(searchResult.length>0)
		{
			//log.debug({title:'Org Search',details:JSON.stringify(searchResult[0].getValue({name:'custrecord_mhl_loc_org'}))});
			//log.debug({title:'Location Center Id',details:JSON.stringify(searchResult[0].getValue({name:'internalid'}))});

			return searchResult;
		}
		return '';

	}


	function searchItem(segmentName) {
		segmentName=segmentName.toString();
		var internalIdSearch = search.create({
			type: search.Type.SERVICE_ITEM,
			columns: ['internalid'],
			filters: [['itemid', 'is', segmentName]]
		});

		var searchResult = internalIdSearch.run().getRange({
			start: 0,
			end: 1
		});

		if(searchResult.length>0)
		{
			return searchResult[0].getValue({name:'internalid'});
		}
		return '';
	}


//////////////////////////////////////////////////////Location Search //////////////////////////////////////////////////////////

	function searchByExternalIdLoc(externalId) {
		externalId=externalId.toString();
		//log.debug({title:'Location External Id',details:externalId});

		var internalIdSearch = search.create({
			type: search.Type.LOCATION,
			columns: ['internalid'],
			filters: [['custrecord_mhl_mds_lims_org_id', 'is', externalId] ]
		});

		var searchResult = internalIdSearch.run().getRange({
			start: 0,
			end: 1
		});
		//log.debug({title:'searchResult 101',details:searchResult});

		if(searchResult.length>0)
		{
			return searchResult[0].id;
		}
		return 0;
	}

/////////////////////////////////////////////////////////// Customer Search /////////////////////////////////////////////////////////

	function searchCustomer(clientCode,org,custSubsidiary,limsOrgId) {
		clientCode=clientCode.toString();

		if(clientCode=='GENERAL')
		{
			clientCode=clientCode+limsOrgId;
		}
		//log.debug({title:'Client ID',details:clientCode});

		var internalIdSearch = search.create({
			type: search.Type.CUSTOMER,
			columns: ['internalid','custentity_mhl_cus_revenue_segment','custentity_mhl_customer_payment_mode'],
			filters: [['entityid', 'is', clientCode],'AND',['custentity_mhl_extended_to_org','is',org]]

		//filters: [['custentity_mhl_cust_code_old', 'is', clientCode],'AND',['msesubsidiary.name','contains',custSubsidiary]]
		});

		var searchResult = internalIdSearch.run().getRange({
			start: 0,
			end: 1
		});
		//log.debug({title:'searchResult 124',details:searchResult});

		if(searchResult.length>0)
		{
			return searchResult;
		}else
		{
			////// Find Customer with OLD code
			//log.debug({title:'Finding Customer with Old Code'});
			var internalIdSearch = search.create({
				type: search.Type.CUSTOMER,
				columns: ['internalid','custentity_mhl_cus_revenue_segment','custentity_mhl_customer_payment_mode'],
				filters: [['custentity_mhl_old_code_ref_migration', 'is', clientCode],'AND',['custentity_mhl_extended_to_org','is',org]]

			//filters: [['custentity_mhl_cust_code_old', 'is', clientCode],'AND',['msesubsidiary.name','contains',custSubsidiary]]
			});

			var searchResult = internalIdSearch.run().getRange({
				start: 0,
				end: 1
			});
			//log.debug({title:'searchResult 124',details:searchResult});

			if(searchResult.length>0)
			{
				return searchResult;
			}

		}
		return null;
	}


///////////////////////////////////////////////////////// Search Item ///////////////////////////////////////////////////////////////


	function searchByItemId(itemId) {
		itemId=itemId.toString();
		//log.debug({title:'Item ID',details:itemId});

		var internalIdSearch = search.create({
			type: search.Type.ITEM,
			columns: ['internalid'],
			filters: [['itemid', 'is', itemId]]
		});

		var searchResult = internalIdSearch.run().getRange({
			start: 0,
			end: 1
		});
		//log.debug({title:'searchResult 147',details:searchResult});

		if(searchResult.length>0)
		{
			return searchResult[0].id;
		}
		return null;
	}

/////////////////////////////////////////////// Create Error Record ////////////////////////////////////////////////////////
	function createRnIRecord(e,fileName)
	{
		var rnIRec=record.create({
			type:'customrecord_rni_integration_status'
		});

		rnIRec.setValue({fieldId:'custrecord_json_type',value:'4'});
		rnIRec.setValue({fieldId:'custrecord_error_description',value:e.toString()});
		rnIRec.setValue({fieldId:'custrecord_json_file',value:fileName});
		rnIRec.setValue({fieldId:'custrecord_processed',value:'2'});
        rnIRec.setValue({fieldId:'custrecord_attune_vid_record',value:true});

		rnIRec.save();
	}

	function search_custmer_Rate_Card(customerInternalId,registeredOrg)
	{
		
		var rateSearch = search.create({
				type: 'customrecord_mhl_rc_mapped_customers',
				columns: ['custrecord_mhl_cust_rate_card'],
				filters: [['custrecord_mhl_rcc_base_rate', 'is', 'T'],'AND',['isinactive', 'is', 'F'],'AND',['custrecord_mhl_rate_card_cust_applied','is',customerInternalId],'AND',['custrecord_mhl_rcc_org_name','is',registeredOrg]]
			});

			var searchResult = rateSearch.run().getRange({
				start: 0,
				end: 1
			});
			var i_rate_card_search = '';
			if(searchResult.length>0)
			{
				//log.debug({title:'Customer rate card mapping',details:searchResult[0].getValue({name:'custrecord_mhl_rm_net_rate'})});
				i_rate_card_search =searchResult[0].getValue({name:'custrecord_mhl_cust_rate_card'});
			}
			
			return i_rate_card_search;
	}

	function search_rate_card_details(i_rate_card,i_item_internal_id)
	{
		var rateCard_Amt={
				f_gross_Amt:''				
		};
		try
		{
			
			var rateSearch = search.create({
				type: 'customrecord_mhl_rate_card_test_details',
				columns: ['custrecord_mhl_rc_net_rate'],
				filters: [['custrecord_mhl_rc_rate_card_ref', 'anyOf', i_rate_card],'AND',['custrecord_mhl_rc_test_code','anyOf',i_item_internal_id]]
			});

			var searchResult = rateSearch.run().getRange({
				start: 0,
				end: 1
			});

			if(searchResult.length>0)
			{
				//log.debug({title:'Net Rate',details:searchResult[0].getValue({name:'custrecord_mhl_rm_net_rate'})});
				rateCard_Amt.f_gross_Amt=searchResult[0].getValue({name:'custrecord_mhl_rc_net_rate'});				
				return rateCard_Amt
			}

		}
		catch(e)
		{
			log.debug({title:'search_rate_card_details',details:e});
		}
		return rateCard_Amt;
	}
///////////////////////////// Rate Master for Co-pay ///////////////////////////////////////////////////////////////////////////////////

	function searchItemRate(customerId,item,processingLoc)
	{
		var coPayAmt={
				clientAmt:'',
				patientAmt:'',
				customerCurrency:'',
				netRateInCurrecny:'',
		};
		try
		{
			//log.debug({title:'customerId',details:customerId});
			//log.debug({title:'item',details:item});
			//log.debug({title:'processingLoc',details:processingLoc});

			var rateSearch = search.create({
				type: 'customrecord_mhl_rate_master',
				columns: ['custrecord_mhl_rm_net_rate','custrecord_mhl_rm_cppatientamt','custrecord_mhl_rm_cpclientamt','custrecord_mhl_net_rate_customer_currenc','custrecord_mhl_customer_currency_name'],
				filters: [['custrecord_mhl_rm_test_code', 'is', item],'AND',['custrecord_mhl_rm_customer','is',customerId],'AND',['custrecord_mhl_rm_org_name','is',processingLoc]]
			});

			var searchResult = rateSearch.run().getRange({
				start: 0,
				end: 1
			});

			if(searchResult.length>0)
			{
				//log.debug({title:'Net Rate',details:searchResult[0].getValue({name:'custrecord_mhl_rm_net_rate'})});
				coPayAmt.clientAmt=searchResult[0].getValue({name:'custrecord_mhl_rm_cpclientamt'});
				coPayAmt.patientAmt=searchResult[0].getValue({name:'custrecord_mhl_rm_cppatientamt'});
				coPayAmt.customerCurrency=searchResult[0].getValue({name:'custrecord_mhl_customer_currency_name'});
				coPayAmt.netRateInCurrecny=searchResult[0].getValue({name:'custrecord_mhl_net_rate_customer_currenc'});

				return coPayAmt
			}

		}catch(e)
		{
			log.debug({title:'error in price search',details:e});
		}
		return coPayAmt;
	}


	Date.prototype.addHours = function(h){

		this.setHours(this.getHours()+h);

		return this;

	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {


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
		}catch(e)
		{
			log.debug({title:'Error Occured in Summary function',details:e});
		}	

	}

	///////////////////////////////////////////////////////////


	function paymentRecord(subsidiary,recId,customerId,amountReceived,vidDate,tranRefNo,paymentMode,vidNumber,orgVal,departmentVal,classmentVal,unitVal) 
	{
		try
		{

			var creditControlAcc='4530';

			log.debug('amountReceived',amountReceived);

			var customerType=search.lookupFields({
				type: search.Type.CUSTOMER,
				id: customerId,
				columns: ['custentity_mhl_customer_payment_mode','custentity_current_deposit']
			});
			//log.debug('customerType',customerType);

			if((customerType.custentity_mhl_customer_payment_mode[0].text=='Cash' || customerType.custentity_mhl_customer_payment_mode[0].text=='Co-payment' )&& amountReceived>0 && tranRefNo)
			{

				var paymentRecord = record.transform({
					fromType: record.Type.INVOICE,
					fromId: recId,
					toType: record.Type.CUSTOMER_PAYMENT,
					isDynamic: false,
				});


				var location=orgVal;

				var account='';
				if(paymentMode)
					{
						var accountSearch = search.create({
							type: 'customrecord_payment_account_mapping',
							columns: ['custrecord_payment_account'],
							filters: [['custrecord_payment_subsidiary','is',subsidiary],'AND',['custrecord_payment_org','is',location],'AND',["custrecord_map_paymentmode","is",paymentMode],'AND',["isinactive","is","F"]]
						});
					}
					else
					{
						var accountSearch = search.create({
							type: 'customrecord_payment_account_mapping',
							columns: ['custrecord_payment_account'],
							filters: [['custrecord_payment_subsidiary','is',subsidiary],'AND',['custrecord_payment_org','is',location],'AND',["isinactive","is","F"]]
						});						
					}


				var searchResult = accountSearch.run().getRange({
					start: 0,
					end: 100
				});

				if(searchResult)
				{
					account=searchResult[0].getValue({name:'custrecord_payment_account'});
				}

				paymentRecord.setValue({fieldId:'custbody_mhl_invoice_vid_number',value:vidNumber});

				paymentRecord.setValue({fieldId:'location',value:orgVal});
				paymentRecord.setValue({fieldId:'department',value:departmentVal});
				paymentRecord.setValue({fieldId:'class',value:classmentVal});
				paymentRecord.setValue({fieldId:'cseg_mhl_custseg_un',value:unitVal}); 
				paymentRecord.setValue({fieldId:'trandate',value:vidDate});


				if(account)
				{
					paymentRecord.setValue({fieldId:'undepfunds',value:'F'});
					paymentRecord.setValue({fieldId:'account',value:account});
                  paymentRecord.setValue({fieldId:'ccapproved',value:true});
				}

				if(paymentMode=='3') // Card payment
				{

					paymentRecord.setValue({fieldId:'paymentmethod',value:2});
					
					paymentRecord.setValue({fieldId:'account',value:creditControlAcc});
					paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

				}

				if(paymentMode=='2') // Cheque
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:3});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}

				}

				if(paymentMode=='13' || paymentMode=='32' || paymentMode=='34') // NEFT/RTGS
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:7});
					paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});
				}

				if(paymentMode=='12') // M swipe
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:9});
					paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});
				}
				if(paymentMode=='10') // Coupne
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:10});
					paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});
				}

				if(paymentMode=='4') // DD
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:12});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}

				}
				
				if(paymentMode=='5') // UPI
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:13});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}

				}
				
				if(paymentMode=='6') // CNP
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:14});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}

				}
				
				if(paymentMode=='7') // wallet
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:15});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}

				}
				
				if(paymentMode=='8') // Amex
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:16});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}
				}
				
				if(paymentMode=='9') // DINERS
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:17});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}
				}
				
				if(paymentMode=='11') // Credit Note
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:18});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}
				}
				
				if(paymentMode=='28') // Credit Note
				{
					paymentRecord.setValue({fieldId:'paymentmethod',value:19});
					if(tranRefNo.ChequeorCardNumber)
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.ChequeorCardNumber});

					}else
					{
						paymentRecord.setValue({fieldId:'memo',value:tranRefNo.transactionId});

					}
				}

				var paymentLineCnt=paymentRecord.getLineCount({sublistId:'apply'});
				for(var t=0;t<paymentLineCnt;t++)
				{
					var applyedInv=paymentRecord.getSublistValue({sublistId:'apply',fieldId:'apply',line:t});
					if(applyedInv)
					{
						paymentRecord.setSublistValue({sublistId:'apply',fieldId:'amount',line:t,value:Number(amountReceived)});
					}
				}
				var paymentId=paymentRecord.save();
				log.debug('payment id new',paymentId);


			}
		}
		catch (e){
			log.error('Error Details in payment',e);
		}
	}
	
		
	//////////////////////////////////////////////////////////

	function _logValidation(value){
		if (value != null && value != undefined && value != '' && value != 'undefined') {
			return true;
		}
		else {
			return false;
		}
		
	}

	function _nullValidation(val){
		if (val == null || val == undefined || val == '') {
			return true;
		}
		else {
			return false;
		}
		
	}
	function CheckValidOrNot(value) {
	if ((value != null) && (value != '') && (value != undefined) && (value.toString() != 'NaN')) {
		return true;
	} else {
		return false;
	}
}

	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize
	};

});