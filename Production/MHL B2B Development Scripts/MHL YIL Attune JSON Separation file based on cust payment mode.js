	/**
	 * Script Name: MHL YIL Attune JSON Separation file based on cust payment mode.js
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 * Author: Avinash Lahane & Ganesh Sapkale
	 * Date: May 2022
	 * Description: This script will separed Attune B2B and B2C JSON based on customer payment mode.
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
	                    id: 'customsearch_mhl_attune_vid_json'
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
	                log.audit('File will moved ', invId + " File Id " + fileInternalId);
	                
	                log.debug('End', '-------------------------------------');
	                
	                if (invId == '-B2C') {
	                 jsonFile.folder = '566110';
	                 jsonFile.save();
                      
	                } else if( invId == '-566109'){
	                    jsonFile.folder = '566109';
	                    jsonFile.save();
					} else if( invId == '-566108'){
	                    jsonFile.folder = '566108';
	                    jsonFile.save();
	                }else {
	                    jsonFile.folder = '565890';
	                    jsonFile.save();
	                }
	                
	               
	               
	            } catch (ex) {
	                log.error({
	                    title: 'map: error in creating records',
	                    details: ex
	                });
	                createRnIRecord(ex, jsonFile.name);
	                jsonFile.folder = '30739';
	                jsonFile.save();
	            }
	        }
	        
	        /////////////////////////////////////////////////////// Create Invoice /////////////////////////////////////////////////////////////
	        
	        function createVIDForJson(JSONfromRnI, fileName, fileId) {
	            try {
	                var flag = 0;
	               
	                
	                // Search Registered Collection Center and it's Org
	                //var locationCenterDetails=searchLocationCenter(JSONfromRnI.VisitInfo.LocationID);
	                
	                var visitNumberToBeFound = JSONfromRnI.VisitInfo.VisitNumber;
	                var visitDate = JSONfromRnI.VisitInfo.visitDate;
	                
	                
	                
	                // This code is added by Ganesh, to get dynamic location, org, sbu and unit from NetSuite master. : 25-08-2021
	                var s_locationCode = JSONfromRnI.VisitInfo.locationCode;
					
					if (s_locationCode) 
					{
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
					else
					{
						log.error("Location Not found")
						createRnIRecord('Location code Not Found | ' + JSONfromRnI.VisitInfo.ClientCode +" | VID | " + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId,'',"Location code Not Found");
						
						return "-566108";
						
					}
					var locationDetails = '';
					var custSubsidiary = '';
					var vidUnit = unit;
					var vidSbu = sbu;
					var registeredOrg = parseInt(orgInternalId);
	              
	                /////////////// Search customer by cleint code and org id
	              
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
	                    
	                    if (customerPaymentType != 1) {
							 log.debug("Welcome ", "B2B Invoiceing")
	                         return "-566109";
	                    } else {
	                        log.debug("Welcome ", "B2C Invoiceing")
	                        return "-B2C"
	                    }
	                    
	                }
					else
					{
						log.error("Client Not found")
						createRnIRecord('Client code Not Found | ' + JSONfromRnI.VisitInfo.ClientCode +" | VID | " + JSONfromRnI.VisitInfo.VisitNumber, fileName, fileId,'',"Client code Not Found");
						
						return false;
						
					}
	                
	            } catch (inve) {
	                log.error({
	                    title: 'Error Occured while creating Invoice',
	                    details: inve.message
	                });
	                createRnIRecord(inve.message, fileName);
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
							'subsidiary', 'custentity_mhl_extended_to_org', 'custentity_mhl_cus_invoicing_cycle', 'custentitycusrecord_invoicetype', 'custentity_mhl_cus_org',
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
			
			  function createRnIRecord(e, fileName, fileId, invoiceId,errname) {
	            var rnIRec = record.create({
	                type: 'customrecord_rni_integration_status'
	            });

	            /* rnIRec.setValue({
	                fieldId: 'custrecord_json_type',
	                value: '15'
	            }); */
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