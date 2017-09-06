
let creepJobQueues = require("jobs.workQueue");

// Note: This was designed to find construction sites that were submitted manually via the screeps UI.  Construction jobs that are generated programmatically will be submitted in the module where the site is created.
module.exports = {
    run: function (room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);

        //console.log("number of construction sites: " + sites.length);

        sites.forEach(function (site) {
            creepJobQueues.submitConstructionJob(site);
        });
    }
}
