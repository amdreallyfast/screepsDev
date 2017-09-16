
let creepJobQueues = require("jobs.workQueue");

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Read it.  Doesn't do much.

        Note: RoomPosition.createConstructionSite(...) does not return the construction site ID.  
        It does something behind the scenes and the construction site appears the next tick.  
        This code will scan for any and all construction sites in the room and submit jobs for 
        them.
    Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    queueJobs: function (room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);

        //console.log("number of construction sites: " + sites.length);
        sites.forEach(function (site) {
            creepJobQueues.submitConstructionJob(site);
        });
    }
}
