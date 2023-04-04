/**
 * Script Name: 
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * Script Name: MHL YIL MR SOA Automation.js
 * Author: Sunil Khutwad & Ganesh Sapakale
 * Date: MAR 2023
 * Description: This script will Generate Statement of Account(SOA) Quarterly Basis.
 */
define(['N/ui/serverWidget', 'N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib', "./callrestdata", "N/url", 'N/https', 'N/redirect', 'N/xml', 'N/config', 'N/render', 'N/email'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function(ui, file, format, record, search, runtime, mhllib, datellib, callrestdata, url, https, redirect, xml, config, render, email) {

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
                log.audit("deployment Id", deploymentId)

                return search.load({
                    id: 'customsearchlist_for_soa'
                });

            } catch (e) {
                log.debug({
                    title: 'Error Occured while collecting JSON',
                    details: e
                });
            }
        }

        function map(context) {
            try {
                //log.debug("context",JSON.stringify(context.value.transaction))
                var data = JSON.parse(context.value); //read the data
                log.debug("data", data.length)
                var service_desk_id = context.key;
                log.debug("context key", service_desk_id);
                //log.debug("context data", JSON.stringify(data.transaction))
                log.debug('data', data);
                var i_customerId = data.id;
                log.debug("intId", i_customerId)

                var fileInternalId = data.values.entityid;
                log.debug("Customer Id -->", fileInternalId);

                var custEmail = data.values.email;
                log.debug("Customer Email -->", custEmail);

                var now = new Date();
                var quarter = Math.floor((now.getMonth() / 3));
                quarter = parseInt(quarter) - parseInt(1)
                var firstDate = new Date(now.getFullYear(), quarter * 3, 1);
                var endDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 3, 0);

                log.debug("First Date", firstDate);
                log.debug("End Date", endDate);

                var d_from_date = format.format({
                    value: firstDate,
                    type: format.Type.DATE
                });
                log.debug("d_from_date -->", d_from_date);

                var d_to_date = format.format({
                    value: endDate,
                    type: format.Type.DATE
                });
                log.debug("d_to_date -->", d_to_date);

                var download_fileType = 'pdf';

                /* var urlToCall = url.resolveScript({
                            scriptId: 'customscript_mhl_sut_soa_report_result',
                            deploymentId: 'customdeploy_sut_soa_report_resulsci',
                           returnExternalUrl: true,
							params: {
								'customername': intId,
								'startdate': firstDateFormat,
								'enddate': lastDateFormat,
								'download':'pdf'
							}
                    });
					
				    
                    log.debug("urlToCall", urlToCall)
					var finaUrl = 'https://4120343.app.netsuite.com'+urlToCall;
					log.debug("finaUrl", finaUrl) */

                //====================================
                try {
                    var request = context.request;
                    var response = context.response;

                    var i_total_amount = 0;
                    var openingBalance = 0;
                    var currentBalance = 0;
                    //Parameters 
                    /* var i_customerId = context.request.parameters.customername;
                    var d_from_date = context.request.parameters.startdate;
                    var d_to_date = context.request.parameters.enddate;
                    var download_fileType = context.request.parameters.download;
                    log.debug('Parameters - '+i_customerId+'# '+d_from_date+'#'+d_to_date+'#'+download_fileType);    	 */

                    var startdate = formatDate(d_from_date);
                    var enddate = formatDate(d_to_date);

                    //	var startdate = format.format({value:d_from_date,type:format.Type.DATE});
                    //	var enddate = format.format({value:d_to_date,type:format.Type.DATE});
                    log.debug('Converted Date - ' + startdate + '#enddate- ' + enddate);

                    var configRecObj = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    var companyName = configRecObj.getValue({
                        fieldId: 'companyname'
                    });
                    companyName = xml.escape({
                        xmlText: companyName
                    })
                    log.debug('companyName - ' + companyName);
                    //var companyLogo = 'https://5950164-sb1.app.netsuite.com/core/media/media.nl?id=360&amp;c=5950164_SB1&amp;h=336ade4e252f4bc6791d';
                    //var image_tag = '<img src="'+companyLogo+'"/>';

                    //var companySite = configRecObj.getValue({fieldId: 'url'});
                    //log.debug('onRequest','companySite :'+companySite);

                    var today = new Date();
                    var d_today = formatDate(today);

                    var o_customer = record.load({
                        type: 'customer',
                        id: i_customerId,
                        isDynamic: true
                    });
                    var s_customer_name = o_customer.getValue({
                        fieldId: 'entityid'
                    });
                    var s_company_name = o_customer.getValue({
                        fieldId: 'companyname'
                    });
                    if (!s_company_name)
                        s_company_name = '';
                    var s_customer_address = o_customer.getValue({
                        fieldId: 'defaultaddress'
                    });
                    var s_customer_subsidiary = o_customer.getText({
                        fieldId: 'subsidiary'
                    });
                    var i_customer_subsidiary = o_customer.getValue({
                        fieldId: 'subsidiary'
                    });
                    var custCreatedDate = o_customer.getValue({
                        fieldId: 'datecreated'
                    });
					
					 
                    log.debug('s_customer_name- ' + s_customer_name + '#i_customer_subsidiary- ' + i_customer_subsidiary);

                    //custCreatedDate = format.format({value:custCreatedDate,type:format.Type.DATE});
                    //log.debug('custCreatedDate1- '+custCreatedDate);

                    var s_logo_url;

                    var o_subsidiary = record.load({
                        type: 'subsidiary',
                        id: i_customer_subsidiary,
                        isDynamic: true
                    });

                    var s_currency = o_subsidiary.getText({
                        fieldId: 'currency'
                    });
                    var i_logo_id = o_subsidiary.getValue({
                        fieldId: 'pagelogo'
                    });
                    var s_customer_subsidiary = o_subsidiary.getValue({
                        fieldId: 'legalname'
                    });

                    log.debug("i_logo_id", i_logo_id)
                    if (i_logo_id) {
                        var fileObj = file.load({
                            id: i_logo_id
                        });
                        s_logo_url = fileObj.url;
                        s_logo_url = 'https://4120343-sb1.app.netsuite.com' + s_logo_url;
                        s_logo_url = s_logo_url.replace(/&/g, "&amp;");
                        // replace & with &amp;

                    }
                    log.debug('Subsidiary', 'Currency- ' + s_currency + '#Logo- ' + i_logo_id + '::' + s_logo_url);

                    var image_tag = '<img src="' + s_logo_url + '"/>';

                    var openingBalanceDate = startdate;
                    openingBalance = getOpeningBalance(i_customerId, startdate); ////custCreatedDate
                    if (!openingBalance || openingBalance == undefined || openingBalance == NaN)
                        openingBalance = 0;


                    if (download_fileType == 'pdf') {
                        var xmlBody = "";
                        xmlBody += "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n<pdf>";
                        // HEADER Details
                        xmlBody += "<head><style>";
                        xmlBody += "td p {align:left}";
                        xmlBody += "table {";
                        xmlBody += "   font-family: Times New Roman, Georgia, Serif;"; //font-weight: bold;
                        xmlBody += "}";
                        xmlBody += "<\/style>";
                        xmlBody += "<title>" + s_customer_name + "</title>";

                        xmlBody += "		<\/head>";

                        xmlBody += "<body font-size=\"10\" header=\"smallheader\" header-height=\"37mm\">";

                        xmlBody += "<table width=\"100%\" style=\"table-layout: fixed\">"; // style=\"border-top-style:none;border-bottom-style:none;border-right-style:none;border-left-style:none\"
                        xmlBody += "	<tr>";
                        xmlBody += "		<td colspan=\"2\" align=\"center\" width=\"30\"  style=\"font-size: 12pt;\">" + image_tag + "<\/td>";
                        xmlBody += "	<\/tr>";
                        xmlBody += "	<tr>";
                        xmlBody += "		<td colspan=\"2\" align=\"center\" width=\"30\"  style=\"font-size: 20pt;\">Statement of Account<\/td>";
                        xmlBody += "	<\/tr>";
                        xmlBody += "	<tr>";
                        xmlBody += "		<td align=\"left\" width=\"30\"  style=\"font-size: 11pt;\"><b>" + xml.escape({
                            xmlText: s_customer_name
                        }) + "</b><br />" + xml.escape({
                            xmlText: s_customer_address
                        }) + "<\/td>"; // style=\"font-size: 12pt;\"
                        xmlBody += "		<td align=\"center\" valign=\"bottom\" width=\"30\"  style=\"font-size: 11pt;\"><b>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </b>" + d_today + " <br /> <b> Currency &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </b>" + s_currency + "<br /> <b>Subsidiary &nbsp;&nbsp;&nbsp;&nbsp; : </b>" + s_customer_subsidiary + "<\/td>";
                        xmlBody += "	<\/tr>";
                        xmlBody += "	<tr>";
                        xmlBody += "		<td align=\"left\" width=\"30\" style=\"font-size: 11pt;\"><b>Bill To: </b><\/td>"; // style=\"font-size: 12pt;\"
                        xmlBody += "		<td align=\"left\" valign=\"bottom\" width=\"30\" style=\"font-size: 11pt;\"><br/><b>From Date&nbsp;:  </b>" + startdate + "<br/><b>To Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:  </b>" + enddate + "<\/td>";
                        xmlBody += "	<\/tr>";
                        xmlBody += "<\/table>";

                        xmlBody += "<table align=\"center\" width=\"100%\"  border=\"0.1\" style=\"table-layout: fixed\">"; // style=\"border-top-style:none;border-bottom-style:none;border-right-style:none;border-left-style:none\"
                        xmlBody += "<thead>";
                        xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"7%\" align=\"center\" colspan=\"1\" ><b>Date</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"28%\" align=\"center\" colspan=\"1\" ><b>Description</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" ><b>Paid</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" ><b>Charged</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" ><b>Running Balance</b><BR/></td>";
                        xmlBody += "</tr>";
                        xmlBody += "</thead>";


                        xmlBody += "<tbody>";

                        var blank = '-';
                        var description = 'Opening Balance';

                        xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >" + openingBalanceDate + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" ><b>" + xml.escape({
                            xmlText: description
                        }) + "</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" ><b>" + openingBalance + "</b></td>";
                        xmlBody += "</tr>";




                        if (openingBalance)
                            i_total_amount = parseFloat(openingBalance);

                        var balance = 0;
                        var debitTotal = 0;
                        debitTotal = parseFloat(debitTotal);
                        var creditTotal = 0;
                        creditTotal = parseFloat(creditTotal);
                        var recordCount = 0;

                        //var search_cs = search.load({ id: 'customsearch_soa_detailed_data'});
                        var search_cs = search.load({
                            id: 'customsearch_soa_detailed_data_3'
                        });
                        //if(search_customerStatement)
                        {
                            //Add Filter to search 
                            search_cs.filters.push(search.createFilter({
                                name: 'name',
                                operator: search.Operator.ANYOF,
                                values: i_customerId
                            }));
                            search_cs.filters.push(search.createFilter({
                                name: 'trandate',
                                operator: search.Operator.ONORAFTER,
                                values: startdate
                            }));
                            search_cs.filters.push(search.createFilter({
                                name: 'trandate',
                                operator: search.Operator.ONORBEFORE,
                                values: enddate
                            }));

                            var resultSet = search_cs.run().getRange({
                                start: 0,
                                end: 1000
                            });
                            log.debug('resultSet - ' + resultSet, '#length- ' + resultSet.length);

                            if (resultSet) {
                                length = resultSet.length;

                                for (var counter = 0; counter < length; counter++) {
                                    var searchResult = resultSet[counter];

                                    var s_description = searchResult.getValue(resultSet[counter].columns[7]);
                                    //log.debug("description-->", s_description);
                                    var i_debit = searchResult.getValue(resultSet[counter].columns[5]);
                                    if (!i_debit)
                                        i_debit = '';
                                    var i_credit = searchResult.getValue(resultSet[counter].columns[6]);
                                    if (!i_credit)
                                        i_credit = '';

                                    var i_sum_amount = searchResult.getValue(resultSet[counter].columns[3]);
                                    var d_date = searchResult.getValue(resultSet[counter].columns[1]);
                                    log.debug('SS Details ', 'Description: ' + s_description + '#i_debit: ' + i_debit + '#i_credit: ' + i_credit + '#i_sum_amount:' + i_sum_amount + '#d_date: ' + d_date);


                                    /*  if(i_credit)
                                     {
                                     	
                                     	creditTotal = parseFloat(creditTotal) - parseFloat(i_credit); // +
                                     }
                                     	
                                     if(i_debit)
                                     {
                                     	
                                     	debitTotal = parseFloat(debitTotal) + parseFloat(i_debit); // +
                                     }	 */

                                    //log.debug('SS Total','creditTotal: '+creditTotal+'#debitTotal: '+debitTotal+'#i_total_amount: '+i_total_amount);


                                    //if(i_debit && i_credit)
                                    {
                                        if (i_credit) {
                                            i_total_amount = parseFloat(i_total_amount) - parseFloat(i_credit); // +
                                            i_total_amount = parseFloat(i_total_amount).toFixed(2);
                                            xmlBody += "<tr>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >" + xml.escape({
                                                xmlText: d_date
                                            }) + "</td>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" >" + xml.escape({
                                                xmlText: s_description
                                            }) + "</td>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + xml.escape({
                                                xmlText: i_credit
                                            }) + "</td>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + xml.escape({
                                                xmlText: blank
                                            }) + "</td>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" >" + i_total_amount + "</td>";
                                            xmlBody += "</tr>";
                                        }

                                        if (i_debit) {
                                            i_total_amount = parseFloat(i_total_amount) + parseFloat(i_debit); //-
                                            i_total_amount = parseFloat(i_total_amount).toFixed(2);
                                            xmlBody += "<tr>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >" + xml.escape({
                                                xmlText: d_date
                                            }) + "</td>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" >" + xml.escape({
                                                xmlText: s_description
                                            }) + "</td>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + xml.escape({
                                                xmlText: blank
                                            }) + "</td>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + xml.escape({
                                                xmlText: i_debit
                                            }) + "</td>";
                                            xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" >" + i_total_amount + "</td>";
                                            xmlBody += "</tr>";
                                        }
                                    }
                                    /*     else
	    	                    {
	    	                    	 	xmlBody += "<tr>";
	    	    	        			xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >"+  xml.escape({xmlText :d_date})+"</td>";
	    	    	        			xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" >"+ xml.escape({xmlText :s_description})+"</td>";
	    	    	        			xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >"+ xml.escape({xmlText :i_credit})+"</td>";
	    	    	        			xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >"+ xml.escape({xmlText :i_debit})+"</td>";
	    	    	        			xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" >"+ i_total_amount+"</td>";
	    	    	        			xmlBody += "</tr>";
	    	                    }      */

                                }


                            }

                            //var currentBalance = parseFloat(openingBalance) + parseFloat(i_total_amount);
                            //currentBalance = Math.round(currentBalance*100)/100;
                            currentBalance = parseFloat(i_total_amount).toFixed(2);
                            if (!currentBalance || currentBalance == undefined || currentBalance == NaN)
                                currentBalance = 0;
                            log.audit('currentBalance = ' + currentBalance);
                            log.debug('SS Total', 'creditTotal: ' + creditTotal + '#debitTotal: ' + debitTotal + '#i_total_amount: ' + i_total_amount);

                            var blank = '-';
                            var endDescription = 'Closing Balance';
                            var newbalance = ((currentBalance));
                            xmlBody += "<tr>";
                            xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >" + enddate + "</td>";
                            xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" ><b>" + xml.escape({
                                xmlText: endDescription
                            }) + "</b></td>";
                            xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                                xmlText: blank
                            }) + "</td>";
                            xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                                xmlText: blank
                            }) + "</td>";
                            xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" ><b>" + currentBalance + "</b></td>";
                            xmlBody += "</tr>";

                            /*
	        			if(currentBalance < 0)
	        			{
	        				var blank = '-';
	        				var endDescription = 'Closing Balance';
	        				var newbalance = (-(currentBalance));
	        				xmlBody += "<tr>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >"+ xml.escape({xmlText :blank})+"</td>";
	            			xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" >"+ xml.escape({xmlText :endDescription})+"</td>";
	            			xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >"+ xml.escape({xmlText :blank})+"</td>";
	            			xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >"+ newbalance+"</td>";
	            			xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" >"+ xml.escape({xmlText :blank})+"</td>";
	        				xmlBody += "</tr>";
	        			} // END if(currentBalance < 0)
	        			else if(currentBalance > 0)
	        			{
	        				var blank = '-';
	        				var endDescription = 'Closing Balance';
	        				xmlBody += "<tr>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\">"+xml.escape({xmlText :blank})+"</td>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\">"+xml.escape({xmlText :endDescription})+"</td>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\">"+currentBalance+"</td>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\">"+xml.escape({xmlText :blank})+"</td>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\">"+xml.escape({xmlText :blank})+"</td>";
	        				xmlBody += "</tr>";
	        			} // END else if(currentBalance > 0)
	        			else
	        			{
	        				var blank = '-';
	        				var endDescription = 'Closing Balance';
	        				xmlBody += "<tr>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\">"+xml.escape({xmlText :blank})+"</td>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\">"+xml.escape({xmlText :endDescription})+"</td>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\">"+xml.escape({xmlText :blank})+"</td>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\">"+xml.escape({xmlText :blank})+"</td>";
	        				xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\">"+currentBalance+"</td>";
	        				xmlBody += "</tr>";
	        			} // END else
	    	        	*/
                        }

                        xmlBody += "<\/tbody>";
                        xmlBody += "<\/table>";
                        xmlBody += "<p>Contents of this Statement of Account (SOA) shall deemed be considered correct and accepted, if no error is reported in writing to the Company within 10 days of receipt of SOA. In the event of any discrepancy in SOA, the parties can mutually discuss such discrepancy and arrive at a resolution as per Company’s Policy.</p>"
                        xmlBody += "<p align=\"center\"><i>This statement is system generated and does not require any signature.</i></p>"
                        xmlBody += "<br/><br/>";

                        xmlBody += "</body>";
                        xmlBody += "</pdf>";


                        //Updated Code for Dyanamic folder - Sunil K --> 23/01/2023

                        if (i_customerId) {
                            var o_custObj = record.load({
                                type: record.Type.CUSTOMER,
                                id: i_customerId,
                                isDynamic: true
                            })

                            var c_folderId = o_custObj.getValue({
                                fieldId: 'custentity_folderinternalid'
                            });
                            log.debug("Folder Id-->", c_folderId);
							
							/* var soaemail = o_custObj.getValue({
                                fieldId: 'custentity_mhl_soa_support_email'
                            });
                            log.debug("soaemail-->", soaemail); */
							
							var soaemail = "feedback@gmail.com";
							
							var custid = o_custObj.getValue({
                                fieldId: 'entityid'
                            });
                            log.debug("custId-->", custid);
							
							var custname = o_custObj.getValue({
                                fieldId: 'companyname'
                            });
                            log.debug("custName-->", custname);
							
							var finalname = "("+ custid + "-" + custname + ")";
							log.debug("finalname", finalname);

							//Uncomment code Avinash 
                            /* var c_custEmail = o_custObj.getValue({
                            	fieldId: 'custentity_invoicingemail'
                            });
                            log.debug("Customer Email-->", c_custEmail) */
                            //;

                        }

                        //==============================================

                       /*  var qText = ['Q1', 'Q2', 'Q3', 'Q4'];

                        var now = new Date();
                        var quarter = Math.floor((now.getMonth() / 3));
                        log.debug("quarter-->", quarter);
                        quarter = parseInt(quarter) - parseInt(1);
                        log.debug("quarter1-->", quarter);
                        var quarterName = qText[quarter];
                        log.debug("quarterName-->", quarterName);
                        var firstDate = new Date(now.getFullYear(), quarter * 3, 1);
                        var endDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 3, 0);

                        var currYear = now.getFullYear();

                        //SOA_2022_Q3_clientname
                        //var s_req_soa_file_name = "SOA _" + currYear + "_" + quarterName + "_" + s_customer_name + ".pdf";
                        var s_req_soa_file_name = "SOA _"+s_customer_name+"_for Period_"+d_from_date+"_"+d_to_date+".pdf"; */
						
						var qText = ['Q3','Q4','Q1','Q2'];
	                    var now = new Date();
	                    log.debug("noe", now); // OCT 9
	                    log.debug("month", now.getMonth()); // 9
	                    log.debug("floor", Math.floor(now.getMonth())); //9
	                    var quarter = Math.floor((now.getMonth() /3));//3
	                    //var quarter1 = Math.floor((now.getMonth()+parseInt(1)));//3
	                    log.debug("quarter-->",quarter);
	                    quarter  = parseInt(quarter);//2=Q3
	                    log.debug("quarter------->",quarter);
	                    /* if(quarter==-1){
	                        quarter = 2;
	                    } */
						
	                    var quarterName = qText[quarter];
	                    log.debug("quarterName-->",quarterName);
	                    var firstDate = new Date(now.getFullYear(), quarter * 3, 1);
	                    var endDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 3, 0);
	                    if(quarterName == 'Q3'){
	                    var currYear = now.getFullYear()-parseInt(1);
							currYear = currYear.toString().substring(2, 4);
							log.debug("---------hjdhwdjw",currYear.toString()+"  "+currYear);
						var fy_Year = now.getFullYear();
							fy_Year = fy_Year.toString().substring(2, 4);
	                    }else{
						var currYear = now.getFullYear();
							currYear = currYear.toString().substring(2, 4);
							var fy_Year = now.getFullYear();
							fy_Year = fy_Year.toString().substring(2, 4);
						}
	
	                    //SOA_2022_Q3_clientname currYear SOA-FY22-23-Q3-CL001
	                  var s_req_soa_file_name = "SOA-FY"+currYear+"-"+fy_Year+"-"+quarterName+"-"+s_customer_name+".pdf";


					
                        var o_file = render.xmlToPdf({
                            xmlString: xmlBody
                        });

                        //var o_file = render.xmlToPdf({xmlString:xmlBody});	
                        o_file.name = s_req_soa_file_name;
                        o_file.description = "File moved to SFTP";
                        o_file.isOnline = true;
                        //o_file.folder = c_folderId; //i_folder_id; 
                        o_file.folder = 911680;	//i_folder_id; 

                        var i_soa_file_Id = o_file.save();

                        log.debug("Generated PDFs", i_soa_file_Id)

                        //Updating Code for Email Sending  23/01/2023

                        var accountLink = url.resolveDomain({
                            hostType: url.HostType.APPLICATION
                        });

                        var o_fileObj = file.load({
                            id: i_soa_file_Id
                        });

                        var URL = o_fileObj.url
                        var finalURL = 'https://' + accountLink + URL

                        log.debug("finalURL", finalURL)
                       /*  var c_custEmail ='sunil.khutawad@yantrainc.com,avinash.lahane@yantrainc.com,metropolis@yantrainc.com'; */
						//Comment this code Avinash
                        var c_custEmail = 'avinash.lahane@yantrainc.com,sunil.khutawad@yantrainc.com';
						
                        if (i_soa_file_Id) {

                            var template = record.load({
                                type: record.Type.EMAIL_TEMPLATE,
                                id: 15
                            });
                            var content = template.getValue({
                                fieldId: 'content'
                            });

                            var subject = template.getValue({
                                fieldId: 'subject'
                            });

                            var bodyString = content;
							

                            bodyString = bodyString.replace("{{invoice_link}}", finalURL);
                            bodyString = bodyString.replace("{transaction.enddate}", enddate);
                            bodyString = bodyString.replace("{transaction.startdate}", startdate);
                            bodyString = bodyString.replace("{transaction.soaemail}", soaemail);
                            //bodyString = bodyString.replace("{transaction.entityid}", custid);
                            //bodyString = bodyString.replace("{transaction.companyname}", custname);
                            bodyString = bodyString.replace("{transaction.companyname}", finalname);
                            subject = subject.replace("{transaction.enddate}", enddate);
                            subject = subject.replace("{transaction.startdate}", startdate);

                            try {
                                //92620103 - newly created employee
                                if (c_custEmail) {
                                    email.send({
                                        author: 118,
                                        recipients: c_custEmail,
                                        subject: subject,
                                        body: bodyString
                                    });
                                }
                            } catch (e) {
                                log.error("Email Sending error on "+ custid , e.message);
                            }
                        }
						//uncomment Avinash
						//o_customer.setValue({fieldId:'custentitymhl_sent_soa',value:true})
						
						var o_customerId = o_customer.save({
                              enableSourcing: true,
                              ignoreMandatoryFields: true
                        });


						//o_customer.save();

                        //============================================

                        /* response.writeFile({
                            file: o_file,
                            isInline: true
                        }); */
                    } else if (download_fileType == 'csv') {
                        var s_req_soa_file_name = "Statement of Account_" + s_customer_name + "_for Period_" + d_from_date + "_" + d_to_date + ".csv";
                        var s_soa_Contents = 'Statement of Accounts \n';
                        s_soa_Contents += 'Customer ID: ' + ' , ' + s_customer_name + ' , ' + ' ' + ' , ' + ' ' + ' , ' + 'Date' + ' , ' + d_today + '\n';
                        s_soa_Contents += 'Customer Name:  ' + ' , ' + s_company_name + ' , ' + ' ' + ' , ' + ' ' + ' , ' + 'Subsidiary' + ' , ' + s_customer_subsidiary + '\n';
                        s_soa_Contents += ' ' + ' , ' + ' ' + ' , ' + ' ' + ' , ' + ' ' + ' , ' + 'From Date' + ' , ' + startdate + '\n';
                        s_soa_Contents += ' ' + ' , ' + ' ' + ' , ' + ' ' + ' , ' + ' ' + ' , ' + 'To Date' + ' , ' + enddate + '\n\n';
                        s_soa_Contents += 'Date, Description, Paid, Charged, Running Balance \n';

                        var blank = '-';
                        var description = 'Opening Balance';

                        var s_String = openingBalanceDate + ',' + description + ',' + blank + ',' + blank + ',' + openingBalance;
                        s_soa_Contents += s_String + '\n';

                        if (openingBalance)
                            i_total_amount = parseFloat(openingBalance);

                        var balance = 0;
                        var debitTotal = 0;
                        debitTotal = parseFloat(debitTotal);
                        var creditTotal = 0;
                        creditTotal = parseFloat(creditTotal);
                        var recordCount = 0;

                        var search_cs = search.load({
                            id: 'customsearch_soa_detailed_data'
                        });

                        search_cs.filters.push(search.createFilter({
                            name: 'name',
                            operator: search.Operator.ANYOF,
                            values: i_customerId
                        }));
                        search_cs.filters.push(search.createFilter({
                            name: 'trandate',
                            operator: search.Operator.ONORAFTER,
                            values: startdate
                        }));
                        search_cs.filters.push(search.createFilter({
                            name: 'trandate',
                            operator: search.Operator.ONORBEFORE,
                            values: enddate
                        }));

                        var resultSet = search_cs.run().getRange({
                            start: 0,
                            end: 1000
                        });
                        log.debug('resultSet - ' + resultSet + '#length- ' + resultSet.length);

                        if (resultSet) {
                            length = resultSet.length;

                            if (length > 0) {
                                for (var counter = 0; counter < length; counter++) {
                                    var searchResult = resultSet[counter];

                                    var s_description = searchResult.getValue(resultSet[counter].columns[7]);
                                    var i_debit = searchResult.getValue(resultSet[counter].columns[5]);
                                    if (!i_debit)
                                        i_debit = '';
                                    var i_credit = searchResult.getValue(resultSet[counter].columns[6]);
                                    if (!i_credit)
                                        i_credit = '';
                                    var i_sum_amount = searchResult.getValue(resultSet[counter].columns[3]);
                                    var d_date = searchResult.getValue(resultSet[counter].columns[1]);
                                    //log.debug( 'SS Details ','Description: '+s_description+'#i_debit: '+i_debit+'#i_credit: '+i_credit+'#i_sum_amount:'+i_sum_amount+'#d_date: '+d_date);


                                    if (i_credit) {
                                        i_total_amount = parseFloat(i_total_amount) - parseFloat(i_credit); // +
                                        i_total_amount = parseFloat(i_total_amount).toFixed(2);
                                        creditTotal = parseFloat(creditTotal) - parseFloat(i_credit); // +
                                    }

                                    if (i_debit) {
                                        i_total_amount = parseFloat(i_total_amount) + parseFloat(i_debit); //-
                                        i_total_amount = parseFloat(i_total_amount).toFixed(2);
                                        debitTotal = parseFloat(debitTotal) + parseFloat(i_debit); // +
                                    }

                                    //log.debug('SS Total','creditTotal: '+creditTotal+'#debitTotal: '+debitTotal+'#i_total_amount: '+i_total_amount);


                                    if (i_debit && i_credit) {
                                        if (i_credit) {
                                            var s_String = d_date + ',' + s_description + ',' + i_credit + ',' + blank + ',' + i_total_amount;
                                            s_soa_Contents += s_String + '\n';
                                        }

                                        if (i_debit) {
                                            var s_String = d_date + ',' + s_description + ',' + blank + ',' + i_debit + ',' + i_total_amount;
                                            s_soa_Contents += s_String + '\n';
                                        }
                                    } else {
                                        var s_String = d_date + ',' + s_description + ',' + i_credit + ',' + i_debit + ',' + i_total_amount;
                                        s_soa_Contents += s_String + '\n';
                                    }

                                }
                            } else {
                                var s_String = 'No Results Found';
                                s_soa_Contents += s_String + '\n';
                            }

                        }

                        currentBalance = parseFloat(i_total_amount).toFixed(2);
                        if (!currentBalance || currentBalance == undefined || currentBalance == NaN)
                            currentBalance = 0;
                        log.audit('currentBalance = ' + currentBalance);
                        log.debug('SS Total', 'creditTotal: ' + creditTotal + '#debitTotal: ' + debitTotal + '#i_total_amount: ' + i_total_amount);

                        var blank = '-';
                        var endDescription = 'Closing Balance';
                        var newbalance = ((currentBalance));
                        //var s_String = ''+','+ endDescription +','+ '' +','+ '' +','+ currentBalance;	
                        var s_String = enddate + ',' + endDescription + ',' + '' + ',' + '' + ',' + currentBalance;
                        s_soa_Contents += s_String + '\n';


                        var fileObj = file.create({
                            name: s_req_soa_file_name,
                            fileType: file.Type.CSV,
                            contents: s_soa_Contents
                        });
                        // fileObj.folder = '';	//i_folder_id; 

                        //var i_soa_file_Id = fileObj.save();
                        //log.error('Success POST','Success SOA File ID - ' + i_soa_file_Id);	


                        /* response.writeFile({
                            file: fileObj,
                            isInline: true
                        }); */
                        //return; 
                    } // else if(download_fileType == 'csv')

                } catch (error) {
                    log.error('Catch', error);
                }



                //====================================


                /* var headerObj = {
						name: 'Accept-Language',
						value: 'en-us'
					};
					
                    var response = https.request({
                        method: https.Method.GET,
                        url: urlToCall,
						body: 'My REQUEST Data',
						headers: headerObj
                    }) 					
					
					log.debug("End") */

            } catch (ex) {
                log.error({
                    title: 'Json file doesnt getting',
                    details: ex
                });
            }
        }


        function formatDate(today) {
            //log.debug('today: '+today);
            var responseDate = format.parse({
                value: today,
                type: format.Type.DATE
            });
            var finalresponseDate = format.format({
                value: responseDate,
                type: format.Type.DATE
            });
            //log.debug('finalresponseDate: '+finalresponseDate);
            return finalresponseDate;
        }


        function getOpeningBalance(i_customerId, startdate) ////custCreatedDate
        {
            log.debug('Inside getOpeningBalance', '=========');

            var search_vs = search.load({
                id: 'customsearch_soa_opening_balance'
            });
            //if(search_vendorStatement)
            {
                //Add Filter to search 
                var filter = new Array();
                var filter1 = search.createFilter({
                    name: 'name',
                    operator: search.Operator.ANYOF,
                    values: i_customerId
                });
                search_vs.filters.push(filter1);
                var filter2 = search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.BEFORE,
                    values: startdate
                }); //
                search_vs.filters.push(filter2);
                /*var filter4 = search.createFilter({ name: 'trandate', operator: search.Operator.ONORBEFORE, values: startdate});//
                search_vs.filters.push(filter4);
                var filter5 = search.createFilter({ name: 'approvalstatus', operator: search.Operator.ANYOF, values: parseInt(2)});
                search_vs.filters.push(filter5);*/

                var search_customerStatement = search_vs.run().getRange({
                    start: 0,
                    end: 1
                });
                //log.debug('search_customerStatement - '+search_customerStatement+'#length- '+search_customerStatement.length);
                var breakFlag = 0;
                var amount = 0;
                if (search_customerStatement != null || search_customerStatement != '') {
                    var length = search_customerStatement.length;
                    //log.debug('Search result length1 = ' +length);

                    for (var counter = 0; counter < length; counter++) {
                        var result = search_customerStatement;

                        var internalID = '';

                        internalID = result[counter].getValue({
                            name: "internalid"
                        });
                        amount = result[counter].getValue({
                            name: "fxamount",
                            summary: "SUM"
                        });
                        if (amount) {
                            amount = parseFloat(amount);
                        }

                        log.debug('Search Data', 'amount- ' + amount);
                    } //	for (var counter = 0; counter < search_customerStatement.length; counter++)
                } //if(search_customerStatement != null || search_customerStatement != '')
                amount = parseFloat(amount).toFixed(2);
                var getOpeningBalancefunction = amount;
                log.debug('End getOpeningBalance', '========= amount: ' + amount);
                return getOpeningBalancefunction;
            }
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

            /* var urlToCall = url.resolveScript({
                            scriptId: 'customscript_mhl_sut_soa_report_result',
                            deploymentId: 'customdeploy_mhl_sut_soa_report_result',
                            returnExternalUrl: false
                    }); */

        }
        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
