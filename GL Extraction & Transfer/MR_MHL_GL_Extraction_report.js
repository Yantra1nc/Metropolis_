/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MR MHL GL Extraction Report
 * File Name: MR_MHL_GL_Extraction_report.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: GL Extraction Report
 *********************************************************** */

define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', 'N/task','N/email'],
    /**
     * @param {file} file
     * @param {format} format
     * @param {record} record
     * @param {search} search
     * @param {transaction} transaction
     */
    function(file, format, record, search, runtime, task, email) {

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
		 
		var file_id;
		var s_file_data= '';
		var emailId = '';
        function getInputData() {
      
            try { 
				
				var scriptObj = runtime.getCurrentScript();
				var paramVal = scriptObj.getParameter({name: 'custscript_cb_filter_parameter'});
				log.debug("paramVal",paramVal);
				
				var myObj = JSON.parse(paramVal);
				log.debug("myObj",myObj);
				
				var subsidary = myObj.userSubsidary.toString(); 
				var emailId = myObj.e_email.toString(); 
				log.debug("subsidary",subsidary);
				log.debug("emailId",emailId);
				
				var startdate = myObj.userFromDate.toString(); 
				log.debug("startdate",startdate);
				
				var enddate = myObj.userToDate.toString(); 
				log.debug("enddate",enddate);
				
				// I record
					s_file_data = s_file_data +
							'Posting_date^^' +
							'Posting_Period^^' +
							'Creation_date^^' +
							'Created_by^^' +
							'Document_number^^' +
							'Document_type^^' +
							'memo_header^^' +
							'Subsidiary^^' +
							'memo_line^^' +
							'Account^^' +
							'Currency^^' +
							'Debit_amount_in_Foreign_currency ^^ ' +
							'Credit_amount_in_Foreign_currency ^^ ' +
							'exchange_rate^^' +
							'Debit_amount^^' +
							'Credit_amount^^' +
							'Indicator' +
							'\n';
			var finalDt ;
			var today_date = new Date();
			var ConvertedDt	= convert_date(today_date);
			var day        = ConvertedDt.getDate();
			var month      = ConvertedDt.getMonth()+ 1;
			var year       = ConvertedDt.getFullYear();
			finalDt        = day.toString().replace(/(^|\D)(\d)(?!\d)/g, '$10$2');
			//log.debug("finalDt",finalDt);
			var getDateMonthYear = finalDt+""+month;
			var timeStamp   = new Date().toISOString();
			log.debug("timeStamp",timeStamp);
			
			var File_Name = 'Gl_Extraction_Report_'+getDateMonthYear+timeStamp+'.txt';
			log.debug("getInputData File_Name",File_Name);
			
				/* var fileObj = file.create({
				name: File_Name,
				fileType: file.Type.PLAINTEXT,
				contents: s_file_data,
				description: 'This is a plain text file.',
				folder: 445702
				});
				//fileObj.folder = 93281;
				file_id = fileObj.save();
				log.debug("file_id",file_id); */
				
				var dateRange = [startdate,enddate]
				
				
				var fileSearchObj = search.load({id: 'customsearch_mhl_gl_extraction_dnd'});
				
				if(startdate && enddate)
				{
					fileSearchObj.filters.push(search.createFilter({ name: 'trandate', operator: search.Operator.ONORAFTER, values: startdate}));
					fileSearchObj.filters.push(search.createFilter({ name: 'trandate', operator: search.Operator.ONORBEFORE, values: enddate}));
				}
				
				if(subsidary)
				{
					fileSearchObj.filters.push(search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidary}));
				}
				
				
				/* fileSearchObj.filters.push(search.createFilter({ name: 'posting', operator: search.Operator.IS, values: "T"}));
				fileSearchObj.filters.push(search.createFilter({ name: 'mainline', operator: search.Operator.IS, values: "T"}));
				
				
				
				if(startdate && enddate)
				{
					fileSearchObj.filters.push(search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: dateRange}));
				} */
	        	 	
	        	 	//fileSearchObj.filters.push(search.createFilter({ name: 'trandate', operator: search.Operator.ONORBEFORE, values: enddate}));
				
				/* fileSearchObj.filters.push(search.createFilter({ name: 'subsidairy', operator: search.Operator.ANYOF, values: subsidary}));
				fileSearchObj.filters.push(search.createFilter({ name: 'from_date', operator: search.Operator.ONORAFTER, values: startdate}));
				fileSearchObj.filters.push(search.createFilter({ name: 'end_date', operator: search.Operator.ONORBEFORE, values: enddate})); */
					   
				var resultSet = fileSearchObj.run().getRange({start : 0,end : 1000});
				if(resultSet!=null&&resultSet!=''&&resultSet!=' ')
				{
					var completeResultSet = resultSet; 
					var start = 1000;
					var last = 2000;
					
					while(resultSet.length == 1000)
					{
						resultSet = fileSearchObj.run().getRange(start, last);
						completeResultSet = completeResultSet.concat(resultSet);
						start = parseFloat(start)+1000;
						last = parseFloat(last)+1000;
						
						log.debug("Input Call","start "+start)
					}
					resultSet = completeResultSet;
					if(resultSet)
					{
						log.debug('In getInputData_savedSearch: resultSet: '+resultSet.length);	
					}
				}
				
				
				var transdetails = [];
				if (_logValidation(resultSet)) {
                for (var i = 0; i < resultSet.length; i++) {
                    // .run().each has a limit of 4,000 results
					
                    var i_postingDate = resultSet[i].getValue({name: "trandate"});
                  //  log.debug('i_postingDate ',i_postingDate);
					
					var i_postingPeriod = resultSet[i].getText({name: "postingperiod"});
                   // log.debug('i_postingPeriod',i_postingPeriod);
					
                    var i_creationDate = resultSet[i].getValue({name: "datecreated"});
                  //  log.debug('i_creationDate ',i_creationDate);
					
                    var i_creadedBy = resultSet[i].getText({name: "name",join: "systemNotes"});
                  //   log.debug('i_creadedBy ',i_creadedBy);
					
                    var i_documentNumber = resultSet[i].getValue({name: "tranid"});
                 //   log.debug('i_documentNumber ',i_documentNumber);
					
                    var i_documentType = resultSet[i].getText({name: "type"});
                  //  log.debug('i_documentType ',i_documentType);
					
                    /* var i_documentDate = resultSet[i].getValue({name: "trandate"});
                    //log.debug('i_documentDate ',i_documentDate); */
					
                    var i_memoHeader = resultSet[i].getValue({name: "custbody_mhl_memo"});
                   // log.debug('i_memoHeader ',i_memoHeader);
					
                    var i_subsidiary = resultSet[i].getText({name: "subsidiarynohierarchy"});
                   // log.debug('i_subsidiary ', i_subsidiary);
					
                    var i_memoLine = resultSet[i].getValue({name: "memo"});
					//log.debug('i_memoLine ',i_memoLine);
					
					var i_account = resultSet[i].getText({name: "account"});
					//log.debug('i_account ',i_account);
					
					var i_currency = resultSet[i].getText({name: "currency"});
                   // log.debug('i_currency ',i_currency);
					
					var i_debitAmtInForeigncurrency = resultSet[i].getValue({name: "debitfxamount"});
                   // log.debug('i_debitAmtInForeigncurrency ',i_debitAmtInForeigncurrency);
					
					var i_creditAmtInForeigncurrency = resultSet[i].getValue({name: "creditfxamount"});
                    //log.debug('i_creditAmtInForeigncurrency ',i_creditAmtInForeigncurrency);
					
					var i_exchangeRate = resultSet[i].getValue({name: "exchangerate"});
                    //log.debug('i_exchangeRate ',i_exchangeRate);
					
					var i_debitAmount = resultSet[i].getValue({name: "debitamount"});
                    //log.debug('i_debitAmount ',i_debitAmount);
					
					var i_creditAmount = resultSet[i].getValue({name: "creditamount"});
                   // log.debug('i_creditAmount ',i_creditAmount);
					
					//var i_indicator = resultSet[i].getValue({name: "creditfxamount"});
                    //log.debug('i_indicator ',i_indicator);

					transdetails.push({'postingDate':i_postingDate,'postingPeriod':i_postingPeriod,'creationDate':i_creationDate,'creadedBy':i_creadedBy,'documentNumber':i_documentNumber,'documentType':i_documentType,'memoHeader':i_memoHeader,'subsidiary':i_subsidiary,'memoLine':i_memoLine,'account':i_account,'currency':i_currency,'debitAmtInForeigncurrency':i_debitAmtInForeigncurrency,'creditAmtInForeigncurrency':i_creditAmtInForeigncurrency,'exchangeRate':i_exchangeRate,'debitAmount':i_debitAmount,'creditAmount':i_creditAmount});
					//, 'file_id':file_id
                }

                //return true;
            }


				
					
				return transdetails;
			}
			catch(e)
			{
				log.error("getInputData |  error ",e)
			}

        }

        function map(context) {
            try {
				var tempArr = [];
				var key    = context.key;
				//log.debug('key ',key);
				var value  = context.value;
				//log.debug('value ',JSON.stringify(value));
				
				var objParsedValue = JSON.parse(value);
				
				var postiong_Date = objParsedValue.postingDate;
				//log.debug('postiong_Date ',postiong_Date);
				
				var postingPeriod = objParsedValue.postingPeriod;
				//log.debug('postingPeriod ',postingPeriod);
				
				var creationDate = objParsedValue.creationDate;
				//log.debug('creationDate ',creationDate);
				
				var creadedBy = objParsedValue.creadedBy;
				//log.audit('creadedBy ',creadedBy);
				
				var documentNumber = objParsedValue.documentNumber;
				//log.debug('documentNumber ',documentNumber);
				
				var documentType = objParsedValue.documentType;
				//log.debug('documentType ',documentType);
				
				var memoHeader = objParsedValue.memoHeader;
				//log.debug('memoHeader ',memoHeader);
				
				var subsidiary = objParsedValue.subsidiary;
				//log.debug('subsidiary ',subsidiary);
				
				var memoLine = objParsedValue.memoLine;
				//log.debug('memoLine ',memoLine);
				
				var account = objParsedValue.account;
				//log.debug('account ',account);
				
				var currency = objParsedValue.currency;
				//log.debug('currency ',currency);
				
				var debitAmtInForeigncurrency = objParsedValue.debitAmtInForeigncurrency;
				//log.debug('debitAmtInForeigncurrency ',debitAmtInForeigncurrency);
				
				var creditAmtInForeigncurrency = objParsedValue.creditAmtInForeigncurrency;
				//log.debug('creditAmtInForeigncurrency ',creditAmtInForeigncurrency);
				
				var exchangeRate = objParsedValue.exchangeRate;
				//log.debug('exchangeRate ',exchangeRate);
				
				var debitAmount = objParsedValue.debitAmount;
				//log.debug('debitAmount ',debitAmount);
				
				var creditAmount = objParsedValue.creditAmount;
				//log.debug('creditAmount ',creditAmount);
				
				//var file_id = objParsedValue.file_id;
				//log.debug('file_id ',file_id);
				
				/* if(){
				var Indicator = 'manual ';
				}
				else {
				var Indicator = 'system generated ';
				} */
				var indicator = "Manual";
				if(creadedBy == "-System-" )
					indicator = "Automated";
				
			s_file_data =
				postiong_Date + '^^' +
				postingPeriod + '^^' +
				creationDate + '^^' +
				creadedBy + '^^' +
				documentNumber + '^^' +
				documentType + '^^' +
				memoHeader + '^^' +
				subsidiary + '^^' +
				memoLine + '^^' +
				account + '^^' +
				currency + '^^' +
				debitAmtInForeigncurrency + '^^' +
				creditAmtInForeigncurrency + '^^' +			
				exchangeRate + '^^' +
				debitAmount + '^^' +
				creditAmount + '^^' +indicator;
				
				/* var fileObj = file.load({
					id: file_id
				});
				fileObj.appendLine({
					value: s_file_data
				});
				var fileId = fileObj.save(); */
				
				
				
			
				/* var a_usage_data = JSON.parse(context.value);
				//log.debug("MAP","a_usage_data " + JSON.stringify(a_usage_data))
                context.write({
                    key: a_usage_data.id,
                    value: a_usage_data.values
                }); */
			if(s_file_data)
			{
				context.write(documentNumber, s_file_data);
			}
			
            } catch (ex) {
                log.error({
                    title: 'map: error in creating records',
                    details: ex
                });

            }
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function reduce(context) {
			

            try {
			var tempArr = [];
            var ErrorArr = [];
            var n_externalID = 0;
			
			var fileID = context.key;
			
			log.debug("reduce","context"+JSON.stringify(context))
			//log.debug("i_internal_id",i_internal_id);
			var rowData = context.values;
			//log.debug("i_record",i_record);
			
			
			//log.debug("i_record",JSON.stringify(rowData))
			log.debug("rowData.length",rowData.length)
			
			for(var t =0; t<=rowData.length;t++ )
			{
				var jsonArray2 = {
						'isProcessed': 'NO',
						'data': rowData[t]
					};
					
				//log.debug("i_record "+t,JSON.stringify(rowData[t]))	
				if(rowData[t])
				{
					tempArr.push(jsonArray2);
				}
				
			}
			
			
			
					
            } catch (e) {
				log.error("reduce | error",e)
            }		
			
			
			
			//log.debug("Reduce tempArr ",JSON.stringify(ErrorArr))
            context.write({key:fileID,value:tempArr});

        }

        ///////////////////////////////////////////////////////////

        function summarize(summary) {
            try {
				
				log.debug("summary ",JSON.stringify(summary))
				var scriptObj = runtime.getCurrentScript();
				var paramVal = scriptObj.getParameter({name: 'custscript_cb_filter_parameter'});
				log.debug("paramVal",paramVal);
				
				var myObj = JSON.parse(paramVal);
				var emailId = myObj.e_email.toString(); 
				log.debug("Summary","emailId "+emailId)
				var s_FileContent='';
				
				s_FileContent = s_file_data +
							'Posting_date^^' +
							'Posting_Period^^' +
							'Creation_date^^' +
							'Created_by^^' +
							'Document_number^^' +
							'Document_type^^' +
							'memo_header^^' +
							'Subsidiary^^' +
							'memo_line^^' +
							'Account^^' +
							'Currency^^' +
							'Debit_amount_in_Foreign_currency^^' +
							'Credit_amount_in_Foreign_currency^^' +
							'exchange_rate^^' +
							'Debit_amount^^' +
							'Credit_amount^^' +
							'Indicator' +
							'\n';
				
				summary.output.iterator().each(function(key, value) {

                    var tempSucessString = "";
                    var tempErrorString = "";
                    //log.debug("rowsData",value);
                   //log.debug("summary key",key);
                    var s_value = JSON.parse(value);
                    
                    var errMessage = '';

                    var nsDetails = "";
                    var errorMessage = "";
                    var bProcessed = "";
					
					for (var x = 0; x < s_value.length; x++) {
                      
					  if(s_value[x].data)
					  {
						nsDetails = s_value[x].data;
						//log.debug("nsDetails",nsDetails)
					  }
                        
                    }
					 s_FileContent += nsDetails+"\n";

                    return true;
                });
				
				log.audit("s_FileContent",s_FileContent)
				
				//return false;
				var toDay = new Date();
				var File_Name = 'Gl_Extraction_Report_'+toDay+'.txt';
				var fileObj = file.create({
					name: File_Name,
					fileType: file.Type.PLAINTEXT,
					contents: s_FileContent,
					description: 'This is a plain text file.',
					folder: 445702
				});
				//fileObj.folder = 93281;
				var file_id = fileObj.save();
				log.audit("Summary File Id","file_id "+file_id)
				
				if(emailId)
				{				
					
					email.send({
						author: 118,
						recipients: emailId,
						subject: 'GL - Extraction Data '+toDay,
						body: 'Hello User, \n Please find the attachment of GL Extraction Reports',
						attachments: [fileObj]
					});
				}
				
				

            } catch (error) {
                log.error('Catch', 'Msg- ' + error);
            }
        }


        /////////////////////////////////////////////////////////
        function _logValidation(value) {
            if (value != null && value != undefined && value != '' && value != 'undefined') {
                return true;
            } else {
                return false;
            }

        }

        function _nullValidation(val) {
            if (val == null || val == undefined || val == '') {
                return true;
            } else {
                return false;
            }

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

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });