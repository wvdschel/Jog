load('lib/showdown.js');
load('lib/utils.js');
load('template.js');

function Section(basePath, parent) {
    this._basePath = basePath;
    this._parent = parent;

    this.parent = function() { return this._parent; };
    this.siblings = function() {
	if(this.parent() != null && this.parent() != undefined)
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

function Page(path, containingSection) {
    this._path = path;
    this._section = containingSection;
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
		var page = this;
		
		var temp = new Template(filename+'.html');
		temp.compile();
		this._content = temp.run(this);
	    } else
		throw("Neither " + filename + ".html or " + filename + ".md was found, aborting");
	}
	return this._content;
    };

    this.metadata = function() {
	if(this._metadata == undefined) {
	    var loadedMeta = JSON.parse(loadFile('input/' + this._path + '.json'));
	    this._metadata = concatArrays(loadedMeta, defaultMetadata);
	}
	return this._metadata;
    };

    this.title = function() {
	return this.metadata()["title"];
    };

    this.render = function() {
	var metadata = this.metadata();
	if(metadata["template"] != null && metadata["template"] != undefined) {
	    var temp = new Template('input/' + metadata["template"])
	    temp.compile();
	    return temp.run(this);
	} else
	    return this._content;
    };

    this.writeOut = function() {
	return writeFile("output/" + this._path + "/index.html", this.render());
    };
};

var sections = [new Section("input")];
var pos = 0;
while(sections.length > pos) {
    var sect = sections[pos];

    for each(page in sect.pages()) {
	if(page.writeOut())
	    print("Wrote " + page._path);
	else
	    print("Failed to write " + page._path);
    }
    
    joinArrays(sect.subSections(), sections);
    pos ++;
}