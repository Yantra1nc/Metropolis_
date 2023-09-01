/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MHL SCH Save Search Deletion
 * File Name: MHL SCH Saved Search Deletion.js
 * Created On: 09/03/2022
 * Modified On:
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: Saved Search Deletion
 *********************************************************** */
/**
 *@NApiVersion 2.0
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime','N/task'],
    function(search, record, email, runtime,task) {
        function execute(context) {
            
            try {
				var customrecord_mhl_saved_search_deleteSearchObj = search.create({
				   type: "customrecord_mhl_saved_search_delete",
				   filters:
				   [
						["isinactive","is","F"]
				   ],
				   columns:
				   [
					  search.createColumn({
						 name: "name",
						 sort: search.Sort.ASC,
						 label: "Name"
					  }),
					  search.createColumn({name: "internalid", label: "Internal ID"}),
					  search.createColumn({name: "scriptid", label: "Script ID"}),
					  search.createColumn({name: "custrecord_mhl_ss_del_search_id", label: "Search Id"}),
					  search.createColumn({name: "custrecord_mhl_ss_del_search_name", label: "Search Name"})
				   ]
				});
				var searchResultCount = customrecord_mhl_saved_search_deleteSearchObj.runPaged().count;
				log.debug("customrecord_mhl_saved_search_deleteSearchObj result count",searchResultCount);
				
				
				
				var resultSet = customrecord_mhl_saved_search_deleteSearchObj.run().getRange({start : 0,end : 1000});
				if(resultSet!=null&&resultSet!=''&&resultSet!=' ')
				{
					var completeResultSet = resultSet; 
					var start = 1000;
					var last = 2000;
					
					while(resultSet.length == 1000)
					{
						resultSet = customrecord_mhl_saved_search_deleteSearchObj.run().getRange(start, last);
						completeResultSet = completeResultSet.concat(resultSet);
						start = parseFloat(start)+1000;
						last = parseFloat(last)+1000;
					}
					resultSet = completeResultSet;
					if(resultSet)
					{
						log.debug('In getInputData_savedSearch: resultSet: '+resultSet.length);	
					}
				}
				
				
				for (var i = 0; i < resultSet.length; i++) {
					
					var searchId = Number(resultSet[i].getValue({name: "custrecord_mhl_ss_del_search_id"}));
					var i_internalId = Number(resultSet[i].getValue({name: "internalid", label: "Internal ID"}));
		               log.debug("searchId",searchId+" i_internalId "+i_internalId)
		
						try
						{						
							var updatedId = record.submitFields({
								type:'customrecord_mhl_saved_search_delete',
								id: i_internalId,
								values: {
									'isinactive': true
								}
							});
							
							search.delete({
					           id: searchId
					        });
						}
						catch(er)
						{
							log.error("Deletion "+i,er.message)
							if( er.name == 'SSS_USAGE_LIMIT_EXCEEDED')
							{
								var scheduledScript = task.create({
												taskType: task.TaskType.SCHEDULED_SCRIPT
								});
								scheduledScript.scriptId = 'customscript_mhl_sch_search_deletion';
								scheduledScript.deploymentId = 'customscript_mhl_sch_search_deletion';
								var scriptID = scheduledScript.submit();

							//	log.audit(" scriptID", scriptID)
										
							
							}
						}
					
					}
				
				
				customrecord_mhl_saved_search_deleteSearchObj.run().each(function(result){
				   // .run().each has a limit of 4,000 results
				   
				/* var searchId = Number(result.getValue({name: "custrecord_mhl_ss_del_search_id"}));
				var i_internalId = Number(result.getValue({name: "internalid", label: "Internal ID"}));
	               log.debug("searchId",searchId+" i_internalId "+i_internalId)
	
					try
					{						
						var updatedId = record.submitFields({
							type:'customrecord_mhl_saved_search_delete',
							id: i_internalId,
							values: {
								'isinactive': true
							}
						});
						
						search.delete({
				           id: searchId
				        });
					}
					catch(er)
					{
						log.error("Deletion",er)
					} */

				   return true;
				});
               
			log.debug("Script","Stop")
            } catch (e) {
                log.error(e.message);
				if( e.name == 'SSS_USAGE_LIMIT_EXCEEDED')
							{
								var scheduledScript = task.create({
												taskType: task.TaskType.SCHEDULED_SCRIPT
								});
								scheduledScript.scriptId = 'customscript_mhl_sch_search_deletion';
								scheduledScript.deploymentId = 'customscript_mhl_sch_search_deletion';
								var scriptID = scheduledScript.submit();

								log.audit(" scriptID", scriptID)
										
							
							}
            }
        }
        return {
            execute: execute
        };
    });


