
/*************************************************************
 * File Header
 * Script Type: Scheduled
 * Script Name: MHL SCH COnso Invoice date Update
 * File Name: MHL SCH Consolidated inv Date Update.js
 * Created On: 21/10/2021
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: Consolidated inv Date Update
 *********************************************************** */
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/email', 'N/format', 'N/file', 'N/task', './datellib'],

function(record, search, runtime, email, format, file, task, datellib) 
{
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) 
    {
    	 try 
    	 {
    	    var o_search =  search.load({id: 'customsearch1056651'});
    	    var search_conso_inv= o_search.run().getRange({start: 0,end: 1000});
        	log.debug('#search_conso_inv - '+search_conso_inv+'#length- '+search_conso_inv.length);
        	
        	var breakFlag = 0;
        	if(search_conso_inv != null || search_conso_inv != '')
        	{
        		var length = search_conso_inv.length;
        		log.debug('Search result length0 = ' +length);
        		
        		for (var counter = 0; counter < length; counter++)
				{
        			var i_tranid = search_conso_inv[counter].getValue({name: "tranid"});
        			var i_internalID = search_conso_inv[counter].getValue({name: "internalid"});
        			var i_externalID = search_conso_inv[counter].getValue({name: "externalid"});
        			log.debug('Search rDetails = ' +i_tranid+'#i_internalID-'+i_internalID+'#externalID- '+i_externalID);
        			
        			if(i_tranid)
        			{
        				var fileSearchObj = search.create({
        					   type: "file",
        					   filters:
        					   [
        					      ["name","startswith",i_tranid]
        					   ],
        					   columns:
        					   [
        					      search.createColumn({name: "internalid",sort: search.Sort.ASC,label: "Internal ID"}),
        					      search.createColumn({name: "created", label: "Date Created"}),
        					      search.createColumn({name: "name", label: "Name"})
        					   ]
        					});
        					var searchResult = fileSearchObj.run().getRange({start: 0,end: 1});
        					if(searchResult)
        					{
        						var i_file_internalId = searchResult[0].getValue({name: "internalid"});
        						log.debug('File Search rDetails = ' +i_file_internalId);
        						if(i_file_internalId)
        						{
        							var jsonFile = file.load({id:i_file_internalId});
            		    			//log.debug('JSON FILE','jsonFile- '+jsonFile);
            		    			
            		    			var content = jsonFile.getContents();
            		    		    content = content.replace('ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿', '');
            		    		    content = JSON.parse(content);
            		    		    //log.debug({title: 'content',details: content});
            		    		    
            		    		    var invoice_number = content.invoiceNo;
            		    		    var invoice_date = content.invoiceDate;
            		    		    var client_code = content.clientCode;
            		    		    log.debug('JSON FILE','invoice_number- '+invoice_number+'#invoice_date-'+invoice_date+'#client_code-'+client_code);
            		    		    
            		    		    var subsidiaryTimezone_gmt;
            		    		    if(client_code)
            		    		    {
            		    		        var internalIdSearch = search.create({
            		    		            type: search.Type.CUSTOMER,
            		    		            columns: ['internalid', 'subsidiary',search.createColumn({name: "custrecord_mhl_timezone_gmt",join: "mseSubsidiary"}) ],
            		    		            filters: [ ['entityid', 'is', client_code] ]
            		    		          });

            		    		          var searchResult_cust = internalIdSearch.run().getRange({start: 0,end: 1});
            		    		         // log.debug({title:'searchResult 124',details:searchResult_cust});

            		    		          if (searchResult_cust && searchResult_cust.length > 0) 
            		    		          {
            		    		        	  subsidiaryTimezone_gmt = searchResult_cust[0].getValue({name: "custrecord_mhl_timezone_gmt",join: "mseSubsidiary"})
            		    		        	  //log.debug('Customer Details','subsidiaryTimezone_gmt- '+subsidiaryTimezone_gmt);
            		    		          }
            		    		    
            		    		          var d_invoiceDate=datellib.findDate(invoice_date,null,subsidiaryTimezone_gmt);
            		    		          log.debug('d_invoiceDate',d_invoiceDate.toString());
                                          var d_dueDate=add_months(d_invoiceDate, 1);
                                          log.debug('d_dueDate',d_dueDate);

                                          var fromDate = d_invoiceDate.getDate();
                                          var fromMonth = d_invoiceDate.getMonth();
                                          var fromYear = d_invoiceDate.getFullYear();
                                          var formed_invdate = fromDate+'-'+fromMonth+'-'+fromYear;
                                          log.debug('formed Dates','Inv Date0- '+fromDate+'#'+fromMonth+'#'+fromYear+'###'+formed_invdate);
                                          
                                          var d_formed_invDate = formatDateTime(formed_invdate);
                                          log.debug('formed Dates','Inv Date1- '+d_formed_invDate);

                                          var d_parsed_dueDate = new Date(d_dueDate);
                                          
                                          var dueDate = d_parsed_dueDate.getDate();
                                          var dueMonth = d_parsed_dueDate.getMonth();
                                          var dueYear = d_parsed_dueDate.getFullYear();
                                          var formed_duedate = dueDate+'-'+dueMonth+'-'+dueYear;
                                          log.debug('formed Dates','Due Date0- '+dueDate+'#'+dueMonth+'#'+dueYear+'###'+formed_duedate);
                                          
                                          var d_formed_dueDate = formatDateTime(formed_duedate);
                                          log.debug('formed Dates','Due Date1- '+d_parsed_dueDate+'##'+d_formed_dueDate);
            		    		          try
            		    		          {

                                            var o_record = record.load({type:'customtransaction_mhl_consolidatedinvoic',id:i_internalID});
                                            o_record.setValue({fieldId:'trandate',value:d_formed_invDate});
                                            o_record.setValue({fieldId:'custbody_mhl_coninv_duedate',value:d_parsed_dueDate});//d_formed_dueDate
                                            o_record.setValue({fieldId:'custbody_mhl_date_updated',value:true});
            		    		        	o_record.save({enableSourcing: true,ignoreMandatoryFields: true});

                                              /*record.submitFields({
              		    						type: 'customtransaction_mhl_consolidatedinvoic',
              		    						id: i_internalID,
              		    						values: {
              		    							'trandate': format.format({value:d_invoiceDate, type: format.Type.DATE}),
                                                    'custbody_mhl_coninv_duedate': d_dueDate,
              		    							'custbody_mhl_date_updated':true
              		    						 }
              		    					});*/

            		    		          }
            		    		          catch(error)
            		    		          {
            		    		        	  log.error('submit field','error- '+error);
            		    		          }
            		    		          
            		    		          
            		    		   
            		    		    }
            		    		    
            		    		    
        						}//i_file_internalId
        						
        					}
        					
        			}
        			
        			
        			
				}
        	}

	    } 
    	 catch (err) 
	    {
	      log.error('Catch', 'err - ' + err);
	    }
    }

    function add_months(dt, n) 
    {
        return new Date(dt.setMonth(dt.getMonth() + n));      
    }

    function formatDateTime(d_date)
    {
         var splitedDate = d_date;
         
         var userObj = runtime.getCurrentUser();
         var userPref_DateFormat = userObj.getPreference ({name: 'DATEFORMAT'});
        var dateFormat = userPref_DateFormat;
        log.debug('dateFormat-',dateFormat);
         if (dateFormat == "D/M/YYYY" || dateFormat == "DD/MM/YYYY" || dateFormat == "YYYY-MM-DD" || dateFormat == "YYYY/MM/DD" || dateFormat == "DD MONTH, YYYY" || dateFormat == "DD-MONTH-YYYY" || dateFormat == "DD.MM.YYYY" || dateFormat == "DD-Mon-YYYY" || dateFormat == "YYYY-M-D" || dateFormat == "YYYY/M/D" || dateFormat == "D MONTH, YYYY" || dateFormat == "D-MONTH-YYYY" || dateFormat == "D.M.YYYY" || dateFormat == "D-Mon-YYYY") {
             var fDate = "";

             if (dateFormat == "D/M/YYYY") {
                 var d;
                 var m;
                 var y;

                 var tokenExpiry_split = splitedDate.split("-");
                 
                 
                 d = tokenExpiry_split[0];//.replace(/(^|-)0+/g, "$1")
                 m = tokenExpiry_split[1];//.replace(/(^|-)0+/g, "$1")
                 y = tokenExpiry_split[2];

                 fDate = m + "/" + d + "/" + y;
                /* d = tokenExpiry_split[2].replace(/(^|-)0+/g, "$1");;
                 m = tokenExpiry_split[1].replace(/(^|-)0+/g, "$1");;
                 y = tokenExpiry_split[0];

                 fDate = d + "/" + m + "/" + y;*/
             } else if (dateFormat == "DD/MM/YYYY") {

                 var dd;
                 var mm;
                 var yy;

                 var tokenExpiry_split = dateString.split("/");

                 dd = tokenExpiry_split[0];
                 mm = tokenExpiry_split[1];
                 yy = tokenExpiry_split[2];

                 fDate = mm + "/" + dd + "/" + yy;
             } else if (dateFormat == "YYYY-MM-DD") {

                 var dd;
                 var mm;
                 var yy;

                 var tokenExpiry_split = dateString.split("-");

                 dd = tokenExpiry_split[2];
                 mm = tokenExpiry_split[1];
                 yy = tokenExpiry_split[0];

                 fDate = mm + "/" + dd + "/" + yy;
             } else if (dateFormat == "YYYY/MM/DD") {

                 var dd;
                 var mm;
                 var yy;

                 var tokenExpiry_split = dateString.split("/");

                 dd = tokenExpiry_split[2];
                 mm = tokenExpiry_split[1];
                 yy = tokenExpiry_split[0];

                 fDate = mm + "/" + dd + "/" + yy;
             } else if (dateFormat == "DD MONTH, YYYY") {

                 var dd;
                 var MONTH;
                 var yy;

                 var tokenExpiry_split = dateString.split(" ");

                 dd = tokenExpiry_split[0];
                 MONTH = tokenExpiry_split[1];
                 yy = tokenExpiry_split[2];

                 fDate = MONTH + "/" + dd + "/" + yy;
             } else if (dateFormat == "DD-MONTH-YYYY") {

                 var dd;
                 var MONTH;
                 var yy;

                 var tokenExpiry_split = dateString.split("-");

                 dd = tokenExpiry_split[0];
                 MONTH = tokenExpiry_split[1];
                 yy = tokenExpiry_split[2];

                 fDate = MONTH + "/" + dd + "/" + yy;
             } else if (dateFormat == "DD.MM.YYYY") {

                 var dd;
                 var mm;
                 var yy;

                 var tokenExpiry_split = dateString.split(".");

                 dd = tokenExpiry_split[0];
                 mm = tokenExpiry_split[1];
                 yy = tokenExpiry_split[2];

                 fDate = mm + "/" + dd + "/" + yy;
             } else if (dateFormat == "DD-Mon-YYYY") {

                 var dd;
                 var Mon;
                 var yy;

                 var tokenExpiry_split = dateString.split("-");

                 dd = tokenExpiry_split[0];
                 Mon = tokenExpiry_split[1];
                 yy = tokenExpiry_split[2];

                 fDate = Mon + "/" + dd + "/" + yy;
             } else if (dateFormat == "YYYY-M-D") {

                 var d;
                 var m;
                 var y;

                 var tokenExpiry_split = dateString.split("-");

                 d = tokenExpiry_split[2];
                 m = tokenExpiry_split[1];
                 y = tokenExpiry_split[0];

                 fDate = m + "/" + d + "/" + y;
             } else if (dateFormat == "YYYY/M/D") {

                 var d;
                 var m;
                 var y;

                 var tokenExpiry_split = dateString.split("/");

                 d = tokenExpiry_split[2];
                 m = tokenExpiry_split[1];
                 y = tokenExpiry_split[0];

                 fDate = m + "/" + d + "/" + y;
             } else if (dateFormat == "D MONTH, YYYY") {

                 var d;
                 var MONTH;
                 var y;

                 var tokenExpiry_split = dateString.split(" ");

                 dd = tokenExpiry_split[0];
                 MONTH = tokenExpiry_split[1];
                 y = tokenExpiry_split[2];

                 fDate = MONTH + "/" + d + "/" + y;
             } else if (dateFormat == "D-MONTH-YYYY") {

                 var d;
                 var MONTH;
                 var y;

                 var tokenExpiry_split = dateString.split("-");

                 d = tokenExpiry_split[0];
                 MONTH = tokenExpiry_split[1];
                 y = tokenExpiry_split[2];

                 fDate = MONTH + "/" + d + "/" + y;
             } else if (dateFormat == "D.M.YYYY") {

                 var d;
                 var m;
                 var y;

                 var tokenExpiry_split = dateString.split(".");

                 d = tokenExpiry_split[0];
                 m = tokenExpiry_split[1];
                 y = tokenExpiry_split[2];

                 fDate = m + "/" + d + "/" + y;
             } else if (dateFormat == "D-Mon-YYYY") {

                 var d;
                 var Mon;
                 var y;

                 var tokenExpiry_split = dateString.split("-");

                 d = tokenExpiry_split[0];
                 Mon = tokenExpiry_split[1];
                 y = tokenExpiry_split[2];

                 fDate = Mon + "/" + d + "/" + y;
             }

             //log.debug("DateTimeFormat","fDate=="+fDate);
             //log.debug("DateTimeFormat","splitedTime=="+splitedTime);

             //var ConcatdateTimeString = fDate;// + " " + splitedTime;
             //log.debug('ConcatdateTimeString-',ConcatdateTimeString);
             //var formattedDate = format.format({value:fDate,type:format.Type.DATE});
             var formattedDate = new Date(fDate);
             log.debug('formed Date-',formattedDate);
         }
        
        
        //////////////////////////////// 
         {
            /* var d;
             var m;
             var y;

             var tokenExpiry_split = splitedDate.split("-");

             d = tokenExpiry_split[2];
             m = tokenExpiry_split[1];
             y = tokenExpiry_split[0];

             fDate = d + "/" + m + "/" + y;
             log.debug('format date function ::fDate - '+fDate);
             
             var formattedDate = format.format({value:fDate,type:format.Type.DATE});// + " " + splitedTime;       
             log.debug('format date function::formattedDate - '+formattedDate);
             //var formattedDateTime = new Date(formattedDate);
             //log.debug('format date function::formattedDateTime - '+formattedDateTime);
*/         }
      
        
        return formattedDate 
    }
    

    return {
        execute: execute
    };
    
});