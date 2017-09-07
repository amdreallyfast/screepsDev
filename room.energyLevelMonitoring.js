
const TICKS_UNTIL_TIMEOUT = 1000;

let guaranteeEnergyLevelMonitoringExists = function (room) {
    if (!Memory.energyLevels) {
        Memory.energyLevels = {}
    }
    if (!Memory.energyLevels[room.name]) {
        Memory.energyLevels[room.name] = {
            //300: {
            //    timer: TICKS_UNTIL_TIMEOUT,
            //    update: function(currentEnergy) {
            //        if (currentEnergy < )
            //    }
            //}

            // a stand-alone spawn will build up 1 energy/tick until 300 (full), so 300 is the minimum
            timeoutTicks300: TICKS_UNTIL_TIMEOUT,

            // 350 is enough for a very mobile, basic worker (WORK, CARRY, MOVE, MOVE)
            timeoutTicks350: TICKS_UNTIL_TIMEOUT,

            // everything else in increments of 100 energy
            timeoutTicks450: TICKS_UNTIL_TIMEOUT,
            timeoutTicks550: TICKS_UNTIL_TIMEOUT,
            timeoutTicks650: TICKS_UNTIL_TIMEOUT,
            timeoutTicks750: TICKS_UNTIL_TIMEOUT,
            timeoutTicks850: TICKS_UNTIL_TIMEOUT,
            timeoutTicks950: TICKS_UNTIL_TIMEOUT,
            timeoutTicks1050: TICKS_UNTIL_TIMEOUT,
        }
    }
}



module.exports = {
    printEnergyTimeoutsForRoom: function(room) {
        guaranteeEnergyLevelMonitoringExists(room);

        let energyRecords = Memory.energyLevels[room.name];
        let str = ("room " + room.name + " capacity: " + room.energyCapacityAvailable + ", available: ");
        str += ("300 (" + ((energyRecords.timeoutTicks300 > 0) ? ("available " + energyRecords.timeoutTicks300) : "timed out") + "); ");
        str += ("350 (" + ((energyRecords.timeoutTicks350 > 0) ? ("available " + energyRecords.timeoutTicks350) : "timed out") + "); ");
        str += ("450 (" + ((energyRecords.timeoutTicks450 > 0) ? ("available " + energyRecords.timeoutTicks450) : "timed out") + "); ");
        str += ("550 (" + ((energyRecords.timeoutTicks550 > 0) ? ("available " + energyRecords.timeoutTicks550) : "timed out") + "); ");
        str += ("650 (" + ((energyRecords.timeoutTicks650 > 0) ? ("available " + energyRecords.timeoutTicks650) : "timed out") + "); ");
        str += ("750 (" + ((energyRecords.timeoutTicks750 > 0) ? ("available " + energyRecords.timeoutTicks750) : "timed out") + "); ");
        str += ("850 (" + ((energyRecords.timeoutTicks850 > 0) ? ("available " + energyRecords.timeoutTicks850) : "timed out") + "); ");
        str += ("950 (" + ((energyRecords.timeoutTicks950 > 0) ? ("available " + energyRecords.timeoutTicks950) : "timed out") + "); ");
        str += ("1050 (" + ((energyRecords.timeoutTicks1050 > 0) ? ("available " + energyRecords.timeoutTicks1050) : "timed out") + "); ");

        console.log(str);
    },

    update: function (room) {
        guaranteeEnergyLevelMonitoringExists(room);

        let spawnsInRoom = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_SPAWN);
            }
        });

        let currentEnergyLevel = room.energyAvailable;
        //console.log(room.name + ": current energy available: " + currentEnergyLevel);
        let energyRecords = Memory.energyLevels[room.name];

        if (spawnsInRoom.length === 0) {
            // can't build anything
            energyRecords.timeoutTicks300 = 0;
            energyRecords.timeoutTicks350 = 0;
            energyRecords.timeoutTicks450 = 0;
            energyRecords.timeoutTicks550 = 0;
            energyRecords.timeoutTicks650 = 0;
            energyRecords.timeoutTicks750 = 0;
            energyRecords.timeoutTicks850 = 0;
            energyRecords.timeoutTicks950 = 0;
            energyRecords.timeoutTicks1050 = 0;

            return;
        }

        if (currentEnergyLevel >= 300) {
            energyRecords.timeoutTicks300 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks300--;
        }

        if (currentEnergyLevel >= 350) {
            energyRecords.timeoutTicks350 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks350--;
        }

        if (currentEnergyLevel >= 450) {
            energyRecords.timeoutTicks450 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks450--;
        }

        if (currentEnergyLevel >= 550) {
            energyRecords.timeoutTicks550 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks550--;
        }

        if (currentEnergyLevel >= 650) {
            energyRecords.timeoutTicks650 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks650--;
        }

        if (currentEnergyLevel >= 750) {
            energyRecords.timeoutTicks750 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks750--;
        }

        if (currentEnergyLevel >= 850) {
            energyRecords.timeoutTicks850 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks850--
        }

        if (currentEnergyLevel >= 950) {
            energyRecords.timeoutTicks950 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks950--;
        }

        if (currentEnergyLevel >= 1050) {
            energyRecords.timeoutTicks1050 = TICKS_UNTIL_TIMEOUT;
        }
        else {
            energyRecords.timeoutTicks1050--;
        }
    },

    canAffordEnergyLevel: function (room, desiredEnergy) {
        let energyLevels = Memory.energyLevels[room.name];

        // if there are no spawns in this room, then all energy levels will be timed out
        if (desiredEnergy < 300 && energyLevels.timeoutTicks300 > 0) {
            return true;
        }
        else if (desiredEnergy < 350 && energyLevels.timeoutTicks350 > 0) {
            return true;
        }
        else if (desiredEnergy < 450 && energyLevels.timeoutTicks450 > 0) {
            return true;
        }
        else if (desiredEnergy < 550 && energyLevels.timeoutTicks550 > 0) {
            return true;
        }
        else if (desiredEnergy < 650 && energyLevels.timeoutTicks650 > 0) {
            return true;
        }
        else if (desiredEnergy < 750 && energyLevels.timeoutTicks750 > 0) {
            return true;
        }
        else if (desiredEnergy < 850 && energyLevels.timeoutTicks850 > 0) {
            return true;
        }
        else if (desiredEnergy < 950 && energyLevels.timeoutTicks950 > 0) {
            return true;
        }
        else if (desiredEnergy < 1050 && energyLevels.timeoutTicks1050 > 0) {
            return true;
        }

        return false;
    }
}
