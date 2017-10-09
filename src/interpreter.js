var Interpreter = function () {

	this.parseDB = function (params, paramss, paramsss) {
		db = params;
		return validateDatabase(params);
	}

	this.checkQuery = function (params) {
		return evaluateQuery(db,params);
	}

	var db = ' ';

}

module.exports = Interpreter;
