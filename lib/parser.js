const lexer = function(tokens, query){
	let ci = 0;
	let found = [];

	while(query){
		let match = __match(tokens, query);
		
		if(match.match){
			query = query.substring(match.size);
			found.push({
				token: match.type,
				entry: match.entry,
				exec: match.exec
			});

		} else {
			query = query.substring(1);
		}
	}
	
	return found;
};

const __match = function(tokens, string){
	for(let token of tokens){

		let m = token.match(string);
		if(m){
			return {
				match: true,
				size: m[0].length,
				token: token,
				type: token.type,
				entry: m[0],
				exec: m
			}
		}
	}
	return {
		match: false
	}
};

const parser = function(rules, tokens){
	return __test_rules(rules, tokens);
};

const __test_rules = function(rules, tokens, subtest=false){
	let ret = [];

	while(tokens.length){
		for(let rule of rules){
			let test = rule.test(tokens);

			if(!test){
				continue;
			}

			if(rule.subtokens && test.subtokens.length){
				test.exec.sub = __test_rules(rules, test.subtokens, true);
			}

			ret.push({
				rule: rule.name,
				result: test.exec
			});
			
			tokens.splice(0, test.index - 1);
		}

		tokens.splice(0, 1);
	}

	return ret;
};

module.exports = {
	Lexer: lexer, 
	Parser: parser
};