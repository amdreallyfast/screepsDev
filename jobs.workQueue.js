
/** makes sure that each room has the necessary queue objects **/
let ensureJobQueuesExist = function (room) {
    if (!Memory.creepJobs) {
        Memory.creepJobs = {};
    }
    if (!Memory.creepJobs[room.name]) {
        Memory.creepJobs[room.name] = {};
        Memory.creepJobs[room.name].constructionQueue = [];
        Memory.creepJobs[room.name].refillEnergyQueue = [];
        Memory.creepJobs[room.name].repairQueue = [];
    }
}

//??more efficient approach than running through all construction sites?
let alreadyQueuedConstructionJob = function (newSite) {
    let queue = Memory.creepJobs[newSite.room.name].constructionQueue;
    for (let index in queue) {
        let existingSiteId = queue[index];
        if (newSite.id === existingSiteId) {
            return true;
        }
    }

    return false;
}

let printConstructionQueue = function (room) {
    let queue = Memory.creepJobs[room.name].constructionQueue;
    let str = "construction sites in room " + room.name + " (" + queue.length + "): ";
    for (let index in queue) {
        let site = Game.getObjectById(queue[index]);
        if (!site) {
            // uh oh; null site; 
            console.log("uh oh; null construction site");
        }
        else {
            str += (site.structureType + "(" + site.pos.x + "," + site.pos.y + "); ");
        }
    }
    console.log(str);
}

let printRefillEnergyQueue = function (room) {
    let queue = Memory.creepJobs[room.name].refillEnergyQueue;
    let str = "structures needing energy in room " + room.name + " (" + queue.length + "): ";
    for (let index in queue) {
        let structure = Game.getObjectById(queue[index]);
        if (!structure) {
            console.log("uh oh; null structure needing energy refill");
        }
        else {
            str += (structure.structureType + "(" + structure.energy + "/" + structure.energyCapacity + "); ");
        }
    }

    console.log(str);
}

