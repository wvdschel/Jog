load("lib/utils.js");

function Template(fileName) {
    this._fileName = fileName;
    this.contents = loadFile(fileName);
    this._code = "";

    this.compile = function() {
	// Helper function to check if a certain regex match is contained within another
	var containedWithin = function(start, length, containerRegex, string) {
	    var container = containerRegex.exec(string);
	    
	    var cutOff = 0;
	    while(container != null && cutOff + container.index + container[0].length < start+length) {
		cutOff += container.index + container[0].length;
		container = containerRegex.exec(string.substring(cutOff));
	    }
	    // End of code contained within string, try next
	    if(container != null && cutOff + container.index < start)
		return true;
	    else
		return false;
	};

	var echoStatic = function(string) {
	    return "echo(\"" + string.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g,"") + "\");\n";
	};
	
	// Regular expression matching the beginning/end a code segment
	var startCode = /<\?js/g, endCode = /\?>/;
	var doubleQuotedString = /"([^"\n]|\\")*"/, singleQuotedString = /'([^'\n]|\\')*'/, regexString = /\/([^\/\n]|\\\/)*\//;
	var output = "";
	var currStart, currEnd, lastEnd = 0;
	while ((currStart = startCode.exec(this.contents)) != null)
	{
	    var restOfContent = this.contents.substring(startCode.lastIndex);
	    
	    // Look for the end of the code
	    var cutSoFar = 0;
	    while((currEnd = endCode.exec(restOfContent.substring(cutSoFar))) != null) {
		// Check if it's not contained within a string, else look for next end of code and try again
		if( !containedWithin(   cutSoFar + currEnd.index, currEnd[0].length, doubleQuotedString, restOfContent)
		    && !containedWithin(cutSoFar + currEnd.index, currEnd[0].length, singleQuotedString, restOfContent)
		    && !containedWithin(cutSoFar + currEnd.index, currEnd[0].length, regexString,        restOfContent))
		    break;
		
		cutSoFar += currEnd.index + currEnd[0].length;
	    }

	    if(currEnd == null) throw("Error: end of code not found, beginning at " + currStart.index + ". Remaining data: \n" + restOfContent);
	    
            output += echoStatic(this.contents.substring(lastEnd, currStart.index));
	    output += this.contents.substring(startCode.lastIndex, startCode.lastIndex + currEnd.index + cutSoFar) + "\n";
	    lastEnd = (cutSoFar + currEnd.index + currEnd[0].length) + startCode.lastIndex;
	}
	
	this._code = output + echoStatic(this.contents.substring(lastEnd));
    };

    this.run = function(page) {
        var output = "";

	var echo = function(string) {
	    output += string;
	};

        var dir = this._fileName.match(/.*\//);

	var include = function(filename) {
	    var template;
	    if(filename.charAt(0) == '/')
		template = new Template(filename.substring(1));
	    else
		template = new Template(dir + filename);
	    template.compile();
	    echo(template.run());
	};

	eval(this._code);
	return output;
    };
};
