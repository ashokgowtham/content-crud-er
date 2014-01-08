var category = {};
new (function(category) {
	category.fetchCategories = function() {
		var categories = {};
		$.get('http://localhost:8080/content/list.json', function(data) {
			categories = JSON.parse(data);
		});
		return categories;
	}
})(category);