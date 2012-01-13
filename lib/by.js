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