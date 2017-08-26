var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }
	    
	    // this is a crude hack to keep them out of the way once they are done building
	    var doingSomething = false;
	    
	    if(creep.memory.building) {
	        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                var retVal = creep.build(targets[0]);
                if (retVal === OK) {
                    doingSomething = true;
                }
                else if (retVal === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    doingSomething = true;
                }
            }
	    }
	    else {
	        var sources = creep.room.find(FIND_SOURCES);
	        var retVal = creep.harvest(sources[1]);
	        if (retVal == OK) {
	            doingSomething = true;
	        }
            else if (retVal === ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[1], {visualizePathStyle: {stroke: '#ffaa00'}});
                doingSomething = true;
            }
	    }
	    
	    //console.log("creep '" + creep.name + "' doing something: " + doingSomething);
	    if (!doingSomething) {
	        creep.moveTo(Game.spawns['Spawn1']);
	    }
	}
};

module.exports = roleBuilder;