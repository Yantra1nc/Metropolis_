/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * Script Name: MHL_MAP_MOVE_ERROR_Files.js
 * Author: Avinash Lahane
 * Date: May 2022
 * Description: This script will Move the json files error to ready folder daily basis.
 */
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
		 
		var orderIds=[];
        function getInputData() {

            try {

                var scriptObj = runtime.getCurrentScript();
                var deploymentId = scriptObj.deploymentId;
				
				var fileSearchObj = search.load({
					id: 'customsearch_move_files_error_to_ready'
				});
					
				return fileSearchObj;
			}
			catch(e)
			{
				log.error("getInputData |  error ",e)
			}

        }

        function map(context) {
            try {
                var a_usage_data = JSON.parse(context.value);
				
			
				//log.debug("MAP","a_usage_data " + JSON.stringify(a_usage_data))
                context.write({
                    key: a_usage_data.id,
                    value: a_usage_data.values.folder.text
                });
						
					
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
			
			var i_file_id = context.key;
			//log.debug("i_file_id",i_file_id);
			var i_folder_name = context.values[0];
			log.debug("i_folder_name",i_folder_name+" i_file_id "+i_file_id);
			
			 var o_fileObj = file.load({
                         id: i_file_id
                     });
			if (i_file_id && i_folder_name == 'Test Addition Error') {
                   //  log.debug('if..file_id',i_file_id);
                   
                     o_fileObj.folder = '698';
                    
            }
					
			if (i_file_id && i_folder_name == 'Test Cancel Error') {
                  //   log.debug('if..file_id',i_file_id);
                    
                     o_fileObj.folder = '694';
                   
            }
			
			if (i_file_id && i_folder_name == 'Attune Test Cancel Error') {
                //     log.debug('if..file_id',i_file_id);
                    
                     o_fileObj.folder = '30743';
                    
            }
			
			if (i_file_id && i_folder_name == 'Attune Test Addition Error') {
              //       log.debug('if..file_id',i_file_id);
                    
                     o_fileObj.folder = '30755';
                    
            }
			
			if (i_file_id && i_folder_name == 'VID Error') {
              //       log.debug('if..file_id',i_file_id);
                   
                     o_fileObj.folder = '706';
                    
            }
			
			if (i_file_id && i_folder_name == 'VID Location Not Found') {
              //       log.debug('if..file_id',i_file_id);
                   
                     o_fileObj.folder = '706';
                    
            }
			if (i_file_id && i_folder_name == 'Attune VID Error') {
              //       log.debug('if..file_id',i_file_id);
                    
                     o_fileObj.folder = '30737';
                    
            }
              
              if (i_file_id && i_folder_name == 'Sister Lab VID Error') {
              //       log.debug('if..file_id',i_file_id);
                    
                     o_fileObj.folder = '168925';
                    
            }
			o_fileObj.save();
					
            } catch (e) {
				log.error("reduce | error",e)
            }		
			
			
			
			//log.debug("Reduce tempArr ",JSON.stringify(ErrorArr))
           // context.write(o_context_frst_occurance, ErrorArr);

        }

        ///////////////////////////////////////////////////////////

        function summarize(summary) {
            try {

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

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });