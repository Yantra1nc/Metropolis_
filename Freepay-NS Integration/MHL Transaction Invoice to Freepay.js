/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL Transaction Invoice to Freepay
 * File Name:MHL Transaction Invoice to Freepay.js 
 * Created On: 01/02/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Invoice to Freepay
 *********************************************************** */

define(['N/file', 'N/format', 'N/https', 'N/search','N/runtime','N/record','N/http'],
		/**
		 * @param {file} file
		 * @param {format} format
		 * @param {http} http
		 * @param {search} search
		 */
		function(file, format, https, search,runtime,record,http) {

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
			return search.load({
				id:'customsearch_b2b_tran_inv_search'
			});
		}catch(e)
		{
			log.debug({title:'Error Occured while collecting JSON for Freepay',details:e});
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

			/*
			 * {"recordType":"customtransaction_mhl_consolidatedinvoic","id":"53712","values":{"entityid.CUSTBODY_MHL_CONSINV_CUSTOMER":"13","tranid":"00024","trandate":"19/5/2020","custbody_mhl_coninv_duedate":"","formulanumeric":"180000","formulatext":"P","custbody_invoice_status":""}}	
			 */
			var data = JSON.parse(context.value); //read the data
			//log.debug("Search Data -->", data);
			
			var recId=data.id;
			//log.debug("Record Id -->" recId);
			
			// read data from row//
			var entityId=data.values["entityid.customer"];
			
			//Change code 17/11/2022 
			var custTanNumber=data.values["custentity_mhl_customer_tan_number.customer"];
			
			//log.debug("TAN Number ==>", custTanNumber);
			
			/* var invStatus=data.values["statusref"];
			log.debug("Status ==>", invStatus); */
			
			/*-----------------------------*/
			
			var documentNumber=data.values["tranid"];
			var docDate=data.values["trandate"];	
			
			var finalDocDate='';
			var dueDate=data.values["duedate"];
				
			var termId=data.values["terms"].value;
			
			/* log.debug("Entity Id -->", entityId);
			log.debug("Tranid -->", documentNumber);
			log.debug("Trandate -->", docDate);
			log.debug("Duedate -->", dueDate);
			log.debug("Terms -->", termId); */
			
			//For the TAN Number /*-------------------------------------*/
			/* if(entityId){
				var o_recCust_obj = record.load({
                    type: record.Type.CUSTOMER,
                    id: entityId,
                    isDynamic: true,
                });
				
				var custTanNumber=o_recCust_obj.getValue({fieldId:'custentity_mhl_customer_tan_number'});
				log.debug("TAN Number ==>", custTanNumber);
			}
			log.debug("TAN Number ==>", custTanNumber);
			
			 */
			/*-------------------------------------*/
			
			//terms
			if(termId){
				var termRec=record.load({
					type:'term',
					id:termId
				});
				
				var discount=termRec.getValue({fieldId:'discountpercent'});
				var daysTillNetDue=termRec.getValue({fieldId:'daysuntilnetdue'});
				var daysUntilExpire=termRec.getValue({fieldId:'daysuntilexpiry'});
				
			/* log.debug("Discount percent -->",discount);
			log.debug("Days until netdue -->",daysTillNetDue);
			log.debug("Days until Expiry -->",daysUntilExpire);

			//log.debug('data',data);
			log.debug('termId',termId); */
				
			}
			
			
			
			

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

			var finalDueDate='';
			var totalAmt=data.values["formulanumeric"];
			
			var invStatus=data.values["custbody_invoice_status"].text;
			if(invStatus){
				log.debug("invStatus-->", invStatus);
			}else{
				invStatus = "";
			}
			var dueAmt=data.values["amountremaining"];
			var financialYear='';     
			var updatedDate=data.values["custbody_updated_on"];
			
			/* log.debug("Formulanumeric -->", totalAmt);
			log.debug("Custbody invoice Status -->", invStatus);
			log.debug("Amount Remaining -->", dueAmt);
			log.debug("Custbody updated on -->", updatedDate); */
			
			var finalUpdatedDate='';
			/* if(updatedDate)
			{
				var dateArray=(updatedDate.toString()).split('/'); // Date format is DDMMYYYY

				if(Number(dateArray[0])<=9)
				{
					dateArray[0]='0'+dateArray[0];
				}

				if(Number(dateArray[1])<=9)
				{
					dateArray[1]='0'+dateArray[1];
				}

				finalUpdatedDate=dateArray[0]+dateArray[1]+dateArray[2];
			} */
			
			if(updatedDate)
			{
				var dateArray=(updatedDate.toString()).split('/'); // Date format is DDMMYYYY

				if(Number(dateArray[0])<=9)
				{
					if(dateArray[0].length <= 1)
					{
						dateArray[0]='0'+dateArray[0];
					}
					else
					{
						dateArray[0]=dateArray[0];
					}
					
				}

				if(Number(dateArray[1])<=9)
				{
					dateArray[1]=dateArray[1];
				}

				finalUpdatedDate=dateArray[0]+dateArray[1]+dateArray[2];
			}
			
			
			

			/* if(docDate)
			{
				var dateArray=(docDate.toString()).split('/'); // Date format is DDMMYYYY

				if(Number(dateArray[0])<=9)
				{
					dateArray[0]='0'+dateArray[0];
				}

				if(Number(dateArray[1])<=9)
				{
					dateArray[1]='0'+dateArray[1];
				}

				finalDocDate=dateArray[0]+dateArray[1]+dateArray[2];
				financialYear=dateArray[2];
			} */
			
			if(docDate)
			{
				var dateArray=(docDate.toString()).split('/'); // Date format is DDMMYYYY

				if(Number(dateArray[0])<=9)
				{
					if(dateArray[0].length <= 1)
					{
						dateArray[0]=dateArray[0];
					}
					else
					{
						dateArray[0]=dateArray[0];
					}
					
				}

				if(Number(dateArray[1])<=9)
				{
					dateArray[1]=dateArray[1];
				}

				finalDocDate=dateArray[0]+dateArray[1]+dateArray[2];
			}
			

			/* if(dueDate)
			{
				var dateArray=(dueDate.toString()).split('/'); // Date format is DDMMYYYY

				if(Number(dateArray[0])<=9)
				{
					if(dateArray[0].length <= 1)
					{
						dateArray[0]='0'+dateArray[0];
					}
					else
					{
						dateArray[0]=dateArray[0];
					}	
				}

				if(Number(dateArray[1])<=9)
				{
					dateArray[1]='0'+dateArray[1];
				}

				finalDueDate=dateArray[0]+dateArray[1]+dateArray[2];
			} */

			if(dueDate)
			{
				var dateArray=(dueDate.toString()).split('/'); // Date format is DDMMYYYY

				if(Number(dateArray[0])<=9)
				{
					if(dateArray[0].length <= 1)
					{
						dateArray[0]=dateArray[0];
					}
					else
					{
						dateArray[0]=dateArray[0];
					}	
				}

				if(Number(dateArray[1])<=9)
				{
					dateArray[1]=dateArray[1];
				}

				finalDueDate=dateArray[0]+dateArray[1]+dateArray[2];
			}




			var invoiceJson={
					"custCode": entityId,
					"docNo": documentNumber,
					"docDate": finalDocDate,
					"dueDate": finalDueDate,
					"totalAmt": Number(totalAmt),
					"balAmt": Number(dueAmt),
					"docType": "IN",
					"cDFactor": "",
					"financialYear": financialYear,
					"tan" : custTanNumber,
					"viewType": "",
					"viewUrl": "",
					"updateOn": finalUpdatedDate,
					"shippedFrom": "",
					"secDocNo": "",
					"shippedCode": "",
					"status": invStatus,
					"paymentTerms":{
						"daysTillNetDue" : daysTillNetDue,
						"discountPercentage" : discount,
						"daysTillDiscountExpire" : daysUntilExpire
					}
			};
			context.write('json',JSON.stringify(invoiceJson));
			context.write('recid',recId.toString());
			
			
			log.audit("Invoice Json:",invoiceJson);
		}
		catch (ex) { log.error({ title: 'map: error in creating records', details: ex }); }

	}


	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {

		try
		{
			var scriptObj = runtime.getCurrentScript();
			var x_cpg_code=scriptObj.getParameter({name: 'custscript_x_cpg_code_new'});
			var x_apikey=scriptObj.getParameter({name: 'custscript_x_apikey_new'});
			var freepayUrl=scriptObj.getParameter({name: 'custscript_invoice_url_new'});
			var mapKeysProcessed = 0;

			var recIdArray=[];
			var contents=[];
			var totalRows=0;
			summary.output.iterator().each(function(key, value) {
				if(key=='json')
				{
					contents.push(JSON.parse(value));
					totalRows++;	
				}else
				{
					recIdArray.push(JSON.parse(value));
				}

				return true;
			});

			//log.debug({title:'Record Id Array',details:recIdArray});
          	log.audit("Length",contents.length)
			log.debug({title:'Record Id Array',details:contents});
//"x-outType":"0",
			var requestHeader = {
					"User-Agent-x": "SuiteScript-Call",
					"x-cpg-code":x_cpg_code,					
					"x-apikey":x_apikey,
					"Content-Type": "application/json",
					"Accept": "application/json"
			};
			
			// Commented Code - Sunil Khutwad
			//Temporary Commented this Code when Script Moving to production that time uncomment this code
			
			log.debug("requestHeader",JSON.stringify(requestHeader))
			
			//var freepayUrl='https://globalpayex.co/PayexCPGAPI/Metropolis/V001/invoiceDetails';
			//var freepayUrl='https://payex.co.in/PayexCPGAPI/Metropolis/V001/invoiceDetails';
			//var freepayUrl='https://freepay.co/PayexCPGAPI/Metropolis/V001/invoiceDetails';
			//var freepayUrl= '';
			
			//var freepayUrl='';
			
			var freepayResponse = https.post({
				url: freepayUrl,
				body: JSON.stringify(contents),
				headers: requestHeader
			}); 

			log.audit({title:'freepay response',details:freepayResponse.body});
			
			if(freepayResponse.code=='200')
			{
				log.debug({title:'In If - B2B Transaction Invoice Sent to Freepay'});
				for(var j in recIdArray)
				{
					record.submitFields({
						type: 'invoice',
						id: recIdArray[j],
						values: {
							custbody_integration_status: '2',
							custbody_invoice_status:'2'
						},
						options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
						}
					});	
				}

			}else
			{
				log.debug({title:'In Else - B2B Transaction Invoice Sent to Freepay'});
				for(var j in recIdArray)
				{
					record.submitFields({
						type: 'invoice',
						id: recIdArray[j],
						values: {
							custbody_integration_status: '3'
						},
						options: {
							enableSourcing: true,
							ignoreMandatoryFields : true
						}
					});	
				}
				log.debug({title:'Unable to send details to Freepay',details:freepayResponse.code});
			}
			//log.debug({title:'totalRows '+totalRows,details:'contents '+JSON.stringify(contents)});	
		}catch(e)
		{
			log.error({title:'Error occured in summarize stage',details:e});
		}
	}
	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize
	};

});



