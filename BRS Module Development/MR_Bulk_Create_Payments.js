/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
// GetInputData : 10000 Units
// Map : 1000 Units
// Reduce : 5000 Units
// Summary : 10000 Units

define(['N/record', 'N/search', 'N/runtime', 'N/email','N/format','N/file','N/task','N/sftp'],

function(record, search, runtime, email,format,file,task,sftp) {
   
    function getInputData(context) {
    	try
		{
           var o_contextOBJ = runtime.getCurrentScript();
        
  		   var i_merger_parent = runtime.getCurrentScript().getParameter({name: 'custscript_merger_parent_'});               
           log.debug('schedulerFunction', 'i_merger_parent  -->'+i_merger_parent);
		   
		//   var file_ = runtime.getCurrentScript().getParameter({name: 'custscript_main_file_name_'});               
         //  log.debug('schedulerFunction', 'file_  -->'+file_);
		   
		   // =================== CREATE PAYMENTS ==================
		   
		   try
		   {
			   var o_c_vnd_p_srch = search.create({
				   type: "customrecord_merger_vendor_payment",
				   filters:
				   [
				    ["custrecord_m_vendor_payment_","anyof","@NONE@"],
					  "AND", 
					  ["internalid","anyof",i_merger_parent],	
				   ],
				   columns:
				   [
					  search.createColumn({
						 name: "name",
						 summary: "GROUP",
						 sort: search.Sort.ASC,
						 label: "Name"
					  })/*,
					  search.createColumn({
						 name: "custrecord_payment_date",
						 summary: "GROUP",
						 label: "Payment Date"
					  })*/,
					  search.createColumn({
						 name: "custrecord_merger_vendor_name",
						 summary: "GROUP",
						 label: "Merger Vendor name"
					  })/*,
					  search.createColumn({
						 name: "custrecord_batch_no",
						 summary: "GROUP"
					  })*/
				   ]
				});
				var searchResultCount = o_c_vnd_p_srch.runPaged().count;
				log.debug("o_c_vnd_p_srch result count",searchResultCount);
				o_c_vnd_p_srch.run().each(function(result){
				   
				   var i_vendor_id = result.getValue({name : "custrecord_merger_vendor_name" , summary : "GROUP"}); 
				   
				   var i_merger_name = result.getValue({name : "name" , summary : "GROUP"}); 
				   
				 //  var d_date      =  result.getValue({name : "custrecord_payment_date" , summary : "GROUP"}); 				   
				   
				   return true;
				});
		   }
		   catch(excswqr)
		   {
			  log.debug('ERROR', 'Exception Caught  -->'+excswqr); 
		   }
		  	   		
    	}
    	catch(ex){
    		log.debug("ERROR",'Exception '+ex.message);	
    	}
		
		return o_c_vnd_p_srch;
		 
    }
	
    function map(context) 
	{    	
	   log.debug("---Map-----");
	   
	    var o_contextOBJ = runtime.getCurrentScript();
        
  		var i_merger_parent = runtime.getCurrentScript().getParameter({name: 'custscript_merger_parent_'});               
        log.debug('schedulerFunction', 'i_merger_parent  -->'+i_merger_parent);
			   
	   try
	   {
	   var key = context.key
	   log.debug("map", 'key -->'+key);
		
	   var value = context.value;
	   log.debug("map", 'Value -->'+value);
	   
	   var VENDOR_SUB_JSON = {};
	   
	   var VENDOR_SUB_ARR = [];
   	 
	   var data = JSON.parse(context.value); //read the data
	  
	//    log.debug("map", 'Data Parse =='+JSON.stringify(data)); 
	 
	   var customId = data.id;
	   var data_values = data.values;
	   
	//    log.debug("map", 'Data Parse =='+JSON.stringify(data)); 
		
		var i_merger_vendor_id = data_values["GROUP(custrecord_merger_vendor_name)"];
		var i_merger_payment_date = data_values["GROUP(custrecord_payment_date)"];
		var i_merger_name = data_values["GROUP(name)"];
		
		
		
     // var invoiceId    = getValues["custrecord_transaction_number.CUSTRECORD_NS_ARINVCAN_INVOICE_NUMBER"].value
	 
	/*    log.debug("map", 'i_merger_vendor_id -->'+i_merger_vendor_id);
		log.debug("map", 'i_merger_payment_date -->'+i_merger_payment_date);
		log.debug("map", 'i_merger_name -->'+i_merger_name); */
		
		try
		{
			var o_merger_VP_DS = search.create({
			   type: "customrecord_merger_vendor_payment_det",
			   filters:
			   [
			    ["custrecord_create_payment","is","T"],
				"AND", 
				["custrecordrefmergervendorname","anyof",i_merger_parent],	
				"AND", 
				["custrecordrefmergervendorname.custrecord_m_vendor_payment_","anyof","@NONE@"],
				"AND", 
				["custrecordrefmergervendorname.custrecord_transaction_completed","is","F"],
				
				
			   
			   ],
			   columns:
			   [
				  search.createColumn({name: "internalid", label: "Internal ID"}),
				  search.createColumn({
					 name: "name",
					 label: "Name"
				  }),  
				   search.createColumn({name: "custrecord_l_location"}),
				  search.createColumn({name: "custrecord_create_payment", label: "Create Payment ?"}),
				  search.createColumn({name: "custrecordrefmergervendorname", label: "Ref Merger Vendor name"}),
				  search.createColumn({name: "custrecord_bankaccount", label: "Bank Account"}),
				  search.createColumn({name: "custrecord_ns_merger_trans", label: "NS Merger Transaction#"}),
				  search.createColumn({name: "custrecord_bill_subsidiary", sort: search.Sort.ASC,label: "Bill Subsidiary"}),
				  search.createColumn({name: "custrecord_payment_amount", label: "Payment Amount"}),
				  search.createColumn({name: "custrecord_vendor_invoice_no", label: "Vedor Invoice Number"}),
				  search.createColumn({name: "custrecord_vendor_invoice_date", label: "Invoice Date"}),
				  search.createColumn({name: "custrecord_merger_vendor_name",join : "CUSTRECORDREFMERGERVENDORNAME", sort: search.Sort.ASC,label: "Merger Vendor name"}),
				 search.createColumn({name: "custrecord_batch_no",join : "CUSTRECORDREFMERGERVENDORNAME", sort: search.Sort.ASC}),					  
	 				  
			   ]
			});
			var searchResultCount = o_merger_VP_DS.runPaged().count;
			log.debug("o_merger_VP_DS result count",searchResultCount);
			o_merger_VP_DS.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   
			  var i_parent = result.getValue({name : "custrecordrefmergervendorname"}); 
			  
			  var i_ns_transactions = result.getValue({name : "custrecord_ns_merger_trans"});				   
				   
		      var i_bank_account = result.getValue({name : "custrecord_bankaccount"}); 
		   
		      var d_date      =  result.getValue({name: "custrecord_vendor_invoice_date"});  
              var batch_no_      =  result.getValue({name: "custrecord_batch_no",join : "CUSTRECORDREFMERGERVENDORNAME"});  

              var i_subsidiary      =  result.getValue({name : "custrecord_bill_subsidiary"}); 

              var i_payment_amount      =  result.getValue({name : "custrecord_payment_amount"}); 

              var i_invoice_no      =  result.getValue({name : "custrecord_vendor_invoice_no"}); 

			  var i_NS_vendor      =  result.getValue({name: "custrecord_merger_vendor_name",join : "CUSTRECORDREFMERGERVENDORNAME"}); 			  
			  
              var internalid      =  result.getValue({name : "internalid"}); 	

             var location_xz      =  result.getValue({name : "custrecord_l_location"}); 			  
			  
			/*  log.debug("map", 'internalid -->'+internalid);
   	 		  log.debug("map", 'i_parent -->'+i_parent);
   	 		  log.debug("map", 'i_bank_account -->'+i_bank_account);
   	 		  log.debug("map", 'd_date -->'+d_date);
   	 		  log.debug("map", 'i_subsidiary -->'+i_subsidiary);
   	 		  log.debug("map", 'i_payment_amount -->'+i_payment_amount);
   	 		  log.debug("map", 'i_invoice_no -->'+i_invoice_no);
			  log.debug("map", 'i_ns_transactions -->'+i_ns_transactions);
			  log.debug("map", 'i_NS_vendor -->'+i_NS_vendor);*/
			  
			  VENDOR_SUB_JSON[i_subsidiary+'_'+i_NS_vendor] = {"ns_subsidiary" :i_subsidiary , "ns_vendor":i_NS_vendor , "ns_date" :d_date , "location_ns_x" : location_xz , "batch_no_" : batch_no_};
   	 		
			  VENDOR_SUB_ARR.push(i_subsidiary+'_'+i_NS_vendor); 
			  return true;
			});
		}
		catch(exqs)
		{
		 log.debug("ERROR", 'Exception Caught -->'+exqs);   	 			
		}
		
	//	VENDOR_SUB_JSON = arrUnique(VENDOR_SUB_JSON) ;
	
	    VENDOR_SUB_ARR = remove_duplicates(VENDOR_SUB_ARR);
	
	//	log.debug("map", 'VENDOR_SUB_JSON -->'+VENDOR_SUB_JSON);
		log.debug("map", 'VENDOR_SUB_ARR -->'+VENDOR_SUB_ARR);
		log.debug("map", 'VENDOR_SUB_ARR Length -->'+VENDOR_SUB_ARR.length);
		
		var VENDOR_SUB_JSON_KEYS =  Object.keys(VENDOR_SUB_JSON)
	//	log.debug("map", 'VENDOR_SUB_JSON_KEYS -->'+VENDOR_SUB_JSON_KEYS);
	//	log.debug("map", 'VENDOR_SUB_JSON_KEYS length -->'+VENDOR_SUB_JSON_KEYS.length);
		
		
		for(var r_t = 0 ; r_t < VENDOR_SUB_ARR.length ; r_t++)
		{
		
		log.debug("map", 'VENDOR_SUB_JSON_KEYS r_t -->'+VENDOR_SUB_ARR[r_t]);
		
	
           context.write({
                      key: VENDOR_SUB_ARR[r_t],
                      value: VENDOR_SUB_JSON[VENDOR_SUB_ARR[r_t]]
                    }); 
		   
		  // return true;
		}
			   
	   }
	   catch(excpmr)
	   {
		 log.debug("ERROR",'Exception map --> '+excpmr.message);  
	   }    	
    }
    function reduce(context) {    
    	try
		{     
    	 log.debug("reduce","----------");
			
         log.debug("reduce","context.key -->"+context.key);			
		 log.debug("reduce","context.values -->"+context.values.length);					
		 log.debug("reduce","context.values stringify -->"+JSON.stringify(context.values));
		 
		 var o_contextOBJ = runtime.getCurrentScript();
        
  		var i_merger_parent = runtime.getCurrentScript().getParameter({name: 'custscript_merger_parent_'});               
        log.debug('schedulerFunction', 'i_merger_parent  -->'+i_merger_parent);
		 
		 try
		 {
			var data_values = JSON.parse(context.values[0]); 
			
			var NS_SUBSIDIARY = data_values.ns_subsidiary ; 
			var NS_VENDOR = data_values.ns_vendor ; 
			var NS_DATE = data_values.ns_date ; 
			var NS_LOCATION = data_values.location_ns_x ;
			var NS_BATCH = data_values.batch_no_ ;
			
			log.debug("reduce","NS_SUBSIDIARY -->"+NS_SUBSIDIARY);
			log.debug("reduce","NS_VENDOR -->"+NS_VENDOR);
			log.debug("reduce","NS_DATE -->"+NS_DATE);
			
			////////////////// CREATE PAYMENTS /////////////
			
		//	var o_recordOBJ = record.transform({fromType: "vendor",fromId: NS_VENDOR,toType: "vendorpayment",isDynamic: true,});
		
		
	//	var o_recordOBJ = record.create({type: 'vendorpayment',isDynamic: true})
		
	/*	var vendorBillPayment = record.transform({
    fromType: 'vendor',
    fromId: NS_VENDOR,
    toType:'vendorpayment'
});
		var i_line_count = vendorBillPayment.getLineCount({sublistId: 'apply'})
			log.debug("reduce","i_line_count -->"+i_line_count); */
		
		/*var vendorBillPayment = record.transform({
    fromType: 'vendorbill',
    fromId: 21248,
    toType:'vendorpayment'
});
	
	var i_line_count = vendorBillPayment.getLineCount({sublistId: 'apply'})
			log.debug("reduce","i_line_count -->"+i_line_count); */	
		
		//	log.debug("reduce","o_recordOBJ -->"+o_recordOBJ);
		//	o_recordOBJ.setValue("entity", NS_VENDOR);
			//o_recordOBJ.setValue("subsidiary", NS_SUBSIDIARY);
		//	o_recordOBJ.setValue("location", 355);
			
		//	o_recordOBJ.setValue("account", 1495);	
			
			//var i_line_count = o_recordOBJ.getLineCount({sublistId: 'apply'})
			//log.debug("reduce","i_line_count -->"+i_line_count);
			var JSON_AMT_ = {};
			var NS_TYPE = "";
			var NS_ID = "";	
            var FLAG = 0 ;			
			var MERGER_ARRAY = [];
			var BANK_ACCOUNT_X = "";
			var LOCATION_X = "";
			var VENDOR_X = "";
			var AP_ACCOUNT = "";
			var FUTURE_DATE = "";			
			var ERROR_MESSAGE = "";
			
			try
			{
				var o_merger_VP_DS = search.create({
				   type: "customrecord_merger_vendor_payment_det",
				   filters:
				   [
					
					
					  ["custrecord_create_payment","is","T"], 
					  "AND", 
					  ["custrecord_bill_subsidiary","anyof",NS_SUBSIDIARY], 
					  "AND", 
					  ["custrecordrefmergervendorname.custrecord_merger_vendor_name","anyof",NS_VENDOR], 
					 /* "AND", 
					  ["custrecord_l_location","anyof",NS_LOCATION], */
					/*  "AND", 
					  ["custrecord_vendor_invoice_date","on",NS_DATE],*/
                      "AND",
					  ["custrecord_ns_merger_trans.mainline","is","T"],                      
                      "AND", 
					  ["custrecord_m_vendor_payment_x","anyof","@NONE@"],
                      "AND", 
					  ["custrecordrefmergervendorname","anyof",i_merger_parent],
                      "AND",					    
					  ["custrecordrefmergervendorname.custrecord_m_vendor_payment_","anyof","@NONE@"],
					  "AND", 
					  ["custrecordrefmergervendorname.custrecord_transaction_completed","is","F"],


					  
				   ],
				   columns:
				   [
					  search.createColumn({name: "internalid", label: "Internal ID"}),
					  search.createColumn({
						 name: "name",
						 label: "Name"
					  }),
					  search.createColumn({name: "custrecord_create_payment", label: "Create Payment ?"}),
					  search.createColumn({name: "custrecordrefmergervendorname", label: "Ref Merger Vendor name"}),
					  search.createColumn({name: "custrecord_bankaccount", label: "Bank Account"}),
					  search.createColumn({name: "custrecord_ns_merger_trans", label: "NS Merger Transaction#"}),
					  search.createColumn({name: "custrecord_bill_subsidiary", sort: search.Sort.ASC,label: "Bill Subsidiary"}),
					  search.createColumn({name: "custrecord_payment_amount", label: "Payment Amount"}),
					  search.createColumn({name: "custrecord_vendor_invoice_no", label: "Vedor Invoice Number"}),
					  search.createColumn({name: "custrecord_vendor_invoice_date", label: "Invoice Date"}),
					  search.createColumn({name: "custrecord_merger_vendor_name",join : "CUSTRECORDREFMERGERVENDORNAME", sort: search.Sort.ASC,label: "Merger Vendor name"}),
					  search.createColumn({name: "recordtype",join : "custrecord_ns_merger_trans"}),
					  search.createColumn({name: "custrecord_l_location"}),
					  search.createColumn({name: "custrecord_ap_account"}),
                      search.createColumn({name: "custrecord_payment_date",join : "CUSTRECORDREFMERGERVENDORNAME"}),					  
								  
				   ]
				});
				var searchResultCount = o_merger_VP_DS.runPaged().count;
				log.debug("o_merger_VP_DS result count",searchResultCount);
				o_merger_VP_DS.run().each(function(result){
				   
				  var i_parent = result.getValue({name : "custrecordrefmergervendorname"}); 
				  
				  var i_ns_transactions = result.getValue({name : "custrecord_ns_merger_trans"});	

                  var i_ns_type = result.getValue({name : "recordtype",join : 'custrecord_ns_merger_trans'});				  
					   
				  var i_bank_account = result.getValue({name : "custrecord_bankaccount"}); 
			   
				  var d_date      =  result.getValue({name : "custrecord_vendor_invoice_date"});  

				  var i_subsidiary      =  result.getValue({name : "custrecord_bill_subsidiary"}); 

				  var i_payment_amount      =  result.getValue({name : "custrecord_payment_amount"}); 

				  var i_invoice_no      =  result.getValue({name : "custrecord_vendor_invoice_no"}); 

				  var i_NS_vendor      =  result.getValue({name: "custrecord_merger_vendor_name",join : "CUSTRECORDREFMERGERVENDORNAME"}); 			  
				  
				  var internalid      =  result.getValue({name : "internalid"}); 

                  var location_y      =  result.getValue({name : "custrecord_l_location"});
				  
				  var AP_Account      =  result.getValue({name : "custrecord_ap_account"});
				 				  
                  var futue_date      =  result.getValue({name: "custrecord_payment_date",join : "CUSTRECORDREFMERGERVENDORNAME"}); 			  
				  				  	
					
				  log.debug("reduce", 'internalid -->'+internalid+'AP_Account -->'+AP_Account);
				  
				  
				  
				  if(FLAG == 0 )
				  {
					  NS_ID = i_ns_transactions;
					  NS_TYPE = i_ns_type ;
					  BANK_ACCOUNT_X = i_bank_account ;
					  LOCATION_X = location_y ;
					  VENDOR_X = i_NS_vendor ;
					  AP_ACCOUNT = AP_Account ;
					  FUTURE_DATE = futue_date ;
					  FLAG = 1 ;
				  }
				  
				//   var NS_TRANS = o_recordOBJ.findSublistLineWithValue({"sublistId": "apply", "fieldId": "internalid", "value":i_ns_transactions});
				//   log.debug("map", 'NS_TRANS -->'+NS_TRANS);
				  
				  JSON_AMT_[i_ns_transactions] = {"ns_type" : i_ns_type, "ns_trans" : i_ns_transactions , "merger_id" : internalid , "parent" : i_parent , "ns_pymt_amount" : i_payment_amount , "location_y": location_y , "bank_account_" :i_bank_account};
				  
				  
				 /* log.debug("map", 'i_parent -->'+i_parent);
				  log.debug("map", 'i_bank_account -->'+i_bank_account);
				  log.debug("map", 'd_date -->'+d_date);
				  log.debug("map", 'i_subsidiary -->'+i_subsidiary);
				  log.debug("map", 'i_payment_amount -->'+i_payment_amount);
				  log.debug("map", 'i_invoice_no -->'+i_invoice_no);
				  log.debug("map", 'i_ns_transactions -->'+i_ns_transactions);
				  log.debug("map", 'i_NS_vendor -->'+i_NS_vendor);*/				  
				 
				  return true;
				});
			}
			catch(exqs)
			{
			 log.debug("ERROR", 'Exception Caught -->'+exqs);  
             ERROR_MESSAGE+= exqs.message ;			 
			}
			
			
			log.debug('reduce', 'JSON_AMT_ -->' + JSON.stringify(JSON_AMT_));
			
			log.debug('reduce', 'NS_ID -->' + NS_ID+'NS_TYPE -->'+NS_TYPE+'VENDOR_X -->'+VENDOR_X+'NS_SUBSIDIARY -->'+NS_SUBSIDIARY+'AP_ACCOUNT -->'+AP_ACCOUNT+'BANK_ACCOUNT_X -->'+BANK_ACCOUNT_X+'LOCATION_X -->'+LOCATION_X);
			
		/*	var o_recordOBJ = record.transform({
				fromType: NS_TYPE,
				fromId: NS_ID,
				toType:'vendorpayment',
				isDynamic: true,
			}); */
			
			
			var o_recordOBJ = record.transform({
				fromType: 'vendor',
				fromId: VENDOR_X ,
				toType:'vendorpayment',
				isDynamic: true,
			});
			
		if(_logValidation(FUTURE_DATE))
		{
			FUTURE_DATE = format.parse({value:FUTURE_DATE, type: format.Type.DATE});
		}	
			
			log.debug("reduce","FUTURE_DATE -->"+FUTURE_DATE); 
			
	
	       	o_recordOBJ.setValue({fieldId: 'subsidiary',value: NS_SUBSIDIARY,ignoreFieldChange: false});
			o_recordOBJ.setValue({fieldId: 'apacct',value: AP_ACCOUNT,ignoreFieldChange: false});
			o_recordOBJ.setValue({fieldId: 'account',value: BANK_ACCOUNT_X,ignoreFieldChange: false});
		//	o_recordOBJ.setValue({fieldId: 'trandate',value: FUTURE_DATE,ignoreFieldChange: false});
		
		    if(_logValidation(FUTURE_DATE))
			{
				o_recordOBJ.setValue({fieldId: 'custbody_mhl_future_payment_date',value: FUTURE_DATE,ignoreFieldChange: false});			
			}				
						
			//o_recordOBJ.setValue("subsidiary", NS_SUBSIDIARY,options.ignoreFieldChange);	
        //    o_recordOBJ.setValue("apacct", AP_ACCOUNT);	
		//	o_recordOBJ.setValue("account", BANK_ACCOUNT_X);
		//	o_recordOBJ.setValue({fieldId:'currency',value:1});
			o_recordOBJ.setValue({fieldId:'custbody_mhl_createdby',value:118});
						
			o_recordOBJ.setValue({fieldId:"location",value: LOCATION_X,ignoreFieldChange: false});		
						
			 var i_line_count = o_recordOBJ.getLineCount({sublistId: 'apply'})
			log.debug("reduce","i_line_count -->"+i_line_count); 
					
			if(_logValidation(i_line_count))
		    {
			  for(var i_ln = 0; i_ln < i_line_count; i_ln++) 
			  {			
				o_recordOBJ.selectLine({sublistId: 'apply',line: i_ln}); 
				
				var NS_TRAN_ID =  o_recordOBJ.getCurrentSublistValue({sublistId: 'apply',fieldId: 'internalid'});
				
				var NS_type =  o_recordOBJ.getCurrentSublistValue({sublistId: 'apply',fieldId: 'type'});
				
				
			
				try
				{
					var PYMR_AMOUNT = JSON_AMT_[NS_TRAN_ID].ns_pymt_amount  ;
					var PYMR_NS_T_ID = JSON_AMT_[NS_TRAN_ID].ns_trans ;
					var MERGER_ID = JSON_AMT_[NS_TRAN_ID].merger_id ;
					//var LOCATION_X = JSON_AMT_[NS_TRAN_ID].location_y ;
					//var BANK_ACCOUNT_X = JSON_AMT_[NS_TRAN_ID].bank_account_ ;
				}
				catch(exss)
				{
					var PYMR_AMOUNT = 0 ;
					var PYMR_NS_T_ID = "" ;
					var MERGER_ID = "";
					//var LOCATION_X = "";
					//var BANK_ACCOUNT_X = "";
				}
				
				 
					
				if((NS_TRAN_ID == PYMR_NS_T_ID) && _logValidation(PYMR_NS_T_ID) && _logValidation(NS_TRAN_ID))
				{
				
				
				
				PYMR_AMOUNT = parseFloat(PYMR_AMOUNT).toFixed(2);
				
			/*	if((NS_type == 'Journal')|| (NS_type == 'Bill Credit')|| (NS_type == 'Vendor Advance Application'))
				{
					PYMR_AMOUNT = (PYMR_AMOUNT) * (-1)
				}
				else */
				{
					PYMR_AMOUNT = PYMR_AMOUNT;
				} 
				
			//	if(NS_type == 'Journal')
				{
				log.debug('reduce', 'PYMR_NS_T_ID -->' + PYMR_NS_T_ID); 
				log.debug('reduce', 'NS_type -->' + NS_type); 
				log.debug('reduce', 'NS_TRAN_ID -->' + NS_TRAN_ID);
				log.debug('reduce', 'MERGER_ID -->' + MERGER_ID);
				
				log.debug("reduce","NS_amount -->"+NS_amount); 
				
				//PYMR_AMOUNT = parseFloat(PYMR_AMOUNT) * (-1)
				
				log.debug('reduce', 'PYMR_AMOUNT -->' + PYMR_AMOUNT); 
				}
				
				
                o_recordOBJ.setCurrentSublistValue({sublistId: 'apply',fieldId: 'apply',value: true, ignoreFieldChange: true, forceSyncSourcing: true});
				
				var NS_amount =  o_recordOBJ.getCurrentSublistValue({sublistId: 'apply',fieldId: 'amount'});
				
				o_recordOBJ.setCurrentSublistValue({sublistId: 'apply',fieldId: 'amount',value:PYMR_AMOUNT , ignoreFieldChange: false, forceSyncSourcing: false});
				o_recordOBJ.commitLine({sublistId:'apply'});
               
                if(_logValidation(MERGER_ID))
				{
					MERGER_ARRAY.push(MERGER_ID);
				}					
				}				
			  }	 				
			}
			try{	
             			
				o_recordOBJ.setValue({fieldId:'custbody_merger_vendor_payment_',value:MERGER_ARRAY});
					
				var i_VP_submitID = o_recordOBJ.save({enableSourcing: false,ignoreMandatoryFields: true});
			log.debug('reduce', 'Vendor payment Submit ID -->' + i_VP_submitID); 
			
           if(i_VP_submitID) 
		   {
			   
			   for(var v_q = 0 ; v_q < MERGER_ARRAY.length ; v_q++)
			   {
				  var i_BK_submitID = record.submitFields({
						type: "customrecord_merger_vendor_payment_det",
						id: MERGER_ARRAY[v_q],
						values: {
							custrecord_m_vendor_payment_x: i_VP_submitID,							
						},
						options: {
							enableSourcing: true,
							ignoreMandatoryFields: true
						}
					});
					log.debug('custom bank record', ' i_BK_submitID -->' + i_BK_submitID);			   
			   }
			} 		
			
			
			}
			catch(exsqww)
			{
			  log.debug("ERROR","Exception Caught exsqww -->"+exsqww);	
			   ERROR_MESSAGE+= exsqww.message ;	
			}
			
			 
			
		 }
		 catch(excwy)
		 {
			log.debug("ERROR","Exception Caught -->"+excwy);
            ERROR_MESSAGE+= excwy.message ;				
		 }
		 try
		 {
			 if(_logValidation(i_merger_parent) && _logValidation(ERROR_MESSAGE))
			 {
				 var i_BK_submitID = record.submitFields({
						type: "customrecord_merger_vendor_payment",
						id: i_merger_parent,
						values: {
							custrecord_m_error_: ERROR_MESSAGE,							
						},
						options: {
							enableSourcing: true,
							ignoreMandatoryFields: true
						}
					}); 
			 }				 
			
			log.debug('custom bank record', ' Merger Parent Submit ID -->' + i_BK_submitID);
		 }
		 catch(eqmlk)
		 {
			 log.debug('ERROR', ' eqmlk -->' + eqmlk);
		 }
          
         return true;	 
    	}
    	catch(ex){
    		log.debug('reduce','reduce error: '+ ex.message);
         			
    	}
    	
    }

    function summarize(summary) {
    			 
    	var type = summary.toString();
        log.debug(type + ' Usage Consumed', summary.usage);
        log.debug(type + ' Concurrency Number ', summary.concurrency);
        log.debug(type + ' Number of Yields', summary.yields);
		
	    var o_contextOBJ = runtime.getCurrentScript();
        
  		var i_merger_parent = runtime.getCurrentScript().getParameter({name: 'custscript_merger_parent_'});               
        log.debug('schedulerFunction', 'i_merger_parent  -->'+i_merger_parent);
		
		var TOTAL_CHILD_RECORDS = 	get_all_child_details(i_merger_parent) ;
	    var PAID_CHILD_RECORDS = get_child_details(i_merger_parent) ;
		
		TOTAL_CHILD_RECORDS = remove_duplicates(TOTAL_CHILD_RECORDS);
		PAID_CHILD_RECORDS = remove_duplicates(PAID_CHILD_RECORDS);
		
		TOTAL_CHILD_RECORDS  = TOTAL_CHILD_RECORDS.length ;
		PAID_CHILD_RECORDS  = PAID_CHILD_RECORDS.length ;
		
		log.debug('schedulerFunction', '<-- TOTAL_CHILD_RECORDS  -->'+TOTAL_CHILD_RECORDS+'<-- PAID_CHILD_RECORDS -->'+PAID_CHILD_RECORDS);
	  
		if((PAID_CHILD_RECORDS == TOTAL_CHILD_RECORDS) && (_logValidation(PAID_CHILD_RECORDS) && _logValidation(TOTAL_CHILD_RECORDS)))
		{
			try{
				 var i_BK_submitID = record.submitFields({
						type: "customrecord_merger_vendor_payment",
						id: i_merger_parent,
						values: {
							custrecord_transaction_completed: true,							
						},
						options: {
							enableSourcing: true,
							ignoreMandatoryFields: true
						}
					});
					log.debug('custom bank record', ' i_BK_submitID -->' + i_BK_submitID);			   
			}
			catch(excqq)
			{
			log.debug('custom bank record', ' excqq -->' + excqq);	
			}
		}
	 		 
     	summary.output.iterator().each(function(key, value)
		{
			log.debug('schedulerFunction', 'value JSON STRINGIFY  -->'+JSON.stringify(value));
			return true;
	    });	 

			
    }
	function arrUnique(arr) {
    var cleaned = [];
    arr.forEach(function(itm) {
        var unique = true;
        cleaned.forEach(function(itm2) {
            if (_.isEqual(itm, itm2)) unique = false;
        });
        if (unique)  cleaned.push(itm);
    });
    return cleaned;
}
	function _logValidation(value)
	{
	  if(value!=null && value!= 'undefined' && value!=undefined && value!='' && value!='NaN' && value!=' ')
	  {
		  return true;
	  }	 
	  else	  
	  {
		  return false;
	  }
	}	
    function remove_duplicates(arr) 
	{
		var seen = {};
		var ret_arr = [];
		for(var i = 0; i < arr.length; i++) 
		{
			if(!(arr[i] in seen))
			{
				ret_arr.push(arr[i]);
				seen[arr[i]] = true; 		   
			}
		}
		return ret_arr;
	}
    function convert_date(d_date)
	{
	  var d_date_convert = "" ;	
	  if(_logValidation(d_date))
		{
			var currentTime = new Date(d_date);
			var currentOffset = currentTime.getTimezoneOffset();
			var ISTOffset = 330;   // IST offset UTC +5:30 
			d_date_convert = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
		}	
		return d_date_convert; 
	}
	

	function get_child_details(PARENT)
	{
	   var RETURN_X = [];	
	    
	   if(_logValidation(PARENT))  
	   {  
		   try
		   {
			   var o_YIL_bank_detailsOBJ = search.create({
			   type: "customrecord_merger_vendor_payment_det",
			   filters:
			   [
				  ["custrecord_m_vendor_payment_x","noneof","@NONE@"],
				  "AND",
				  ["custrecordrefmergervendorname","anyof",PARENT]
			   ],
			   columns:
			   [
				  search.createColumn({name: "internalid"})
			   ]
			});
			var searchResultCount = o_YIL_bank_detailsOBJ.runPaged().count;
			log.debug("get_child_details", ' ********* searchResultCount *********** -->'+searchResultCount);  
			o_YIL_bank_detailsOBJ.run().each(function(result){
			   var i_P_ID = result.getValue({name: "internalid" });
			   log.debug("get_child_details", ' ********* i_P_ID ******* -->'+i_P_ID);  
			  	RETURN_X.push(i_P_ID) ;		   
			   return true;
			});
		   }	
		   catch(xqw)
		   {
			log.debug("xqw Exception Caught -->"+xqw);   
		   }  		   
	   }	
 
	   
	   return RETURN_X ;
	}
	
	function get_all_child_details(PARENT)
	{
	   var RETURN_X = [];	
	    
	   if(_logValidation(PARENT))  
	   {  
		   try
		   {
			   var o_YIL_bank_detailsOBJ = search.create({
			   type: "customrecord_merger_vendor_payment_det",
			   filters:
			   [
				/*  ["custrecordrefmergervendorname.custrecord_m_vendor_payment_x","noneof","@NONE@"],
				  "AND",*/
				  ["custrecordrefmergervendorname","anyof",PARENT]
			   ],
			   columns:
			   [
				  search.createColumn({name: "internalid"})
			   ]
			});
			var searchResultCount = o_YIL_bank_detailsOBJ.runPaged().count;
			log.debug("get_all_child_details", ' ********* searchResultCount *********** -->'+searchResultCount);  
			o_YIL_bank_detailsOBJ.run().each(function(result){
			   var i_P_ID = result.getValue({name: "internalid" });
			   log.debug("get_all_child_details", ' ********* i_P_ID ******* -->'+i_P_ID);  
			  	RETURN_X.push(i_P_ID) ;		   
			   return true;
			});
		   }	
		   catch(xqw)
		   {
			log.debug("xqw Exception Caught -->"+xqw);   
		   }  		   
	   }	
 
	   
	   return RETURN_X ;
	}

    return {
        getInputData: getInputData,
        map: map,
		reduce : reduce,
        summarize: summarize
    };
    
});