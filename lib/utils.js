var loadFile = function(fileName) {
    //print("Loading " + fileName);
    try {
	var reader = new java.io.FileReader(fileName);
	var string = "";
	
	while(true) {
	    var c = reader.read();
	    if(c == -1) break;
	    string = string + String.fromCharCode(c);
	}
	
	return string;
    } catch (e) {
	return null;
    }
};

var writeFile = function(fileName, content) {
    try {
	var file = new java.io.File(fileName.replace(/[^\/]*$/, ''));
	file.mkdirs();
	var writer = new java.io.FileWriter(fileName);
	writer.write(content);
	writer.close();
	return true;
    } catch (e) {
	return false;
    }
}

var joinArrays = function(source, destination) {
    for(var i = 0; i < source.length; i++)
	destination[destination.length] = source[i]
    return destination;
}

var mergeArrays = function(source, destination) {
    for (var property in source)
        destination[property] = source[property];
    return destination;
};

var concatArrays = function(array1, array2) {
    var a = {};
    mergeArrays(array1, a);
    mergeArrays(array2, a);
    return a;
};

var listDir = function(path, regex) {
    var dir   = new java.io.File(path);

    var files = dir.list();
    var results = [];
    for each(file in files) {
	var filename = path + "/" + file;
	var sub      = new java.io.File(filename);
	if(sub.isDirectory())
	    joinArrays(listDir(filename, regex), results);
	else if(regex.exec(filename) != null)
	    results[results.length] = filename;
    }
    return results;
};

var listFiles = function(path, regex) {
    var dir   = new java.io.File(path);

    var files = dir.list();
    var results = [];
    for each(file in files) {
	var filename = path + "/" + file;
	var sub      = new java.io.File(filename);
	if(!sub.isDirectory() && regex.exec(filename) != null)
	    results[results.length] = filename;
    }
    return results;
};

var listSubDirs = function(path) {
    var dir   = new java.io.File(path);

    var files = dir.list();
    var results = [];
    for each(file in files) {
	var filename = path + "/" + file;
	var sub      = new java.io.File(filename);
	if(sub.isDirectory())
	    results[results.length] = filename;
    }
    return results;
};

var escapeHTML = function(string) {
    return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}