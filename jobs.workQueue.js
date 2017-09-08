
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



    // in the event of disaster and jobs have built up to no end
    clearJobs: function(room) {
        Memory.creepJobs[room.name].constructionQueue.length = 0;
        Memory.creepJobs[room.name].refillEnergyQueue.length = 0;
        Memory.creepJobs[room.name].repairQueue.length = 0;
    },

    /** @param {constructionSiteId} self-explanatory **/
    submitConstructionJob: function (constructionSite) {
        ensureJobQueuesExist(constructionSite.room);
        if (alreadyQueuedConstructionJob(constructionSite)) {
            return;
        }
        let queue = Memory.creepJobs[constructionSite.room.name].constructionQueue;
        queue.push(constructionSite.id);
        console.log("number of construction jobs: " + queue.length);
    },

    /** @param {thing} any object that can store energy (technically can be a creep, but I'd advise against having creeps submit "refill" jobs because they can move and then you have one creep chasing another **/
    submitRefillEnergyJob: function (thing) {
        ensureJobQueuesExist(thing.room);
        let queue = Memory.creepJobs[thing.room.name].refillEnergyQueue;
        queue.push(thing.id);
        console.log("number of energy refill jobs: " + queue.length);
    },

    /** @param {thing} any damaged structure that needs repair (spawn, containers, ramparts, roads, turrets, etc.) **/
    submitRepairJob: function (thing) {
        ensureJobQueuesExist(thing.room);
        let queue = Memory.creepJobs[thing.room.name].repairQueue;
        queue.push(thing.id);
        console.log("number of repair jobs: " + queue.length);
    },

    getConstructionJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printConstructionQueue(creep.room);

        let needWork = (creep.memory.constructionJobId === null || creep.memory.constructionJobId === undefined);
        if (needWork) {
            // it may be that construction jobs stacked up
            let queue = Memory.creepJobs[creep.room.name].constructionQueue;
            let siteId = null;
            while (queue.length > 0) {
                siteId = queue.shift();
                let site = Game.getObjectById(siteId);
                if (site !== null && site !== undefined) {
                    break;
                }
                else {
                    // already built
                }
            }
            creep.memory.constructionJobId = siteId;
        }
    },

    getRefillEnergyJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printRefillEnergyQueue(creep.room);

        let queue = Memory.creepJobs[creep.room.name].refillEnergyQueue;
        let needWork = (creep.memory.refillEnergyJobId === null || creep.memory.refillEnergyJobId === undefined);
        let haveWork = queue.length > 0;
        //if (needWork) {
        //    // refill jobs can stack up, so loop through them
        //    let structureId = null;
        //    while (queue.length > 0) {
        //        structureId = queue.shift();
        //        let structure = Game.getObjectById(structureId);
        //        if (structure.energy < structure.energyCapacity) {
        //            console.log(creep.name + ": had refill job (" + creep.memory.refillEnergyJobId + "), now assigning refill job (" + structure.structureType + ", " + structure.energy + "/" + structure.energyCapacity + ")");
        //            break;
        //        }
        //        else {
        //            // already full; next
        //            console.log("structure refill job: " + structure.structureType + ", " + structure.energy + "/" + structure.energyCapacity + " already full");
        //        }
        //    }
        //    creep.memory.refillEnergyJobId = structureId;
        //}
        if (needWork && haveWork) {
            structureId = queue.shift();
            let structure = Game.getObjectById(structureId);
            //console.log(creep.name + ": had refill job (" + creep.memory.refillEnergyJobId + "), now assigning refill job (" + structure.structureType + ", " + structure.energy + "/" + structure.energyCapacity + ")");
            creep.memory.refillEnergyJobId = structureId;
        }
    },

    getRepairJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        printRepairQueue(creep.room);

        let queue = Memory.creepJobs[creep.room.name].repairQueue;
        let needWork = (creep.memory.repairJobId === null || creep.memory.repairJobId === undefined);
        let haveWork = queue.length > 0;
        //if (needWork) {
        //    // loop through the repair jobs to make sure that a repair request didn't stack up
        //    let structureId = null;
        //    while (queue.length > 0) {
        //        structureId = queue.shift();
        //        let structure = Game.getObjectById(structureId);
        //        if (structure.hits < structure.hitsMax) {
        //            console.log(creep.name + ": had repair job (" + creep.memory.repairJobId + "), now assigning repair job (" + structure.structureType + ", " + structure.hits + "/" + structure.hitsMax + ")");
        //            break;
        //        }
        //        else {
        //            // already repaired; next
        //            console.log("structure repair job: " + structure.structureType + ", " + structure.hits + "/" + structure.hitsMax + " already at full health");
        //        }
        //    }
        //    creep.memory.repairJobId = structureId;
        //}
        if (needWork && haveWork) {
            structureId = queue.shift();
            let structure = Game.getObjectById(structureId);
            //console.log(creep.name + ": had repair job (" + creep.memory.repairJobId + "), now assigning repair job (" + structure.structureType + ", " + structure.hits + "/" + structure.hitsMax + ")");
            creep.memory.repairJobId = structureId;
        }
    },
}