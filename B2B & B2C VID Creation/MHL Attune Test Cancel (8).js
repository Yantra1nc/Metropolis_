/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL Attune Test Cancel Manual
 * File Name: MHL Attune Test Cancel (8).js
 * Created On: 
 * Modified On:  14/04/2022
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By: Avinash Lahane
 * Description: Cancle Attune Test
 *********************************************************** */

define(['N/search', 'N/record', 'N/runtime', 'N/file'],
    
    function (search, record, runtime, file) {
        
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
                    id: 'customsearch_mhl_yil_attune_test_cancell' 
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
                
                var searchData = searchInvoice(vidNumber);
                if (searchData) {
                    var invId = searchData.getValue({
                        name: 'internalid'
                    });
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
                            type: record.Type.INVOICE,
                            id: invId,
                            isDynamic: true,
                        });
                        
                        var n_invAmount = invRecord.getValue('total');
                        log.debug("Total inv amount", n_invAmount);
                        
                        var customerId = invRecord.getValue('entity');
                        log.debug("customerId", customerId);
                        
                        var custObj = record.load({
                            type: record.Type.CUSTOMER,
                            id: customerId,
                            isDynamic: true,
                        });
                        
                        var custType = custObj.getValue('custentity_mhl_cust_client_type');
                        log.debug("custType", custType);
                        
                        //if (custType == 2) 
                        {
                            
                            var totalAmount = 0;
                            for (var te in tempArray) {
                                n_totalAmount = n_totalAmount + Number(tempArray[te].NetAmount);
                                n_refundAmount = n_refundAmount + Number(tempArray[te].AmtRefund);
                            }
                            log.debug({
                                title: 'n_refundAmount',
                                details: n_refundAmount
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
                            
                            creditMemo.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: n_refundAmount,
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
                                    /*if(Number(dueAmt)>=Number(n_refundAmount))
                                    {
                                    	flag=1;
                                    }
                                    */
                                }
                            }
                            log.debug('flag', flag);
                            var formed_testcode_string;
                            /* for (var i in tempArray) {
                                if (i == 0) {
                                    formed_testcode_string = tempArray[i].TestCode;
                                    log.debug("in if TestCode", formed_testcode_string);
                                    var valTestCode = validateTestCode(vidNumber, tempArray[te].TestCode);
                                    log.debug("if valTestCode", valTestCode);
                                    if (valTestCode) {
                                        jsonFile.folder = '30745';
                                        jsonFile.save();
                                        log.debug("This test code is already cancelled.. ");
                                        createRnIRecord('Json file has test code which is already cancelled in the NetSuite' + vidNumber, jsonFile.name, jsonFile.id);
                                        return false;
                                    }
                                } else {
                                    formed_testcode_string += tempArray[i].TestCode;
                                    log.debug("in else TestCode", formed_testcode_string);
                                    var valTestCode = validateTestCode(vidNumber, tempArray[te].TestCode);
                                    log.debug("else valTestCode", valTestCode);
                                    if (valTestCode) {
                                        jsonFile.folder = '30745';
                                        jsonFile.save();
                                        log.debug("This test code is already cancelled.. ");
                                        createRnIRecord('Json file has test code which is already cancelled in the NetSuite' + vidNumber, jsonFile.name, jsonFile.id);
                                        return false;
                                    }
                                }
                            } */
                            log.debug("TestCode string", formed_testcode_string);
                            
                            if (formed_testcode_string) {
                                var i_extId = "inv_" + vidNumber + formed_testcode_string;
                                log.debug("external id:", i_extId);
                               /*  creditMemo.setValue({
                                    fieldId: 'externalid',
                                    value: i_extId
                                }); */
                            } else {
                               
          
                               /*  creditMemo.setValue({
                                    fieldId: 'externalid',
                                    value: i_extId
                                }); */
                            }
                            var creditMemoId = '';
                            creditMemo.setValue({
                                fieldId: 'custbody_attune_vid',
                                value: true
                            });
                            //if(flag==1)
                            //{
                            creditMemoId = creditMemo.save();
                            //log.debug('creditMemoId',creditMemoId);
                            //}
                            
                            if (creditMemoId) {
                                jsonFile.folder = '30744';
                                jsonFile.save();
								for (var te in tempArray) {
									testCancel(vidNumber, tempArray[te].TestCode);
								}
                            } else {
                                jsonFile.folder = '30745';
                                jsonFile.save();
								createRnIRecord('Credit Memo Not created ' + vidNumber, jsonFile.name, jsonFile.id);
								return false;
                            }
                            
                            log.audit({
                                title: 'Credit Memo Created',
                                details: creditMemoId
                            });
                            
                           
                            
                            var TestCode = [];
                            var formed_testcode_string;
                            
                        }
                    } else {
                        log.debug('VID Not Found', vidNumber);
                        jsonFile.folder = '30745';
                        jsonFile.save();
                        
                        //added error record code added by Nikita
                        createRnIRecord('VID Not found' + vidNumber, jsonFile.name, jsonFile.id);
                    }
                } else {
                    var fileSearchObj = search.create({
                        type: "file",
                        filters: [
                                ["name", "contains", vidNumber],
                                "AND",
                                ["folder", "anyof", "30736"]
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
                    fileSearchObj.run().each(function (result) {
                        
                        fileFolder = result.getText({
                            name: "folder"
                        });
                        log.debug("fileFolder", fileFolder);
                        // .run().each has a limit of 4,000 results
                        return true;
                    });
                    if (_validateData(searchResultCount)) {
                        jsonFile.folder = '30745';
                        jsonFile.save();
                        
                        log.debug("File is available");
                        createRnIRecord('Json file is available in' + fileFolder + ' in the NetSuite' + vidNumber, jsonFile.name, jsonFile.id);
                        
                        //log.debug("error record created..");
                    } else {
                        createRnIRecord('Main VID json file not found' + vidNumber, jsonFile.name, jsonFile.id);
                        jsonFile.folder = '30745';
                        jsonFile.save();
                    }
                }
            } catch (e) {
                log.debug('Error occured', e);
                
                jsonFile.folder = '30745';
                jsonFile.save();
                
                createRnIRecord(e, jsonFile.name, jsonFile.id);
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
                filters: [['itemid', 'is', itemId]]
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
        
        function searchInvoice(vid) {
            log.debug({
                title: 'vid ',
                details: vid
            });
            var vidSearch = search.create({
                type: search.Type.INVOICE,
                columns: ['internalid', 'custbody_mhl_inv_payment_mode', 'entity', 'location', 'department'],
                filters: [['custbody_mhl_invoice_vid_number', 'is', vid], 'AND', ['mainline', 'is', 'T']]
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
                return '';
            }
        }
        
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
        /////////////////////////////////////////////// Create Error Record ////////////////////////////////////////////////////////
        function createRnIRecord(e, fileName, fileId) {
            
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
            
            rnIRec.save();
            
        }
        
        function testCancel(vidNumber, testCode) {
            try {
                var customrecord_mhl_invoice_testwise_detailSearchObj = search.create({
                    type: "customrecord_mhl_invoice_testwise_detail",
                    filters: [
					 ["custrecord_mhl_itd_vid.custbody_mhl_invoice_vid_number", "is", vidNumber.toString()],
					 "AND",
					 ["custrecord_mhl_itd_test_code.name", "is", testCode.toString()]
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
        
        function _validateData(val) {
            if (val != null && val != 'undefined' && val != 'NaN' && val != '') {
                return true;
            }
        }
        
        function validateTestCode(vidNumber, testCode) {
            var testCancelled;
            var customrecord_mhl_invoice_testwise_detailSearchObj = search.create({
                type: "customrecord_mhl_invoice_testwise_detail",
                filters: [
			  ["custrecord_mhl_itd_vid.custbody_mhl_invoice_vid_number", "is", vidNumber.toString()],
                        "AND",
			  ["custrecord_mhl_itd_net_amt", "isnotempty", ""],
			  "AND",
              ["custrecord_mhl_itd_test_code.name", "is", testCode.toString()]
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
                        name: "custrecord_mhl_itd_test_code",
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
        
        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
        
    });