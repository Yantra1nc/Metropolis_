/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 *  Script Name: MAP_MHL_SisterLab Inter Intra B2B Inv.js
	* Author: Ganesh Sapkale
	* Date: 2nd May 2022
	* Description:1] This script will create the inter intra transactions.              
	* Script Modification Log:
	-- Date --	-- Modified By --	--Requested By--	-- Description --
 */
define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib','N/task'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function (file, format, record, search, runtime, mhllib,task) {

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
                log.debug('Get input Data Stage', deploymentId);				
				var a_search_results ;
				var o_search_results = [] ;
				var custDetails = search.load({
					id: 'customsearch_mhl_b2b_sislab_cost_vids_cu'
				});
					
				var o_b2b_vid_detailsSearchObj = [];
				custDetails.run().each(function(result) {
					
					var clientNameId = result.getValue({
						name: "custrecord_clientname",
						summary: "GROUP",
						label: "Client Name"
					});
					var clientNameText = result.getText({
						name: "custrecord_clientname",
						summary: "GROUP",
						label: "Client Name"
					});

					log.debug("clientNameId",clientNameId+" | "+clientNameText);
					
					var a_filters = new Array();

                    var a_columns = new Array();
                    a_columns.push(search.createColumn({
                        name: 'internalid'
                    }));

                    var a_filters = new Array();
                    
                    if (clientNameId) {
                       var tr_filter = [];
                        tr_filter.push(
                            search.createFilter({
                                name: 'custrecord_clientname',
                                operator: search.Operator.ANYOF,
                                values: clientNameId
                            }));
                       
                        var o_SisterLabCostBookingSearchObj = search.load({
							id: 'customsearch_mhl_b2b_sis_lab_cost_vids_2'
						});
                        //log.debug('o_SisterLabCostBookingSearchObj', o_SisterLabCostBookingSearchObj);
                    }
                  
                    if ((tr_filter)) {
                        for (var i = 0; i < tr_filter.length; i++) {
                            o_SisterLabCostBookingSearchObj.filters.push(tr_filter[i]);
                            //log.debug('tr_filter', tr_filter[i]);
                        }
                    }
                   
                    var a_search_results = o_SisterLabCostBookingSearchObj.run().getRange({
                        start: 0,
                        end: 1000
                    });
                  
					var completeResultSet = a_search_results;
                    var start = 1000;
                    var last = 2000;

                    while (a_search_results.length == 1000) {
                        a_search_results = o_SisterLabCostBookingSearchObj.run().getRange(start, last);
                        completeResultSet = completeResultSet.concat(a_search_results);
                        start = parseFloat(start) + 1000;
                        last = parseFloat(last) + 1000;

                        log.debug("getInputData Call","start "+start)
                    }
                    a_search_results = completeResultSet;
                    
					o_search_results.push(a_search_results)
					
					//return true;
					
				});
				
				log.debug("o_search_results",JSON.stringify(o_search_results[0]))
				
				return o_search_results[0];

            } catch (e) {
                log.error({
                    title: 'Error Occured while collecting transaction',
                    details: e
                });
            }
        } //End Input stage
		
		
		function map(context)
		{
			try
			{
				//log.debug("MAP context",context.value)
				log.debug("MAP Key",context.key)
				
				context.write({
					key: context.key,
					value: context.value
				});
			}
			catch(e)
			{
				log.error("Map Error",e)
			}
		}

        function reduce(context) {
            try {

				var recordId = context.key;
				log.debug("Reduce context ",context.values[0]);
				
                //return '';
                var scriptObj = runtime.getCurrentScript();

                var sisterLabItem = scriptObj.getParameter({
                    name: 'custscript_map_sister_lab_item_b2b'
                }); 
                log.debug('sisterLabItem', sisterLabItem);

                var sisterLabSegInter = scriptObj.getParameter({
                    name: 'custscript_map_sister_lab_seg_inter_b2b'
                }); 

                var sisterLabSegIntra = scriptObj.getParameter({
                    name: 'custscript_map_sister_lab_seg_intra_b2b'
                }); 

                var debitAcc = scriptObj.getParameter({
                    name: 'custscript_map_debit_acc_b2b'
                }); 
				
                var creditAcc = scriptObj.getParameter({
                    name: 'custscript_map_credit_acc_b2b'
                }); 

                var revenueAcc = scriptObj.getParameter({
                    name: 'custscript_map_revenue_acc_b2b'
                }); 

                var arDebitAcc = scriptObj.getParameter({
                    name: 'custscript_map_debit_ar_tds_b2b'
                });
                var apDebitAcc = scriptObj.getParameter({
                    name: 'custscript_map_debit_ap_tds'
                }); 

                var arCreditAcc = scriptObj.getParameter({
                    name: 'custscript_map_credit_ar_tds_b2b'
                }); 
                var apCreditAcc = scriptObj.getParameter({
                    name: 'custscript_map_credit_ap_tds_b2b'
                });
				
                var vendorAcc = scriptObj.getParameter({
                    name: 'custscript_map_vendor_invoice_acc_b2b'
                }); 

                var tdsCode = scriptObj.getParameter({
                    name: 'custscript_map_tds_section_code_b2b'
                }); 

                var tdsRec = record.load({
                    type: 'customrecord_in_tds_setup',
                    id: tdsCode
                });
                var i_tds_section_code = tdsRec.getValue({
                    fieldId: 'custrecord_in_tds_setup_section_code'
                });
                var tempSplit = ((tdsRec.getValue({
                    fieldId: 'custrecord_in_tds_setup_rate'
                })).toString()).split('%');
                var tdsPercentage = Number(tempSplit[0]);
              
                var a_data = JSON.parse(context.values[0]);
				//log.debug("a_data Data",a_data)
			//	return false;
				
			//for(var t in a_data)
			{
				//var s_data = a_data;
				
				//s_data = JSON.stringify(s_data.values); 
				
				// THis code commnented by Ganesh as we are getting records by customer wise. 
				/* var s_data = s_data.replace(/.CUSTRECORD_MHL_B2B_MAIN_VID/g, 'CUSTRECORD_MHL_B2B_MAIN_VID');
				s_data = s_data.replace(/.CUSTRECORD_MHL_TRAN_MAIN_VID/g, 'CUSTRECORD_MHL_TRAN_MAIN_VID');
				s_data = s_data.replace(/.CUSTRECORD_MHL_VID_ORG/g, 'CUSTRECORD_MHL_VID_ORG'); */
				var testData = JSON.stringify(a_data.values);
				var testData = testData.replace(/CUSTRECORD_MHL_B2B_MAIN_VID./g, 'CUSTRECORD_MHL_B2B_MAIN_VID');
				testData = testData.replace(/CUSTRECORD_MHL_TRAN_MAIN_VID./g, 'CUSTRECORD_MHL_TRAN_MAIN_VID');
				testData = testData.replace(/CUSTRECORD_MHL_VID_ORG./g, 'CUSTRECORD_MHL_VID_ORG');
				
				
				//log.audit("testData",testData)
				testData = JSON.parse(testData);
				//log.debug("244",testData.CUSTRECORD_MHL_TRAN_MAIN_VIDlocation)
				//log.debug("247",testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_mhl_vid_org)
				
				if(testData.CUSTRECORD_MHL_TRAN_MAIN_VIDlocation[0])
				{
					//log.debug("250")
					var registerOrg = testData.CUSTRECORD_MHL_TRAN_MAIN_VIDlocation[0].value;	
					var registerOrgText = testData.CUSTRECORD_MHL_TRAN_MAIN_VIDlocation[0].text;	
				}									
				else
				{
					//log.debug("256")
					var registerOrg = testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_mhl_vid_org[0].value;
					var registerOrgText = testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_mhl_vid_org[0].text;
				}
				
			//	log.debug("161",registerOrg)				
				//var registerOrg = testData.values.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_mhl_vid_org.value;				
				// Main VID
				
				if(testData.CUSTRECORD_MHL_TRAN_MAIN_VIDcseg_mhl_custseg_un[0])
					var i_vid_unit = testData.CUSTRECORD_MHL_TRAN_MAIN_VIDcseg_mhl_custseg_un[0].value;
				else
					var i_vid_unit = testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_unit.value;
				
				// Current VID
				var i_process_cent_unit = testData.CUSTRECORD_MHL_VID_ORGcseg_mhl_custseg_un[0].value;
				
				
				//log.debug("i_vid_unit",i_vid_unit)
				log.debug("i_process_cent_unit",i_process_cent_unit)
				var registeredSubsidiaryTxt = '';
				
				if(testData.CUSTRECORD_MHL_TRAN_MAIN_VIDsubsidiarynohierarchy[0])
				{
					var registeredSubsidiary = testData.CUSTRECORD_MHL_TRAN_MAIN_VIDsubsidiarynohierarchy[0].value;
					registeredSubsidiaryTxt = testData.CUSTRECORD_MHL_TRAN_MAIN_VIDsubsidiarynohierarchy[0].text
				}					
				else
				{
					var registeredSubsidiary = testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_subsidiary[0].value;
					registeredSubsidiaryTxt = testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_subsidiary[0].text;
				}
				var processingSubsidiarytxt = testData.custrecord_subsidiary[0].text; 
				var processingSubsidiary = testData.custrecord_subsidiary[0].value; 				
				log.debug("registeredSubsidiary",registeredSubsidiary)
				var currentVidId = '';
				var testWiseInvRecId = recordId = testData.internalid[0].value;
				log.debug("testWiseInvRecId",testWiseInvRecId)
                var costBookingId = '';
                var eliminationId = '';
				
				 var a_inv_account = testData.custrecord_mhl_b2b_csutomer_acc[0].value;
				log.debug("a_inv_account",a_inv_account)
				log.debug("testWiseInvRecId",testWiseInvRecId)
				//CUSTRECORD_MHL_B2B_MAIN_VID //
				if(testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustbody_mhl_sisterlab_parent_id)
					var i_parentOrgId = testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustbody_mhl_sisterlab_parent_id;
				else
					var i_parentOrgId = testData.custrecord_mhl_b2b_parent_id;
				
				
				/* if(testData.values.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_mhl_vid_org != '')
					var processingOrg = testData.values.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_mhl_vid_org.value;
				else 
					var processingOrg = testData.values.CUSTRECORD_MHL_TRAN_MAIN_VIDlocation.value; */
				
				var processingOrg = testData.custrecord_mhl_vid_org[0].value;				
				var processingOrgText = testData.custrecord_mhl_vid_org[0].text;				
				var i_netAmount = testData.custrecord_b2b_vid_amount;
				
				//log.debug("i_netAmount",i_netAmount) ///Net Amount.
				//log.debug("i_parentOrgId",i_parentOrgId);   ////parent org id.
				//log.debug("processingOrg",processingOrg) ////Net Amount.
				
				/* if(testData.values.internalidCUSTRECORD_MHL_TRAN_MAIN_VID.value)
					var currentVidId = testData.values.internalidCUSTRECORD_MHL_TRAN_MAIN_VID.value;
				else
					var currentVidId = testData.values.internalidCUSTRECORD_MHL_B2B_MAIN_VID.value; */
				
				 var i_customer_Id = testData.custrecord_clientname[0].value;
				 var i_customer_Text =  testData.custrecord_clientname[0].text;
				 var i_sis_labVidId =  currentVidId = testData.custrecord_invoice_number[0].value;
				 
				 var s_inv_tran_date = testData.custrecord_vid_date;
                s_inv_tran_date = format.parse({
                    value: s_inv_tran_date,
                    type: format.Type.DATE
                });
				
				var i_elmination_unit = '';
				
				if(testData.CUSTRECORD_MHL_TRAN_MAIN_VIDclass[0])
					var i_vid_SBU = testData.CUSTRECORD_MHL_TRAN_MAIN_VIDclass[0].value;
				else
					var i_vid_SBU = testData.CUSTRECORD_MHL_B2B_MAIN_VIDcustrecord_mhl_vid_sbu[0].value;
               // log.debug('i_vid_SBU', i_vid_SBU);
				var i_process_SBU = '';
				if(testData.custrecord_mhl_vid_sbu)
                var i_process_SBU = testData.custrecord_mhl_vid_sbu[0].value;
				
               // log.debug('i_process_SBU', i_process_SBU);
                if (i_vid_SBU == i_process_SBU) {
                    i_elmination_SBU = i_process_SBU;
                } else {
                    i_elmination_SBU = 3; //Elimination SBU
                }
				//log.debug('i_elmination_SBU', i_elmination_SBU);
				
				var amount = i_netAmount;
				var i_inv_posting_period = '';
				//apCreditAcc = a_inv_account;
				//arCreditAcc = a_inv_account
				creditAcc = a_inv_account;
				//return false;
				if(i_customer_Id)
				{
					//1: Inter, 2: Intra
					log.audit("Inter n Intra "+recordId,processingSubsidiary+" <=> "+registeredSubsidiary)
					if (processingSubsidiary == registeredSubsidiary) // Intra company Transactions
					{
						var interIntra = 2;
						var o_search_location = searchElimination_loc(registeredSubsidiary, processingSubsidiary, interIntra);
						
						if (o_search_location) {
							
							// Cost Booking
							if(i_parentOrgId)
							{
								var locationParentDetails = mhllib.findLocation(i_parentOrgId);
								if (locationParentDetails) {
									var locationId = locationParentDetails.orgInternalId
								}
								
								log.debug("locationId",locationId)
								var costBookingId = costBooking(testWiseInvRecId, registeredSubsidiary, i_customer_Id, locationId, registerOrg, debitAcc, creditAcc, amount, currentVidId, processingOrg, sisterLabSegIntra, s_inv_tran_date, i_inv_posting_period, i_vid_unit, i_process_cent_unit, i_vid_SBU, i_process_SBU);
								log.audit('cost Booking Id', costBookingId);
							}
							else {
								//parent id not present								
								var costBookingId = costBooking(testWiseInvRecId, registeredSubsidiary, i_customer_Id, '', registerOrg, debitAcc, creditAcc, amount, currentVidId, processingOrg, sisterLabSegIntra, s_inv_tran_date, i_inv_posting_period, i_vid_unit, i_process_cent_unit, i_vid_SBU, i_process_SBU);
								log.debug('Without Parent Org Id cost Booking Id', costBookingId);								
							}
							if(costBookingId)
							{
								var paymentId = paymentApply(testWiseInvRecId, currentVidId, costBookingId, processingOrg, s_inv_tran_date, i_inv_posting_period, amount);
								log.debug("paymentId",paymentId)
							}
							
							// elimination Entry - Start							
							var eliminationLocation = o_search_location[0].getValue('custrecord_mhl_elimination_location');
							if(eliminationLocation)
							{
								var eliminationId = eliminationBooking(testWiseInvRecId, registeredSubsidiary, sisterLabSegIntra, eliminationLocation, revenueAcc, debitAcc, amount, currentVidId, registerOrg, processingOrg, s_inv_tran_date, i_inv_posting_period, i_elmination_unit, i_elmination_SBU);
								log.audit('Elimination Booking Id', eliminationId);		
							}
							else {
								var id = record.submitFields({
									type: 'customrecord_b2b_vid_details',
									id: testWiseInvRecId,
									values: {
										custrecord_mhl_b2b_cost_error: 'Elimination Location Not Found for Register Subsidiary | ' + registeredSubsidiaryTxt + ' | Processing Subsidiary | ' + processingSubsidiarytxt
									},
									options: {
										enableSourcing: true,
										ignoreMandatoryFields: true
									}
								});
							}
						}
						else
						{
							var error = 'Elimination Location Not Found for Register Subsidiary | ' + registeredSubsidiaryTxt + ' | Processing Subsidiary | ' + processingSubsidiarytxt;
							
							log.debug("Elimination error",error);
							var id = record.submitFields({
								type: 'customrecord_b2b_vid_details',
								id: testWiseInvRecId,
								values: {
								   custrecord_mhl_b2b_cost_error : error	
								},
								options: {
									enableSourcing: true,
									ignoreMandatoryFields: true
								}
							});
						}
						
						if(eliminationId && costBookingId)
						{
							record.submitFields({
								type: 'customrecord_b2b_vid_details',
								id: testWiseInvRecId,
								values: {
									custrecord_b2b_processed_inter_intra: 'T',
									custrecord_b2b_elimination_entry: eliminationId,
									custrecord_b2b_cost_boking_entry: costBookingId
									
								},
								options: {
									enableSourcing: true,
									ignoreMandatoryFields: true
								}
							});
						}
						else
						{
							 if (costBookingId) {
								record.delete({
									type: 'customtransaction_mhl_intra_costbkg',
									id: costBookingId,
								});
							}
							
							if (eliminationId) {								
								record.delete({
									type: 'customtransaction_mhl_interintra_elimina',
									id: eliminationId,
								});
							}
						}
					}
					else
					{
						//1: Inter company transctions 
						var interIntra = 1;						
						var o_processingSubsidiaryObj = search.lookupFields({
							type: 'subsidiary',
							id: processingSubsidiary,
							columns: ['custrecord_tds_not_applicable']
						});
										
						var o_registeredSubsidiaryObj = search.lookupFields({
							type: 'subsidiary',
							id: registeredSubsidiary,
							columns: ['custrecord_tds_not_applicable']
						});		
						
						var f_registerdAppl = o_registeredSubsidiaryObj.custrecord_tds_not_applicable;
						var f_processingAppl = o_processingSubsidiaryObj.custrecord_tds_not_applicable;
						
						//log.audit(" inter "+testWiseInvRecId,"f_registerdAppl "+f_registerdAppl+" | f_processingAppl "+f_processingAppl);
						
						var customerDetails = searchCustomer(registerOrg, processingOrg, interIntra, i_customer_Id);
						
						if(customerDetails)
						{
							var vendorId = customerDetails[0].getValue('custrecord_interco_vendor');
							//log.debug("vendorId",vendorId)
							if(vendorId) 
							{
								var tdsAmount = Number(amount);
								tdsAmount = (tdsPercentage / 100) * tdsAmount;
							
								if(f_processingAppl == false)
								{
									var vendorBillId = createVendorInv(testWiseInvRecId, vendorId, vendorAcc, amount, registerOrg, sisterLabSegInter, currentVidId, s_inv_tran_date, i_inv_posting_period, i_vid_unit, i_vid_SBU);
									
									//	var arTDS = false;
									//  log.audit("TDS will Create",testWiseInvRecId)
									
									if(Number(vendorBillId))
									{
										var arTDS = tdsEntryBook(testWiseInvRecId, tdsAmount, processingSubsidiary, i_customer_Id, arDebitAcc, arCreditAcc, processingOrg, sisterLabSegInter, currentVidId, s_inv_tran_date, i_inv_posting_period, i_tds_section_code, i_process_cent_unit, i_process_SBU);
										log.audit('arTDS Booking Id', arTDS); 
										
										var tdsAmount = Number(amount);
										tdsAmount = (tdsPercentage / 100) * tdsAmount;
									
									
										// -- 10/10/2022 - Commentted by Sunil Khutwad for the merger Suggested by Ashok sir
												
										/* var apTDS = tdsEntryBook(testWiseInvRecId, tdsAmount, registeredSubsidiary, vendorId, apDebitAcc, apCreditAcc, registerOrg, sisterLabSegInter, currentVidId, s_inv_tran_date, i_inv_posting_period, i_tds_section_code, i_vid_unit, i_vid_SBU);
										log.debug('apTDS Booking Id', apTDS); */
										
										//if(Number(apTDS) && Number(arTDS))
										
										if(Number(arTDS))
										{
											//log.audit(testWiseInvRecId,apTDS+" <> "+arTDS)
											
											log.audit(testWiseInvRecId+" <TDS will Create> "+arTDS)
											record.submitFields({
												type: 'customrecord_b2b_vid_details',
												id: Number(testWiseInvRecId),
												values: {
													custrecord_b2b_processed_inter_intra: 'T',
													custrecord_b2b_vendor_bill: vendorBillId,
													//custrecord_b2b_ap_tds: apTDS,
													custrecord_b2b_ar_tds: arTDS												
												},
												options: {
													enableSourcing: true,
													ignoreMandatoryFields: true
												}
											});
										}
										else
										{
											if (arTDS) {
												record.delete({
													type: 'customtransaction_mhl_intercotdsentry',
													id: arTDS,
												});
											}
											/* if (apTDS) {
												record.delete({
													type: 'customtransaction_mhl_intercotdsentry',
													id: apTDS,
												});
											} */
										}
									}
									else
									{
										log.error("Vendor Creation Error on VID "+testWiseInvRecId,vendorBillId)
									}
								}//(f_registerdAppl == false && f_processingAppl == false)
								/* else
								{
									record.submitFields({
											type: 'customrecord_b2b_vid_details',
											id: Number(testWiseInvRecId),
											values: {
												custrecord_b2b_processed_inter_intra: 'T',
												custrecord_b2b_vendor_bill: vendorBillId
											},
											options: {
												enableSourcing: true,
												ignoreMandatoryFields: true
											}
										});
								} */
							}//(vendorId)
							else {
								var id = record.submitFields({
									type: 'customrecord_b2b_vid_details',
									id: testWiseInvRecId,
									values: {
									   custrecord_mhl_b2b_cost_error : 'Vendor not found for Customer | '+i_customer_Text +" | Register Org | "+registerOrgText+" | Parent Org "+processingOrgText+" | for interIntra | "+interIntra	
									},
									options: {
										enableSourcing: true,
										ignoreMandatoryFields: true
									}
								});
							}
						}//(customerDetails)
						else {
							var id = record.submitFields({
								type: 'customrecord_b2b_vid_details',
								id: testWiseInvRecId,
								values: {
								   custrecord_mhl_b2b_cost_error : 'Vendor not found for Customer | '+i_customer_Text +" | Register Org | "+registerOrgText+" | Parent Org "+processingOrgText+" | for interIntra | "+interIntra	
								},
								options: {
									enableSourcing: true,
									ignoreMandatoryFields: true
								}
							});
						}
					}
				}
				
				context.write({
					key: testWiseInvRecId,
					value: testData
				});
			}
			} //End Try
            catch (ex) {
                log.error({
                    title: 'Reduce: error in creating records',
                    details: ex
                });
            }
        } //End MAP Stage

        function searchCustomer(registerLoc, processingLoc, interIntra, i_customer_Id) {

            var customerSearch = search.create({
                type: 'customrecord_mhl_inter_intra_co_mapping',
                columns: ['custrecord_inter_intra_type', 'custrecord_interco_vendor', 'custrecord_mhl_im_processing_customer',
				'custrecord_registered_subsidiary', 'custrecord_processing_subsidiary', 'custrecord_mhl_elimination_location'],
                filters: [['custrecord_mhl_im_registration_location', 'anyOf', registerLoc], 'AND', ['custrecord_mhl_im_processing_location', 'anyOf', processingLoc], 'AND', ['custrecord_inter_intra_type', 'anyOf', interIntra], 'AND', ['custrecord_mhl_im_processing_customer', 'anyOf', i_customer_Id]]

            });

            var searchResult = customerSearch.run().getRange({
                start: 0,
                end: 1
            });
            //log.debug({title:'searchResult 124',details:searchResult});

            if (searchResult.length > 0) {

                return searchResult;
            }
            return '';

        }

        function searchElimination_loc(registeredSubsidiary, processingSubsidiary, interIntra) {
            var customerSearch = search.create({
                type: 'customrecord_mhl_inter_intra_co_mapping',
                columns: ['custrecord_inter_intra_type', 'custrecord_interco_vendor', 'custrecord_mhl_im_processing_customer',
			'custrecord_registered_subsidiary', 'custrecord_processing_subsidiary', 'custrecord_mhl_elimination_location'],
                filters: [['custrecord_registered_subsidiary', 'anyOf', registeredSubsidiary], 'AND', ['custrecord_processing_subsidiary', 'anyOf', processingSubsidiary], 'AND', ['custrecord_inter_intra_type', 'anyOf', interIntra]]

            });

            var searchResult = customerSearch.run().getRange({
                start: 0,
                end: 1
            });
            //log.debug({title:'searchResult 124',details:searchResult});

            if (searchResult.length > 0) {

                return searchResult;
            }
            return '';
        }

        function costBooking(testWiseInvRecId, subsidiary, intraCoCustomer, parentIdLoc, registeredLoc, debitAcc, creditAcc, amount, vidId, processingLoc, segment, s_inv_tran_date, i_inv_posting_period, i_vid_unit, i_process_cent_unit, i_vid_SBU, i_process_SBU) {
            try {
				var dataArray = [];
				dataArray = {
					testWiseInvRecId:testWiseInvRecId, 
					subsidiary:subsidiary,
					intraCoCustomer:intraCoCustomer, 
					parentIdLoc:parentIdLoc, 
					registeredLoc:registeredLoc, 
					debitAcc:debitAcc, 
					creditAcc:creditAcc, 
					amount:amount,
					vidId:vidId, 
					processingLoc:processingLoc, 
					segment:segment, 
					s_inv_tran_date:s_inv_tran_date, 
					i_inv_posting_period:i_inv_posting_period, 
					i_vid_unit:i_vid_unit, 
					i_process_cent_unit:i_process_cent_unit, 
					i_vid_SBU:i_vid_SBU, 
					i_process_SBU:i_process_SBU
					}
					
					amount = parseFloat(amount)
			log.debug("costBooking | datalist",JSON.stringify(dataArray))
                var costRecord = record.create({
                    type: 'customtransaction_mhl_intra_costbkg',
                    isDynamic: true
                });
                log.debug("after parentIdLoc", parentIdLoc);
                costRecord.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiary
                });
				
				costRecord.setValue({
                    fieldId: 'custbody_mhl_tds_b2b_vid',
                    value: testWiseInvRecId
                });
                costRecord.setValue({
                    fieldId: 'custbody_mhl_vid_ref_inter_intra_sale',
                    value: vidId
                });
                costRecord.setValue({
                    fieldId: 'trandate',
                    value: s_inv_tran_date
                });
             
                log.debug('costBooking amount', amount);
                // Debit entry		
                costRecord.selectNewLine({
                    sublistId: 'line'
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: debitAcc
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: amount
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: intraCoCustomer
                });
                if (parentIdLoc) {
                    costRecord.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'location',
                        value: parentIdLoc
                    });
                } else {
                    costRecord.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'location',
                        value: registeredLoc
                    });
                }
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: segment
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: i_vid_SBU
                });
             /*    costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_mhl_custseg_un',
                    value: i_vid_unit
                }); */

                costRecord.commitLine({
                    sublistId: 'line'
                });

                // Credit Entry

                costRecord.selectNewLine({
                    sublistId: 'line'
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: creditAcc
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: amount
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: intraCoCustomer
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'location',
                    value: processingLoc
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: segment
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: i_process_SBU
                });
                costRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_mhl_custseg_un',
                    value: i_process_cent_unit
                });

                costRecord.commitLine({
                    sublistId: 'line'
                });
                //CR@ 3 Nov 2020
                costRecord.setValue({
                    fieldId: 'custbody_mhl_inter_co_auto_transaction',
                    value: true
                });

                var costBookId = costRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                return costBookId;
            } catch (e) {
                log.error('Error in Cost Booking ' + testWiseInvRecId, e);
                record.submitFields({
                    type: 'customrecord_b2b_vid_details',
                    id: testWiseInvRecId,
                    values: {
                        custrecord_mhl_b2b_cost_error: 'Error in Cost Booking: ' + e.message
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });
                return e.message;
            }
        } //End costBooking

        function paymentApply(testWiseInvRecId, invoiceId, costBookingId, processingOrg, s_inv_tran_date, i_inv_posting_period, amount) {
            try {
                var paymentObj = record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: Number(invoiceId),
                    toType: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });

                var flag = 0;
                paymentObj.setValue({
                    fieldId: 'trandate',
                    value: s_inv_tran_date
                });
              /*   paymentObj.setValue({
                    fieldId: 'postingperiod',
                    value: i_inv_posting_period
                }); */
                paymentObj.setValue({
                    fieldId: 'location',
                    value: processingOrg
                });

                var i_line_inv = paymentObj.findSublistLineWithValue({
                    sublistId: 'apply',
                    fieldId: 'internalid',
                    value: Number(invoiceId)
                });
                log.debug('payment i_line_inv', i_line_inv);
				// paymentObj.setValue({fieldId:'apply_Transaction_TRANDATE',value:s_inv_tran_date});
                var i_applyCount = paymentObj.getLineCount({
                    sublistId: 'apply'
                });
                for (var inv = 0; inv < i_applyCount; inv++) {
                    paymentObj.selectLine({
                        sublistId: 'apply',
                        line: inv
                    });
                    var i_applyInvId = paymentObj.getCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid'
                    });
                    //log.debug('payment i_applyInvId',);
                    if (i_applyInvId == invoiceId) {
                        log.debug('payment match', 'match ' + i_applyInvId);
                        paymentObj.setCurrentSublistValue({sublistId: 'apply',fieldId: 'apply',value: true});
                        paymentObj.setCurrentSublistValue({sublistId: 'apply',fieldId: 'amount',value: Number(amount)});

                        paymentObj.commitLine({
                            sublistId: 'apply'
                        });
                        break;
                    }
                }             

                var creditCount = paymentObj.getLineCount({
                    sublistId: 'credit'
                });

                for (var t = 0; t < creditCount; t++) {
                    paymentObj.selectLine({
                        sublistId: 'credit',
                        line: t
                    });
                    var costId = paymentObj.getCurrentSublistValue({
                        sublistId: 'credit',
                        fieldId: 'internalid'
                    });
                    //log.debug('payment-->costId',costId);
                    //log.debug('payment-->costBookingId',costBookingId);
                    if (costId == costBookingId) {
                        //log.debug('payment-->costId',costId);
                        //log.debug('payment-->costBookingId',costBookingId);

                        paymentObj.setCurrentSublistValue({
                            sublistId: 'credit',
                            fieldId: 'apply',
                            value: true
                        });

                        paymentObj.commitLine({
                            sublistId: 'credit'
                        });
                        flag = 1;
                    }
                }
                if (flag == 1) {
                    //CR@ 3 Nov 2020
                    paymentObj.setValue({
                        fieldId: 'custbody_mhl_inter_co_auto_transaction',
                        value: true
                    });
                    var f_payment_amount = paymentObj.getValue({
                        fieldId: 'payment'
                    });
                    //log.debug('2 f_payment_amount',f_payment_amount)
                    var paymentId = paymentObj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    //log.audit('Credit Applied to Payment', paymentId);
                    return paymentId;
                } else {
                    log.debug('apply payment', 'Credit Not found');
                    record.submitFields({
							type : 'customrecord_b2b_vid_details',
							id : testWiseInvRecId,
							values : {
								custrecord_mhl_b2b_cost_error : 'Applying payment Credit Not found. Apply Count is '+creditCount											
							},
							options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
							}
						}); 
                    return 'Credit Not found';
                }

            } catch (e) {
                log.error('On Payment creation Error occured ' + testWiseInvRecId, e);
                record.submitFields({
                    type: 'customrecord_b2b_vid_details',
                    id: testWiseInvRecId,
                    values: {
                        custrecord_mhl_b2b_cost_error: 'On Payment creation Error occured: ' + e.message
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });
                return e.message;
            }
        } // End paymentApply

        /// ////////////////////////Elimination Booking Entry ///////////////////////////////////

        function eliminationBooking(testWiseInvRecId, subsidiary, department, eliminationLoc, debitAcc, creditAcc, amount, vidId, registerLoc, processingLoc, s_inv_tran_date, i_inv_posting_period, i_elmination_unit, i_elmination_SBU) {
            try {

                var elimination = record.create({
                    type: 'customtransaction_mhl_interintra_elimina',
                    isDynamic: true
                });

                elimination.setValue({
                    fieldId: 'trandate',
                    value: s_inv_tran_date
                });
				
				elimination.setValue({
                    fieldId: 'custbody_mhl_tds_b2b_vid',
                    value: testWiseInvRecId
                });

                /* elimination.setValue({
                    fieldId: 'postingperiod',
                    value: i_inv_posting_period
                }); */
                elimination.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiary
                });
                elimination.setValue({
                    fieldId: 'location',
                    value: eliminationLoc
                });
                elimination.setValue({
                    fieldId: 'department',
                    value: department
                }); // Sister Lab revenue segment

                elimination.setValue({
                    fieldId: 'custbody_mhl_vid_ref_inter_intra_sale',
                    value: vidId
                });

                // Debit entry
                elimination.selectNewLine({
                    sublistId: 'line'
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: debitAcc
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: amount
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'location',
                    value: eliminationLoc
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: department
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: i_elmination_SBU
                });
               /*  elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_mhl_custseg_un',
                    value: i_elmination_unit
                }); */

                elimination.commitLine({
                    sublistId: 'line'
                });

                // Credit Entry

                elimination.selectNewLine({
                    sublistId: 'line'
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: creditAcc
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: amount
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'location',
                    value: eliminationLoc
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: department
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: i_elmination_SBU
                });
                elimination.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_mhl_custseg_un',
                    value: i_elmination_unit
                });

                elimination.commitLine({
                    sublistId: 'line'
                });
                //CR@ 3 Nov 2020
                elimination.setValue({
                    fieldId: 'custbody_mhl_inter_co_auto_transaction',
                    value: true
                });
                var eliminationId = elimination.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                //log.audit('elimination Booking Entry Created', eliminationId);
                return eliminationId;
            } catch (e) {
                log.error('Elimination Booking Entry Error ' + testWiseInvRecId, e);
                record.submitFields({
                    type: 'customrecord_b2b_vid_details',
                    id: testWiseInvRecId,
                    values: {
                        custrecord_mhl_b2b_cost_error: 'Elimination Booking Entry Error: ' + e.message
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });

                return e.message;
            }
        }

        function tdsEntryBook(testWiseInvRecId, amount, subsidiary, entityId, debitAcc, creditAcc, org, segment, vidId, s_inv_tran_date, i_inv_posting_period, i_tds_section_code, i_process_cent_unit, i_process_SBU) {
            try {
               

				log.audit("tdsEntryBook "+testWiseInvRecId,"entityId "+entityId)
                

                var tdsEntry = record.create({
                    type: 'customtransaction_mhl_intercotdsentry',
                    isDynamic: true
                });

                tdsEntry.setValue({
                    fieldId: 'trandate',
                    value: s_inv_tran_date
                }); 

				tdsEntry.setValue({
                    fieldId: 'custbody_mhl_tds_b2b_vid',
                    value: testWiseInvRecId
                });

                /* tdsEntry.setValue({
                    fieldId: 'postingperiod',
                    value: i_inv_posting_period
                }); */
                //tdsEntry.setValue({fieldId: 'custbody_mhl_tds_period',value:112});			

                tdsEntry.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiary
                });

                // Debit entry
                tdsEntry.selectNewLine({
                    sublistId: 'line'
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: debitAcc
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: parseFloat(amount).toFixed(2)
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: entityId
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'location',
                    value: org
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: segment
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: i_process_SBU
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_mhl_custseg_un',
                    value: i_process_cent_unit
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_in_scode_tds',
                    value: i_tds_section_code
                });

                tdsEntry.commitLine({
                    sublistId: 'line'
                });

                // Credit Entry

                tdsEntry.selectNewLine({
                    sublistId: 'line'
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: creditAcc
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: parseFloat(amount).toFixed(2)
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: entityId
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'location',
                    value: org
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: segment
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: i_process_SBU
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_mhl_custseg_un',
                    value: i_process_cent_unit
                });
                tdsEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_in_scode_tds',
                    value: i_tds_section_code
                });

                tdsEntry.commitLine({
                    sublistId: 'line'
                });

                tdsEntry.setValue({
                    fieldId: 'custbody_mhl_vid_ref_inter_intra_sale',
                    value: vidId
                });
                //CR@ 3 Nov 2020
                tdsEntry.setValue({
                    fieldId: 'custbody_mhl_inter_co_auto_transaction',
                    value: true
                });

                var tdsEntryId = tdsEntry.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.audit('TDS Entry', tdsEntryId);
                return tdsEntryId;

            } catch (e) {
                log.error('Error in TDS Entry ' + testWiseInvRecId, e);
                record.submitFields({
                    type: 'customrecord_b2b_vid_details',
                    id: testWiseInvRecId,
                    values: {
                        custrecord_mhl_b2b_cost_error: 'Error in TDS Entry: ' + e.message
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });
                return e.message;
            }
        }

        function createVendorInv(testWiseInvRecId, vendorId, account, amount, org, sisterLabSegInter, vidId, s_inv_tran_date, i_inv_posting_period, i_vid_unit, i_vid_SBU) {
            try {
                //var orgDetailsArray=nlapiLookupField('location',org,['custrecord_mhl_ref_sbu','cseg_mhl_custseg_un'],false);
                //var sbu=orgDetailsArray['custrecord_mhl_ref_sbu'];
                //var unit=orgDetailsArray['cseg_mhl_custseg_un'];
				
				var dataArray = [];
				dataArray = {
					testWiseInvRecId:testWiseInvRecId, 
					vendorId:vendorId,
					account:account, 
					org:org, 
					sisterLabSegInter:sisterLabSegInter, 				
					amount:amount,
					vidId:vidId, 
					s_inv_tran_date:s_inv_tran_date, 
					i_inv_posting_period:i_inv_posting_period, 
					i_vid_unit:i_vid_unit, 
					i_vid_SBU:i_vid_SBU
					}
			//log.audit("createVendorInv | datalist",JSON.stringify(dataArray))
				
                //i_vid_unit,i_vid_SBU
                var vendorBill = record.create({
                    type: record.Type.VENDOR_BILL,
                    isDynamic: true
                });
                vendorBill.setValue({
                    fieldId: 'entity',
                    value: vendorId
                });

                vendorBill.setValue({
                    fieldId: 'customform',
                    value: 203
                });

                vendorBill.setValue({
                    fieldId: 'trandate',
                    value: s_inv_tran_date
                });
              /*   vendorBill.setValue({
                    fieldId: 'postingperiod',
                    value: i_inv_posting_period
                }); */
                vendorBill.setValue({
                    fieldId: 'location',
                    value: org
                });
                vendorBill.setValue({
                    fieldId: 'department',
                    value: sisterLabSegInter
                });
                vendorBill.setValue({
                    fieldId: 'class',
                    value: i_vid_SBU
                });
                vendorBill.setValue({
                    fieldId: 'cseg_mhl_custseg_un',
                    value: i_vid_unit
                });
                vendorBill.setValue({
                    fieldId: 'approvalstatus',
                    value: 2
                });

                vendorBill.selectNewLine({
                    sublistId: 'expense'
                });
                vendorBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'account',
                    value: account
                });
				
                vendorBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'amount',
                    value: amount
                });
				
                vendorBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'department',
                    value: sisterLabSegInter
                }); // revenue segment
				
                vendorBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'location',
                    value: org
                }); // Org
				
                vendorBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'class',
                    value: i_vid_SBU
                }); // i_vid_SBU
				
                vendorBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'cseg_mhl_custseg_un',
                    value: i_vid_unit
                }); // i_vid_unit
				
                vendorBill.commitLine({
                    sublistId: 'expense'
                });

                vendorBill.setValue({
                    fieldId: 'custbody_mhl_vid_ref_inter_intra_sale',
                    value: vidId
                });

                //CR@ 3 Nov 2020
                vendorBill.setValue({
                    fieldId: 'custbody_mhl_inter_co_auto_transaction',
                    value: true
                });

                //var vendorBillId=nlapiSubmitRecord(vendorBill);

                var vendorBillId = vendorBill.save();

                log.audit('Vendor Bill Booking Entry Created', vendorBillId);
                return vendorBillId;
            } catch (e) {
                log.error('Vendor Bill Booking Entry Error '+testWiseInvRecId , e);
                record.submitFields({
                    type: 'customrecord_b2b_vid_details',
                    id: testWiseInvRecId,
                    values: {
                        custrecord_mhl_b2b_cost_error: 'Vendor Bill Booking Entry Error: ' + e.message
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });
                return e.message;
            }
        }

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
				
				var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;
				if(deploymentId == 'customdeploy3' && mapKeysProcessed > 0 )
				{
					var mrTask = task.create({taskType: task.TaskType.MAP_REDUCE});
					mrTask.scriptId = 'customscript_mhl_b2b_sislab_costbooking';
					mrTask.deploymentId = 'customdeploy3';
					var mrTaskId = mrTask.submit();	
					log.audit("mrTaskId",mrTaskId)
				}
				
                log.audit({
                    title: 'Map key statistics',
                    details: 'Total number of map keys processed successfully: ' + mapKeysProcessed
                });
            } //End Try
            catch (e) {
                log.error({
                    title: 'Error Occured in Summary function',
                    details: e
                });
            }

        } // End Summary function	

        return {
            getInputData: getInputData,
            map: map,
			reduce:reduce,
            summarize: summarize
        };

    });
