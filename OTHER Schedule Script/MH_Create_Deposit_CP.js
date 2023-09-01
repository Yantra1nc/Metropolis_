/**
 * Module Description
 * 
 * Version    Date            Author           File
 * 1.00       31 Jul 2020     ONKARS4       MH_Create_Deposit_CP.js
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

        var searchId = context.getSetting('SCRIPT', 'custscript3');
        // Code commented by Kailas on 30th nov 2020
        /////var jsonArray = nlapiSearchRecord('file', 'customsearch_bank_deposit_search');
        // End 

        // Code added by Kailas on 30th nov 2020
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
            // Code commented by Kailas on 30th nov 2020

            //var sch_script = nlapiScheduleScript('customscript_mh_create_log_to_check_err', 'customdeploy_bank_deposit_json_processor', null);
            //End
            // Code added by Kailas on 30th nov 2020
            //if (deplymentId != 'customdeploy5')

          //  var sch_script = nlapiScheduleScript('customscript_mh_create_log_to_check_err', deplymentId, null);
            //End

        //    nlapiLogExecution('DEBUG', 'sch_script', sch_script);
        }
    } catch (e) {
        nlapiLogExecution('error', 'Error', e);
        nlapiLogExecution('DEBUG', 'Error - Script starts rescheduling', "script rescheduling");

        var bankId = tempJsonObj.requestObject.bankDepositVO.bankId;
        var locationId = tempJsonObj.requestObject.bankDepositVO.locationId;
        var recieptNo = tempJsonObj.requestObject.bankDepositVO.receiptNumber;

        // Code commented by Kailas on 30th nov 2020

        ////var sch_script = nlapiScheduleScript('customscript_mh_create_log_to_check_err', 'customdeploy_bank_deposit_json_processor', null);
        // End
        // Code added by Kailas on 30th nov 2020
        //if (deplymentId != 'customdeploy5')
        createRnIRecord(e, fileObj, recieptNo, locationId, bankId)
        fileObj.setFolder('712');
        nlapiSubmitFile(fileObj);
        var sch_script = nlapiScheduleScript('customscript_mh_create_log_to_check_err', deplymentId, null);
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
        var defaultArAcc = 1406;

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
            fileObj.setFolder('66199');
            nlapiSubmitFile(fileObj);
            return;
        }

        totalBankAmt = Number(JSONObj.requestObject.bankDepositVO.amount);

      
        var vidAmtTotal = 0;
        var customerAdvance = 0;

        nlapiLogExecution('DEBUG', 'bankId', bankId);

        var locFilter = [];
        var locCols = [];

        /*****  We will remove above hardcoded values  for location */
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
      //  nlapiLogExecution("debug", "JSON Locations details", "limsLocId " + limsLocId + " | s_locationCode " + s_locationCode + " | locationId " + locationId);
        if (s_locationCode) {
            locFilter.push(new nlobjSearchFilter('custrecord_mhl_loc_code', null, 'is', s_locationCode)); //for location code.
            locFilter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
            locCols.push(new nlobjSearchColumn('custrecord_mhl_loc_org'));
			locCols.push(new nlobjSearchColumn('custrecord_mhl_org_id'));

            var locSearch = nlapiSearchRecord('customrecord_cseg_mhl_locations', null, locFilter, locCols);
            nlapiLogExecution('DEBUG', 'locSearch', JSON.stringify(locSearch));

            if (locSearch) {
                var locId = locSearch[0].getId();
                var orgId = locSearch[0].getValue('custrecord_mhl_loc_org');
				 var orgInterId= locSearch[0].getValue('custrecord_mhl_org_id');
                nlapiLogExecution('DEBUG', '74', orgId);

                var orgDetails = nlapiLookupField('location', orgId, ['cseg_mhl_custseg_un', 'custrecord_mhl_ref_sbu']);
                nlapiLogExecution('DEBUG', 'orgDetails for ' + orgId, orgDetails);
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
                        adjusted: [],
						CustCode: [],
						v_org_id:[]
						
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
					var OrigID=[];
                    var internalIdClient = [];
                    var clientAcc = [];
                    var advanceAmt = [];
					nlapiLogExecution('DEBUG', 'befor tempArray', tempArray);
                    for (var ad in tempArray) {
                        clientCode.push(tempArray[ad].clientCode);
                        advanceAmt.push(tempArray[ad].amount);
						OrigID.push(tempArray[ad].orgId)
                    }
				
                    //Search Client by client Code
                    var filter = [];
                    var cols = [];
					if (advance)
					{
                    for (var k in clientCode) {
						// add on 17/11/2021
						var clientId ='';
						if(clientCode[k]=="GENERAL")
						{
							clientId=clientCode[k]+OrigID[k];
							
						}else{
							clientId=clientCode[k];
							
						}
                        filter.push(new nlobjSearchFilter('entityid', null, 'is', clientId).setOr(true));
                    }
				nlapiLogExecution('DEBUG', 'befor search record', clientId);
                    var customerSearch = nlapiSearchRecord("customer", null, filter, [new nlobjSearchColumn("receivablesaccount"),
                        new nlobjSearchColumn("entityid")
                    ]);
					nlapiLogExecution('DEBUG', 'customerSearch', JSON.stringify(customerSearch));
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
					}
                    var account = searchAccount[0].getValue('custrecord_payment_account');
                    nlapiLogExecution('DEBUG', 'account', account);
					var vids = JSONObj.requestObject.vidTansactions;
                    
				if (vids) 
				{
					//nlapiLogExecution('audit', 'VID Length', vids.length);
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
                    depositRecord.setFieldValue('externalid', 'cms_' + recieptNo.toString());
                    depositRecord.setFieldValue('trandate', fileDate);
                    depositRecord.setFieldValue('custbody_mhl_cms_bank_deposit_entry', 'T');

                    var paymentJson = {
                        amount: [],
                        internalId: []
                    };

                    var vidArray = [];
                    var vidInvArray = [];
					var vidInvCustCode = [];
					var vorgid=[];
                    var amount = [];

                    for (var t in JSONObj.requestObject.vidTansactions) {
                        jsonFile.vidNumber.push(JSONObj.requestObject.vidTansactions[t].vid);
                        jsonFile.amount.push(JSONObj.requestObject.vidTansactions[t].amount);
						jsonFile.CustCode.push(JSONObj.requestObject.vidTansactions[t].clientCode);
						//added
						jsonFile.v_org_id.push(JSONObj.requestObject.vidTansactions[t].orgId);
                        jsonFile.adjusted.push(1);
                    }
					

                    jsonFile = adjustVIDInDeposit(jsonFile, account, recieptNo, fileDate,fileObj,locationId, bankId);
				 nlapiLogExecution('DEBUG', 'jsonFile for adjustVIDInDeposit', jsonFile);
                    //if (deplymentId == 'customdeploy10') {
						if(_logValidation(jsonFile))
						{
						for (var f in jsonFile.vidNumber) {
							//if (jsonFile.amount[f] > 0) {
							//nlapiLogExecution('DEBUG', '198');
							if(jsonFile.vidNumber[f])
							{
								vidArray.push(jsonFile.vidNumber[f]);						
								vidInvArray.push("inv_" + jsonFile.vidNumber[f]);
								amount.push(jsonFile.amount[f]);
								vidInvCustCode.push(jsonFile.CustCode[f])
								vorgid.push(jsonFile.v_org_id[f])
							}
							
							}
						}					
					nlapiLogExecution('DEBUG', 'vidInvArray after ajustdeposit', vidInvArray);
					nlapiLogExecution('AUDIT', "",'vidArray'+JSON.stringify(vidArray));
					
                 if(vidInvArray.length>0)
				 {
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
							nlapiLogExecution('DEBUG', 'Enter in search condition',vidInvArray.length);
                        	filt[1] = new nlobjSearchFilter('externalid', null, 'anyof', vidInvArray).setOr(true);
                        }                        	
                        else
						{
                    		nlapiLogExecution('DEBUG', 'vidInvArray is empty for Externalid Filter');
							createRnIRecord('VIDs not present in JSON ', fileObj, recieptNo, locationId, bankId)
							fileObj.setFolder('357481');
							nlapiSubmitFile(fileObj);
						}

                       

                        var invoiceSearch = nlapiSearchRecord('invoice', null, filt, cols);
                        nlapiLogExecution('DEBUG', 'invoiceSearch', invoiceSearch.length);
						}
                    }
					else
					{
						createRnIRecord('VIDs not present in JSON ', fileObj, recieptNo, locationId, bankId);
						nlapiLogExecution("error","VIDs not present in JSON",recieptNo)
						fileObj.setFolder('357481');
						nlapiSubmitFile(fileObj);
						return false;
					}
					
					/* if(invoiceSearch)
						nlapiLogExecution('AUDIT', 'invoiceSearch', invoiceSearch.length); */
                    //if(invoiceSearch && invoiceSearch.length==vidArray.length)
                    var VIDRefRecIDArray = [];

                    var customerViseAmt = {
                        customer: [],
						clientcode: [],
                        arAcc: [],
                        amount: [],
                        vids: [],
						v_id:[]

                    };
					var arr=[]
					nlapiLogExecution("AUDIT","before vidInvCustCode",vidInvCustCode)
                    if (invoiceSearch) {
                        for (var v in vidArray) {
							//nlapiLogExecution("AUDIT","v",v)
							var entityClientCode =  vidInvCustCode[v];
							//nlapiLogExecution("AUDIT","before entityClientCode",entityClientCode)
							//Search Client by client Code
							var filter_cust = [];
							var cols_cust = [];
							if(entityClientCode=="GENERAL")
							{
								
								entityClientCode=entityClientCode+vorgid[v];
							}
						//	nlapiLogExecution("AUDIT","entityClientCode",entityClientCode)
							
							filter_cust.push(new nlobjSearchFilter('entityid', null, 'is', entityClientCode).setOr(true));

							var customerClientSearch = nlapiSearchRecord("customer", null, filter_cust, [new nlobjSearchColumn("internalid"),new nlobjSearchColumn("custrecord_mhl_defaultaraccount",'custentity_mhl_cus_revenue_segment')]);
							
							nlapiLogExecution("AUDIT","customerClientSearch",JSON.stringify(customerClientSearch))
							
							if(customerClientSearch)
							{
								var allCustCols = customerClientSearch[0].getAllColumns();
								var i_clientCodeId = customerClientSearch[0].getId();
								var i_clientCode_receivablesaccount = customerClientSearch[0].getValue(allCustCols[1]);
							}
							
                            var found = 1;
                            for (var d in invoiceSearch) {
                                checkGovernance(context)

                                var allCols = invoiceSearch[d].getAllColumns();
                                if (vidArray[v] == invoiceSearch[d].getValue(allCols[3]) && invoiceSearch[d].getValue(allCols[4]) == 'CustInvc') {
									nlapiLogExecution('AUDIT', 'vidArray[v] in search condition', vidArray[v]);
                                    paymentJson.internalId.push(invoiceSearch[d].getValue(allCols[2]));
                                    paymentJson.amount.push(amount[v]);

                                    vidAmtTotal = Number(vidAmtTotal) + Number(amount[v]);
									nlapiLogExecution('AUDIT', 'in invoice search ', vidAmtTotal);
                                   /*  var customerId = invoiceSearch[d].getValue(allCols[0]);
                                    var arAcount = invoiceSearch[d].getValue(allCols[1]); */
									
									
									var customerId = i_clientCodeId;
									
									nlapiLogExecution('AUDIT', 'customerId', customerId);
									var arAcount = i_clientCode_receivablesaccount;
                                    if (!_logValidation(arAcount))
                                        nlapiLogExecution('DEBUG', 'customerId', 'customerId ==> ' + customerId + 'arAcount ==> ' + arAcount + 'invoiceSearchId ==>  ' + invoiceSearch[d].getValue(allCols[5]))
                                    
                                    nlapiLogExecution('AUDIT', 'Before FindPosition customerId', 'customerId ==> ' + customerId + 'customerViseAmt ==> ' + JSON.stringify(customerViseAmt));
                                    var pos = findPosition(customerViseAmt, customerId);
									nlapiLogExecution('AUDIT', 'pos', pos);
                                    //if (deplymentId == 'customdeploy10') {
                                    if (Number(amount[v]) < 0) {
                                        pos = -1;
                                    }
                                    //}
								  var id = filter_array(customerViseAmt.amount)
									nlapiLogExecution('AUDIT', 'id', id);
                                    if (pos > -1) {
									if(_logValidation(id[pos]))
									{
											var num=id[pos];
									}else{
										num=0
									}
										while(customerViseAmt.amount.length > 0) {
													customerViseAmt.amount.pop();
												}
												for(var i=0;i<id.length;i++)
												{
													customerViseAmt.amount[i]=id[i]
												}
										
                                       customerViseAmt.amount[pos] = Number(num) + Number(amount[v]);
									   arr[pos]=Number(num) + Number(amount[v])
                                        customerViseAmt.vids[pos] = customerViseAmt.vids[pos] + ',' + vidArray[v];
										customerViseAmt.v_id.push(vidArray[v]);
                                        //customerViseAmt.vids[pos] = vidArray[v];
										
										nlapiLogExecution('AUDIT', 'customerViseAmt.amount[pos]', customerViseAmt.amount[pos]);
										nlapiLogExecution('AUDIT', 'arr', arr);
                                        //nlapiLogExecution('DEBUG', 'vidArray[v] in if ', vidArray[v]);
										customerViseAmt.clientcode.push(i_clientCodeId);
										
                                        var VIDRefRec = nlapiCreateRecord('customrecord_mhl_deposited_vid_child');
                                        VIDRefRec.setFieldValue('custrecord_mhl_deposit_vid', vidArray[v])
                                        VIDRefRec.setFieldValue('custrecord_mhl_vid_customer', customerId)
                                        VIDRefRec.setFieldValue('custrecord_mlh_cms_vid_amount', amount[v])
										VIDRefRec.setFieldValue('custrecord_mhl_rni_vid_customer', i_clientCodeId)
                                        var VIDRefRecId = nlapiSubmitRecord(VIDRefRec);
                                        VIDRefRecIDArray.push(VIDRefRecId)
										
                                    } else {
										arr.push(Number(amount[v]))
                                        customerViseAmt.customer.push(customerId);
                                        customerViseAmt.amount.push(Number(amount[v]));
										 var id = filter_array(customerViseAmt.amount)
										 while(customerViseAmt.amount.length > 0) {
													customerViseAmt.amount.pop();
												}
												for(var i=0;i<id.length;i++)
												{
													customerViseAmt.amount[i]=id[i]
												}
										nlapiLogExecution('AUDIT', 'id in else', id);
										nlapiLogExecution('AUDIT', 'amount[v]', amount[v]);
										customerViseAmt.clientcode.push(i_clientCodeId);
											nlapiLogExecution('AUDIT', 'arAcount in else brfor',  customerViseAmt.arAcc);
											nlapiLogExecution('AUDIT', 'arAcount in else brfor',  customerViseAmt.arAcc.length);
											
                                        customerViseAmt.arAcc.push(arAcount);
										nlapiLogExecution('AUDIT', 'arAcount after',  customerViseAmt.arAcc);
										nlapiLogExecution('AUDIT', 'arAcount after',  customerViseAmt.arAcc.length);
                                        customerViseAmt.vids.push(vidArray[v]);
										customerViseAmt.v_id.push(vidArray[v]);
										
                                        var VIDRefRec = nlapiCreateRecord('customrecord_mhl_deposited_vid_child');
                                        VIDRefRec.setFieldValue('custrecord_mhl_deposit_vid', vidArray[v])
                                        VIDRefRec.setFieldValue('custrecord_mhl_vid_customer', customerId)
                                        VIDRefRec.setFieldValue('custrecord_mlh_cms_vid_amount', amount[v]);
										VIDRefRec.setFieldValue('custrecord_mhl_rni_vid_customer', i_clientCodeId)
                                        var VIDRefRecId = nlapiSubmitRecord(VIDRefRec);
                                        VIDRefRecIDArray.push(VIDRefRecId);
                                        nlapiLogExecution('DEBUG', 'vidArray[v] in else ', vidArray[v]);

                                    }
                                    found = 0
                                    break;
                                }
								
								 
								
                            }

                           if (found == 1) {
                               if(customerViseAmt.clientcode.indexOf(i_clientCodeId) > -1)
								{
									nlapiLogExecution("debug","Customer Index ",customerViseAmt.clientcode.indexOf(i_clientCodeId))
									
									customerViseAmt.amount[customerViseAmt.clientcode.indexOf(i_clientCodeId)] = parseFloat(amount[v]) + parseFloat(customerViseAmt.amount[customerViseAmt.clientcode.indexOf(i_clientCodeId)]);
									nlapiLogExecution("debug","amount[v] ",amount[v])
									nlapiLogExecution("debug","customerViseAmt.amount[customerViseAmt.clientcode.indexOf(i_clientCodeId) ",customerViseAmt.amount[customerViseAmt.clientcode.indexOf(i_clientCodeId)])
									//nlapiLogExecution("debug","amount[v] ",amount[v])
									
								}
								else
								{
									vidNotFoundAmt = Number(vidNotFoundAmt) + Number(amount[v]);
									//customerViseAmt.customer.push(customerId);
									customerViseAmt.clientcode.push(i_clientCodeId);
									customerViseAmt.amount.push(Number(amount[v]));
									customerViseAmt.arAcc.push(arAcount);
									customerViseAmt.vids.push(vidArray[v]);
								}

								//CR 15 Feb 2021
								var VIDRefRec = nlapiCreateRecord('customrecord_mhl_deposited_vid_child');
								VIDRefRec.setFieldValue('custrecord_mhl_deposit_vid', vidArray[v])
								//VIDRefRec.setFieldValue('custrecord_mhl_vid_customer', i_clientCodeId)
								VIDRefRec.setFieldValue('custrecord_mlh_cms_vid_amount', amount[v]);
								VIDRefRec.setFieldValue('custrecord_mhl_rni_vid_customer', i_clientCodeId)
								 var VIDRefRecId = nlapiSubmitRecord(VIDRefRec);
								VIDRefRecIDArray.push(VIDRefRecId); 	
                            }
                        }
                    }
					 var id = filter_array(customerViseAmt.amount)
					 while(customerViseAmt.amount.length > 0) {
								customerViseAmt.amount.pop();
							}
							for(var i=0;i<id.length;i++)
							{
								customerViseAmt.amount[i]=id[i]
							}
						
                    // Creating Customer Details for CMS Transaction records
                    nlapiLogExecution('DEBUG', 'customerViseAmt', JSON.stringify(customerViseAmt));
					
					

                    for (var cu in customerViseAmt.customer) {
						try{
                        //nlapiLogExecution('DEBUG', '270');
                        var entity = customerViseAmt.customer[cu];
						 var entityCode = customerViseAmt.clientcode[cu]; // need to change entity from JSON 
                        //nlapiLogExecution('DEBUG', 'entity', 'entity 320 =>>>   ' + entity);

                        depositRecord.selectNewLineItem('other');
                        depositRecord.setCurrentLineItemValue('other', 'account', customerViseAmt.arAcc[cu]);
                        //depositRecord.setCurrentLineItemValue('other', 'entity', entity);
						depositRecord.setCurrentLineItemValue('other', 'entity', entityCode);
						 nlapiLogExecution('DEBUG', 'customerViseAmt.amount[cu]', customerViseAmt.amount[cu]);
                        depositRecord.setCurrentLineItemValue('other', 'amount', customerViseAmt.amount[cu]);
                        depositRecord.setCurrentLineItemValue('other', 'location', orgId);
                        depositRecord.setCurrentLineItemValue('other', 'cseg_mhl_locations', locId);
                        //depositRecord.setCurrentLineItemValue('other', 'memo', customerViseAmt.vids[cu]);

                        depositRecord.setCurrentLineItemValue('other', 'class', orgDetails['custrecord_mhl_ref_sbu']);

                        depositRecord.commitLineItem('other');
						}catch(e)
						{
							nlapiLogExecution('error','in customer',e)
						}
                        
                    }

                    for (var cu in clientCode) {
							try{
                        if (internalIdClient[cu]) {
						

                            var filter = [];
                            filter[0] = new nlobjSearchFilter('localizedname', null, 'is', clientAcc[cu]);
                            var accountSearch = nlapiSearchRecord('account', null, filter, null);
							nlapiLogExecution('DEBUG', 'accountSearch', JSON.stringify(accountSearch));
                            if (accountSearch) {
                               
                                depositRecord.selectNewLineItem('other');
                                depositRecord.setCurrentLineItemValue('other', 'account', accountSearch[0].getId());
                                nlapiLogExecution('DEBUG', 'clientAcc[cu]', clientAcc[cu]);

                                depositRecord.setCurrentLineItemValue('other', 'entity', internalIdClient[cu]);
                                nlapiLogExecution('DEBUG', 'entity', 'entity 352 =>>>   ' + internalIdClient[cu]);
								nlapiLogExecution('DEBUG', 'advanceAmt[cu] in account search======', advanceAmt[cu]);
                                depositRecord.setCurrentLineItemValue('other', 'amount', advanceAmt[cu]);
                                depositRecord.setCurrentLineItemValue('other', 'location', orgId);
                                depositRecord.setCurrentLineItemValue('other', 'cseg_mhl_locations', locId);
                                depositRecord.setCurrentLineItemValue('other', 'class', orgDetails['custrecord_mhl_ref_sbu']);

                                depositRecord.commitLineItem('other');

                                customerAdvance = Number(customerAdvance) + Number(advanceAmt[cu]);
                            }
                        }
						}catch(e)
						{
							nlapiLogExecution("error","in client account",e)
						}
                    }

                    nlapiLogExecution('DEBUG', 'vidAmtTotal', vidAmtTotal);
                    nlapiLogExecution('DEBUG', 'customerAdvance', customerAdvance);

                    nlapiLogExecution('DEBUG', 'Line Org', depositRecord.getLineItemValue('other', 'location', 1));

                    var totalAmt = Number(vidAmtTotal) + Number(customerAdvance);
                    nlapiLogExecution('DEBUG', 'totalAmt', totalAmt);

                    if (Number(totalAmt) == 0) {

                        nlapiLogExecution('DEBUG', 'Total amount zero');
                        createRnIRecord('Total amount zero ', fileObj, recieptNo, locationId, bankId)
                        fileObj.setFolder('75720');
                        nlapiSubmitFile(fileObj);
                    }
					
					
                    if (vidNotFoundAmt > 0) {
					
                        nlapiLogExecution('DEBUG', 'vidNotFoundAmt======', vidNotFoundAmt);
                        nlapiLogExecution('DEBUG', '327');
                        depositRecord.selectNewLineItem('other');
                        depositRecord.setCurrentLineItemValue('other', 'account', defaultArAcc);
						//nlapiLogExecution('DEBUG', 'in less then zeror', vidAmtTotal);
                        depositRecord.setCurrentLineItemValue('other', 'amount', vidNotFoundAmt);
                        depositRecord.setCurrentLineItemValue('other', 'location', orgId);
                        depositRecord.setCurrentLineItemValue('other', 'cseg_mhl_locations', locId);
                        depositRecord.setCurrentLineItemValue('other', 'class', orgDetails['custrecord_mhl_ref_sbu']);
                        depositRecord.commitLineItem('other');
						 
						
                    }

                    if (depositRecord.getLineItemCount('other') > 0) {

                        depositRecord.setFieldValue('custbody_rni_deposit_file', fileInternalId);
                        

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

                            fileObj.setFolder('711');
                            nlapiSubmitFile(fileObj);
                        }
                    }
				
					
                }
                // If account not found error
                else {
                    nlapiLogExecution('error', 'Account not found in Payment Account Mapping record');
                    createRnIRecord('Account not found in Payment Account Mapping record ', fileObj, recieptNo, locationId, bankId)
                    fileObj.setFolder('38689');
                    nlapiSubmitFile(fileObj);
                }
            } else {
                nlapiLogExecution('error', 'Location not found');
                createRnIRecord('Location not found ', fileObj, recieptNo, locationId, bankId)
                fileObj.setFolder('712');
                nlapiSubmitFile(fileObj);
            }
        } else {
            nlapiLogExecution('error', 'Location code not found');
            createRnIRecord('Location Code not available in file ', fileObj, recieptNo, locationId, bankId)
            fileObj.setFolder('712');
            nlapiSubmitFile(fileObj);
        }

    } catch (e) {
        nlapiLogExecution('error', 'processJson | Error', e);
    //    createRnIRecord(e, fileObj, recieptNo, locationId, bankId)
        fileObj.setFolder('712');
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
			 nlapiLogExecution('AUDIT', 'findPosition', 'customerViseAmt.customer[e] ==> ' + customerViseAmt.customer[e] + 'customer ==> ' + customer+'--e'+e);
            return e;
        }
    }
    return -1;
}


