	/**
	 * Script Name: MHL Sister Lab VID Creation B2B Invoice.js
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 * Author: Avinash Lahane & Ganesh Sapkale
	 * Date: May 2022
	 * Description:1] This script will create Sister Lab B2B VID Record and B2C Invoice.
	 */
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
	                log.audit("deployment Id", deploymentId);
	                if (deploymentId == 'customdeploy_mhl_sisterlab_b2b_vid_creat') {
	                    return search.load({
	                        id: 'customsearch_mhl_sisterlab_b2b_vid'
	                    });
	                }

	                if (deploymentId == 'customdeploy_mhl_sisterlab_b2b_vid_cre_2') {
	                    return search.load({
	                        id: 'customsearch_sis_lab_vid_1509'
	                    });
	                }

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
	                log.audit('Invoice Created', invId);

	                log.debug('End', '-------------------------------------');

	                if (invId > 0) {
	                    jsonFile.folder = '168926';
	                    jsonFile.save();
	                } else if (invId == '-450674') {
	                    jsonFile.folder = '168927';
	                    jsonFile.save();
	                } else if (invId == '-5544') {
	                    jsonFile.folder = '168927';
	                    jsonFile.save();
	                } else if (invId == '-168926') {
	                    jsonFile.folder = '168926';
	                    jsonFile.save();
	                } else if (invId == '-450966') {
	                    jsonFile.folder = '450966';
	                    jsonFile.save();
	                } else if (invId == '-168928') {
	                    jsonFile.folder = '168928';
	                    jsonFile.save();
	                } else {
	                    jsonFile.folder = '168927';
	                    jsonFile.save();
	                }

	            } catch (ex) {
	                log.error({
	                    title: 'map: error in creating records',
	                    details: ex
	                });
	                createRnIRecord(ex, jsonFile.name);
	                jsonFile.folder = '168927';
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
	                //var locationCenterDetails=searchLocationCenter(JSONfromRnI.VisitInfo.LocationID);

	                var visitNumberToBeFound = JSONfromRnI.VisitInfo.VisitNumber;
	                var visitDate = JSONfromRnI.VisitInfo.visitDate;
	                if (visitDate) {

	                    var s_VID_number = JSONfromRnI.VisitInfo.VisitNumber + '_S'
	                    var s_VID_numberr = JSONfromRnI.VisitInfo.VisitNumber
	                    var s_sis_loc_id = JSONfromRnI.VisitInfo.LocationID

	                    var i_main_VID = searchMainInvoice(JSONfromRnI.VisitInfo.VisitNumber);
	                    /*  if (_nullValidation(i_main_VID)) {
	                          return '-237';
	                      }*/
	                    //var invoiceRecId = searchInvoice(s_VID_number, s_sis_loc_id);

	                    var i_netAmount = JSONfromRnI.Billinfo.NetAmount;

	                    var i_parentLocationID = JSONfromRnI.VisitInfo.ParentLocationID;

	                    // var f_dupVID = checkBvid(visitNumberToBeFound)

	                    //Added line of if(visitNumberToBeFound) as CMS External ID filter operator issue 
	                    var invoiceRecId;

	                    // if (f_dupVID)
	                    {

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

	                                log.debug("customerType", customerPaymentType);

	                                var customerSubsidiary = customerDetails[0].getValue({
	                                    name: 'subsidiary'
	                                });

	                                var customer_invoicing_cycleText = customerDetails[0].getText({
	                                    name: 'custentity_mhl_cus_invoicing_cycle'
	                                });
	                                log.debug("customer_invoicing_cycleText", customer_invoicing_cycleText)

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
	                                var SBU = customerDetails[0].getValue({
	                                    name: "custentitycusrecord_invoicetype"
	                                });
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

	                                if (customerPaymentType == 1) {
	                                    log.audit("Customer Type " + visitNumberToBeFound, "B2C Type")
	                                    var consolidatedItem = '';
	                                    var homeVisitItem = [];
	                                    var homeVisitCharge = [];
	                                    var totalVIDNet = 0;
	                                    /////////////////////// Search Consolidated Item by Org Name ////////////////////////////////
	                                    consolidatedItem = searchItem(customerSegment);

	                                    var tempArray = [];
	                                    if (Array.isArray(JSONfromRnI.GeneralBillingInfo)) {
	                                        tempArray = JSONfromRnI.GeneralBillingInfo;
	                                    } else {
	                                        tempArray.push(JSONfromRnI.GeneralBillingInfo);
	                                    }

	                                    //CR 03 Dec 2020 Skip the homevisit and set consolidated item with net amout
	                                    /*for(var gg in tempArray)
	                                                        {
	                                                        	if(tempArray[gg].Code!='0' && tempArray[gg].Code)
	                                                        	{
	                                                        		homeVisitItem.push(searchItem(tempArray[gg].Code));
	                                                        		homeVisitCharge.push(tempArray[gg].Amount);
	                                                        		totalVIDNet=totalVIDNet+Number(tempArray[gg].Amount);
	                                                        	}
	                                                        }*/

	                                    ////log.debug('homeVisitItem Item',homeVisitItem);

	                                    if (consolidatedItem) {
	                                        ////log.debug('Consolidated Item',consolidatedItem);
	                                        var vidNetAmount = Number(JSONfromRnI.Billinfo.NetAmount);

	                                        var invoiceRecord = record.create({
	                                            type: record.Type.INVOICE,
	                                            isDynamic: true,
	                                            defaultValues: {
	                                                entity: customerInternalId
	                                            }
	                                        });

	                                        var trans_date = datellib.findDate(visitDate, null, subsidiaryTimezone_gmt);
	                                        log.debug('trans_date', trans_date);
	                                        if (trans_date) {

	                                            var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	                                            var postingPeriod = month[trans_date.getMonth()] + " " + trans_date.getFullYear();
	                                            invoiceRecord.setValue({
	                                                fieldId: 'trandate',
	                                                value: format.parse({
	                                                    value: trans_date,
	                                                    type: format.Type.DATE
	                                                })
	                                            });
	                                            invoiceRecord.setValue({
	                                                fieldId: 'custbody_rni_date',
	                                                value: trans_date.toString()
	                                            });
	                                            if (postingPeriod) {
	                                                invoiceRecord.setText({
	                                                    fieldId: 'postingperiod',
	                                                    value: postingPeriod
	                                                });
	                                            }
	                                        }

	                                        // Setting Body field Values in below sections
	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_sisterlab_vid',
	                                            value: true
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'location',
	                                            value: registeredOrg
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'cseg_mhl_custseg_un',
	                                            value: vidUnit
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'cseg_mhl_locations',
	                                            value: locationOrgId
	                                        });

	                                        invoiceRecord.setValue({
	                                            fieldId: 'class',
	                                            value: vidSbu
	                                        });

	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_invoice_vid_number',
	                                            value: s_VID_number
	                                        });

	                                        // Code: start .this code added by Ganesh - 12-08-2021
	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_sisterlab_parent_id',
	                                            value: i_parentLocationID
	                                        }); //set parentOrgId

	                                        invoiceRecord.setValue({
	                                            fieldId: 'externalid',
	                                            value: 'inv_' + s_VID_number + '_' + i_parentLocationID + '_' + s_sis_loc_id
	                                        });

	                                        // Code:  end

	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_sisterlab_loc_id',
	                                            value: s_sis_loc_id
	                                        });

	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_inv_patient_number',
	                                            value: JSONfromRnI.PatientNumber
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_inv_patient_mobile',
	                                            value: JSONfromRnI.Mobile
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_inv_referring_hospital_id',
	                                            value: JSONfromRnI.VisitInfo.RefHospitalID
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_inv_patient_name',
	                                            value: JSONfromRnI.Name
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_inv_referring_doctor',
	                                            value: JSONfromRnI.VisitInfo.ReferingDoctor
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_inv_phlebotomist_name',
	                                            value: JSONfromRnI.VisitInfo.PhlebotomistName
	                                        });
	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_inv_patient_address',
	                                            value: JSONfromRnI.Address
	                                        });

	                                        invoiceRecord.setValue({
	                                            fieldId: 'custbody_mhl_sl_mainvidnumber',
	                                            value: i_main_VID
	                                        });

	                                        var processingSubsidiary = invoiceRecord.getValue({
	                                            fieldId: 'subsidiary'
	                                        });
	                                        var registeredSubsidiary = invoiceRecord.getValue({
	                                            fieldId: 'custbody_mhl_sl_mainvidsubsy'
	                                        });

	                                        if (processingSubsidiary == registeredSubsidiary) // Intra company Transactions
	                                        {
	                                            invoiceRecord.setValue({
	                                                fieldId: 'custbody_mhl_invoice_type',
	                                                value: 2
	                                            });
	                                        } else {
	                                            invoiceRecord.setValue({
	                                                fieldId: 'custbody_mhl_invoice_type',
	                                                value: 3
	                                            });
	                                        }
	                                        ////////////////////// Creating item line with consolidated Item //////////////////////////////////////////////////

	                                        ////log.debug({title:'Creating Item Line for',details:consolidatedItem});

	                                        if (homeVisitItem.length > 0) {
	                                            for (var tt in homeVisitItem) {
	                                                invoiceRecord.selectNewLine({
	                                                    sublistId: 'item'
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'item',
	                                                    value: homeVisitItem[tt]
	                                                }); //, value: itemArray[i].TestCode });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'price',
	                                                    value: '-1'
	                                                }); // Setting Custom price level
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'quantity',
	                                                    value: '1'
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'rate',
	                                                    value: homeVisitCharge[tt]
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'location',
	                                                    value: registeredOrg
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'cseg_mhl_custseg_un',
	                                                    value: vidUnit
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'class',
	                                                    value: vidSbu
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'cseg_mhl_locations',
	                                                    value: locationOrgId
	                                                });

	                                                //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: vidNetAmount});

	                                                //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_mhl_inv_processing_location', value: collectionCenter});
	                                                //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_processing_location_org', value: regLocationInternalId});

	                                                invoiceRecord.commitLine({
	                                                    sublistId: 'item'
	                                                });

	                                                ////log.debug('Home Visit','Line saved '+homeVisitItem[tt]);

	                                            }

	                                            if (Number(vidNetAmount) > Number(totalVIDNet)) {
	                                                var tempDiff = Number(vidNetAmount) - Number(totalVIDNet);
	                                                invoiceRecord.selectNewLine({
	                                                    sublistId: 'item'
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'item',
	                                                    value: consolidatedItem
	                                                }); //, value: itemArray[i].TestCode });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'price',
	                                                    value: '-1'
	                                                }); // Setting Custom price level
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'quantity',
	                                                    value: '1'
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'rate',
	                                                    value: tempDiff
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'location',
	                                                    value: registeredOrg
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'cseg_mhl_custseg_un',
	                                                    value: vidUnit
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'class',
	                                                    value: vidSbu
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'item',
	                                                    fieldId: 'cseg_mhl_locations',
	                                                    value: locationOrgId
	                                                });

	                                                //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: vidNetAmount});

	                                                //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_mhl_inv_processing_location', value: collectionCenter});
	                                                //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_processing_location_org', value: regLocationInternalId});

	                                                invoiceRecord.commitLine({
	                                                    sublistId: 'item'
	                                                });
	                                                ////log.debug('Home Visit + consolidated','Line saved ');

	                                            }

	                                        } else {
	                                            invoiceRecord.selectNewLine({
	                                                sublistId: 'item'
	                                            });
	                                            invoiceRecord.setCurrentSublistValue({
	                                                sublistId: 'item',
	                                                fieldId: 'item',
	                                                value: consolidatedItem
	                                            }); //, value: itemArray[i].TestCode });
	                                            invoiceRecord.setCurrentSublistValue({
	                                                sublistId: 'item',
	                                                fieldId: 'price',
	                                                value: '-1'
	                                            }); // Setting Custom price level
	                                            invoiceRecord.setCurrentSublistValue({
	                                                sublistId: 'item',
	                                                fieldId: 'quantity',
	                                                value: '1'
	                                            });
	                                            invoiceRecord.setCurrentSublistValue({
	                                                sublistId: 'item',
	                                                fieldId: 'rate',
	                                                value: vidNetAmount
	                                            });
	                                            invoiceRecord.setCurrentSublistValue({
	                                                sublistId: 'item',
	                                                fieldId: 'location',
	                                                value: registeredOrg
	                                            });
	                                            invoiceRecord.setCurrentSublistValue({
	                                                sublistId: 'item',
	                                                fieldId: 'cseg_mhl_custseg_un',
	                                                value: vidUnit
	                                            });
	                                            invoiceRecord.setCurrentSublistValue({
	                                                sublistId: 'item',
	                                                fieldId: 'class',
	                                                value: vidSbu
	                                            });
	                                            invoiceRecord.setCurrentSublistValue({
	                                                sublistId: 'item',
	                                                fieldId: 'cseg_mhl_locations',
	                                                value: locationOrgId
	                                            });

	                                            //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: vidNetAmount});

	                                            //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_mhl_inv_processing_location', value: collectionCenter});
	                                            //invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_processing_location_org', value: regLocationInternalId});

	                                            invoiceRecord.commitLine({
	                                                sublistId: 'item'
	                                            });
	                                            ////log.debug('consolidated','Line saved ');

	                                        }

	                                        if (flag == 0) {
	                                            //////////////// Add line for display item from order info  ////////////////////////////////////////////////////////////////////////
	                                            var a_testCode_rate = [];
	                                            var testObject = {
	                                                testCode: [],
	                                                testName: [],
	                                                testInternalId: [],
	                                                testNetAmt: [],
	                                                testGross: [],
	                                                testDiscount: [],
	                                                processingCenter: [],
	                                                processingCenterId: [],
	                                                processingCenterOrg: []
	                                            }
	                                            var testArray = [];
	                                            if (Array.isArray(JSONfromRnI.OrderInfo)) {
	                                                testArray = JSONfromRnI.OrderInfo;
	                                            } else {
	                                                testArray.push(JSONfromRnI.OrderInfo);
	                                            }
	                                            var a_item_line_data = []
	                                            for (var te in testArray) {
	                                                a_item_line_data[(testArray[te].TestCode).toString()] = '';

	                                                a_testCode_rate[(testArray[te].TestCode).toString()] = '';

	                                                testObject.testCode.push((testArray[te].TestCode).toString());
	                                                testObject.testName.push((testArray[te].TestName).toString());
												if(testArray[te].NSNetAmount){
													testObject.testNetAmt.push(testArray[te].NSNetAmount);
												}else{
	                                                testObject.testNetAmt.push(testArray[te].Amount);
												}
	                                                testObject.testGross.push(testArray[te].MRP);
	                                                testObject.testDiscount.push(testArray[te].DiscountAmount);
	                                            }

	                                            if (JSONfromRnI.OrderInfo) {
	                                               // testObject = updateInternalId(testObject, a_item_line_data);
	                                            } else {
	                                                createRnIRecord('Order Info not available For VID ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                                            }

	                                            for (var testLine in testObject.testCode) {
	                                                var s_gross_error = '';
	                                                var tempObj = '';
	                                                /* var i_item_internal_id = a_item_line_data[testObject.testCode[testLine]]
	                                                if (_nullValidation(i_item_internal_id)) {
	                                                    ////log.debug('Can Not Create VID','Rate Card Not Found');
	                                                    createRnIRecord('Item Not found for Test Code ' + testObject.testCode[testLine], fileName, fileId);
	                                                    return '';
	                                                } */

	                                                invoiceRecord.selectNewLine({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid'
	                                                });
	                                                //invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_ref_customer_rm',value:customerInternalId});
	                                                //invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_code',value:testObject.testInternalId[testLine]});
	                                               /*  invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_mhl_itd_test_code',
	                                                    value: i_item_internal_id
	                                                }); */
													invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_mhl_itd_test_code_string',
	                                                    value: testObject.testCode[testLine]
	                                                });

	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_mhl_itd_test_name',
	                                                    value: testObject.testName[testLine]
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_mhl_itd_net_amt',
	                                                    value: testObject.testNetAmt[testLine]
	                                                });

	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_for_print',
	                                                    value: true
	                                                });

	                                                invoiceRecord.commitLine({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid'
	                                                });
	                                            }

	                                            ////////////////////////////// Individual test Add in custom record ////////////////////////////////////

	                                            var testObject = {
	                                                testCode: [],
	                                                testInternalId: [],
	                                                processingCenter: [],
	                                                processingCenterId: [],
	                                                processingCenterCode: [],
	                                                processingCenterOrg: []
	                                            }
	                                            var testArray = [];
	                                            if (Array.isArray(JSONfromRnI.SampleInfo)) {
	                                                testArray = JSONfromRnI.SampleInfo;
	                                            } else {
	                                                testArray.push(JSONfromRnI.SampleInfo);
	                                            }
	                                            var a_item_line_data = []
	                                            for (var te in testArray) {
	                                                a_item_line_data[(testArray[te].TestCode).toString()] = '';
	                                                testObject.testCode.push((testArray[te].TestCode));
	                                                // This code commented by Ganesh and add new line for ProcessingLocationCode 
	                                                //testObject.processingCenter.push((testArray[te].ProcessingLocationID).toString());
	                                                testObject.processingCenterCode.push((testArray[te].ProcessingLocationCode).toString());
	                                                log.debug("testObject.processingCenter", testArray[te].ProcessingLocationCode)
	                                            }
	                                            if (JSONfromRnI.SampleInfo) {
	                                                //testObject = updateInternalId(testObject, a_item_line_data);
	                                            } else {
	                                                createRnIRecord('Sample Info not available For VID ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                                            }

	                                            /////////////////////////////////// Create Custom record for each individual test //////////////////////////////////

	                                            for (var testLine in testObject.testCode) {
	                                               // var i_item_internal_id = a_item_line_data[testObject.testCode[testLine]];

	                                                invoiceRecord.selectNewLine({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid'
	                                                });
	                                                //invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_ref_customer_rm',value:customerInternalId});
	                                                //invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_test_code',value:testObject.testInternalId[testLine]});
	                                               /*  invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_mhl_itd_test_code',
	                                                    value: i_item_internal_id
	                                                }); */
													invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_mhl_itd_test_code_string',
	                                                    value: testObject.testCode[testLine]
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_mhl_itd_test_name',
	                                                    value: testObject.testCode[testLine]
	                                                });
	                                                //invoiceRecord.setCurrentSublistValue({sublistId:'recmachcustrecord_mhl_itd_vid',fieldId:'custrecord_mhl_itd_net_amt',value:f_net_amt});
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_processing_center',
	                                                    value: testObject.processingCenterId[testLine]
	                                                });
	                                                invoiceRecord.setCurrentSublistValue({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid',
	                                                    fieldId: 'custrecord_processing_center_org',
	                                                    value: testObject.processingCenterOrg[testLine]
	                                                });
	                                                invoiceRecord.commitLine({
	                                                    sublistId: 'recmachcustrecord_mhl_itd_vid'
	                                                });
	                                                ////log.debug('Test Code line ','Line saved ');

	                                            }

	                                        }

	                                        //////////////////////////////////////////// Payment Info from JSON ///////////////////////////////////////////////

	                                        var paymentInfo = [];
	                                        if (Array.isArray(JSONfromRnI.PaymentInfo)) {
	                                            paymentInfo = JSONfromRnI.PaymentInfo;
	                                        } else {
	                                            paymentInfo.push(JSONfromRnI.PaymentInfo);
	                                        }

	                                        var refNo = '';
	                                        var amountReceived = 0;

	                                        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	                                        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	                                        var subsidiary = invoiceRecord.getValue({
	                                            fieldId: 'subsidiary'
	                                        });
	                                        var customerId = invoiceRecord.getValue({
	                                            fieldId: 'entity'
	                                        });

	                                        var vidNumber = invoiceRecord.getValue({
	                                            fieldId: 'custbody_mhl_invoice_vid_number'
	                                        });
	                                        var orgVal = invoiceRecord.getValue({
	                                            fieldId: 'location'
	                                        });
	                                        var departmentVal = invoiceRecord.getValue({
	                                            fieldId: 'department'
	                                        });
	                                        var classmentVal = invoiceRecord.getValue({
	                                            fieldId: 'class'
	                                        });
	                                        var unitVal = invoiceRecord.getValue({
	                                            fieldId: 'cseg_mhl_custseg_un'
	                                        });

	                                        var invoiceIdNo = invoiceRecord.save({
	                                            enableSourcing: true,
	                                            ignoreMandatoryFields: true
	                                        });
	                                        log.audit('Invoice Created', invoiceIdNo);

	                                        for (var pay in paymentInfo) {
	                                            var payMode = paymentInfo[pay].PaymentMode;

	                                            if (payMode != '0' && payMode != '1') {

	                                                var customerType = search.lookupFields({
	                                                    type: search.Type.CUSTOMER,
	                                                    id: customerId,
	                                                    columns: ['custentity_mhl_customer_payment_mode', 'custentity_current_deposit']
	                                                });

	                                                if ((customerType.custentity_mhl_customer_payment_mode[0].text == 'Cash' || customerType.custentity_mhl_customer_payment_mode[0].text == 'Co-payment')) {

	                                                    var paymentId = paymentRecordFunction(trans_date, subsidiary, invoiceIdNo, customerId, Number(paymentInfo[pay].AmountReceived), vidDate, paymentInfo[pay], payMode, vidNumber, orgVal, departmentVal, classmentVal, unitVal);

	                                                    if (paymentId != 'Payment_created') {
	                                                        log.error("Payment_created resp ", paymentId);

	                                                        createRnIRecord('Customer Payment Not Created | ' + paymentId + ' \n For VID ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                                                        return '-384893';
	                                                    }
	                                                }
	                                            }
	                                        }
	                                        return '168926'
	                                        //return invoiceIdNo;

	                                    } else {

	                                        createRnIRecord('Revenue Item not found for segment ' + customerSegment + ' For VID ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);

	                                    }
	                                } else {
	                                    log.audit("Customer Type " + visitNumberToBeFound, "B2B Type")
	                                    //////////////////Is Main VID present in B2B VID Details List///////////////////////
	                                    var customrecord_b2b_vid_detailsSearchObj = search.create({
	                                        type: "customrecord_b2b_vid_details",
	                                        filters: [
	                                            ["custrecord_vidno", "is", visitNumberToBeFound]
	                                        ],
	                                        columns: [
	                                            search.createColumn({
	                                                name: "custrecord_vidno",
	                                                label: "VID No"
	                                            }),
	                                            search.createColumn({
	                                                name: "custrecord_org",
	                                                label: "Org"
	                                            })
	                                        ]
	                                    });
	                                    var vidsearchResultCount = customrecord_b2b_vid_detailsSearchObj.run().getRange({
	                                        start: 0,
	                                        end: 1
	                                    });
	                                    log.debug("VID countlength", vidsearchResultCount.length);
	                                    if (vidsearchResultCount.length != 0) {
	                                        var Main_VID_Org = vidsearchResultCount[0].getValue({
	                                            name: "custrecord_org"
	                                        });
	                                        log.debug("Main_VID_Org", Main_VID_Org);
	                                    }
	                                    ////////////////////////Is Main VID present in Invoice///////////////////////////////////			
	                                    var invoiceSearchObj = search.create({
	                                        type: "invoice",
	                                        filters: [
	                                            ["type", "anyof", "CustInvc"],
	                                            "AND",
	                                            ["custbody_mhl_invoice_vid_number", "is", visitNumberToBeFound],
	                                            "AND",
	                                            ["mainline", "is", "T"]
	                                        ],
	                                        columns: [
	                                            search.createColumn({
	                                                name: "custbody_mhl_invoice_vid_number",
	                                                label: "VID Number"
	                                            }),
	                                            search.createColumn({
	                                                name: "internalid",
	                                                label: "InternalID"
	                                            }),
	                                            search.createColumn({
	                                                name: "location",
	                                                label: "Org"
	                                            })
	                                        ]
	                                    });
	                                    var invsearchResultCount = invoiceSearchObj.run().getRange({
	                                        start: 0,
	                                        end: 1
	                                    });
	                                    log.debug("Invoice countlength", invsearchResultCount.length);
	                                    if (invsearchResultCount.length != 0) {
	                                        var Main_INV = invsearchResultCount[0].getValue({
	                                            name: "internalid"
	                                        });
	                                        log.debug("Invoice Main_INV", Main_INV);
	                                        var Main_INV_Org = invsearchResultCount[0].getValue({
	                                            name: "location"
	                                        });
	                                        log.debug("Main_INV_Org", Main_INV_Org);
	                                    }
	                                    if (invsearchResultCount.length != 0 || vidsearchResultCount.length != 0) {
	                                        if (customerPaymentType != 1) {
	                                            var num = '';
	                                            if (customer_invoicing_cycleText) {
	                                                var num = customer_invoicing_cycleText.match(/\d+/g);
	                                                var days_num = num[0];
	                                                log.debug("days_num", days_num);

	                                                var letr = customer_invoicing_cycleText.match(/[a-zA-Z]+/g);
	                                                var months = letr[0]
	                                                log.debug("months", months);
	                                            } else {
	                                                log.error('Billing Cycle Date error', 'Please select BILLING CYCLE DAYS in  ' + JSONfromRnI.VisitInfo.ClientCode)
	                                                createRnIRecord('Please select BILLING CYCLE DAYS in  ' + JSONfromRnI.VisitInfo.ClientCode, fileName, fileId);
	                                                return false;
	                                            }

	                                            var visitDate = JSONfromRnI.VisitInfo.visitDate;
	                                            var trans_date = datellib.findDate(visitDate, null, subsidiaryTimezone_gmt);

	                                            var ConvertedDt = new Date(trans_date);
	                                            // var ConvertedDt = convert_date(d_date);
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

	                                            //return false;

	                                            //var i_newSO_id = findSO(customerInternalId, Billing_Cycle, registeredOrg, vidSbu, Invoice_Type, Reve_seg, JSONfromRnI.VisitInfo.ClientCode)

	                                            //log.debug("i_salesOrderId", i_newSO_id)

	                                            //return false;

	                                            var createVID = false;

	                                            var todayDate = new Date();
	                                            var o_vidObj = record.create({
	                                                type: 'customrecord_b2b_vid_details',
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
	                                                fieldId: 'custrecord_mhl_pdv_vid_num',
	                                                value: JSONfromRnI.VisitInfo.VisitNumber
	                                            });

	                                            o_vidObj.setValue({
	                                                fieldId: 'custrecord_b2b_vid_json_file',
	                                                value: fileId
	                                            })
	                                            o_vidObj.setValue({
	                                                fieldId: 'custrecord_mhl_b2b_vid_type',
	                                                value: 3
	                                            })

	                                            var i_parentLocationID = JSONfromRnI.VisitInfo.ParentLocationID;
												var i_LocationID = JSONfromRnI.VisitInfo.LocationID;
	                                            o_vidObj.setValue({
	                                                fieldId: 'custrecord_mhl_b2b_parent_id',
	                                                value: i_parentLocationID
	                                            });

	                                            o_vidObj.setValue({
	                                                fieldId: 'custrecord_mhl_b2b_is_sis_lab',
	                                                value: true
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

	                                            if (_logValidation(Main_INV)) {
	                                                o_vidObj.setValue({
	                                                    fieldId: 'custrecord_mhl_tran_main_vid',
	                                                    value: Main_INV
	                                                });
	                                                o_vidObj.setValue({
	                                                    fieldId: 'custrecord_vidno',
	                                                    value: visitNumberToBeFound + '_' +  i_LocationID + '_' + i_parentLocationID + '_S'
	                                                });

	                                                o_vidObj.setValue({
	                                                    fieldId: 'name',
	                                                    value: visitNumberToBeFound + '_S'
	                                                });

	                                                o_vidObj.setValue({
	                                                    fieldId: 'externalid',
	                                                    value: visitNumberToBeFound + '_' +  i_LocationID + '_' + i_parentLocationID + '_S'
	                                                });

	                                            } else {
	                                                o_vidObj.setText({
	                                                    fieldId: 'custrecord_mhl_b2b_main_vid',
	                                                    text: visitNumberToBeFound
	                                                });
	                                                o_vidObj.setValue({
	                                                    fieldId: 'custrecord_vidno',
	                                                    value: visitNumberToBeFound + '_' +  i_LocationID + '_' + i_parentLocationID + '_S'
	                                                });
	                                                o_vidObj.setValue({
	                                                    fieldId: 'name',
	                                                    value: visitNumberToBeFound + '_S'
	                                                });
	                                                o_vidObj.setValue({
	                                                    fieldId: 'externalid',
	                                                    value: visitNumberToBeFound + '_' +  i_LocationID + '_' + i_parentLocationID + '_S'
	                                                });

	                                            }

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

	                                            // Addding test code and GBI
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
	                                                       /*  o_vidObj.setCurrentSublistText({
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
	                                                        log.debug("i_orderInfo[o].Amount", i_orderInfo[o].Amount)
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

	                                            var gbiLength = JSONfromRnI.GeneralBillingInfo;
	                                            log.debug("gbiLength", gbiLength.length)
	                                            if (gbiLength.length > 0) {
	                                                createVID = true;
	                                                if (JSONfromRnI.GeneralBillingInfo) {
	                                                    var i_GeneralBillingInfo = JSONfromRnI.GeneralBillingInfo;
	                                                    for (var o in i_GeneralBillingInfo) {
															if ((i_GeneralBillingInfo[o].Code == '' || i_GeneralBillingInfo[o].Code == 0) && i_GeneralBillingInfo[o].ItemName != '' && i_GeneralBillingInfo[o].Amount != 0) {
	                                                        if (i_GeneralBillingInfo[o].Code != '' && i_GeneralBillingInfo[o].Code != 0) {

	                                                            log.debug("GBI")
	                                                            o_vidObj.selectNewLine({
	                                                                sublistId: 'recmachcustrecord_reference_b2b'
	                                                            });
	                                                           /*  o_vidObj.setCurrentSublistText({
	                                                                sublistId: 'recmachcustrecord_reference_b2b',
	                                                                fieldId: 'custrecord_test_code',
	                                                                text: i_GeneralBillingInfo[o].Code
	                                                            }); */
																
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
															createRnIRecord('Could not creates the VID  | ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId, '', "GBI Test Codes not found in JSON ");
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

	                                            var amountReceived = JSONfromRnI.Billinfo.NetAmount;
	                                            o_vidObj.setValue({
	                                                fieldId: 'custrecord_amountreceived',
	                                                value: amountReceived
	                                            });
	                                            var o_patientId = o_vidObj.save({
	                                                enableSourcing: true,
	                                                ignoreMandatoryFields: true
	                                            });

	                                            log.audit('o_patientId Created', o_patientId);
	                                            //log.debug('i_soId Created', i_soId);
	                                            //return '-450966'
	                                            return o_patientId;

	                                        } else {
	                                            log.debug("Welcome ", "B2C Invoiceing")
	                                            return "-168925"
	                                        }
	                                    } else {
	                                        log.debug("Parent VID Not found ", "Parent VID not Found");
	                                        createRnIRecord('Main VID not found in the system ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                                        return "-168928"
	                                    }
	                                }

	                            } else {
	                                log.error('Can Not Create VID', 'Customer Not Found');
	                                createRnIRecord('Client code Not Found ' + JSONfromRnI.VisitInfo.ClientCode + ' For Registered ORG Internal ID ' + registeredOrg + ' & For VID ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                                return '';

	                            }

	                        } else {
	                            log.error('Register Collection center not found', 'Register collection center not found');
	                            createRnIRecord('Registered Location details not found ' + JSONfromRnI.VisitInfo.locationCode + ' For VID ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                            return '-168926';

	                        }

	                    }
	                } else {
	                    createRnIRecord('Visit Date is not available in JSON for ' + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId);
	                    log.error('Visit Date is not available in JSON', 'Visit Date is not available in JSON for ' + JSONfromRnI.VisitInfo.VisitNumber);
	                    return '';
	                }

	            } catch (inve) {
	                log.error({
	                    title: 'Error Occured while creating Invoice',
	                    details: inve
	                });
	                createRnIRecord(inve.message, fileName);
	                return '';
	            }
	        }

	        function searchMainInvoice(vid) {
	            ////log.debug({title:'vid ',details:vid});
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

	        //////////////////////////////////////////////Update Internal Id //////////////////////////////////////////////////////////

	        function updateInternalId(testObject, a_item_line_data) {
	            ///////////////////// Item Search ////////////////////////////////////////////

	            ////log.debug({title:'Item ID',details:testObject.testCode });

	            var filterString = [];
	            var testArray = [];
	            var filterArray = [];
	            for (var t in testObject.testCode) {
	                var temp = testObject.testCode[t];
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
	            ////log.debug({title:'itemSearchResult',details:itemSearchResult});

	            if (itemSearchResult.length > 0) {
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

	            if (testObject.processingCenter.length > 0) {
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

	                        customrecord_cseg_mhl_locationsSearchObj.run().each(function(result) {
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
	            log.debug("testObject", JSON.stringify(testObject))
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
	                    }), 'custentity_mhl_cust_client_type'
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
	                value: '1'
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