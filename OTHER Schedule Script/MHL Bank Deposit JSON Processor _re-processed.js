/**
 * Module Description
 * 
 * Version    Date            Author           File
 * 1.00       18 Jun 2021     Ganesh      MHL Bank Deposit JSON Processor _re-processed.js
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */

var USAGE_LIMIT = 1500;
var context = nlapiGetContext();
var totalBankAmt = 0;
var amtAdjusted = 0;
var vidNotFoundAmt = 0;

function scheduled(type) {
	try {

		var deplymentId = context.getDeploymentId();

		var searchId = context.getSetting('SCRIPT', 'custscript_mhl_cms_saved_search');
		// Code commented by BSL on 30th nov 2020
		/////var jsonArray = nlapiSearchRecord('file', 'customsearch_bank_deposit_search');
		// End 

		// Code added by BSL on 30th nov 2020
		var jsonArray = nlapiSearchRecord('file', searchId);

		//End
		nlapiLogExecution('DEBUG', 'jsonArray', JSON.stringify(jsonArray));
		if (_logValidation(jsonArray)) {
			for (var t = 0; t < jsonArray.length; t++) {
				nlapiLogExecution('DEBUG', '=============Start===================', "=============Start=================");

				var allCols = jsonArray[t].getAllColumns();
				nlapiLogExecution('DEBUG', 'content', jsonArray[t].getId());
				nlapiLogExecution('DEBUG', 'Date', jsonArray[t].getValue(allCols[2]));

				var tranDate = jsonArray[t].getValue(allCols[2]);
				var fileObj = nlapiLoadFile(jsonArray[t].getId());
				var value = fileObj.getValue();
				//nlapiLogExecution('DEBUG','content',value);
				var tempJsonObj = JSON.parse(value)
				processJson(tempJsonObj, fileObj, jsonArray[t].getId(), tranDate);
				checkGovernance(context);

				nlapiLogExecution('DEBUG', '=============END===================', "==============END================");

			}
			nlapiLogExecution('DEBUG', 'Script starts rescheduling', "script rescheduling");
			// Code commented by BSL on 30th nov 2020

			//var sch_script = nlapiScheduleScript('customscript_bank_deposit_json_reproces', 'customdeploy_bank_deposit_json_reproces', null);
			//End
			// Code added by BSL on 30th nov 2020
			//if (deplymentId != 'customdeploy5')

			var sch_script = nlapiScheduleScript('customscript_bank_deposit_json_reproces', deplymentId, null);
			//End

			nlapiLogExecution('DEBUG', 'sch_script', sch_script);
		}
	} catch (e) {
		nlapiLogExecution('DEBUG', 'Error', e);
		nlapiLogExecution('DEBUG', 'Error - Script starts rescheduling', "script rescheduling");

		var bankId = tempJsonObj.requestObject.bankDepositVO.bankId;
		var locationId = tempJsonObj.requestObject.bankDepositVO.locationId;
		var recieptNo = tempJsonObj.requestObject.bankDepositVO.receiptNumber;

		// Code commented by BSL on 30th nov 2020

		////var sch_script = nlapiScheduleScript('customscript_bank_deposit_json_reproces', 'customdeploy_bank_deposit_json_reproces', null);
		// End
		// Code added by BSL on 30th nov 2020
		//if (deplymentId != 'customdeploy5')
		createRnIRecord(e, fileObj, recieptNo, locationId, bankId)
		fileObj.setFolder('225308'); //Bank Deposit manual error
		nlapiSubmitFile(fileObj);
		var sch_script = nlapiScheduleScript('customscript_bank_deposit_json_reproces', deplymentId, null);
		// End
		nlapiLogExecution('DEBUG', 'sch_script', sch_script);
	}
}

function searchExistingDeposit(recieptNo) {
	if (_logValidation(recieptNo)) {

		var depositSearch = nlapiSearchRecord("deposit", null, [
			["type", "anyof", "Deposit"],
			"AND", ["memo", "is", recieptNo],
			"OR", ["custbody_mhl_cms_receipt_number", "is", recieptNo]
		], [
			new nlobjSearchColumn("internalid")
		]);
		if (_logValidation(depositSearch))
			return true;
		else return false;
	} else return false;
}

