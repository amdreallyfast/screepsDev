
let creepJobSystem = require("jobs.workQueue");

let ensureTrafficRecordsExist = function (room) {
    if (!Memory.creepTrafficRecords) {
        Memory.creepTrafficRecords = {};
    }
    if (!Memory.creepTrafficRecords[room.name]) {
        Memory.creepTrafficRecords[room.name] = {};
    }
}

module.exports = {
    scan: function (creep) {
        let room = creep.room;
        ensureTrafficRecordsExist(room);

        let thingsAlreadyHere = creep.pos.look();
        for (let index in thingsAlreadyHere) {
            let lookType = thingsAlreadyHere[index];

            // creeps can run on top of structures and construction sites 
            // Note: Roads are technically structures, as are ramparts, and creeps frequently 
            // move on top of them.  Creeps can also run on top of containers and construction 
            // sites, though they usually don't.
            if (lookType === LOOK_STRUCTURES || lookType === LOOK_CONSTRUCTION_SITES) {
                return false;
            }
        }

        let creepPosStr = "" + creep.pos.x + creep.pos.y;
        let positionTraffic = Memory.creepTrafficRecords[room.name][creepPosStr];
        if (positionTraffic === null || positionTraffic === undefined) {
            Memory.creepTrafficRecords[room.name][creepPosStr] = 1;
            return;
        }

        // ??Create a colored flag based on traffic??
        positionTraffic++;
        if (positionTraffic === 100) {
            // high traffic area
            // Note: The construction site will not appear until the next tick.  The jobs.
            // construction module should be isntructed to scan for it then.
            console.log("creating road construction site in room " + room.name + " at (" + creep.pos.x + "," + creep.pos.y + ")");
            creep.pos.createConstructionSite(STRUCTURE_ROAD);
            delete Memory.creepTrafficRecords[room.name][creepPosStr];
        }
    }
};