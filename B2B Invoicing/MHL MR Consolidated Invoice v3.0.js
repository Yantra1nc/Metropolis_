/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL Consolidated Invoice Map_Reduce v3.0
 * File Name: MHL MR Consolidated Invoice v3.0.js
 * Created On: 
 * Modified On: 03/08/2021
 * Created By: Avinash Lahane(Yantra Inc.)
 *********************************************************** */

define(['N/format', 'N/record', 'N/search', 'N/runtime', 'N/file', 'N/task'],

function(format, record, search, runtime, file, task) 
{
   
    function getInputData() 
    {
    	try
    	{			
			var scriptObj = runtime.getCurrentScript();
			var deploymentId = scriptObj.deploymentId;
			var billingCycle = scriptObj.getParameter({
				name: 'custscript_billing_cycle_v3'
			});
			
			var fromDateScript = scriptObj.getParameter({
				name: 'custscript_from_date_v3'
			});
			var toDateScript = scriptObj.getParameter({
				name: 'custscript_to_date_v3'
			});
			
			var s_customer_search_15days = scriptObj.getParameter({
				name: 'custscript_customer_search_15days'
			});
			
			log.debug('from Date- '+fromDateScript+'#toDateScript- '+toDateScript+'#s_customer_search_15days- '+s_customer_search_15days);
			
			var date = fromDateScript.getDate();
			var month = (fromDateScript.getMonth()) + 1;
			var year = fromDateScript.getFullYear();
			var fromDate = date + '/' + month + '/' + year;
			var date = toDateScript.getDate();
			var month = (toDateScript.getMonth()) + 1;
			var year = toDateScript.getFullYear();
			
			var toDate = date + '/' + month + '/' + year;
			

//			["internalid", "anyof", "50772"],// 50772  = L9940 KHURSHEED I BHIWANDI  //19200- L5022 AISHWARYA PATHOLOGY LABORATORY //,"19200","73496"
//			"AND",
			
			if (deploymentId == 'customdeploy_15_days_billing_cycle_v3') 
			{
				
				var o_customer = search.load({ id: s_customer_search_15days});
			}
			/*
			if (deploymentId == 'customdeploy_30_days_billing_cycle_v3') {
				var o_customer =  search.create({
					type: "customer",
					filters: [
						["custentity_mhl_customer_payment_mode", "anyof", "4", "2"],
						"AND", ["custentity_mhl_cus_invoicing_cycle", "anyof", "1"],
						"AND", ["custentity_mhl_cust_client_type", "anyof", "1"],
						"AND", ["custentity_mhl_cus_revenue_segment", "noneof", "21", "9"],
						"AND", ["terms", "noneof", "@NONE@"],
						"AND", [
							["parent", "anyof", "@NONE@"], "OR", ["custentity_mhl_billing_at_parent", "is", 'F']
						]
					],
					columns: [
						search.createColumn({
							name: "custentity_mhl_customer_payment_mode",
							label: "Payment Mode"
						}),
						search.createColumn({
							name: "internalid",
							join: "mseSubsidiary",
							label: "Subsidiary Internal ID"
						}),
						search.createColumn({
							name: "currency",
							label: "Primary Currency"
						}),
						search.createColumn({
							name: "terms",
							label: "Terms"
						}),
						search.createColumn({
							name: "custentity_mhl_child_customer_details",
							label: "CHILD CUSTOMER DETAILS"
						}),
						search.createColumn({
							name: "internalid",
							label: "internalid"
						})
					]
				});
			}
			if (deploymentId == 'customdeploy_7_days_billing_cycle_v3') {
				var o_customer =  search.create({
					type: "customer",
					filters: [
						["custentity_mhl_customer_payment_mode", "anyof", "4", "2"],
						"AND", ["custentity_mhl_cus_invoicing_cycle", "anyof", "4"],
						"AND", ["custentity_mhl_cust_client_type", "anyof", "1"],
						"AND", ["custentity_mhl_cus_revenue_segment", "noneof", "21", "9"],
						"AND", ["terms", "noneof", "@NONE@"],
						"AND", [
							["parent", "anyof", "@NONE@"], "OR", ["custentity_mhl_billing_at_parent", "is", 'F']
						]

					],
					columns: [
						search.createColumn({
							name: "custentity_mhl_customer_payment_mode",
							label: "Payment Mode"
						}),
						search.createColumn({
							name: "internalid",
							join: "mseSubsidiary",
							label: "Subsidiary Internal ID"
						}),
						search.createColumn({
							name: "currency",
							label: "Primary Currency"
						}),
						search.createColumn({
							name: "terms",
							label: "Terms"
						}),
						search.createColumn({
							name: "custentity_mhl_child_customer_details",
							label: "CHILD CUSTOMER DETAILS"
						}),
						search.createColumn({
							name: "internalid",
							label: "internalid"
						})
					]
				});
			}
			*/
			var resultSet = o_customer.run().getRange({start: 0,end: 1000});
			log.debug('GetInfo','resultSet length- '+resultSet.length);
			
			/*if(resultSet!=null && resultSet!='' && resultSet!=' ')
			{
				var completeResultSet = resultSet; 
				var start = 1000;
				var last = 2000;
				
				while(resultSet.length == 1000)
				{
					resultSet = o_customer.run().getRange(start_range, last_range);
					completeResultSet = completeResultSet.concat(resultSet);
					start = parseFloat(start)+1000;
					last = parseFloat(last)+1000;
				}
				resultSet = completeResultSet;
				if(resultSet)
				{
					log.debug('In getInputData_savedSearch: resultSet: '+resultSet.length);	
				}
			}*/
			
			var resultResult = new Array();
			
			for(var index_search = 0; index_search < resultSet.length; index_search++)
			{
				var customer_id = resultSet[index_search].getValue({name: 'internalid'});
				var cust_payment_mode = resultSet[index_search].getValue({name: 'custentity_mhl_customer_payment_mode'});
				var cust_subsidiary = resultSet[index_search].getValue({name: 'internalid', join: 'mseSubsidiary'});
				var cust_currency = resultSet[index_search].getValue({name: 'currency'});
				var cust_terms = resultSet[index_search].getValue({name: 'terms'});
				var child_cust_details = resultSet[index_search].getValue({name: 'custentity_mhl_child_customer_details'});
				log.debug('getinput','Details- '+customer_id+'#cust_payment_mode-'+cust_payment_mode);				
				resultResult.push({
					"customer":customer_id,
					values:{
						'toDate': toDate,
						'fromDate': fromDate,
						"payMode":cust_payment_mode,
						"subsidiary":cust_subsidiary,
						"invoiceType":"1",
						"currency":cust_currency,
						"terms":cust_terms,
						"childCust":child_cust_details
					}
				
				});
			}
			log.debug('getinput','Result- '+resultResult);
			return resultResult;
			
		
    	}
    	catch(err)
    	{
    		log.error('CATCH','Msg- '+err);
    	}
    }
    
    function map(context) 
    {
    	try
    	{

			var scriptObj = runtime.getCurrentScript();
			var fromDateScript = scriptObj.getParameter({
				name: 'custscript_from_date_v3'
			});
			var toDateScript = scriptObj.getParameter({
				name: 'custscript_to_date_v3'
			});
			log.debug('Map','Date- '+fromDateScript+'#toDateScript- '+toDateScript);
			var date = fromDateScript.getDate();
			var month = (fromDateScript.getMonth()) + 1;
			var year = fromDateScript.getFullYear();
			var fromDate = date + '/' + month + '/' + year;
			var date = toDateScript.getDate();
			var month = (toDateScript.getMonth()) + 1;
			var year = toDateScript.getFullYear();
			var toDate = date + '/' + month + '/' + year;
			log.debug('Map','data'+JSON.stringify(context.value));
			
			var customerJson = JSON.parse(context.value);
			var customerInternalId = customerJson.customer;
			var payMode = customerJson.values.payMode;
			var subsidiary = customerJson.values.subsidiary;
			log.debug('Map','data: Customer ID- '+customerInternalId+' #payMode- '+payMode);
			var invoiceType = 1;
			var currency = customerJson.values.currency;
			var terms = customerJson.values.terms;
			var childCust = customerJson.values.childCust;
			log.debug('childCust', childCust);
		
			
			var finalArray = [];
			if (childCust) {
				var custArray = [];
				custArray = childCust.split(',');
				log.debug('Map','custArray- '+custArray);
				
				var childCustSearch = search.create({
					type: "customer",
					filters: [
						["custentity_mhl_customer_payment_mode", "anyof", "4", "2"],
						"AND", ["custentity_mhl_cust_client_type", "anyof", "1"],
						"AND", ["custentity_mhl_cus_revenue_segment", "noneof", "21", "9"],
						"AND", ["terms", "noneof", "@NONE@"],
						"AND", ["custentity_mhl_billing_at_parent", "is", 'T'],
						"AND", ["internalid", "anyof", custArray]
					],
					columns: [
						search.createColumn({
							name: "internalid",
							label: "internalid"
						})
					]
				});

				var childCustData = getAllResults(childCustSearch);
				log.debug('Map','childCustData- '+childCustData)
				if (childCustData) {
					for (var tt = 0; tt < childCustData.length; tt++) {
						var internalID = childCustData[tt].getValue({
							name: 'internalid'
						});
						log.debug('internalID', internalID);

						finalArray.push(internalID)
					}
				}

				//log.debug('after childCust', childCust);
				//custArray.push(customerInternalId)
			}
			log.debug('  customerInternalId', customerInternalId);

			finalArray.push(customerInternalId);
			log.debug('after finalArray', finalArray.toString());
//			var subsidiary = (customerJson.values["internalid.mseSubsidiary"]).value;

		var searchArray = searchTransaction(finalArray, toDate, fromDate, payMode, invoiceType, currency, terms);
			log.debug('Invoice CM search Length- ', searchArray.length);
			//jsonToReduceStage.invoiceArray = searchArray;
			log.debug('Invoice CM search array- ', JSON.stringify(searchArray));
			
			var jsonToReduceStage = {
					'customer': customerInternalId,
					'toDate': toDate,
					'fromDate': fromDate,
					'payMode': payMode,
					'invoiceType': invoiceType,
					'currency': currency,
					'subsidiary': subsidiary,
					'terms': terms,
					'invoiceArray': searchArray
				}
				log.debug('Map','jsonToReduceStage- ', JSON.stringify(jsonToReduceStage));
			
			context.write({
				key: context.key,
				value: jsonToReduceStage
			});
		
    	}
    	catch(e)
    	{
    		log.error('CATCH','Msg- '+e);
           /* var createError = record.create({type:'customrecord_mhl_cons_invc_error_status'});
           createError.setValue({fieldId:'custrecord_customer_ref',value: customerInternalId});
           createError.setValue({fieldId:'custrecord_from_date',value: format.parse({value: fromDate,type: format.Type.DATE})});
           createError.setValue({fieldId:'custrecord_to_date',value: format.parse({value: toDate,type: format.Type.DATE})});
           createError.setValue({fieldId:'custrecord_script_stageortype',value: '1'});
           createError.setValue({fieldId:'custrecord_error_details',value: e.toString()});
             createError.save();*/
    	}
    }

    function reduce(context) 
    {
    	try
    	{
    		var mapJson = JSON.parse(context.values[0]);

			var vidInternalId = [];
			var dueDate = '';
			var discountPercentage = 0;
			var daystoAdd = 0;
			
			var mapStageData = mapJson.invoiceArray;
			log.debug({title:'map Stage Data',details:mapStageData});
			var resultSet = [];
			var flag = 0;
			
			if (mapStageData.length > 0) 
			{
				var termRec = record.load({type: 'term',id: mapJson.terms});
				daystoAdd = termRec.getValue('daysuntilnetdue');
				discountPercentage = termRec.getValue('discountpercent');
				var currentDate = new Date();
				
				if (daystoAdd) 
				{
					var tempToDate = (mapJson.toDate).split('/');
					var tempDate = new Date();
					tempDate.setDate(tempToDate[0]);
					tempDate.setMonth(Number(tempToDate[1]) - 1);
					tempDate.setFullYear(tempToDate[2]);
					tempDate.setDate(tempDate.getDate() + Number(daystoAdd));
					dueDate = tempDate;
				}
				var new_recordData = [];
				var o_recordData = [];
				for (var k in mapStageData) 
				{
					var tempJson = mapStageData[k];
					log.debug('tempJson', tempJson);
					
					var totalAmtFromVID = 0;
					
					var s_location = tempJson["GROUP(location)"].text;
					var i_location = (tempJson["GROUP(location)"])[0].value;
					if(!i_location)
						i_location = '';
					
					var s_department = tempJson["GROUP(department)"].text;
					var i_department = (tempJson["GROUP(department)"])[0].value;
					if(!i_department)
						i_department = '';
					
					var s_class = tempJson["GROUP(class)"].text;
					var i_class = (tempJson["GROUP(class)"])[0].value;
					if(!i_class)
						i_class = '';
					
					/*var tempCurrency = (tempJson["GROUP(CUSTRECORD_MHL_ITD_VID.custrecord_customer_currency)"])[0].value;
					if(!tempCurrency)
						tempCurrency = '';*/
					
					//var tempInternal = tempJson["COUNT(internalid)"];
					
					var i_count_test = tempJson["COUNT(internalid)"];
					if(!i_count_test)
						i_count_test = '';
					var i_count_vid = tempJson["COUNT(CUSTRECORD_MHL_ITD_VID.id)"];
					if(!i_count_vid)
						i_count_vid = '';
					var i_amount = tempJson["SUM(formulacurrency)"];
					if(!i_amount)
						i_amount = '';
						
					var s_fee_type = tempJson["GROUP(formulatext)_1"];
					if(!s_fee_type)
						s_fee_type = '';
						
					log.debug('After values','i_location- '+i_location+' #i_department- '+i_department+' #i_count_vid- '+i_count_vid+' #i_amount- '+i_amount+' #i_class- '+i_class+' #i_count_test- '+i_count_test+' #s_fee_type- '+s_fee_type);
					
				
					o_recordData.push({
							'vid_count': i_count_vid,
							'totalAmt': i_amount,
							'test_count': i_count_test,
							'location': i_location,
							'department': i_department,
							's_class': i_class,
							'fee_type':s_fee_type
						});
					//'currency': tempCurrency,
					log.debug('In o_recordData','o_recordData- '+o_recordData);
					//new_recordData.push(o_recordData);					
				}
				
				try
				{
					var recId = createCustomTransaction(o_recordData, mapJson.customer, mapJson.subsidiary, mapJson.fromDate, mapJson.toDate, 2, dueDate, discountPercentage, daystoAdd, mapJson.currency);
					log.debug('Rec ID', recId);
				}
				catch(e)
				{
					log.error('CATCH','Msg- '+e);
				}
				
				var fianlJson = {
					'consolidatedInvoice': recId,
					'invoiceArray': vidInternalId,
					'dueDate': dueDate
				};
				if (recId > 0) {
					context.write({
						key: recId,
						value: fianlJson
					});
				}
			}
    	}
    	catch(err)
    	{
    		log.error('CATCH','Msg- '+err);
    	}
    }

    function summarize(summary) 
    {		
    	try
    	{
    		var ProcessedInvoiceArray = [];
			var totalItemsProcessed = 0;
			summary.output.iterator().each(function(key, value) {
				totalItemsProcessed++;
				log.debug('Key', key);
				log.debug('value', value);
				ProcessedInvoiceArray.push(JSON.parse(value));
				return true;
			});
			var summaryMessage = "Usage: " + summary.usage + " Concurrency: " + summary.concurrency +
				" Number of yields: " + summary.yields + " Total Items Processed: " + totalItemsProcessed;
			log.audit({
				title: 'Summary of usase',
				details: summaryMessage
			});
			var dateTime = (new Date()).toString();
			dateTime = dateTime + '.json';
			var fileObj = file.create({
				name: dateTime,
				fileType: file.Type.JSON,
				contents: JSON.stringify(ProcessedInvoiceArray)
			});
			fileObj.folder = '63087';
			var id = fileObj.save();
			log.debug({
				title: 'Id',
				details: id
			});
			/*var scheduledScriptTask = task.create({
				taskType: task.TaskType.SCHEDULED_SCRIPT,
				scriptId: 'customscript_update_consolidated_inv_num',
				deploymentId: 'customdeploy_update_consolidated_inv_num',
				params: {
					'custscript_file_internal_id': id
				}
			});*/

			/*
			var scheduledScriptTask = task.create({
				taskType: task.TaskType.SCHEDULED_SCRIPT,
				scriptId: 'customscript_update_consolidated_inv_num',
				params: {
					'custscript_file_internal_id': id
				}
			});

			var scheduledTaskId = scheduledScriptTask.submit();
			log.debug({
				title: 'scheduledTaskId',
				details: scheduledTaskId
			});
			*/
			
			///////////////// Update Script From & To Date on deployment record /////////////////////////
			var scriptObj = runtime.getCurrentScript();
			var deploymentId = scriptObj.deploymentId;
			var fromDate = scriptObj.getParameter({
				name: 'custscript_from_date_v3'
			});
			var toDate = scriptObj.getParameter({
				name: 'custscript_to_date_v3'
			});

			var i_cycle_cnt = scriptObj.getParameter({
				name: 'custscript_bill_cycle_count'
			});

			log.debug({
				title: 'fromDate',
				details: fromDate
			});
			log.debug({
				title: 'toDate',
				details: toDate
			});
			fromDate = format.parse({
				value: fromDate,
				type: format.Type.DATE
			});
			toDate = format.parse({
				value: toDate,
				type: format.Type.DATE
			});
			log.debug({
				title: 'fromDate',
				details: fromDate
			});
			log.debug({
				title: 'toDate',
				details: toDate
			});
/*			if (deploymentId == 'customdeploy_7days_billing_cycle') {
				var deploymentRec = record.load({
					type: 'scriptdeployment',
					id: 2760
				});
				//fromDate = fromDate.setDate((fromDate.getDate()) + 7);
				//toDate = toDate.setDate((toDate.getDate()) + 7);
				//new date logic ======
				var d_from_date = toDate;
				var d_to_date = toDate;

				d_from_date = d_from_date.setDate((d_from_date.getDate()) + 1);
				d_to_date = d_to_date.setDate((d_to_date.getDate()) + 6);
				var d_lst = new Date(d_from_date);
				var lastDay = new Date(d_lst.getFullYear(), d_lst.getMonth() + 1, 0);
				lastDay = format.parse({
					value: lastDay,
					type: format.Type.DATE
				});
				i_cycle_cnt = Number(i_cycle_cnt) + 1;
				if (Number(i_cycle_cnt) == 4) {
					d_to_date = lastDay

				}

				if (Number(i_cycle_cnt) == 5) {
					i_cycle_cnt = 1;
				}
				deploymentRec.setValue({
					fieldId: 'custscript_from_date',
					value: new Date(d_from_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_to_date',
					value: new Date(d_to_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_bill_cycle_count',
					value: i_cycle_cnt
				});
				//========================================
				deploymentRec.save();
			}
			if (deploymentId == 'customdeploy_30_days_billing') {
				var deploymentRec = record.load({
					type: 'scriptdeployment',
					id: 2758
				});
				//fromDate = fromDate.setDate((fromDate.getDate()) + 30);
				//toDate = toDate.setDate((toDate.getDate()) + 30);

				//new date logic ======
				var d_from_date = toDate;
				var d_to_date = toDate;

				d_from_date = d_from_date.setDate((d_from_date.getDate()) + 1);
				//d_to_date = d_to_date.setDate((d_to_date.getDate()) + 14);
				var d_lst = new Date(d_from_date);
				var lastDay = new Date(d_lst.getFullYear(), d_lst.getMonth() + 1, 0);
				lastDay = format.parse({
					value: lastDay,
					type: format.Type.DATE
				});

				d_to_date = lastDay;

				deploymentRec.setValue({
					fieldId: 'custscript_from_date',
					value: new Date(d_from_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_to_date',
					value: new Date(d_to_date)
				});

				//========================================
//				deploymentRec.save();
			}*/
			if (deploymentId == 'customdeploy_15_days_billing_cycle_v3') {
				var deploymentRec = record.load({
					type: 'scriptdeployment',
					id: 4301
				});
				//fromDate = fromDate.setDate((fromDate.getDate()) + 15);
				//toDate = toDate.setDate((toDate.getDate()) + 15);

				//new date logic ======
				var d_from_date = toDate;
				var d_to_date = toDate;

				d_from_date = d_from_date.setDate((d_from_date.getDate()) + 1);
				d_to_date = d_to_date.setDate((d_to_date.getDate()) + 14);
				var d_lst = new Date(d_from_date);
				var lastDay = new Date(d_lst.getFullYear(), d_lst.getMonth() + 1, 0);
				lastDay = format.parse({
					value: lastDay,
					type: format.Type.DATE
				});
				i_cycle_cnt = Number(i_cycle_cnt) + 1;
				if (Number(i_cycle_cnt) == 2) {
					d_to_date = lastDay

				}

				if (Number(i_cycle_cnt) == 3) {
					i_cycle_cnt = 1;
				}
				deploymentRec.setValue({
					fieldId: 'custscript_from_date_v3',
					value: new Date(d_from_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_to_date_v3',
					value: new Date(d_to_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_bill_cycle_count_v3',
					value: i_cycle_cnt
				});
				//========================================
//				deploymentRec.save();
			}
    	}
    	catch(err)
    	{
    		log.error('CATCH','Msg- '+err);
    	}
    }
    
	function createCustomTransaction(recordData, custId, subsidiary, fromDate, toDate, paymentMode, dueDate, discountPercentage, termDays, currency) 
	{
		try 
		{
			log.debug('createCustomTransaction','recordData'+recordData);
			var invoicesConsolidated = []; //stores all invoices that were consolidated
			//nlapiLogExecution('DEBUG', 'createCustomTransaction', 'Record Data - ' + JSON.stringify(recordData));

			var customTrans = record.create({
				type: 'customtransaction_mhl_consolidatedinvoic',
				isDynamic: true
			});
			customTrans.setValue({
				fieldId: 'custbody_mhl_conso_invoice_pilot_run',
				value: true
			});
			customTrans.setValue({
				fieldId: 'custbody_mhl_consinv_customer',
				value: custId
			});
			log.debug('Create Trans Record','set custid -'+customTrans.getValue({fieldId: 'custbody_mhl_consinv_customer'}));
			
			customTrans.setValue({
				fieldId: 'subsidiary',
				value: subsidiary
			});
			fromDate = format.parse({
				value: fromDate,
				type: format.Type.DATE
			});
			customTrans.setValue({
				fieldId: 'custbody_mhl_coninv_periodfrom',
				value: fromDate
			});
			toDate = format.parse({
				value: toDate,
				type: format.Type.DATE
			});
			customTrans.setValue({
				fieldId: 'custbody_mhl_coninv_periodto',
				value: toDate
			});
			customTrans.setValue({
				fieldId: 'custbody_mhl_inv_payment_mode',
				value: paymentMode
			});
			if (currency) 
				customTrans.setValue('currency', currency);
			
			if (dueDate) {
				customTrans.setValue({
					fieldId: 'custbody_mhl_coninv_duedate',
					value: dueDate
				});
			}
			var dueAmt = 0;
			// For each invoice call the addLines function to add the items to the Consolidated Invoice
			log.debug('CreateCustom Trans - Record length -> '+recordData.length)
			for (var j = 0; j < recordData.length; j++) 
			{
				log.debug('Inside of  lines loop');
				try
				{
					log.debug('CreateCustom Trans  -> '+recordData[j].vid_count +'#'+recordData[j].totalAmt)
					customTrans.selectNewLine({sublistId: 'line'});
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_sn', Number(j + 1));
					customTrans.setCurrentSublistValue('line', 'account', 3422);
					//customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_visitnumber', recordData[j].vid);	
					
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_netamt', recordData[j].totalAmt);
					if(parseFloat(recordData[j].totalAmt) >= parseFloat(0))
					{
						customTrans.setCurrentSublistValue('line', 'amount', recordData[j].totalAmt);
					}
					else
					{
						customTrans.setCurrentSublistValue('line', 'amount', Math.abs(recordData[j].totalAmt));	
					}
						
					//customTrans.setCurrentSublistValue('line', 'amount', recordData[j].totalAmt);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_count_of_test', recordData[j].test_count);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_count_of_vid', recordData[j].vid_count);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_fee_type', recordData[j].fee_type);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_orgname', recordData[j].location);
					customTrans.setCurrentSublistValue('line', 'cseg_mhl_custseg_de', recordData[j].department);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_line_revenue_segment', recordData[j].department);
					
					dueAmt = dueAmt + Number(recordData[j].totalAmt);
					customTrans.commitLine('line');
				}
				catch(er_msg)
				{
					log.error('er_msg',er_msg);
				}
				
				//customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_visitnumber', recordData[j].currency);	
				//customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_visitnumber', recordData[j].location);	
				//customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_visitnumber', recordData[j].department);	
				//customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_visitnumber', recordData[j].s_class);	
				//customTrans.setCurrentSublistValue('line', 'custcol_mhl_linked_vid', recordData[j].internalId);	
				
				
				/*
				invoicesConsolidated.push(recordData[j].internalId);
				//log.debug('Inside FOR Record Type - '+recordData[j].getRecType);
				if(recordData[j].getRecType == 'CustInvc')
				{
					//log.audit('Inside Inv Add line');
					customTrans.selectNewLine({
						sublistId: 'line'
					});
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_sn', Number(j + 1));
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_visitnumber', recordData[j].vid);											
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_netamt', recordData[j].totalAmt);					
					var totalamount = parseFloat(recordData[j].totalAmt);
					if(recordData[j].totalAmt <=  0)
						customTrans.setCurrentSublistValue('line', 'amount', recordData[j].cmNetAmount);
					else						
						customTrans.setCurrentSublistValue('line', 'amount', recordData[j].totalAmt);					
					dueAmt = dueAmt + Number(recordData[j].totalAmt);
					customTrans.setCurrentSublistValue('line', 'account', 3422);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_linked_vid', recordData[j].internalId);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_test_details', recordData[j].testCodes);
					customTrans.setCurrentSublistValue('line', 'custcol_test_name_details', recordData[j].testNames);
					customTrans.setCurrentSublistValue('line', 'custcol_test_net_rate_details', recordData[j].testNetRate);					
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_grossamt', recordData[j].grossRate);					
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_discount', recordData[j].discountRate);					
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_grosstestamt', recordData[j].testGrossRate);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_disctestamt', recordData[j].testDiscountRate);
					customTrans.commitLine('line');
				}
				else if(recordData[j].getRecType == 'CustCred')
				{
					//log.audit('Inside Credit memo Add line');					
					customTrans.selectNewLine({
						sublistId: 'line'
					});
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_sn', Number(j + 1));
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_visitnumber', recordData[j].vid);
					//log.debug('CM amount- >',recordData[j].cmNetAmount);					
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_netamt',Math.abs(recordData[j].cmNetAmount));					
					customTrans.setCurrentSublistValue('line', 'amount', Math.abs(recordData[j].cmNetAmount));					
					dueAmt = dueAmt + Number(recordData[j].cmNetAmount);
					customTrans.setCurrentSublistValue('line', 'account', 3422);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_linked_vid', recordData[j].internalId);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_test_details', "Manual CN adjustments");
					customTrans.setCurrentSublistValue('line', 'custcol_test_name_details', "Manual CN adjustments");
					customTrans.setCurrentSublistValue('line', 'custcol_test_net_rate_details', "Manual CN adjustments");					
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_grossamt', Math.abs(recordData[j].cmNetAmount));
					log.audit('CM Org details- '+recordData[j].orgname+'#'+recordData[j].collection_center+'#'+recordData[j].unitid+'#'+recordData[j].department);
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_orgname', recordData[j].orgname);
					customTrans.setCurrentSublistValue('line', 'cseg_mhl_locations', recordData[j].collection_center);
					customTrans.setCurrentSublistValue('line', 'cseg_mhl_custseg_un', recordData[j].unitid);
					customTrans.setCurrentSublistValue('line', 'cseg_mhl_custseg_de', recordData[j].department);					
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_discount', parseInt(0));					
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_grosstestamt', Math.abs(recordData[j].cmNetAmount));
					customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_disctestamt', parseInt(0));
					customTrans.commitLine('line');
				}
			*/
				
			}
			log.debug('Out of  lines loop');
		//	customTrans.setValue('custbody_due_amount', dueAmt);
			//customTrans.setValue('total', dueAmt);
			var todAmt = 0;
			/*if (discountPercentage) {
				todAmt = (Number(discountPercentage) / 100) * dueAmt;
			}
			customTrans.setValue('custbody_mhl_coninv_tod', todAmt);*/
			
			/*var subsidiaryFields = search.lookupFields({
				type: 'subsidiary',
				id: subsidiary,
				columns: ['legalname', 'custrecord_in_permanent_account_number']
			});
			var termsCondition = getTermsandCondition(termDays, subsidiaryFields['legalname'], subsidiaryFields['custrecord_in_permanent_account_number'], todAmt);
			customTrans.setValue('custbody_mhl_coninv_termscond', termsCondition);*/
			
			try
			{
				var int_id = customTrans.save({enableSourcing: true,ignoreMandatoryFields: true});
				log.debug('Consolidated Invoice Record ID - '+int_id);
				return int_id;
			}
			catch(er)
			{
				log.debug('CATCH','Save rec Msg- '+er);
			}
			
			
		} catch (e) {
			log.error('Error in Creating Consolidated Invoice', e);
		}
	}

	function getTermsandCondition(termDay, subsidiaryName, subsidiaryPan, todAmt) {
		var termsConditionLine = [];
		termsConditionLine.push("Please donÃ¢â‚¬â„¢t make payments in cash against Invoice, we shall not be responsible for any payment made in cash.\n");
		termsConditionLine.push("Any correction to this Invoice has to be communicated in writing within 7 days of the date of Invoice. Beyond this the Invoice will be considered to be final and accepted.\n");
		if (termDay) {
			termsConditionLine.push("Please make the payment within " + termDay + " days of the date of the invoice. Any delay can attract interest @18% pa.\n");
		} else {
			termsConditionLine.push("Please make the payment within 15 days of the date of the invoice. Any delay can attract interest @18% pa.\n");
		}
		termsConditionLine.push("Cheque should be crossed 'A/c payee' and drawn in favour of " + subsidiaryName + " PAN NO - " + subsidiaryPan + " for TDS.\n");
		if (todAmt) {
			termsConditionLine.push("Turnover-discount is applicable if the payment is made as per condition 3 above.\n");
		}
		termsConditionLine.push("All the conditions appearing on the Test report issued to you under this invoice are presumed to be incorporated herein.\n");
		termsConditionLine.push("Dispute if any regarding this invoice will be subject to jurisdiction of the court at Mumbai.\n");
		termsConditionLine.push("This Is Computer Generated Statement And Hence Does Not Require Signature.\n");
		var finalTerms = '';
		for (var tc in termsConditionLine) {
			finalTerms = finalTerms + (Number(tc) + 1) + '. ' + termsConditionLine[tc];
		}
		return finalTerms;
	}
	
	function searchTransaction(customer, todate, fromdate, paymentMode, invoiceType, currency,  terms) {
		try{
			log.debug('Inside searchTransaction');
			var scriptObj = runtime.getCurrentScript();
			var s_transaction_search = scriptObj.getParameter({
				name: 'custscript_mhl_transaction_search_cons'
			});
			log.debug('Inside searchTransaction','s_transaction_search- '+s_transaction_search);
			var searchDetails = [];
			var filters = [];
			var columns = [];
			
			columns.push(search.createColumn({ name: "formulatext", summary: "GROUP", formula: "'S/N'", label: "Sr. No." })); 
			columns.push(search.createColumn({ name: "location", summary: "GROUP", label: "Org" }));
			columns.push(search.createColumn({ name: "department", summary: "GROUP", label: "Revenue Segment" })); 
			columns.push(search.createColumn({ name: "class", summary: "GROUP", label: "SBU (Optional)" }));
			columns.push(search.createColumn({ name: "formulatext", summary: "GROUP", formula: "'Please confirm data'", label: "Fee Type" })); 
			columns.push(search.createColumn({ name: "internalid", summary: "COUNT", sort: search.Sort.DESC, label: "Internal ID" }));
			columns.push(search.createColumn({ name: "id", join: "CUSTRECORD_MHL_ITD_VID", summary: "COUNT", label: "ID" }));
			columns.push(search.createColumn({ name: "type", summary: "GROUP", label: "Type" }));
			 search.createColumn({name: "formulacurrency",summary: "SUM",formula: "CASE    WHEN {type}='Invoice' THEN {custrecord_mhl_itd_vid.custrecord_mhl_itd_net_amt}    WHEN {type}='Credit Memo'        THEN {amount}ELSE 0END",label: "Formula (Currency)"});
			/*'AND', ['status', 'anyof', 'CustInvc:A'],
					'AND', ["custrecord_mhl_itd_vid.custrecord_for_print", "is", "T"],
					'AND', ["custrecord_mhl_itd_vid.custrecord_test_cancelled", "is", "F"],
					'AND', ['custbody_mhl_conso_invoice_pilot_run', 'is', 'F'],,
					'AND', ['custbody_mhl_invoice_type', 'anyof', invoiceType]*/
					
					
					/*["type","anyof","CustInvc","CustCred"], 				     
					'AND',['trandate', 'within', fromdate, todate],
					'AND', ['entity', 'anyof', customer],
					'AND', ['custbody_mhl_inv_payment_mode', 'anyof', paymentMode],
					'AND', ['mainline', 'is', 'T'],
					'AND', ["custrecord_mhl_itd_vid.custrecord_for_print", "is", "T"],*/
			
			log.debug('customer', customer.toString())
			/*var tranSearch = search.create({
				type: 'transaction',
				columns: columns,
				filters: [
						["mainline","is","T"], 
					  "AND", 
					  ["type","anyof","CustInvc","CustCred"], 
					  "AND", 
					  ["trandate","within",fromdate,todate], 
					  "AND", 
					  ["customer.custentity_mhl_customer_payment_mode","anyof","2"], 
					  "AND", 
					  ["mainname","anyof",customer], 
					  "AND", 
					  ["custrecord_mhl_itd_vid.custrecord_for_print","is","T"]
				]
			});*/
			
			var tranSearch = search.load({id: s_transaction_search});
			tranSearch.filters.push(search.createFilter({ name: 'trandate', operator: search.Operator.ONORAFTER, values: fromdate}));		
			tranSearch.filters.push(search.createFilter({ name: 'trandate', operator: search.Operator.ONORBEFORE, values: todate}));		
			tranSearch.filters.push(search.createFilter({ name: 'mainname', operator: search.Operator.ANYOF, values: customer}));		
			
			var pagedData = tranSearch.runPaged({
				pageSize: 1000
			});
			for (var i = 0; i < pagedData.pageRanges.length; i++) {
				// fetch the current page data
				var currentPage = pagedData.fetch(i);
				// and forEach() thru all results
				currentPage.data.forEach(function(result) {
					searchDetails.push(result.getAllValues());
				});
			}
			return searchDetails;
		}
		catch(err)
		{
			log.error('Catch','msg- '+err)
		}
		}

	function getAllResults(objSearch, maxResults) {
		var intPageSize = 1000;
		// limit page size if the maximum is less than 1000
		if (maxResults && maxResults < 1000) {
			intPageSize = maxResults;
		}
		var objResultSet = objSearch.runPaged({
			pageSize: intPageSize
		});
		var arrReturnSearchResults = [];
		var j = objResultSet.pageRanges.length;
		// retrieve the correct number of pages. page count = maximum / 1000
		if (j && maxResults) {
			j = Math.min(Math.ceil(maxResults / intPageSize), j);
		}
		for (var i = 0; i < j; i++) {
			var objResultSlice = objResultSet.fetch({
				index: objResultSet.pageRanges[i].index
			});
			arrReturnSearchResults = arrReturnSearchResults.concat(objResultSlice.data);
		}
		log.debug('Map','GetallResults- '+arrReturnSearchResults);
		if (maxResults) {
			return arrReturnSearchResults.slice(0, maxResults);
		} else {
			return arrReturnSearchResults;
		}
	};

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
