/******************************************************
*File Name: 		MHL_SUT_SOA Report Criteria.js
*Company : 		Yantra Inc.
*Date Created: 	14/12/2020
*Date Modified:
*Created By:      Kunal Mahajan
*Description: 		This script is used to show all the details to print customer SOA Statement.
*******************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
var UIMODULE,RUNTIME,RECORD,REDIRECT,SEARCH,XML,CONFIG,RENDER;
define(['N/ui/serverWidget','N/runtime','N/record','N/redirect','N/search','N/xml','N/config','N/render'],

function(obj_ui,obj_runtime,obj_record,obj_redirect,obj_search,obj_xml,obj_config,obj_render) 
{
   
	UIMODULE = obj_ui;
	RUNTIME = obj_runtime;
	RECORD = obj_record;
	REDIRECT = obj_redirect;
	SEARCH = obj_search;
	XML = obj_xml;
	CONFIG = obj_config;
	RENDER = obj_render;
	
    function onRequest(context) 
    {
    	var request  = context.request;
		var response = context.response;
		var objXML = '';
		
		if(request.method == 'GET')
    	{
    		try
    		{
    			var form = UIMODULE.createForm({ title: 'Customer Statement of Account' });
    			form.clientScriptFileId = 24105387;  
    			var customer_name = form.addField({ id: 'customername', type: UIMODULE.FieldType.SELECT, label: 'Customer',source:'customer'});
    			customer_name.isMandatory=true;
    			var subsidiary = form.addField({ id: 'subsidiary', type: UIMODULE.FieldType.SELECT, label: 'Subsidiary',source:'subsidiary'});
    			subsidiary.isMandatory=true;
    			subsidiary.updateDisplayType({displayType: UIMODULE.FieldDisplayType.DISABLED});
    			var currency = form.addField({ id: 'currency', type: UIMODULE.FieldType.SELECT, label: 'Currency',source:'currency'});//,source:'subsidiary'
    			currency.isMandatory=true;
    			currency.updateDisplayType({displayType: UIMODULE.FieldDisplayType.DISABLED});
    			var o_frm_date_range = form.addField({id : 'startdate',type : UIMODULE.FieldType.DATE,label : 'From Date'});
    			o_frm_date_range.updateBreakType({ breakType: 'startcol' });
    			o_frm_date_range.isMandatory=true;
    			var o_to_date_range = form.addField({id : 'enddate',type : UIMODULE.FieldType.DATE,label : 'To Date'});
    			o_to_date_range.isMandatory=true;
    			
    			form.addButton({ id : 'custpage_print_pdf_btn',label : 'Print Statement', functionName: 'customer_statement_pdf'});
    			form.addButton({ id : 'custpage_email_csv_btn',label : 'CSV Statement', functionName: 'customer_statement_csv'});  //Email in CSV Format
    			  			
    			context.response.writePage(form);
    		}//try
    		catch(error)
    		{
    			log.debug('Inside Catch','Catch error = '+error);
    		}
    	}//end if(request.method == 'GET')
		if(request.method == 'POST')
		{
			log.debug('Print Crieteria POST');
			
			var params = new Array();
			params['customername'] = request.parameters.customername;
			params['startdate'] = request.parameters.startdate;
			params['enddate'] = request.parameters.enddate;
			params['subsidiary'] = request.parameters.subsidiary;
			
			//==== REDIRECT TO NEXT URL ======
			//REDIRECT.toSuitelet({ scriptId:'', deploymentId: '', parameters: params});
		}	
		else
		{
		    //===WRITE A RESPONSE ======
			var pageNotFound = '<html><body>404-Page Not Found</body></html>';
			context.response.writePage(pageNotFound);
		} // END else
    	
    }
    
    

    return {
        onRequest: onRequest
    };
    
});
