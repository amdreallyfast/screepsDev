
var creepBuildQueue = {}

module.exports = {
    submit: function (buildThis) {
        if (!creepBuildQueue[spawn]) {
            // must be a new spawn; make a build queue
            creepBuildQueue[spawn] = [];
        }

        // check if it already exists
        for (var buildRequest in creepBuildQueue) {
            if (buildRequest === buildThis) {
                return;
            }
        }

        // don't have this job, so make it happen
        creepBuildQueue[spawn].push(buildThis);
    },

    haveBuildJob: function (spawn) {
        if (!creepBuildQueue[spawn]) {
            // don't even have a build queue
            return false;
        }

        return (creepBuildQueue[spawn].length > 0);
    },

    requiredEnergyForNext: function (spawn) {
        if (!creepBuildQueue[spawn]) {
            // don't even have a build queue
            return 0;
        }

        let buildRequest = creepBuildQueue[spawn];
        let energyCost = 0;
        for (let part in buildRequest.body) {
            if (part === WORK) {
                energyCost += 100;
            }
            else if (part === MOVE) {
                energyCost += 50;
            }
            else if (part === CARRY) {
                energyCost += 50;
            }
            else {
                // TODO: other body parts
            }
        }

        return energyCost;
    },

    getNext: function (spawn) {
        if (!creepBuildQueue[spawn]) {
            // don't even have a build queue
            return null;
        }
        else if (creepBuildQueue[spawn].length === 0) {
            return null;
        }

        // array.pop() removes the last element, but I want a FIFO queue
        return creepBuildQueue.shift();
    }
}
