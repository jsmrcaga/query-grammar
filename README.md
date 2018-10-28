# GRMR

Grmr is a simple parser for language creation (parser & lexer). It is intended for all intents and purposes but offers some pre-created Rules and Tokens.

Inspired by [the awesome Scryfall search engine](https://scryfall.com).

## Usage

You can look at the tests for some super simple use cases, like parsing multiplication rules or very simple grammars.

Grmr is composed of three main things, `Token`s, `Rule`s and the main Grammar object. The latter will offer the possibility to create Rules and Tokens to build your grammar and your outputs.

### Tokens

Tokens are pieces of text that represent chunks of parsable information. They are defined thanks to regexp in order to be able to match the desired chunks.

For example, you can have a token named `number` and defined by `[0-9]+`, or a token `variable` defined by `[a-zA-Z][a-zA-Z0-9]*` (begins with a letter). `Grmr` will append `^` to every definition because of its inner workings on the lexer (compares from the beginning and ignores the 1st char if no match).

As an example, we could set another token `equality` and defined by the regexp `=`. Then lexing the following query `myVariable35 = 35` would return: `[variable: 'myVariable35', equality: '=', number: '35']` (no specific syntax here)

### Rules

Rules parse lists of tokens. They define the main grammar by using the extracted tokens to build the parsed query. A rule receives a list of tokens that it compares to its internal needs (list of tokens or `function(tokens)`) in order to get a match. One a match is found, and `exec` function is executed with the tokens to produce a result.

For example, a simple `multiplication` rule would look like: 

```javascript
new Rule('multiplication', ['number', 'mult_token', 'number'], function(num1, mult, num2){
	return {
		result: parseFloat(num1) * parseFloat(num2)
	}
});
```

> Note the `result` property. `Grmr` needs an object to be able to work with sub-rules and properties
> Also note that the token-list is string defined to match the token names. This can be replaced with a function that returns true || false.  In the future sub-rules will be also accepted here.

### General use-case 

This package is designed to let people define simple query languages without writing complex regex or parsers. Depending on the use case, some complex rules will be needed, and the code base can easily grow. That's why `Grmr` will soon provide pre-written rules (blocks, parenthesis...).

Most people will only need to use pre-written rules and some small additions.

### More complex use case

For more complex use cases, dividing your rules into different files can be an elegant solution. An usual way of dividing your codebase is:
```
- parser
	- tokens.js
	- rules
		- rule1.js
		- rule2.js
```

Rules can also be set to accept sub-rules (disabled by default for performance) so that the parser can set sub-results on the parsed query.

## Example

```javascript
// WE DEFINE OUR GRAMMAR
let my_grammar = new Grammar('test_grammar');

// WE EXTRACT THE NECESSARY OBJECTS
const { Rule, Token, Lexer, Parser } = my_grammar; 
// note that we extract them from the instance
// this will allow Grmr to put tokens and rules
// into their corresponding grammar

// WE DEFINE OUR TOKENS
let block = new Token('block', '(\\{|\\})');
let text = new Token('text', '[a-zA-Z0-9][a-zA-Z0-9\\s]*');

// A SIMPLE RULE THAT ACCEPTS ONLY A SINGLE TEXT TOKEN
let text_rule = new Rule('text', ['text'], function(text){
	return { result: {text: text.entry }};
})

// A COMPLEX RULE THAT PARSES BLOCKS DEFINED BY 
// {} WITH A FUNCTION INSTEAD OF A TOKEN LIST
let block_rule = new Rule('text-block', function(tokens){
	
	// here we will count the number of opening and 
	// closing brackets to define our block
	// and return true if needed

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
	// we get all our tokens and return our result
	// we will append 'subtokens' to indicate to Grmr that
	// there is a list of subtokens that we prefer
	// if not passed, grmr will slice(1, length -1) on its own

	// we also pass an empty result to be used by Grmr
	if(tokens.length > 2){
		return {
			result: {},
			subtokens: tokens.slice(1, tokens.length - 1)
		}
	}

	return tokens.map(e => e.entry);

	// we use .sub() to indicate that this rule accepts
	// sub rules (text_rules in this case)
}).sub();

// lets define our query
let query = `{ some text here } {{Hey a sub-block!}{ Another sub block omg!}}`;

// WE FIRST LEX AND THEN PARSE
let lex = Lexer([block, text], query);
let parsed = Parser([block_rule, text_rule], lex);

// ANOTHER SOLUTION
my_grammar.parse(query);
```

## API

### Grammar
```javascript
let Grammar = require('grmr');
let grammar = new Grammar('mySuperGrammar');
```

#### Methods

##### `Grammar#fromJSON(json)`
Creates a new grammar from a JSON export (not yet available)

##### `parse(query)`
|Prop|Type|Required|Description|
|:-:|:-:|:-:|:-:|
|`query`| String| True| The query to be parsed|

Parses the query and returns an array containing the parsed result.

##### `toJSON()`
Returns the JSON representation of this grammar

#### Properties
##### `Token`
Returns the Token constructor associated with this grammar

##### `Rule`
Returns the Rule constructor associated with this grammar

##### `Lexer`
Returns the Lexer associated with this grammar

##### `Parser`
Returns the Parser associated with this grammar

### Token
##### `Token(type, regex)`
|Prop|Type|Required|Description|
|:-:|:-:|:-:|:-:|
|`type`| String| True | The name of the token |
|`regex`| String| True | The regexp definition of the token |

> Note that the name can be used with the rules
> Also note that the regex representation will be used in the regex constructor and will be prepended with ^. You will need double backslashes if needed (ex: `\\s` instead of `\s`)

##### `match(string)`
Executes the internal `regex.exec` function on the given string

##### `get(string)`
Returns an object defined by 
```
{
	token: <token name>,
	match: <param string>,
	exec: this.regex.exec(<param string>)
}
```

### Rule

##### `Rule(name, match, exec)`
|Prop|Type|Required|Description|
|:-:|:-:|:-:|:-:|
|`name`| String| True | The name of the Rule |
|`match`| Array<String> or `function`| True | The rule to match tokens against. If array, tokens will try to match the exact order. If function, all tokens will be passed to it and must return truthy/falsy values |
|`exec`|Function| True | The function to be executed with the matched tokens. They are `spread` to match the given match array. If needed use `function(...tokens)` to `rest` them|

##### `acceptsSubRules(off)`
|Prop|Type|Required|Description|
|:-:|:-:|:-:|:-:|
|`off`| Bool| false | true or false. True by default |

##### `sub(off)`
`acceptsSubRules` alias.

##### `test(tokens)`
|Prop|Type|Required|Description|
|:-:|:-:|:-:|:-:|
|`tokens`| Array<Tokens>| true | Tests the rule agains the given tokens |


### Lexer

#### `Lexer(tokens, query)`
|Prop|Type|Required|Description|
|:-:|:-:|:-:|:-:|
|`tokens`| Array<Tokens>| true | Separates the query to match the token definitions|
|`query`| String| true | The query to be lexed |

Returns an array of matched tokens
```
[{
	token: '<token name>',
	entry: '<matched token>',
	exec: <RegExp.exec result>
}]
```

### Parser

#### `Parser(rules, tokens)`
|Prop|Type|Required|Description|
|:-:|:-:|:-:|:-:|
|`rules`| Array<Rules>| true | The query to be lexed |
|`tokens`| Array<Tokens>| true | Separates the query to match the token definitions|

Returns the parsed query on the format of the returned `results`.
