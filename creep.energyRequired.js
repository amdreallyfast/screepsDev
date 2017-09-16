

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Used by the creep population maintenance routines to easily figure out if a room can 
        afford to build a creep.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    bodyCost: function (bodyParts) {
        let energyRequired = 0;
        bodyParts.forEach(function (part) {
            if (part === WORK) {
                energyRequired += 100;
            }
            else if (part === CARRY) {
                energyRequired += 50;
            }
            else if (part === MOVE) {
                energyRequired += 50;
            }
        });

        return energyRequired;
    }
}
