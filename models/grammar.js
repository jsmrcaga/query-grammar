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
		return this.Parser(lex, this.__rules);
	}

	__token(token){
		let f = this.__tokens.find(t => t.type === token.type);
		if(f){
			return console.warn(`Token ${f.type} already registered`);
		}
		this.__tokens.push(token);
	}

	__rule(rule){

	}

	toJSON(){

	}
}

Grammar.fromJSON = function(json){
	if(typeof json === 'string'){
		json = JSON.parse(json);
	}

	let g = new Grammar(json.name);
	for(let token of json.tokens){
		let t = new g.Token(token.type, token.regex);
	}

	for(let rule of json.rules){
		// only tokenized rules can work 😢	

	}
};

module.exports = Grammar;