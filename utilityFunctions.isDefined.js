
/*------------------------------------------------------------------------------------------------
Description:
    Created because I don't like the implicit cast of null and undefined to false.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
module.exports = function (variable) {
    if (variable === null || variable === undefined) {
        return false;
    }
    return true;
}
