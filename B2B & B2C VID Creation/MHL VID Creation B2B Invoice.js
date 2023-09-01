	/**
	 * Script Name: MHL VID Creation B2B Invoice - RnI.js
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 */
	 /*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL B2B VID Creation | R&I
 * File Name: MHL VID Creation B2B Invoice.js
 * Created On:
 * Modified On: 13/12/2022
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: Create VID B2B Invoice 
 *********************************************************** */

	 
	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib'],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function(file, format, record, search, runtime, mhllib, datellib) {

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
	                    id: 'customsearch_mhl_b2b_vid_custable'
	                });

	            } catch (e) {
	                createRnIRecord(e, 'search Issue');
	                log.debug({
	                    title: 'Error Occured while collecting JSON for VID',
	                    details: e
	                });
	            }
	        }

	        function map(context) {
	            try {

	                //log.debug("context",JSON.stringify(context.value.transaction))
	                var data = JSON.parse(context.value); //read the data
	                log.debug("context data", JSON.stringify(data.transaction))
	                ////log.debug('data',data);
	                var fileInternalId = data.id;
	                var jsonFile = file.load({
	                    id: fileInternalId
	                });
	                var content = jsonFile.getContents();
	                content = content.replace('Ã¯Â»Â¿', '');
	                content = JSON.parse(content);
	                log.debug('Start', '-------------------------------------');
	                log.debug('fileInternalId', fileInternalId);

	                var invId = createVIDForJson(content, jsonFile.name, fileInternalId);
	                log.audit('Invoice Created ', invId + " File Id " + fileInternalId);

	                log.debug('End', '-------------------------------------');

	                if (invId == '-566112') {
	                    jsonFile.folder = '566112';
	                    jsonFile.save();
	                } else if (invId == '-5544') {
	                    jsonFile.folder = '3735';
	                    jsonFile.save();
	                } else if (invId == '-337799') {
	                    jsonFile.folder = '337799';
	                    jsonFile.save();
	                } else if (invId > 0) {
	                    jsonFile.folder = '566118';
	                    jsonFile.save();
	                } else {
	                    jsonFile.folder = '707';
	                    jsonFile.save();
	                }

	                
	            } catch (ex) {
	                log.error({
	                    title: 'map: error in creating records',
	                    details: ex
	                });
	                createRnIRecord(ex, jsonFile.name);
	                jsonFile.folder = '707';
	                jsonFile.save();
	            }
	        }

	        /////////////////////////////////////////////////////// Create Invoice /////////////////////////////////////////////////////////////

	        function createVIDForJson(JSONfromRnI, fileName, fileId) {
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

	                var visitNumberToBeFound = JSONfromRnI.VisitInfo.VisitNumber;
	                var visitDate = JSONfromRnI.VisitInfo.visitDate;
	                if (visitDate) {

	                    var f_dupVID = checkBvid(visitNumberToBeFound)

	                    //Added line of if(visitNumberToBeFound) as CMS External ID filter operator issue 
	                    var invoiceRecId;

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
	                            customrecord_cseg_mhl_locationsSearchObj.run().each(function(result) {
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
									
									var billing_started = parseInt(customerDetails[0].getValue({
	                                    name: "custentity_mhl_billing_started"
	                                }));
	                                log.debug("billing_started", billing_started)

	                                ////log.debug('Client Internal Id',customerInternalId);
	                                ////log.debug('Client Segment',customerSegment);

	                                if (customerPaymentType != 1) {
	                                    log.debug("Welcome ", "B2B Invoiceing")

	                                    var num = '';
	                                    if (customer_invoicing_cycleText) {
	                                        var num = customer_invoicing_cycleText.match(/\d+/g);
	                                        var days_num = num[0];
	                                        log.debug("days_num", days_num);

	                                        var letr = customer_invoicing_cycleText.match(/[a-zA-Z]+/g);
	                                        var months = letr[0]
	                                        log.debug("months", months);
	                                    } else {
	                                        log.error('Customer Master Error', 'Please select BILLING CYCLE DAYS in  ' + JSONfromRnI.VisitInfo.ClientCode)
	                                        createRnIRecord('Please select Billing Cycle Days in  ' + JSONfromRnI.VisitInfo.ClientCode, fileName, fileId, '', "Client Billing cycle is not select");
	                                        return '';
	                                    }

	                                    var visitDate = JSONfromRnI.VisitInfo.visitDate;
	                                    var trans_date = datellib.findDateRnI(visitDate, null, subsidiaryTimezone_gmt);
	                                    /* 	trans_date=format.parse({
                                                    value: trans_date,
                                                    type: format.Type.DATE
                                                }) */

	                                    var ConvertedDt = new Date(trans_date);
	                                    //var ConvertedDt = convert_date(d_date);

	                                    log.debug("ConvertedDt", ConvertedDt)
	                                    var day = ConvertedDt.getDate();
	                                    //log.debug("day",day);
	                                    var month = ConvertedDt.getMonth() + 1;
	                                    //log.debug("month",month);
	                                    var year = ConvertedDt.getFullYear();
										var firstDate = new Date(year, month - 1, 1);
	                                    var lastDate = new Date(year, month, 0);

	                                    if (billing_started != 1 && billing_started) {
											
											//Logic Will change here
											log.debug("In Else")
											 var firstDate = new Date(year, month - 1, billing_started);
											if (Billing_Cycle == '1 Month' && day < billing_started) {
												var StartDate = new Date(year, month - 2, billing_started);
												//log.debug("StartDate",StartDate);
												var EndDate = new Date(year, month - 1, (billing_started - 1));
												//log.debug("EndDate",EndDate);

											}
											else if (Billing_Cycle == '1 Month' && day >= billing_started) {
												var StartDate = new Date(year, month - 1, billing_started);
												//log.debug("StartDate",StartDate);
												var EndDate = new Date(year, month , (billing_started - 1));
												//log.debug("EndDate",EndDate);

											}
											
											var f1_endDateObj = addDays(firstDate, (15 * 1));
											var f1_end = new Date(f1_endDateObj);
											var f1_endDate = f1_end.getDate();
											log.debug("f1_endDate",f1_endDate)
									
											//////////////////////////////////15 Days Billing Cycle/////////////////////////		
											if (Billing_Cycle == '15 Days' && f1_endDate >= day && day <= billing_started) {
												var StartDate = new Date(year, month - 1, billing_started);
												var EndDate = addDays(firstDate, (15 * 1));
												//log.debug("422 EndDate",EndDate);

											}
											else if (Billing_Cycle == '15 Days' && day > billing_started) {
												var StartDate = addDays(firstDate, (15 * 1));
												var EndDate = new Date(year, month, (billing_started - 1));
												//log.debug("In else EndDate",EndDate);
											}
											else if (Billing_Cycle == '15 Days')
											{
												var firstDate = new Date(year, month - 1, f1_endDate);
												var StartDate = new Date(year, month - 1 , f1_endDate);
												var EndDate = addDays(firstDate, (15 * 1));
											}

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
											
											
											
											
											/* log.debug("billing_started_0",billing_started_0)
											log.debug("f1_endDate_started_0",f1_endDate_started_0+" < "+day +" < "+  f1_endDate_started_7)
											log.debug("f1_endDate_started_7",f1_endDate_started_7+" < "+day +" < "+  f1_endDate_started_14)
											log.debug("f1_endDate_started_14",f1_endDate_started_14+" < "+day +" < "+  f1_endDate_started_21) */
											
											
											if( Billing_Cycle == '7 Days' &&  ( f1_endDate_started_0 < day && day < 31 ))
											{
												
												var StartDate = new Date(year, month - 1, billing_started);
												var EndDate = addDays(firstDate, (7 * 1));
											}
											
											if( Billing_Cycle == '7 Days' &&  ( f1_endDate_started_7 < day && day < f1_endDate_started_14))
											{
												
												var StartDate = addDays(firstDate, (f1_endDate_started_7));												
												var EndDate = addDays(firstDate, (f1_endDate_started_14));
											}
											
											if( Billing_Cycle == '7 Days' &&  ( f1_endDate_started_14 < day && day < f1_endDate_started_21))
											{
											
												var StartDate = addDays(firstDate, (f1_endDate_started_14));												
												var EndDate = addDays(firstDate, (f1_endDate_started_21));
											}
											
											if( Billing_Cycle == '7 Days' &&  ( f1_endDate_started_21 < day && day < f1_endDate_started_0))
											{
												
												var StartDate = addDays(firstDate, (f1_endDate_started_21));												
												var EndDate = addDays(firstDate, (f1_endDate_started_0));
											}
											
											//////////////////////////////////7 Days Billing Cycle/////////////////////////	
											
											
											
										} else {
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
											
										}

	                                    // Search the sales order against the Customer

	                                    log.debug("customerInternalId", customerInternalId)
	                                    log.debug("Billing_Cycle", Billing_Cycle)
	                                    log.debug("registeredOrg", registeredOrg)
	                                    log.debug("vidSbu", vidSbu)
	                                    log.debug("Invoice_Type", Invoice_Type)
	                                    log.debug("Reve_seg", Reve_seg)
	                                    log.debug("EndDate", EndDate)
	                                    log.debug("StartDate", StartDate)

	                                    var createVID = false;

	                                    var todayDate = new Date();
	                                    var o_vidObj = record.create({
	                                        type: 'customrecord_b2b_vid_details',
	                                        isDynamic: true

	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_mhl_pdv_vid_num',
	                                        value: JSONfromRnI.VisitInfo.VisitNumber
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_mhl_b2b_vid_type',
	                                        value: 1
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_vid_date',
	                                        value: format.parse({
	                                            value: trans_date,
	                                            type: format.Type.DATE
	                                        })
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'externalid',
	                                        value: "vid_" + JSONfromRnI.VisitInfo.VisitNumber
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_b2b_vid_json_file',
	                                        value: fileId
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_clientcode',
	                                        value: JSONfromRnI.VisitInfo.ClientCode
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_patientname',
	                                        value: JSONfromRnI.Name
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_clientname',
	                                        value: customerInternalId
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_patientnumber',
	                                        value: JSONfromRnI.PatientNumber
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_vidno',
	                                        value: visitNumberToBeFound
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'name',
	                                        value: visitNumberToBeFound
	                                    });

	                                    /* o_vidObj.setValue({
	                                    	fieldId: 'customform',
	                                    	value: 148
	                                    }); */

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_patient_mobile_number',
	                                        value: JSONfromRnI.Mobile
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_mhl_vid_sbu',
	                                        value: vidSbu
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_mhl_vid_org',
	                                        value: registeredOrg
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_mhl_blii_start_date',
	                                        value: StartDate
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_mhl_bill_end_date',
	                                        value: EndDate
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_patient_sex',
	                                        value: JSONfromRnI.Sex
	                                    });
	                                    //var d_dob = new Date(JSONfromRnI.DOB);
	                                    /* o_vidObj.setValue({
	                                    	fieldId: 'custrecord_patient_dob',
	                                    	value: d_dob
	                                    }); */

	                                    o_vidObj.setValue({
	                                        fieldId: '	custrecord_patient_age',
	                                        value: JSONfromRnI.Age
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_patient_email_id',
	                                        value: JSONfromRnI.Email
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_patientid',
	                                        value: JSONfromRnI.VisitInfo.RefHospitalID
	                                    });

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecordcustrecord_copayclientamount',
	                                        value: JSONfromRnI.Billinfo.CopayClientAmount
	                                    });

	                                    if (JSONfromRnI.VisitInfo.PhlebotomistName) {
	                                        o_vidObj.setValue({
	                                            fieldId: 'custrecord_physcian_name',
	                                            value: JSONfromRnI.VisitInfo.PhlebotomistName
	                                        });
	                                    }

	                                    var a_item_line_data = []
	                                    var a_testCode_rate = [];

	                                    var totalAmount = 0;
	                                    var OrderInfoLength = JSONfromRnI.OrderInfo;
	                                    log.debug("OrderInfoLength", OrderInfoLength.length);

	                                    var testArray = [];

	                                    if (OrderInfoLength.length > 0) {
	                                        if (JSONfromRnI.OrderInfo) {

	                                            createVID = true;
	                                            var i_orderInfo = JSONfromRnI.OrderInfo;

	                                            log.debug("i_orderInfo 0", i_orderInfo[1])
	                                            for (var o in i_orderInfo) {

	                                                log.debug("i_orderInfo[o].TestCode", i_orderInfo[o].TestCode)
	                                                o_vidObj.selectNewLine({
	                                                    sublistId: 'recmachcustrecord_reference_b2b'
	                                                });
	                                                /* o_vidObj.setCurrentSublistText({
	                                                    sublistId: 'recmachcustrecord_reference_b2b',
	                                                    fieldId: 'custrecord_test_code',
	                                                    text: i_orderInfo[o].TestCode
	                                                }); */
													o_vidObj.setCurrentSublistText({
	                                                    sublistId: 'recmachcustrecord_reference_b2b',
	                                                    fieldId: 'custrecord_test_code_json',
	                                                    text: i_orderInfo[o].TestCode
	                                                });
													
	                                                o_vidObj.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_reference_b2b',
	                                                    fieldId: 'custrecord_testname',
	                                                    value: i_orderInfo[o].TestName
	                                                });
													
										log.debug("Before IF i_orderInfo[o].NSNetAmount", i_orderInfo[o].NSNetAmount)
													if(i_orderInfo[o].NSNetAmount || i_orderInfo[o].NSNetAmount==0){
														o_vidObj.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_reference_b2b',
	                                                    fieldId: 'custrecord_netamount',
	                                                    value: i_orderInfo[o].NSNetAmount
	                                                });
													log.debug("i_orderInfo[o].NSNetAmount", i_orderInfo[o].NSNetAmount)
	                                                totalAmount = parseFloat(totalAmount) + parseFloat(i_orderInfo[o].NSNetAmount);
													}
													else{
	                                                o_vidObj.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_reference_b2b',
	                                                    fieldId: 'custrecord_netamount',
	                                                    value: i_orderInfo[o].Amount
	                                                });
													log.debug("i_orderInfo[o].Amount",i_orderInfo[o].Amount)
	                                                totalAmount = parseFloat(totalAmount) + parseFloat(i_orderInfo[o].Amount);
													}

	                                                o_vidObj.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_reference_b2b',
	                                                    fieldId: 'custrecord_grossamount',
	                                                    value: i_orderInfo[o].MRP
	                                                });

	                                                o_vidObj.commitLine({
	                                                    sublistId: 'recmachcustrecord_reference_b2b'
	                                                });
	                                            }

	                                        }
	                                    }

	                                   
	                                    var testGBIArray = [];
	                                    if (Array.isArray(JSONfromRnI.GeneralBillingInfo)) {
	                                        testGBIArray = JSONfromRnI.GeneralBillingInfo;
	                                    } else {
	                                        testGBIArray.push(JSONfromRnI.GeneralBillingInfo);
	                                    }

	                                    var testNewGBIArray = {
	                                        testCode: [],
	                                        testName: [],
	                                        testInternalId: [],
	                                        testNetAmt: [],
	                                        testGross: []
	                                    };

	                                    var gbiLength = JSONfromRnI.GeneralBillingInfo;
	                                    log.debug("gbiLength", gbiLength.length)
	                                    if (gbiLength.length > 0) {
	                                        createVID = true;
	                                        if (JSONfromRnI.GeneralBillingInfo) {
	                                            var i_GeneralBillingInfo = JSONfromRnI.GeneralBillingInfo;
	                                            for (var o in i_GeneralBillingInfo) {
													
								
	                                                if ((i_GeneralBillingInfo[o].Code != '' || i_GeneralBillingInfo[o].Code != 0) && i_GeneralBillingInfo[o].ItemName != '' && i_GeneralBillingInfo[o].Amount != 0) {
													if (i_GeneralBillingInfo[o].Code != '' && i_GeneralBillingInfo[o].Code != 0) {
	                                                    log.debug("GBI")
	                                                    o_vidObj.selectNewLine({
	                                                        sublistId: 'recmachcustrecord_reference_b2b'
	                                                    });
	                                                    o_vidObj.setCurrentSublistText({
	                                                        sublistId: 'recmachcustrecord_reference_b2b',
	                                                        fieldId: 'custrecord_test_code_json',
	                                                        text: i_GeneralBillingInfo[o].Code
	                                                    });
	                                                    o_vidObj.setCurrentSublistValue({
	                                                        sublistId: 'recmachcustrecord_reference_b2b',
	                                                        fieldId: 'custrecord_testname',
	                                                        value: i_GeneralBillingInfo[o].ItemName
	                                                    });

	                                                    o_vidObj.setCurrentSublistValue({
	                                                        sublistId: 'recmachcustrecord_reference_b2b',
	                                                        fieldId: 'custrecord_netamount',
	                                                        value: i_GeneralBillingInfo[o].Amount
	                                                    });
	                                                    totalAmount = parseFloat(totalAmount) + parseFloat(i_GeneralBillingInfo[o].Amount);

	                                                    o_vidObj.setCurrentSublistValue({
	                                                        sublistId: 'recmachcustrecord_reference_b2b',
	                                                        fieldId: 'custrecord_grossamount',
	                                                        value: i_GeneralBillingInfo[o].Amount
	                                                    });

	                                                    o_vidObj.commitLine({
	                                                        sublistId: 'recmachcustrecord_reference_b2b'
	                                                    });
	                                                }
													else {
													createRnIRecord('Could not creates the VID  | ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId, '', " GBI Test Codes not found in JSON ");
													log.error("Failed", 'Could Not create VID record as no test codes founds in JSON ' + JSONfromRnI.VisitInfo.VisitNumber)
													return '';
													}
												}
	                                            }
	                                        }
	                                    }

	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_b2b_vid_amount',
	                                        value: totalAmount
	                                    });

	                                    var amountReceived = JSONfromRnI.Billinfo.AmountReceived;

	                                    log.debug("amountReceived", amountReceived)
	                                    o_vidObj.setValue({
	                                        fieldId: 'custrecord_amountreceived',
	                                        value: amountReceived
	                                    });

	                                    if (createVID) {
	                                        var o_patientId = o_vidObj.save({
	                                            enableSourcing: true,
	                                            ignoreMandatoryFields: true
	                                        });

	                                        log.debug('o_patientId Created', o_patientId);
	                                        //log.debug('i_soId Created', i_soId);
	                                        return o_patientId;
	                                    } else {
	                                        createRnIRecord('Could not creates the VID as no test codes founds in JSON ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId, '', "Test Codes not found in JSON ");
	                                        log.error("Failed", 'Could Not create VID record ')
	                                        return '';
	                                    }
	                                } else {
	                                    log.debug("Welcome ", "B2C Invoiceing")
	                                    return "-566112"
	                                }

	                            } else {
	                                log.error('Can Not Create VID', 'Customer Not Found');
	                                createRnIRecord('Client code Not Found | ' + JSONfromRnI.VisitInfo.ClientCode + ' For Registered ORG Internal ID | ' + registeredOrg + ' & For VID | ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId, '', "Client code Not Found");
	                                return '';

	                            }
	                        } else {
	                            log.error('Register Collection center not found', 'Register collection center not found');
	                            createRnIRecord('Registered Location details not found | ' + JSONfromRnI.VisitInfo.locationCode + ' For VID | ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId, '', "Org Collection not found");
	                            return '-337799';

	                        }
	                    } else {
	                        log.error('Duplicate VID number Found', 'VID number already present in NetSuite');
	                        // createRnIRecord('Duplicate VID Number found | ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId,'',"Duplicate VID");
	                        return '-5544';
	                    }
	                } else {
	                    createRnIRecord('Visit Date is not available in JSON of | ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId, '', "Visit Date issue");
	                    log.error('Visit Date is not available in JSON', 'Visit Date is not available in JSON for ' + JSONfromRnI.VisitInfo.VisitNumber);
	                    return '';
	                }

	            } catch (inve) {
	                log.error({
	                    title: 'Error Occured while creating Invoice',
	                    details: inve.message
	                });
	                createRnIRecord(inve.message, fileName, '', '', "Suitescript error");
	                return '';
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
	                log.debug("customrecord_b2b_vid_detailsSearchObj result count", searchResultCount);
	                customrecord_b2b_vid_detailsSearchObj.run().each(function(result) {
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
	                    'subsidiary', 'custentity_mhl_extended_to_org', 'custentity_mhl_cus_invoicing_cycle', 'custentitycusrecord_invoicetype', 'custentity_mhl_cus_org','custentity_mhl_billing_started',
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
	                        'subsidiary', 'custentity_mhl_extended_to_org', 'custentity_mhl_cus_invoicing_cycle', 'custentitycusrecord_invoicetype', 'custentity_mhl_cus_org','custentity_mhl_billing_started',
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
	        function createRnIRecord(e, fileName, fileId, invoiceId, errname) {
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

	            if (errname) {
	                rnIRec.setValue({
	                    fieldId: 'custrecord_mhl_rni_inte_errorname',
	                    value: errname
	                });
	            }

	            rnIRec.setValue({
	                fieldId: 'custrecord_processed',
	                value: '2'
	            });
	            rnIRec.save();
	        }

	        Date.prototype.addHours = function(h) {

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
	                summary.mapSummary.keys.iterator().each(function(key, executionCount, completionState) {

	                    if (completionState === 'COMPLETE') {
	                        mapKeysProcessed++;
	                    }

	                    return true;

	                });
	                log.audit({
	                    title: 'Map key statistics',
	                    details: 'Total number of JSON processed successfully: ' + mapKeysProcessed
	                });
	            } catch (e) {
	                log.error({
	                    title: 'Error Occured in Summary function',
	                    details: e
	                });
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
/*************************************************************
 * File Header
 * Script Type: Map/Reduce
 * Script Name:MHL B2B VID Creation | R&I
 * File Name: MHL VID Creation B2B Invoice.js
 * Created On: 31-05-2022
 * Modified On:
 * Created By: Ganesh Sapkale/Avinash (Yantra Inc.)
 * Modified By: Avinash (Yantra Inc.)
 * Description:
 *********************************************************** */