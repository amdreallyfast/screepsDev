
const MAX_TICKS_UNTIL_TIMEOUT = 1000;

let guaranteeEnergyLevelMonitoringExists = function (room) {
    if (!Memory.energyTimeouts) {
        Memory.energyTimeouts = {}
    }
    if (!Memory.energyTimeouts[room.name]) {
        Memory.energyTimeouts[room.name] = [];
        Memory.energyTimeouts[room.name].push({ energy: 300, ticksUntilTimeout: 0 });
        Memory.energyTimeouts[room.name].push({ energy: 350, ticksUntilTimeout: 0 });
        Memory.energyTimeouts[room.name].push({ energy: 450, ticksUntilTimeout: 0 });
        Memory.energyTimeouts[room.name].push({ energy: 550, ticksUntilTimeout: 0 });
        Memory.energyTimeouts[room.name].push({ energy: 650, ticksUntilTimeout: 0 });
        Memory.energyTimeouts[room.name].push({ energy: 750, ticksUntilTimeout: 0 });
        Memory.energyTimeouts[room.name].push({ energy: 850, ticksUntilTimeout: 0 });
        Memory.energyTimeouts[room.name].push({ energy: 950, ticksUntilTimeout: 0 });
    }

    //console.log("does Memory.energyLevels exist? " + (Memory.energyLevels));
    //if (Memory.energyLevels[room.name]) {
    //    console.log("resetting memory for energy timeouts")
    //    delete Memory.energyLevels;
    //}
}

module.exports = {
    printEnergyTimeoutsForRoom: function(room) {
        guaranteeEnergyLevelMonitoringExists(room);

        let energyTimeouts = Memory.energyTimeouts[room.name];
        let str = ("room " + room.name + " capacity: " + room.energyCapacityAvailable + ", available: ");
        //str += ("300 (" + ((energyRecords.timeoutTicks300 > 0) ? ("available " + energyRecords.timeoutTicks300) : "timed out") + "); ");
        //str += ("350 (" + ((energyRecords.timeoutTicks350 > 0) ? ("available " + energyRecords.timeoutTicks350) : "timed out") + "); ");
        //str += ("450 (" + ((energyRecords.timeoutTicks450 > 0) ? ("available " + energyRecords.timeoutTicks450) : "timed out") + "); ");
        //str += ("550 (" + ((energyRecords.timeoutTicks550 > 0) ? ("available " + energyRecords.timeoutTicks550) : "timed out") + "); ");
        //str += ("650 (" + ((energyRecords.timeoutTicks650 > 0) ? ("available " + energyRecords.timeoutTicks650) : "timed out") + "); ");
        //str += ("750 (" + ((energyRecords.timeoutTicks750 > 0) ? ("available " + energyRecords.timeoutTicks750) : "timed out") + "); ");
        //str += ("850 (" + ((energyRecords.timeoutTicks850 > 0) ? ("available " + energyRecords.timeoutTicks850) : "timed out") + "); ");
        //str += ("950 (" + ((energyRecords.timeoutTicks950 > 0) ? ("available " + energyRecords.timeoutTicks950) : "timed out") + "); ");
        //str += ("1050 (" + ((energyRecords.timeoutTicks1050 > 0) ? ("available " + energyRecords.timeoutTicks1050) : "timed out") + "); ");
        for (let index in energyTimeouts) {
            let timeout = energyTimeouts[index];
            str += (timeout.energy + "(" + ((timeout.ticksUntilTimeout > 0) ? ("available for " + timeout.ticksUntilTimeout) : " timed out") + "); ");
        }

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
        let energyTimeouts = Memory.energyTimeouts[room.name];

        if (spawnsInRoom.length === 0) {
            // can't build anything
            for (let index in energyTimeouts) {
                energyTimeouts[index].ticksUntilTimeout = 0;
            }
            return;
        }

        for (let index in energyTimeouts) {
            let timeout = energyTimeouts[index];
            //console.log("current energy level > timeout energy? (" + currentEnergyLevel + " > " + timeout.energy + "?, " + (currentEnergyLevel > timeout.energy))
            if (currentEnergyLevel >= timeout.energy) {
                timeout.ticksUntilTimeout = MAX_TICKS_UNTIL_TIMEOUT;
            }
            else {
                timeout.ticksUntilTimeout--;
            }
        }
    },

    canAffordEnergyLevel: function (room, desiredEnergy) {
        let energyTimeouts = Memory.energyTimeouts[room.name];

        for (let index in energyTimeouts) {
            let timeout = energyTimeouts[index];
            if (desiredEnergy <= timeout.energy) {
                if (timeout.ticksUntilTimeout > 0) {
                    // wait for it
                    return true;
                }
                else {
                    console.log("desiring " + desiredEnergy + " energy, but " + timeout.energy + " has timed out");
                    return false;
                }
            }
            else {
                // check the next record
            }
        }

        return false;


        //// if there are no spawns in this room, then all energy levels will be timed out
        //if (desiredEnergy < 300 && energyLevels.timeoutTicks300 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 300 energy has timed out (" + energyLevels.timeoutTicks300 + ")");
        //    return true;
        //}
        //else if (desiredEnergy < 350 && energyLevels.timeoutTicks350 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 350 energy has timed out (" + energyLevels.timeoutTicks350 + ")");
        //    return true;
        //}
        //else if (desiredEnergy < 450 && energyLevels.timeoutTicks450 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 450 energy has timed out (" + energyLevels.timeoutTicks450 + ")");
        //    return true;
        //}
        //else if (desiredEnergy < 550 && energyLevels.timeoutTicks550 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 550 energy has timed out (" + energyLevels.timeoutTicks550 + ")");
        //    return true;
        //}
        //else if (desiredEnergy < 650 && energyLevels.timeoutTicks650 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 650 energy has timed out (" + energyLevels.timeoutTicks650 + ")");
        //    return true;
        //}
        //else if (desiredEnergy < 750 && energyLevels.timeoutTicks750 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 750 energy has timed out (" + energyLevels.timeoutTicks750 + ")");
        //    return true;
        //}
        //else if (desiredEnergy < 850 && energyLevels.timeoutTicks850 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 850 energy has timed out (" + energyLevels.timeoutTicks850 + ")");
        //    return true;
        //}
        //else if (desiredEnergy < 950 && energyLevels.timeoutTicks950 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 950 energy has timed out (" + energyLevels.timeoutTicks950 + ")");
        //    return true;
        //}
        //else if (desiredEnergy < 1050 && energyLevels.timeoutTicks1050 > 0) {
        //    console.log("desiring " + desiredEnergy + " energy, but 1050 energy has timed out (" + energyLevels.timeoutTicks1050 + ")");
        //    return true;
        //}

        return false;
    },

    maximumSupportedEnergy: function (room) {
        let energyTimeouts = Memory.energyTimeouts[room.name];

        let maxEnergy = 0;
        for (let index in energyTimeouts) {
            let timeout = energyTimeouts[index];
            if (timeout.energy > maxEnergy && timeout.ticksUntilTimeout > 0) {
                maxEnergy = timeout.energy;
            }
        }

        console.log("max supported energy in room " + room.name + ": " + maxEnergy);
        return maxEnergy;
    }
}
