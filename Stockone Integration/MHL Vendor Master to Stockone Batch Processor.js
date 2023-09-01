/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL Vendor to Stockone Batch Processor
 * File Name: MHL Vendor Master to Stockone Batch Processor.js
 * Created On: 15/07/2020
 * Modified On:
 * Created By: Onkar Sanjekar
 * Modified By:
 * Description: This scheduler will send Vendor master data in ready status to Stockone system
 *********************************************************** */

define(['N/format', 'N/http', 'N/record', 'N/runtime', 'N/search'],
	/**
	 * @param {format} format
	 * @param {http} http
	 * @param {record} record
	 * @param {runtime} runtime
	 * @param {search} search
	 */
	function(format, http, record, runtime, search) {

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
					id: 'customsearch_vendor_search_for_stockone'
				});

			} catch (e) {
				log.debug({
					title: 'Error occured in getting vendor list',
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
				//var recordInternalId = data; 
				var recordInternalId = data.id;
				var vendorRecordObj = record.load({
					type: record.Type.VENDOR,
					id: recordInternalId,
					isDynamic: false,
				});
				sendToStockOne(vendorRecordObj);
			} catch (e) {
				log.debug({
					title: 'Error in loading Vendor Record',
					details: e
				});
			}
		}

		function sendToStockOne(vendorRecordObj) {

			try {

				var recordObj = vendorRecordObj;
				var scriptObj = runtime.getCurrentScript();

				var integrationStatus = recordObj.getValue({
					fieldId: 'custentity_mhl_integration_status'
				}); // 1 is for ready , execute below code if it is set to ready
				if (integrationStatus) //!='2')
				{
					var clientId = scriptObj.getParameter({
						name: 'custscript_clientid'
					});
					var clientSecret = scriptObj.getParameter({
						name: 'custscript_clientsecret'
					});
					var grantType = scriptObj.getParameter({
						name: 'custscript_granttype'
					});
					var tokenURL = scriptObj.getParameter({
						name: 'custscript_tokenurl'
					});
					var vendorURL = scriptObj.getParameter({
						name: 'custscript_vendorurl'
					});

					tokenURL = tokenURL + '?client_id=' + clientId + '&client_secret=' + clientSecret + '&grant_type=' + grantType;
					var tempSupplierId = (recordObj.getValue({
						fieldId: 'entityid'
					})).split(' ');
					var supplierId = tempSupplierId[0]; //recordObj.getValue({fieldId:'entityid'});
					var isperson = recordObj.getValue({
						fieldId: 'isperson'
					});
					//log.debug({title:'isperson',details:isperson});

					var supplierName = '';
					//  log.debug({title:'isperson',details:isperson});
					if (isperson == 'T') {
						supplierName = recordObj.getValue({
							fieldId: 'firstname'
						}) + ' ' + recordObj.getValue({
							fieldId: 'lastname'
						});
						//log.debug({title:'supplierName',details:supplierName});
					} else {
						supplierName = recordObj.getValue({
							fieldId: 'companyname'
						});
						//log.debug({title:'supplierName 94',details:supplierName});
					}

					var email = recordObj.getValue({
						fieldId: 'email'
					});
					var phoneNo = recordObj.getValue({
						fieldId: 'phone'
					});
					var panNo = recordObj.getValue({
						fieldId: 'custentity_permanent_account_number'
					});
					var creditPeriod = recordObj.getValue({
						fieldId: 'terms'
					});
					var creditPeriodDetail = recordObj.getText({
						fieldId: 'terms'
					});
					//var subsidiary=recordObj.getValue({fieldId:'subsidiary'});
					var internalIdAd = recordObj.id;
					var paymentTerms = recordObj.getValue({
						fieldId: 'custentity_mhl_vendor_paymentterm'
					});
					var vendStatus = recordObj.getValue({
						fieldId: 'isinactive'
					});
					var finalVendorStatus = 'active';
					var vendorHold = recordObj.getValue({
						fieldId: 'custentity_mhl_hold'
					});

					var subsidiaryArray = [];

					var subCnt = recordObj.getLineCount({
						sublistId: 'submachine'
					});

					for (var t = 0; t < subCnt; t++) {
						subsidiaryArray.push(Number(recordObj.getSublistValue({
							sublistId: 'submachine',
							fieldId: 'subsidiary',
							line: t
						})));
					}

					log.debug({
						title: 'vendStatus',
						details: vendStatus
					});
					log.debug({
						title: 'vendorHold',
						details: vendorHold
					});

					if (vendStatus || vendorHold) {
						finalVendorStatus = 'inactive';
					}
					var pamentTermArray = [];
					var termRec = '';
					var creditPeriodInDays = '';
					var description = '';

					for (var t in paymentTerms) {
						termRec = record.load({
							type: 'term',
							id: paymentTerms[t]
						});
						creditPeriodInDays = termRec.getValue({
							fieldId: 'daysuntilnetdue'
						});

						var description = termRec.getValue({
							fieldId: 'name'
						});

						pamentTermArray.push({
							'reference_id': paymentTerms[t],
							'description': description
						});
					}

					var secondaryEmail = recordObj.getValue({
						fieldId: 'custentity_mhl_secondaryemailid'
					});
					var poExpirationDate = recordObj.getValue({
						fieldId: 'custentity_mhl_vendor_poexpiryduration'
					});

					var accountNumber = 0;
					var accountHolderName = '';
					var bankName = '';
					var branchName = '';
					var ifscCode = '';

					var termRec = '';
					var description = '';
					if (creditPeriod) {
						termRec = record.load({
							type: 'term',
							id: creditPeriod
						});
						creditPeriodInDays = termRec.getValue({
							fieldId: 'daysuntilnetdue'
						});

						description = termRec.getValue({
							fieldId: 'name'
						});
					}

					if (!creditPeriodInDays) {
						creditPeriodInDays = 0;
					}

					var tempObject = [{
						'reference_id': creditPeriod,
						'description': description
					}];

					//				var secondaryEmailId=recordObj.getValue({fieldId:'phone'});

					var vendorAddressArray = [];
					// Get Bank details from custom record lines
					var bankRecCnt = recordObj.getLineCount({
						sublistId: 'recmachcustrecord_mhl_vendor'
					});
					var addressBookCnt = recordObj.getLineCount({
						sublistId: 'addressbook'
					});
					if (bankRecCnt > 0) {
						for (var t = 0; t < bankRecCnt; t++) {
							var accountPreference = recordObj.getSublistValue({
								sublistId: 'recmachcustrecord_mhl_vendor',
								fieldId: 'custrecord_mhl_vendor_bankacctpreference',
								line: t
							});
							if (accountPreference == '1') {
								accountHolderName = recordObj.getSublistValue({
									sublistId: 'recmachcustrecord_mhl_vendor',
									fieldId: 'custrecord_account_holder_name',
									line: t
								});
								accountNumber = recordObj.getSublistValue({
									sublistId: 'recmachcustrecord_mhl_vendor',
									fieldId: 'custrecord_mhl_vendor_bankaccno',
									line: t
								});
								bankName = recordObj.getSublistValue({
									sublistId: 'recmachcustrecord_mhl_vendor',
									fieldId: 'custrecord_mhl_vendor_bankname',
									line: t
								});
								branchName = recordObj.getSublistValue({
									sublistId: 'recmachcustrecord_mhl_vendor',
									fieldId: 'custrecord_mhl_vendor_branchname',
									line: t
								});
								ifscCode = recordObj.getSublistValue({
									sublistId: 'recmachcustrecord_mhl_vendor',
									fieldId: 'custrecord_mhl_vendor_ifsccode',
									line: t
								});
								break;
							}
						}
					}
					//log.debug({title:'addressBookCnt',details:addressBookCnt});

					var taxRegNumber = recordObj.getLineCount({
						sublistId: 'taxregistration'
					});
					//log.debug({title:'taxRegNumber',details:taxRegNumber});

					var taxRecbyAddress = {
						addressId: [],
						taxValue: []
					};

					for (var w = 0; w < taxRegNumber; w++) {
						taxRecbyAddress.addressId.push(recordObj.getSublistValue({
							sublistId: 'taxregistration',
							fieldId: 'address',
							line: w
						}));
						taxRecbyAddress.taxValue.push(recordObj.getSublistValue({
							sublistId: 'taxregistration',
							fieldId: 'taxregistrationnumber',
							line: w
						}));
					}

					if (addressBookCnt > 0) {
						for (var t = 0; t < addressBookCnt; t++) {
							var address = '';
							var pincode = '';
							var city = '';
							var state = '';
							var country = '';

							var gstNo = '';
							var placeOfSupply = '';

							var addressSubRecord = recordObj.getSublistSubrecord({
								sublistId: 'addressbook',
								fieldId: 'addressbookaddress',
								line: t
							});

							var internalId = recordObj.getSublistValue({
								sublistId: 'addressbook',
								fieldId: 'id',
								line: t
							});

							var addressId = addressSubRecord.getValue({
								fieldId: 'id'
							});
							//log.debug({title:'placeOfSupply',details:placeOfSupply});

							var load_placeofsupply = record.load({
								type: 'customlist',
								id: 405,
								isDynamic: false,
							});
							var stateListCount = load_placeofsupply.getLineCount({
								sublistId: 'customvalue'
							})

							var data = {};
							for (var pp = 0; pp < stateListCount; pp++) {

								var value = load_placeofsupply.getSublistValue({
									sublistId: 'customvalue',
									line: pp,
									fieldId: 'value'
								});
								value = value.toString();
								value = value.split('-')[1]
								var valueid = load_placeofsupply.getSublistValue({
									sublistId: 'customvalue',
									line: pp,
									fieldId: 'valueid'
								})
								data[value] = valueid
							}
							var id_placeofsupply = load_placeofsupply.getValue({
								fieldId: 'valueid'
							}); //internalid of placeofsupply
							log.debug({
								title: 'id_placeofsupply',
								details: id_placeofsupply
							});
							var placeofsupplyJson = addressId;

							for (var tx in taxRecbyAddress.addressId) {
								//log.debug('taxRecbyAddress.addressId[tx] '+taxRecbyAddress.addressId[tx],internalId);
								if (taxRecbyAddress.addressId[tx] == internalId) {
									gstNo = taxRecbyAddress.taxValue[tx];
								}
							}

							address = addressSubRecord.getValue({
								fieldId: 'addrtext'
							});
							pincode = addressSubRecord.getValue({
								fieldId: 'zip'
							});
							city = addressSubRecord.getValue({
								fieldId: 'city'
							});
							state = addressSubRecord.getValue({
								fieldId: 'state'
							});
							country = addressSubRecord.getText({
								fieldId: 'country'
							});
							placeOfSupply = addressSubRecord.getValue({
								fieldId: 'state'
							});
							//var tempPlaceOfSupply=placeOfSupply.split("-");
							//	log.debug(tempPlaceOfSupply,tempPlaceOfSupply[0]);
							//	log.debug(state,state);

							var obj_placeofSupply = placeofsupplyJson.indexOf(placeOfSupply);
							log.debug({
								title: 'obj_placeofSupply',
								details: obj_placeofSupply
							});

							log.debug({
								title: 'data JSON',
								details: JSON.stringify(data)
							});
							log.debug({
								title: 'placeOfSupply',
								details: placeOfSupply
							});
							if (country == 'India') {
								state = searchState(state);
							}
							if (country != 'India')
								obj_placeofSupply = 39;
							else
								obj_placeofSupply = data[state];

							log.debug({
								title: 'obj_placeofSupply',
								details: obj_placeofSupply
							});

							//else

							//obj_placeofSupply = searchStateId(state)

							log.debug('Place of supplier', obj_placeofSupply)
							var addressJson = {
								"addressid": internalId,
								"address": address,
								"pincode": pincode,
								"city": city,
								"state": state,
								"country": country,
								"gstno": gstNo,
								"placeofsupply": obj_placeofSupply

							}
							vendorAddressArray.push(addressJson);
						}
					}

					var vendorJson = {
						"supplierid": supplierId,
						"status": finalVendorStatus,
						"subsidiary": subsidiaryArray,
						"suppliername": supplierName,
						"addresses": vendorAddressArray,
						"email": email,
						"phoneno": phoneNo,
						"poexpiryduration": poExpirationDate,
						"creditperiod": creditPeriodInDays,
						"panno": panNo,
						"accountnumber": accountNumber,
						"accountholdername": accountHolderName,
						"bankname": bankName,
						"branchname": branchName,
						"ifsccode": ifscCode,
						"secondaryemailid": secondaryEmail,
						"nsinternalid": internalIdAd,
						"paymentterms": pamentTermArray,
						"netterms": tempObject

					};
					log.debug({
						title: 'Vendor JSON',
						details: JSON.stringify(vendorJson)
					});

					var response = http.post({
						url: tokenURL,
						body: vendorJson
					});

					if (response.code == '200') {
						var responseJson = JSON.parse(response.body);
						var tokenForVendor = responseJson.access_token;

						var requestHeader = {
							"User-Agent-x": "SuiteScript-Call",
							"Authorization": tokenForVendor,
							"Content-Type": "application/x-www-form-urlencoded"
						};
						var VendorResponse = http.post({
							url: vendorURL,
							body: JSON.stringify(vendorJson),
							headers: requestHeader
						});
						log.audit({
							title: 'Integration Status final',
							details: VendorResponse.code
						});
						log.audit({
							title: 'Response body',
							details: VendorResponse.body
						});

						if (VendorResponse.code == '200') {
							recordObj.setValue({
								fieldId: 'custentity_mhl_integration_status',
								value: '2'
							});
							recordObj.setValue({
								fieldId: 'custentity_error_reason',
								value: ''
							});
							recordObj.save({
								enableSourcing: true,
								ignoreMandatoryFields: true
							});

						} else {
							recordObj.setValue({
								fieldId: 'custentity_mhl_integration_status',
								value: '3'
							});
							recordObj.setValue({
								fieldId: 'custentity_error_reason',
								value: VendorResponse.code + '  ' + VendorResponse.body
							});
							recordObj.save({
								enableSourcing: true,
								ignoreMandatoryFields: true
							});
						}
					} else {
						log.debug({
							title: 'Access Token issue',
							details: response.code
						});
						recordObj.setValue({
							fieldId: 'custentity_mhl_integration_status',
							value: '3'
						});
						recordObj.setValue({
							fieldId: 'custentity_error_reason',
							value: VendorResponse.code + '  ' + VendorResponse.body
						});
						recordObj.save({
							enableSourcing: true,
							ignoreMandatoryFields: true
						});
					}
				}

			} catch (e) {
				log.debug({
					title: 'Error occured while sending Vendor to Stockone',
					details: e
				});
				recordObj.setValue({
					fieldId: 'custentity_mhl_integration_status',
					value: '3'
				});
				recordObj.setValue({
					fieldId: 'custentity_error_reason',
					value: JSON.stringify(e)
				});
				recordObj.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
			}

		}

		/**
		 * Executes when the reduce entry point is triggered and applies to each group.
		 *
		 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
		 * @since 2015.1
		 */
		function reduce(context) {

		}

		function searchStateId(stateCode) {
			stateCode = stateCode.toString();
			try {

				var rateSearch = search.create({
					type: 'state',
					columns: ['internalid'],
					filters: ['shortname', 'startswith', stateCode]
				});

				var searchResult = rateSearch.run().getRange({
					start: 0,
					end: 1
				});

				//log.debug('details',searchResult[0].getValue({name:'fullname'}));

				if (searchResult.length > 0) {
					return searchResult[0].getValue({
						name: 'internalid'
					});
				}

			} catch (e) {
				//log.debug({title:'error in price search',details:e});
			}
			return stateCode;
		}

		function searchState(stateCode) {
			stateCode = stateCode.toString();
			try {

				var rateSearch = search.create({
					type: 'state',
					columns: ['fullname'],
					filters: ['shortname', 'startswith', stateCode]
				});

				var searchResult = rateSearch.run().getRange({
					start: 0,
					end: 1
				});

				//log.debug('details',searchResult[0].getValue({name:'fullname'}));

				if (searchResult.length > 0) {
					return searchResult[0].getValue({
						name: 'fullname'
					});
				}

			} catch (e) {
				//log.debug({title:'error in price search',details:e});
			}
			return stateCode;
		}

		/**
		 * Executes when the summarize entry point is triggered and applies to the result set.
		 *
		 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
		 * @since 2015.1
		 */
		function summarize(summary) {
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
		}

		return {
			getInputData: getInputData,
			map: map,
			summarize: summarize
		};

	});