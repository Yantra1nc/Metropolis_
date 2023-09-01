/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL Consolidated Invoice PDF to Freepay
 * File Name: MHL Consolidated Invoice PDF to Freepay.js
 * Created On: 15/07/2020
 * Modified On: 
 * Created By: Onkar Sanjekar
 * Modified By:
 * Description: Consolidated Invoice PDF to Freepay
 *********************************************************** */

define(['N/render', 'N/runtime', 'N/search','N/record','N/https'],
		/**
		 * @param {render} render
		 * @param {runtime} runtime
		 * @param {search} search
		 */
		function(render, runtime, search,record,https) {

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
		try
		{
			return search.load({id:'customsearch_invoice_search_for_pdf'});
		}catch(e)
		{

		}
	}

	/**
	 * Executes when the map entry point is triggered and applies to each key/value pair.
	 *
	 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
	 * @since 2015.1
	 * 
	 * 
	 * 
	 */
	function map(context) {

		try {

			var data = JSON.parse(context.value); //read the data
			var scriptObj = runtime.getCurrentScript();


			var recordInternalId = Number(data.id);

			var recordObj=record.load({type:'customtransaction_mhl_consolidatedinvoic',id:recordInternalId});

			
			var customerForm=search.lookupFields({
				type:'customer',
				id:recordObj.getValue({fieldId:'custbody_mhl_consinv_customer'}),
				columns: ['custentity_consolidated_invoice_print']
			});
			log.debug('customerForm',(customerForm.custentity_consolidated_invoice_print)[0].value);

			var pdfFile=render.transaction({
				entityId: recordInternalId,
				printMode: render.PrintMode.PDF,
				formId:Number((customerForm.custentity_consolidated_invoice_print)[0].value),
				inCustLocale: false
			});

			var pdfString=pdfFile.getContents();
			//log.debug({title:'PDF String',details:pdfString});

			var termRec=record.load({
				type:'term',
				id:recordObj.getValue({fieldId:'custbody_mhl_coninv_netterms'})
			});

			var discount=termRec.getValue({fieldId:'discountpercent'});
			var daysTillNetDue=termRec.getValue({fieldId:'daysuntilnetdue'});
			var daysUntilExpire=termRec.getValue({fieldId:'daysuntilexpiry'});

			log.debug('termId',recordObj.getValue({fieldId:'custbody_mhl_coninv_netterms'}));

			if(discount)
			{
				discount=Number(discount);
			}else
			{
				discount=0;
			}

			if(daysTillNetDue)
			{
				daysTillNetDue=Number(daysTillNetDue);
			}else
			{
				daysTillNetDue=0;
			}

			if(daysUntilExpire)
			{
				daysUntilExpire=Number(daysUntilExpire);
			}else
			{
				daysUntilExpire=0;
			}
			log.debug('daysUntilExpire',daysUntilExpire);



			var lineJsonArray=[];

			var lineCount=recordObj.getLineCount({sublistId:'line'});

			for(var i=0;i<lineCount;i++)
			{
				
				//amountremaining
				var vidId=recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_mhl_linked_vid',line:i});
				
				var amountRemaining=search.lookupFields({
					type:'invoice',
					id:vidId,
					columns: ['amountremaining']
				});
				log.debug('amountRemaining',amountRemaining.amountremaining);
				
				var lineJson={
						"RowID": i+1,
						"VisitNumber": recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_mhl_coninv_line_visitnumber',line:i}),
						"BillDate": recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_mhl_coninv_line_date',line:i}),
						"BillNumber": recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_line_invoice_id',line:i}),
						"PatientName": recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_mhl_coninv_line_patientname',line:i}),
						"TestDescription":recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_test_name_details',line:i}) ,
						"GrossAmount": Number(recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_mhl_coninv_line_grossamt',line:i})),
						"DiscountAmount":Number(recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_mhl_coninv_line_discount',line:i})) ,
						"NetAmount":Number(recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_mhl_coninv_line_netamt',line:i}))//Number(amountRemaining.amountremaining)//Number(recordObj.getSublistValue({sublistId:'line',fieldId:'custcol_mhl_coninv_line_netamt',line:i}))
				};
				lineJsonArray.push(lineJson);
				lineJson='';
			}

			var invoiceJson={
					"BillTo": recordObj.getValue({fieldId:'custbody_mhl_coninv_billto'}),
					"ClientCode": recordObj.getText({fieldId:'custbody_mhl_consinv_customer'}),
					"Address": recordObj.getValue({fieldId:'custbody_mhl_coninv_subsidiaryadd'}),
					"InvoiceNo": recordObj.getValue({fieldId:'tranid'}),
					"SiteAt": recordObj.getValue({fieldId:'custbody_mhl_coninv_siteat'}),
					"InvoiceDate": recordObj.getValue({fieldId:'trandate'}),
					"Zone": recordObj.getText({fieldId:'custbody_mhl_coninv_zone'}),
					"SAPCode": "",
					"FromPeriod": recordObj.getValue({fieldId:'custbody_mhl_coninv_periodfrom'}),
					"ToPeriod": recordObj.getValue({fieldId:'custbody_mhl_coninv_periodto'}),
					"PanNo": recordObj.getValue({fieldId:'custbody_mhl_coninv_panno'}),
					"ServiceCategory": recordObj.getValue({fieldId:'custbody_mhl_coninv_servicecategory'}) ,
					"ServiceTaxNo": "",
					"AmountInWords": recordObj.getValue({fieldId:'custbody_mhl_coninv_amtinwords'}),
					"TaxName": null,
					"TaxAmount": 0,
					"ItemType": null,
					"ClientName": recordObj.getText({fieldId:'custbody_mhl_consinv_customer'}),
					"NetTotal": Number(recordObj.getValue({fieldId:'custbody_due_amount'})),	
					"GrossAmount": Number(recordObj.getValue({fieldId:'custbody_due_amount'})),
					"TaxPercentage": 0,
					"TurnOverDiscount": 0,
					"BillDate": recordObj.getText({fieldId:'trandate'}),
					"Discount": 0,
					"lstInvoiceDetails": lineJsonArray,
					"lstCopayInvoiceDetails": [],
					"lstInvoiceCreditDetails": null,
					"Reportpath": "",
					"buffer": pdfString,
					"paymentTerms":{
						"daysTillNetDue" : daysTillNetDue,
						"discountPercentage" : discount,
						"daysTillDiscountExpire" : daysUntilExpire
					}
			};

			log.debug({title:'Invoice JSON',details:JSON.stringify(invoiceJson)});


			var x_cpg_code=scriptObj.getParameter({name: 'custscript_pdf_x_cpg_code'});
			var x_apikey=scriptObj.getParameter({name: 'custscript_pdf_x_api_key'});
			var freepayUrl=scriptObj.getParameter({name: 'custscript_freepay_pdf_url'});

			var requestHeader = {
					"User-Agent-x": "SuiteScript-Call",
					"x-cpg-code":x_cpg_code,
					"x-outType":"0",
					"x-apikey":x_apikey,
					"Content-Type": "application/json"
			};
			var freepayResponse = https.post({
				url: freepayUrl,
				body: JSON.stringify(invoiceJson),
				headers: requestHeader
			});

			log.debug({title:'freepay response',details:freepayResponse});

			if(freepayResponse.code=='200' || freepayResponse.code=='201')
			{
				recordObj.setValue({fieldId:'custbody_mhl_print_send_to_freepay',value:true});
				recordObj.setValue({fieldId:'custbody_integration_status',value:'1'});
				recordObj.save();
			}
		}
		catch (ex) { log.error({ title: 'map: error in creating records', details: ex }); }

	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each group.
	 *
	 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
	 * @since 2015.1
	 */


	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {

	}

	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize
	};

});