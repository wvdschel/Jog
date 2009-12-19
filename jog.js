load('lib/showdown.js');
load('lib/utils.js');
load('template.js');

function Section(basePath, parent) {
    this._basePath = basePath;
    this._parent = parent;

    this.parent = function() { return this._parent; };
    this.siblings = function() {
	if(this.parent() != null)
	    return this.parent().subSections();
	else
	    return [];
    };

    this.pages = function() {
	if(this._pages == undefined) {
	    this._pages = [];
	    for each(file in listFiles(this._basePath, /\.json$/))
		this._pages[this._pages.length] = new Page(file.substring(6, file.length - 5), this);
	}
	return this._pages;
    };

    this.subSections = function() {
	if(this._sections == undefined) {
	    this._sections = [];
	    for each(file in listSubDirs(this._basePath))
		this._sections[this._sections.length] = new Section(file);
	}
	return this._sections;
    };
};

function Page(path, section) {
    this._path = path;
    this._section = section;
    var defaultMetadata = {"template" : "default.html"};

    this.section = function() { return this._section; };
    this.siblings = function() {
	if(this.section() != null)
	    return this.section().pages();
	else
	    return [];
    };

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

var sections = [new Section("input")];
while(sections.length > 0) {
    var section = sections.splice(0, 1)[0];
    
    for each(page in section.pages()) {
	if(page.writeOut())
	    print("Wrote " + page._path);
	else
	    print("Failed to write " + page._path);
    }
    
    joinArrays(section.subSections(), sections);
}