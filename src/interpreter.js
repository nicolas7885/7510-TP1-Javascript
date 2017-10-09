var Interpreter = function () {

	this.parseDB = function (params, paramss, paramsss) {
		db = params;
		return validateDatabase(params);
	}

	this.checkQuery = function (params) {
		return evaluateQuery(db,params);
	}

	var db = ' ';

	const FACT_REGEX= /([a-zA-Z]*)(\(([\w\s,$]*)\))/g;

}

module.exports = Interpreter;
