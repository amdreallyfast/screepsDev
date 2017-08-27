
var jobs = {}

/** makes sure that each room has the necessary queue objects **/
var ensureJobQueuesExist = function(room) {
    if (!jobs[room]) {
        jobs[room] = {};
        jobs[room].buildQueue = [];
        jobs[room].refillEnergyQueue = [];
        jobs[room].repairQueue = [];
    }
}

module.exports = {
    // TODO: put this into one of the update routines that creates construction sites
    ///** @param {where} a RoomPosition object **/
    ///** @param {structureType} STRUCTURE_ROAD, STRUCTURE_CONTAINER, etc. **/
    //submitBuildJob: function(where, structureType) {
    //    let room = Game.rooms[where.roomName];
    //    ensureJobQueuesExist(room);

    //    // is it trying to build on top of something?
    //    where.look().forEach(function(thing) {
    //        let cannotBuildHere = 
    //            thing.type === LOOK_SOURCES ||
    //            thing.type === LOOK_RESOURCES ||
    //            thing.type === LOOK_CONSTRUCTION_SITES ||
    //            thing.type === LOOK_STRUCTURES;

    //        if (cannotBuildHere) {
    //            return;
    //        }
    //    });

    //    // was the request already submitted?
    //    // Note: If this job system is working correctly, then it shouldn't.
    //    jobs[room].buildQueue.forEach(function(buildRequest) {
    //        let alreadyQueued = 
    //            buildRequest.where === where &&
    //            buildRequest.structureType === structureType;
    //        if (alreadyQueued) {
    //            console.log("submitBuildJob(...) already has a job here");
    //            return;
    //        }
    //    });

    //    // construction site is good to go
    //    jobs[room].buildQueue.push({
    //        where: where,
    //        type: structureType
    //    });
    //},

    /** @param {constructionSiteId} slef-explanatory **/
    submitBuildJob: function (constructionSite) {
        ensureJobQueuesExist(constructionSite.room);
        jobs[constructionSite.room].buildQueue.push(constructionSite.id);
    },

    /** @param {thing} any object that can store energy (technically can be a creep, but I'd advise against having creeps submit "refill" jobs because they can move and then you have one creep chasing another **/
    submitRefillEnergyJob: function (thing) {
        ensureJobQueuesExist(thing.room);
        jobs[thing.room].refillEnergyQueue.push(thing.id);
    },

    /** @param {thing} any damaged structure that needs repair (spawn, containers, ramparts, roads, turrets, etc.) **/
    submitRepairJob: function (thing) {
        ensureJobQueuesExist(thing.room);
        jobs[thing.room].repairQueue.push(thing.id);
    },

    /** @param {creep} self-explanatory **/
    assignJobs: function(creep) {
        ensureJobQueuesExist(creep.room);

        // Note: Using shift() instead of pop() because the latter pops off the back and I want a FIFO queue.
        // Also Note: JavaScript passes objects by reference, so shifting out of this variable will affect the original object.
        let roomJobs = jobQueue[creep.room];
        let needWork = false;
        let haveWork;

        // building
        needWork = (creep.memory.constructionJobId === null);
        haveWork = (roomJobs.buildQueue.length !== 0);
        if (needWork && haveWork) {
            creep.memory.constructionJobId = roomJobs.buildQueue.shift();
        }

        // spawns and extensions and turrets
        needWork = (creep.memory.refillEnergyJobId === null);
        haveWork = (roomJobs.refillEnergyQueue.length !== 0);
        if (needWork && haveWork) {
            creep.memory.refillEnergyJobId = roomJobs.refillEnergyQueue.shift();
        }

        // structures that are decaying or damaged 
        needWork = (creep.memory.repairJobId === null);
        haveWork = (roomJobs.repairQueue.length !== 0);
        if (needWork && haveWork) {
            creep.memory.repairJobId = roomJobs.repairQueue.shift();
        }
    }
}