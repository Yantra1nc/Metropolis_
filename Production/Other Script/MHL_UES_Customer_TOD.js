/******************************************************
*File Name: 		MHL_UES_Customer_TOD.js
*Company : 		Yantra Inc.
*Date Created: 	10/06/2021
*Created By:      Kunal Mahajan
*Description: 		This script is used to Update TOD on Consolidated Invoice record.
*******************************************************/
/**
 *		Date				Author						Requirement By				Comments
 *  
 */ 

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/record','N/search','N/url'],

function(runtime,record,search,url) 
{
   
    function beforeLoad(scriptContext) 
    {
    	log.debug('BeforeLoad runtime.executionContext = '+ runtime.executionContext)
		var user = runtime.getCurrentUser();
        var i_current_user = user.id;
        var userRole = user.role;
        
        var o_recObj = scriptContext.newRecord;
		var i_rec_id = scriptContext.newRecord.id; 
        var s_record_type = scriptContext.newRecord.type;
        log.debug('i_rec_id - '+ i_rec_id +'s_record_type - '+s_record_type);
        
        var i_approval_status = o_recObj.getValue('custbody_conso_inv_approval_status');
        
        if(scriptContext.type == 'view' && parseInt(i_approval_status) == parseInt(1))
    	{
        	var s_Suitelet_URL = url.resolveScript({scriptId: 'customscript_mhl_sut_approval_status', deploymentId: 'customdeploy_mhl_sut_approval_status',returnExternalUrl: false}); 
            
        	var s_apprvl_Suitelet_URL = s_Suitelet_URL + '&recordId=' + i_rec_id + '&recordType='+s_record_type +'&state=approve';
            var s_apprvl_Suitelet_URL_path ="win = window.open('"+ s_apprvl_Suitelet_URL +"','_self')";
            scriptContext.form.addButton({ id: "custpage_approve",label: "Approve",functionName:s_apprvl_Suitelet_URL_path});
            
            var s_reject_Suitelet_URL = s_Suitelet_URL + '&recordId=' + i_rec_id + '&recordType='+s_record_type +'&state=reject';
            var s_reject_Suitelet_URL_path ="win = window.open('"+ s_reject_Suitelet_URL +"','_self')";
            scriptContext.form.addButton({ id: "custpage_reject",label: "Reject",functionName:s_reject_Suitelet_URL_path});
    	}
        
        if(parseInt(i_approval_status) != parseInt(1))
        {
        	scriptContext.form.removeButton({id : 'edit'});
        }
    }

    function beforeSubmit(scriptContext) 
    {
    	var o_contextOBJ = runtime.getCurrentScript();
        var i_tod_discount_item = o_contextOBJ.getParameter({name: 'custscript_mhl_item'});
 		log.debug('Runtime',' TOD Discount Item ID #  --> '+i_tod_discount_item);
 		
 		var o_recObj = scriptContext.newRecord;
        var s_record_type = scriptContext.newRecord.type;
        log.debug('BeforeSubmit Details','#Rec Type - '+s_record_type);
 		
 		if(scriptContext.type == 'create' || scriptContext.type == 'edit' )	// 
		{
            if(s_record_type == 'customtransaction_mhl_consolidatedinvoic')
        	{
            	if(runtime.executionContext == 'USERINTERFACE' || runtime.executionContext == 'CSVIMPORT')
            	{
            		
            		if(!i_tod_discount_item)
             		{
            			 var i_total_amount = o_recObj.getValue('total');
            			 log.debug('Before Submit','i_total_amount- '+i_total_amount);
            			 if(i_total_amount > 0)
            			{
            				 throw "Please select TOD Discount Item under Custom Preferences tab."
            			}
 			            
             		}
            	}
        	}
		}
 		
    }

    function afterSubmit(scriptContext) 
    {
    	try
    	{
    		var user = runtime.getCurrentUser();
            var i_current_user = user.id;
            log.debug('Runtime','i_current_user - ' + i_current_user);
            
            var o_contextOBJ = runtime.getCurrentScript();
            var i_tod_discount_item = o_contextOBJ.getParameter({name: 'custscript_mhl_item'});
     		log.debug('Runtime',' TOD Discount Item ID #  --> '+i_tod_discount_item);
            
            var o_recObj = scriptContext.newRecord;
            var i_rec_id = scriptContext.newRecord.id;
            var s_record_type = scriptContext.newRecord.type;
            log.debug('BeforeSubmit Details','#Rec Type - '+s_record_type);
            
            if(scriptContext.type == 'create'  || scriptContext.type == 'edit' )	//
    		{
	            if(s_record_type == 'customtransaction_mhl_consolidatedinvoic')
	        	{
	            	//if(runtime.executionContext == 'USERINTERFACE' || runtime.executionContext == 'CSVIMPORT')
	            	{
						var i_CM_RecordId;
			            var o_recObj = record.load({type: s_record_type,id: i_rec_id,isDynamic: true});
			            var i_client_id = o_recObj.getValue('custbody_mhl_consinv_customer');
			            var i_client_code = o_recObj.getValue('custbody_client_id');
			            var i_discount_amt = o_recObj.getValue('custbody_tod_discount_amount');
			            var d_trandate = o_recObj.getValue('trandate');
			            var i_location = o_recObj.getValue('location');
						var i_cm_id = o_recObj.getValue({ fieldId: 'custbody_mhl_tod_cm_link'});
			        	log.debug('Rec Details','i_client_id- '+i_client_id+'i_discount_amt- '+i_discount_amt+'#i_cm_id-'+i_cm_id+'#d_trandate-'+d_trandate);
						
			        	/* "AND", 
			        			      ["custrecord_client_code","is",i_client_code], */
			        	
			        	if(i_client_id && i_discount_amt) //&& i_client_code
			        	{
								/*  var o_customer_tod = search.create({
			        			   type: "customrecord_customer_tod",
			        			   filters:
			        			   [
			        			      ["custrecord_client_name","anyof",i_client_id], 
			        			      "AND", 
			        			      ["custrecord_org_name","anyof",i_location],
			        			      "AND", 
			        			      ["custrecord_lower_range","lessthanorequalto",parseInt(i_total_amount)], 
			        			      "AND", 
			        			      ["custrecord_upper_range","greaterthanorequalto",parseInt(i_total_amount)], 
			        			      "AND", 
			        			      ["custrecord_is_active","is","T"]
			        			   ],
			        			   columns:
			        			   [
			        			      search.createColumn({name: "custrecord_percentage", label: "Percentage "})
			        			   ]
			        			}); 
				        		var customRecord_search = o_customer_tod.run().getRange({start: 0,end: 1});
	    	        	    	log.debug('resultSet - '+customRecord_search+'#length- '+customRecord_search.length);
	    	        	    	
	    	        	    	if(customRecord_search)    
        	        	    	{
        	        	    		var length = customRecord_search.length;
        	        	    		log.debug('Search result length = ' +length);
        	        	    		i_tod_percent = customRecord_search[0].getValue({name: "custrecord_percentage"});
        	        	    		i_tod_percent = parseFloat(i_tod_percent);
        	        	    		log.debug('Search result','i_tod_percent- ' +i_tod_percent);
        	        	    		
        	        	    		i_discount_amt = (parseFloat(i_tod_percent) / parseFloat(100)) * parseFloat(i_total_amount);        	        	    		
        	        	    		i_discount_amt = i_discount_amt.toFixed(2);
        	        	    		log.debug('Search result','i_discount_amt- ' +i_discount_amt);
        	        	    	}
	    	        	    	else
	    	        	    	{
	    	        	    		i_tod_percent = '0';
	    	        	    		i_discount_amt = '0';
	    	        	    	}
								
	    	        	    	*/
	    	        	    	//o_recObj.setValue({  fieldId: 'custbody_tod_discount_amount', value:i_discount_amt , ignoreFieldChange: false}); 
	    	        	    	//o_recObj.setValue({  fieldId: 'custbody_tod_discount_percentage', value:i_tod_percent , ignoreFieldChange: false}); 
	    	        	    	
	    	        	    	//var o_submitRec = o_recObj.save({ enableSourcing: true, ignoreMandatoryFields: true });
        						//log.debug('Record','Submit Record- '+o_submitRec);
        						
								if(!i_cm_id)
								{
									if(parseFloat(i_discount_amt) > parseFloat(0))
									{
										log.debug('Inside CM cretion');
										//var objCreditMemo = record.transform({ fromType: record.Type.INVOICE, fromId: o_submitRec, toType: record.Type.CREDIT_MEMO, isDynamic: true, });
										
										var objCreditMemo = record.create({type: record.Type.CREDIT_MEMO,isDynamic: true});
										
										objCreditMemo.setValue({ fieldId: 'entity', value:i_client_id , ignoreFieldChange: false });
										objCreditMemo.setValue({ fieldId: 'location', value:i_location , ignoreFieldChange: false });
										objCreditMemo.setValue({ fieldId: 'trandate', value:d_trandate , ignoreFieldChange: false });
										objCreditMemo.setValue({ fieldId: 'custbody_mhl_app_conso_inv', value:i_rec_id , ignoreFieldChange: false });
										objCreditMemo.setValue({ fieldId: 'custbody_consolidated_invoice_number', value:i_rec_id , ignoreFieldChange: false });
										objCreditMemo.setValue({ fieldId: 'custbody_mhl_pay_proce_status', value:parseInt(1) , ignoreFieldChange: false });
										objCreditMemo.setValue({ fieldId: 'custbody_mhl_amt_tb_on_inv', value:i_discount_amt , ignoreFieldChange: false });
										
										objCreditMemo.selectNewLine({ sublistId: 'item'});
										objCreditMemo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item',value: i_tod_discount_item, ignoreFieldChange: false });
										objCreditMemo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value:i_discount_amt, ignoreFieldChange: false });
										objCreditMemo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value:i_location, ignoreFieldChange: false });
										objCreditMemo.commitLine({sublistId: 'item' });
										
										var cmTotal = objCreditMemo.getValue({fieldId: 'total'}); 
										log.debug('create_credit_memo','cmTotal- '+cmTotal);
										
										i_CM_RecordId = objCreditMemo.save({enableSourcing: false, ignoreMandatoryFields: true});
										log.debug('create_credit_memo','i_CM_RecordId- '+i_CM_RecordId)
									}
								}
			        	}
						
						if(i_CM_RecordId)
						{
							o_recObj.setValue({ fieldId: 'custbody_mhl_tod_cm_link', value:i_CM_RecordId , ignoreFieldChange: false });
							var i_conso_inv_id = o_recObj.save({enableSourcing: false, ignoreMandatoryFields: true});
							log.debug('consolidated CM update','Rec update Int Id- '+i_conso_inv_id);
						}
	            	
	            	}
	        	}
	            
	            
    		}
    	}
    	catch(error)
    	{
    		log.error('CATCH','Msg- '+error)
    	}

    }
	
	//    	beforeSubmit:beforeSubmit,
    
	return {
        afterSubmit: afterSubmit
    };
    
});
