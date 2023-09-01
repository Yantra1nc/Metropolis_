	//1481

//B2B Working
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name:[MR] B2B Revenue Inhouse Report
 * File Name: [MR] B2B Revenue Inhouse Report.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: B2B Revenue Inhouse Report
 *********************************************************** */

	/**
	 * Script Name: 
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 */
	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib', './searchlib', 'N/url', 'N/email'],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function(file, format, record, search, runtime, mhllib, datellib, searchlib, url, email) {

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
	                var My_ARR = [];
	                var scriptObj = runtime.getCurrentScript();
	                var deploymentId = scriptObj.deploymentId;
	                //log.debug("deployment Id", deploymentId)

	                var from_date = scriptObj.getParameter({
	                    name: 'custscript_b2b_from_date'
	                });

	                log.debug("from_date", from_date);

	                var to_date = scriptObj.getParameter({
	                    name: 'custscript_b2b_report_to_date'
	                });
	                log.debug("to_date", to_date);

	                var param_user_email = scriptObj.getParameter({
	                    name: 'custscript_b2b_revnue_email'
	                });
	                log.debug("param_user_email", param_user_email);


	                var customrecord_b2b_vid_detailsSearchObj = search.create({
	                    type: "customrecord_b2b_vid_details",
	                    filters: [
	                        //["created", "within", "01/04/2023 12:00 am", "30/04/2023 11:59 pm"],
	                        ["created", "within", from_date, to_date],
	                        "AND",
	                        ["custrecord_mhl_b2b_is_sis_lab", "is", "T"],
	                        "AND",
	                        ["internalidnumber", "notequalto", "1447912"]
							,"AND", 
							["custrecord_mhl_tran_main_vid.internalidnumber","isempty",""]
							//, "AND",
	                        //["custrecord_clientname", "anyof", "18410"], //SL080 METROPOLIS HEALTHCARE LTD( DRMONA TO DELHI)
	                        //["custrecord_clientname", "anyof", custId],
	                        //,"AND",
	                       // ["internalidnumber", "equalto", "17634407"]//prod
	                        //["internalidnumber", "equalto", "17671050"]
	                        //["internalidnumber", "equalto", "1362807"]
	                        //["internalid", "anyof","1440126","1440608"]
	                        //["internalid", "anyof", [1440126, 1440608]]

	                    ],
	                    columns: [
	                        search.createColumn({
	                            name: "custbody_mhl_invoice_vid_number",
	                            join: "CUSTRECORD_MHL_TRAN_MAIN_VID",
	                            label: "VID Number"
	                        }),
	                        search.createColumn({
	                            name: "internalid",
	                            label: "Internal ID"
	                        }),
	                        search.createColumn({
	                            name: "custrecord_test_code",
	                            join: "CUSTRECORD_REFERENCE_B2B",
	                            label: "Test Code"
	                        }),
	                        search.createColumn({
	                            name: "custrecord_vidno",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "VID No"
	                        }),
	                        search.createColumn({
	                            name: "name",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "Name"
	                        }),
	                        search.createColumn({
	                            name: "location",
	                            join: "CUSTRECORD_MHL_TRAN_MAIN_VID",
	                            label: "Org"
	                        }),
	                        search.createColumn({
	                            name: "custrecord_mhl_vid_org",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "VID ORG"
	                        }),
	                        search.createColumn({
	                            name: "custcol_mhl_testcode",
	                            join: "CUSTRECORD_MHL_TRAN_MAIN_VID",
	                            label: "Test Code"
	                        }),
	                        search.createColumn({
	                            name: "custrecord_title",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "PArent B2B VID:Test Code"
	                        }),
	                        search.createColumn({
	                            name: "custrecord_clientcode",
	                            label: "Client Code"
	                        }),
	                        search.createColumn({
	                            name: "custrecord_clientname",
	                            label: "Client Name"
	                        }),
	                        search.createColumn({
	                            name: "amount",
	                            join: "CUSTRECORD_MHL_TRAN_MAIN_VID",
	                            label: "Amount"
	                        }),
	                        search.createColumn({
	                            name: "custrecord_b2b_vid_amount",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "Amount "
	                        }),
	                        search.createColumn({
	                            name: "formulacurrency",
	                            label: "Parent VID-Invoice:Test Code Amount"
	                        }),
	                        search.createColumn({
	                            name: "formulacurrency",
	                            label: "Parent VID-B2B:Test Code Amount"
	                        }),
	                        search.createColumn({
	                            name: "formulacurrency",
	                            label: "Inhouse Revenue"
	                        }),
	                        search.createColumn({
	                            name: "name",
	                            sort: search.Sort.ASC,
	                            label: "Name"
	                        }),
	                        search.createColumn({
	                            name: "custrecord_vidno",
	                            label: "VID No"
	                        }),
	                        search.createColumn({
	                            name: "internalid",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "Internal ID"
	                        }),
							search.createColumn({
								name: "custrecord_test_code_json",
								join: "CUSTRECORD_REFERENCE_B2B",
								label: "Test Code String"
						    }),
							search.createColumn({
								name: "internalid",
								join: "CUSTRECORD_MHL_B2B_MAIN_VID",
								label: "Internal ID"
						    })
	                    ]
	                });

	                var resultSet = searchlib.mySearch(customrecord_b2b_vid_detailsSearchObj);
	                log.debug("Result Length", resultSet.length);


	                if (resultSet) {
	                    for (var i = 0; i < resultSet.length; i++) {
	                       /*  var b2b_VidInternal_Id = resultSet[i].getValue({
	                            name: "internalid",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "Internal ID"
	                        });
 */
							var b2b_VidInternal_Id = resultSet[i].getValue({
	                            name: "internalid",
								join: "CUSTRECORD_MHL_B2B_MAIN_VID",
								label: "Internal ID"
	                        });
							
	                        var curr_VidInternal_Id = resultSet[i].getValue({
	                            name: "internalid",
	                            label: "Internal ID"
	                        });
	                        log.debug("curr_VidInternal_Id ---->", curr_VidInternal_Id);

	                        var vid_number = resultSet[i].getValue({
	                            name: "custrecord_vidno",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "VID No"
	                        });

	                        var b2b_Vid_Org = resultSet[i].getText({
	                            name: "custrecord_mhl_vid_org",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "VID ORG"
	                        });

	                        var client_code = resultSet[i].getValue({
	                            name: "custrecord_clientcode",
	                            label: "Client Code"
	                        });

	                        var client_name = resultSet[i].getText({
	                            name: "custrecord_clientname",
	                            label: "Client Name"
	                        });

	                        var b2b_Parent_Amount = resultSet[i].getValue({
	                            name: "custrecord_b2b_vid_amount",
	                            join: "CUSTRECORD_MHL_B2B_MAIN_VID",
	                            label: "Amount "
	                        });

	                        var b2b_Sister_LabVid = resultSet[i].getValue({
	                            name: "custrecord_vidno",
	                            label: "VID No"
	                        });

	                        var b2b_Sis_Test_Code = resultSet[i].getValue({
	                            name: "custrecord_test_code_json",
								join: "CUSTRECORD_REFERENCE_B2B",
								label: "Test Code String"
	                        });

	                        My_ARR.push({
	                            'currVidInternalId': curr_VidInternal_Id,
	                            pushdata: {
	                                'b2bVidInternalId': b2b_VidInternal_Id,
	                                'vidNumber': vid_number,
	                                'b2bVidOrg': b2b_Vid_Org,
	                                'clientCode': client_code,
	                                'clientName': client_name,
	                                'b2bParentAmount': b2b_Parent_Amount,
	                                'b2bSisterLabVid': b2b_Sister_LabVid,
	                                'b2bSisTestCode': b2b_Sis_Test_Code,
	                            }
	                        });
	                    }
	                }

	                log.debug("My_ARR", My_ARR);

	                //return false;
	                return My_ARR;

	            } catch (e) {

	                log.debug({
	                    title: 'Error Occured while collecting JSON',
	                    details: e
	                });
	            }
	        }

	        function map(context) {

	            try {
	                var a_usage_data = JSON.parse(context.value);
	                log.debug("a_usage_data", a_usage_data);

	                var mapArray = [];

	                var currVidInternalId_map = a_usage_data.currVidInternalId;

	                var b2bVidInternalId_map = a_usage_data.pushdata.b2bVidInternalId;
	                //log.audit("b2bVidInternalId_map", b2bVidInternalId_map); 
	                var vid_number_map = a_usage_data.pushdata.vidNumber;
	                var b2b_Vid_Org_map = a_usage_data.pushdata.b2bVidOrg;
	                var client_code_map = a_usage_data.pushdata.clientCode;
	                var client_name_map = a_usage_data.pushdata.clientName;
	                var b2b_Parent_Amount_map = a_usage_data.pushdata.b2bParentAmount;
	                var b2b_Sister_LabVid_map = a_usage_data.pushdata.b2bSisterLabVid;
	                var b2bSisTestCode_map = a_usage_data.pushdata.b2bSisTestCode;
	                //log.audit("b2bSisTestCode", b2bSisTestCode_map);

	                var vidJson = {
	                    'b2bVidInternalId': b2bVidInternalId_map,
	                    'vidNumber': vid_number_map,
	                    'b2bVidOrg': b2b_Vid_Org_map,
	                    'clientCode': client_code_map,
	                    'clientName': client_name_map,
	                    'b2bParentAmount': b2b_Parent_Amount_map,
	                    'b2bSisterLabVid': b2b_Sister_LabVid_map,
	                    'b2bSisTestCode': b2bSisTestCode_map
	                };

	                log.debug("vidJson", vidJson);

	                //mapArray.push(vidJson);

	                //log.debug("mapArray", mapArray);

	                if (currVidInternalId_map) {
	                    context.write({
	                        key: currVidInternalId_map,
	                        value: vidJson
	                    });
	                }
	            } catch (e) {
	                log.error(ex.message);
	            }
	        }

	        function reduce(context) {

	            log.debug("reduce KEY", context.key);
	            log.debug("reduce Data", context.values);
	            log.debug("reduce Length", context.values.length);

	            try {

	                //ALL REPORT CODE  ===== Start =================================

	                var temp = 0;
	                log.debug("Values 0-->", context.values[0]);
	                log.debug("Values 1-->", context.values[1]);

	                var vidArray = [];

	                for (a = 0; a < context.values.length; a++) {

	                    var result = context.values[a];
	                    var PRdetail = JSON.parse(result);
	                    log.debug("PRdetail" + a, PRdetail);

	                    var b2bVidInternalId_reduce = PRdetail.b2bVidInternalId;
	                    log.debug("b2bVidInternalId_reduce ", b2bVidInternalId_reduce);

	                    var b2bSisTestCode_reduce = PRdetail.b2bSisTestCode;
	                    log.debug("b2bSisTestCode_reduce ", b2bSisTestCode_reduce);

	                    var vidNumber_reduce = PRdetail.vidNumber;
	                    //log.debug("vidNumber_reduce ", vidNumber_reduce);

	                    var b2bVidOrg_reduce = PRdetail.b2bVidOrg;
	                    //log.debug("b2bVidOrg_reduce ", b2bVidOrg_reduce);

	                    var clientCode_reduce = PRdetail.clientCode;
	                    //log.debug("clientCode_reduce ", clientCode_reduce);

	                    var clientName_reduce = PRdetail.clientName;
	                    //log.debug("clientName_reduce ", clientName_reduce);

	                    var b2bParentAmount_reduce = PRdetail.b2bParentAmount;
	                    //log.debug("b2bParentAmount_reduce ", b2bParentAmount_reduce);

	                    var b2bSisterLabVid_reduce = PRdetail.b2bSisterLabVid;
	                    log.debug("b2bSisterLabVid_reduce ", b2bSisterLabVid_reduce);

	                    //For B2B vid Test Details Start =================
	                    if (b2bVidInternalId_reduce) {
	                        var customrecord_b2b_vid_second_search = search.create({
	                            type: "customrecord_b2b_vid_details",
	                            filters: [
	                                ["internalidnumber", "equalto", b2bVidInternalId_reduce], "AND",
	                                //["custrecord_reference_b2b.custrecord_test_code","anyof","5358","4554"]
	                                ["custrecord_reference_b2b.custrecord_test_code_json", "is", b2bSisTestCode_reduce]
	                            ],
	                            columns: [
	                                search.createColumn({
	                                    name: "custrecord_test_code",
	                                    join: "CUSTRECORD_REFERENCE_B2B",
	                                    label: "Test Code"
	                                }),
	                                search.createColumn({
	                                    name: "custrecord_testname",
	                                    join: "CUSTRECORD_REFERENCE_B2B",
	                                    label: "Test Name"
	                                }),
	                                search.createColumn({
	                                    name: "custrecord_b2b_vid_amount",
	                                    label: "Amount "
	                                }),
	                                search.createColumn({
	                                    name: "name",
	                                    sort: search.Sort.ASC,
	                                    label: "Name"
	                                }),
	                                search.createColumn({
	                                    name: "custrecord_vidno",
	                                    label: "VID No"
	                                }),
	                                search.createColumn({
	                                    name: "custrecord_netamount",
	                                    join: "CUSTRECORD_REFERENCE_B2B",
	                                    label: "Net Amount"
	                                }),
	                                search.createColumn({
	                                    name: "custrecord_test_code_json",
	                                    join: "CUSTRECORD_REFERENCE_B2B",
	                                    label: "Test Code JSON"
	                                })
	                            ]
	                        });

	                        var resultSetTwo = searchlib.mySearch(customrecord_b2b_vid_second_search);
	                        log.debug("resultSetTwo Set 420 ->", resultSetTwo.length);

	                        var inHouseRevenue = 0;

	                        var b_vidNumberNew;

	                        if (resultSetTwo.length > 0) {
	                            for (var j = 0; j < resultSetTwo.length; j++) {
	                                var b_vidTestCode = resultSetTwo[j].getValue({
	                                    name: "custrecord_test_code_json",
	                                    join: "CUSTRECORD_REFERENCE_B2B",
	                                    label: "Test Code JSON"
	                                });
	                                // log.debug("b_vidTestCode ---->", b_vidTestCode);

	                                var b_vidTestName = resultSetTwo[j].getValue({
	                                    name: "custrecord_testname",
	                                    join: "CUSTRECORD_REFERENCE_B2B",
	                                    label: "Test Name"
	                                });
	                                //log.debug("b_vidTestName ---->", b_vidTestName);

	                                var b_vidTestAmount = resultSetTwo[j].getValue({
	                                    name: "custrecord_b2b_vid_amount",
	                                    label: "Amount "
	                                });
	                                // log.debug("b_vidTestAmount ---->", b_vidTestAmount);

	                                var b_vidNetAmount = resultSetTwo[j].getValue({
	                                    name: "custrecord_netamount",
	                                    join: "CUSTRECORD_REFERENCE_B2B",
	                                    label: "Net Amount"
	                                });
	                                log.debug("b_vidNetAmount ---->", b_vidNetAmount);
									/* if(forreignAmt){
										b_vidNetAmount = forreignAmt;
									} */
									
									inHouseRevenue = b_vidNetAmount - b_vidNetAmount;
									log.debug("Inhouse ==>451", inHouseRevenue);

	                                /* if (b_vidTestAmount && b_vidNetAmount) {
	                                    inHouseRevenue = b_vidTestAmount - b_vidNetAmount;
	                                    log.debug("Inhouse ==>336", inHouseRevenue);
	                                }
	                                log.debug("b_vidNumberNew-->", b_vidNumberNew);

	                                if (temp > 0 && b_vidNumberNew == vidNumber_reduce) {
	                                    log.debug("Iffff Logggggg");
	                                    inHouseRevenue = temp - b_vidNetAmount;
	                                    b_vidTestAmount = temp;

	                                    temp = inHouseRevenue;
	                                } else {
	                                    log.debug("Else Logggggg1", inHouseRevenue);
	                                    log.debug("Else Logggggg2", vidNumber_reduce);

	                                    temp = inHouseRevenue;
	                                    b_vidNumberNew = vidNumber_reduce;
	                                } */
	                            }
								
							var vidJson = {
								"f_b2bVidInternalId_reduce": vidNumber_reduce,
								"f_b2bVidOrg": b2bVidOrg_reduce,
								"f_b2bSisTestCode_reduce": b2bSisTestCode_reduce,
								"f_b_vidTestCode": b_vidTestCode,
								"f_b_vidTestName": b_vidTestName,
								"f_b_clientCode_reduce": clientCode_reduce,
								"f_b_clientName_reduce": clientName_reduce,
								"f_b_vidTestAmount": b_vidTestAmount,
								"f_b_vidNetAmount": b_vidNetAmount,
								"f_inHouseRevenue": inHouseRevenue,
								"f_b2bSisterLabVid_reduce": b2bSisterLabVid_reduce
							};

							vidArray.push(vidJson);
	                        }
	                    }
	                }


	                // log.audit("vidJsonFinal", vidJson);

	                log.audit("vidJsonFinal Array", vidArray);
					
				if(vidArray){
	                context.write(context.key, vidArray);
				}

	            } catch (e) {
	                log.error(ex.message);
	            }

	        }

	        /**
	         * Executes when the summarize entry point is triggered and applies to the result set.
	         *
	         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	         * @since 2015.1
	         */
	        function summarize(summary) {

	            var s_b2bSisTestCod;
	            var s_vidTestCode;
	            var s_vidTestName;
				
				var scriptObj = runtime.getCurrentScript();
	            var deploymentId = scriptObj.deploymentId;
				
				var userEmail = scriptObj.getParameter({
	                name: 'custscript_b2b_revnue_email'
	            });
	            log.debug("userEmail summarize-->", userEmail);

	            var pdf_html = '<table border="0" cellpadding="4" cellspacing="4" style="width:100%; margin-top:15px;font-size:10px;"><thead><tr border-bottom="1" border-top="1">';

	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">VID No</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Org</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Test Code</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Test Name</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Client Code</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Customer Name</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Total net revenue amount</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Elimination revenue amount</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Inhouse revenue(Total Net Revenue-Elimination revenue)</th>';
	            pdf_html += '<th style="border-left:1px solid;border-top:1px solid;">Sisterlab VID</th>';

	            pdf_html += ' </tr>';
	            pdf_html += ' </thead>';
	            pdf_html += ' <tbody>';

	            summary.output.iterator().each(function(key, value) {

	                var s_value = JSON.parse(value);
	                log.audit("s_value", s_value);

	                for (var j = 0; j < s_value.length; j++) {

	                    var s_parentVidNumber = s_value[j].f_b2bVidInternalId_reduce;
	                    log.debug("s_parentVidNumber-->", s_parentVidNumber);

	                    //not needed
	                    var s_test_code = s_value[j].f_b2bSisTestCode_reduce;
	                    log.debug("s_test_code-->", s_test_code);

	                    var s_b2bOrg = s_value[j].f_b2bVidOrg;
	                    log.debug("s_b2bOrg-->", s_b2bOrg);

	                    var s_parentVidTestCode = s_value[j].f_b_vidTestCode;
	                    log.debug("s_parentVidTestCode-->", s_parentVidTestCode);

	                    var s_testName = s_value[j].f_b_vidTestName;
	                    log.debug("s_testName-->", s_testName);

	                    var s_clientCode = s_value[j].f_b_clientCode_reduce;
	                    log.debug("s_clientCode-->", s_clientCode);

	                    var s_clientName = s_value[j].f_b_clientName_reduce;
	                    log.debug("s_clientName-->", s_clientName);

	                    var s_testAmt = s_value[j].f_b_vidTestAmount;
	                    log.debug("s_testAmt-->", s_testAmt);

	                    var s_NetAmt = s_value[j].f_b_vidNetAmount;
	                    log.debug("s_NetAmt-->", s_NetAmt);

	                    var s_inhouseAmt = s_value[j].f_inHouseRevenue;
	                    log.debug("s_inhouseAmt-->", s_inhouseAmt);

	                    var s_sisLabVid = s_value[j].f_b2bSisterLabVid_reduce;
	                    log.debug("s_sisLabVid-->", s_sisLabVid);

	                    pdf_html += '<tr>';
	                    pdf_html += '<td align="center">' + s_parentVidNumber + '</td>'; //0
	                    pdf_html += '<td align="center">' + s_b2bOrg + '</td>'; //0
	                    pdf_html += '<td align="center">' + s_parentVidTestCode + '</td>';
	                    pdf_html += '<td align="center">' + s_testName + '</td>';
	                    pdf_html += '<td align="center">' + s_clientCode + '</td>'; //0
	                    pdf_html += '<td align="center">' + s_clientName + '</td>'; //0
	                    //pdf_html += '<td align="center">' + s_testAmt + '</td>'; //G
	                    pdf_html += '<td align="center">' + s_NetAmt + '</td>'; //G
	                    pdf_html += '<td align="center">' + s_NetAmt + '</td>'; //H
	                    pdf_html += '<td align="center">' + s_inhouseAmt + '</td>'; //I
	                    pdf_html += '<td align="center">' + s_sisLabVid + '</td>'; //0
	                    pdf_html += '</tr>';

	                }


	                return true;
	            });

	            pdf_html += '</tbody>';


	            pdf_html += '</table>';
	            var newXLS_File = file.create({
	                name: "Revenue Inhouse Report "+ new Date() +".xls",
	                //name: "Revenue Inhouse Report.xls",
	                fileType: file.Type.CSV,
	                contents: pdf_html
	            });
	            log.debug("newXLS_File", JSON.stringify(newXLS_File));

	            //newXLS_File.folder = 502651;  //SB
	            newXLS_File.folder = 1270937;
	            var report_file_id = newXLS_File.save();
	            log.debug("report_file_id 512", report_file_id);
				
				log.debug("File Saved Successfully");

				try{
					var accountLink = url.resolveDomain({
					hostType: url.HostType.APPLICATION
					});
					var csvFile = file.load({
	                    id: report_file_id
	                });
					
						var URL = csvFile.url
						var finalURL = 'https://'+accountLink+URL  

						log.debug("Pdf Url ---->", finalURL);
					
				 }catch(e){
					 log.debug("Error - File Not Found");
				 }
				 var PDFPrint; 
				 if(finalURL){
				 //var PDFPrint;
                    PDFPrint = "Dear User,<br>";
                    PDFPrint += "<br>";
                    PDFPrint += "B2B Inhouse Revenue Report.<br>";
					PDFPrint += "<br>";
					PDFPrint += "Report Url:: "+ finalURL + "<br>";
				 }
				 
				 if(userEmail && PDFPrint){
                    email.send({
                        author: 118,
                        recipients: userEmail,
                        subject: 'Revenue Inhouse Report',
                        body: PDFPrint
                    });
                    
                    log.audit("Email Sent successfully-->",userEmail);
                }

	            //CSV

	            /* log.debug("s_b2bSisTestCod summary", s_b2bSisTestCod);
	            log.debug("s_vidTestCode summary", s_vidTestCode);
	            log.debug("s_vidTestName summary", s_vidTestName); */

	        }

	        return {
	            getInputData: getInputData,
	            map: map,
	            reduce: reduce,
	            summarize: summarize
	        };

	    });