//Pdf Url Send Script
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name:MHL Transaction Invoice PDF to Freepay
 * File Name: MHL Transaction Invoice PDF to Freepay.js
 * Created On: 01/02/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Invoice PDF to Freepay
 *********************************************************** */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/runtime', 'N/search','N/record','N/https','N/url','N/file'],
		/**
		 * @param {render} render
		 * @param {runtime} runtime
		 * @param {search} search
		 */
		function(render, runtime, search,record,https,url,file) {

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
			//return search.load({id:'customsearch_invoice_search_for_pdf_2'});
			return search.load({id:'customsearch_tran_b2b_inv_print_serach'});
			
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
			
			log.debug("Data -->", data);
			
			var scriptObj = runtime.getCurrentScript();


			var recordInternalId = Number(data.id);
			
			log.debug("Record Internal Id -->", recordInternalId);

			var recordObj=record.load({type:'invoice',id:recordInternalId});
			
			var entyiId = recordObj.getValue({fieldId:'entity'});
			log.debug("entityId -->", entyiId);
			
			//Get Zone & Pan Number from Customer
			
			var record_load = record.load({
                type: record.Type.CUSTOMER,
                id: entyiId,
                isDynamic: true
            })
            var c_zone = record_load.getText({
                fieldId: 'custentity_mhl_cust_zone'
            });
			log.debug("Zone -->", c_zone);
			
			var c_pan = record_load.getValue({
                fieldId: 'custentity_permanent_account_number'
            });
			log.debug("Pan Number -->", c_pan);
			
			// Get Address from subsidiary
			var i_subsidiaryId = recordObj.getValue({
                fieldId: 'subsidiary'
            });
			
			var o_subsibObj = record.load({
                type: record.Type.SUBSIDIARY,
                id: i_subsidiaryId
            });
			
            var mainaddress_text = o_subsibObj.getText({
                fieldId: "mainaddress_text"
            });
			
			log.debug("Subsidiary Address -->", mainaddress_text);
			
				
			// Get Pdf Url
			
			var accountLink = url.resolveDomain({
                hostType: url.HostType.APPLICATION
			});
			
			var pdf_url = recordObj.getValue({fieldId:'custbody_b2b_conso_pdf'});
			
			log.debug("PDF Id ---->", pdf_url);
			
			if(pdf_url){
				var o_fileObj = file.load({
					id: pdf_url
				}); 
				
				var URL = o_fileObj.url
				var finalURL = 'https://'+accountLink+URL  

				log.debug("Pdf Url ---->", finalURL);
			}
			

			// Get Terms Details
			
			var termRec=record.load({
				type:'term',
				id:recordObj.getValue({fieldId:'terms'})
			});

			var discount=termRec.getValue({fieldId:'discountpercent'});
			var daysTillNetDue=termRec.getValue({fieldId:'daysuntilnetdue'});
			var daysUntilExpire=termRec.getValue({fieldId:'daysuntilexpiry'});

			//log.debug('termId',recordObj.getValue({fieldId:'custbody_mhl_coninv_netterms'}));

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

			if(finalURL){
			
				var invoiceJson={
						"BillTo": recordObj.getValue({fieldId:'billaddress'}),
						"ClientCode": recordObj.getText({fieldId:'entity'}),
						"Address": mainaddress_text,
						"InvoiceNo": recordObj.getValue({fieldId:'tranid'}),
						"SiteAt": recordObj.getValue({fieldId:'custbody_mhl_coninv_siteat'}),
						"InvoiceDate": recordObj.getValue({fieldId:'trandate'}),
						"Zone": c_zone,
						"SAPCode": "",
						"FromPeriod": recordObj.getValue({fieldId:'startdate'}),
						"ToPeriod": recordObj.getValue({fieldId:'enddate'}),
						"PanNo": recordObj.getValue({fieldId:'custbody_mhl_coninv_panno'}),
						"ServiceCategory": recordObj.getValue({fieldId:'custbody_mhl_coninv_servicecategory'}) ,
						"ServiceTaxNo": "",
						"AmountInWords": recordObj.getValue({fieldId:'custbodyamountinwords'}),
						"TaxName": null,
						"TaxAmount": 0,
						"ItemType": null,
						"ClientName": recordObj.getText({fieldId:'entity'}),
						"NetTotal": Number(recordObj.getValue({fieldId:'amountremainingtotalbox'})),
						"GrossAmount": Number(recordObj.getValue({fieldId:'total'})),
						"TaxPercentage": 0,
						"TurnOverDiscount": 0,
						"BillDate": recordObj.getText({fieldId:'trandate'}),
						"Discount": 0,
						"lstInvoiceDetails": null,
						"lstCopayInvoiceDetails": [],
						"lstInvoiceCreditDetails": null,
						"Reportpath": "",
						"buffer": finalURL,
						"paymentTerms":{
							"daysTillNetDue" : daysTillNetDue,
							"discountPercentage" : discount,
							"daysTillDiscountExpire" : daysUntilExpire
						}
				};
			
			

			log.debug({title:'Invoice JSON',details:JSON.stringify(invoiceJson)});


			var x_cpg_code=scriptObj.getParameter({name: 'custscript_pdf_x_cpg_code_new'});
			var x_apikey=scriptObj.getParameter({name: 'custscript_pdf_x_api_key_new'});
			//var x_apikey= '';
			var freepayUrl=scriptObj.getParameter({name: 'custscriptfreepay_pdf_url_new'});
			
			log.debug("x_cpg_code-->",x_cpg_code);
			log.debug("x_apikey-->",x_apikey);
			log.debug("freepayUrl-->",freepayUrl);
		
			var requestHeader = {
					"User-Agent-x": "SuiteScript-Call",
					"x-cpg-code":x_cpg_code,
					"x-outType":"0",
					"x-apikey":x_apikey,
					"Content-Type": "application/json"
			};
			
			
			/* {"User-Agent-x":"SuiteScript-Call","x-cpg-code":"CPGMTLS","x-apikey":"1234","Content-Type":"application/json","Accept":"application/json"}
			*/

			var freepayResponse = https.post({
				url: freepayUrl,
				body: JSON.stringify(invoiceJson),
				headers: requestHeader
			});

			log.audit({title:'freepay response',details:freepayResponse});

			if(freepayResponse.code=='200' || freepayResponse.code=='201')
			{
				recordObj.setValue({fieldId:'custbody_mhl_print_send_to_freepay',value:true});
				recordObj.setValue({fieldId:'custbody_integration_status',value:'1'});
				recordObj.save();
			}
			
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