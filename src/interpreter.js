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
	  var intendedFactDelimeterRegex= /(\)[\s]*,)|(,[\s]*\w*\()/gi;
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

	function evaluateQuery(database, query){
	  if(!validateDatabase(database) || !validateQuery(query)){
	    return null;
	  }
	  return evaluateFact(database, query);
	}

}

module.exports = Interpreter;
