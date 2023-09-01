/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL YIL Auto Invoice - AddSublist
 * File Name: MHL_YIL_UE_Add_Sublist_on_invoicing.js
 * Created On: 15/12/2022
 * Modified On: 
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By: 
 * Description: Auto Invoice - AddSublist
 *********************************************************** */


/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */  
define(['N/record', 'N/format', 'N/error', 'N/ui/dialog', "N/file", 'N/ui/serverWidget', 'N/runtime', 'N/search','N/url'],

    function (record, format, error, dialog, file, serverWidget, runtime, search, url) {

        function beforeLoad(scriptContext) {
            try {
                var record = scriptContext.newRecord
                var recordId = record.id
                var recordType = record.type

                log.debug("Rec id -->", recordId);
                log.debug("Rec Type -->", recordType);
				
				var b2b_start_date = record.getValue({fieldId:'custrecord_mhl_b2b_start_date'});
				var b2b_end_date = record.getValue({fieldId:'custrecord_mhl_b2b_end_date'});
				log.debug("b2b_start_date -->", b2b_start_date);
				
				scriptContext.form.addField({
						id: 'custpage_total_so',
						type: serverWidget.FieldType.TEXT,
						label: 'Total Sales Orders'
					});
				
				var d_b2b_start_date = format.format({
						value: new Date(b2b_start_date),
						type: format.Type.DATE
					});
				var d_b2b_end_date =  format.format({
						value: new Date(b2b_end_date),
						type: format.Type.DATE
					})	
				//var d_b2b_end_date = new Date(b2b_end_date);
				log.debug("d_b2b_start_date -->", d_b2b_start_date);
				log.debug("d_b2b_end_date -->", d_b2b_end_date);
				var salesorderSearchObj = search.create({
				   type: "salesorder",
				   filters:
				   [
					  ["type","anyof","SalesOrd"], 					  
					  "AND",  
					  ["mainline","is","T"], 
					  "AND", 
					  ["amount","greaterthan","0.00"], 
					  "AND", 
					  ["startdate","onorafter",d_b2b_start_date], 
					  "AND", 
					  ["enddate","onorbefore",d_b2b_end_date]
				   ],
				   columns:
				   [
					  search.createColumn({name: "internalid",sort: search.Sort.ASC, label: "Internal ID"}),
					  search.createColumn({name: "trandate", label: "Date"}),
					  search.createColumn({name: "custbody_invoice_no", label: "INVOICE NO"}),
					  search.createColumn({name: "amount", label: "Amount"}),
					  search.createColumn({name: "statusref", label: "Status"}),
					  search.createColumn({name: "tranid", label: "Document Number"}),
					  search.createColumn({name: "enddate", label: "End Date"}),
					  search.createColumn({name: "startdate", label: "Start Date"})
				   ]
				});
				var searchResultCount = salesorderSearchObj.runPaged().count;
				log.debug("salesorderSearchObj result count",searchResultCount);
				
				
					
				var a_search_results = salesorderSearchObj.run().getRange({
                        start: 0,
                        end: 1000
                    });
                  
					var completeResultSet = a_search_results;
                    var start = 1000;
                    var last = 2000;

                     while (a_search_results.length == 1000) {
                        a_search_results = salesorderSearchObj.run().getRange(start, last);
                        completeResultSet = completeResultSet.concat(a_search_results);
                        start = parseFloat(start) + 1000;
                        last = parseFloat(last) + 1000;

                        //log.debug("getInputData Call","start "+start)
                    } 
                    a_search_results = completeResultSet;
			
					
				  var sublistObj2 = scriptContext.form.addSublist({
						id: 'custpage_mylist',
						type: serverWidget.SublistType.LIST,
						label: 'Sales Orders '
					});
					sublistObj2.addField({
						id: 'custpage_tranid',
						type: serverWidget.FieldType.TEXT,
						label: 'Docuement Number'
					});
					
					sublistObj2.addField({
						id: 'custpage_invoice_no',
						type: serverWidget.FieldType.TEXT,
						label: 'Consolidated Invoice'
					});
					
					sublistObj2.addField({
						id: 'custpage_statusref',
						type: serverWidget.FieldType.TEXT,
						label: 'Status'
					});
					
					/* sublistObj2.addField({
						id: 'custpage_trandate',
						type: serverWidget.FieldType.TEXT,
						label: 'Date'
					}); */
					
					sublistObj2.addField({
						id: 'custpage_startdate',
						type: serverWidget.FieldType.TEXT,
						label: 'Start Date'
					});
					
					sublistObj2.addField({
						id: 'custpage_enddate',
						type: serverWidget.FieldType.TEXT,
						label: 'End Date'
					});
					sublistObj2.addField({
						id: 'custpage_amount',
						type: serverWidget.FieldType.CURRENCY,
						label: 'Amount'
					});
					 sublistObj2.updateTotallingFieldId({
						id: 'custpage_amount'
					}); 
					
					//log.debug("a_search_results-->",a_search_results);
					var totalPendingBilling = 0 ;
					for(var t = 0; t<a_search_results.length; t++)
					{
						sublistObj2.setSublistValue({
							id: 'custpage_tranid',
							line: t,
							value: a_search_results[t].getValue('tranid')
						});
						
						sublistObj2.setSublistValue({
							id: 'custpage_statusref',
							line: t,
							value: a_search_results[t].getText('statusref')
						});
						
						
						if(a_search_results[t].getText('statusref') == 'Pending Billing' )
							totalPendingBilling++;
						
						sublistObj2.setSublistValue({
							id: 'custpage_invoice_no',
							line: t,
							value: a_search_results[t].getText('custbody_invoice_no')
						});
						
						sublistObj2.setSublistValue({
							id: 'custpage_startdate',
							line: t,
							value: a_search_results[t].getValue('startdate')
						});
						
						sublistObj2.setSublistValue({
							id: 'custpage_enddate',
							line: t,
							value: a_search_results[t].getValue('enddate')
						});
						
						sublistObj2.setSublistValue({
							id: 'custpage_amount',
							line: t,
							value: a_search_results[t].getValue('amount')
						});
						
						/*  sublistObj2.updateTotallingFieldId({
							id: 'custpage_amount'
						});  */
					
					}
					
					record.setValue({ fieldId: 'custrecord_total_open_sales_order',value: totalPendingBilling});
					record.setValue({ fieldId: 'custpage_total_so',value: searchResultCount});
					
						

             	
            } catch (e) {
                log.error("Before Rec Load Err", e);
            }

        }


        return { beforeLoad }
    });