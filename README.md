# NodeComposite

Allowing you to operate on nodeLists as if they are a single node.

## Example

    // $ is QSA _not_ Sizzle/jQuery
    var $ = NodeComposite.$;

    // foos is a NodeComposite instance and also an Array
    var foos = $(".foo");
    // Note you can pass any NodeList to NodeComposite as well
    // var foos = Object.create(NodeComposite).constructor(
    //     document.getElementsByClassName('foo')
    // );

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

## Build file

`make build`

## run tests

`make test`