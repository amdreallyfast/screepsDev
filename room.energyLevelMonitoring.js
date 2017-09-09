
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
}

module.exports = {
    printEnergyTimeoutsForRoom: function(room) {
        guaranteeEnergyLevelMonitoringExists(room);

        let energyTimeouts = Memory.energyTimeouts[room.name];
        let str = ("room " + room.name + " capacity: " + room.energyCapacityAvailable + ", available: ");
        for (let index in energyTimeouts) {
            let timeout = energyTimeouts[index];
            str += (timeout.energy + "(" + ((timeout.ticksUntilTimeout > 0) ? ("timeout in " + timeout.ticksUntilTimeout) : "timed out") + "); ");
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

        //console.log("max supported energy in room " + room.name + ": " + maxEnergy);
        return maxEnergy;
    }
}
