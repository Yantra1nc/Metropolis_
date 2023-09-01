/**
 * Script Name: 
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL YIL Summary Bill
 * File Name: MHL YIL Summary Bill.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: Summary Bill
 *********************************************************** */

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

                return search.load({
                    id: 'customsearch_summary_customer_list'
                });

            } catch (e) {
                log.debug({
                    title: 'Error Occured while collecting JSON',
                    details: e
                });
            }
        }

        function map(context) {
           
        }
		function reduce(context) {
			try {
			/* log.debug("reduce KEY", context.key);
			log.debug("reduce Data", context.values);
			log.debug("reduce Length", context.values.length); */
			 var data = JSON.stringify(context.values); //read the data
			//log.debug("Reduce data",data);
            var i_customerId = context.key;
			//log.debug("Reduce i_customerId",i_customerId);
            //var i_customerId = data.id;
			//log.debug("Reduce i_customerId",i_customerId);
			
			 

                var now = new Date();
                var quarter = Math.floor((now.getMonth() / 3));
                quarter = parseInt(quarter) - parseInt(1)
                var firstDate = new Date(now.getFullYear(), quarter * 3, 1);
                var endDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 3, 0);

                //log.debug("First Date", firstDate);
                //log.debug("End Date", endDate);

                var d_from_date = format.format({
                    value: firstDate,
                    type: format.Type.DATE
                });
                //log.debug("d_from_date -->", d_from_date);

                var d_to_date = format.format({
                    value: endDate,
                    type: format.Type.DATE
                });
                //log.debug("d_to_date -->", d_to_date);

                var download_fileType = 'pdf';
				var srNo=0;


                try {
                    var request = context.request;
                    var response = context.response;

                    var i_total_amount = 0;
                    var openingBalance = 0;
                    var currentBalance = 0;


                    var startdate = formatDate(d_from_date);
                    var enddate = formatDate(d_to_date);

                    //	var startdate = format.format({value:d_from_date,type:format.Type.DATE});
                    //	var enddate = format.format({value:d_to_date,type:format.Type.DATE});
                    //log.debug('Converted Date - ' + startdate + '#enddate- ' + enddate);




                    var configRecObj = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    var companyName = configRecObj.getValue({
                        fieldId: 'companyname'
                    });
                    companyName = xml.escape({
                        xmlText: companyName
                    })
                    //log.debug('companyName - ' + companyName);


                    var today = new Date();
                    //var d_today = formatDate(today);
					
					var ConvertedDt = new Date(today);
					//var ConvertedDt = convert_date(d_date);
					//log.debug("ConvertedDt", ConvertedDt)
					var day = ConvertedDt.getDate();
					//log.debug("day",day);
					var month = ConvertedDt.getMonth();
					//log.debug("month",month);
					var year = ConvertedDt.getFullYear();
					//log.debug("year",year);
					
					var Start_Date = new Date(year, month-1, 1);
					var fromDate = formatDate(Start_Date);
					//log.debug("fromDate",fromDate);
					//var fromDate = "01/02/2023";
					
					var EndDate = new Date(year, month, 0);
					var d_today = formatDate(EndDate);
					//log.debug("d_today",d_today);
					//log.debug("EndDate",EndDate);
					//return false;
                    //var d_today = "28/02/2023";

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

                    //log.debug("i_logo_id", i_logo_id)
                    if (i_logo_id) {
                        var fileObj = file.load({
                            id: i_logo_id
                        });
                        s_logo_url = fileObj.url;
                        s_logo_url = 'https://4120343-sb1.app.netsuite.com' + s_logo_url;
                        s_logo_url = s_logo_url.replace(/&/g, "&amp;");
                        // replace & with &amp;

                    }
					
					 var now = new Date();

                            var month = Math.floor((now.getMonth())); //3
							var year = now.getFullYear();
					var customer_name_s="Console Invoice No. "+s_customer_name+"-"+month+"-"+year
                    var image_tag = '<img src="' + s_logo_url + '"/>';

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
                        xmlBody += "		<td colspan=\"2\" align=\"center\" width=\"30\"  style=\"font-size: 20pt;\">Console Invoice<\/td>";
                        xmlBody += "	<\/tr>";
                        xmlBody += "	<tr>";
                        xmlBody += "		<td align=\"left\" width=\"30\"  style=\"font-size: 11pt;\"><b>" + xml.escape({
                            xmlText: customer_name_s
                        }) + "</b><br />" +"<b>" + xml.escape({
                            xmlText: s_company_name
                        }) + "</b><br />"+ xml.escape({
                            xmlText: s_customer_address
                        }) + "<\/td>"; // style=\"font-size: 12pt;\"
                        xmlBody += "		<td align=\"center\" valign=\"bottom\" width=\"30\"  style=\"font-size: 11pt;\"><b>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </b>" + d_today + " <br /><b>Period &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </b>" + fromDate + " to " + d_today + " <br /> <b> Currency &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </b>" + s_currency + "<br /> <b>Subsidiary &nbsp;&nbsp;&nbsp;&nbsp; : </b>" + s_customer_subsidiary + "<\/td>";
                        xmlBody += "	<\/tr>";

                        xmlBody += "<\/table>";

                        xmlBody += "<table align=\"center\" width=\"100%\"  border=\"0.1\" style=\"table-layout: fixed\">"; // style=\"border-top-style:none;border-bottom-style:none;border-right-style:none;border-left-style:none\"
                        xmlBody += "<thead>";
                        xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"7%\" align=\"center\" colspan=\"1\" ><b>Sr.No</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" ><b>Client ID</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"25%\" align=\"center\" colspan=\"1\" ><b>Client Name</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" ><b>Sub Invoice No.</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" ><b>Invoice Date</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" ><b>Gross Amount</b><BR/></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" ><b>Discount</b><BR/></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" ><b>Net Amount</b><BR/></td>";
                        xmlBody += "</tr>";
                        xmlBody += "</thead>";


                        xmlBody += "<tbody>";

                        var blank = '-';
                        var description = 'Opening Balance';

                        //var search_cs = search.load({ id: 'customsearch_soa_detailed_data'});

                        var Net_Total = 0;
						var gross_Total = 0;
                        var discount_Total = 0;
   	
						var customerSearchObj = search.create({
						   type: "customer",
						   filters:
						   [
							  ["custentity_mhl_cus_org","anyof","1639"], 
							  "AND", 
							  ["custentity_mhl_cust_parent_client_code","contains",s_customer_name]
						   ],
						   columns:
						   [
							  search.createColumn({name: "internalid", label: "Internal ID"}),
							  search.createColumn({
								 name: "entityid",
								 sort: search.Sort.ASC,
								 label: "ID"
							  }),
							  search.createColumn({name: "companyname", label: "Company Name"})
						   ]
						});
						var resultSet = customerSearchObj.run().getRange({
                            start: 0,
                            end: 1000
                        });
                        //log.debug('resultSet - ' + resultSet, '#length- ' + resultSet.length);

                        if (resultSet) {

                            for (var counter = 0; counter < resultSet.length; counter++) {
								var s_internalID=resultSet[counter].getValue({name: "internalid", label: "Internal ID"});
								//log.debug("s_internalID",s_internalID);
								var s_clientCode=resultSet[counter].getValue({name: "entityid",sort: search.Sort.ASC,label: "ID"});
								//log.debug("s_clientCode",s_clientCode);
								var s_clientName=resultSet[counter].getValue({name: "companyname", label: "Company Name"});
								//log.debug("s_clientName",s_clientName);
								
								 var search_inv = search.load({
										id: 'customsearch_summary_inv_list'
									});

									search_inv.filters.push(search.createFilter({
										name: 'internalid',
										join: 'customer',
										operator: 'is',
										values: s_internalID
									}));


									var resultSetinv = search_inv.run().getRange({
										start: 0,
										end: 1
									});
									//log.debug("resultSetinv",resultSetinv);
							if (resultSetinv == '') {
										srNo=parseInt(srNo)+parseInt(1);
										var nullAmount='0.00'
										//log.debug("***********BlankLoop******");
								  xmlBody += "<tr>";
									xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + srNo + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >" + xml.escape({
                                        xmlText: s_clientCode
                                    }) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" >" + xml.escape({
                                        xmlText: s_clientName
                                    }) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                                        xmlText: blank
                                    }) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                                        xmlText: blank
                                    }) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + nullAmount + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + nullAmount + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" >" + nullAmount + "</td>";
                                    xmlBody += "</tr>";
										
									}
									
						else{
                            var length = resultSetinv.length;
							log.debug('Invoice length',length);
                            for (var counter1 = 0; counter1 < length; counter1++) {
                                var searchResult = resultSetinv[counter1];

                                var child_client_code = searchResult.getValue(resultSetinv[counter1].columns[0]);
                               // log.debug("child_client_code", child_client_code);
                                var child_client_name = searchResult.getValue(resultSetinv[counter1].columns[1]);
                               // log.debug("child_client_name", child_client_name);
                                var inv_no = searchResult.getValue(resultSetinv[counter1].columns[2]);
                               // log.debug("inv_no", inv_no);
                                var inv_date = searchResult.getValue(resultSetinv[counter1].columns[3]);
                               // log.debug("inv_date", inv_date);
                                var Inv_net_Amount = searchResult.getValue(resultSetinv[counter1].columns[4]);
                              //  log.debug("Inv_net_Amount", Inv_net_Amount);
                                var parent_client = searchResult.getValue(resultSetinv[counter1].columns[5]);
                              //  log.debug("parent_client", parent_client);
								var Inv_ID = searchResult.getValue(resultSetinv[counter1].columns[6]);
                              //  log.debug("Inv_ID", Inv_ID);
								
					var customrecord_b2b_vid_detailsSearchObj = search.create({
					   type: "customrecord_b2b_vid_details",
					   filters:
					   [					 
						  ["custrecord_invoice_number","anyof",Inv_ID],
                           "AND",
							["custrecord_reference_b2b.custrecord_cancelled","is","F"]
					   ],
					   columns:
					   [
						search.createColumn({
							 name: "custrecord_mhl_vid_org",
							 summary: "GROUP",
							 sort: search.Sort.ASC,
							 label: "VID ORG"
						  }),
						  search.createColumn({
							 name: "custrecord_b2b_vid_amount",
							 summary: "SUM",
							 label: "Amount "
						  }),
						  search.createColumn({
							 name: "custrecord_netamount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Net Amount"
						  }),
						  search.createColumn({
							 name: "custrecord_grossamount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Gross Amount"
						  }),
						  search.createColumn({
							 name: "custrecord_discount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Discount"
						  })
					   ]
					});
					var totalAmount = 0;
					var grossAmount = 0;
					var discount = 0;
					var t=0;
					var searchResultCount = customrecord_b2b_vid_detailsSearchObj.runPaged().count;
					//log.debug("customrecord_b2b_vid_detailsSearchObj result count",searchResultCount);
					customrecord_b2b_vid_detailsSearchObj.run().each(function(result){
					   // .run().each has a limit of 4,000 results
					   totalAmount = result.getValue({
							 name: "custrecord_netamount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Net Amount"
						  });
						 // log.debug("totalAmount",totalAmount);
						  grossAmount = result.getValue({
							 name: "custrecord_grossamount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Gross Amount"
						  });
						 // log.debug("grossAmount",grossAmount);
						  discount = result.getValue({
							 name: "custrecord_discount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Discount"
						  });
						  //log.debug("discount",discount);
						
						t++;
					   return true;
					});
								

                                Net_Total += parseFloat(Inv_net_Amount);
                                gross_Total += parseFloat(grossAmount);
                                discount_Total += parseFloat(discount);
								
								Inv_net_Amount=parseFloat(Inv_net_Amount).toFixed(2);
								grossAmount=parseFloat(grossAmount).toFixed(2);
								discount=parseFloat(discount).toFixed(2);
								
								var Inv_net_Amount1=numberWithCommas(Inv_net_Amount);
								var grossAmount1=numberWithCommas(grossAmount);
								var discount1=numberWithCommas(discount);
								srNo=parseInt(counter)+parseInt(1);

                                if (child_client_code) {
                                    //i_total_amount = parseFloat(i_total_amount) - parseFloat(i_credit); // +
                                    //i_total_amount = parseFloat(i_total_amount).toFixed(2);
                                    xmlBody += "<tr>";
									xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + srNo + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >" + xml.escape({
                                        xmlText: child_client_code
                                    }) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" >" + xml.escape({
                                        xmlText: child_client_name
                                    }) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + xml.escape({
                                        xmlText: inv_no
                                    }) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + xml.escape({
                                        xmlText: inv_date
                                    }) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + grossAmount1 + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + discount1 + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" >" + Inv_net_Amount1 + "</td>";
                                    xmlBody += "</tr>";
                                }

                            }


                        }
									
								
							}
						
						}
						
						Net_Total = Net_Total.toFixed(2);
                        gross_Total = gross_Total.toFixed(2);
                        discount_Total = discount_Total.toFixed(2);
						
						var Net_Total1 = numberWithCommas(Net_Total)
						var gross_Total1 = numberWithCommas(gross_Total)
						var discount_Total1 = numberWithCommas(discount_Total)
						
						
                        xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
						xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" ><b>" + xml.escape({
                            xmlText: "Total"
                        }) + "</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" ><b>" + gross_Total1 + "</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" ><b>" + discount_Total1 + "</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" ><b>" +
                            Net_Total1 + "</b></td>";
                        xmlBody += "</tr>";


                        xmlBody += "<\/tbody>";
                        xmlBody += "<\/table>";
						
						
						xmlBody += "<p align=\"left\"><b>PAN NO:</b> AACCP1414E</p>"
                        xmlBody += "<br/>"; 
						
						xmlBody += "<table align=\"center\" width=\"100%\"  border=\"0.1\" style=\"table-layout: fixed\">";

						
                        xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"20%\" align=\"left\" colspan=\"1\" ><b>Account Name</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"80%\" align=\"left\" colspan=\"1\" >Metropolis Healthcare Limited</td>";
                        xmlBody += "</tr>";
						
						xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"20%\" align=\"left\" colspan=\"1\" ><b>Bank Name</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"80%\" align=\"left\" colspan=\"1\" >ICICI BANK</td>";
                        xmlBody += "</tr>";
						
						xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"20%\" align=\"left\" colspan=\"1\" ><b>Bank Address</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"80%\" align=\"left\" colspan=\"1\" >ICICI BANK LTD, SCO 18 &amp; 19, HUDA SHOPPING CENTRE, SECTOR-14, MARKET COMPLEX, GURGAON - 122001</td>";
                        xmlBody += "</tr>";
						
						xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"20%\" align=\"left\" colspan=\"1\" ><b>Account No.</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"80%\" align=\"left\" colspan=\"1\" >002105000594</td>";
                        xmlBody += "</tr>";
						
						xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"20%\" align=\"left\" colspan=\"1\" ><b>IFSC Code</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"80%\" align=\"left\" colspan=\"1\" >ICIC0000021</td>";
                        xmlBody += "</tr>";
						
						xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"20%\" align=\"left\" colspan=\"1\" ><b>Type of Account</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"80%\" align=\"left\" colspan=\"1\" >Current</td>";
                        xmlBody += "</tr>";
						
						xmlBody += "<\/table>";
						

                        xmlBody += "<p align=\"center\"><i>This statement is system generated and does not require any signature.</i></p>"
                        xmlBody += "<br/><br/>";

                        xmlBody += "</body>";
                        xmlBody += "</pdf>";


                        //Updated Code for Dyanamic folder - Sunil K --> 23/01/2023


                            var qText = ['Q1', 'Q2', 'Q3', 'Q4'];
                            var now = new Date();

                            var quarter = Math.floor((now.getMonth() / 3)); //3
                            var quarter1 = Math.floor((now.getMonth())); //3
                            //log.debug("quarter-->", quarter);
                            quarter = parseInt(quarter) - parseInt(1); //2=Q3
                            //log.debug("quarter1-->", quarter);
                            
                            var currYear = now.getFullYear();

                            //SOA_2022_Q3_clientname
                            var s_req_soa_file_name = "Console Invoice-" + currYear + "-" + quarter1 + "-" + s_customer_name + ".pdf";
                            //var s_req_soa_file_name = "Console Invoice-" + currYear + "-" + "2" + "-" + s_customer_name + ".pdf";



                            var o_file = render.xmlToPdf({
                                xmlString: xmlBody
                            });
	
                            o_file.name = s_req_soa_file_name;
                            o_file.isOnline = true;
                            o_file.folder = 1018197; //i_folder_id; 
                            //o_file.folder = 1272378; //i_folder_id; 
                           // o_file.folder = 1163937; //for Testing

                            var i_soa_file_Id = o_file.save();
							log.debug("i_soa_file_Id-->", i_soa_file_Id);
         
                    }
                } catch (error) {
                    log.error('Catch', error);
                }




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


		
		function numberWithCommas(x) {
    return x.toString().split('.')[0].length > 3 ? x.toString().substring(0,x.toString().split('.')[0].length-3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + x.toString().substring(x.toString().split('.')[0].length-3): x.toString();
}

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
           // map: map,
			reduce:reduce,
            summarize: summarize
        };

    });