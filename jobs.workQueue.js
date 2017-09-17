
let isDefined = require("utilityFunctions.isDefined");


/*------------------------------------------------------------------------------------------------
Description:
    Ensures that memory is defined before attempting to access it.  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let ensureMemoryExists = function (room) {
    if (!isDefined(Memory.jobs)) {
        Memory.jobs = {};
    }
    if (!isDefined(Memory.jobs[room.name])) {
        Memory.jobs[room.name] = {};
        Memory.jobs[room.name].construction = {
            everythingElse: {},
            roads: {}
        };
        Memory.jobs[room.name].refillEnergy = {};
        Memory.jobs[room.name].repair = {};
    }
}

/*------------------------------------------------------------------------------------------------
Description:
    Generates a nicely formatted string of all the construction jobs and prints them to the 
    console.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let printConstructionJobs = function (room) {
    let jobs = Memory.jobs[room.name].construction;
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
    let jobs = Memory.jobs[room.name].refillEnergy;
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
    let jobs = Memory.jobs[room.name].repair;
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
    Pulls the next valid job from the specified queue.

    TODO: 
    - remove this function
    - in the individual get*Job(creep) functions, perform creep.pos.findClosestByPath(queue) (??wouldn't I have to go through all the IDs and create an array of objects that can be searched over? isn't that expensive? and how will I identify which one it was so that it can be removed from the queue??

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
        ensureMemoryExists(room);
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
        ensureMemoryExists(room);
        let jobs = Memory.jobs[room.name].construction;
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
        ensureMemoryExists(room);
        let jobs = Memory.jobs[room.name].refillEnergy;
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
        ensureMemoryExists(room);
        let jobs = Memory.jobs[room.name].repair;
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
    getConstructionJob: function (room) {
        ensureMemoryExists(room);
        //printConstructionJobs(room);

        let jobs = Memory.jobs[room.name].construction;
        let haveWork = (Object.keys(jobs).length > 0);
        if (haveWork) {
            let newJobId = getJobFrom(jobs.everythingElse);
            if (!isDefined(newJobId)) {
                // nothing important needs to be built, so go for roads
                newJobId = getJobFrom(jobs.roads);
            }

            let structure = Game.getObjectById(newJobId);
            if (isDefined(structure)) {
                console.log("getting construction job for " + Game.getObjectById(newJobId).structureType);
            }
            //else {
            //    console.log("null construction job");
            //}

            return newJobId;
        }

        return null;
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        Self-explanatory.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    getRefillEnergyJob: function (room) {
        ensureMemoryExists(room);
        //printRefillEnergyJobs(room);

        let jobs = Memory.jobs[room.name].refillEnergy;
        let haveWork = (Object.keys(jobs).length > 0);
        if (haveWork) {
            let newJobId = getJobFrom(jobs);
            let structure = Game.getObjectById(newJobId);
            if (isDefined(structure)) {
                console.log("getting refill job for " + Game.getObjectById(newJobId).structureType);
            }
            //else {
            //    console.log("null refill job");
            //}
            
            return newJobId;
        }

        return null;
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        Self-explanatory.

        Note: The argument is "thing" and not a creep because towers can also repair.  They'll 
        just piggyback on the creeps' job system.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    getRepairJob: function (room) {
        ensureMemoryExists(room);
        //printRepairJobs(room);

        let jobs = Memory.jobs[room.name].repair;
        let haveWork = (Object.keys(jobs).length > 0);
        if (haveWork) {
            let newJobId = getJobFrom(jobs);
            let structure = Game.getObjectById(newJobId);
            if (isDefined(structure)) {
                console.log("getting repair job for " + Game.getObjectById(newJobId).structureType);
            }
            //else {
            //    console.log("null repair job");
            //}

            return newJobId;
        }

        return null;
    },


}