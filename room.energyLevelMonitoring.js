
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
    /*--------------------------------------------------------------------------------------------
	Description:
        Prints a nicely formatted string of the various tracked energy levels and the the number 
        of ticks until that energy "times out".
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    print: function (room) {
        guaranteeEnergyLevelMonitoringExists(room);

        let energyTimeouts = Memory.energyTimeouts[room.name];
        let str = ("room " + room.name + " capacity: " + room.energyCapacityAvailable + ", available: ");
        for (let index in energyTimeouts) {
            let timeout = energyTimeouts[index];
            str += (timeout.energy + "(" + ((timeout.ticksUntilTimeout > 0) ? ("timeout in " + timeout.ticksUntilTimeout) : "timed out") + "); ");
        }

        console.log(str);
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        This is a vital module in keeping the creep build requests at a reasonable expense.  If 
        the room's effective energy capacity drops, such as if a bunch of creeps are destroyed 
        and energy stops being obtained, then there needs to be a way to know that this energy 
        hasn't been available in a while and anything that depends on that energy capacity 
        should be dismissed.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
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

    /*--------------------------------------------------------------------------------------------
	Description:
        Better than room.energyCapacityAvailable because, even if the capacity is technically 
        there, it may have not been reached in a while (ex: creeps are destroyed and stop 
        refilling).
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
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

    /*--------------------------------------------------------------------------------------------
	Description:
        Convenience.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
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
