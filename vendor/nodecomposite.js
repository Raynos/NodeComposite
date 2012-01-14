(function(){
window.M8 = {data:{}, path:{}};

// npm::path first
(function (exports) {
 function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

}(window.M8.path));
(function(){
/**
 * modul8 v0.15.0
 */

var config    = {"namespace":"M8","domains":["app"],"arbiters":{},"npmTree":{"_builtIns":[]},"builtIns":["path","events"],"slash":"/"} // replaced
  , ns        = window[config.namespace]
  , path      = ns.path
  , slash     = config.slash
  , domains   = config.domains
  , builtIns  = config.builtIns
  , arbiters  = []
  , stash     = {}
  , DomReg    = /^([\w]*)::/;

/**
 * Initialize stash with domain names and move data to it
 */
stash.M8 = {};
stash.external = {};
stash.data = ns.data;
delete ns.data;
stash.npm = {path : path};
delete ns.path;

domains.forEach(function (e) {
  stash[e] = {};
});

/**
 * Attach arbiters to the require system then delete them from the global scope
 */
Object.keys(config.arbiters).forEach(function (name) {
  var arbAry = config.arbiters[name];
  arbiters.push(name);
  stash.M8[name] = window[arbAry[0]];
  arbAry.forEach(function (e) {
    delete window[e];
  });
});

// same as server function
function isAbsolute(reqStr) {
  return reqStr === '' || path.normalize(reqStr) === reqStr;
}

function resolve(domains, reqStr) {
  reqStr = reqStr.split('.')[0]; // remove extension

  // direct folder require
  var skipFolder = false;
  if (reqStr.slice(-1) === slash || reqStr === '') {
    reqStr = path.join(reqStr, 'index');
    skipFolder = true;
  }

  if (config.logging >= 4) {
    console.debug('modul8 looks in : ' + JSON.stringify(domains) + ' for : ' + reqStr);
  }

  var dom, k, req;
  for (k = 0; k < domains.length; k += 1) {
    dom = domains[k];
    if (stash[dom][reqStr]) {
      return stash[dom][reqStr];
    }
    if (!skipFolder) {
      req = path.join(reqStr, 'index');
      if (stash[dom][req]) {
        return stash[dom][req];
      }
    }
  }

  if (config.logging >= 1) {
    console.error("modul8: Unable to resolve require for: " + reqStr);
  }
}

/**
 * Require Factory for ns.define
 * Each (domain,path) gets a specialized require function from this
 */
function makeRequire(dom, pathName) {
  return function (reqStr) {
    if (config.logging >= 3) { // log verbatim pull-ins from dom::pathName
      console.log('modul8: ' + dom + '::' + pathName + " <- " + reqStr);
    }

    if (!isAbsolute(reqStr)) {
      //console.log('relative resolve:', reqStr, 'from domain:', dom, 'join:', path.join(path.dirname(pathName), reqStr));
      return resolve([dom], path.join(path.dirname(pathName), reqStr));
    }

    var domSpecific = DomReg.test(reqStr)
      , sDomain = false;

    if (domSpecific) {
      sDomain = reqStr.match(DomReg)[1];
      reqStr = reqStr.split('::')[1];
    }

    // require from/to npm domain - sandbox and join in current path if exists
    if (dom === 'npm' || (domSpecific && sDomain === 'npm')) {
      if (builtIns.indexOf(reqStr) >= 0) {
        return resolve(['npm'], reqStr); // => can put builtIns on npm::
      }
      if (domSpecific) {
        return resolve(['npm'], config.npmTree[reqStr].main);
      }
      // else, absolute: use included hashmap tree of npm mains

      // find root of module referenced in pathName, by counting number of node_modules referenced
      // this ensures our startpoint, when split around /node_modules/ is an array of modules requiring each other
      var order = pathName.split('node_modules').length; //TODO: depending on whether multiple slash types can coexist, conditionally split this based on found slash type
      var root = pathName.split(slash).slice(0, Math.max(2 * (order - 2) + 1, 1)).join(slash);

      // server side resolver has figured out where the module resides and its main
      // use resolvers passed down npmTree to get correct require string
      var branch = root.split(slash + 'node_modules' + slash).concat(reqStr);
      //console.log(root, order, reqStr, pathName, branch);
      // use the branch array to find the keys used to traverse the npm tree, to find the key of this particular npm module's main in stash
      var position = config.npmTree[branch[0]];
      for (var i = 1; i < branch.length; i += 1) {
        position = position.deps[branch[i]];
        if (!position) {
          console.error('expected vertex: ' + branch[i] + ' missing from current npm tree branch ' + pathName); // should not happen, remove eventually
          return;
        }
      }
      return resolve(['npm'], position.main);
    }

    // domain specific
    if (domSpecific) {
      return resolve([sDomain], reqStr);
    }

    // general absolute, try arbiters
    if (arbiters.indexOf(reqStr) >= 0) {
      return resolve(['M8'], reqStr);
    }

    // general absolute, not an arbiter, try current domains, then the others
    return resolve([dom].concat(domains.filter(function (e) {
      return (e !== dom && e !== 'npm');
    })), reqStr);
  };
}

/**
 * define module name on domain container
 * expects wrapping fn(require, module, exports) { code };
 */
ns.define = function (name, domain, fn) {
  var mod = {exports : {}}
    , exp = {}
    , target;
  fn.call({}, makeRequire(domain, name), mod, exp);

  if (Object.prototype.toString.call(mod.exports) === '[object Object]') {
    target = (Object.keys(mod.exports).length) ? mod.exports : exp;
  }
  else {
    target = mod.exports;
  }
  stash[domain][name] = target;
};

/**
 * Public Debug API
 */

ns.inspect = function (domain) {
  console.log(stash[domain]);
};

ns.domains = function () {
  return domains.concat(['external', 'data']);
};

ns.require = makeRequire('app', 'CONSOLE');

/**
 * Live Extension API
 */

ns.data = function (name, exported) {
  if (stash.data[name]) {
    delete stash.data[name];
  }
  if (exported) {
    stash.data[name] = exported;
  }
};

ns.external = function (name, exported) {
  if (stash.external[name]) {
    delete stash.external[name];
  }
  if (exported) {
    stash.external[name] = exported;
  }
};

}());

// shared code



// app code - safety wrap


(function(){
M8.define('by','app',function (require, module, exports) {
module.exports = {
    id: function id(id) {
        return document.getElementById(id); 
    },
    "class": function klass(klass, context) {
        return (context || document).getElementsByClassName(klass);
    },
    tag: function tag(tag, context) {
        return (context || tag).getElementsByTagName(tag);    
    }
};
});
M8.define('classlist','app',function (require, module, exports) {
var ClassList = {
    constructor: function constructor(nodes) {
        this.classLists = nodes.map(toClassList);
        return this;
        
        function toClassList(element) {
            return element.classList;
        }
    }
};
    
["add", "remove", "toggle"].forEach(addToClassList);

module.exports = ClassList;
    
function addToClassList(name) {
    ClassList[name] = function proxy() {
        var args = arguments;
        this.classLists.forEach(applyMethod);
   
        function applyMethod(classList) {
            classList[name].apply(classList, args);
        } 
    };
}
});
M8.define('style','app',function (require, module, exports) {
var Style = {
    constructor: function constructor(nodes) {
        this.nodes = nodes;
        return this;
    }
};

["alignment-adjust", "alignment-baseline", "animation", "animation-delay", "animation-direction", "animation-duration", "animation-iteration-count", "animation-name", "animation-play-state", "animation-timing-function", "appearance", "azimuth", "backface-visibility", "background", "background-attachment", "background-clip", "background-color", "background-image", "background-origin", "background-position", "background-repeat", "background-size", "baseline-shift", "binding", "bleed", "bookmark-label", "bookmark-level", "bookmark-state", "bookmark-target", "border", "border-bottom", "border-bottom-color", "border-bottom-left-radius", "border-bottom-right-radius", "border-bottom-style", "border-bottom-width", "border-collapse", "border-color", "border-image", "border-image-outset", "border-image-repeat", "border-image-slice", "border-image-source", "border-image-width", "border-left", "border-left-color", "border-left-style", "border-left-width", "border-radius", "border-right", "border-right-color", "border-right-style", "border-right-width", "border-spacing", "border-style", "border-top", "border-top-color", "border-top-left-radius", "border-top-right-radius", "border-top-style", "border-top-width", "border-width", "bottom", "box-decoration-break", "box-shadow", "box-sizing", "break-after", "break-before", "break-inside", "caption-side", "clear", "clip", "color", "color-profile", "column-count", "column-fill", "column-gap", "column-rule", "column-rule-color", "column-rule-style", "column-rule-width", "column-span", "column-width", "columns", "content", "counter-increment", "counter-reset", "crop", "cue", "cue-after", "cue-before", "cursor", "direction", "display", "dominant-baseline", "drop-initial-after-adjust", "drop-initial-after-align", "drop-initial-before-adjust", "drop-initial-before-align", "drop-initial-size", "drop-initial-value", "elevation", "empty-cells", "fit", "fit-position", "flex-align", "flex-flow", "flex-line-pack", "flex-order", "flex-pack", "float", "float-offset", "font", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "grid-columns", "grid-rows", "hanging-punctuation", "height", "hyphenate-after", "hyphenate-before", "hyphenate-character", "hyphenate-lines", "hyphenate-resource", "hyphens", "icon", "image-orientation", "image-rendering", "image-resolution", "inline-box-align", "left", "letter-spacing", "line-height", "line-stacking", "line-stacking-ruby", "line-stacking-shift", "line-stacking-strategy", "list-style", "list-style-image", "list-style-position", "list-style-type", "margin", "margin-bottom", "margin-left", "margin-right", "margin-top", "marker-offset", "marks", "marquee-direction", "marquee-loop", "marquee-play-count", "marquee-speed", "marquee-style", "max-height", "max-width", "min-height", "min-width", "move-to", "nav-down", "nav-index", "nav-left", "nav-right", "nav-up", "opacity", "orphans", "outline", "outline-color", "outline-offset", "outline-style", "outline-width", "overflow", "overflow-style", "overflow-x", "overflow-y", "padding", "padding-bottom", "padding-left", "padding-right", "padding-top", "page", "page-break-after", "page-break-before", "page-break-inside", "page-policy", "pause", "pause-after", "pause-before", "perspective", "perspective-origin", "phonemes", "pitch", "pitch-range", "play-during", "position", "presentation-level", "punctuation-trim", "quotes", "rendering-intent", "resize", "rest", "rest-after", "rest-before", "richness", "right", "rotation", "rotation-point", "ruby-align", "ruby-overhang", "ruby-position", "ruby-span", "size", "speak", "speak-header", "speak-numeral", "speak-punctuation", "speech-rate", "stress", "string-set", "table-layout", "target", "target-name", "target-new", "target-position", "text-align", "text-align-last", "text-decoration", "text-emphasis", "text-height", "text-indent", "text-justify", "text-outline", "text-shadow", "text-transform", "text-wrap", "top", "transform", "transform-origin", "transform-style", "transition", "transition-delay", "transition-duration", "transition-property", "transition-timing-function", "unicode-bidi", "vertical-align", "visibility", "voice-balance", "voice-duration", "voice-family", "voice-pitch", "voice-pitch-range", "voice-rate", "voice-stress", "voice-volume", "volume", "white-space", "widows", "width", "word-break", "word-spacing", "word-wrap", "z-index"]
    .forEach(addToStyle);

module.exports = Style;
    
function addToStyle(name) {
    Object.defineProperty(Style, name, {
        configurable: true,
        set: function set(value) {
            this.nodes.forEach(setValue);
     
            function setValue(node) {
                node.style[name] = value;   
            }
        }
    });
}
});
M8.define('index','app',function (require, module, exports) {
var By = require("./by.js"),
    ClassList = require("./classlist.js"),
    Style = require("./style.js");

var isSimple = /^\w+$/,
    toArray = [].slice.call.bind([].slice);
/*  set {
        classList: manipulates classes in every element in the set
        style: manipulate the CSS style of every element in the set
        parentNode, parentElement, previousSibling, etc: all return new sets of the collective operation
        normalize: normalizes all elements
        cloneNode: returns a set of clones of all elements
        getElementsByX, querySelector, querySelectorAll: returns a new set of the result applied to all nodes
        forEach, map, filter, reduce, etc: run the array methods on the nodes property
    }
*/
var NodeComposite = Object.create(Array.prototype);

NodeComposite.$ = $;
NodeComposite.add = add;
NodeComposite.constructor = add;

Object.defineProperties(NodeComposite, {
    classList: {
        get: function getClassList() {
            return Object.create(ClassList).constructor(this);
        },
        configurable: true
    },
    style: {
        get: function getStyle() {
            return Object.create(Style).constructor(this);
        },
        configurable: true
    }
});

[
    "parentElement", 
    "parentNode",
    "childNodes",
    "firstChild",
    "lastChild",
    "previousSibling",
    "nextSibling",
    "children",
    "firstElementChild",
    "lastElementChild",
    "previousElementSibling",
    "nextElementSibling"
].forEach(addGetterToNodeComposite);

[
    "cloneNode",
    "getElementsByTagName",
    "getElementsByTagNameNS",
    "getElementsByClassName",
    "querySelector",
    "querySelectorAll"
].forEach(addReturningOperationToNodeComposite);

[
    "addEventListener",
    "normalize"
].forEach(addOperationToNodeComposite);

window.NodeComposite = module.exports = NodeComposite;

function $(selector) {
    var substr = selector.substring(1),
        set = Object.create(NodeComposite);

    if (!isSimple.test(substr)) {
        return set.constructor(document.querySelectorAll(selector));
    } else if (selector[0] === "#") {
        return set.constructor(document.getElementById(substr));
    } else if (selector[0] === ".") {
        return set.constructor(document.getElementsByClassName(substr));    
    } else {
        return set.constructor(document.getElementsByTagName(selector));    
    }
}

function add() {
    for (var i = 0, len = arguments.length; i < len; i++) {
        var val = arguments[i];
        if (val.length !== undefined) {
            this.push.apply(this, toArray(val));
        } else if (val !== null) {
            console.log("pushing", val)
            this.push.call(this, val);       
        }
    }
    return this;
}

function addGetterToNodeComposite(name) {
    Object.defineProperty(NodeComposite, name, {
        get: function getName() {
            return Object.create(NodeComposite).constructor(this.map(toName));

            function toName(el) {
                return el[name];
            }
        },
        configurable: true
    });
}

function addReturningOperationToNodeComposite(name) {
    NodeComposite[name] = operateOnNodeComposite;

    function operateOnNodeComposite() {
        var args = arguments;
        return this.map(byOperation);

        function byOperation(el) {
            return el[name].apply(el, args);
        }
    }
}

function addOperationToNodeComposite(name) {
    NodeComposite[name] = operateOnNodeComposite;

    function operateOnNodeComposite(name) {
        var args = arguments;
        this.forEach(doOperation);

        function normalizeNode(el) {
            el[name].apply(el, args);
        }
    }
}
});
}());
}());