(($) => {

    $.fn.draggable = function ({ limitTop, limitBottom, limitLeft, limitRight }, f_dragWhen) {
        this.each(function () {
            let target = this;
            $(window).on("resize.draggable", function (e) {
                let coordinates = new Object();
                coordinates.top = target.offsetTop;
                coordinates.left = target.offsetLeft;
                coordinates = recalculateCoordinates(coordinates, { limitTop, limitBottom, limitLeft, limitRight });
                $(target).css("top", `${coordinates.top}px`);
                $(target).css("left", `${coordinates.left}px`);
            })
            // For Mobile - ontouchmove event handles all
            $(target).on("touchstart.draggable", function (e) {
                e.preventDefault();
                let transition = $(target).css("transition");
                $(target).data("transition", transition);
            });
            $(target).on("touchend.draggable", function (e) {
                let transition = $(target).data().transition;
                $(target).css("transition", transition);
                $(target).data("transition", "");
            });
            $(target).on("touchmove.draggable", function (e) {
                e.preventDefault();
                if(typeof(f_dragWhen) == "function" && !f_dragWhen()) {
                    return;
                }
                $(target).css("transition", "all 0s");
                let coordinates = new Object();
                coordinates.top = e.touches[0].clientY - 30;
                coordinates.left = e.touches[0].clientX - 30;
                coordinates = recalculateCoordinates(coordinates, { limitTop, limitBottom, limitLeft, limitRight });
                $(target).css("top", `${coordinates.top}px`);
                $(target).css("left", `${coordinates.left}px`);
            })
            // For Web - has no ondrag event or something like that
            $(target).on("mousedown.draggable", function (e) {
                if(typeof(f_dragWhen) == "function" && !f_dragWhen()) {
                    return;
                }
                let x_distance = target.offsetLeft - e.clientX;
                let y_distance = target.offsetTop - e.clientY;
                e = e || window.event;
                e.preventDefault();
                // disable transition
                let transition = $(target).css("transition");
                $(target).css("transition", "all 0s");
                // get the mouse cursor position at startup:
                $(document).on("mouseup.draggable", () => {
                    closeDragElement(target)
                    $(target).css("transition", transition);
                });
                // call a function whenever the cursor moves:
                $(document).on("mousemove.draggable", (e2) => {
                    e2 = e2 || window.event;
                    e2.preventDefault();
                    let coordinates = new Object();
                    coordinates.top = e2.clientY + y_distance;
                    coordinates.left = e2.clientX + x_distance;
                    coordinates = recalculateCoordinates(coordinates, { limitTop, limitBottom, limitLeft, limitRight });
                    $(target).css("top", `${coordinates.top}px`);
                    $(target).css("left", `${coordinates.left}px`);
                });
            })
        })
    }

    function recalculateCoordinates ({ top, left }, { limitTop, limitBottom, limitLeft, limitRight }) {
        if (typeof(limitTop) == "function") limitTop = limitTop();
        if (typeof(limitBottom) == "function") limitBottom = limitBottom();
        if (typeof(limitLeft) == "function") limitLeft = limitLeft();
        if (typeof(limitRight) == "function") limitRight = limitRight();
        if (typeof(limitTop) == "number") {
            top = Math.max(top, limitTop);
        }
        if (typeof(limitBottom) == "number") {
            top = Math.min(top, limitBottom);
        }
        if (typeof(limitLeft) == "number") {
            left = Math.max(left, limitLeft);
        }
        if (typeof(limitRight) == "number") {
            left = Math.min(left, limitRight);
        }
        return { top, left };
    }

    function closeDragElement(target) {
        $(document).off("mouseup.draggable");
        $(document).off("mousemove.draggable");
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