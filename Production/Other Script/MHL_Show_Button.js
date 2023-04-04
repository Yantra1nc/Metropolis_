/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL UE print button
 * File Name: MHL_Show_Button.js
 * Created On: 29/05/2022
 * Modified On:
 * Created By: Avinash Lahane (Yantra Inc.)
 * Modified By:
 * Description:
 *********************************************************** */

/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */

define(['N/record', 'N/search', 'N/url', 'N/ui/serverWidget', 'N/runtime'],
    function (record, search, url, ui, runtime) {
        function beforeLoad(context) {
            try {
                var mode = context.type;
                log.debug('beforeLoad', 'mode==' + mode);
                
                if (mode == 'view' || mode == 'edit') {
                    var recObj = context.newRecord;
                   // log.debug('Add Button Object', recObj);
                    var currentRecord = context.type;
                    var form = context.form;
                    var currentRecordType = recObj.type;
                    log.debug('Add Button Type', 'currentRecordType :' + currentRecordType);
                    
                    var recordId = recObj.id;
                    log.debug('Add Button Record Id', 'recordId:' + recordId);
                    
                    var objRecord = record.load({
                        type: currentRecordType,
                        id: recordId
                    });
                    log.debug('Add Button Type', currentRecord);
                    var createPdfUrl = url.resolveScript({
                        scriptId: 'customscript_mhl_su_invoice_pdf_create', //suitelet script id
                        deploymentId: 'customdeploy_su_create_invoice_pdf', //suitelet deploy id 
                        returnExternalUrl: false
                    });
                    createPdfUrl += '&recordId=' + recordId;
                    createPdfUrl += '&currentRecordType=' + currentRecordType;
                    var script_fam_button = "win = window.open('" + createPdfUrl + "', 'win');";
                    form.addButton({
                        id: 'custpage_customer_invoice_pdf',
                        label: 'Print',
                        functionName: script_fam_button
                    });
                }
                
                
                
            } catch (e) {
                
                log.debug('Error', e); //error and title = function name 
            }
        }
        
        function _logValidation(value) {
            if (value != 'null' && value != null && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }
        
        function vid_testdetails_Search(recordId) {
            var mySearch_filters = [];
            mySearch_filters.push(search.createFilter({
                name: 'internalid',
                join: 'CUSTRECORD_MHL_TESTDET_INVOICE_NO',
                operator: search.Operator.IS,
                values: recordId
            }));
            mySearch_filters.push(search.createFilter({
                name: 'mainline',
                join: 'CUSTRECORD_MHL_TESTDET_INVOICE_NO',
                operator: search.Operator.IS,
                values: 'T'
            }));
            mySearch_filters.push(search.createFilter({
                name: 'custrecord_cancelled',
                operator: search.Operator.IS,
                values: 'F'
            }));
            
            //savedSearch(mySearch_filters,mySearch);     //calling saved search function
            var mySearch = search.create({
                type: "customrecord_b2b_vid_test_details",
                filters: mySearch_filters,
                columns: [
                search.createColumn({
                        name: "custrecord_test_code",
                        label: "Test Code"
                    }),
                search.createColumn({
                        name: "custrecord_testname",
                        label: "Test Name"
                    }),
				 search.createColumn({
                    name: "custrecord_reference_b2b",
                    label: "Reference B2B "
                }),
                search.createColumn({
                        name: "custrecord_testdesc",
                        label: "Test Description"
                    }),
                search.createColumn({
                        name: "custrecord_grossamount",
                        label: "Gross Amount"
                    }),
                search.createColumn({
                        name: "custrecord_discount",
                        label: "Discount"
                    }),
                search.createColumn({
                        name: "custrecord_netamount",
                        label: "Net Amount"
                    }),
                search.createColumn({
                        name: "custrecord_mhl_testdet_invoice_no",
                        label: "Invoice Nos."
                    }),
                search.createColumn({
                        name: "custrecord_patientnumber",
                        join: "CUSTRECORD_REFERENCE_B2B",
                        label: "Patient Number"
                    }),
                search.createColumn({
                        name: "custrecord_reference_b2b",
                        label: "Reference B2B "
                    }),
                search.createColumn({
                        name: "custrecord_patientname",
                        join: "CUSTRECORD_REFERENCE_B2B",
                        label: "Patient Name"
                    }),
                search.createColumn({
                        name: "custrecord_vid_date",
                        join: "CUSTRECORD_REFERENCE_B2B",
                        label: "VID Date"
                    }),
                search.createColumn({
                        name: "custrecordcustrecord_copayclientamount",
                        join: "CUSTRECORD_REFERENCE_B2B",
                        label: "CopayClientAmount"
                    })
				]
            })
            var resultSet = mySearch.run();
            return resultSet;
        }
        
        return {
            
            beforeLoad: beforeLoad
        };
        
    })