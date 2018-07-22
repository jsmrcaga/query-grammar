function token_factory(grammar){
	class Token {
		constructor(type, regex){
			this.type = type;
			this.__regex = regex;

			// add begin and end automatically
			this.regex = new RegExp(`^${regex}`);

			grammar.__token(this);
		}

		match(string){
			return this.regex.exec(string);
		}

		get(string){
			return {
				token: this.type,
				match: string,
				exec: this.regex.exec(string)
			}
		}

		toJSON(){
			return {
				type: this.type,
				regex: this.__regex
			};
		}
	}

	return Token;
}

module.exports = token_factory;