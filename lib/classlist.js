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
    
function addToClassList(name) {
    ClassList[name] = function proxy() {
        var args = arguments;
        this.classLists.forEach(applyMethod);
   
        function applyMethod(classList) {
            classList[name].apply(classList, args);
        } 
    };
}