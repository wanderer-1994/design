(($) => {

    $.fn.draggable = function () {
        this.each(function () {
            let target = this;
            $(target).on("mousedown.draggable", function (e) {
                target.x_distance = target.offsetLeft - e.clientX;
                target.y_distance = target.offsetTop - e.clientY;
                dragMouseDown(e, target);
            })
        })
    }

    function dragMouseDown(e, target) {
        e = e || window.event;
        e.preventDefault();
        // disable transition
        let transition = $(target).css("transition");
        $(target).css("transition", "all 0s");
        // get the mouse cursor position at startup:
        $(target).on("mouseup.draggable", () => {
            closeDragElement(target, transition)
        });
        $(target).on("mouseleave.draggable", () => {
            closeDragElement(target, transition)
        });
        // call a function whenever the cursor moves:
        $(target).on("mousemove.draggable", (e) => {
            elementDrag(e, target);
        });
    }

    function closeDragElement(target, transition) {
        $(target).off("mouseup.draggable");
        $(target).off("mousemove.draggable");
        $(target).off("mouseleave.draggable");
        $(target).css("transition", transition);
    }

    function elementDrag(e, target) {
        e = e || window.event;
        e.preventDefault();
        let top = e.clientY + target.y_distance;
        let left = e.clientX + target.y_distance;
        $(target).css("top", `${top}px`);
        $(target).css("left", `${left}px`);
    }

})(jQuery);

(($) => {

    $.fn.onClickTimeOut = function (cb) {
        this.each(function () {
            let target = this;
            $(target).on("mousedown.onClickTimeOut", function (e) {
                let time_stamp1 = new Date();
                $(target).on("mouseup.onClickTimeOut", function () {
                    let time_stamp2 = new Date();
                    e.onClickTimeOut = time_stamp2 - time_stamp1;
                    removeListeners(target);
                    cb(e);
                })
                $(target).on("mouseleave.onClickTimeOut", function () {
                    removeListeners(target);
                })
            })
        })
    }

    function removeListeners (target) {
        $(target).off("mouseup.onClickTimeOut");
        $(target).off("mouseleave.onClickTimeOut");
    }

})(jQuery);

(($) => {

    $.fn.onClickNonDrag = function ({allowX, allowY}, cb) {
        this.each(function () {
            let target = this;
            if (typeof arguments[0] == "function") {
                cb = arguments[0];
            }
            allowX = allowX || 0;
            allowY = allowY || 0;
            $(target).on("mousedown.onClickNonDrag", function (e1) {
                $(target).on("mouseup.onClickNonDrag", function (e2) {
                    removeListeners(target);
                    if (
                        Math.abs(e1.clientX - e2.clientX) <= allowX &&
                        Math.abs(e1.clientY - e2.clientY) <= allowY
                    ) {
                        cb(e1);
                    }
                })
                $(target).on("mouseleave.onClickNonDrag", function () {
                    removeListeners(target);
                })
            })
        })
    }

    function removeListeners (target) {
        $(target).off("mouseup.onClickNonDrag");
        $(target).off("mouseleave.onClickNonDrag");
    }

})(jQuery);