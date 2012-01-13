# NodeSet

Allowing you to operate on nodeLists as if they are a single node.

## Example

    var $ = NodeSet.$;

    var foos = $(".foo");

    // set style on all foos
    foos.style.color = 'red';
    // set classes on all foos
    foos.classList.add('bar');
    // map the set of all foo elements to the set of all their parents
    var parents = foos.parentNode;
    // manipulate foos like an array
    foos.reduce(function (memo, el) {
        return memo + el.value;
    }, 0);
    // map the set of all foos to the set of .bar's in foo
    var bars = foos.getElementsByClassName('bar');
    // add an event listener to all elements of foo
    foos.addEventListener('click', function () {
        ...
    });