function processJson(json, fileObj, fileInternalId, tranDateTemp) {
	try {
		vidNotFoundAmt = 0;
		totalBankAmt = 0;
		amtAdjusted = 0;
		var JSONObj = json;
		var defaultArAcc = '1406';

		//getCompanyCurrentDateTime(paramDate)

		// 15th March added code to get time from json file
		var deplymentId = context.getDeploymentId();
		if (deplymentId == 'customdeploy7' || deplymentId == 'customdeploy10') {

			tranDateTemp = JSONObj.requestObject.bankDepositVO.createdTime;

			var fileDate = getCompanyCurrentDateTime(tranDateTemp);
		} else {
			var fileDate = tranDateTemp // nlapiDateToString(tranDateTemp);
				//var fileDate = getCompanyCurrentDateTime(new Date(tranDateTemp));
		}

		//
		nlapiLogExecution('DEBUG', 'fileDate ', fileDate);

		var bankId = JSONObj.requestObject.bankDepositVO.bankId;
		var locationId = JSONObj.requestObject.bankDepositVO.locationId;
		var recieptNo = JSONObj.requestObject.bankDepositVO.receiptNumber;
		recieptNo = recieptNo.toString();
		if (_logValidation(searchExistingDeposit(recieptNo))) {
			nlapiLogExecution('DEBUG', 'Duplicate file.');
			createRnIRecord('Duplicate file ', fileObj, recieptNo, locationId, bankId)
			fileObj.setFolder('66199'); //  Bank Deposit manual Process
			nlapiSubmitFile(fileObj);
			return;
		}

		totalBankAmt = Number(JSONObj.requestObject.bankDepositVO.amount);


		var vidAmtTotal = 0;
		var customerAdvance = 0;

		nlapiLogExecution('DEBUG', 'bankId', bankId);

		var locFilter = [];
		var locCols = [];

		// following code disabled by Ganesh - 30-07-2021
		/* var index_val = wrong_locations.indexOf(locationId);
		locationId = correct_locations[index_val];

		// Code added by Kailas on 3rd Dec 2020

		if (_logValidation(locationId))
			locationId = locationId.toString();
		else {
			locationId = JSONObj.requestObject.bankDepositVO.locationId;
			locationId = locationId.toString();
		}
		// End */

		
		//locFilter.push(new nlobjSearchFilter('custrecord_mhl_location_id', null, 'is', locationId));
		
		// This Code snippet added by Ganesh. - 30-07-2021
		var s_locationCode = JSONObj.requestObject.locationCode;		
		var limsLocId = JSONObj.requestObject.lims_location_id;
		nlapiLogExecution("Debug","JSON Locations details","limsLocId "+limsLocId+" | s_locationCode "+s_locationCode+" | locationId "+locationId);		
		
		locFilter.push(new nlobjSearchFilter('custrecord_mhl_loc_code', null, 'is', s_locationCode));  //for location code.
		locFilter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
		locCols.push(new nlobjSearchColumn('custrecord_mhl_loc_org'));

		var locSearch = nlapiSearchRecord('customrecord_cseg_mhl_locations', null, locFilter, locCols);
		nlapiLogExecution('DEBUG', 'locSearch mhl_locations', JSON.stringify(locSearch));

		if (locSearch) {
			var locId = locSearch[0].getId();
			var orgId = locSearch[0].getValue('custrecord_mhl_loc_org');
			//nlapiLogExecution('DEBUG', 'orgId 74', orgId);

			var orgDetails = nlapiLookupField('location', orgId, ['cseg_mhl_custseg_un', 'custrecord_mhl_ref_sbu']);
			nlapiLogExecution('DEBUG', 'orgDetails for '+orgId, orgDetails);
			var filter = [];
			var col = [];
			filter[0] = new nlobjSearchFilter('custrecord_mhl_bank_id_rni', null, 'equalto', bankId);
			filter[1] = new nlobjSearchFilter('custrecord_payment_org', null, 'anyof', orgId);
			filter[2] = new nlobjSearchFilter('custrecord_mhl_type_of_bank_mapping', null, 'anyof', 1);
			filter[3] = new nlobjSearchFilter('isinactive', null, 'is', 'F');

			col[0] = new nlobjSearchColumn('custrecord_payment_account');

			var searchAccount = nlapiSearchRecord('customrecord_payment_account_mapping', null, filter, col);
			nlapiLogExecution('DEBUG', 'searchAccount', JSON.stringify(searchAccount));

			if (searchAccount) {
				checkGovernance(context)
					//nlapiLogExecution('DEBUG', '92');

				var jsonFile = {
					vidNumber: [],
					amount: [],
					adjusted: []
				}

				// Customer Advance Process

				var advance = JSONObj.requestObject.inwardTransactions;
				var tempArray = [];
				if (advance) {

					if (Array.isArray(advance)) {
						tempArray = advance;
					} else {
						tempArray.push(advance);
					}
				}

				var clientCode = [];
				var internalIdClient = [];
				var clientAcc = [];
				var advanceAmt = [];

				for (var ad in tempArray) {
					clientCode.push(tempArray[ad].clientCode);
					advanceAmt.push(tempArray[ad].amount);
				}

				//Search Client by client Code

				var filter = [];
				var cols = [];



				for (var k in clientCode) {
					filter.push(new nlobjSearchFilter('entityid', null, 'is', clientCode[k]).setOr(true));
				}

				var customerSearch = nlapiSearchRecord("customer", null, filter, [new nlobjSearchColumn("receivablesaccount"),
					new nlobjSearchColumn("entityid")
				]);

				if (customerSearch) {

					for (var g in clientCode) {
						var custFound = 0;
						for (var l in customerSearch) {
							if (clientCode[g] == customerSearch[l].getValue('entityid')) {
								internalIdClient[g] = customerSearch[l].getId();
								clientAcc[g] = customerSearch[l].getValue('receivablesaccount');
								custFound = 1;
								break;
							}
						}
						if (custFound == 0) {
							vidNotFoundAmt = Number(vidNotFoundAmt) + Number(advanceAmt[g]);
						}
					}

				}

				var account = searchAccount[0].getValue('custrecord_payment_account');
				nlapiLogExecution('DEBUG', 'account', account);

				var depositRecord = nlapiCreateRecord('deposit');
				depositRecord.setFieldValue('account', account);
				/*if (advance.length > 0)
					depositRecord.setFieldValue('custbody_deposit_contain_advance', 'T');*/

				depositRecord.setFieldValue('location', orgId);
				depositRecord.setFieldValue('cseg_mhl_locations', locId);

				depositRecord.setFieldValue('cseg_mhl_custseg_un', orgDetails['cseg_mhl_custseg_un']);
				depositRecord.setFieldValue('class', orgDetails['custrecord_mhl_ref_sbu']);

				depositRecord.setFieldValue('memo', recieptNo.toString());
				depositRecord.setFieldValue('custbody_mhl_cms_receipt_number', recieptNo.toString());
				depositRecord.setFieldValue('externalid', 'cms_'+recieptNo.toString());
				depositRecord.setFieldValue('trandate', fileDate);
				depositRecord.setFieldValue('custbody_mhl_cms_bank_deposit_entry', 'T');

				var paymentJson = {
					amount: [],
					internalId: []
				};

				var vidArray = [];
				var vidInvArray = [];
				var amount = [];

				for (var t in JSONObj.requestObject.vidTansactions) {
					jsonFile.vidNumber.push(JSONObj.requestObject.vidTansactions[t].vid);
					jsonFile.amount.push(JSONObj.requestObject.vidTansactions[t].amount);
					jsonFile.adjusted.push(1);
				}

				jsonFile = adjustVIDInDeposit(jsonFile, account, recieptNo, fileDate);

				//if (deplymentId == 'customdeploy10') {
				for (var f in jsonFile.vidNumber) {
					//if (jsonFile.amount[f] > 0) {
					//nlapiLogExecution('DEBUG', '198');

					vidArray.push(jsonFile.vidNumber[f]);
					vidInvArray.push("inv_"+jsonFile.vidNumber[f]);
					amount.push(jsonFile.amount[f]);
					//}
				}
				//} 
				/*else {
					for (var f in jsonFile.vidNumber) {
						if (jsonFile.amount[f] > 0) {
							//nlapiLogExecution('DEBUG', '198');

							vidArray.push(jsonFile.vidNumber[f]);
							amount.push(jsonFile.amount[f]);
						}
					}
				}*/

				if (vidArray) {
					var filt = [];
					var cols = [];

					cols[0] = new nlobjSearchColumn('entity', null, 'GROUP');
					cols[1] = new nlobjSearchColumn('receivablesaccount', 'customer', 'GROUP');
					cols[2] = new nlobjSearchColumn('internalid', null, 'GROUP');
					cols[3] = new nlobjSearchColumn('custbody_mhl_invoice_vid_number', null, 'GROUP');
					cols[4] = new nlobjSearchColumn('type', null, 'GROUP');
					cols[5] = new nlobjSearchColumn('internalId', null, 'GROUP');

					filt[0] = new nlobjSearchFilter('mainline', null, 'is', 'T').setOr(false);
					if(vidInvArray)
					{
						filt[1] = new nlobjSearchFilter('externalid', null, 'anyof', vidInvArray).setOr(true);
					}
					else
					{
						nlapiLogExecution('DEBUG', 'vidInvArray is empty for Externalid Filter');
					}

				/* 	for (var k in vidArray) {
						filt.push(new nlobjSearchFilter('custbody_mhl_invoice_vid_number', null, 'is', vidArray[k]).setOr(true));
					}
			 */		
				/* 	var fltJSON = [];
					for (var k in vidArray) {
						fltJSON.push(["custbody_mhl_invoice_vid_number","is", vidArray[k]]);
						fltJSON.push("OR");
					}
					fltJSON.pop();
					
					filt.push(fltJSON); */

					var invoiceSearch = nlapiSearchRecord('invoice', null, filt, cols);
					nlapiLogExecution('DEBUG', 'invoiceSearch', invoiceSearch);
				}

				//if(invoiceSearch && invoiceSearch.length==vidArray.length)
				var VIDRefRecIDArray = [];

				var customerViseAmt = {
					customer: [],
					arAcc: [],
					amount: [],
					vids: []
				};
				if (invoiceSearch) {

					for (var v in vidArray) {
						var found = 1;
						for (var d in invoiceSearch) {
							checkGovernance(context)

							var allCols = invoiceSearch[d].getAllColumns();
							if (vidArray[v] == invoiceSearch[d].getValue(allCols[3]) && invoiceSearch[d].getValue(allCols[4]) == 'CustInvc') {

								paymentJson.internalId.push(invoiceSearch[d].getValue(allCols[2]));
								paymentJson.amount.push(amount[v]);

								vidAmtTotal = Number(vidAmtTotal) + Number(amount[v]);

								var customerId = invoiceSearch[d].getValue(allCols[0]);
								var arAcount = invoiceSearch[d].getValue(allCols[1]);
								if (!_logValidation(arAcount))
									nlapiLogExecution('DEBUG', 'customerId', 'customerId ==> ' + customerId + 'arAcount ==> ' + arAcount + 'invoiceSearchId ==>  ' + invoiceSearch[d].getValue(allCols[5]))
								var pos = findPosition(customerViseAmt, customerId);

								//if (deplymentId == 'customdeploy10') {
								if (Number(amount[v]) < 0) {
									pos = -1;
								}
								//}

								if (pos > -1) {
									customerViseAmt.amount[pos] = Number(customerViseAmt.amount[pos]) + Number(amount[v]);
									customerViseAmt.vids[pos] = customerViseAmt.vids[pos] + ',' + vidArray[v];
									//customerViseAmt.vids[pos] = vidArray[v];
									//nlapiLogExecution('DEBUG', 'vidArray[v] in if ', vidArray[v]);

									var VIDRefRec = nlapiCreateRecord('customrecord_mhl_deposited_vid_child');
									VIDRefRec.setFieldValue('custrecord_mhl_deposit_vid', vidArray[v])
									VIDRefRec.setFieldValue('custrecord_mhl_vid_customer', customerId)
									VIDRefRec.setFieldValue('custrecord_mlh_cms_vid_amount', amount[v])
									var VIDRefRecId = nlapiSubmitRecord(VIDRefRec);
									VIDRefRecIDArray.push(VIDRefRecId)

								} else {

									customerViseAmt.customer.push(customerId);
									customerViseAmt.amount.push(Number(amount[v]));
									customerViseAmt.arAcc.push(arAcount);
									customerViseAmt.vids.push(vidArray[v]);

									var VIDRefRec = nlapiCreateRecord('customrecord_mhl_deposited_vid_child');
									VIDRefRec.setFieldValue('custrecord_mhl_deposit_vid', vidArray[v])
									VIDRefRec.setFieldValue('custrecord_mhl_vid_customer', customerId)
									VIDRefRec.setFieldValue('custrecord_mlh_cms_vid_amount', amount[v])
									var VIDRefRecId = nlapiSubmitRecord(VIDRefRec);
									VIDRefRecIDArray.push(VIDRefRecId)

									//nlapiLogExecution('DEBUG', 'vidArray[v] in else ', vidArray[v]);

								}

								found = 0
								break;
							}
						}

						if (found == 1) {
							vidNotFoundAmt = Number(vidNotFoundAmt) + Number(amount[v]);

							//CR 15 Feb 2021
							var VIDRefRec = nlapiCreateRecord('customrecord_mhl_deposited_vid_child');
							VIDRefRec.setFieldValue('custrecord_mhl_deposit_vid', vidArray[v])
								//VIDRefRec.setFieldValue('custrecord_mhl_vid_customer', customerId)
							VIDRefRec.setFieldValue('custrecord_mlh_cms_vid_amount', amount[v])
							var VIDRefRecId = nlapiSubmitRecord(VIDRefRec);
							VIDRefRecIDArray.push(VIDRefRecId)

						}
					}

				}

				// Creating Customer Details for CMS Transaction records
				nlapiLogExecution('DEBUG', 'customerViseAmt', JSON.stringify(customerViseAmt));

				for (var cu in customerViseAmt.customer) {
					//nlapiLogExecution('DEBUG', '270');
					var entity = customerViseAmt.customer[cu];
					//nlapiLogExecution('DEBUG', 'entity', 'entity 320 =>>>   ' + entity);

					depositRecord.selectNewLineItem('other');
					depositRecord.setCurrentLineItemValue('other', 'account', customerViseAmt.arAcc[cu]);
					depositRecord.setCurrentLineItemValue('other', 'entity', entity);
					depositRecord.setCurrentLineItemValue('other', 'amount', customerViseAmt.amount[cu]);
					depositRecord.setCurrentLineItemValue('other', 'location', orgId);
					depositRecord.setCurrentLineItemValue('other', 'cseg_mhl_locations', locId);
					//depositRecord.setCurrentLineItemValue('other', 'memo', customerViseAmt.vids[cu]);

					depositRecord.setCurrentLineItemValue('other', 'class', orgDetails['custrecord_mhl_ref_sbu']);

					depositRecord.commitLineItem('other');

					/*var VIDRefRec = nlapiCreateRecord('customrecord_mhl_deposited_vid_child');
					VIDRefRec.setFieldValue('custrecord_mhl_deposit_vid', customerViseAmt.vids[cu])
					VIDRefRec.setFieldValue('custrecord_mhl_vid_customer', entity)
					var VIDRefRecId = nlapiSubmitRecord(VIDRefRec);
					VIDRefRecIDArray.push(VIDRefRecId)*/
					//vidAmtTotal=Number(vidAmtTotal)+customerViseAmt.amount[cu];
				}

				for (var cu in clientCode) {
					if (internalIdClient[cu]) {

						var filter = [];
						filter[0] = new nlobjSearchFilter('localizedname', null, 'is', clientAcc[cu]);
						var accountSearch = nlapiSearchRecord('account', null, filter, null);

						if (accountSearch) {
							//nlapiLogExecution('DEBUG', '296');

							depositRecord.selectNewLineItem('other');
							depositRecord.setCurrentLineItemValue('other', 'account', accountSearch[0].getId());
							nlapiLogExecution('DEBUG', 'clientAcc[cu]', clientAcc[cu]);

							depositRecord.setCurrentLineItemValue('other', 'entity', internalIdClient[cu]);
						//	nlapiLogExecution('DEBUG', 'entity', 'entity 352 =>>>   ' + internalIdClient[cu]);

							depositRecord.setCurrentLineItemValue('other', 'amount', advanceAmt[cu]);
							depositRecord.setCurrentLineItemValue('other', 'location', orgId);
							depositRecord.setCurrentLineItemValue('other', 'cseg_mhl_locations', locId);
							depositRecord.setCurrentLineItemValue('other', 'class', orgDetails['custrecord_mhl_ref_sbu']);

							depositRecord.commitLineItem('other');

							customerAdvance = Number(customerAdvance) + Number(advanceAmt[cu]);
						}
					}
				}

				nlapiLogExecution('DEBUG', 'vidAmtTotal', vidAmtTotal +" "+customerAdvance);
				//nlapiLogExecution('DEBUG', 'customerAdvance', customerAdvance);

				//nlapiLogExecution('DEBUG', 'Line Org', depositRecord.getLineItemValue('other', 'location', 1));

				var totalAmt = Number(vidAmtTotal) + Number(customerAdvance);
				nlapiLogExecution('DEBUG', 'totalAmt', totalAmt+ " Line Org"+ depositRecord.getLineItemValue('other', 'location', 1));

				if (Number(totalAmt) == 0) {

					nlapiLogExecution('DEBUG', 'Total amount zero');
					createRnIRecord('Total amount zero ', fileObj, recieptNo, locationId, bankId)
					fileObj.setFolder('75720');
					nlapiSubmitFile(fileObj);
				}
				if (vidNotFoundAmt > 0) {
					nlapiLogExecution('DEBUG', 'vidNotFoundAmt======', vidNotFoundAmt);
					//nlapiLogExecution('DEBUG', '327');
					depositRecord.selectNewLineItem('other');
					depositRecord.setCurrentLineItemValue('other', 'account', defaultArAcc);
					depositRecord.setCurrentLineItemValue('other', 'amount', vidNotFoundAmt);
					depositRecord.setCurrentLineItemValue('other', 'location', orgId);
					depositRecord.setCurrentLineItemValue('other', 'cseg_mhl_locations', locId);
					depositRecord.setCurrentLineItemValue('other', 'class', orgDetails['custrecord_mhl_ref_sbu']);
					depositRecord.commitLineItem('other');
				}

				if (depositRecord.getLineItemCount('other') > 0) {

					depositRecord.setFieldValue('custbody_rni_deposit_file', fileInternalId);
					/*var totalDepAmt = depositRecord.getFieldValue('total')
					if (Number(depositAmt) != Number(totalBankAmt))
						depositRecord.setFieldValue('custbody_amount_matching_in_json', 'T');

					if (advance.length > 0)
						depositRecord.setFieldValue('custbody_deposit_contain_advance', 'T');*/

					var depositId = nlapiSubmitRecord(depositRecord, true, true);

					nlapiLogExecution('Audit', 'depositId', depositId);
					depositRecord = null;
					updateVID(depositId, paymentJson, account, recieptNo, fileDate);

					if (depositId) {

						var VIDRefParentRec = nlapiCreateRecord('customrecord_mhl_deposited_vids_ref');
						VIDRefParentRec.setFieldValue('custrecord_mhl_deposit_id', depositId);
						var VIDRefParentRecId = nlapiSubmitRecord(VIDRefParentRec);

						if (VIDRefParentRecId) {
							for (var hh = 0; hh < VIDRefRecIDArray.length; hh++) {
								nlapiSubmitField('customrecord_mhl_deposited_vid_child', VIDRefRecIDArray[hh], 'custrecord_mhl_parent_rec_id', VIDRefParentRecId)
							}
						}
						nlapiSubmitField('deposit', depositId, 'custbody_mhl_vid_ref_rec', VIDRefParentRecId)

						fileObj.setFolder('225306');
						nlapiSubmitFile(fileObj);
					}
				}
			}
			// If account not found error
			else {
				nlapiLogExecution('DEBUG', 'Account not found in Payment Account Mapping record');
				createRnIRecord('Account not found in Payment Account Mapping record ', fileObj, recieptNo, locationId, bankId)
				fileObj.setFolder('38689');
				nlapiSubmitFile(fileObj);
			}
		} else {
			nlapiLogExecution('DEBUG', 'Location not found');
			createRnIRecord('Location not found ', fileObj, recieptNo, locationId, bankId)
			fileObj.setFolder('225308');
			nlapiSubmitFile(fileObj);
		}

	} catch (e) {
		nlapiLogExecution('DEBUG', 'Error', e);
		createRnIRecord(e, fileObj, recieptNo, locationId, bankId)
		fileObj.setFolder('225308');
		nlapiSubmitFile(fileObj);
	}
}

