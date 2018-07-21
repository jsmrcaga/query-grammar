let utils = {};

utils.count = function(array, match_function=(el) => el){
	let count = [];
	for(let element of array){
		let el = match_function(element);
		let exists = count.find(e => e.name === el);
		if(exists){
			exists.count++;
		} else {
			count.push({
				name: el,
				count: 1
			});
		}
	}
	return count;
};

module.exports = utils;
