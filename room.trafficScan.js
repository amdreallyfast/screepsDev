
let creepJobSystem = require("jobs.workQueue");
let myConstants = require("myConstants");


let ensureTrafficRecordsExist = function (room) {
    if (!Memory.creepTrafficRecords) {
        Memory.creepTrafficRecords = {};
    }
    if (!Memory.creepTrafficRecords[room.name]) {
        Memory.creepTrafficRecords[room.name] = {};
    }
}

module.exports = {
    print: function (room) {
        ensureTrafficRecordsExist(room);
        let roomTraffic = Memory.creepTrafficRecords[room.name];
        let str = "creep traffic in room " + room.name + ": { ";
        for (let key in roomTraffic) {
            str += key + ": " + roomTraffic[key] + ", ";
        }
        str += "}";
        console.log(str);
    },

    scan: function (creep) {
        let room = creep.room;
        if (room.controller.level < 3) {
            // don't even bother; the creeps are still small, can't carry much energy, and can't work fast
        }

        ensureTrafficRecordsExist(room);

        let doNotBuildHere = false;
        let thingsAlreadyHere = creep.pos.look();
        for (let index in thingsAlreadyHere) {
            let lookType = thingsAlreadyHere[index].type;
            // creeps can run on top of structures and construction sites 
            // Note: Roads are technically structures, as are ramparts, and creeps frequently 
            // move on top of them.  Creeps can also run on top of containers and construction 
            // sites, though they usually don't.
            if (lookType === LOOK_STRUCTURES || lookType === LOOK_CONSTRUCTION_SITES) {
                doNotBuildHere = true;
            }
            else if (lookType === LOOK_CREEPS) {
                // miners stay in one place
                if (thingsAlreadyHere[index].creep.memory.role === myConstants.creepRoleMiner) {
                    doNotBuildHere = true;
                }
            }
        }
        if (doNotBuildHere) {
            // traffic monitoring is for the sake of building things; if a road shouldn't be built here, don't scan it
            return;
        }

        let creepPosStr = "" + creep.pos.x + creep.pos.y;

        // Note: Use the room traffic object, not the traffic counter for the specific creep 
        // position, because the traffic counter is a primitive (an integer, specifically), so 
        // it will be copied.  I want a variable to make a shorthand for the object in memory, 
        // so I need a reference, which only happens for a non-primitive object, like room 
        // traffic object.
        let roomTraffic = Memory.creepTrafficRecords[room.name];
        if (roomTraffic[creepPosStr] === null || roomTraffic[creepPosStr] === undefined) {
            roomTraffic[creepPosStr] = 1;
            return;
        }

        // ??Create a colored flag based on traffic??
        roomTraffic[creepPosStr]++;
        //console.log(creep.pos + " traffic counter: " + Memory.creepTrafficRecords[room.name][creepPosStr]);
        if (roomTraffic[creepPosStr] === 100) {
            // high traffic area
            // Note: The construction site will not appear until the next tick.  The jobs.
            // construction module should be isntructed to scan for it then.
            console.log("creating road construction site in room " + room.name + " at (" + creep.pos.x + "," + creep.pos.y + ")");
            creep.pos.createConstructionSite(STRUCTURE_ROAD);
            delete Memory.creepTrafficRecords[room.name][creepPosStr];
        }
    }
};