function findWithV_id(customerViseAmt,v_Id)
{
	for(var e in customerViseAmt.v_id)
	{
		if(customerViseAmt.v_id[e] == v_Id)
		{
			return e
		}
	}
	return -1
	
}
function updateVID(depositId, paymentJson, accountId, recieptNo, tranDate) {
	
	try
	{
	
		for (var t in paymentJson.internalId) {
			checkGovernance(context);
			nlapiLogExecution('DEBUG', 'paymentJson.internalId[t]', paymentJson.internalId[t]);
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
	catch(e)
	{
		nlapiLogExecution("error","updateVID | error",e)
	}
}

function _logValidation(value) {
    if (value != 'null' && value != '' && value != undefined && value != 'NaN' && value != 'undefined' && value != '- None -' && value!=null) {
        return true;
    } else {
        return false;
    }
}

function adjustVIDInDeposit(jsonFile, accountId, recieptNo, tranDate,fileObj,locationId, bankId) {
	try
	{
    nlapiLogExecution('DEBUG', 'jsonFile adjustVIDInDeposit', JSON.stringify(jsonFile));

    for (var t in jsonFile.vidNumber) {
	//	nlapiLogExecution('DEBUG', 'Vid number----->', jsonFile.vidNumber[t]);
	if(jsonFile.amount[t]>0)
	{
		
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
			// nlapiLogExecution('DEBUG', ' adjustVIDInDeposit payRec', payRec);
            payRec.setFieldValue('undepfunds', 'F');
            payRec.setFieldValue('account', accountId);
            payRec.setFieldValue('memo', recieptNo);
            payRec.setFieldValue('trandate', tranDate);
            payRec.setFieldValue('autoapply', 'F');
            payRec.setFieldValue('custbody_mhl_cms_bank_deposit_entry', 'T');

            var lineCnt = payRec.getLineItemCount('apply');
			// nlapiLogExecution('DEBUG', ' adjustVIDInDeposit linecount', lineCnt);
		//	  nlapiLogExecution('DEBUG', ' adjustVIDInDeposit creditCount', creditCount);
            var creditCount = payRec.getLineItemCount('credit');
            var flag = 0;
            for (var j = 1; j <= lineCnt; j++) {
                var applyCheck = payRec.getLineItemValue('apply', 'apply', j);
                if (applyCheck == 'T') {
					nlapiLogExecution('DEBUG', ' adjustVIDInDeposit in apply= jsonFile.amount[t]', jsonFile.amount[t]);
                    payRec.setLineItemValue('apply', 'amount', j, jsonFile.amount[t]);
                    amtAdjusted = Number(amtAdjusted) + Number(jsonFile.amount[t]);
                    flag = flag + 1;
                    //nlapiLogExecution('DEBUG', 'flag 495', flag);

                    break;
                }
            }

            var amountToAdjust = Number(jsonFile.amount[t]);
			//nlapiLogExecution('DEBUG', ' adjustVIDInDeposit amountToAdjust after for loop', amountToAdjust);
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
					//nlapiLogExecution('DEBUG','depositAmt in deposit',depositAmt);
					//nlapiLogExecution('DEBUG','depositAmt in deposit adjust to compare',amountToAdjust);
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

            //nlapiLogExecution('DEBUG', 'flag 517', flag);

            if (flag > 1) {
                var payId = nlapiSubmitRecord(payRec, true, true);
                nlapiLogExecution('DEBUG', 'payRec', payId);
                payRec = null;
                nlapiLogExecution('DEBUG', 'totalBankAmt', totalBankAmt);

                if (Number(jsonFile.amount[t]) > 0) {
                    jsonFile.adjusted[t] = 1;
                } else {
                    jsonFile.adjusted[t] = 0;
                }
            }
            payRec = null;
        }
    }
	}
    nlapiLogExecution('DEBUG', 'jsonFile', JSON.stringify(jsonFile));

    return jsonFile;
}catch(e)
{
nlapiLogExecution("debug","adjustVIDInDeposit | error",e)	
createRnIRecord('You can not add less then Zero to Deposit Record', fileObj, recieptNo, locationId, bankId)
fileObj.setFolder('712');
nlapiSubmitFile(fileObj);
return e;

}
}


function filter_array(test_array) {
    var index = -1,
        arr_length = test_array ? test_array.length : 0,
        resIndex = -1,
        result = [];

    while (++index < arr_length) {
        var value = test_array[index];

        if (value) {
            result[++resIndex] = value;
        }
    }

    return result;
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