function createRnIRecord(e, fileObj, recieptNo, locationId, bankId) {
	var rnIRec = nlapiCreateRecord('customrecord_rni_integration_status');

	rnIRec.setFieldValue('custrecord_json_type', '7');
	rnIRec.setFieldValue('custrecord_error_description', e.toString());
	rnIRec.setFieldValue('custrecord_json_file', fileObj.getName());
	rnIRec.setFieldValue('custrecord_processed', '2');
	rnIRec.setFieldValue('custrecord_mhl_deposit_receipt_number', recieptNo);
	rnIRec.setFieldValue('custrecord_mhl_bank_transfer_org', locationId);
	rnIRec.setFieldValue('custrecord_mhl_bank_deposit_bank_id', bankId);
	nlapiSubmitRecord(rnIRec);
	rnIRec = null;
}

function checkGovernance(context) {
	//nlapiLogExecution('debug','checkGovernance','checking governance');

	if (context.getRemainingUsage() < USAGE_LIMIT) {

		var state = nlapiYieldScript();

		if (state.status == 'FAILURE') {
			nlapiLogExecution("ERROR", "Failed to yield script, exiting: Reason = " + state.reason + " / Size = " + state.size);
			throw "Failed to yield script";
		} else if (state.status == 'RESUME') {
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason + ".  Size = " + state.size);
		}

	}
}

