function rule_factory(grammar){
	class Rule {
		constructor(name, tokens_or_func, exec){
			this.name = name;
			this.fun = tokens_or_func;
			this.exec = exec || null;
		}

		acceptsSubRules(off=true){
			this.subtokens = off;
			return this;
		}

		sub(off=true){
			return this.acceptsSubRules(off);
		}

		test(tokens){
			// tests for first match
			for(let i = 1; i <= tokens.length; i++){
				let current_queue = tokens.slice(0, i);
				let valid = this.__test_queue(current_queue);

				if(valid){
					return {
						exec: valid.result,
						index: i,
						subtokens: valid.subtokens || current_queue.slice(1, current_queue.length-1),
					}
				}
			}

			return false;
		}

		__test_queue(tokens){
			if(this.fun instanceof Array){
				// loop through array
				if(tokens.length !== this.fun.length){
					return false;
				}

				for(let i = 0; i < tokens.length; i++){
					if(tokens[i].token !== this.fun[i]){
						return false;
					}
				}

				return this.exec ? this.exec(...tokens) : tokens;

			} else if(this.fun instanceof Function) {

				if(this.fun(tokens)){
					return this.exec ? this.exec(...tokens) : tokens;
				}

				return false;

			} else {
				throw new Error('Rule definition needs an array of token names, or a function');
			}
		}
	}

	return Rule;
}

module.exports = rule_factory;