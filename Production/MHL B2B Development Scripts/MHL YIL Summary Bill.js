/**
 * Script Name: 
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * Script Name: MHL YIL Summary Bill.js
 * Author: Avinash Lahane
 * Date: MAR 2023
 * Description: This script will Geneate Summary PDF for Delhi GNCT clients.
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


                    var today = new Date();
                    var d_today = formatDate(today);
                   // var d_today = "28/02/2023";

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
					
					 var now = new Date();
                            log.debug("noe", now);
                            log.debug("month", now.getMonth());
                            log.debug("floor", Math.floor(now.getMonth()));
                            var month = Math.floor((now.getMonth())); //3
                            log.debug("month-->", month);
							var year = now.getFullYear();
							log.debug("year-->", year);
					var customer_name_s="Console Invoice No. "+s_customer_name+"-"+month+"-"+year
                    var image_tag = '<img src="' + s_logo_url + '"/>';

                    /*    var openingBalanceDate = startdate;
                   // openingBalance = getOpeningBalance(i_customerId, startdate); ////custCreatedDate
                    if (!openingBalance || openingBalance == undefined || openingBalance == NaN)
                        openingBalance = 0;
 */

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
                        xmlBody += "		<td align=\"center\" valign=\"bottom\" width=\"30\"  style=\"font-size: 11pt;\"><b>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </b>" + d_today + " <br /> <b> Currency &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </b>" + s_currency + "<br /> <b>Subsidiary &nbsp;&nbsp;&nbsp;&nbsp; : </b>" + s_customer_subsidiary + "<\/td>";
                        xmlBody += "	<\/tr>";

                        xmlBody += "<\/table>";

                        xmlBody += "<table align=\"center\" width=\"100%\"  border=\"0.1\" style=\"table-layout: fixed\">"; // style=\"border-top-style:none;border-bottom-style:none;border-right-style:none;border-left-style:none\"
                        xmlBody += "<thead>";
                        xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"7%\" align=\"center\" colspan=\"1\" ><b>Client ID</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"28%\" align=\"center\" colspan=\"1\" ><b>Client Name</b></td>";
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

                        /*  xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" ><b>" + xml.escape({
                            xmlText: description
                        }) + "</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
						xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
						xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
						xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" ><b>"+ xml.escape({
                            xmlText: blank
                        }) + "</b></td>";
                        xmlBody += "</tr>"; */




                        //var search_cs = search.load({ id: 'customsearch_soa_detailed_data'});

                        var Net_Total = 0;
						var gross_Total = 0;
                        var discount_Total = 0;
                        var search_cs = search.load({
                            id: 'customsearch_summary_inv_list'
                        });

                        //Add Filter to search 
                        /*    search_cs.filters.push(search.createFilter({
                            name: "customer.custentity_mhl_cust_parent_client_code",
                            operator: search.Operator.ANYOF,
                            values: s_customer_name
                        }));  */

                        search_cs.filters.push(search.createFilter({
                            ‌
                            name: 'custentity_mhl_cust_parent_client_code',
                            join: 'customer',
                            operator: 'contains',
                            values: s_customer_name
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

                                var child_client_code = searchResult.getValue(resultSet[counter].columns[0]);
                                log.debug("child_client_code", child_client_code);
                                var child_client_name = searchResult.getValue(resultSet[counter].columns[1]);
                                log.debug("child_client_name", child_client_name);
                                var inv_no = searchResult.getValue(resultSet[counter].columns[2]);
                                log.debug("inv_no", inv_no);
                                var inv_date = searchResult.getValue(resultSet[counter].columns[3]);
                                log.debug("inv_date", inv_date);
                                var Inv_net_Amount = searchResult.getValue(resultSet[counter].columns[4]);
                                log.debug("Inv_net_Amount", Inv_net_Amount);
                                var parent_client = searchResult.getValue(resultSet[counter].columns[5]);
                                log.debug("parent_client", parent_client);
								var Inv_ID = searchResult.getValue(resultSet[counter].columns[6]);
                                log.debug("Inv_ID", Inv_ID);
								
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
					log.debug("customrecord_b2b_vid_detailsSearchObj result count",searchResultCount);
					customrecord_b2b_vid_detailsSearchObj.run().each(function(result){
					   // .run().each has a limit of 4,000 results
					   totalAmount = result.getValue({
							 name: "custrecord_netamount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Net Amount"
						  });
						  log.debug("totalAmount",totalAmount);
						  grossAmount = result.getValue({
							 name: "custrecord_grossamount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Gross Amount"
						  });
						  log.debug("grossAmount",grossAmount);
						  discount = result.getValue({
							 name: "custrecord_discount",
							 join: "CUSTRECORD_REFERENCE_B2B",
							 summary: "SUM",
							 label: "Discount"
						  });
						  log.debug("discount",discount);
						
						t++;
					   return true;
					});
								

                                Net_Total += parseFloat(Inv_net_Amount);
                                gross_Total += parseFloat(grossAmount);
                                discount_Total += parseFloat(discount);

                                if (child_client_code) {
                                    //i_total_amount = parseFloat(i_total_amount) - parseFloat(i_credit); // +
                                    //i_total_amount = parseFloat(i_total_amount).toFixed(2);
                                    xmlBody += "<tr>";
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
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + parseFloat(grossAmount) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" >" + parseFloat(discount) + "</td>";
                                    xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" >" + Inv_net_Amount + "</td>";
                                    xmlBody += "</tr>";
                                }

                            }


                        }
                        xmlBody += "<tr>";
                        xmlBody += "<td border-width=\"0.1\" width=\"10%\" align=\"left\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"15%\" align=\"justified\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" >" + xml.escape({
                            xmlText: blank
                        }) + "</td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"center\" colspan=\"1\" ><b>" + xml.escape({
                            xmlText: "Total"
                        }) + "</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" ><b>" + gross_Total.toFixed(2) + "</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"13%\" align=\"right\" colspan=\"1\" ><b>" + discount_Total.toFixed(2) + "</b></td>";
                        xmlBody += "<td border-width=\"0.1\" width=\"14%\" align=\"right\" colspan=\"1\" ><b>" +
                            Net_Total.toFixed(2) + "</b></td>";
                        xmlBody += "</tr>";




                        xmlBody += "<\/tbody>";
                        xmlBody += "<\/table>";

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

                            var soaemail = o_custObj.getValue({
                                fieldId: 'custentity_mhl_soa_support_email'
                            });
                            log.debug("soaemail-->", soaemail);

                            var custid = o_custObj.getValue({
                                fieldId: 'entityid'
                            });
                            log.debug("custId-->", custid);

                            var custname = o_custObj.getValue({
                                fieldId: 'companyname'
                            });
                            log.debug("custName-->", custname);



                            var qText = ['Q1', 'Q2', 'Q3', 'Q4'];
                            var now = new Date();
                            log.debug("noe", now); // OCT 9
                            log.debug("month", now.getMonth()); // 9
                            log.debug("floor", Math.floor(now.getMonth())); //9
                            var quarter = Math.floor((now.getMonth() / 3)); //3
                            var quarter1 = Math.floor((now.getMonth())); //3
                            log.debug("quarter-->", quarter);
                            quarter = parseInt(quarter) - parseInt(1); //2=Q3
                            log.debug("quarter1-->", quarter);
                            if (quarter == -1) {
                                quarter = 3;
                            }
                            var quarterName = qText[quarter];
                            log.debug("quarterName-->", quarterName);
                            var firstDate = new Date(now.getFullYear(), quarter * 3, 1);
                            var endDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 3, 0);

                            var currYear = now.getFullYear();

                            //SOA_2022_Q3_clientname
                            var s_req_soa_file_name = "Console Invoice-" + currYear + "-" + quarter1 + "-" + s_customer_name + ".pdf";



                            var o_file = render.xmlToPdf({
                                xmlString: xmlBody
                            });

                            //var o_file = render.xmlToPdf({xmlString:xmlBody});	
                            o_file.name = s_req_soa_file_name;
                            //o_file.description = "File moved to SFTP";
                            o_file.isOnline = true;
                            //o_file.folder = c_folderId; //i_folder_id; 
                            o_file.folder = 1018197; //i_folder_id; 

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
                            var c_custEmail = 'sunil.khutawad@yantrainc.com';

                            /*  if (i_soa_file_Id) {

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
                            bodyString = bodyString.replace("{transaction.entity.soaemail}", soaemail);
                            bodyString = bodyString.replace("{transaction.entity.custid}", custid);
                            bodyString = bodyString.replace("{transaction.entity.custname}", custname);
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
                                log.error("Email Sending error on "+ custId , e.message);
                            }
                        } */
                            //uncomment Avinash
                            //o_customer.setValue({fieldId:'custentitymhl_sent_soa',value:true})

                            /* var o_customerId = o_customer.save({
                              enableSourcing: true,
                              ignoreMandatoryFields: true
                        }); */

                        }
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