function findPosition(customerViseAmt, customer) {
	for (var e in customerViseAmt.customer) {
		if (customerViseAmt.customer[e] == customer) {
			return e;
		}
	}
	return -1;
}

function updateVID(depositId, paymentJson, accountId, recieptNo, tranDate) {
	for (var t in paymentJson.internalId) {
		checkGovernance(context);
		//nlapiLogExecution('DEBUG', 'paymentJson.internalId[t]', paymentJson.internalId[t]);
		var payRec = nlapiTransformRecord('invoice', paymentJson.internalId[t], 'customerpayment');

		payRec.setFieldValue('undepfunds', 'F');
		payRec.setFieldValue('account', accountId);
		payRec.setFieldValue('memo', recieptNo);
		payRec.setFieldValue('trandate', tranDate);
		payRec.setFieldValue('autoapply', 'F');
		payRec.setFieldValue('custbody_mhl_cms_bank_deposit_entry', 'T');

		var lineCnt = payRec.getLineItemCount('apply');
		var creditCount = payRec.getLineItemCount('credit');

		var flag = 0;
		var amountToAdjust = Number(paymentJson.amount[t]);
		for (var e = 1; e <= creditCount; e++) {
			var depositIdLine = payRec.getLineItemValue('credit', 'internalid', e);
			if (depositIdLine == depositId) {
				var depositAmt = payRec.getLineItemValue('credit', 'due', e);
				if (Number(depositAmt) >= Number(amountToAdjust)) {
					payRec.setLineItemValue('credit', 'apply', e, 'T');
					payRec.setLineItemValue('credit', 'amount', e, amountToAdjust);

				}
				if (Number(depositAmt) < Number(amountToAdjust)) {
					payRec.setLineItemValue('credit', 'apply', e, 'T');
					payRec.setLineItemValue('credit', 'amount', e, depositAmt);
				}
				amountToAdjust = Number(amountToAdjust) - Number(depositAmt);
				if (amountToAdjust <= 0) {
					flag++;
					break;
				}
			}
		}

		for (var j = 1; j <= lineCnt; j++) {
			var applyCheck = payRec.getLineItemValue('apply', 'apply', j);
			if (applyCheck == 'T') {
				payRec.setLineItemValue('apply', 'amount', j, paymentJson.amount[t]);
				flag++;
				break;
			}
		}

		if (flag == 2) {
			var payId = nlapiSubmitRecord(payRec, true, true);
			nlapiLogExecution('DEBUG', 'updateVID | payRec', payId);
			payRec = null;
		}
		//payRec = null;
	}
}

