var ClassList = require("./classlist.js"),
    Style = require("./style.js");

var isSimple = /^[#.]?\w+$/,
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
NodeComposite.make = make;

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
    "removeEventListener",
    "normalize"
].forEach(addOperationToNodeComposite);

[
    "appendChild",
    "replaceChild",
    "removeChild",
    "insertBefore"
].forEach(addBatchOperationToNodeComposite);

module.exports = NodeComposite;

function make(nodes) {
    return Object.create(NodeComposite).add(nodes);
}

function $(selector) {
    return make(document.querySelectorAll(selector));
}

function add() {
    for (var i = 0, len = arguments.length; i < len; i++) {
        var val = arguments[i];
        if (val.length !== undefined) {
            this.add.apply(this, toArray(val));
        } else if (val !== null) {
            this.push(val);       
        }
    }
    return this;
}

function addGetterToNodeComposite(name) {
    Object.defineProperty(NodeComposite, name, {
        get: function getName() {
            return make(this.map(toName));

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
        return make(this.map(byOperation));

        function byOperation(el) {
            return el[name].apply(el, args);
        }
    }
}

function addOperationToNodeComposite(name) {
    NodeComposite[name] = operateOnNodeComposite;

    function operateOnNodeComposite() {
        var args = arguments;
        this.forEach(doOperation);

        function doOperation(el) {
            el[name].apply(el, args);
        }
    }
}

function addBatchOperationToNodeComposite(name) {
    NodeComposite[name] = batchOperateOnNodeComposite;

    function batchOperateOnNodeComposite(node, child) {
        var args = [].slice.call(arguments);
        this.forEach(batchOperate);
        return child || node;

        function batchOperate(element, index) {
            element[name].apply(element, args.map(getIndex(index)));
        }
    }

    function getIndex(index) {
        return getIndex;

        function getIndex(element) {
            return element[index];
        }
    }
}

function addArrayMethodToNodeComposite(name) {
    NodeComposite[name] = arrayMethod;

    function arrayMethod() {
        var arr = Array.prototype[name].apply(this, arguments);
        return Object.create(NodeComposite).constructor(arr);
    }
}