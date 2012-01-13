suite("NodeComposite", function () {
    var nodes = "<div class='foo'></div> \
                 <div class='foo'></div> \
                 <div class='foo'></div>";

    var testBody = document.getElementById("testbody"),
        $ = NodeComposite.$;

    setup(function () {
        var fragment = Fragment(nodes);
        testBody.appendChild(fragment);
    });

    teardown(function () {
        testBody.textContent = "";
    });

    suite("classList", function () {
        test("classList add works", function () {
            $(".foo").classList.add("bar");
            assert($(".bar").length === 3, 
               "not enough bar nodes");
        });

        test("classList remove works", function () {
            $(".foo").classList.add("bar");
            $(".foo").classList.remove("bar");
            assert($(".bar").length === 0,
                "too many bar nodes");
        });

        test("classList toggle works", function () {
            $(".foo").classList.toggle("bar");
            assert($(".bar").length === 3, 
               "not enough bar nodes"); 
            $(".foo").classList.toggle("bar");
            assert($(".bar").length === 0,
                "too many bar nodes"); 
        });
    });

    suite("style", function () {
        test("style works", function () {
            $(".foo").style.color = 'red';
            $(".foo").forEach(function (el) {
                assert(el.style.color === 'red',
                    "style was not set properly");
            });
        });
    });

    suite("Array", function () {
        test("NodeComposite can be an array", function () {
            var foos = $(".foo");
            assert(foos.length, "does not have length");
            assert(foos.forEach, "does not have forEach");
            assert(foos.map, "does not have map");
        });
    });

    function Fragment(html) {
        var div = document.createElement("div"),
            fragment = document.createDocumentFragment();

        div.innerHTML = html;
        while (div.hasChildNodes()) fragment.appendChild(div.firstChild);
        return fragment;
    }
});