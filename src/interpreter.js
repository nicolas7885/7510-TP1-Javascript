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

	function databaseToLines(database){
		database.forEach(function(line, index, db) {
			db[index] = line.replace(/\s/g, ''); 
		});//change this if its a file
		return database;
	}

	function parseGroup(group){
		var returnValue = FACT_REGEX.exec(group);
		FACT_REGEX.lastIndex=0;
		return returnValue;
	}

	//returns the list of parameters
	function getParameters(group){
		group=group.replace(/[\.\s]/i, '');
		return parseGroup(group)[3].split(",");
	}

	//returns true if every element of input exists in coll
	function allPresentIn(input, coll){
		return input.every(function(value){
			return coll.includes(value);
		});
	}

	//return true if rule is valid, false if not
	function validateRule(ruleLine){
		var parsedRule= ruleLine.match(FACT_REGEX);
		if(!ruleLine.match(/:-/)){
			return false;
		}
		var intendedFactDelimeterRegex= /(\)[\s]*,)|(,[\s]*\w*\()|(\s+)/gi;
		numberOfIntendedFacts= (ruleLine.match(intendedFactDelimeterRegex) || []).length +1;
		if (parsedRule.length < (numberOfIntendedFacts + 1)){
			return false;
		}
		var rule= parsedRule.shift();
		var facts= parsedRule;
		var valid= validateFact(rule);
		var i=0;
		while (valid && i<facts.length){
			valid = valid &&
				validateFact(facts[i]) &&
				allPresentIn(getParameters(facts[i]), getParameters(rule));
			i++
		}
		return valid;
	}

	//return true if fact is valid, false if not
	function validateFact(fact){
		var notEmpty=function(a){return a;};
		if (fact.match(FACT_REGEX) && getParameters(fact).every(notEmpty))
			return true;
		else
			return false;
	}

	//returns true if line is valid, false if not
	function validateLine(line){
		if (!line)
			return true;
		if (line.match(/[:-]/i))
			return validateRule(line);
		else
			return validateFact(line);
	}

	//return true if database is valid, false if not
	function validateDatabase(database){
		var lines= databaseToLines(database);
		return lines.every(validateLine);
	}

	//return true if query is valid, false if not
	function validateQuery(query){
		return query && validateFact(query);
	}

	//return true if facts in database imply query, false if not
	function evaluateFact(database, query){
		var lines= databaseToLines(database);
		return lines.some(function (line){
			return line.includes(query.replace(/\s+/g, ''));
		});
	}

	/*returns the full line of the first match in the database to the query name and amount of parameters. Null if not found*/
	function findQuery(database, query){
		var lines=databaseToLines(database);
		var result= lines.find(function(line){
			if(!line){
				return false;
			}
			return (parseGroup(line)[1] == parseGroup(query)[1]) &&
				(getParameters(line).length == getParameters(query).length);
		});
		return result ? result : null;
	}

	function replaceParameters(fact, parameterMap){
		var newParameters= parseGroup(fact)[2].replace(/\w+/g, function(variable){
			return parameterMap[variable];
		})
		return parseGroup(fact)[1]+newParameters;
	}

	/*Builds queries that imply rule, with given parameters. Parameters must have same amount of elements that variables in rule.*/
	function buildMultipleQueries(rule, parameters){
		var ruleAndFacts= rule.match(FACT_REGEX);
		var ruleVariables= getParameters(ruleAndFacts.shift());
		var parameterMap= zipper(ruleVariables, parameters);
		var mapper =function(variable){
			return parameterMap[variable];
		}
		var ruleFacts= ruleAndFacts;//note that "facts" could as well be other rules.
		for(var i=0; i< ruleFacts.length; i++){
			ruleFacts[i]=replaceParameters(ruleFacts[i], parameterMap);
		}
		return ruleFacts;
	}

	//Courtesy of SO, that in itself comes from underscore.js (_.object)
	var zipper = function(list, values) {
		if (list == null) return {};
		var result = {};
		for (var i = 0, l = list.length; i < l; i++) {
			if (values) {
				result[list[i]] = values[i];
			} else {
				result[list[i][0]] = list[i][1];
			}
		}
		return result;
	};

	function evaluateQuery(database, query){
		if(!validateDatabase(database) || !validateQuery(query)){
			return null;
		}
		var databasePotentialMatch= findQuery(database, query);
		if(!databasePotentialMatch){
			return false;
		}
		if(databasePotentialMatch.includes(":-")){
			var queriesInRule= buildMultipleQueries(databasePotentialMatch, getParameters(query));
			return queriesInRule.every(function(anotherQuery){
				return evaluateQuery(database, anotherQuery);
			});
		}else{
			return evaluateFact(database, query);
		}
	}
}

module.exports = Interpreter;
