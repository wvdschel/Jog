load('lib/showdown.js');
load('lib/utils.js');
load('template.js');

function Section(basePath) {
    this._basePath = basePath;

    this.getPages = function() {
	if(this._pages == undefined) {
	    this._pages = [];
	    for each(file in listDir('input/' + this._basePath, /\.json$/))
		this._pages[this._pages.length] = new Page(file.substring(6, file.length - 5));
	}
	return this._pages;
    };

    this.getBasePath = function() { 
	return this._basePath;
    };
};

function Page(path) {
    this._path = path;
    var defaultMetadata = {"template" : "default.html"};

    this.content = function() {
	if(this._content == undefined) {
	    var data, filename = 'input/' + this._path;
	    if((data = loadFile(filename + '.md')) != null) {
		var converter = new Showdown.converter();
		this._content = converter.makeHtml(data);
	    } else if(loadFile(filename + '.html') != null) {
		var temp = new Template(filename+'.html');
		temp.compile();
		this._content = temp.run();
	    } else
		throw("Neither " + filename + ".html or " + filename + ".md was found, aborting");
	}
	return this._content;
    };

    this.metadata = function() {
	var loadedMeta = JSON.parse(loadFile('input/' + this._path + '.json'));
	return concatArrays(loadedMeta, defaultMetadata);
    };

    this.render = function() {
	var content = this.content();
	var metadata = this.metadata();
	
	if(metadata["template"] != null && metadata["template"] != undefined) {
	    var page = new Object();
	    page.content  = content;
	    page.title    = metadata["title"];
	    page.metadata = metadata;

	    var temp = new Template('input/' + metadata["template"]);
	    temp.compile();
	    return temp.run(page);
	} else
	    return this._content;
    };

    this.writeOut = function() {
	return writeFile("output/" + this._path + "/index.html", this.render());
    };
};

var s = new Section(".");
for each(page in s.getPages()) {
    if(page.writeOut())
	print("Wrote " + page._path);
    else
	print("Failed to write " + page._path);
}
