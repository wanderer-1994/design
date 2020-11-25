(($) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    function closeDragElement(e) {
        $(e.target).off("mouseup.draggable");
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        $(e).css("top", `${e.offsetTop - pos2}px`);
        $(e).css("top", `${e.offsetLeft - pos1}px`);
    }

    $.fn.draggable = function () {
        this.each(function () {
            console.log($(this).attr("class"))
            let _self = this;
            $(this).on("mousedown.draggable", function (_self) {
                let e = _self;
                console.log($(e.target))
                e = e || window.event;
                e.preventDefault();
                // get the mouse cursor position at startup:
                pos3 = e.clientX;
                pos4 = e.clientY;
                $(e.target).on("mouseup.draggable", closeDragElement);
                // call a function whenever the cursor moves:
                $(e.target).on("mousemove.draggable", elementDrag);
            })
        })
    }
})(jQuery)

$(document).ready(() => {
    $(".nav-bar .menu-icon").on("click.menu-icon", (event) => {
        let $navBar = $(event.target).parents(".nav-bar").eq(0);
        if ($navBar.hasClass("open")) {
            $navBar.removeClass("open");
            $("body").css("overflow", "");
        } else {
            $navBar.addClass("open");
            $("body").css("overflow", "hidden");
        }
    });
    $(".nav-bar").draggable();
})