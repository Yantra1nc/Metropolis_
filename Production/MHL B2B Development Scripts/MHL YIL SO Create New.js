/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * Script Name: MHL YIL SO Create New.js
 * Author: Avinash Lahane
 * Date: MAY 2022
 * Description: This script will create Sales order VID wise and customer Billing cycle wise.
 */
define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', 'N/task', 'N/email'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function (file, format, record, search, runtime, task, email) {

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

        var orderIds = [];

        function getInputData() {

            try {

                var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;

                var customerSearchObj = search.load({
                    id: 'customsearch_mhl_vid_clientwise_detail'
                });

                //orderIds = {"customerDetails":customerSearchObj}
                //log.debug('orderIds',orderIds);
                return customerSearchObj;
            } catch (e) {
                log.error("getInputData |  error ", e)
            }

        }

        function map(context) {
            try {
                var a_usage_data = JSON.parse(context.value);
				log.debug("JSON",JSON.stringify(a_usage_data));
                var Jsonarr = new Array();
                Jsonarr = {
                    'customer': a_usage_data.values['GROUP(custrecord_clientname)'],
                    values: {
                        'SBU': a_usage_data.values['GROUP(custrecord_mhl_vid_sbu)'],
                        'startdate': a_usage_data.values['GROUP(custrecord_mhl_blii_start_date)'],
                        'enddate': a_usage_data.values['GROUP(custrecord_mhl_bill_end_date)'],
                        'ORG': a_usage_data.values['GROUP(custrecord_mhl_vid_org)'],
                        'InvoiceType': a_usage_data.values['GROUP(custentitycusrecord_invoicetype.CUSTRECORD_CLIENTNAME)'],
                        'ParentCustomer': a_usage_data.values['GROUP(parent.CUSTRECORD_CLIENTNAME)']
						
                    }
                };
                /* context.write({
                    key: a_usage_data.id,
                    value: a_usage_data.values['GROUP(internalid.CUSTRECORD_SALESORDER)']
                }); */

                log.debug("MAP", "a_usage_data " + JSON.stringify(Jsonarr))
                context.write({
                    key: Jsonarr.customer,
                    value: Jsonarr
                });

            } catch (ex) {
                log.error({
                    title: 'map: error in creating records',
                    details: ex
                });

            }
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function reduce(context) {

            try {
                var tempArr = [];
                var ErrorArr = [];
                var n_externalID = 0;

                var i_customer_id = context.key;
                //log.debug("i_customer_id",i_customer_id);
                var value = context.values;
                log.debug("value", value.length);
                for (var val in value) {
					
                    var details = JSON.parse(value[val]);
					log.debug("details", JSON.stringify(detailsArray));
                    var customerarray = details.customer;
                    var detailsArray = details.values;
					log.debug("ParentCustomer", detailsArray);
					var parentCustomer = detailsArray.ParentCustomer.value;
					
					var invoiceTypeTxt = detailsArray.InvoiceType.text;
					var s_startdate = detailsArray.startdate;
					var s_enddate = detailsArray.enddate;
					log.debug("startdatevstartdate",s_startdate)
					if(s_startdate){
						var postingDate = format.parse({
							value: s_startdate,
							type: format.Type.DATE
						})
						log.debug("postingDate",postingDate)
					}
					 
					var Invoice_Type = detailsArray.InvoiceType.value;
                    var SBUArray = detailsArray.SBU;
                    log.debug("invoiceTypeTxt ", invoiceTypeTxt);
                    log.debug("Invoice_Type ", Invoice_Type);
                    log.debug("SBU ", SBUArray.value);

                    var ORGArray = detailsArray.ORG;
                    log.debug("ORG", ORGArray.value);
					 var i_customer_id = customerarray.value;
					 var s_customer_Name = customerarray.text;

                    log.debug("customerarray", customerarray.value);
					if(invoiceTypeTxt== 'Parent Customer Wise'){
                         var i_customer_id = parentCustomer;
                    }

                    var ORGId = ORGArray.value;
                    var SBUId = SBUArray.value;
                    //******************************************CREATES NEW SALES ORDER AS PER SBU and ORG WISE********************************************************
					
                    var objRecord = record.load({
                        type: "customer",
                        id: i_customer_id,
                        isDynamic: true,
                    });
					
					var clientCode = objRecord.getText({
                        fieldId: "entityid"
                    });

                  /*   var Invoice_Type = objRecord.getValue({
                        fieldId: "custentitycusrecord_invoicetype"
                    }); */
                    log.debug("Invoice_Type", Invoice_Type);
                    var SBU = objRecord.getValue({
                        fieldId: "custentity_mhl_cust_sbu"
                    });
                    // log.debug("SBU",SBU);
					
					var billing_started = objRecord.getValue({
                        fieldId: "custentity_mhl_billing_started"
                    });

                    var Reve_seg = objRecord.getText({
                        fieldId: "custentity_mhl_cus_revenue_segment"
                    });
                    // log.debug("Reve_seg",Reve_seg);
                   /*  var ORG = objRecord.getText({
                        fieldId: "custentity_mhl_cus_org"
                    }); */
                    //log.debug("ORG",ORG);
                    var Billing_Cycle = objRecord.getText({
                        fieldId: "custentity_mhl_cus_invoicing_cycle"
                    });
                    //log.debug("Billing_Cycle",Billing_Cycle);
					
					if (Billing_Cycle) {
                        var num = Billing_Cycle.match(/\d+/g);
                        var days_num = num[0];
                        //log.debug("days_num",days_num);

                        var letr = Billing_Cycle.match(/[a-zA-Z]+/g);
                        var months = letr[0]
                        //log.debug("months",months);
                        if (s_startdate) {
                            var ConvertedDt = convert_date(postingDate);
                        } else {
                            var d_date = new Date();
                            var ConvertedDt = convert_date(d_date);
                        }

                        var day = ConvertedDt.getDate();
                        log.debug("day", day);
                        var month = ConvertedDt.getMonth() + 1;
                        //log.debug("month",month);
                        var year = ConvertedDt.getFullYear();
                        //log.debug("year",year);

                        var s_month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                        var numberFormat = year + "-" + s_month[ConvertedDt.getMonth()] + "-" + clientCode;

                        var numberSecondParam = '0';
                        var numberThirdParam = '0';
                        var numberFourthParam = '0';
                        var numberFifthParam = '0';
                        var numberSixthParam = '';

                        billing_started = parseInt(billing_started);

                        log.debug("billing_started", billing_started)

                        var firstDate = new Date(year, month - 1, billing_started);
                        log.debug("firstDate", firstDate);                      

                        //////////////////////////////////Monthly Billing Cycle/////////////////////////			
                        if (Billing_Cycle == '1 Month') {
                            var StartDate = new Date(year, month - 1, billing_started);
                            //log.debug("StartDate",StartDate);
                            var EndDate = new Date(year, month, (billing_started - 1));
                            //log.debug("EndDate",EndDate);
                            numberSecondParam = "M";
                        }

                        //////////////////////////////////15 Days Billing Cycle/////////////////////////		
                        if (Billing_Cycle == '15 Days' && day <= billing_started) {
                            var firstDate = new Date(year, month - 1, day);
                            var StartDate = new Date(year, (month - 1), day);
                            var EndDate = addDays(firstDate, (15 * 1));
                            log.debug("254 EndDate", EndDate);
                            numberSecondParam = "F1";
                        }

                        if (Billing_Cycle == '15 Days' && day > billing_started) {
                            var StartDate = addDays(firstDate, (15 * 1));
                            var EndDate = new Date(year, (month - 1), (billing_started - 1));
                            log.debug("260 else EndDate", EndDate);
                            numberSecondParam = "F2";
                        }

                        //return false;

                        //////////////////////////////////7 Days Billing Cycle/////////////////////////	

						var billing_started_0 = firstDate;
						var billing_started_7 = addDays(firstDate, (7));
						var billing_started_14 = addDays(firstDate, (14));
						var billing_started_21 = addDays(firstDate, (21));
						
						var f1_end_started_0 = new Date(billing_started_0);
						var f1_endDate_started_0 = f1_end_started_0.getDate();									
						
						
						//var f1_endDateObj = addDays(firstDate, (15 * 1));
						var f1_end_started_7 = new Date(billing_started_7);
						var f1_endDate_started_7 = f1_end_started_7.getDate();
						
						
						var f1_end_started_14 = new Date(billing_started_14);
						var f1_endDate_started_14 = f1_end_started_14.getDate();
					
						
						var f1_end_started_21 = new Date(billing_started_21);
						var f1_endDate_started_21 = f1_end_started_21.getDate();
						
						log.debug("billing_started_0",billing_started_0)
						log.debug("f1_endDate_started_0",f1_endDate_started_0+" < "+day +" < "+  f1_endDate_started_7)
						log.debug("f1_endDate_started_7",f1_endDate_started_7+" < "+day +" < "+  f1_endDate_started_14)
						log.debug("f1_endDate_started_14",f1_endDate_started_14+" < "+day +" < "+  f1_endDate_started_21)
						
						if( Billing_Cycle == '7 Days' &&  ( f1_endDate_started_0 <= day && day < 31 ))
						{
							
							var StartDate = new Date(year, month - 1, billing_started);
							var EndDate = addDays(firstDate, (7 * 1));
							numberSecondParam = "W1";
						}
						
						if( Billing_Cycle == '7 Days' &&  ( f1_endDate_started_7 <= day && day < f1_endDate_started_14))
						{
							
							var StartDate = addDays(firstDate, (f1_endDate_started_7));												
							var EndDate = addDays(firstDate, (f1_endDate_started_14));
							 numberSecondParam = "W2";
						}
						
						if( Billing_Cycle == '7 Days' &&  ( f1_endDate_started_14 <= day && day < f1_endDate_started_21))
						{
						
							var StartDate = addDays(firstDate, (f1_endDate_started_14));												
							var EndDate = addDays(firstDate, (f1_endDate_started_21));
							numberSecondParam = "W3";
						}
						
						if( Billing_Cycle == '7 Days' &&  ( f1_endDate_started_21 <= day && day < f1_endDate_started_0))
						{
							
							var StartDate = addDays(firstDate, (f1_endDate_started_21));												
							var EndDate = addDays(firstDate, (f1_endDate_started_0));
							numberSecondParam = "W4";
						}
						
						
						 log.debug("260 else EndDate", EndDate);
						 log.debug("300 else StartDate", StartDate);
						
                     
                        var Extendes_to_Org = objRecord.getValue({
                            fieldId: "custentity_mhl_extended_to_org"
                        });
                        //log.debug("Extendes_to_Org",Extendes_to_Org.length);

                        var ExOrg = ORGId;
                        log.debug("ExOrg", ExOrg);

                        var objORG = record.load({
                            type: "location",
                            id: ExOrg,
                            isDynamic: true,
                        });
                        var ORG_SBU = objORG.getValue({
                            fieldId: "custrecord_mhl_ref_sbu"
                        });
                        log.debug("ORG_SBU", ORG_SBU);

                    } 
					else
					{
						log.error("Customer Error",'Please select the Billing Cycle days on customer- '+s_customer_Name)
						createRnIRecord('Please select the Billing Cycle days on customer- '+s_customer_Name);
						return false;
					}

                   

                   
                    if (_logValidation(i_customer_id)) {

                        //////////////////////// ORG wise ////////////////////////////
                        if (Invoice_Type == 2) {
                            numberThirdParam = ExOrg;
                            var transactionSearchObj = search.create({
                                type: "transaction",
                                filters: [
                                    ["customer.internalid", "anyof", i_customer_id],
                                    "AND",
                                    ["status", "anyof", "SalesOrd:F"],
                                    "AND",
                                    ["mainline", "is", "T"],
                                    "AND",
                                    ["location", "anyof", ExOrg],
									"AND", 
									   ["startdate","on",s_startdate], 
									   "AND", 
									   ["enddate","on",s_enddate]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "entity",
                                        label: "Name"
                                    })
                                ]
                            });

                            var searchResultCount = transactionSearchObj.run().getRange({
                                start: 0,
                                end: 10
                            });
                            log.debug("countlength", searchResultCount.length);
                            //log.debug("count",searchResultCount);
                            if (searchResultCount.length == 0) {
                                var rec = record.create({
                                    type: record.Type.SALES_ORDER,
                                    isDynamic: true,
                                    defaultValues: {
                                        customform: 241,
                                        entity: i_customer_id
                                    }
                                });

                                numberFormat = numberFormat +"-"+ numberThirdParam +"-"+ numberFourthParam +"-"+ numberSecondParam;
                                rec.setValue({
                                    fieldId: 'custbody_mhl_b2b_doc_number',
                                    value: numberFormat
                                });
								
								var d_startdate = format.parse({
										value: s_startdate,
										type: format.Type.DATE
									});
									var d_enddate = format.parse({
										value: s_enddate,
										type: format.Type.DATE
									})
									log.debug("postingDate",s_startdate)
								
                                rec.setValue({
                                    fieldId: 'startdate',
                                    value: d_startdate
                                }); 
								
								rec.setValue({
                                    fieldId: 'trandate',
                                    value: d_startdate
                                });
                                rec.setValue({
                                    fieldId: 'enddate',
                                    value: d_enddate
                                });
                                rec.setText({
                                    fieldId: 'orderstatus',
                                    text: "Pending Fulfillment"
                                });
                                rec.setValue({
                                    fieldId: 'location',
                                    value: ExOrg
                                });
                                rec.setValue({
                                    fieldId: 'class',
                                    value: ORG_SBU
                                });

                                rec.selectNewLine({
                                    sublistId: 'item'
                                });

                                rec.setCurrentSublistText({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    text: Reve_seg
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    value: 1
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: "0.00"
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: "0.00"
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'location',
                                    value: ExOrg
                                });

                                // Save the line in the record's sublist
                                rec.commitLine({
                                    sublistId: 'item'
                                });

                                var recordId = rec.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                                log.audit("SO created", recordId);
                                var id = record.submitFields({
                                    type: record.Type.SALES_ORDER,
                                    id: recordId,
                                    values: {
                                        tranid: "SO-" + numberFormat
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    }
                                });

                            } else {
                                var recordId = searchResultCount[0].id;
                                log.audit("SO Found", recordId);
                            }
                        }
/*

,
									"AND", 
									   ["startdate","on",s_startdate], 
									   "AND", 
									   ["enddate","on",s_enddate]
*/
                        ////////////////////// SBU wise ////////////////////////////
                        if (Invoice_Type == 3) {
                            numberFourthParam = ORG_SBU;
                            var transactionSearchObj = search.create({
                                type: "transaction",
                                filters: [
                                    ["status", "anyof", "SalesOrd:F"],
                                    "AND",
                                    ["mainline", "is", "T"],									
                                    "AND",
                                    ["customer.internalid", "anyof", i_customer_id],
                                    "AND",
                                    ["class", "anyof", ORG_SBU],
									"AND", 
									   ["startdate","on",s_startdate], 
									   "AND", 
									   ["enddate","on",s_enddate]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "entity",
                                        label: "Name"
                                    })
                                ]
                            });

                            var searchResultCount = transactionSearchObj.run().getRange({
                                start: 0,
                                end: 10
                            });
                            log.debug("countlength", searchResultCount.length);
                            //log.debug("count",searchResultCount);
                            if (searchResultCount.length == 0) {
                                var rec = record.create({
                                    type: record.Type.SALES_ORDER,
                                    isDynamic: true,
                                    defaultValues: {
                                        customform: 241,
                                        entity: i_customer_id
                                    }
                                });

                                numberFormat = numberFormat +"-"+ numberThirdParam +"-"+ numberFourthParam +"-"+ numberSecondParam;
                                rec.setValue({
                                    fieldId: 'custbody_mhl_b2b_doc_number',
                                    value: numberFormat
                                });
								var d_startdate = format.parse({
										value: s_startdate,
										type: format.Type.DATE
									});
									var d_enddate = format.parse({
										value: s_enddate,
										type: format.Type.DATE
									})
                                rec.setValue({
                                    fieldId: 'startdate',
                                    value: d_startdate
                                });
								rec.setValue({
                                    fieldId: 'trandate',
                                    value: d_startdate
                                });
                                rec.setValue({
                                    fieldId: 'enddate',
                                    value: d_enddate
                                });
                                rec.setText({
                                    fieldId: 'orderstatus',
                                    text: "Pending Fulfillment"
                                });
                                rec.setValue({
                                    fieldId: 'location',
                                    value: ExOrg
                                });
                                rec.setValue({
                                    fieldId: 'class',
                                    value: ORG_SBU
                                });

                                rec.selectNewLine({
                                    sublistId: 'item'
                                });

                                rec.setCurrentSublistText({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    text: Reve_seg
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    value: 1
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: "0.00"
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: "0.00"
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'location',
                                    value: ExOrg
                                });

                                // Save the line in the record's sublist
                                rec.commitLine({
                                    sublistId: 'item'
                                });

                                var recordId = rec.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                                log.audit("SO created", recordId);
                                var id = record.submitFields({
                                    type: record.Type.SALES_ORDER,
                                    id: recordId,
                                    values: {
                                        tranid: "SO-" + numberFormat
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    }
                                });

                            } else {
                                var recordId = searchResultCount[0].id;
                                log.audit("SO Found", recordId);
                            }
                        }

                        ////////////////////// Customer wise OR Hub Wise////////////////////////////
                        if (Invoice_Type == 1) {
                            numberFifthParam = Invoice_Type;
                            var transactionSearchObj = search.create({
                                type: "transaction",
                                filters: [
                                    ["customer.internalid", "anyof", i_customer_id],
                                    "AND",
                                    ["status", "anyof", "SalesOrd:F"],
                                    "AND",
                                    ["mainline", "is", "T"],
									"AND", 
									   ["startdate","on",s_startdate], 
									   "AND", 
									   ["enddate","on",s_enddate]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "entity",
                                        label: "Name"
                                    })
                                ]
                            });

                            var searchResultCount = transactionSearchObj.run().getRange({
                                start: 0,
                                end: 10
                            });
                            log.debug("countlength", searchResultCount.length);
                            //log.debug("count",searchResultCount);
                            if (searchResultCount.length == 0) {
                                var rec = record.create({
                                    type: record.Type.SALES_ORDER,
                                    isDynamic: true,
                                    defaultValues: {
                                        customform: 241,
                                        entity: i_customer_id
                                    }
                                });
                                numberFormat = numberFormat +"-"+ numberThirdParam +"-"+ numberFourthParam +"-"+ numberSecondParam;
                                rec.setValue({
                                    fieldId: 'custbody_mhl_b2b_doc_number',
                                    value: numberFormat
                                });
								var d_startdate = format.parse({
										value: s_startdate,
										type: format.Type.DATE
									});
									var d_enddate = format.parse({
										value: s_enddate,
										type: format.Type.DATE
									})
								
								log.debug("s_startdate",s_startdate)
                                rec.setValue({
                                    fieldId: 'startdate',
                                    value:d_startdate
                                });
								rec.setValue({
                                    fieldId: 'trandate',
                                    value: d_startdate
                                });
                                rec.setValue({
                                    fieldId: 'enddate',
                                    value: d_enddate
                                });
                                rec.setText({
                                    fieldId: 'orderstatus',
                                    text: "Pending Fulfillment"
                                });
                                rec.setValue({
                                    fieldId: 'location',
                                    value: ExOrg
                                });
                                rec.setValue({
                                    fieldId: 'class',
                                    value: ORG_SBU
                                });

                                rec.selectNewLine({
                                    sublistId: 'item'
                                });

                                rec.setCurrentSublistText({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    text: Reve_seg
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    value: 1
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: "0.00"
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: "0.00"
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'location',
                                    value: ExOrg
                                });

                                // Save the line in the record's sublist
                                rec.commitLine({
                                    sublistId: 'item'
                                });

                                var recordId = rec.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                                log.audit("SO created", recordId);

                                var id = record.submitFields({
                                    type: record.Type.SALES_ORDER,
                                    id: recordId,
                                    values: {
                                        tranid: "SO-" + numberFormat
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    }
                                });
                            } else {
                                var recordId = searchResultCount[0].id;
                                log.audit("SO Found", recordId);
                            }
                        }
						/////////////////////  parent wise////////////////////////////
                        if (Invoice_Type == 4) {
                            numberFifthParam = Invoice_Type;
                            var transactionSearchObj = search.create({
                                type: "transaction",
                                filters: [
                                    ["customer.internalid", "anyof", i_customer_id],
                                    "AND",
                                    ["status", "anyof", "SalesOrd:F"],
                                    "AND",
                                    ["mainline", "is", "T"],
									"AND", 
									   ["startdate","on",s_startdate], 
									   "AND", 
									   ["enddate","on",s_enddate]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "entity",
                                        label: "Name"
                                    })
                                ]
                            });

                            var searchResultCount = transactionSearchObj.run().getRange({
                                start: 0,
                                end: 10
                            });
                            log.debug("countlength", searchResultCount.length);
                            //log.debug("count",searchResultCount);
                            if (searchResultCount.length == 0) {
                                var rec = record.create({
                                    type: record.Type.SALES_ORDER,
                                    isDynamic: true,
                                    defaultValues: {
                                        customform: 241,
                                        entity: i_customer_id
                                    }
                                });
                                numberFormat = numberFormat +"-"+ numberThirdParam +"-"+ numberFourthParam +"-"+ numberSecondParam;
                                rec.setValue({
                                    fieldId: 'custbody_mhl_b2b_doc_number',
                                    value: numberFormat
                                });
								var d_startdate = format.parse({
										value: s_startdate,
										type: format.Type.DATE
									});
									var d_enddate = format.parse({
										value: s_enddate,
										type: format.Type.DATE
									})
                                rec.setValue({
                                    fieldId: 'startdate',
                                    value: d_startdate
                                });
								rec.setValue({
                                    fieldId: 'trandate',
                                    value: d_startdate
                                });
                                rec.setValue({
                                    fieldId: 'enddate',
                                    value: d_enddate
                                });
                                rec.setText({
                                    fieldId: 'orderstatus',
                                    text: "Pending Fulfillment"
                                });
                                rec.setValue({
                                    fieldId: 'location',
                                    value: ExOrg
                                });
                                rec.setValue({
                                    fieldId: 'class',
                                    value: ORG_SBU
                                });

                                rec.selectNewLine({
                                    sublistId: 'item'
                                });

                                rec.setCurrentSublistText({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    text: Reve_seg
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    value: 1
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: "0.00"
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: "0.00"
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'location',
                                    value: ExOrg
                                });

                                // Save the line in the record's sublist
                                rec.commitLine({
                                    sublistId: 'item'
                                });

                                var recordId = rec.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                                log.audit("SO created", recordId);

                                var id = record.submitFields({
                                    type: record.Type.SALES_ORDER,
                                    id: recordId,
                                    values: {
                                        tranid: "SO-" + numberFormat
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    }
                                });
                            } else {
                                var recordId = searchResultCount[0].id;
                                log.audit("SO Found", recordId);
                            }
                        }
                    }
/*
,
								"AND", 
							   ["startdate","on",s_startdate], 
							   "AND", 
							   ["enddate","on",s_enddate]
*/
                    //*****************************************SEARCH THE EXISTING B2B VID and TAGGED THE CREATED SO **********************************************************
					var i_customer_id = customerarray.value;
                    var customrecord_b2b_vid_detailsSearchObj = search.create({
                        type: "customrecord_b2b_vid_details",
                        filters: [
							  ["custrecord_clientname", "anyof", i_customer_id],
							  "AND",
							  ["custrecord_mhl_vid_org", "anyof", ORGId],
							  "AND", 
								["custrecord_salesorder","anyof","@NONE@"],
							  "AND",
							  ["custrecord_mhl_vid_sbu", "anyof", SBUId],
							  "AND", 
							   ["custrecord_mhl_blii_start_date","on",s_startdate], 
							   "AND", 
							   ["custrecord_mhl_bill_end_date","on",s_enddate]
						   ],
                        columns: [
							  search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
							  search.createColumn({
                                name: "scriptid",
                                label: "Script ID"
                            }),
							  search.createColumn({
                                name: "custrecord_clientname",
                                label: "Client Name"
                            }),
							  search.createColumn({
                                name: "custrecord_salesorder",
                                label: "Sales Order"
                            }),
							  search.createColumn({
                                name: "custrecord_invoice_number",
                                label: "Invoice No."
                            }),
							  search.createColumn({
                                name: "custrecord_patientnumber",
                                label: "Patient Number"
                            }),
							  search.createColumn({
                                name: "custrecord_patientname",
                                label: "Patient Name"
                            })
						   ]
                    });
                    var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
					  var resultSet = customrecord_b2b_vid_detailsSearchObj.run().getRange({
							start: 0,
							end: 1000
						});
					
                  
					var totalVIDUpdated = 0;
					////////////////////////////////////////////////////////// Updating the B2B VID records with SO id
					if (resultSet != null && resultSet != '' && resultSet != ' ') {
						var completeResultSet = resultSet;
						var start = 1000;
						var last = 2000;

						while (resultSet.length == 1000) {
							resultSet = customrecord_b2b_vid_detailsSearchObj.run().getRange(start, last);
							completeResultSet = completeResultSet.concat(resultSet);
							start = parseFloat(start) + 1000;
							last = parseFloat(last) + 1000;

							//log.debug("getInputData Call","start "+start)
						}
						resultSet = completeResultSet;
						if (resultSet) {
							//log.audit('Posting Dates: resultSet: ' , resultSet.length);
							for(var r in resultSet)
							{
								var i_b2bVid = resultSet[r].id;
								//log.debug("i_b2bVid "+r,"i_b2bVid "+i_b2bVid+" recordId "+recordId)
								record.submitFields({
									type: 'customrecord_b2b_vid_details',
									id: i_b2bVid,
									values: {
										custrecord_salesorder: recordId
									},
									options: {
										enableSourcing: true,
										ignoreMandatoryFields: true
									}
								});
								totalVIDUpdated++;
							}
						}
					}
					log.audit("Sales order on "+recordId, "Total B2B VID updated "+totalVIDUpdated);
					
					//////////////////////////////////////////////////////////
					
					
					
                    /* customrecord_b2b_vid_detailsSearchObj.run().each(function (result) {

                        var id = record.submitFields({
                            type: 'customrecord_b2b_vid_details',
                            id: result.id,
                            values: {
                                custrecord_salesorder: recordId
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }
                        });
                        // .run().each has a limit of 4,000 results
                        return true;
                    }); */
                    //***************************************************************************************************
                } //reduce for loop

                return false;

            } catch (e) {
                log.error("reduce | error", e)
            }
        }

        ///////////////////////////////////////////////////////////

        function summarize(summary) {
            try {

            } catch (error) {
                log.error('Catch', 'Msg- ' + error);
            }
        }

        /////////////////////////////////////////////////////////
        function _logValidation(value) {
            if (value != null && value != undefined && value != '' && value != 'undefined') {
                return true;
            } else {
                return false;
            }
        }

        function _nullValidation(val) {
            if (val == null || val == undefined || val == '') {
                return true;
            } else {
                return false;
            }
        }

        function convert_date(d_date) {
            var d_date_convert = "";
            if (_logValidation(d_date)) {
                var currentTime = new Date(d_date);
                var currentOffset = currentTime.getTimezoneOffset();
                var ISTOffset = 330; // IST offset UTC +5:30 
                d_date_convert = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
            }
            return d_date_convert;
        }
		
		 function createRnIRecord(e) {
	            var rnIRec = record.create({
	                type: 'customrecord_rni_integration_status'
	            });
	            
	            rnIRec.setValue({
	                fieldId: 'custrecord_json_type',
	                value: '14'
	            });
	            rnIRec.setValue({
	                fieldId: 'custrecord_error_description',
	                value: e.toString()
	            });
	            rnIRec.setValue({
	                fieldId: 'custrecord_processed',
	                value: '2'
	            });
	            rnIRec.save();
	        }

        function addDays(date, days) {
            var result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });