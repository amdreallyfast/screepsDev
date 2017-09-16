
/** makes sure that each room has the necessary queue objects **/
let ensureJobQueuesExist = function (room) {
    if (!Memory.creepJobs) {
        Memory.creepJobs = {};
    }
    if (!Memory.creepJobs[room.name]) {
        Memory.creepJobs[room.name] = {};
        Memory.creepJobs[room.name].construction = {
            everythingElse: {},
            roads: {}
        };
        Memory.creepJobs[room.name].refillEnergy = {};
        Memory.creepJobs[room.name].repair = {};
    }
}

let printConstructionJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].construction;
    let numImportandConstructionJobs = 0;
    let everythingElseStr = "{ ";
    for (let jobId in jobs.everythingElse) {
        numImportandConstructionJobs++;
        let site = Game.getObjectById(jobId);
        if (!site) {
            everythingElseStr += "null; ";  // uh oh
        }
        else {
            everythingElseStr += (site.structureType + "(" + site.progress + "/" + site.progressTotal + "); ");
        }
    }
    everythingElseStr += "}";

    let numRoadConstructionJobs = 0;
    let roadsStr = "{ ";
    for (let jobId in jobs.roads) {
        numRoadConstructionJobs++;
        let site = Game.getObjectById(jobId);
        if (!site) {
            roadsStr += "null; ";  // uh oh
        }
        else {
            roadsStr += (site.structureType + "(" + site.progress + "/" + site.progressTotal + "); ");
        }
    }
    roadsStr += "}";

    console.log("room " + room.name + " construction jobs: \n\t" + "important(" + numImportandConstructionJobs + "): " + everythingElseStr + "\n\t" + "roads(" + numRoadConstructionJobs + "): " + roadsStr);
}

let printRefillEnergyJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].refillEnergy;
    let str = "{ ";
    for (let jobId in jobs) {
        let structure = Game.getObjectById(jobId);
        if (!structure) {
            str += "null structure; ";  // uh oh; let it blow up
        }
        else {
            str += (structure.structureType + "(" + structure.energy + "/" + structure.energyCapacity + "); ");
        }
    }
    str += "}";
    console.log("room " + room.name + " has " + Object.keys(jobs).length + " energy refill jobs: " + str);
}

let printRepairJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].repair;
    let str = "{ ";
    for (let jobId in jobs) {
        let structure = Game.getObjectById(jobId);
        if (!structure) {
            str += "null structure; ";  // uh oh; something submitted a null ID as a job; rather than hide the fact, let it blow up in your face so that you can find it and fix it
        }
        else {
            str += (structure.structureType + "(" + structure.hits + "/" + structure.hitsMax + "); ");
        }
    }
    str += "}";
    console.log("room " + room.name + " has " + Object.keys(jobs).length + " repair jobs: " + str);
}

let addJobTo = function (roomJobs, newJobId) {
    if (roomJobs[newJobId] === null || roomJobs[newJobId] === undefined) {
        roomJobs[newJobId] = 1; // 1 worker for new job
    }

    return Object.keys(roomJobs).length;
}

let getJobFrom = function (roomJobs) {
    for (let jobId in roomJobs) {
        let obj = Game.getObjectById(jobId);
        if (obj === null || obj === undefined) {
            // job must have completed
            // Note: Construction sites can be completed when there is still a job for it.  In 
            // such an event, remove the job.
            console.log("null job; deleting")
            delete roomJobs[jobId];
        }
        else {
            // decrement the worker count
            if (--roomJobs[jobId] === 0) {
                delete roomJobs[jobId];
            }
            return jobId;
        }
    }

    return null;
}

module.exports = {

    // in the event of disaster and jobs have built up to no end
    clearJobs: function(room) {
        //delete Memory.creepJobs;
        delete Memory.creepJobs[room.name];
    },

    print: function(room) {
        ensureJobQueuesExist(room);
        printConstructionJobs(room);
        printRefillEnergyJobs(room);
        printRepairJobs(room);
    },

    /** @param {constructionSiteId} self-explanatory **/
    submitConstructionJob: function (constructionSite) {
        let room = constructionSite.room;
        ensureJobQueuesExist(room);
        let jobs = Memory.creepJobs[room.name].construction;
        if (constructionSite.structureType === STRUCTURE_ROAD) {
            addJobTo(jobs.roads, constructionSite.id);
        }
        else {
            addJobTo(jobs.everythingElse, constructionSite.id);
        }
    },

    /** @param {thing} any object that can store energy (technically can be a creep, but I'd advise against having creeps submit "refill" jobs because they can move and then you have one creep chasing another **/
    submitRefillEnergyJob: function (thing) {
        let room = thing.room;
        ensureJobQueuesExist(room);
        let jobs = Memory.creepJobs[room.name].refillEnergy;
        let numRefillJobs = addJobTo(jobs, thing.id);
    },

    /** @param {thing} any damaged structure that needs repair (spawn, containers, ramparts, roads, turrets, etc.) **/
    submitRepairJob: function (thing) {
        let room = thing.room;
        ensureJobQueuesExist(room);
        let jobs = Memory.creepJobs[room.name].repair;
        let numRepairJobs = addJobTo(jobs, thing.id);
    },

    getConstructionJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printConstructionJobs(creep.room);

        let jobs = Memory.creepJobs[creep.room.name].construction;
        let needWork = (creep.memory.constructionJobId === null || creep.memory.constructionJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);
        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs.everythingElse);
            if (newJobId === null || newJobId === undefined) {
                // nothing important needs to be built, so go for roads
                newJobId = getJobFrom(jobs.roads);
            }
            if (newJobId === null || newJobId === undefined) {
                // no construction jobs
                return;
            }

            let structure = Game.getObjectById(newJobId);

            if (!structure) {
                console.log(creep.name + ": getting construction job for " + structure);
            }
            else {
                console.log(creep.name + ": getting construction job for " + Game.getObjectById(newJobId).structureType);
            }
            creep.memory.constructionJobId = newJobId;
        }
    },

    getRefillEnergyJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printRefillEnergyJobs(creep.room);

        let jobs = Memory.creepJobs[creep.room.name].refillEnergy;
        let needWork = (creep.memory.refillEnergyJobId === null || creep.memory.refillEnergyJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);

        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs);
            let structure = Game.getObjectById(newJobId);
            if (!structure) {
                console.log(creep.name + ": getting refill job for " + structure);
            }
            else {
                console.log(creep.name + ": getting refill job for " + Game.getObjectById(newJobId).structureType);
            }
            creep.memory.refillEnergyJobId = newJobId;
        }
    },

    getRepairJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printRepairJobs(creep.room);

        let jobs = Memory.creepJobs[creep.room.name].repair;
        let needWork = (creep.memory.repairJobId === null || creep.memory.repairJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);
        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs);
            let structure = Game.getObjectById(newJobId);
            if (!structure) {
                console.log(creep.name + ": getting repair job for " + structure);
            }
            else {
                console.log(creep.name + ": getting repair job for " + Game.getObjectById(newJobId).structureType);
            }
            creep.memory.repairJobId = newJobId;
        }
    },
}