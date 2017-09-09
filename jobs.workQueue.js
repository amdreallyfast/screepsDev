
/** makes sure that each room has the necessary queue objects **/
let ensureJobQueuesExist = function (room) {
    if (!Memory.creepJobs) {
        Memory.creepJobs = {};
    }
    if (!Memory.creepJobs[room.name]) {
        Memory.creepJobs[room.name] = {};
        Memory.creepJobs[room.name].construction = {};
        Memory.creepJobs[room.name].refillEnergy = {};
        Memory.creepJobs[room.name].repair = {};
    }
}

let printConstructionJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].construction;
    let str = "room " + room.name + " has " + Object.keys(jobs).length + " construction jobs:";
    for (let jobId in jobs) {
        let site = Game.getObjectById(jobId);
        if (!site) {
            str += "null construction site; ";  // uh oh
        }
        else {
            str += (site.structureType + "(" + site.pos.x + "," + site.pos.y + "); ");
        }
    }
    console.log(str);
}

let printRefillEnergyJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].refillEnergy;
    let str = "room " + room.name + " has " + Object.keys(jobs).length + " energy refill jobs: ";
    for (let jobId in jobs) {
        let structure = Game.getObjectById(jobId);
        if (!structure) {
            str += "null structure; ";  // uh oh; let it blow up
        }
        else {
            str += (structure.structureType + "(" + structure.energy + "/" + structure.energyCapacity + "); ");
        }
    }

    console.log(str);
}

let printRepairJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].repair;
    let str = "room " + room.name + " has " + Object.keys(jobs).length + " repair jobs: ";
    for (let jobId in jobs) {
        let structure = Game.getObjectById(jobId);
        if (!structure) {
            str += "null structure; ";  // uh oh; something submitted a null ID as a job; rather than hide the fact, let it blow up in your face so that you can find it and fix it
        }
        else {
            str += (structure.structureType + "(" + structure.hits + "/" + structure.hitsMax + "); ");
        }
    }

    console.log(str);
}

let addJobTo = function (roomJobs, newJobId) {
    if (roomJobs[newJobId] === null || roomJobs[newJobId] === undefined) {
        roomJobs[newJobId] = 1; // 1 worker for new job
    }

    return Object.keys(roomJobs).length;
}

let getJobFrom = function (roomJobs) {
    let jobId = (Object.keys(roomJobs))[0];

    // decrement the worker count
    if (--roomJobs[jobId] === 0) {
        delete roomJobs[jobId];
    }

    return jobId;
}

module.exports = {

    // in the event of disaster and jobs have built up to no end
    clearJobs: function(room) {
        //delete Memory.creepJobs;
        delete Memory.creepJobs[room.name];
    },

    printJobs: function(room) {
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
        let numConstructionJobs = addJobTo(jobs, constructionSite.id)
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
        printConstructionJobs(creep.room);

        let jobs = Memory.creepJobs[creep.room.name].construction;
        let needWork = (creep.memory.constructionJobId === null || creep.memory.constructionJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);
        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs);
            console.log(creep.name + ": getting construction job for " + Game.getObjectById(newJobId).structureType);
            creep.memory.constructionJobId = newJobId;
        }
    },

    getRefillEnergyJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        printRefillEnergyJobs(creep.room);

        let jobs = Memory.creepJobs[creep.room.name].refillEnergy;
        let needWork = (creep.memory.refillEnergyJobId === null || creep.memory.refillEnergyJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);
        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs);
            console.log(creep.name + ": getting refill job for " + Game.getObjectById(newJobId).structureType);
            creep.memory.refillEnergyJobId = newJobId;
        }
    },

    getRepairJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        printRepairJobs(creep.room);

        let jobs = Memory.creepJobs[creep.room.name].repair;
        let needWork = (creep.memory.repairJobId === null || creep.memory.repairJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);
        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs);
            console.log(creep.name + ": getting repair job for " + Game.getObjectById(newJobId).structureType);
            creep.memory.repairJobId = newJobId;
        }
    },
}