function _logValidation(value) {
	if (value != 'null' && value != '' && value != undefined && value != 'NaN' && value != 'undefined' && value != '- None -') {
		return true;
	} else {
		return false;
	}
}

function adjustVIDInDeposit(jsonFile, accountId, recieptNo, tranDate) {
	//nlapiLogExecution('DEBUG', 'jsonFile 673', JSON.stringify(jsonFile));

	for (var t in jsonFile.vidNumber) {
		checkGovernance(context);
		var filt = [];
		var cols = [];
		filt[0] = new nlobjSearchFilter('mainline', null, 'is', 'T');
		filt[1] = new nlobjSearchFilter('trandate', null, 'onorafter', '1/10/2020');
		
		if(jsonFile.vidNumber[t])
		{
			filt[2] = new nlobjSearchFilter('custbody_mhl_invoice_vid_number', null, 'is', jsonFile.vidNumber[t]);			
		}
		else
		{
    		nlapiLogExecution('DEBUG', 'vidNumber is empty for VID number Filter');
		}
		
		var invoiceSearch = nlapiSearchRecord('invoice', null, filt, cols);

		if (invoiceSearch) {
			var invId = invoiceSearch[0].getId();
			//nlapiLogExecution('DEBUG', 'invId', invId);
			var payRec = nlapiTransformRecord('invoice', invId, 'customerpayment');

			payRec.setFieldValue('undepfunds', 'F');
			payRec.setFieldValue('account', accountId);
			payRec.setFieldValue('memo', recieptNo);
			payRec.setFieldValue('trandate', tranDate);
			payRec.setFieldValue('autoapply', 'F');
			payRec.setFieldValue('custbody_mhl_cms_bank_deposit_entry', 'T');

			var lineCnt = payRec.getLineItemCount('apply');
			var creditCount = payRec.getLineItemCount('credit');
			var flag = 0;
			for (var j = 1; j <= lineCnt; j++) {
				var applyCheck = payRec.getLineItemValue('apply', 'apply', j);
				if (applyCheck == 'T') {
					payRec.setLineItemValue('apply', 'amount', j, jsonFile.amount[t]);
					amtAdjusted = Number(amtAdjusted) + Number(jsonFile.amount[t]);
					flag = flag + 1;
					//nlapiLogExecution('DEBUG', 'flag 495', flag);

					break;
				}
			}

			var amountToAdjust = Number(jsonFile.amount[t]);
			/*for(var e=1;e<=creditCount;e++)
			{

				var depositAmount=payRec.getLineItemValue('credit','due',e);
				

				if(jsonFile.amount[t]>0 && tranType=='Deposit')
				{
					payRec.setLineItemValue('credit','apply',e,'T');
					flag=flag+1;
					nlapiLogExecution('DEBUG','flag 509',flag);

					jsonFile.amount[t]=Number(jsonFile.amount[t])-Number(depositAmount);
					
				}
				if(jsonFile.amount[t]<=0)
				{
					break;
				}
			}*/

			for (var e = 1; e <= creditCount; e++) {
				checkGovernance(context);
				var internalId = payRec.getLineItemValue('credit', 'internalid', e);
				var tranType = payRec.getLineItemValue('credit', 'trantype', e);
				//nlapiLogExecution('audit', 'tranTypeeeeee', tranType);
				//var tranType = nlapiLookupField('transaction', internalId, 'type');
				//nlapiLogExecution('DEBUG','tranType',tranType);
				if (tranType == 'Deposit') {
					var depositAmt = payRec.getLineItemValue('credit', 'due', e);
					if (Number(depositAmt) >= Number(amountToAdjust)) {
						payRec.setLineItemValue('credit', 'apply', e, 'T');
						payRec.setLineItemValue('credit', 'amount', e, amountToAdjust);

					}
					if (Number(depositAmt) < Number(amountToAdjust)) {
						payRec.setLineItemValue('credit', 'apply', e, 'T');
						payRec.setLineItemValue('credit', 'amount', e, depositAmt);
					}
					amountToAdjust = Number(amountToAdjust) - Number(depositAmt);
					if (amountToAdjust <= 0) {
						flag++;
						break;
					}
				}
			}

		//	nlapiLogExecution('DEBUG', t+' flag 760 ', flag);

			if (flag > 1) {
				var payId = nlapiSubmitRecord(payRec, true, true);
				//nlapiLogExecution('DEBUG', 'payRec', payId);
				payRec = null;
				nlapiLogExecution('DEBUG', 'totalBankAmt', totalBankAmt+ " payId "+payId);

				if (Number(jsonFile.amount[t]) > 0) {
					jsonFile.adjusted[t] = 1;
				} else {
					jsonFile.adjusted[t] = 0;
				}

			}
			payRec = null;
		}

	}
	nlapiLogExecution('DEBUG', 'jsonFile 779', JSON.stringify(jsonFile));

	return jsonFile;
}

function getCompanyCurrentDateTime(paramDate) {

	var currentDateTime = new Date(paramDate);
	currentDateTime.setHours(currentDateTime.getHours() - 13.5)
		//var companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
	var companyTimeZone = '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi';
	//var companyTimeZone = '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi';
	var timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
	var UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
	var companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
	return new Date(companyDateTime);
}

function _logValidation(value) {
	if (value != 'null' && value != '' && value != undefined && value != 'NaN' && value != 'undefined' && value != '- None -') {
		return true;
	} else {
		return false;
	}
}