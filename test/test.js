const expect = require('chai').expect;
const utils = require('../lib/utils');

const Grammar = require('../index');
let my_grammar = new Grammar('test_grammar');

const { Rule, Token, Lexer, Parser } = my_grammar; 

describe('Simple creation tests', () => {
	it('Should create a simple lexer', () => {

		let reserved = new Token('reserved', '[{}\\[\\]\\(\\)=]');
		let keywords = new Token('keyword', '(or|and)');
		let variable = new Token('variable', `([a-zA-Z][a-zA-Z0-9]*)`);
		let ignored = new Token('ignored', '[\\t\\n\\s]+');
		
		let result = Lexer([ignored, reserved, keywords, variable], '{ this is {	a or	} test }');

		let count = utils.count(result, (e) => e.token);

		expect(count.find(e => e.name === 'ignored').count).to.be.eql(8);
		expect(count.find(e => e.name === 'reserved').count).to.be.eql(4);
		expect(count.find(e => e.name === 'variable').count).to.be.eql(4);
		expect(count.find(e => e.name === 'keyword').count).to.be.eql(1);
	});

	it('Should create a super simple lexer + parser', () => {
		let eq = new Token('eq', '=');
		let variable = new Token('var', `([a-zA-Z][a-zA-Z0-9]*)`);
		let number = new Token('num', '[0-9]+');

		let query = 'chicken = 56';

		let lex = Lexer([eq, variable, number], query);
		// rules
		let equality = new Rule('equality', ['var', 'eq', 'num'], function(var_name, eq, num){
			return {
				result: {
					var_name: var_name.entry,
					op: eq.entry,
					num: parseInt(num.entry)
				}
			}
		});
		let parsed = Parser([equality], lex);
		expect(parsed).to.have.lengthOf(1);
		expect(parsed[0].result).to.have.property('var_name');
		expect(parsed[0].result).to.have.property('op');
		expect(parsed[0].result).to.have.property('num');

		expect(parsed[0].result.var_name).to.be.eql('chicken');
		expect(parsed[0].result.op).to.be.eql('=');
		expect(parsed[0].result.num).to.be.eql(56);
	});

	it('Should create a multiplication lexer + parser', () => {
		let eq = new Token('mult', 'x');
		let div = new Token('div', '/');
		let number = new Token('number', '[0-9]+');

		let query = '34 x 56 / 45 x 76';

		let lex = Lexer([eq, number], query);
		// rules
		let equality = new Rule('equality', ['number', 'mult', 'number'], function(a, eq, b){
			let _a = parseFloat(a.entry);
			let _b = parseFloat(b.entry);
			return {
				result: {
					num1: _a,
					op: eq.entry,
					num2: _b,
					val: _a * _b
				}
			}
		});

		let parsed = Parser([equality], lex);
		expect(parsed).to.have.lengthOf(2);
		expect(parsed[0].result.val).to.be.eql(1904);
	});

	it('Should create a more complex lexer with parenthesis groups', () => {
		let block = new Token('block', '(\\{|\\})');
		let text = new Token('text', '[a-zA-Z0-9][a-zA-Z0-9\\s]*');

		let txt = ['this is a block opf text', 'this is a sub', 'this is sub2']; 
		let query = `{ ${txt[0]}} {{${txt[1]} }{${txt[2]}}}`;

		let text_rule = new Rule('text', ['text'], function(text){
			return { result: {text: text.entry }};
		})

		let block_rule = new Rule('text-block', function(tokens){
			let open = 0;
			let first = null;

			for(let i=0; i < tokens.length; i++){
				let token = tokens[i];

				if(token.entry === '{'){
					if(!first){
						first = true;
					}

					open++;
				}

				if(token.entry === '}'){
					if(!first){
						return false;
					}

					open--;
				}

				if(open === 0 && first){
					return true;
				}
			}
			
			return false;

		}, function(...tokens){
			if(tokens.length > 2){
				return {
					result: {},
					subtokens: tokens.slice(1, tokens.length - 1)
				}
			}

			return tokens.map(e => e.entry);
		}).sub();

		let lex = Lexer([block, text], query);
		let parsed = Parser([block_rule, text_rule], lex);

		expect(parsed).to.have.lengthOf(2);
		expect(parsed[0]).to.have.property('rule');
		expect(parsed[0]).to.have.property('result');
		expect(parsed[0].rule).to.be.eql('text-block');
		expect(parsed[1].rule).to.be.eql('text-block');

		expect(parsed[0].result).to.have.property('sub');
		expect(parsed[0].result.sub).to.have.lengthOf(1);
		expect(parsed[0].result.sub[0].rule).to.be.eql('text');
		expect(parsed[0].result.sub[0].result).to.have.property('text');
		expect(parsed[0].result.sub[0].result.text).to.be.eql(txt[0]);

		expect(parsed[1].result.sub).to.have.lengthOf(2);
	});
});
