/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL Part Payment Processor
 * File Name: MHL Part Payment & Bank Deposit Processor.js
 * Created On: 15/07/2020
 * Modified On:
 * Created By: Onkar Sanjekar
 * Modified By:
 * Description: This scheduler will process part payment JSON
 *********************************************************** */

define(['N/file', 'N/format', 'N/record', 'N/runtime', 'N/search'],

		function(file, format, record, runtime, search) 
		{

	function getInputData() 
	{
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var deploymentId=scriptObj.deploymentId;
			log.debug('Deployment Id: ' + deploymentId);

			return search.load({
				id:'customsearch_payment_json_search'
			});

		}catch(e)
		{
			log.debug({title:'Error Occured While Retriving Data',details:e});
		}

	}

	/**
	 * Executes when the map entry point is triggered and applies to each key/value pair.
	 *
	 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
	 * @since 2015.1
	 */
	function map(context) {

		try {

			var scriptObj = runtime.getCurrentScript();
			var defaultAccount='4530';//scriptObj.getParameter({name: 'custscript_account_for_payment'});

			var data = JSON.parse(context.value); //read the data
			var fileInternalId = data.id;
			var tranDate=data.values.created;
			var jsonFile=file.load({id:fileInternalId});
			var content=jsonFile.getContents();
			content=JSON.parse(content);
			var scriptObj = runtime.getCurrentScript();
			var deploymentId=scriptObj.deploymentId;
			log.debug('Deployment Id: ' + deploymentId);
			var paymentId=processPartPayment(content,jsonFile,jsonFile.name,tranDate);

		}
		catch (ex) { log.error({ title: 'map: error in creating records', details: ex }); }

	}

////////////////////////////////Start of Payment Record Creation function ///////////////////////////////////////////////////////

	function processPartPayment(JSONfromRnI,jsonFile,fileName,tranDate)
	{
		try
		{

			var invDetFilter = [];
			var tempArray=[];
			if(Array.isArray(JSONfromRnI.DueInfo))
			{
				tempArray=JSONfromRnI.DueInfo;
			}else
			{
				tempArray.push(JSONfromRnI.DueInfo);
			}

			var runtimeObject = runtime.getCurrentScript();
			//var creditControlAcc=runtimeObject.getParameter({name: 'custscript_credit_control_account'});

			for(var t in tempArray)
			{
				var tempJsonPart=tempArray[t];

				var paymentMode=tempJsonPart.PaymentMode;
				//log.debug({title:creditControlAcc,details:'creditControlAcc'});
				log.debug({title:'paymentMode',details:paymentMode});
				
				
				 

				if(paymentMode!=1)
				{
					var invNumber=JSONfromRnI.VisitNumber;
					log.debug({title:'Invoice Number',details:invNumber});
					
					// code updated for Filter of Search on 1 Sept As CMS is getting error custbody_mhl_invoice_vid_number for invalid operator
					invDetFilter.push(search.createFilter({
                        name: 'mainline',
                        operator: search.Operator.IS,
                        values: 'T'
                    }));
					var invNumber = invNumber.trim();
					
					if(invNumber)
					{
						 invDetFilter.push(search.createFilter({
		                        name: 'custbody_mhl_invoice_vid_number',
		                        operator: search.Operator.IS,
		                        values: invNumber
		                    }));
					}
					else
					{
						log.error('Invoice number not found for Search criteria');
					}                   
                    

					var invoiceSearch = search.create({
						type: search.Type.INVOICE,
						columns: ['internalid','entity','tranid','location','cseg_mhl_custseg_un','department','cseg_mhl_locations','class','subsidiary'],
						filters: invDetFilter     
					});
					//[['custbody_mhl_invoice_vid_number', 'is', invNumber],'and',['mainline','is','T'] ]
					
					//log.debug("invDetFilter",JSON.stringify(invDetFilter))
					var invResultSet = invoiceSearch.run();

					var invResultRange = invResultSet.getRange({
						start: 0,
						end: 2
					});
					
					
					//log.debug("invResultRange",JSON.stringify(invResultRange))
					log.debug("invResultRange.length",invResultRange.length)
					if(invResultRange.length>0)
					{
						var paymentRecord = record.create({
							type: record.Type.CUSTOMER_PAYMENT,
							isDynamic: true,
							defaultValues: {
								entity: invResultRange[0].getValue({name:'entity'})
							} 
						});

						var recInvNumber=invResultRange[0].getValue({name:'tranid'});
						var subsidiary=invResultRange[0].getValue({name:'subsidiary'});
						var i_location=invResultRange[0].getValue({name:'location'});
						log.debug({title:'Customer '+recInvNumber,details:invResultRange[0].getValue({name:'entity'})});
						
						
					 if (paymentMode) {
							var accountSearch = search.create({
								type: 'customrecord_payment_account_mapping',
								columns: ['custrecord_payment_account'],
								filters: [
									['custrecord_payment_subsidiary', 'is', subsidiary], 'AND', ['custrecord_payment_org', 'is', i_location], 'AND', ["custrecord_map_paymentmode", "is", paymentMode], 'AND', ["isinactive", "is", "F"]
								]
							});
						} else {
							var accountSearch = search.create({
								type: 'customrecord_payment_account_mapping',
								columns: ['custrecord_payment_account'],
								filters: [
									['custrecord_payment_subsidiary', 'is', subsidiary], 'AND', ['custrecord_payment_org', 'is', i_location], 'AND', ["isinactive", "is", "F"]
								]
							});
						}
						var newAccount = '';
						var searchResult = accountSearch.run().getRange({
								start: 0,
								end: 100
							});
							log.debug("seanrch ", JSON.stringify(searchResult));
							if (searchResult) {
								if (searchResult.length > 0) {
									newAccount = searchResult[0].getValue({
										name: 'custrecord_payment_account'
									});
								}
							}
							log.debug("newAccount",newAccount)
						var org=invResultRange[0].getValue({name:'location'});
						var unit=invResultRange[0].getValue({name:'cseg_mhl_custseg_un'});
						var depart=invResultRange[0].getValue({name:'department'});
						var location=invResultRange[0].getValue({name:'cseg_mhl_locations'});
						var sbu=invResultRange[0].getValue({name:'class'});


						paymentRecord.setValue({fieldId:'location',value:org});
						paymentRecord.setValue({fieldId:'cseg_mhl_custseg_un',value:unit});
						paymentRecord.setValue({fieldId:'department',value:depart});
						paymentRecord.setValue({fieldId:'cseg_mhl_locations',value:location});
						paymentRecord.setValue({fieldId:'class',value:sbu});

						paymentRecord.setValue({fieldId:'custbody_mhl_invoice_vid_number',value:invNumber});
						paymentRecord.setValue({fieldId:'custbody_rni_date',value:tranDate});

						paymentRecord.setValue({fieldId:'ccapproved',value:true});

					if (paymentMode){
						var customrecord_mhl_payment_mode_mappingSearchObj = search.create({
						   type: "customrecord_mhl_payment_mode_mapping",
						   filters:
						   [
							  ["custrecord_other_sys_payment_id","is",paymentMode]
						   ],
						   columns:
						   [
							  search.createColumn({name: "custrecord_payment_mode_name", label: "Payment Name"}),
							  search.createColumn({name: "custrecord_netsuite_payment_mode_id", label: "Netsuite Payment Mode ID"}),
							  search.createColumn({name: "custrecord_other_sys_payment_id", label: "Other System Payment Mode ID"})
						   ]
						});
						var searchResultCount = customrecord_mhl_payment_mode_mappingSearchObj.runPaged().count;
						log.debug("customrecord_mhl_payment_mode_mappingSearchObj result count",searchResultCount);
						customrecord_mhl_payment_mode_mappingSearchObj.run().each(function(result){
						   // .run().each has a limit of 4,000 results
						   
						   var i_paymemtMode = result.getValue({name: "custrecord_netsuite_payment_mode_id"});
								paymentRecord.setValue({fieldId:'paymentmethod',value:i_paymemtMode});
								
							if(paymentMode=='3') // Card payment
							{
								paymentRecord.setValue({fieldId:'account',value:newAccount});
							}
							if(tempJsonPart.ChequeorCardNumber)
							{
								paymentRecord.setValue({fieldId:'memo',value:tempJsonPart.ChequeorCardNumber});
							}
							else
							{
								paymentRecord.setValue({fieldId:'memo',value:tempJsonPart.transactionId});
							}
							
						   return true;
						}); 
					}

						paymentRecord.setValue({fieldId:'payment',value:Number(tempJsonPart.AmountReceived)});
						paymentRecord.setValue({fieldId:'autoapply',value:false});
						//paymentRecord.setValue({fieldId:'memo',value:tempJsonPart.transactionId});



						var applyLineCount=paymentRecord.getLineCount({sublistId:'apply'});
						for(var i=0;i<applyLineCount;i++)
						{
							paymentRecord.selectLine({sublistId : "apply",line : i});

							var invNumber=paymentRecord.getCurrentSublistValue({sublistId:'apply',fieldId:'refnum',line:i});
							if(recInvNumber==invNumber)
							{
								// Set Amount on payment record from JSON send by R&I.
								var amountToSet=Number(tempJsonPart.AmountReceived);
								paymentRecord.setValue({fieldId:'payment',value:amountToSet});
								log.debug({title:'amountToSet '+amountToSet,details:'Line '+i});

								paymentRecord.setCurrentSublistValue({sublistId:'apply',fieldId:'amount',value:amountToSet});
								paymentRecord.setCurrentSublistValue({sublistId:'apply',fieldId:'apply',value:true});
								paymentRecord.commitLine({sublistId : "apply"});
								break;
							}
						}

						var paymentRecordId = paymentRecord.save({ enableSourcing: true,ignoreMandatoryFields: true});
						log.debug({title:'Payment Record Created for '+invNumber,details:'Payment Record ID'+paymentRecordId});

						if(paymentRecordId)
						{
							jsonFile.folder='703';
							jsonFile.save();
						}else
						{
							jsonFile.folder='704';
							jsonFile.save();
						}
					}else
					{
						log.debug({title:'VID Not Found'});
					}
				}else
				{
					jsonFile.folder='703';
					jsonFile.save();
					log.debug({title:paymentMode});

				}
			}


		}catch(pp)
		{
			log.debug({title:'Error Occured while processing JSON for Part Payment',details:pp});
			jsonFile.folder='704';
			jsonFile.save();

			createRnIRecord(pp,fileName);
		}
		return '';
	}

////////////////////////////////End of Payment Record creation function ///////////////////////////////////////////////////////

	function searchInvoice(vidArray)
	{
		log.debug({title:'vidArray ',details:vidArray});

		var stringArray=[];
		for(var r in vidArray)
		{
			stringArray.push(vidArray[r].toString());
		}
		log.debug({title:'stringArray ',details:stringArray});

		var vidSearch = search.create({
			type: search.Type.INVOICE,
			columns: ['tranid','entity'],
			filters: [['custbody_mhl_invoice_vid_number', 'any', stringArray],'and',['mainline','is','T'] ]
		});
		var invoiceId=[];
		var invResultSet = vidSearch.run();

		var invResultRange = invResultSet.getRange({
			start: 0,
			end: 1000
		});

		for(var t in invResultRange)
		{
			log.debug({title:'invoiceId ',details:invResultRange[t]});

			invoiceId.push(invResultRange[t].getValue({name:'tranid'}));

		}
		log.debug({title:'invoiceId ',details:invoiceId});

		return invoiceId;
	}

/////////////////////////////////////////////////////////////////////////////////////////////////

	function createRnIRecord(e,fileName)
	{
		var rnIRec=record.create({
			type:'customrecord_rni_integration_status'
		});

		rnIRec.setValue({fieldId:'custrecord_json_type',value:'2'});
		rnIRec.setValue({fieldId:'custrecord_error_description',value:e.toString()});
		rnIRec.setValue({fieldId:'custrecord_json_file',value:fileName});
		rnIRec.setValue({fieldId:'custrecord_processed',value:'2'});
		rnIRec.save();
	}


	/////////////////////////////////////////////////// Bank deposit file processor //////////////////////////////////////////////

	function processBankDeposit(fileJson,defaultAccount)
	{
		try
		{
			var JSONObj=fileJson;

			for(var g in JSONObj.requestObject.vidTansactions)
			{
				var invNumber=JSONObj.requestObject.vidTansactions[g].vid;
				log.debug({title:invNumber,details:'VID Number'});

				var invoiceSearch = search.create({
					type: search.Type.INVOICE,
					columns: ['internalid','entity'],
					filters: [['custbody_mhl_invoice_vid_number', 'is', invNumber.toString()],'and',['mainline','is','T'] ]
				});

				var invResultSet = invoiceSearch.run();

				var invResultRange = invResultSet.getRange({
					start: 0,
					end: 1
				});
				log.debug({title:'Customer ',details:invResultRange[0].getValue({name:'entity'})});


				if(invResultRange[0].id)
				{
					var paymentRecord = record.transform({
						fromType: record.Type.INVOICE,
						fromId: invResultRange[0].id,
						toType: record.Type.CUSTOMER_PAYMENT,
						isDynamic: true
					});

					paymentRecord.setValue({fieldId:'paymentmethod',value:1}); // Cash mode
					var applyLineCount=paymentRecord.getLineCount({sublistId:'apply'});
					for(var i=0;i<applyLineCount;i++)
					{
						var invNumber=paymentRecord.getSublistValue({sublistId:'apply',fieldId:'internalid',line:i});
						if(invResultRange[0].id==invNumber)
						{
							// Set Amount on payment record from JSON send by R&I.
							var amountToSet=Number(JSONObj.requestObject.vidTansactions[g].amount);
							paymentRecord.setValue({fieldId:'payment',value:amountToSet});
							paymentRecord.selectLine({sublistId : "apply",line : i});
							paymentRecord.setCurrentSublistValue({sublistId:'apply',fieldId:'amount',value:amountToSet});
							paymentRecord.setCurrentSublistValue({sublistId:'apply',fieldId:'apply',value:true});
							paymentRecord.commitLine({sublistId : "apply"});
							break;
						}
					}

					var paymentRecordId = paymentRecord.save({ enableSourcing: true,ignoreMandatoryFields: true});
					log.debug({title:'Payment Record Created for '+invNumber,details:'Payment Record ID'+paymentRecordId});
					return paymentRecordId;
				}

			}

			return '';
		}catch(pp)
		{
			log.debug({'title':'Error Occured while processing JSON for Part Payment','details':pp});

			var errorRec = record.create({
				type: 'customrecord_rni_integration_status',
				isDynamic: true
			});
			errorRec.setValue({
				fieldId: 'custrecord_json_type',
				value: 7 // Bank Deposit type
			});

			errorRec.setValue({
				fieldId: 'custrecord_error_description',
				value: JSON.stringify(pp)
			});

			errorRec.setValue({
				fieldId: 'custrecord_processed',
				value: 2
			});

			errorRec.setValue({
				fieldId: 'custrecord_json_file',
				value: ''
			});

			errorRec.save();
			return '';
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize
	};

		});