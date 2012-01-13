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
var NodeSet = Object.create(Array.prototype

NodeSet.$ = $;
NodeSet.add = add;
NodeSet.constructor = add;
NodeSet.normalize = normalize;

Object.defineProperties(NodeSet, {
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
].forEach(addGetterToNodeSet);

[
    "cloneNode",
    "getElementsByTagName",
    "getElementsByTagNameNS",
    "getElementsByClassName",
    "querySelector",
    "querySelectorAll"
].forEach(addOperationToNodeSet)

module.exports = NodeSet;

function $(selector) {
    var substr = selector.substring(1);
    if (!isSimple.test(substr)) {
        return Set.beget(document.querySelectorAll(selector));
    } else if (selector[0] === "#") {
        return Set.beget(By.id(substr);
    } else if (selector[0] === ".") {
        return Set.beget(By.class(substr));    
    } else {
        return Set.beget(By.tag(selector));    
    }
}

function add() {
    for (var i = 0, len = arguments.length; i < len; i++) {
        var val = arguments[i];
        if (val.length) {
            this.push.apply(this, val);
        } else {
            this.push.call(this, val);       
        }
    }
    return this;
}

function normalize(name) {
    var args = arguments;
    this.forEach(normalizeNode);

    function normalizeNode(el) {
        el.normalize();
    }
}

function addGetterToNodeSet(name) {
    Object.defineProperty(NodeSet, name, {
        get: function getName() {
            return Object.create(NodeSet).constructor(this.map(toName));

            function toName(el) {
                return el[name];
            }
        },
        configurable: true
    })
}

function addOperationToNodeSet(name) {
    NodeSet[name] = operateOnNodeSet;

    function operateOnNodeSet() {
        var args = arguments;
        return this.map(byOperation);

        function byOperation(el) {
            return el[name].apply(el, args);
        }
    }
}