	/**
	 * Script Name: MHL_YIL_B2B_Attune_VID_Creation.js
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL YL MR B2BUpdate Test Code Separate
 * File Name: MHL_YIL_B2B_Update_VID_test_code_Fields_consolidate_inv_separate_run
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: B2BUpdate Test Code Separate
 *********************************************************** */

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

	              /*   return search.load({
	                    id: 'customsearch_mhl_b2b_test_vid_update'
	                }); */
					var fileSearchObj = search.load({id: 'customsearch_mhl_b2b_test_vid_update_2'});
					var resultSet = fileSearchObj.run().getRange({start : 0,end : 1000});
				if(resultSet!=null&&resultSet!=''&&resultSet!=' ')
				{
					var completeResultSet = resultSet; 
					var start = 1000;
					var last = 2000;
					
					while(resultSet.length == 1000)
					{
						resultSet = fileSearchObj.run().getRange(start, last);
						completeResultSet = completeResultSet.concat(resultSet);
						start = parseFloat(start)+1000;
						last = parseFloat(last)+1000;
						
					//	log.audit("Input Call","start "+start)
						
						if(start == 70000)
						{
							log.audit("Check count","start "+start);
							return completeResultSet;
						}
					}
					
					
					if(resultSet)
					{
						log.debug('In getInputData_savedSearch: resultSet: '+resultSet.length);	
					}
					return resultSet = completeResultSet;
				}
					
					

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
				
				
				
				
				
				//return false;
				
				//var s_data = s_data.replace(/.CUSTRECORD_SALESORDER/g, 'CUSTRECORD_SALESORDER');
				var s_data = s_data.replace(/CUSTRECORD_REFERENCE_B2B./g, 'CUSTRECORD_REFERENCE_B2B');
			log.debug("s_data  ",(s_data))
				var testData = JSON.parse(s_data)
				
				var i_b2bVId = testData.id
				//var invoice_id = testData.values.custbody_invoice_noCUSTRECORD_SALESORDER.value;
				var invoice_id = testData.values.CUSTRECORD_REFERENCE_B2Bcustrecord_invoice_number[0].value;
				//log.audit("invoice_id",i_b2bVId+" | "+invoice_id);
				
				
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
	                log.audit({
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