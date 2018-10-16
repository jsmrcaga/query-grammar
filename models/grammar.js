const {Lexer, Parser} = require('../lib/parser');

class Grammar {
	constructor(name){
		this.name = name;
		this.Rule = require('./rule')(this);
		this.Token = require('./token')(this);
		this.Lexer = Lexer;
		this.Parser = Parser;

		this.__tokens = [];
		this.__rules = [];
	}

	parse(query){
		let lex = this.Lexer(this.__tokens, query);
		return this.Parser(this.__rules, lex);
	}

	__token(token){
		let f = this.__tokens.find(t => t.type === token.type);
		if(f){
			return console.warn(`Token ${f.type} already registered`);
		}
		this.__tokens.push(token);
	}

	__rule(rule){
		let r = this.__rules.find(r => r.name === rule.name);
		if(r){
			return console.warn(`Rule ${r.name} already registered`);
		}
		this.__rules.push(rule);
	}

	toJSON(){
		let tokens = this.__tokens.map(t => t.toJSON());

		return JSON.stringify({
			name: this.name,
			tokens: tokens
		});
	}
}

Grammar.GrammarError = require('./error');

Grammar.fromJSON = function(json){
	if(typeof json === 'string'){
		json = JSON.parse(json);
	}

	let g = new Grammar(json.name);
	for(let token of json.tokens){
		let t = new g.Token(token.type, token.regex);
	}

	return g;
};

module.exports = Grammar;
