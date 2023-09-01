/**
 * Script Name: MHL_YIL_MAP_B2B_New_Rni_Test_cancellation.js
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL YIL New Rni Test Cancellation
 * File Name: MHL_YIL_MAP_B2B_New_Rni_Test_cancellation.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: New Rni Test Cancellation
 *********************************************************** */

define(['N/search', 'N/record', 'N/runtime', 'N/file','./datellib','N/format'],

    function(search, record, runtime, file,datellib,format) {

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
                return search.load({
                    id: 'customsearch_mhl_b2b_new_rni_test_cancel'
                });
            } catch (e) {
                log.debug({
                    title: 'Error Occured while collecting JSON for VID test Cancellation',
                    details: e
                });
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

                var data = JSON.parse(context.value); //read the data
                var fileFolder;
                var fileInternalId = data.id;
                var tranDate = data.values.created;
                var jsonFile = file.load({
                    id: fileInternalId
                });
                var content = jsonFile.getContents();
                content = JSON.parse(content);
                var refundId = cancelAndRefund(content, jsonFile, tranDate);

            } catch (ex) {
                log.error({
                    title: 'map: error in creating records',
                    details: ex
                });
            }
        }

        function cancelAndRefund(content, jsonFile, tranDate) {
            try {
                //log.debug({title:'content',details:content});

                var scriptObj = runtime.getCurrentScript();
                var refundItem = scriptObj.getParameter({
                    name: 'custscript_cash_refund_item'
                });

                var jsonObj = content;

                var vidNumber = jsonObj.VisitNumber;
                log.debug({
                    title: 'vidNumber',
                    details: vidNumber
                });

                var orgId = jsonObj.OrgID;
                log.debug({
                    title: 'orgId',
                    details: orgId
                });

                var searchDataNew = searchInvoiceNew(vidNumber);
                var searchData = searchB2Bvid(vidNumber); // VID Search On B2B ViD Record (B2B VID)
				//B2B
                if (searchData) {
                    var invId = searchData.getValue({
                        name: 'internalid'
                    });
                    log.debug("invId", invId);
                    var paymentMode = searchData.getText({
                        name: 'custbody_mhl_inv_payment_mode'
                    });
                    if (invId) {
                        var testDetails = jsonObj.TestDetails;

                        var testDetailsLength = jsonObj.TestDetails.length;

                        log.debug("test details length", testDetailsLength);

                        var tempArray = [];
                        if (Array.isArray(testDetails)) {
                            tempArray = testDetails;
                        } else {
                            tempArray.push(testDetails);
                        }
                        var n_refundAmount = 0;
                        var n_totalAmount = 0;

                        var invRecord = record.load({
                            type: 'customrecord_b2b_vid_details',
                            id: invId,
                            isDynamic: true,
                        });

                        var customerId = invRecord.getValue('custrecord_clientname');
                        log.debug("customerId", customerId);

                        var SoID = invRecord.getValue('custrecord_salesorder');
                        log.debug("SoID", SoID);
						
						var consolidatedInvoiceID = invRecord.getValue('custrecord_invoice_number');
                        log.debug("consolidatedInvoiceID", consolidatedInvoiceID);

                        var Org = invRecord.getValue('custrecord_org');
                        log.debug("Org", Org);

                     
                            var totalAmount = 0;
                            for (var te in tempArray) {
                                n_totalAmount = n_totalAmount + Number(tempArray[te].AmtRefund);
							if(tempArray[te].NSNetAmount){
								n_refundAmount = n_refundAmount + Number(tempArray[te].AmtRefund);
							}
							else{
                                n_refundAmount = n_refundAmount + Number(tempArray[te].AmtRefund);
							}
                                n_TestCode = tempArray[te].TestCode;
                            }
                            log.debug({
                                title: 'totalAmount',
                                details: n_totalAmount
                            });
                            log.debug({
                                title: 'n_refundAmount',
                                details: n_refundAmount
                            });
                            log.debug({
                                title: 'n_TestCode',
                                details: n_TestCode
                            });
                            if (SoID) {
                                var objSoRecord = record.load({
                                    type: record.Type.SALES_ORDER,
                                    id: SoID,
                                    isDynamic: true,
                                });

                                var orderStatus = objSoRecord.getText({
                                    fieldId: 'orderstatus'
                                });
                                log.debug("orderStatus", orderStatus);
								
								var billingDate = objSoRecord.getValue({fieldId: 'enddate'});
								log.debug("billingDate", billingDate);
								var today = new Date(billingDate);
								var yyyy = today.getFullYear();
								var mm = today.getMonth() + 1; // Months start at 0!
								var dd = today.getDate();
								var bill_date = mm + '/' + dd + '/' + yyyy;
								
								var revSeg = objSoRecord.getText({fieldId: 'department'});
								log.debug("revSeg", revSeg);
								
								var subsidiary_gmt = objSoRecord.getValue('subsidiary');
								log.debug("subsidiary_gmt", subsidiary_gmt);
								
								var subsidiaryTimezone_gmt = search.lookupFields({
								type: 'subsidiary',
								id: subsidiary_gmt,
								columns: ['custrecord_mhl_timezone_gmt']
								});
								log.debug('subsidiaryTimezone_gmt',subsidiaryTimezone_gmt.custrecord_mhl_timezone_gmt);

                                var LineCount = objSoRecord.getLineCount({
                                    sublistId: 'links'
                                });
                                for (var t = 0; t < LineCount; t++) {
                                    var InvID = objSoRecord.getSublistValue({
                                        sublistId: 'links',
                                        fieldId: 'id',
                                        line: t
                                    });
                                }
                                log.debug("InvID", InvID);
								if(jsonObj.cancellationDate){
								var CancellationDate=jsonObj.cancellationDate;
								}
								else{
									log.debug('CancellationDate Not found in JSON', vidNumber);
									jsonFile.folder = '696';
									jsonFile.save();

									//added error record code added by Nikita
									createRnIRecord('CancellationDate Not found in JSON' + vidNumber, jsonFile.name, jsonFile.id,'CancellationDate Not found in JSON');
								}
								/* var CanDate = datellib.findDateRnI(CancellationDate, null, subsidiaryTimezone_gmt.custrecord_mhl_timezone_gmt);
								var today = new Date(CanDate);
								var yyyy = today.getFullYear();
								var mm = today.getMonth() + 1; // Months start at 0!
								var dd = today.getDate();
								var can_date = mm + '/' + dd + '/' + yyyy; */
                               // if (orderStatus == "Billed") {
								  var CancellationDate=jsonObj.cancellationDate;
								log.debug("CancellationDate",CancellationDate);
								CancellationDate = CancellationDate.replace(/-/g,"/");
								log.debug("CancellationDate",CancellationDate);
								var postingDate = format.parse({
                                value: CancellationDate,
                                type: format.Type.DATE
								});
								
								log.debug("postingDate----------",postingDate);
								var today = new Date(postingDate);
								log.debug("today",today);
								var yyyy = today.getFullYear();
								var dd = today.getMonth()+1; // Months start at 0!
								var mm = today.getDate();
								var can_date = dd + '/' + mm + '/' + yyyy;
								log.debug("can_date",can_date);
                               // if (orderStatus == "Billed") {
								   
								   log.debug("can_date",new Date(bill_date)+"---------"+new Date(can_date));
								   if(new Date(bill_date) < new Date(can_date)){
									   
									   var creditmemoSearchObj = search.create({
									   type: "creditmemo",
									   filters:
									   [
										  ["type","anyof","CustCred"], 
										  "AND", 
										  ["custbody_mhl_invoice_vid_number","is",vidNumber], 
										  "AND", 
										  ["mainline","is","T"], 
										  "AND", 
										  ["custcol_mhl_testcode","is",n_TestCode]
									   ],
									   columns:
									   [
										  search.createColumn({name: "custbody_mhl_invoice_vid_number", label: "VID Number"}),
										  search.createColumn({name: "custcol_mhl_testcode", label: "Test Code "}),
										  search.createColumn({name: "item", label: "Item"})
									   ]
									});
									var searchResult = creditmemoSearchObj.run().getRange({
											start: 0,
											end: 1
										});
										if (searchResult.length == 0){
									   
                                     var creditMemo = record.create({
                                        type: record.Type.CREDIT_MEMO,
                                        isDynamic: false,
                                    });

                             /*    var creditMemo = record.transform({
                                fromType: record.Type.INVOICE,
                                fromId: consolidatedInvoiceID,
                                toType: record.Type.CREDIT_MEMO,
                                isDynamic: false,
                            }); */

                                    creditMemo.setValue({
                                        fieldId: 'entity',
                                        value: customerId
                                    });
                                    creditMemo.setText({
                                        fieldId: 'location',
                                        text: Org
                                    });

                                    creditMemo.setValue({
                                        fieldId: 'custbody_mhl_invoice_vid_number',
                                        value: vidNumber
                                    });
                                    creditMemo.setValue({
                                        fieldId: 'custbody_rni_date',
                                        value: tranDate
                                    });

                                    var lineCnt = creditMemo.getLineCount({
                                        sublistId: 'item'
                                    });

                                    for (var line = 1; line < lineCnt; line++) {
                                        creditMemo.removeLine({
                                            sublistId: 'item',
                                            line: line,
                                            ignoreRecalc: false
                                        });

                                        log.debug('line', line);

                                    }
									
								for (var te in tempArray) {
                                n_totalAmount = n_totalAmount + Number(tempArray[te].AmtRefund);
								if(tempArray[te].NSNetAmount){
								n_refundAmount = Number(tempArray[te].AmtRefund);
								}
								else{
                                n_refundAmount = Number(tempArray[te].AmtRefund);
								}
                                n_TestCode = tempArray[te].TestCode;
								
									
                                    creditMemo.setSublistText({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        text: revSeg,
                                        line: te
										
                                    });creditMemo.setSublistText({
                                        sublistId: 'item',
                                        fieldId: 'custcol_mhl_testcode',
                                        text: n_TestCode,
                                        line: te
                                    });

                                    creditMemo.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: n_refundAmount,
                                        line: te
                                    });

                                    creditMemo.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        value: n_refundAmount,
                                        line: te
                                    });

                                    creditMemo.setSublistText({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        text: Org,
                                        line: te
                                    });
								   }

                                    var createdFrom = creditMemo.getValue({
                                        fieldId: 'createdfrom'
                                    });
                                    var applyLineCnt = creditMemo.getLineCount({
                                        sublistId: 'apply'
                                    });

                                    for (var t = 0; t < applyLineCnt; t++) {
                                        var applied = creditMemo.getSublistValue({
                                            sublistId: 'apply',
                                            fieldId: 'internalid',
                                            line: t
                                        });
                                        if (applied == createdFrom) {
                                            log.debug('applied', applied);

                                            var dueAmt = creditMemo.getSublistValue({
                                                sublistId: 'apply',
                                                fieldId: 'due',
                                                line: t
                                            });
                                            log.debug(dueAmt, n_refundAmount);
                                            /*if(Number(dueAmt)>=Number(n_refundAmount))
                                            {
                                            	flag=1;
                                            }
                                            */
                                        }
                                    }

                                    log.debug("TestCode string", formed_testcode_string);

                                    if (formed_testcode_string) {
                                        var i_extId = "inv_" + vidNumber + formed_testcode_string;
                                        log.debug("external id:", i_extId);
                                        creditMemo.setValue({
                                            fieldId: 'externalid',
                                            value: i_extId
                                        });
                                    } else {
                                        var i_extId = "inv_" + vidNumber + orgId;
                                        log.debug("external id:", i_extId);
                                        creditMemo.setValue({
                                            fieldId: 'externalid',
                                            value: i_extId
                                        });
                                    }

                                    var creditMemoId = '';

                                    //if(flag==1)
                                    //{
                                    creditMemoId = creditMemo.save();
                                    log.debug('creditMemoId', creditMemoId);
                                    //}

                                    if (creditMemoId) {
                                        jsonFile.folder = '695';
                                        jsonFile.save();
                                    } else {
                                        jsonFile.folder = '696';
                                        jsonFile.save();
                                    }
                                    log.audit({
                                        title: 'B2B Credit memo Created',
                                        details: creditMemoId
                                    });
								   }
								   else {
									log.debug('Credit Memo is already created', vidNumber);
									jsonFile.folder = '696';
									jsonFile.save();
									//added error record code added
									createRnIRecord('Credit Memo is already created ' + vidNumber, jsonFile.name, jsonFile.id,'Credit Memo is already created');
									}

                                }
                            }

                            var flag = 0;

                            log.debug('flag', flag);
                            var formed_testcode_string;
                            for (var i in tempArray) {
                                if (i == 0) {
                                    formed_testcode_string = tempArray[i].TestCode;
                                    log.debug("in if TestCode", formed_testcode_string);
                                    var valTestCode = validateB2BTestCode(vidNumber, tempArray[te].TestCode);
                                    log.debug("if valTestCode", valTestCode);
                                    if (valTestCode) {
                                        jsonFile.folder = '696';
                                        jsonFile.save();
                                        log.debug("This test code is already cancelled.. ");
                                        
										createRnIRecord(tempArray[i].TestCode + ' Test code which is already cancelled in the NetSuite ' + vidNumber, jsonFile.name, jsonFile.id,'Test code already cancelled');
                                        return false;
                                    }
                                } else {
                                    formed_testcode_string += tempArray[i].TestCode;
                                    log.debug("in else TestCode", formed_testcode_string);
                                    var valTestCode = validateB2BTestCode(vidNumber, tempArray[te].TestCode);
                                    log.debug("else valTestCode", valTestCode);
                                    if (valTestCode) {
                                        jsonFile.folder = '696';
                                        jsonFile.save();
                                        log.debug("This test code is already cancelled.. ");
                                        createRnIRecord(tempArray[i].TestCode + ' Test code which is already cancelled in the NetSuite ' + vidNumber, jsonFile.name, jsonFile.id,'Test code already cancelled');
                                        return false;
                                    }
                                    //formed_testcode_string.push(testCode[i]);
                                }

                                //log.debug("TestCode",tempArray[i].TestCode);
                                //i++;
                            }
							if(new Date(bill_date) >= new Date(can_date))
							{

                            for (var te in tempArray) {
                                testCancel(vidNumber, tempArray[te].TestCode);
                                jsonFile.folder = '695';
                                jsonFile.save();
                            }
							}
                            var TestCode = [];
                            var formed_testcode_string;

                    } else {
                        log.debug('VID Not Found', vidNumber);
                        jsonFile.folder = '696';
                        jsonFile.save();

                        //added error record code added by Nikita
                        createRnIRecord('VID Not found' + vidNumber, jsonFile.name, jsonFile.id,'VID Not found');
                    }
                }
				//B2C
				else if (searchDataNew) {

                    var invId = searchDataNew.getValue({
                        name: 'internalid'
                    });
                    /* var paymentMode = searchDataNew.getText({
                        name: 'custbody_mhl_inv_payment_mode'
                    }); */
                    if (invId) {
                        var testDetails = jsonObj.TestDetails;

                        var testDetailsLength = jsonObj.TestDetails.length;

                        log.debug("test details length", testDetailsLength);

                        var tempArray = [];
                        if (Array.isArray(testDetails)) {
                            tempArray = testDetails;
                        } else {
                            tempArray.push(testDetails);
                        }

                        //	var totalAmount=0;
                        var n_refundAmount = 0;
                        var n_totalAmount = 0;

                        var invRecord = record.load({
                            type: record.Type.INVOICE,
                            id: invId,
                            isDynamic: true,
                        });

                        var n_invAmount = invRecord.getValue('total');
                        log.debug("Total inv amount", n_invAmount);

                        var customerId = invRecord.getValue('entity');
                        log.debug("customerId", customerId);
						
						var RevSeg = invRecord.getValue('department');
                        log.debug("RevSeg", RevSeg);

                        

                        //if (custType == 1) // B2C
                          
							var totalAmount = 0;
                            for (var te in tempArray) {
							if(tempArray[te].NSNetAmount){
								n_totalAmount = n_totalAmount + Number(tempArray[te].AmtRefund);
							}
							else{
                                n_totalAmount = n_totalAmount + Number(tempArray[te].AmtRefund);
							}
                                n_refundAmount = n_refundAmount + Number(tempArray[te].AmtRefund);
								n_TestCode = tempArray[te].TestCode;
                            }
                            log.debug({
                                title: 'NetAmount',
                                details: n_totalAmount
                            });

                            var creditMemo = record.transform({
                                fromType: record.Type.INVOICE,
                                fromId: invId,
                                toType: record.Type.CREDIT_MEMO,
                                isDynamic: false,
                            });

                            creditMemo.setValue({
                                fieldId: 'custbody_mhl_invoice_vid_number',
                                value: vidNumber
                            });
                            creditMemo.setValue({
                                fieldId: 'custbody_rni_date',
                                value: tranDate
                            });
                            //creditMemo.setValue({fieldId:'custbody_rni_date',value:'30/8/2020'});

                            var lineCnt = creditMemo.getLineCount({
                                sublistId: 'item'
                            });
                            //log.debug('lineCnt',lineCnt);

                            for (var line = 1; line < lineCnt; line++) {
                                creditMemo.removeLine({
                                    sublistId: 'item',
                                    line: line,
                                    ignoreRecalc: false
                                });

                                log.debug('line', line);

                            }
							
							creditMemo.setSublistText({
									sublistId: 'item',
									fieldId: 'custcol_mhl_testcode',
									text: n_TestCode,
									line: 0
									});

                            creditMemo.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: n_totalAmount,
                                line: 0
                            });
                            var createdFrom = creditMemo.getValue({
                                fieldId: 'createdfrom'
                            });

                            var applyLineCnt = creditMemo.getLineCount({
                                sublistId: 'apply'
                            });

                            var flag = 0;
                            for (var t = 0; t < applyLineCnt; t++) {
                                var applied = creditMemo.getSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'internalid',
                                    line: t
                                });
                                if (applied == createdFrom) {
                                    log.debug('applied', applied);

                                    var dueAmt = creditMemo.getSublistValue({
                                        sublistId: 'apply',
                                        fieldId: 'due',
                                        line: t
                                    });
                                    log.debug(dueAmt, n_refundAmount);
                                    if (Number(dueAmt) >= Number(n_refundAmount)) {
                                        flag = 1;
                                    }

                                }
                            }
                            log.debug('flag', flag);
                            //var formed_testcode_string = new Array();
                            var formed_testcode_string;
                            for (var i in tempArray) {
                                if (i == 0) {
                                    formed_testcode_string = tempArray[i].TestCode;
                                    log.debug("in if TestCode", formed_testcode_string);
                                    var valTestCode = validateB2CTestCode(vidNumber, tempArray[te].TestCode);
                                    log.debug("if valTestCode", valTestCode);
                                    if (valTestCode) {
                                        jsonFile.folder = '481057';
                                        jsonFile.save();
                                        log.debug("This test code is already cancelled.. ");
                                        createRnIRecord('Json file has test code which is already cancelled in the NetSuite' + vidNumber, jsonFile.name, jsonFile.id,"This test code is already cancelled");
                                        return false;
                                    }

                                } else {
                                    formed_testcode_string += tempArray[i].TestCode;

                                    log.debug("in else TestCode", formed_testcode_string);
                                    var valTestCode = validateB2CTestCode(vidNumber, tempArray[te].TestCode);
                                    log.debug("else valTestCode", valTestCode);
                                    if (valTestCode) {
                                        jsonFile.folder = '481057';
                                        jsonFile.save();
                                        log.debug("This test code is already cancelled.. ");
                                        createRnIRecord('Json file has test code which is already cancelled in the NetSuite' + vidNumber, jsonFile.name, jsonFile.id,"This test code is already cancelled.");
                                        return false;
                                    }

                                    //formed_testcode_string.push(testCode[i]);
                                }

                                //log.debug("TestCode",tempArray[i].TestCode);
                                //i++;
                            }
                            //log.debug("TestCodes..",testCode[i]);

                            //formed_testcode_string = tempArray[i].TestCode;
                            log.debug("TestCode string", formed_testcode_string);

                            if (formed_testcode_string) {
                                var i_extId = "inv_" + vidNumber + formed_testcode_string;
                                log.debug("external id:", i_extId);
                                creditMemo.setValue({
                                    fieldId: 'externalid',
                                    value: i_extId
                                });
                            } else {
                                var i_extId = "inv_" + vidNumber + orgId;
                                log.debug("external id:", i_extId);
                                creditMemo.setValue({
                                    fieldId: 'externalid',
                                    value: i_extId
                                });
                            }

                            var creditMemoId = '';

                            //if(flag==1)
                            {
                                creditMemoId = creditMemo.save();
                                log.audit('creditMemoId', creditMemoId);

                                /* for (var te in tempArray) {
                                    b2ctestCancel(vidNumber, tempArray[te].TestCode);
                                } */
                            }

                            if (creditMemoId) {
                                jsonFile.folder = '695';
                                jsonFile.save();
							for (var te in tempArray) {
                                b2ctestCancel(vidNumber, tempArray[te].TestCode);
                            }
                            } else {
                                jsonFile.folder = '696';
                                jsonFile.save();
                                createRnIRecord('Credit Memo Not Created for ', jsonFile.name, jsonFile.id,'Credit Memo Not Created');
                            }
							
							log.audit({
                                title: 'B2C Credit Memo Created',
                                details: creditMemoId
                            });

                            var TestCode = [];
                            var formed_testcode_string;

                        

                    } else {
                        log.debug('VID Not Found', vidNumber);
                        jsonFile.folder = '696';
                        jsonFile.save();

                        //added error record code added by Nikita
                        createRnIRecord('VID Not found' + vidNumber, jsonFile.name, jsonFile.id,'VID Not found');
                    }
                    //return crRecId;

                } else {

                    var fileSearchObj = search.create({
                        type: "file",
                        filters: [
                            ["name", "contains", vidNumber],
                            "AND",
                            ["folder", "anyof", "705"]
                        ],
                        columns: [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "folder",
                                label: "Folder"
                            }),
                            search.createColumn({
                                name: "created",
                                label: "Date Created"
                            }),
                            search.createColumn({
                                name: "modified",
                                label: "Last Modified"
                            })
                        ]
                    });
                    var searchResultCount = fileSearchObj.runPaged().count;
                    log.debug("fileSearchObj result count", searchResultCount);
                    fileSearchObj.run().each(function(result) {

                        fileFolder = result.getText({
                            name: "folder"
                        });
                        log.debug("fileFolder", fileFolder);
                        // .run().each has a limit of 4,000 results
                        return true;
                    });
                    if (_validateData(searchResultCount)) {
                        jsonFile.folder = '696';
                        jsonFile.save();

                        log.debug("File is available");
                        createRnIRecord('Json file is found in' + fileFolder + ' | ' + vidNumber, jsonFile.name, jsonFile.id,'json file not found');

                        //log.debug("error record created..");
                    } else {
                        createRnIRecord('json file not found' + vidNumber, jsonFile.name, jsonFile.id,'json file not found');
                        jsonFile.folder = '696';
                        jsonFile.save();
                    }
                }
            } catch (e) {
                log.debug('Error occured', e);

                jsonFile.folder = '696';
                jsonFile.save();

                createRnIRecord(e, jsonFile.name, jsonFile.id,'Test Cancel Error occured');
                return '';
            }

        }

        /////////////////////////////////////// search item //////////////////////////////////////////////////////////////

        function searchByItemId(itemId) {
            itemId = itemId.toString();
            log.debug({
                title: 'itemId',
                details: itemId
            });

            var internalIdSearch = search.create({
                type: search.Type.ITEM,
                columns: ['internalid'],
                filters: [
                    ['itemid', 'is', itemId]
                ]
            });

            var searchResult = internalIdSearch.run().getRange({
                start: 0,
                end: 1
            });
            log.debug({
                title: 'searchResult 147',
                details: searchResult
            });

            if (searchResult) {
                return searchResult[0].id;
            }
            return null;
        }

        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        ////////////////////////////////////// Search Consolidated invoice //////////////////////////////////////////////

        function searchInvoiceNew(vid) {
            log.debug({
                title: 'vid ',
                details: vid
            });
            var vidSearch = search.create({
                type: search.Type.INVOICE,
                columns: ['internalid', 'custbody_mhl_inv_payment_mode', 'entity', 'location', 'department'],
                filters: [
                    ['custbody_mhl_invoice_vid_number', 'is', vid], 'AND', ['mainline', 'is', 'T']
                ]
            });

            var invResultSet = vidSearch.run();

            var invResultRange = invResultSet.getRange({
                start: 0,
                end: 1
            });
            //log.debug({title:'invResultRange ',details:invResultRange});

            if (invResultRange) {
                log.debug({
                    title: 'Tranid found '
                });
                return invResultRange[0];
            } else {
                return false;
            }
        }

        ////////////////////////////////////// Search Consolidated invoice //////////////////////////////////////////////
        function searchB2Bvid(vid) {
            log.debug({
                title: 'vid ',
                details: vid
            });
            var vidSearch = search.create({
                type: "customrecord_b2b_vid_details",
                columns: ['internalid', 'custrecord_clientname'],
                filters: [
                    ['custrecord_vidno', 'is', vid]
                ]
            });

            var invResultSet = vidSearch.run();

            var invResultRange = invResultSet.getRange({
                start: 0,
                end: 1
            });
            //log.debug({title:'invResultRange ',details:invResultRange});

            if (invResultRange) {
                log.debug({
                    title: 'Tranid found '
                });
                return invResultRange[0];
            } else {
                return false;
            }
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /////////////////////////////////////////////// Create Error Record ////////////////////////////////////////////////////////
        function createRnIRecord(e, fileName, fileId,errorTitle) {

            var rnIRec = record.create({
                type: 'customrecord_rni_integration_status'
            });

            rnIRec.setValue({
                fieldId: 'custrecord_json_type',
                value: '5'
            });
            rnIRec.setValue({
                fieldId: 'custrecord_error_description',
                value: e.toString()
            });
            rnIRec.setValue({
                fieldId: 'custrecord_json_file',
                value: fileName
            });
            rnIRec.setValue({
                fieldId: 'custrecord_processed',
                value: '2'
            });
            rnIRec.setValue({
                fieldId: 'custrecord_mhl_file_id',
                value: fileId
            });
            rnIRec.setValue({
                fieldId: 'custrecord_attune_vid_record',
                value: true
            });
			if(errorTitle){
			rnIRec.setValue({
				fieldId: 'custrecord_mhl_rni_inte_errorname',
				value: errorTitle});
			}
            rnIRec.save();

        }

        function returndisply(itemid) {
            var i_ItemInternal_id = '';
            var serviceitemSearchObj = search.create({
                type: "serviceitem",
                filters: [
                    ["type", "anyof", "Service"],
                    "AND",
                    ["displayname", "is", itemid]
                ],
                columns: [
                    search.createColumn({
                        name: "displayname",
                        label: "Display Name"
                    }),
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    })
                ]
            });
            var searchResultCount = serviceitemSearchObj.runPaged().count;
            log.debug("serviceitemSearchObj result count", searchResultCount);
            serviceitemSearchObj.run().each(function(result) {
                i_ItemInternal_id = result.getValue("internalid");
                log.debug("i_ItemInternal_id result count", i_ItemInternal_id);
                // .run().each has a limit of 4,000 results
                return true;
            });
            return i_ItemInternal_id;
        }

        function testCancel(vidNumber, testCode) {
            try {
                //var itemid = returndisply(testCode);
                //log.debug("itemid",itemid);
                if (testCode) {
                    var customrecord_b2b_vid_detailsSearchObj = search.create({
                        type: "customrecord_b2b_vid_details",
                        filters: [
                            ["custrecord_vidno", "is", vidNumber.toString()],
                            "AND",
                            ["custrecord_reference_b2b.custrecord_netamount", "isnotempty", ""],
                            "AND",
                            ["custrecord_reference_b2b.custrecord_test_code_json", "is", testCode.toString()]
                        ],
                        columns: [
                            search.createColumn({
                                name: "custrecord_test_code_json",
                                join: "CUSTRECORD_REFERENCE_B2B",
                                label: "Test Code"
                            }),
                            search.createColumn({
                                name: "custrecord_testname",
                                join: "CUSTRECORD_REFERENCE_B2B",
                                label: "Test Name"
                            }),
                            search.createColumn({
                                name: "custrecord_netamount",
                                join: "CUSTRECORD_REFERENCE_B2B",
                                label: "Net Amount"
                            }),
                            search.createColumn({
                                name: "custrecord_cancelled",
                                join: "CUSTRECORD_REFERENCE_B2B",
                                label: "Cancelled"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "CUSTRECORD_REFERENCE_B2B",
                                label: "Internal ID"
                            })
                        ]
                    });
                    var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
                    log.debug("customrecord_b2b_vid_detailsSearchObj result count", searchResultCount);
                    var result = customrecord_b2b_vid_detailsSearchObj.run();

                    var invResultRange = result.getRange({
                        start: 0,
                        end: 100
                    });

                    for (var t in invResultRange) {
                        // .run().each has a limit of 4,000 results
                        log.debug('result', invResultRange[t]);
                        try {
                            var test_CancellationId = invResultRange[t].getValue({
                                name: "internalid",
                                join: "CUSTRECORD_REFERENCE_B2B",
                                label: "Internal ID"
                            });
                            var otherId = record.submitFields({
                                type: 'customrecord_b2b_vid_test_details',
                                id: Number(test_CancellationId),
                                values: {
                                    'custrecord_cancelled': 'T'
                                }
                            });
                            log.debug("invResultRange[t].id", invResultRange[t].id);
                            log.debug("otherId", otherId);
                            var o_RecUpdate = record.load({
                                type: 'customrecord_b2b_vid_details',
                                id: invResultRange[t].id,
                                isDynamic: true
                            });
                            var count = o_RecUpdate.getLineCount({
                                sublistId: 'recmachcustrecord_reference_b2b'
                            });
                            log.debug("count", count);
                            var total = 0;
                            for (var i = 0; i < count; i++) {
                                var netAmount = o_RecUpdate.getSublistValue({
                                    sublistId: 'recmachcustrecord_reference_b2b',
                                    fieldId: 'custrecord_netamount',
                                    line: i
                                });
                                log.debug("netAmount", netAmount);
                                var isCancelled = o_RecUpdate.getSublistValue({
                                    sublistId: 'recmachcustrecord_reference_b2b',
                                    fieldId: 'custrecord_cancelled',
                                    line: i
                                });
                                log.debug("isCancelled", isCancelled);
                                if (isCancelled == false) {
                                    total += parseInt(netAmount);
                                }
                                log.debug("total", total);
                            }
                            var totalAmt = o_RecUpdate.setValue({
                                fieldId: 'custrecord_b2b_vid_amount',
                                value: total
                            });

                            var RecUpdateAmount = o_RecUpdate.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug("RecUpdateAmount", RecUpdateAmount);

                            return otherId;
                        } catch (e) {
                            log.error(e)
                        };
                    }
                }
            } catch (e) {
                log.debug('test', e);
            }

        }

        function validateB2BTestCode(vidNumber, testCode) {

            //var itemid = returndisply(testCode);
            //log.debug("itemid", itemid);
            if (testCode) {
                var testCancelled;
                var customrecord_b2b_vid_detailsSearchObj = search.create({
                    type: "customrecord_b2b_vid_details",
                    filters: [
                        ["custrecord_vidno", "is", vidNumber.toString()],
                        "AND",
                        ["custrecord_reference_b2b.custrecord_netamount", "isnotempty", ""],
                        "AND",
                        ["custrecord_reference_b2b.custrecord_test_code_json", "is", testCode.toString()]
                    ],
                    columns: [
                        search.createColumn({
                            name: "custrecord_test_code_json",
                            join: "CUSTRECORD_REFERENCE_B2B",
                            label: "Test Code"
                        }),
                        search.createColumn({
                            name: "custrecord_testname",
                            join: "CUSTRECORD_REFERENCE_B2B",
                            label: "Test Name"
                        }),
                        search.createColumn({
                            name: "custrecord_netamount",
                            join: "CUSTRECORD_REFERENCE_B2B",
                            label: "Net Amount"
                        }),
                        search.createColumn({
                            name: "custrecord_cancelled",
                            join: "CUSTRECORD_REFERENCE_B2B",
                            label: "Cancelled"
                        })
                    ]
                });
                var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
                log.debug("customrecord_b2b_vid_detailsSearchObj result count", searchResultCount);
                customrecord_b2b_vid_detailsSearchObj.run().each(function(result) {
                    // .run().each has a limit of 4,000 results
                    testCancelled = result.getValue({
                        name: "custrecord_cancelled",
                        join: "CUSTRECORD_REFERENCE_B2B"
                    });
                    log.debug("testCancelled", testCancelled);
                    return true;
                });
                if (testCancelled == true) {
                    return true;
                } else {
                    return false;
                }
            }
        }
		
		
		function b2ctestCancel(vidNumber, testCode) {
            try {
                var customrecord_mhl_invoice_testwise_detailSearchObj = search.create({
                    type: "customrecord_mhl_invoice_testwise_detail",
                    filters: [
					 ["custrecord_mhl_itd_vid.custbody_mhl_invoice_vid_number", "is", vidNumber.toString()],
					 "AND",
					 ["custrecord_mhl_itd_test_code_string", "is", testCode.toString()]
					 ],
                    columns: [
						  search.createColumn({
                            name: "custrecord_mhl_itd_test_name",
                            label: "Test Name"
                        }),
						  search.createColumn({
                            name: "custrecord_for_print",
                            label: "Print"
                        }),
						  search.createColumn({
                            name: "custrecord_test_cancelled",
                            label: "Test Cancelled"
                        })
						 ]
                });
                var searchResultCount = customrecord_mhl_invoice_testwise_detailSearchObj.runPaged().count;
                log.debug("customrecord_mhl_invoice_testwise_detailSearchObj result count", searchResultCount);
                var result = customrecord_mhl_invoice_testwise_detailSearchObj.run();
                
                var invResultRange = result.getRange({
                    start: 0,
                    end: 100
                });
                
                for (var t in invResultRange) {
                    // .run().each has a limit of 4,000 results
                    log.debug('result', invResultRange[t]);
                    var otherId = record.submitFields({
                        type: 'customrecord_mhl_invoice_testwise_detail',
                        id: invResultRange[t].id,
                        values: {
                            'custrecord_test_cancelled': 'T'
                        }
                    });
                }
            } catch (e) {
                log.debug('test', e);
            }
            
        }
		
		
		function validateB2CTestCode(vidNumber, testCode) {
            var testCancelled;
            var customrecord_mhl_invoice_testwise_detailSearchObj = search.create({
                type: "customrecord_mhl_invoice_testwise_detail",
                filters: [
			  ["custrecord_mhl_itd_vid.custbody_mhl_invoice_vid_number", "is", vidNumber.toString()],
                        "AND",
			  ["custrecord_mhl_itd_net_amt", "isnotempty", ""],
			  "AND",
              ["custrecord_mhl_itd_test_code_string", "is", testCode.toString()]
		   ], //filters as above.
                columns: [
			  search.createColumn({
                        name: "id",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
			  search.createColumn({
                        name: "custrecord_mhl_itd_vid",
                        label: "doc number"
                    }),
			  search.createColumn({
                        name: "custrecord_mhl_itd_test_code_string",
                        label: "Test Code"
                    }),
			  search.createColumn({
                        name: "custrecord_mhl_itd_test_name",
                        label: "Test Name"
                    }),
			  search.createColumn({
                        name: "custrecord_mhl_itd_net_amt",
                        label: "net amt"
                    }),
			  search.createColumn({
                        name: "custrecord_test_cancelled",
                        label: "Test Cancelled"
                    })
		   ]
            });
            var searchResultCount = customrecord_mhl_invoice_testwise_detailSearchObj.runPaged().count;
            log.debug("customrecord_mhl_invoice_testwise_detailSearchObj result count", searchResultCount);
            customrecord_mhl_invoice_testwise_detailSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                testCancelled = result.getValue({
                    name: 'custrecord_test_cancelled'
                });
                log.debug("testCancelled", testCancelled);
                return true;
            });
            if (testCancelled == true) {
                return true;
                
            } else {
                return false;
            }
            
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

        }

        function _validateData(val) {
            if (val != null && val != 'undefined' && val != 'NaN' && val != '') {
                return true;
            }
        }
        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });