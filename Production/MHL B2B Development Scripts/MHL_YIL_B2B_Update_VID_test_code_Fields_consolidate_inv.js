	/**
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	* Script Name: MHL_YIL_B2B_Update_VID_test_code_Fields_consolidate_inv.js
	* Author:Ganesh Sapakale
	* Date: Nov 2022
	* Description: This script will update invoice id on test codes record.
	 */
	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib'],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function (file, format, record, search, runtime, mhllib, datellib) {

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
	                log.audit("deployment Id", deploymentId)

	                return search.load({
	                    id: 'customsearch_mhl_b2b_test_vid_update'
	                });

	            } catch (e) {
	                createRnIRecord(e, 'search Issue');
	                log.error({
	                    title: 'Error Occured while collecting JSON for VID',
	                    details: e
	                });
	            }
	        }

	        function map(context) {
	            try {

	                //log.debug("context",JSON.stringify(context.value.transaction))
	                var data = JSON.parse(context.value); //read the data
	                log.debug("context data", JSON.stringify(data));
					
					   var a_usage_data = JSON.parse(context.value);
				log.debug("JSON",JSON.stringify(a_usage_data));
				
				var s_data = context.value;
				
				
				
				log.debug("s_data  ",(s_data))
				
				//return false;
				
				//var s_data = s_data.replace(/.CUSTRECORD_SALESORDER/g, 'CUSTRECORD_SALESORDER');
				var s_data = s_data.replace(/.CUSTRECORD_REFERENCE_B2B/g, 'CUSTRECORD_REFERENCE_B2B');
				var testData = JSON.parse(s_data)
				
				var i_b2bVId = testData.id
				//var invoice_id = testData.values.custbody_invoice_noCUSTRECORD_SALESORDER.value;
				var invoice_id = testData.values.custrecord_invoice_numberCUSTRECORD_REFERENCE_B2B.value;
				log.audit("invoice_id",i_b2bVId+" | "+invoice_id);
				
				
				var RecordId = record.submitFields({
						type: 'customrecord_b2b_vid_test_details',
						id: i_b2bVId,
						values: {
							custrecord_mhl_testdet_invoice_no: invoice_id
						},
						options: {
							enableSourcing: true,
							ignoreMandatoryFields: true
						}
					});
				
				
               /*  var Jsonarr = new Array();
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
				} */
					
					
					
					return false;
					
					

	             
	            } catch (ex) {
	                log.error({
	                    title: 'map: error in creating records',
	                    details: ex
	                });
	                createRnIRecord(ex, jsonFile.name);
	                jsonFile.folder = '450964';
	                jsonFile.save();
	            }
	        }

	        /////////////////////////////////////////////////////// Create Invoice /////////////////////////////////////////////////////////////

	        function createVIDForJson(JSONfromRnI, fileName, fileId, i_vid) {
	            try {
	                var flag = 0;
	                if (JSONfromRnI.OrderInfo) {
	                    var tempArray = [];
	                    if (Array.isArray(JSONfromRnI.OrderInfo)) {
	                        tempArray = JSONfromRnI.OrderInfo;
	                    } else {
	                        tempArray.push(JSONfromRnI.OrderInfo);
	                    }

	                    if (tempArray.length > 0) {
	                        flag = 0;
	                    } else {
	                        flag = 1;
	                    }
	                } else {
	                    flag = 1;
	                }

	                // Search Registered Collection Center and it's Org
	                //var locationCenterDetails=searchLocationCenter(JSONfromRnI.VisitInfo.LocationID);

	                var visitNumberToBeFound = JSONfromRnI.VisitInfo.VisitNumber;
	                var visitDate = JSONfromRnI.VisitInfo.visitDate;
	                if (visitDate) {

	                   // var f_dupVID = checkBvid(visitNumberToBeFound)

	                    //Added line of if(visitNumberToBeFound) as CMS External ID filter operator issue 
	                    var invoiceRecId;

	                   var f_dupVID = true;
	                    if (f_dupVID) {
	                        // This code is added by Ganesh, to get dynamic location, org, sbu and unit from NetSuite master. : 25-08-2021
	                        var s_locationCode = JSONfromRnI.VisitInfo.locationCode;
	                        // var locationCenterDetails = mhllib.findCustomerLocation(JSONfromRnI.VisitInfo.locationCode);

	                        if (s_locationCode) {
	                            var customrecord_cseg_mhl_locationsSearchObj = search.create({
	                                type: "customrecord_cseg_mhl_locations",
	                                filters: [
										["custrecord_mhl_loc_code", "is", s_locationCode],
										'AND',
										["isinactive", "is", "F"]
									],
	                                columns: [
										search.createColumn({
	                                        name: "name",
	                                        sort: search.Sort.ASC,
	                                        label: "Name"
	                                    }),
										search.createColumn({
	                                        name: "internalid",
	                                        label: "Internal ID"
	                                    }),
										search.createColumn({
	                                        name: "custrecord_mhl_org_id",
	                                        label: "Org ID"
	                                    }),
										search.createColumn({
	                                        name: "custrecord_mhl_location_id",
	                                        label: "Location ID"
	                                    }),
										search.createColumn({
	                                        name: "custrecord_mhl_loc_code",
	                                        label: "Code"
	                                    }),
										search.createColumn({
	                                        name: "custrecord_mhl_location_type",
	                                        label: "Location Type"
	                                    }),
										search.createColumn({
	                                        name: "custrecord_mhl_loc_org",
	                                        label: "Org"
	                                    }),
										search.createColumn({
	                                        name: "cseg_mhl_custseg_un",
	                                        join: "CUSTRECORD_MHL_LOC_ORG",
	                                        label: "Unit"
	                                    }),
										search.createColumn({
	                                        name: "custrecord_mhl_ref_sbu",
	                                        join: "CUSTRECORD_MHL_LOC_ORG",
	                                        label: "SBU"
	                                    })
									]
	                            });
	                            var searchResultCount = customrecord_cseg_mhl_locationsSearchObj.runPaged().count;
	                            log.debug("customrecord_cseg_mhl_locationsSearchObj result count", searchResultCount);
	                        }
	                        var registeredOrg = '';
	                        var orgInternalId = '';
	                        var sbu = '';
	                        var unit = '';
	                        if (searchResultCount > 0) {
	                            customrecord_cseg_mhl_locationsSearchObj.run().each(function (result) {
	                                // .run().each has a limit of 4,000 results
	                                //var locationOrgSearchDetails = result.getValue("")

	                                // log.debug("Org Location Search Details", JSON.stringify(result))
	                                unit = result.getValue({
	                                    name: "cseg_mhl_custseg_un",
	                                    join: "CUSTRECORD_MHL_LOC_ORG"
	                                });

	                                orgInternalId = parseInt(result.getValue({
	                                    name: "custrecord_mhl_loc_org"
	                                }));

	                                locationInternalId = result.getValue({
	                                    name: "internalid"
	                                });
	                                sbu = result.getValue({
	                                    name: "custrecord_mhl_ref_sbu",
	                                    join: "CUSTRECORD_MHL_LOC_ORG"
	                                });

	                                return true;
	                            });
	                        }
	                        ////log.debug('locationCenterDetails',locationCenterDetails);
	                        /*if (!locationCenterDetails.orgInternalId) {
	                        	locationCenterDetails = mhllib.findLocation(JSONfromRnI.VisitInfo.LocationID);
	                        }
	                        */
	                        if (orgInternalId) {
	                            // Update the varible : 25-08-2021
	                            var registeredOrg = parseInt(orgInternalId); //locationCenterDetails[0].getValue({name:'custrecord_mhl_loc_org'});
	                            var custSubsidiary = '';
	                            var locationOrgId = locationInternalId; //locationCenterDetails[0].getValue({name:'internalid'});

	                            //log.debug('Registered Org',registeredOrg);
	                            var locationDetails = '';
	                            var custSubsidiary = '';
	                            var vidUnit = unit;
	                            var vidSbu = sbu;

	                            /////////////// Search customer by cleint code and org id
	                            ////log.debug('custSubsidiary',custSubsidiary);
	                            //JSONfromRnI.VisitInfo.ClientCode, registeredOrg
	                            var customerDetails = searchCustomer(JSONfromRnI.VisitInfo.ClientCode, registeredOrg, custSubsidiary, JSONfromRnI.OrgID);

	                            log.debug("Customer Details ", JSON.stringify(customerDetails))

	                            if (customerDetails) {
	                                var customerInternalId = customerDetails[0].id;
	                                var customerSegment = customerDetails[0].getText({
	                                    name: 'custentity_mhl_cus_revenue_segment'
	                                });
	                                var customerPaymentType = customerDetails[0].getValue({
	                                    name: 'custentity_mhl_customer_payment_mode'
	                                });

	                                log.debug("customerType", customerPaymentType)

	                                var customerSubsidiary = customerDetails[0].getValue({
	                                    name: 'subsidiary'
	                                });

	                                var customer_invoicing_cycleText = customerDetails[0].getText({
	                                    name: 'custentity_mhl_cus_invoicing_cycle'
	                                });

	                                var customer_client_type = customerDetails[0].getValue({
	                                    name: 'custentity_mhl_cust_client_type'
	                                });
	                                var subsidiaryTimezone_gmt = customerDetails[0].getValue({
	                                    name: "custrecord_mhl_timezone_gmt",
	                                    join: "mseSubsidiary"
	                                });

	                                var Invoice_Type = customerDetails[0].getValue({
	                                    name: "custentitycusrecord_invoicetype"
	                                });
	                                log.debug("Invoice_Type", Invoice_Type);
	                                /* var SBU = customerDetails[0].getValue({
	                                    name: "custentitycusrecord_invoicetype"
	                                }); */
	                                // log.debug("SBU",SBU);

	                                var Reve_seg = customerDetails[0].getText({
	                                    name: "custentity_mhl_cus_revenue_segment"
	                                });
	                                // log.debug("Reve_seg",Reve_seg);
	                                var ORG = customerDetails[0].getText({
	                                    name: "custentity_mhl_cus_org"
	                                });
	                                //log.debug("ORG",ORG);
	                                var Billing_Cycle = customerDetails[0].getText({
	                                    name: "custentity_mhl_cus_invoicing_cycle"
	                                });

	                                var Extendes_to_Org = customerDetails[0].getValue({
	                                    name: "custentity_mhl_extended_to_org"
	                                });
	                                log.debug("Extendes_to_Org", Extendes_to_Org)

	                                ////log.debug('Client Internal Id',customerInternalId);
	                                ////log.debug('Client Segment',customerSegment);

	                                if (customerPaymentType != 1) {
	                                    log.debug("Welcome ", "B2B Invoiceing")
	                                    var num = customer_invoicing_cycleText.match(/\d+/g);
	                                    var days_num = num[0];
	                                    log.debug("days_num", days_num);

	                                    var letr = customer_invoicing_cycleText.match(/[a-zA-Z]+/g);
	                                    var months = letr[0]
	                                    log.debug("months", months);

	                                 //  var visitDate = JSONfromRnI.VisitInfo.visitDate;
									   var trans_date = datellib.findDate(visitDate, null, subsidiaryTimezone_gmt);
	                                  
										var d_date = new Date(trans_date);
										var ConvertedDt = convert_date(d_date);
										
										log.debug("ConvertedDt",ConvertedDt)
										var day = ConvertedDt.getDate();
										//log.debug("day",day);
										var month = ConvertedDt.getMonth() + 1;
										//log.debug("month",month);
										var year = ConvertedDt.getFullYear();
										var firstDate = new Date(year, month - 1, 1);
										

										var lastDate = new Date(year, month, 0);
										
	                                   if (Billing_Cycle == '1 Month') {
											var StartDate = new Date(year, month - 1, 1);
											//log.debug("StartDate",StartDate);
											var EndDate = new Date(year, month, 0);
											//log.debug("EndDate",EndDate);
											
										}

										//////////////////////////////////15 Days Billing Cycle/////////////////////////		
										if (Billing_Cycle == '15 Days' && day <= 15) {
											var StartDate = new Date(year, month - 1, 1);
											var EndDate = addDays(firstDate, (14 * 1));
											//log.debug("EndDate",EndDate);
											
										}

										if (Billing_Cycle == '15 Days' && day > 15) {
											var StartDate = addDays(firstDate, (15 * 1));
											var EndDate = new Date(year, month, 0);
											//log.debug("EndDate",EndDate);
											
										}

										//////////////////////////////////7 Days Billing Cycle/////////////////////////	
										if (Billing_Cycle == '15 Days' && day > 15) {
											var StartDate = addDays(firstDate, (15 * 1));
											var EndDate = new Date(year, month, 0);
											//log.debug("EndDate",EndDate);
											
										}

										//////////////////////////////////7 Days Billing Cycle/////////////////////////	
										if (Billing_Cycle == '7 Days' && day <= 7) {
											var StartDate = new Date(year, month - 1, 1);
											var EndDate = addDays(firstDate, (6 * 1));
											//log.debug("EndDate",EndDate);
											
										}

										if (Billing_Cycle == '7 Days' && (day > 7 && day <= 14)) {
											var StartDate = addDays(firstDate, (7 * 1));
											var EndDate = addDays(firstDate, (13 * 1));
											//log.debug("EndDate",EndDate);
											
										}

										if (Billing_Cycle == '7 Days' && (day > 14 && day <= 21)) {
											var StartDate = addDays(firstDate, (14 * 1));
											//log.debug("StartDate",StartDate);
											var EndDate = addDays(firstDate, (20 * 1));
											//log.debug("EndDate",EndDate);
											
										}

										if (Billing_Cycle == '7 Days' && day > 21) {
											var StartDate = addDays(firstDate, (21 * 1));
											var EndDate = new Date(year, month, 0);
											//log.debug("EndDate",EndDate);
											
										}

	                                    // Search the sales order against the Customer
										
										log.debug("customerInternalId",customerInternalId)
										log.debug("Billing_Cycle",Billing_Cycle)
										log.debug("registeredOrg",registeredOrg)
										log.debug("vidSbu",vidSbu)
										log.debug("Invoice_Type",Invoice_Type)
										log.debug("Reve_seg",Reve_seg)
										
										
										//return false;
										
	                                    //var i_newSO_id = findSO(customerInternalId, Billing_Cycle, registeredOrg, vidSbu, Invoice_Type, Reve_seg, JSONfromRnI.VisitInfo.ClientCode)


	                                    //log.debug("i_salesOrderId", i_newSO_id)

	                                    //return false;

	                                    var todayDate = new Date();
	                                    var o_vidObj = record.load({
	                                        type: 'customrecord_b2b_vid_details',
											id:i_vid,
	                                        isDynamic: true

	                                    });
										
										
										 o_vidObj.setValue({
                                                fieldId: 'custrecord_vid_date',
                                                value: format.parse({
                                                    value: trans_date,
                                                    type: format.Type.DATE
                                                })
                                            });

										
										o_vidObj.setValue({
	                                        fieldId: 'custrecord_mhl_blii_start_date',
	                                        value: StartDate
	                                    });

										o_vidObj.setValue({
	                                        fieldId: 'custrecord_mhl_bill_end_date',
	                                        value: EndDate
	                                    });


	                                  

	                                    var o_patientId = o_vidObj.save({
	                                        enableSourcing: true,
	                                        ignoreMandatoryFields: true
	                                    });

	                                    log.debug('o_patientId Created', o_patientId);
	                                    //log.debug('i_soId Created', i_soId);
	                                    return o_patientId;
	                                    //recmachcustrecord_reference_b2b
	                                } else {
	                                    log.debug("Welcome ", "B2C Invoiceing")
	                                    return "-450674"
	                                }

	                            } else {
	                                //log.debug('Can Not Create VID','Customer Not Found');
	                                createRnIRecord('Client code Not Found ' + JSONfromRnI.VisitInfo.ClientCode + ' For Registered ORG Internal ID ' + registeredOrg + ' & For VID ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);

	                            }
	                        } else {
	                            //log.debug('Register Collection center not found','Register collection center not found');
	                            createRnIRecord('Registered Location details not found ' + JSONfromRnI.VisitInfo.locationCode + ' For VID ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                            return '-337799';

	                        }
	                    } else {
	                        log.error('Duplicate VID number Found', 'VID number already present in NetSuite');
	                        createRnIRecord('Duplicate VID Number found ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                        return '-5544';
	                    }
	                } else {
	                    createRnIRecord('Visit Date is not available in JSON for ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                    return '';
	                }

	            } catch (inve) {
	                log.error({
	                    title: 'Error Occured while creating Invoice',
	                    details: inve
	                });
	                createRnIRecord('Error Occured for For VID ' + JSONfromRnI.VisitInfo.VisitNumber + ' details ' + JSON.stringify(inve), fileName);
					return '';
	            }
	        }

	        function searchInvoice(vid) {
	            ////log.debug({title:'vid ',details:vid});
	            var invDetFilter = [];
	            // code updated for Filter of Search on 1 Sept As CMS is getting error custbody_mhl_invoice_vid_number/externalid for invalid operator
	            invDetFilter.push(search.createFilter({
	                name: 'mainline',
	                operator: search.Operator.IS,
	                values: 'T'
	            }));

	            if (vid) {
	                invDetFilter.push(search.createFilter({
	                    name: 'custbody_mhl_invoice_vid_number',
	                    operator: search.Operator.IS,
	                    values: vid
	                }));

	                invDetFilter.push(search.createFilter({
	                    name: 'externalid',
	                    operator: search.Operator.IS,
	                    values: 'inv_' + vid
	                }));
	            } else {
	                log.error('VID not found for VID number and External ID Search criteria');
	            }

	            var vidSearch = search.create({
	                type: search.Type.INVOICE,
	                columns: ['internalid', 'custbody_mhl_inv_payment_mode', 'entity', 'location', 'department'],
	                filters: invDetFilter
	            });

	            //			[				['custbody_mhl_invoice_vid_number', 'is', vid], 'AND',['externalid', 'is', vid], 'AND', ['mainline', 'is', 'T'] 			]
	            var invResultSet = vidSearch.run();

	            var invResultRange = invResultSet.getRange({
	                start: 0,
	                end: 1
	            });
	            ////log.debug({title:'invResultRange ',details:invResultRange});

	            if (invResultRange.length > 0) {
	                ////log.debug({title:'Tranid found ',details:invResultRange[0]});
	                return invResultRange[0].getValue({
	                    name: 'internalid'
	                });
	            } else {
	                return '';
	            }
	        }

	        function search_cluster_price(itemInternalId, registeredOrg) {

	            var rateSearch = search.create({
	                type: 'customrecord_mhl_test_master_cluster_pri',
	                columns: ['custrecord_mhl_cluster_price'],
	                filters: [
						['isinactive', 'is', 'F'], 'AND', ['custrecord_mhl_test_code_cluster', 'is', itemInternalId], 'AND', ['custrecord_mhl_org_name_cluster1', 'is', registeredOrg]
					]
	            });

	            var searchResult = rateSearch.run().getRange({
	                start: 0,
	                end: 1
	            });
	            var i_cluster_price = '';
	            if (searchResult.length > 0) {
	                ////log.debug({title:'cluster rec id',details:searchResult[0].id});
	                i_cluster_price = searchResult[0].getValue({
	                    name: 'custrecord_mhl_cluster_price'
	                });
	            }

	            return i_cluster_price;
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

	        function findSO(i_customer_id, Billing_Cycle, Extendes_to_Org, SBU, Invoice_Type, Reve_seg, clientCode) {

	            log.debug("findSO", "Data received " + i_customer_id + " Billing_Cycle " + Billing_Cycle + " Extendes_to_Org " + Extendes_to_Org + " SBU " + SBU + " Invoice_Type " + Invoice_Type)
				
				//return false;
	            var num = Billing_Cycle.match(/\d+/g);
	            var days_num = num[0];
	            //log.debug("days_num",days_num);

	            var letr = Billing_Cycle.match(/[a-zA-Z]+/g);
	            var months = letr[0]
	            //log.debug("months",months);

	            var d_date = new Date();
	            var ConvertedDt = convert_date(d_date);
	            var day = ConvertedDt.getDate();
	            //log.debug("day",day);
	            var month = ConvertedDt.getMonth() + 1;
	            //log.debug("month",month);
	            var year = ConvertedDt.getFullYear();

	            var numberFormat = year + "-" + month + "-" + clientCode;

	            var numberSecondParam = '0';
	            var numberThirdParam = '0';
	            var numberFourthParam = '0';
	            var numberFifthParam = '0';
	            var numberSixthParam = '';

	            var firstDate = new Date(year, month - 1, 1);
	            //log.debug("firstDate",firstDate);

	            var lastDate = new Date(year, month, 0);
	            //log.debug("lastDate",lastDate);

	            //////////////////////////////////Monthly Billing Cycle/////////////////////////			
	            if (Billing_Cycle == '1 Month') {
	                var StartDate = new Date(year, month - 1, 1);
	                //log.debug("StartDate",StartDate);
	                var EndDate = new Date(year, month, 0);
	                //log.debug("EndDate",EndDate);
	                numberSecondParam = "M";
	            }

	            //////////////////////////////////15 Days Billing Cycle/////////////////////////		
	            if (Billing_Cycle == '15 Days' && day <= 15) {
	                var StartDate = new Date(year, month - 1, 1);
	                var EndDate = addDays(firstDate, (14 * 1));
	                numberSecondParam = "F1";
	                //log.debug("EndDate",EndDate);
	            }

	            if (Billing_Cycle == '15 Days' && day > 15) {
	                var StartDate = addDays(firstDate, (15 * 1));
	                var EndDate = new Date(year, month, 0);
	                //log.debug("EndDate",EndDate);
	                numberSecondParam = "F2";
	            }

	            //////////////////////////////////7 Days Billing Cycle/////////////////////////	
	            if (Billing_Cycle == '7 Days' && day <= 7) {
	                var StartDate = new Date(year, month - 1, 1);
	                var EndDate = addDays(firstDate, (6 * 1));
	                //log.debug("EndDate",EndDate);
	                numberSecondParam = "W1";
	            }

	            if (Billing_Cycle == '7 Days' && (day > 7 && day <= 14)) {
	                var StartDate = addDays(firstDate, (7 * 1));
	                var EndDate = addDays(firstDate, (13 * 1));
	                //log.debug("EndDate",EndDate);
	                numberSecondParam = "W2";
	            }

	            if (Billing_Cycle == '7 Days' && (day > 14 && day <= 21)) {
	                var StartDate = addDays(firstDate, (14 * 1));
	                //log.debug("StartDate",StartDate);
	                var EndDate = addDays(firstDate, (20 * 1));
	                //log.debug("EndDate",EndDate);
	                numberSecondParam = "W3";
	            }

	            if (Billing_Cycle == '7 Days' && day > 21) {
	                var StartDate = addDays(firstDate, (21 * 1));
	                var EndDate = new Date(year, month, 0);
	                //log.debug("EndDate",EndDate);
	                numberSecondParam = "W4";
	            }

	            //  for (var i = 0; i < Extendes_to_Org.length; i++) 
	            {
	                var ExOrg = Extendes_to_Org;

	                log.debug("ExOrg", ExOrg);

	                if (_logValidation(i_customer_id)) {
	                    if (Invoice_Type) {
	                        //////////////////////// ORG wise ////////////////////////////
	                        if (Invoice_Type == 3) {
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
										["location", "anyof", ExOrg]
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
	                                end: 1
	                            });
	                            log.debug("countlength", searchResultCount.length);
	                            //log.debug("count",searchResultCount);
	                            if (searchResultCount.length == 0) {
	                                var rec = record.create({
	                                    type: record.Type.SALES_ORDER,
	                                    isDynamic: true,
	                                    defaultValues: {
	                                        customform: 243,
	                                        entity: i_customer_id

	                                    }
	                                });
	                                rec.setValue({
	                                    fieldId: 'startdate',
	                                    value: StartDate
	                                });

	                                numberFormat = numberFormat +"-"+ numberThirdParam +"-"+ numberFourthParam +"-"+ numberSecondParam;
	                                rec.setValue({
	                                    fieldId: 'custbody_mhl_b2b_doc_number',
	                                    value: numberFormat
	                                });

	                                rec.setValue({
	                                    fieldId: 'tranid',
	                                    value: "SO-" + numberFormat
	                                }); 
									rec.setValue({
	                                    fieldId: 'transactionnumber',
	                                    value: "SO-" + numberFormat
	                                });
	                                rec.setValue({
	                                    fieldId: 'enddate',
	                                    value: EndDate
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
	                                    value: SBU
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
	                                log.debug("recordId", recordId);

	                                return recordId;

	                            } else {
	                                var recordId = searchResultCount[0].id;
	                                return recordId;
	                            }
	                        }

	                        ////////////////////// SBU wise ////////////////////////////
	                        if (Invoice_Type == 4) {
	                            numberFourthParam = SBU;
	                            var transactionSearchObj = search.create({
	                                type: "transaction",
	                                filters: [
										["status", "anyof", "SalesOrd:F"],
										"AND",
										["mainline", "is", "T"],
										"AND",
										["customer.internalid", "anyof", i_customer_id],
										"AND",
										["class", "is", SBU]

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
	                                end: 1
	                            });
	                            log.debug("SBU countlength", searchResultCount.length);
								
								//return false;
	                            //log.debug("count",searchResultCount);
	                            if (searchResultCount.length == 0) {
	                                var rec = record.create({
	                                    type: record.Type.SALES_ORDER,
	                                    isDynamic: true,
	                                    defaultValues: {
	                                        customform: 243,
	                                        entity: i_customer_id

	                                    }
	                                });

	                                numberFormat = numberFormat + numberThirdParam + numberFourthParam + numberSecondParam;
	                                rec.setValue({
	                                    fieldId: 'custbody_mhl_b2b_doc_number',
	                                    value: numberFormat
	                                });

	                                rec.setValue({
	                                    fieldId: 'tranid',
	                                    value: "SO-" + numberFormat
	                                });
									
									rec.setValue({
	                                    fieldId: 'transactionnumber',
	                                    value: "SO-" + numberFormat
	                                });
									
	                                rec.setValue({
	                                    fieldId: 'startdate',
	                                    value: StartDate
	                                });
	                                rec.setValue({
	                                    fieldId: 'enddate',
	                                    value: EndDate
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
	                                    value: SBU
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
	                                log.debug("recordId", recordId);
	                                return recordId;

	                            } else {
	                                var recordId = searchResultCount[0].id;
	                                return recordId;
	                            }
	                        }

	                        ////////////////////// Customer wise OR Hub Wise////////////////////////////
	                        if (Invoice_Type == 1 || Invoice_Type == 2 || Invoice_Type == 5) {
	                            numberFifthParam = Invoice_Type;
	                            var transactionSearchObj = search.create({
	                                type: "transaction",
	                                filters: [
										  ["customer.internalid", "anyof", i_customer_id],
										  "AND",
										  ["status", "anyof", "SalesOrd:F"],
										  "AND",
										  ["mainline", "is", "T"]

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
	                                end: 1
	                            });
	                            log.debug("countlength", searchResultCount.length);
	                            //log.debug("count",searchResultCount);
	                            if (searchResultCount.length == 0) {
	                                var rec = record.create({
	                                    type: record.Type.SALES_ORDER,
	                                    isDynamic: true,
	                                    defaultValues: {
	                                        customform: 243,
	                                        entity: i_customer_id

	                                    }
	                                });

	                                numberFormat = numberFormat + numberThirdParam + numberFourthParam + numberSecondParam;
	                                rec.setValue({
	                                    fieldId: 'custbody_mhl_b2b_doc_number',
	                                    value: numberFormat
	                                });

	                                rec.setValue({
	                                    fieldId: 'tranid',
	                                    value: "SO-" + numberFormat
	                                });
									
									rec.setValue({
	                                    fieldId: 'transactionnumber',
	                                    value: "SO-" + numberFormat
	                                });

	                                rec.setValue({
	                                    fieldId: 'startdate',
	                                    value: StartDate
	                                });
	                                rec.setValue({
	                                    fieldId: 'enddate',
	                                    value: EndDate
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
	                                    value: SBU
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
	                                log.debug("recordId", recordId);
	                                return recordId;
	                            } else {
	                                var recordId = searchResultCount[0].id;
	                                return recordId;
	                            }
	                        }
	                    } else {
	                        return "Please select invoice type on Customer - " + clientCode;
	                    }
	                }

	            }
	        }

	        function addDays(date, days) {
	            var result = new Date(date);
	            result.setDate(result.getDate() + days);
	            return result;
	        }

	        ///////////////////////////////Check Duplicate B2B VID //////////////////////////////////////
	        function checkBvid(vid) {
	            try {
	                var vidPresent = true;
	                var customrecord_b2b_vid_detailsSearchObj = search.create({
	                    type: "customrecord_b2b_vid_details",
	                    filters: [
						  ["name", "is", vid]
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
	                        })
					   ]
	                });
	                var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
	                //log.debug("customrecord_b2b_vid_detailsSearchObj result count",searchResultCount);
	                customrecord_b2b_vid_detailsSearchObj.run().each(function (result) {
	                    // .run().each has a limit of 4,000 results
	                    vidPresent = false;
	                    return true;
	                });

	                return vidPresent;
	            } catch (e) {
	                log.error("checkBvid | errror", e)
	            }
	        }

	        ///////////////////////////////Check Duplicate B2B VID //////////////////////////////////////

	        //////////////////////////////////////////////Update Internal Id //////////////////////////////////////////////////////////

	        function updateInternalId(testObject, a_item_line_data) {
	            ///////////////////// Item Search ////////////////////////////////////////////

	            ////log.debug({title:'Item ID',details:testObject.testCode });

	            var filterString = [];
	            var testArray = [];
	            var filterArray = [];
	           log.debug("1281 testObject",JSON.stringify(testObject))
	            for (var t in testObject.testCode) {
	                var temp = testObject.testCode[t];
	                //log.debug("temp",temp)
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

	            var itemSearch = search.create({
	                type: search.Type.ITEM,
	                columns: ['internalid', 'itemid'],
	                filters: filterString
	            });

	            ////log.debug({title:'itemSearch',details:itemSearch});

	            var itemSearchResult = itemSearch.run().getRange({
	                start: 0,
	                end: 100
	            });
	            //	log.debug({title:'itemSearchResult',details:itemSearchResult});

	            //if (itemSearchResult.length > 0) 
	            {
	                var tempArray = [];
	                for (var k in itemSearchResult) {
	                    tempArray.push(itemSearchResult[k].id);

	                    a_item_line_data[itemSearchResult[k].getValue({
	                        name: 'itemid'
	                    })] = itemSearchResult[k].id;
	                }
	                testObject.testInternalId = tempArray;
	            }

	            ///////////////////////////////// Processing Collection center search //////////////////////////////////////

	            if (testObject.processingCenter) {
	                for (var t in testObject.processingCenter) {
	                    // This code is added by Ganesh, to get dynamic location, org, sbu and unit from NetSuite master. : 25-08-2021
	                    var processingCenterCode = testObject.processingCenterCode[t];

	                    if (processingCenterCode) {
	                        var customrecord_cseg_mhl_locationsSearchObj = search.create({
	                            type: "customrecord_cseg_mhl_locations",
	                            filters: [
									["custrecord_mhl_loc_code", "is", processingCenterCode],
									'AND',
									["isinactive", "is", "F"]
								],
	                            columns: [
									search.createColumn({
	                                    name: "name",
	                                    sort: search.Sort.ASC,
	                                    label: "Name"
	                                }),
									search.createColumn({
	                                    name: "internalid",
	                                    label: "Internal ID"
	                                }),
									search.createColumn({
	                                    name: "custrecord_mhl_org_id",
	                                    label: "Org ID"
	                                }),
									search.createColumn({
	                                    name: "custrecord_mhl_location_id",
	                                    label: "Location ID"
	                                }),
									search.createColumn({
	                                    name: "custrecord_mhl_loc_code",
	                                    label: "Code"
	                                }),
									search.createColumn({
	                                    name: "custrecord_mhl_location_type",
	                                    label: "Location Type"
	                                }),
									search.createColumn({
	                                    name: "custrecord_mhl_loc_org",
	                                    label: "Org"
	                                }),
									search.createColumn({
	                                    name: "cseg_mhl_custseg_un",
	                                    join: "CUSTRECORD_MHL_LOC_ORG",
	                                    label: "Unit"
	                                }),
									search.createColumn({
	                                    name: "custrecord_mhl_ref_sbu",
	                                    join: "CUSTRECORD_MHL_LOC_ORG",
	                                    label: "SBU"
	                                })
								]
	                        });

	                        customrecord_cseg_mhl_locationsSearchObj.run().each(function (result) {
	                            // .run().each has a limit of 4,000 results
	                            //var locationOrgSearchDetails = result.getValue("")

	                            //log.debug("Org Location Search Details", JSON.stringify(result))
	                            var unit = result.getValue({
	                                name: "cseg_mhl_custseg_un",
	                                join: "CUSTRECORD_MHL_LOC_ORG"
	                            });

	                            var orgInternalId = result.getValue({
	                                name: "custrecord_mhl_loc_org"
	                            });

	                            var locationInternalId = result.getValue({
	                                name: "internalid"
	                            });
	                            /* var sbu = result.getValue({
	                            						name: "custrecord_mhl_ref_sbu",
	                            						join: "CUSTRECORD_MHL_LOC_ORG"
	                            					});  */

	                            testObject.processingCenterId.push(locationInternalId);
	                            testObject.processingCenterOrg.push(orgInternalId)
	                            return true;
	                        });
	                    }

	                    /* var locationObj = mhllib.findLocation(testObject.processingCenter[t]);
	                    if (locationObj.locationInternalId) {
	                    	testObject.processingCenterId.push(locationObj.locationInternalId);
	                    	testObject.processingCenterOrg.push(locationObj.orgInternalId);
	                    } */

	                }
	            }
	            //log.debug("testObject", JSON.stringify(testObject))
	            return testObject;
	        }

	        //////////////////////////////////Search Collection Center //////////////////////////////////////////////////

	        function searchLocationCenter(locationCenterId) {

	            locationCenterId = locationCenterId.toString();
	            /*var valArray=[];
	            valArray.push(locationCenterId);*/
	            ////log.debug({title:'Location Center Id',details:locationCenterId});

	            var internalIdSearch = search.create({
	                type: 'customrecord_cseg_mhl_locations',
	                columns: ['internalid', 'custrecord_mhl_loc_org', 'custrecord_mhl_location_id'],
	                filters: [
						['custrecord_mhl_location_id', 'is', locationCenterId]
					]
	            });

	            var searchResult = internalIdSearch.run().getRange({
	                start: 0,
	                end: 1
	            });

	            if (searchResult.length > 0) {
	                ////log.debug({title:'Org Search',details:JSON.stringify(searchResult[0].getValue({name:'custrecord_mhl_loc_org'}))});
	                ////log.debug({title:'Location Center Id',details:JSON.stringify(searchResult[0].getValue({name:'internalid'}))});

	                return searchResult;
	            }
	            return '';

	        }

	        function searchItem(segmentName) {
	            segmentName = segmentName.toString();
	            var internalIdSearch = search.create({
	                type: search.Type.SERVICE_ITEM,
	                columns: ['internalid'],
	                filters: [
						['itemid', 'is', segmentName]
					]
	            });

	            var searchResult = internalIdSearch.run().getRange({
	                start: 0,
	                end: 1
	            });

	            if (searchResult.length > 0) {
	                return searchResult[0].getValue({
	                    name: 'internalid'
	                });
	            }
	            return '';
	        }

	        //////////////////////////////////////////////////////Location Search //////////////////////////////////////////////////////////

	        function searchByExternalIdLoc(externalId) {
	            externalId = externalId.toString();
	            ////log.debug({title:'Location External Id',details:externalId});

	            var internalIdSearch = search.create({
	                type: search.Type.LOCATION,
	                columns: ['internalid'],
	                filters: [
						['custrecord_mhl_mds_lims_org_id', 'is', externalId]
					]
	            });

	            var searchResult = internalIdSearch.run().getRange({
	                start: 0,
	                end: 1
	            });
	            ////log.debug({title:'searchResult 101',details:searchResult});

	            if (searchResult.length > 0) {
	                return searchResult[0].id;
	            }
	            return 0;
	        }

	        /////////////////////////////////////////////////////////// Customer Search /////////////////////////////////////////////////////////

	        function searchCustomer(clientCode, org, custSubsidiary, limsOrgId) {
	            clientCode = clientCode.toString();

	            if (clientCode == 'GENERAL') {
	                clientCode = clientCode + limsOrgId;
	            }

	            if (clientCode == 'asdfasd') {
	                clientCode = 'CUS00473';
	            }

	            if (clientCode == 'RJ00RJ0001') {
	                clientCode = 'RJ0001';
	            }

	            ////log.debug({title:'Client ID',details:clientCode});

	            var internalIdSearch = search.create({
	                type: search.Type.CUSTOMER,
	                columns: ['internalid', 'custentity_mhl_cus_revenue_segment', 'custentity_mhl_customer_payment_mode',
						'subsidiary', 'custentity_mhl_extended_to_org', 'custentity_mhl_cus_invoicing_cycle', 'custentitycusrecord_invoicetype', 'custentity_mhl_cus_org',
						search.createColumn({
	                        name: "custrecord_mhl_timezone_gmt",
	                        join: "mseSubsidiary"
	                    }), 'custentity_mhl_cust_client_type'
					],
	                filters: [
						['entityid', 'is', clientCode], 'AND', ['custentity_mhl_extended_to_org', 'is', org]
					]

	                //filters: [['custentity_mhl_cust_code_old', 'is', clientCode],'AND',['msesubsidiary.name','contains',custSubsidiary]]
	            });

	            var searchResult = internalIdSearch.run().getRange({
	                start: 0,
	                end: 1
	            });
	            ////log.debug({title:'searchResult 124',details:searchResult});

	            if (searchResult.length > 0) {
	                return searchResult;
	            } else {
	                ////// Find Customer with OLD code
	                ////log.debug({title:'Finding Customer with Old Code'});
	                var internalIdSearch = search.create({
	                    type: search.Type.CUSTOMER,
	                    columns: ['internalid', 'custentity_mhl_cus_revenue_segment', 'custentity_mhl_customer_payment_mode',
							'subsidiary',
							search.createColumn({
	                            name: "custrecord_mhl_timezone_gmt",
	                            join: "mseSubsidiary"
	                        })
						],
	                    filters: [
							['custentity_mhl_old_code_ref_migration', 'is', clientCode], 'AND', ['custentity_mhl_extended_to_org', 'is', org]
						]

	                    //filters: [['custentity_mhl_cust_code_old', 'is', clientCode],'AND',['msesubsidiary.name','contains',custSubsidiary]]
	                });

	                var searchResult = internalIdSearch.run().getRange({
	                    start: 0,
	                    end: 1
	                });
	                ////log.debug({title:'searchResult 124',details:searchResult});

	                if (searchResult.length > 0) {
	                    return searchResult;
	                }

	            }
	            return null;
	        }

	        ///////////////////////////////////////////////////////// Search Item ///////////////////////////////////////////////////////////////

	        function getCompanyCurrentDateTime(number) {

	            var currentDateTime = new Date(number);
	            //var companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
	            var companyTimeZone = '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi';
	            var timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
	            var UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
	            var companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);

	            return new Date(companyDateTime);
	        }

	        function searchByItemId(itemId) {
	            itemId = itemId.toString();
	            ////log.debug({title:'Item ID',details:itemId});

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
	            ////log.debug({title:'searchResult 147',details:searchResult});

	            if (searchResult.length > 0) {
	                return searchResult[0].id;
	            }
	            return null;
	        }

	        /////////////////////////////////////////////// Create Error Record ////////////////////////////////////////////////////////
	        function createRnIRecord(e, fileName, fileId, invoiceId) {
	            var rnIRec = record.create({
	                type: 'customrecord_rni_integration_status'
	            });

	            rnIRec.setValue({
	                fieldId: 'custrecord_json_type',
	                value: '15'
	            }); 
				rnIRec.setValue({
	                fieldId: 'custrecord_attune_vid_record',
	                value: true
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
	                fieldId: 'custrecord_mhl_rni_file_id',
	                value: fileId
	            });
	            if (invoiceId) {
	                rnIRec.setValue({
	                    fieldId: 'custrecord_mhl_rni_tran_id',
	                    value: invoiceId
	                });
	            }

	            rnIRec.setValue({
	                fieldId: 'custrecord_processed',
	                value: '2'
	            });
	            rnIRec.save();
	        }

	        function search_custmer_Rate_Card(customerInternalId, registeredOrg) {

	            var rateSearch = search.create({
	                type: 'customrecord_mhl_rc_mapped_customers',
	                columns: ['custrecord_mhl_cust_rate_card'],
	                filters: [
						['custrecord_mhl_rcc_base_rate', 'is', 'T'], 'AND', ['isinactive', 'is', 'F'], 'AND', ['custrecord_mhl_rate_card_cust_applied', 'is', customerInternalId], 'AND', ['custrecord_mhl_rcc_org_name', 'is', registeredOrg]
					]
	            });

	            var searchResult = rateSearch.run().getRange({
	                start: 0,
	                end: 1
	            });
	            var i_rate_card_search = '';
	            if (searchResult.length > 0) {
	                ////log.debug({title:'Customer rate card mapping',details:searchResult[0].getValue({name:'custrecord_mhl_rm_net_rate'})});
	                i_rate_card_search = searchResult[0].getValue({
	                    name: 'custrecord_mhl_cust_rate_card'
	                });
	            }

	            return i_rate_card_search;
	        }

	        function search_rate_card_details(i_rate_card, i_item_internal_id) {
	            var rateCard_Amt = {
	                f_gross_Amt: ''
	            };
	            try {

	                var rateSearch = search.create({
	                    type: 'customrecord_mhl_rate_card_test_details',
	                    columns: ['custrecord_mhl_rc_net_rate'],
	                    filters: [
							['custrecord_mhl_rc_rate_card_ref', 'anyOf', i_rate_card], 'AND', ['custrecord_mhl_rc_test_code', 'anyOf', i_item_internal_id]
						]
	                });

	                var searchResult = rateSearch.run().getRange({
	                    start: 0,
	                    end: 1
	                });

	                if (searchResult.length > 0) {
	                    ////log.debug({title:'Net Rate',details:searchResult[0].getValue({name:'custrecord_mhl_rm_net_rate'})});
	                    rateCard_Amt.f_gross_Amt = searchResult[0].getValue({
	                        name: 'custrecord_mhl_rc_net_rate'
	                    });
	                    return rateCard_Amt
	                }

	            } catch (e) {
	                //log.debug({title:'search_rate_card_details',details:e});
	            }
	            return rateCard_Amt;
	        }
	        ///////////////////////////// Rate Master for Co-pay ///////////////////////////////////////////////////////////////////////////////////

	        function searchItemRate(customerId, item, processingLoc) {
	            var coPayAmt = {
	                clientAmt: '',
	                patientAmt: '',
	                customerCurrency: '',
	                netRateInCurrecny: '',
	            };
	            try {
	                ////log.debug({title:'customerId',details:customerId});
	                ////log.debug({title:'item',details:item});
	                ////log.debug({title:'processingLoc',details:processingLoc});

	                var rateSearch = search.create({
	                    type: 'customrecord_mhl_rate_master',
	                    columns: ['custrecord_mhl_rm_net_rate', 'custrecord_mhl_rm_cppatientamt', 'custrecord_mhl_rm_cpclientamt', 'custrecord_mhl_net_rate_customer_currenc', 'custrecord_mhl_customer_currency_name'],
	                    filters: [
							['custrecord_mhl_rm_test_code', 'is', item], 'AND', ['custrecord_mhl_rm_customer', 'is', customerId], 'AND', ['custrecord_mhl_rm_org_name', 'is', processingLoc]
						]
	                });

	                var searchResult = rateSearch.run().getRange({
	                    start: 0,
	                    end: 1
	                });

	                if (searchResult.length > 0) {
	                    ////log.debug({title:'Net Rate',details:searchResult[0].getValue({name:'custrecord_mhl_rm_net_rate'})});
	                    coPayAmt.clientAmt = searchResult[0].getValue({
	                        name: 'custrecord_mhl_rm_cpclientamt'
	                    });
	                    coPayAmt.patientAmt = searchResult[0].getValue({
	                        name: 'custrecord_mhl_rm_cppatientamt'
	                    });
	                    coPayAmt.customerCurrency = searchResult[0].getValue({
	                        name: 'custrecord_mhl_customer_currency_name'
	                    });
	                    coPayAmt.netRateInCurrecny = searchResult[0].getValue({
	                        name: 'custrecord_mhl_net_rate_customer_currenc'
	                    });

	                    return coPayAmt
	                }

	            } catch (e) {
	                //log.debug({title:'error in price search',details:e});
	            }
	            return coPayAmt;
	        }

	        Date.prototype.addHours = function (h) {

	            this.setHours(this.getHours() + h);

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

	            try {
	                var mapKeysProcessed = 0;
	                summary.mapSummary.keys.iterator().each(function (key, executionCount, completionState) {

	                    if (completionState === 'COMPLETE') {
	                        mapKeysProcessed++;
	                    }

	                    return true;

	                });
	                log.debug({
	                    title: 'Map key statistics',
	                    details: 'Total number of map keys processed successfully: ' + mapKeysProcessed
	                });
	            } catch (e) {
	                log.error({
	                    title: 'Error Occured in Summary function',
	                    details: e
	                });
	            }

	        }

	        ///////////////////////////////////////////////////////////

	        function paymentRecordFunction(trans_date, subsidiary, recId, customerId, amountReceived, vidDate, tranRefNo, paymentMode, vidNumber, orgVal, departmentVal, classmentVal, unitVal) {
	            try {

	                var creditControlAcc = '4530';

	                //log.debug('amountReceived',amountReceived);

	                var customerType = search.lookupFields({
	                    type: search.Type.CUSTOMER,
	                    id: customerId,
	                    columns: ['custentity_mhl_customer_payment_mode', 'custentity_current_deposit']
	                });
	                ////log.debug('customerType',customerType);

	                if ((customerType.custentity_mhl_customer_payment_mode[0].text == 'Cash' || customerType.custentity_mhl_customer_payment_mode[0].text == 'Co-payment') && amountReceived > 0 && tranRefNo) {

	                    var paymentRecord = record.transform({
	                        fromType: record.Type.INVOICE,
	                        fromId: recId,
	                        toType: record.Type.CUSTOMER_PAYMENT,
	                        isDynamic: false,
	                    });

	                    var location = orgVal;

	                    var account = '';
	                    if (paymentMode) {
	                        var accountSearch = search.create({
	                            type: 'customrecord_payment_account_mapping',
	                            columns: ['custrecord_payment_account'],
	                            filters: [
									['custrecord_payment_subsidiary', 'is', subsidiary], 'AND', ['custrecord_payment_org', 'is', location], 'AND', ["custrecord_map_paymentmode", "is", paymentMode], 'AND', ["isinactive", "is", "F"]
								]
	                        });
	                    } else {
	                        var accountSearch = search.create({
	                            type: 'customrecord_payment_account_mapping',
	                            columns: ['custrecord_payment_account'],
	                            filters: [
									['custrecord_payment_subsidiary', 'is', subsidiary], 'AND', ['custrecord_payment_org', 'is', location], 'AND', ["isinactive", "is", "F"]
								]
	                        });
	                    }

	                    var searchResult = accountSearch.run().getRange({
	                        start: 0,
	                        end: 100
	                    });
	                    log.debug("seanrch ", JSON.stringify(searchResult));
	                    if (searchResult) {
	                        if (searchResult.length > 0) {
	                            account = searchResult[0].getValue({
	                                name: 'custrecord_payment_account'
	                            });
	                        }

	                    }

	                    paymentRecord.setValue({
	                        fieldId: 'custbody_mhl_invoice_vid_number',
	                        value: vidNumber
	                    });

	                    paymentRecord.setValue({
	                        fieldId: 'location',
	                        value: orgVal
	                    });
	                    paymentRecord.setValue({
	                        fieldId: 'department',
	                        value: departmentVal
	                    });
	                    paymentRecord.setValue({
	                        fieldId: 'class',
	                        value: classmentVal
	                    });
	                    paymentRecord.setValue({
	                        fieldId: 'cseg_mhl_custseg_un',
	                        value: unitVal
	                    });

	                    if (trans_date) {
	                        paymentRecord.setValue({
	                            fieldId: 'trandate',
	                            value: format.parse({
	                                value: trans_date,
	                                type: format.Type.DATE
	                            })
	                        });
	                    }

	                    if (account) {
	                        paymentRecord.setValue({
	                            fieldId: 'undepfunds',
	                            value: 'F'
	                        });
	                        paymentRecord.setValue({
	                            fieldId: 'account',
	                            value: account
	                        });
	                        paymentRecord.setValue({
	                            fieldId: 'ccapproved',
	                            value: true
	                        });

	                    }

	                    if (paymentMode == '3') // Card payment
	                    {

	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 2
	                        });

	                        paymentRecord.setValue({
	                            fieldId: 'account',
	                            value: account
	                        });
	                        paymentRecord.setValue({
	                            fieldId: 'memo',
	                            value: tranRefNo.transactionId
	                        });

	                    }

	                    if (paymentMode == '2') // Cheque
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 3
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }

	                    }

	                    if (paymentMode == '13' || paymentMode == '32' || paymentMode == '34') // NEFT/RTGS
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 7
	                        });
	                        paymentRecord.setValue({
	                            fieldId: 'memo',
	                            value: tranRefNo.transactionId
	                        });
	                    }

	                    if (paymentMode == '12') // M swipe
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 9
	                        });
	                        paymentRecord.setValue({
	                            fieldId: 'memo',
	                            value: tranRefNo.transactionId
	                        });
	                    }
	                    if (paymentMode == '10') // Coupne
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 10
	                        });
	                        paymentRecord.setValue({
	                            fieldId: 'memo',
	                            value: tranRefNo.transactionId
	                        });
	                    }

	                    if (paymentMode == '4') // DD
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 12
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }

	                    }

	                    if (paymentMode == '5') // UPI
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 13
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }

	                    }

	                    if (paymentMode == '6') // CNP
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 14
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }

	                    }

	                    if (paymentMode == '7') // wallet
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 15
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }

	                    }

	                    if (paymentMode == '8') // Amex
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 16
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }
	                    }

	                    if (paymentMode == '9') // DINERS
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 17
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }
	                    }

	                    if (paymentMode == '11') // Credit Note
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 18
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }
	                    }

	                    if (paymentMode == '28') // Credit Note
	                    {
	                        paymentRecord.setValue({
	                            fieldId: 'paymentmethod',
	                            value: 19
	                        });
	                        if (tranRefNo.ChequeorCardNumber) {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.ChequeorCardNumber
	                            });

	                        } else {
	                            paymentRecord.setValue({
	                                fieldId: 'memo',
	                                value: tranRefNo.transactionId
	                            });

	                        }
	                    }

	                    var paymentLineCnt = paymentRecord.getLineCount({
	                        sublistId: 'apply'
	                    });
	                    for (var t = 0; t < paymentLineCnt; t++) {
	                        var applyedInv = paymentRecord.getSublistValue({
	                            sublistId: 'apply',
	                            fieldId: 'apply',
	                            line: t
	                        });
	                        if (applyedInv) {
	                            paymentRecord.setSublistValue({
	                                sublistId: 'apply',
	                                fieldId: 'amount',
	                                line: t,
	                                value: Number(amountReceived)
	                            });
	                        }
	                    }
	                    var paymentId = paymentRecord.save();
	                    log.audit('payment id new', paymentId);
	                    return "payment_created"
	                } else {
	                    return "customer's payment mode is " + customerType.custentity_mhl_customer_payment_mode[0].text + " and amount is " + amountReceived;
	                }
	            } catch (e) {
	                log.error('Error Details in payment', e);
	                return e.message;
	            }
	        }

	        //////////////////////////////////////////////////////////
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

	        return {
	            getInputData: getInputData,
	            map: map,
	            summarize: summarize
	        };

	    });