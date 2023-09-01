/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL MR | Consolidated Invoice v2.0
 * File Name: MHL Consolidated Invoice Map_Reduce v2.0.js
 * Created On: 21/06/2021
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: MHL MR | Consolidated Invoice v2.0
 *********************************************************** */

define(['N/format', 'N/record', 'N/search', 'N/runtime', 'N/file', 'N/task'],
	/**
	 * @param {format} format
	 * @param {record} record
	 * @param {search} search
	 */
	function(format, record, search, runtime, file, task) {
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
			try {
				var scriptObj = runtime.getCurrentScript();
				var deploymentId = scriptObj.deploymentId;
				var billingCycle = scriptObj.getParameter({
					name: 'custscript_billing_cycle_v2'
				});
				
				if (deploymentId == 'customdeploy_15_days_billing_cycle') {
					return search.create({
						type: "customer",
						filters: [
							["internalid", "anyof", "50772 "],// 50772  = L9940 KHURSHEED I BHIWANDI
							"AND",
							["custentity_mhl_customer_payment_mode", "anyof", "4", "2"],
							"AND", ["custentity_mhl_cus_invoicing_cycle", "anyof", "2"],
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
				if (deploymentId == 'customdeploy_30_days_billing') {
					return search.create({
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
				if (deploymentId == 'customdeploy_7days_billing_cycle') {
					return search.create({
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
			} catch (e) {
				log.debug('error', e);
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
				var fromDateScript = scriptObj.getParameter({
					name: 'custscript_from_date_v2'
				});
				var toDateScript = scriptObj.getParameter({
					name: 'custscript_to_date_v2'
				});
				log.debug('Date- '+fromDateScript+'#toDateScript- '+toDateScript);
				var date = fromDateScript.getDate();
				var month = (fromDateScript.getMonth()) + 1;
				var year = fromDateScript.getFullYear();
				var fromDate = date + '/' + month + '/' + year;
				var date = toDateScript.getDate();
				var month = (toDateScript.getMonth()) + 1;
				var year = toDateScript.getFullYear();
				var toDate = date + '/' + month + '/' + year;
				log.debug('data', context.value);
				var customerJson = JSON.parse(context.value);
				var customerInternalId = customerJson.id;
				var payMode = customerJson.values.custentity_mhl_customer_payment_mode.value;
				var invoiceType = 1;
				var currency = customerJson.values.currency.value;
				var terms = customerJson.values.terms.value;
				var childCust = customerJson.values.custentity_mhl_child_customer_details;
				log.debug('childCust', childCust);
				var finalArray = [];
				if (childCust) {
					var custArray = [];
					custArray = childCust.split(',');

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
				var subsidiary = (customerJson.values["internalid.mseSubsidiary"]).value;

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
				var searchArray = searchTransaction(finalArray, toDate, fromDate, payMode, invoiceType, currency, subsidiary, terms);
				log.debug('Invoice CM search Length- ', searchArray.length);
				jsonToReduceStage.invoiceArray = searchArray;
				//log.debug('Invoice CM search array- ', JSON.stringify(searchArray));
				log.debug('jsonToReduceStage- ', JSON.stringify(jsonToReduceStage));
				context.write({
					key: context.key,
					value: jsonToReduceStage
				});
			} catch (e) {
				log.error('error in map stage', e);
               var createError = record.create({type:'customrecord_mhl_cons_invc_error_status'});
              createError.setValue({fieldId:'custrecord_customer_ref',value: customerInternalId});
              createError.setValue({fieldId:'custrecord_from_date',value: format.parse({value: fromDate,type: format.Type.DATE})});
              createError.setValue({fieldId:'custrecord_to_date',value: format.parse({value: toDate,type: format.Type.DATE})});
              createError.setValue({fieldId:'custrecord_script_stageortype',value: '1'});
              createError.setValue({fieldId:'custrecord_error_details',value: e.toString()});
                createError.save();
			}
		}
		/**
		 * Executes when the reduce entry point is triggered and applies to each group.
		 *
		 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
		 * @since 2015.1
		 */
		function reduce(context) {
			try {
				var mapJson = JSON.parse(context.values[0]);

				var vidInternalId = [];
				var dueDate = '';
				var discountPercentage = 0;
				var daystoAdd = 0;
				//log.debug({title:'map Stage Data',details:mapStageData});
				var mapStageData = mapJson.invoiceArray;
				var resultSet = [];
				var flag = 0;
				if (mapStageData.length > 0) {
					var termRec = record.load({
						type: 'term',
						id: mapJson.terms
					});
					daystoAdd = termRec.getValue('daysuntilnetdue');
					discountPercentage = termRec.getValue('discountpercent');
					var currentDate = new Date();
					if (daystoAdd) {
						var tempToDate = (mapJson.toDate).split('/');
						var tempDate = new Date();
						tempDate.setDate(tempToDate[0]);
						tempDate.setMonth(Number(tempToDate[1]) - 1);
						tempDate.setFullYear(tempToDate[2]);
						tempDate.setDate(tempDate.getDate() + Number(daystoAdd));
						dueDate = tempDate;
					}
					var recordData = [];
					for (var k in mapStageData) {
						var tempJson = mapStageData[k];
//						log.debug('tempJson', tempJson);
//						log.debug('json tempJson', JSON.stringify(tempJson));

						var paymentMethod = tempJson["GROUP(custbody_mhl_inv_payment_mode)"].text;
						var totalAmtFromVID = 0;
						if (paymentMethod == 'Co-payment') {
							totalAmtFromVID = Number(tempJson["SUM(formulanumeric)_2"]); //resultSet[k].getValue(searchColumn[13]);
						} else {
							//Kilas 24th feb 2021
							//totalAmtFromVID = Number(tempJson["MAX(amountremaining)"]); //resultSet[k].getValue(searchColumn[1]);
							totalAmtFromVID = Number(tempJson["SUM(formulanumeric)_4"]); //resultSet[k].getValue(searchColumn[1]);
						}
						
						if(totalAmtFromVID < 0)
							totalAmtFromVID = '0';
						//log.debug('tempJson["GROUP(internalid)"])',(tempJson["GROUP(internalid)"])[0].value);
						var tempCurrency = (tempJson["GROUP(CUSTRECORD_MHL_ITD_VID.custrecord_customer_currency)"])[0].value;
						var tempInternal = (tempJson["GROUP(internalid)"])[0].value;
						vidInternalId.push(tempInternal);
						var recType = (tempJson["GROUP(type)"])[0].value;
						
						var location = (tempJson["GROUP(location)"])[0].value;
						var collection_center = (tempJson["GROUP(cseg_mhl_locations)"])[0].value;
						var unit = (tempJson["GROUP(cseg_mhl_custseg_un)"])[0].value;
						var department = (tempJson["GROUP(department)"])[0].value;
						
						var dataObj = {
							'vid': tempJson["GROUP(custbody_mhl_invoice_vid_number)"],
							'totalAmt': totalAmtFromVID,
							'currency': tempCurrency,
							'grossRate': tempJson["SUM(formulanumeric)"],
							'discountRate': tempJson["SUM(formulanumeric)_1"],
							'internalId': tempInternal,
							'testCodes': tempJson["MAX(formulatext)"],
							'testNames': tempJson["MAX(formulatext)_1"],
							'testNetRate': tempJson["MAX(formulatext)_2"],
							'testGrossRate': tempJson["MAX(formulatext)_3"],
							'testDiscountRate': tempJson["MAX(formulatext)_4"],
							'getRecType':recType,
							'cmNetAmount': tempJson["SUM(netamount)"],
							'orgname': location,
							'collection_center': collection_center,
							'unitid': unit,
							'department': department,
						};
						recordData.push(dataObj);
					}
					var recId = createCustomTransaction(recordData, mapJson.customer, mapJson.subsidiary, mapJson.fromDate, mapJson.toDate, 2, dueDate, discountPercentage, daystoAdd, mapJson.currency);
					// createCustomTransaction(recordData,custId,subsidiary,fromDate,toDate,paymentMode,dueDate,discountPercentage,termDays,currency)
					log.debug('Rec ID', recId);
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
			} catch (e) {
				log.debug('Error in Reduce stage', e);
               var createError = record.create({type:'customrecord_mhl_cons_invc_error_status'});
              createError.setValue({fieldId:'custrecord_customer_ref',value: mapJson.customer});
              createError.setValue({fieldId:'custrecord_from_date',value: format.parse({value: mapJson.fromDate,type: format.Type.DATE})});
              createError.setValue({fieldId:'custrecord_to_date',value: format.parse({value: mapJson.toDate,type: format.Type.DATE})});
              createError.setValue({fieldId:'custrecord_script_stageortype',value: '2'});
              createError.setValue({fieldId:'custrecord_error_details',value: e.toString()});
                createError.save();
			}
		}

		function createCustomTransaction(recordData, custId, subsidiary, fromDate, toDate, paymentMode, dueDate, discountPercentage, termDays, currency) {
			try {
//				log.debug('recordData',recordData);
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
				for (var j = 0; j < recordData.length; j++) {
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
						
						/*var totalamount = parseFloat(recordData[j].totalAmt);
						if(recordData[j].totalAmt <=  0)
							customTrans.setCurrentSublistValue('line', 'amount', recordData[j].cmNetAmount);
						else
							*/
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
						/*customTrans.setCurrentSublistValue('line', 'cseg_mhl_locations', recordData[j].collection_center);
						customTrans.setCurrentSublistValue('line', 'cseg_mhl_custseg_un', recordData[j].unitid);
						customTrans.setCurrentSublistValue('line', 'cseg_mhl_custseg_de', recordData[j].department);*/
						
						customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_discount', parseInt(0));
						
						customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_grosstestamt', Math.abs(recordData[j].cmNetAmount));
						customTrans.setCurrentSublistValue('line', 'custcol_mhl_coninv_line_disctestamt', parseInt(0));
						customTrans.commitLine('line');
					}
					
				}
				//customTrans.setValue('total', dueAmt);
				customTrans.setValue('custbody_due_amount', dueAmt);
				var todAmt = 0;
				if (discountPercentage) {
					todAmt = (Number(discountPercentage) / 100) * dueAmt;
				}
				customTrans.setValue('custbody_mhl_coninv_tod', todAmt);
				var subsidiaryFields = search.lookupFields({
					type: 'subsidiary',
					id: subsidiary,
					columns: ['legalname', 'custrecord_in_permanent_account_number']
				});
				var termsCondition = getTermsandCondition(termDays, subsidiaryFields['legalname'], subsidiaryFields['custrecord_in_permanent_account_number'], todAmt);
				customTrans.setValue('custbody_mhl_coninv_termscond', termsCondition);
				var id = customTrans.save();
				log.debug('Consolidated Invoice Record ID - '+id);
				return id;
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
		/**
		 * Executes when the summarize entry point is triggered and applies to the result set.
		 *
		 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
		 * @since 2015.1
		 */
		function summarize(summary) {
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

			var scheduledScriptTask = task.create({
				taskType: task.TaskType.SCHEDULED_SCRIPT,
				scriptId: 'customscript_update_consolidated_inv_v2',
				params: {
					'custscript_file_internal_id_v2': id
				}
			});

			var scheduledTaskId = scheduledScriptTask.submit();
			log.debug({
				title: 'scheduledTaskId',
				details: scheduledTaskId
			});
			///////////////// Update Script From & To Date on deployment record /////////////////////////
			var scriptObj = runtime.getCurrentScript();
			var deploymentId = scriptObj.deploymentId;
			var fromDate = scriptObj.getParameter({
				name: 'custscript_from_date_v2'
			});
			var toDate = scriptObj.getParameter({
				name: 'custscript_to_date_v2'
			});

			var i_cycle_cnt = scriptObj.getParameter({
				name: 'custscript_bill_cycle_count_v2'
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
			if (deploymentId == 'customdeploy_7days_billing_cycle') {
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
					fieldId: 'custscript_from_date_v2',
					value: new Date(d_from_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_to_date_v2',
					value: new Date(d_to_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_bill_cycle_count_v2',
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
					fieldId: 'custscript_from_date_v2',
					value: new Date(d_from_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_to_date_v2',
					value: new Date(d_to_date)
				});

				//========================================
				deploymentRec.save();
			}
			if (deploymentId == 'customdeploy_15_days_billing_cycle') {
				var deploymentRec = record.load({
					type: 'scriptdeployment',
					id: 4054
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
					fieldId: 'custscript_from_date_v2',
					value: new Date(d_from_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_to_date_v2',
					value: new Date(d_to_date)
				});

				deploymentRec.setValue({
					fieldId: 'custscript_bill_cycle_count_v2',
					value: i_cycle_cnt
				});
				//========================================
				deploymentRec.save();
			}
		}

		function searchTransaction(customer, todate, fromdate, paymentMode, invoiceType, currency, subsidiary, terms) {
			try{
				var searchDetails = [];
				var filters = [];
				var columns = [];
				columns.push(search.createColumn({
					name: "custbody_mhl_invoice_vid_number",
					summary: "GROUP",
					label: "VID Number"
				}));
				columns.push(search.createColumn({
					name: "amountremaining",
					summary: "MAX",
					label: "Amt Remaining"
				}));
				columns.push(search.createColumn({
					name: "trandate",
					summary: "MAX"
				}));
				columns.push(search.createColumn({
					name: "internalid",
					summary: "GROUP",
					label: "Internal ID"
				}));
				columns.push(search.createColumn({
					name: "entity",
					summary: "GROUP"
				}));
				columns.push(search.createColumn({
					name: "amountremaining",
					summary: "MAX"
				}));
				columns.push(search.createColumn({
					name: "formulanumeric",
					summary: "MAX",
					formula: "{fxamount} * {customer.custentity_mhl_cust_copayment_clint_perc}"
				}));
				columns.push(search.createColumn({
					name: "formulatext",
					summary: "MAX",
					formula: "Replace(ns_concat({custrecord_mhl_itd_vid.custrecord_mhl_itd_test_code}), ',' , '<br>-----------<br>')"
				}));
				columns.push(search.createColumn({
					name: "formulatext",
					summary: "MAX",
					formula: "Replace(ns_concat({custrecord_mhl_itd_vid.custrecord_mhl_itd_test_name}), ',' , '<br>-----------<br>')"
				}));
				columns.push(search.createColumn({
					name: "formulatext",
					summary: "MAX",
					formula: "Replace(ns_concat({custrecord_mhl_itd_vid.custrecord_mhl_itd_net_amt}), ',' , '<br>-----------<br>')"
				}));
				columns.push(search.createColumn({
					name: "formulanumeric",
					summary: "SUM",
					formula: "TO_NUMBER({custrecord_mhl_itd_vid.custrecord_mhl_itd_gross_amt})"
				}));
				columns.push(search.createColumn({
					name: "formulanumeric",
					summary: "SUM",
					formula: "TO_NUMBER({custrecord_mhl_itd_vid.custrecord_mhl_itd_discount_amt})"
				}));
				columns.push(search.createColumn({
					name: "custbody_mhl_inv_payment_mode",
					summary: "GROUP"
				}));
				columns.push(search.createColumn({
					name: "formulanumeric",
					summary: "SUM",
					formula: "TO_NUMBER({custrecord_mhl_itd_vid.custrecord_mhl_copay_client_amount})"
				}));
				columns.push(search.createColumn({
					name: "formulatext",
					summary: "MAX",
					formula: "Replace(ns_concat({custrecord_mhl_itd_vid.custrecord_mhl_itd_gross_amt}), ',' , '<br>-----------<br>')"
				}));
				columns.push(search.createColumn({
					name: "formulatext",
					summary: "MAX",
					formula: "Replace(ns_concat({custrecord_mhl_itd_vid.custrecord_mhl_itd_discount_amt}), ',' , '<br>-----------<br>')"
				}));
				columns.push(search.createColumn({
					name: "formulanumeric",
					summary: "SUM",
					formula: "TO_NUMBER({custrecord_mhl_itd_vid.custrecord_amount_in_customer_currency})"
				}));
				columns.push(search.createColumn({
					name: "custrecord_customer_currency",
					join: "CUSTRECORD_MHL_ITD_VID",
					summary: "GROUP",
					label: "Currency"
				}));
				columns.push(search.createColumn({
					name: "formulanumeric",
					summary: "SUM",
					formula: "TO_NUMBER({custrecord_mhl_itd_vid.custrecord_mhl_itd_net_amt})"
				}));
				columns.push(search.createColumn({
			         name: "type",
			         sort: search.Sort.DESC,
			         summary: "GROUP",
			         label: "Record Type"
			      }));
				
				columns.push(search.createColumn({
					name: "location",
					summary: "GROUP",
					label: "ORG"
				}));
				columns.push(search.createColumn({
					name: "cseg_mhl_custseg_un",
					summary: "GROUP",
					label: "UNIT"
				}));
				columns.push(search.createColumn({
					name: "cseg_mhl_locations",
					summary: "GROUP",
					label: "COLLECTION CENTER"
				}));
				columns.push(search.createColumn({
					name: "department",
					summary: "GROUP",
					label: "REVENUE SEGMENT"
				}));
				
				columns.push(search.createColumn({
			         name: "netamount",
			         summary: "SUM",
			         label: "Closing Balance"
			      }));
				log.debug('customer- '+customer.toString()+'#paymentMode- '+paymentMode+'#invoiceType- '+invoiceType+'#currency- '+currency)
				var tranSearch = search.create({
					type: "transaction",
					columns: columns,
					filters: [						
							
							[[["type","anyof","CustInvc"],"AND",
								["name","anyof",customer],"AND",["custbody_mhl_invoice_type","anyof",invoiceType],"AND",["currency","anyof",currency],"AND",["trandate","within",fromdate, todate],"AND",["custbody_mhl_inv_payment_mode","anyof",paymentMode],"AND",["mainline","is","T"]],
								  "OR",
								  [["type","anyof","CustCred"],"AND",["name","anyof",customer],"AND",["currency","anyof",currency],"AND",["mainline","is","T"],"AND",["custbody_mhl_inv_payment_mode","anyof",paymentMode],"AND",["trandate","within",fromdate, todate]]]
							
					]
				});
				
				/*['trandate', 'within', fromdate, todate],
				'AND', ["custrecord_mhl_itd_vid.custrecord_for_print", "is", "T"],
				'AND', ["custrecord_mhl_itd_vid.custrecord_test_cancelled", "is", "F"],
				'AND', ['entity', 'anyof', customer],
				'AND', ['custbody_mhl_inv_payment_mode', 'anyof', paymentMode],
				'AND', ['mainline', 'is', 'T'],
				'AND', ['status', 'anyof', 'CustInvc:A'],
				'AND', ['custbody_mhl_conso_invoice_pilot_run', 'is', 'F'],
				'AND', ['currency', 'anyof', currency],
				'AND', ['custbody_mhl_invoice_type', 'anyof', invoiceType]*/
				
				var pagedData = tranSearch.runPaged({
					pageSize: 1000
				});
				
				var inv_cm_resultCount = tranSearch.runPaged().count;
				log.audit('Invoice CM Search result- '+inv_cm_resultCount);
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