let printRepairQueue = function (room) {
    let queue = Memory.creepJobs[room.name].repairQueue;
    let str = "structures needing repair in room " + room.name + " (" + queue.length + "): ";
    for (let index in queue) {
        let structure = Game.getObjectById(queue[index]);
        if (!structure) {
            console.log("uh oh; null structure needing repair");
        }
        else {
            str += (structure.structureType + "(" + structure.hits + "/" + structure.hitsMax + "); ");
        }
    }

    console.log(str);
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
    //    jobs[room].constructionQueue.forEach(function(buildRequest) {
    //        let alreadyQueued = 
    //            buildRequest.where === where &&
    //            buildRequest.structureType === structureType;
    //        if (alreadyQueued) {
    //            console.log("submitBuildJob(...) already has a job here");
    //            return;
    //        }
    //    });

    //    // construction site is good to go
    //    jobs[room].constructionQueue.push({
    //        where: where,
    //        type: structureType
    //    });
    //},

    /** @param {constructionSiteId} self-explanatory **/
    submitConstructionJob: function (constructionSite) {
        ensureJobQueuesExist(constructionSite.room);
        if (alreadyQueuedConstructionJob(constructionSite)) {
            return;
        }
        Memory.creepJobs[constructionSite.room.name].constructionQueue.push(constructionSite.id);
    },

    /** @param {thing} any object that can store energy (technically can be a creep, but I'd advise against having creeps submit "refill" jobs because they can move and then you have one creep chasing another **/
    submitRefillEnergyJob: function (thing) {
        ensureJobQueuesExist(thing.room);
        Memory.creepJobs[thing.room.name].refillEnergyQueue.push(thing.id);
    },

    /** @param {thing} any damaged structure that needs repair (spawn, containers, ramparts, roads, turrets, etc.) **/
    submitRepairJob: function (thing) {
        ensureJobQueuesExist(thing.room);
        Memory.creepJobs[thing.room.name].repairQueue.push(thing.id);
    },

    getConstructionJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        printConstructionQueue(creep.room);
        let queue = Memory.creepJobs[creep.room.name].constructionQueue;

        let needWork = (creep.memory.constructionJobId === null || creep.memory.constructionJobId === undefined);
        let haveWork = (queue.length > 0);
        //console.log(creep.name + " needs construction work? " + needWork + ", have construction work? " + haveWork);
        if (needWork && haveWork) {
            //console.log(creep.name + " assigning construction work");
            creep.memory.constructionJobId = queue.shift();
        }
    },

    getRefillEnergyJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printRefillEnergyQueue(creep.room);
        let queue = Memory.creepJobs[creep.room.name].refillEnergyQueue;

        needWork = (creep.memory.refillEnergyJobId === null || creep.memory.constructionJobId === undefined);
        haveWork = (queue.length > 0);
        //console.log(creep.name + " needs energy refill work? " + needWork + ", have energy refill work? " + haveWork);
        if (needWork && haveWork) {
            //console.log(creep.name + " assigning energy refill work");
            let objectId = queue.shift();
            //let thing = Game.getObjectById(objectId);
            //console.log(creep.name + " now assigned to refill " + thing.structureType);
            creep.memory.refillEnergyJobId = objectId;
        }
    },

    getRepairJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printRepairQueue(creep.room);
        let queue = Memory.creepJobs[creep.room.name].repairQueue;

        let needWork = (creep.memory.repairJobId === null || creep.memory.constructionJobId === undefined);
        let haveWork = (queue.length > 0);
        //console.log(creep.name + " needs repair work? " + needWork + ", have repair work? " + haveWork);
        if (needWork && haveWork) {
            //console.log(creep.name + " assigning repair work");
            creep.memory.repairJobId = queue.shift();
        }
    },

    ///** @param {creep} self-explanatory **/
    //assignJobs: function (creep) {
    //    ensureJobQueuesExist(creep.room);

    //    getRefillEnergyJobFor(creep);
    //    getRepairJobFor(creep);
    //    getConstructionJobFor(creep);

    //    ////printRefillEnergyQueue(creep.room);
    //    ////printRepairQueue(creep.room);
    //    ////printConstructionQueue(creep.room);

    //    //// Note: Using shift() instead of pop() because the latter pops off the back and I want a FIFO queue.
    //    //// Also Note: JavaScript passes objects by reference, so shifting out of this variable will affect the original object.
    //    //let roomJobs = Memory.creepJobs[creep.room.name];
    //    //let needWork = false;
    //    //let haveWork;

    //    //// building
    //    //needWork = (creep.memory.constructionJobId === null || creep.memory.constructionJobId === undefined);
    //    //haveWork = (roomJobs.constructionQueue.length > 0);
    //    ////console.log(creep.name + " needs construction work? " + needWork + ", have construction work? " + haveWork);
    //    //if (needWork && haveWork) {
    //    //    //creep.log(creep.name + " assigning construction work");
    //    //    creep.memory.constructionJobId = roomJobs.constructionQueue.shift();
    //    //}

    //    //// spawns and extensions and turrets
    //    //needWork = (creep.memory.refillEnergyJobId === null || creep.memory.constructionJobId === undefined);
    //    //haveWork = (roomJobs.refillEnergyQueue.length > 0);
    //    ////console.log(creep.name + " needs energy refill work? " + needWork + ", have energy refill work? " + haveWork);
    //    ////if (!needWork) {
    //    ////    console.log(creep.name + ": already have construction job '" + creep.memory.refillEnergyJobId + "'");
    //    ////}
    //    ////else if (!haveWork) {
    //    ////    console.log(creep.name + ": no energy refill jobs available");
    //    ////}
    //    ////else {
    //    ////    console.log(creep.name + ": there are '" + roomJobs.refillEnergyQueue.length + "' refill jobs available; taking 1st available");
    //    ////}
    //    //if (needWork && haveWork) {
    //    //    creep.memory.refillEnergyJobId = roomJobs.refillEnergyQueue.shift();
    //    //}

    //    //// structures that are decaying or damaged 
    //    //needWork = (creep.memory.repairJobId === null || creep.memory.constructionJobId === undefined);
    //    //haveWork = (roomJobs.repairQueue.length > 0);
    //    ////console.log(creep.name + " needs repair work? " + needWork + ", have repair work? " + haveWork);
    //    //if (needWork && haveWork) {
    //    //    creep.memory.repairJobId = roomJobs.repairQueue.shift();
    //    //}
    //}
}