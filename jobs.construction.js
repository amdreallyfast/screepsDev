
let creepJobQueues = require("jobs.workQueue");

// Note: RoomPosition.createConstructionSite(...) does not return the construction site ID.  It 
// does something behind the scenes and the construction site appears the next tick.  This code 
// will scan for those and submit jobs for them.
module.exports = {
    queueJobs: function (room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);

        //console.log("number of construction sites: " + sites.length);

        sites.forEach(function (site) {
            creepJobQueues.submitConstructionJob(site);
        });
    }
}
