
/*------------------------------------------------------------------------------------------------
Description:
    Ensures that memory is defined before attempting to access it.  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let ensureJobQueuesExist = function (room) {
    if (!Memory.creepJobs) {
        Memory.creepJobs = {};
    }
    if (!Memory.creepJobs[room.name]) {
        Memory.creepJobs[room.name] = {};
        Memory.creepJobs[room.name].construction = {
            everythingElse: {},
            roads: {}
        };
        Memory.creepJobs[room.name].refillEnergy = {};
        Memory.creepJobs[room.name].repair = {};
    }
}

/*------------------------------------------------------------------------------------------------
Description:
    Generates a nicely formatted string of all the construction jobs and prints them to the 
    console.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let printConstructionJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].construction;
    let numImportandConstructionJobs = 0;
    let everythingElseStr = "{ ";
    for (let jobId in jobs.everythingElse) {
        numImportandConstructionJobs++;
        let site = Game.getObjectById(jobId);
        if (!site) {
            everythingElseStr += "null; ";  // uh oh
        }
        else {
            everythingElseStr += (site.structureType + "(" + site.progress + "/" + site.progressTotal + "); ");
        }
    }
    everythingElseStr += "}";

    let numRoadConstructionJobs = 0;
    let roadsStr = "{ ";
    for (let jobId in jobs.roads) {
        numRoadConstructionJobs++;
        let site = Game.getObjectById(jobId);
        if (!site) {
            roadsStr += "null; ";  // uh oh
        }
        else {
            roadsStr += (site.structureType + "(" + site.progress + "/" + site.progressTotal + "); ");
        }
    }
    roadsStr += "}";

    console.log("room " + room.name + " construction jobs: \n\t" + "important(" + numImportandConstructionJobs + "): " + everythingElseStr + "\n\t" + "roads(" + numRoadConstructionJobs + "): " + roadsStr);
}

/*------------------------------------------------------------------------------------------------
Description:
    Generates a nicely formatted string of all the energy refill jobs and prints them to the 
    console.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let printRefillEnergyJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].refillEnergy;
    let str = "{ ";
    for (let jobId in jobs) {
        let structure = Game.getObjectById(jobId);
        if (!structure) {
            str += "null structure; ";  // uh oh; let it blow up
        }
        else {
            str += (structure.structureType + "(" + structure.energy + "/" + structure.energyCapacity + "); ");
        }
    }
    str += "}";
    console.log("room " + room.name + " has " + Object.keys(jobs).length + " energy refill jobs: " + str);
}

/*------------------------------------------------------------------------------------------------
Description:
    Generates a nicely formatted string of all the repair jobs and prints them to the console.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let printRepairJobs = function (room) {
    let jobs = Memory.creepJobs[room.name].repair;
    let str = "{ ";
    for (let jobId in jobs) {
        let structure = Game.getObjectById(jobId);
        if (!structure) {
            str += "null structure; ";  // uh oh; something submitted a null ID as a job; rather than hide the fact, let it blow up in your face so that you can find it and fix it
        }
        else {
            str += (structure.structureType + "(" + structure.hits + "/" + structure.hitsMax + "); ");
        }
    }
    str += "}";
    console.log("room " + room.name + " has " + Object.keys(jobs).length + " repair jobs: " + str);
}

/*------------------------------------------------------------------------------------------------
Description:
    If the job has already been submitted to the specified queue, then it is ignored, otherwise 
    it is submitted to the queue.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let addJobTo = function (jobQueue, newJobId) {
    if (jobQueue[newJobId] === null || jobQueue[newJobId] === undefined) {
        jobQueue[newJobId] = 1; // 1 worker for new job
    }

    return Object.keys(jobQueue).length;
}

/*------------------------------------------------------------------------------------------------
Description:
    Pulls the next valid job from the specified queue
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let getJobFrom = function (jobQueue) {
    for (let jobId in jobQueue) {
        let obj = Game.getObjectById(jobId);
        if (obj === null || obj === undefined) {
            // job must have completed
            // Note: Construction sites can be completed when there is still a job for it.  In 
            // such an event, remove the job.
            console.log("null job; deleting")
            delete jobQueue[jobId];
        }
        else {
            // decrement the worker count
            if (--jobQueue[jobId] === 0) {
                delete jobQueue[jobId];
            }
            return jobId;
        }
    }

    return null;
}

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Calls the printing functions for each of the job queues.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    print: function (room) {
        ensureJobQueuesExist(room);
        printConstructionJobs(room);
        printRefillEnergyJobs(room);
        printRepairJobs(room);
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        If the construction job is a road, then it is submitted to the low priority road queue.  
        Otherwise it is submitted to the queue for all other construction jobs.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    submitConstructionJob: function (constructionSite) {
        let room = constructionSite.room;
        ensureJobQueuesExist(room);
        let jobs = Memory.creepJobs[room.name].construction;
        if (constructionSite.structureType === STRUCTURE_ROAD) {
            addJobTo(jobs.roads, constructionSite.id);
        }
        else {
            addJobTo(jobs.everythingElse, constructionSite.id);
        }
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        Self-explanatory.

        Note: The argument is expected to be any object that can store energy (technically can 
        be a creep, but I'd advise against having creeps submit "refill" jobs because they can 
        move and then you have one creep chasing another.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    submitRefillEnergyJob: function (thing) {
        let room = thing.room;
        ensureJobQueuesExist(room);
        let jobs = Memory.creepJobs[room.name].refillEnergy;
        let numRefillJobs = addJobTo(jobs, thing.id);
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        Self-explanatory.

        Note: The argument is expected to be any damaged structure that needs repair (spawn, 
        containers, ramparts, roads, turrets, etc.).
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    submitRepairJob: function (thing) {
        let room = thing.room;
        ensureJobQueuesExist(room);
        let jobs = Memory.creepJobs[room.name].repair;
        let numRepairJobs = addJobTo(jobs, thing.id);
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        If there is a construction job and the creep doesn't already have one, then the creep is 
        given a new one, first from the regular construction queue, and if nothing is there then 
        it gets a road construction job. If there is still nothing, then the creep doesn't get a 
        construction job.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    getConstructionJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printConstructionJobs(creep.room);

        let jobs = Memory.creepJobs[creep.room.name].construction;
        let needWork = (creep.memory.constructionJobId === null || creep.memory.constructionJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);
        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs.everythingElse);
            if (newJobId === null || newJobId === undefined) {
                // nothing important needs to be built, so go for roads
                newJobId = getJobFrom(jobs.roads);
            }

            // if no construction jobs either, then the creep will ask for construction jobs 
            // again later; no big deal

            //let structure = Game.getObjectById(newJobId);
            //if (!structure) {
            //    console.log(creep.name + ": getting construction job for " + structure);
            //}
            //else {
            //    console.log(creep.name + ": getting construction job for " + Game.getObjectById(newJobId).structureType);
            //}
            creep.memory.constructionJobId = newJobId;
        }
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        Self-explanatory.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    getRefillEnergyJobFor: function (creep) {
        ensureJobQueuesExist(creep.room);
        //printRefillEnergyJobs(creep.room);

        let jobs = Memory.creepJobs[creep.room.name].refillEnergy;
        let needWork = (creep.memory.refillEnergyJobId === null || creep.memory.refillEnergyJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);

        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs);
            //let structure = Game.getObjectById(newJobId);
            //if (!structure) {
            //    console.log(creep.name + ": getting refill job for " + structure);
            //}
            //else {
            //    console.log(creep.name + ": getting refill job for " + Game.getObjectById(newJobId).structureType);
            //}
            creep.memory.refillEnergyJobId = newJobId;
        }
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        Self-explanatory.

        Note: The argument is "thing" and not a creep because towers can also repair.  They'll 
        just piggyback on the creeps' job system.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    getRepairJobFor: function (thing) {
        ensureJobQueuesExist(thing.room);
        //printRepairJobs(thing.room);

        let jobs = Memory.creepJobs[thing.room.name].repair;
        let needWork = (thing.memory.repairJobId === null || thing.memory.repairJobId === undefined);
        let haveWork = (Object.keys(jobs).length > 0);
        if (needWork && haveWork) {
            let newJobId = getJobFrom(jobs);
            let structure = Game.getObjectById(newJobId);

            // turrets do not have names, so do not attempt to print out an identified
            //if (!structure) {
            //    console.log(thing.name + ": getting repair job for " + structure);
            //}
            //else {
            //    console.log(thing.name + ": getting repair job for " + Game.getObjectById(newJobId).structureType);
            //}
            thing.memory.repairJobId = newJobId;
        }
    },
}